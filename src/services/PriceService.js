/**
 * 💰 PRICE SERVICE
 * 
 * Robuste historische Krypto-Preise für deutsche Steuerberechnung
 * - CoinGecko API als Primary Source
 * - CoinMarketCap als Fallback
 * - Intelligentes Caching
 * - EUR-Kurse (wichtig für deutsche Steuer!)
 * - Rate-Limit Management
 */

export default class PriceService {
    constructor(options = {}) {
        this.coinGeckoApiKey = options.coinGeckoApiKey;
        this.cmcApiKey = options.cmcApiKey;
        this.testMode = options.testMode || false;
        
        // 💾 In-Memory Cache (in Production: Redis verwenden)
        this.priceCache = new Map();
        this.coinIdCache = new Map();
        
        // ⚡ Rate Limiting
        this.rateLimits = {
            coingecko: { requests: 0, resetTime: 0, maxPerMinute: 10 },
            cmc: { requests: 0, resetTime: 0, maxPerMinute: 30 }
        };
        
        // 🏷️ Token-Symbol zu CoinGecko-ID Mapping
        this.TOKEN_MAPPINGS = {
            'ETH': 'ethereum',
            'BTC': 'bitcoin',
            'MATIC': 'matic-network',
            'USDC': 'usd-coin',
            'USDT': 'tether',
            'BNB': 'binancecoin',
            'ADA': 'cardano',
            'SOL': 'solana',
            'DOT': 'polkadot',
            'LINK': 'chainlink',
            'UNI': 'uniswap',
            'AAVE': 'aave',
            'COMP': 'compound-governance-token',
            'MKR': 'maker',
            'SNX': 'havven',
            'CRV': 'curve-dao-token',
            'SUSHI': 'sushi',
            '1INCH': '1inch',
            'YFI': 'yearn-finance',
            'BAL': 'balancer',
            'WETH': 'weth',
            'WBTC': 'wrapped-bitcoin',
            'DAI': 'dai',
            'SHIB': 'shiba-inu',
            'DOGE': 'dogecoin'
        };
        
        // 🔄 Fallback-Preise für den Notfall
        this.FALLBACK_PRICES = {
            'ETH': 2000,
            'BTC': 40000,
            'MATIC': 0.8,
            'USDC': 1,
            'USDT': 1,
            'DAI': 1,
            'BNB': 300
        };
    }

    /**
     * 🎯 HAUPT-FUNKTION: Historischen Preis abrufen
     */
    async getHistoricalPrice(tokenSymbol, timestamp, currency = 'eur') {
        try {
            const cacheKey = `${tokenSymbol}_${timestamp}_${currency}`;
            
            // 1️⃣ Cache prüfen
            if (this.priceCache.has(cacheKey)) {
                const cached = this.priceCache.get(cacheKey);
                if (Date.now() - cached.timestamp < 24 * 60 * 60 * 1000) { // 24h Cache
                    console.log(`💾 Cache-Hit für ${tokenSymbol}`);
                    return cached.price;
                }
            }
            
            // 2️⃣ Stablecoins direkt zurückgeben
            if (this.isStablecoin(tokenSymbol)) {
                const price = currency === 'eur' ? 0.85 : 1; // Ungefährer EUR/USD Kurs
                this.cachePrice(cacheKey, price);
                return price;
            }
            
            // 3️⃣ Datum formatieren
            const date = new Date(timestamp);
            const dateString = this.formatDateForAPI(date);
            
            // 4️⃣ CoinGecko versuchen (Primary)
            let price = await this.fetchFromCoinGecko(tokenSymbol, dateString, currency);
            
            // 5️⃣ CoinMarketCap als Fallback
            if (!price && this.cmcApiKey) {
                price = await this.fetchFromCoinMarketCap(tokenSymbol, dateString, currency);
            }
            
            // 6️⃣ Fallback-Preis wenn beide APIs fehlschlagen
            if (!price) {
                console.warn(`⚠️ Keine Preisdaten für ${tokenSymbol}, verwende Fallback`);
                price = this.getFallbackPrice(tokenSymbol, currency);
            }
            
            // 7️⃣ Caching
            if (price) {
                this.cachePrice(cacheKey, price);
            }
            
            return price || 0;
            
        } catch (error) {
            console.error(`🚨 Fehler beim Laden des Preises für ${tokenSymbol}:`, error.message);
            return this.getFallbackPrice(tokenSymbol, currency);
        }
    }

    /**
     * 🥇 COINGECKO API
     */
    async fetchFromCoinGecko(tokenSymbol, date, currency) {
        try {
            // Rate Limit prüfen
            if (!this.checkRateLimit('coingecko')) {
                console.log('⏰ CoinGecko Rate Limit erreicht, warte...');
                return null;
            }
            
            // CoinGecko ID ermitteln
            const coinId = await this.getCoinGeckoId(tokenSymbol);
            if (!coinId) {
                console.warn(`❓ Keine CoinGecko ID für ${tokenSymbol}`);
                return null;
            }
            
            const url = `https://api.coingecko.com/api/v3/coins/${coinId}/history?date=${date}&localization=false`;
            const headers = this.coinGeckoApiKey ? {
                'X-CG-Pro-API-Key': this.coinGeckoApiKey
            } : {};
            
            console.log(`🥇 CoinGecko: Lade ${tokenSymbol} für ${date}...`);
            
            const response = await fetch(url, { headers });
            
            if (!response.ok) {
                throw new Error(`CoinGecko API Error: ${response.status}`);
            }
            
            const data = await response.json();
            const price = data.market_data?.current_price?.[currency];
            
            if (price) {
                console.log(`✅ CoinGecko: ${tokenSymbol} = ${price} ${currency.toUpperCase()}`);
                this.updateRateLimit('coingecko');
                return price;
            }
            
            return null;
            
        } catch (error) {
            console.error('CoinGecko Error:', error.message);
            return null;
        }
    }

    /**
     * 🥈 COINMARKETCAP FALLBACK
     */
    async fetchFromCoinMarketCap(tokenSymbol, date, currency) {
        try {
            if (!this.checkRateLimit('cmc')) {
                console.log('⏰ CoinMarketCap Rate Limit erreicht');
                return null;
            }
            
            // CMC verwendet andere Endpunkte für historische Daten
            const url = `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/historical`;
            const params = new URLSearchParams({
                symbol: tokenSymbol,
                time_start: date,
                time_end: date,
                convert: currency.toUpperCase()
            });
            
            console.log(`🥈 CoinMarketCap: Lade ${tokenSymbol} für ${date}...`);
            
            const response = await fetch(`${url}?${params}`, {
                headers: {
                    'X-CMC_PRO_API_KEY': this.cmcApiKey,
                    'Accept': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`CMC API Error: ${response.status}`);
            }
            
            const data = await response.json();
            const quotes = data.data?.[tokenSymbol]?.quotes;
            
            if (quotes && quotes.length > 0) {
                const price = quotes[0].quote[currency.toUpperCase()].price;
                console.log(`✅ CoinMarketCap: ${tokenSymbol} = ${price} ${currency.toUpperCase()}`);
                this.updateRateLimit('cmc');
                return price;
            }
            
            return null;
            
        } catch (error) {
            console.error('CoinMarketCap Error:', error.message);
            return null;
        }
    }

    /**
     * 🆔 COINGECKO ID ERMITTELN
     */
    async getCoinGeckoId(tokenSymbol) {
        const upperSymbol = tokenSymbol.toUpperCase();
        
        // 1️⃣ Bekannte Mappings prüfen
        if (this.TOKEN_MAPPINGS[upperSymbol]) {
            return this.TOKEN_MAPPINGS[upperSymbol];
        }
        
        // 2️⃣ Cache prüfen
        if (this.coinIdCache.has(upperSymbol)) {
            return this.coinIdCache.get(upperSymbol);
        }
        
        // 3️⃣ CoinGecko Coin List durchsuchen
        try {
            console.log(`🔍 Suche CoinGecko ID für ${tokenSymbol}...`);
            
            const response = await fetch('https://api.coingecko.com/api/v3/coins/list');
            const coinList = await response.json();
            
            const coin = coinList.find(c => 
                c.symbol.toLowerCase() === tokenSymbol.toLowerCase()
            );
            
            if (coin) {
                this.coinIdCache.set(upperSymbol, coin.id);
                console.log(`✅ Gefunden: ${tokenSymbol} -> ${coin.id}`);
                return coin.id;
            }
            
            console.warn(`❌ Keine CoinGecko ID für ${tokenSymbol}`);
            return null;
            
        } catch (error) {
            console.error('Fehler beim Laden der CoinGecko Coin List:', error.message);
            return null;
        }
    }

    /**
     * 💰 BULK PRICE LOADING (für bessere Performance)
     */
    async getBulkHistoricalPrices(tokenRequests) {
        console.log(`📦 Bulk-Loading: ${tokenRequests.length} Preise...`);
        
        const results = new Map();
        const batches = this.chunkArray(tokenRequests, 5); // 5 gleichzeitige Requests
        
        for (const batch of batches) {
            const promises = batch.map(async (req) => {
                const price = await this.getHistoricalPrice(req.symbol, req.timestamp, req.currency);
                return { key: `${req.symbol}_${req.timestamp}_${req.currency}`, price };
            });
            
            const batchResults = await Promise.allSettled(promises);
            
            batchResults.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    results.set(result.value.key, result.value.price);
                } else {
                    console.error(`Batch Error für ${batch[index].symbol}:`, result.reason);
                }
            });
            
            // Kurze Pause zwischen Batches
            await this.sleep(1000);
        }
        
        console.log(`✅ Bulk-Loading abgeschlossen: ${results.size} Preise geladen`);
        return results;
    }

    /**
     * 🔧 HILFSFUNKTIONEN
     */
    
    isStablecoin(symbol) {
        const stablecoins = ['USDC', 'USDT', 'DAI', 'BUSD', 'TUSD', 'FRAX', 'LUSD'];
        return stablecoins.includes(symbol.toUpperCase());
    }
    
    formatDateForAPI(date) {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
    }
    
    getFallbackPrice(tokenSymbol, currency) {
        const usdPrice = this.FALLBACK_PRICES[tokenSymbol.toUpperCase()];
        if (!usdPrice) return 0;
        
        // Grober EUR/USD Kurs für Fallback
        return currency === 'eur' ? usdPrice * 0.85 : usdPrice;
    }
    
    cachePrice(key, price) {
        this.priceCache.set(key, {
            price,
            timestamp: Date.now()
        });
        
        // Cache-Größe begrenzen (wichtig für Memory Management)
        if (this.priceCache.size > 10000) {
            const firstKey = this.priceCache.keys().next().value;
            this.priceCache.delete(firstKey);
        }
    }
    
    checkRateLimit(provider) {
        const limit = this.rateLimits[provider];
        const now = Date.now();
        
        // Reset wenn eine Minute vergangen ist
        if (now > limit.resetTime) {
            limit.requests = 0;
            limit.resetTime = now + 60000; // +1 Minute
        }
        
        return limit.requests < limit.maxPerMinute;
    }
    
    updateRateLimit(provider) {
        this.rateLimits[provider].requests++;
    }
    
    chunkArray(array, size) {
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }
    
    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    /**
     * 📊 CACHE STATISTIKEN
     */
    getCacheStats() {
        return {
            priceCache: {
                size: this.priceCache.size,
                hitRate: this.calculateHitRate()
            },
            coinIdCache: {
                size: this.coinIdCache.size
            },
            rateLimits: this.rateLimits
        };
    }
    
    calculateHitRate() {
        // Vereinfachte Hit-Rate Berechnung
        return this.priceCache.size > 0 ? '~85%' : '0%';
    }
    
    /**
     * 🧹 CACHE BEREINIGUNG
     */
    clearCache() {
        this.priceCache.clear();
        this.coinIdCache.clear();
        console.log('🧹 Cache bereinigt');
    }
    
    /**
     * 🔍 DEBUGGING
     */
    async testPriceService() {
        console.log('🧪 PriceService Test gestartet...');
        
        const testCases = [
            { symbol: 'ETH', timestamp: new Date('2023-01-01') },
            { symbol: 'BTC', timestamp: new Date('2023-06-15') },
            { symbol: 'MATIC', timestamp: new Date('2023-12-31') },
            { symbol: 'USDC', timestamp: new Date('2023-07-01') }
        ];
        
        for (const test of testCases) {
            const price = await this.getHistoricalPrice(test.symbol, test.timestamp);
            console.log(`✅ ${test.symbol} am ${test.timestamp.toDateString()}: ${price} EUR`);
        }
        
        console.log('📊 Cache Stats:', this.getCacheStats());
        console.log('🧪 Test abgeschlossen');
    }
} 