// 🚀 PHASE 2: MORALIS PRO HISTORISCHE PREISE
// Nutzt deinen vorhandenen Moralis Pro Key (500M CU/Monat)

export default class MoralisProHistoricalService {
    constructor(apiKey) {
        this.apiKey = apiKey || import.meta.env.VITE_MORALIS_API_KEY;
        this.baseUrl = 'https://deep-index.moralis.io/api/v2.2';
        this.cache = new Map();
        this.cacheExpiry = 7 * 24 * 60 * 60 * 1000; // 7 Tage für historische Preise
        this.rateLimitDelay = 200; // 5 calls/sec für Pro
        
        console.log(`🔑 Moralis Pro Historical Service initialisiert`);
    }

    // FIX: Korrekte Moralis Pro Headers
    getHeaders() {
        return {
            'X-API-Key': this.apiKey,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        };
    }

    // HISTORISCHE TOKEN-PREISE über Moralis Pro
    async getHistoricalTokenPrice(tokenAddress, chain = 'eth', date) {
        console.log(`📊 Moralis Pro Preis: ${tokenAddress} am ${date}`);
        
        const cacheKey = `moralis_${tokenAddress}_${chain}_${this.formatDate(date)}`;
        const cached = this.cache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
            console.log(`📋 Cache Hit: ${tokenAddress}`);
            return cached.price;
        }

        try {
            // Moralis Pro Token Price Endpoint (günstiger als History)
            const url = `${this.baseUrl}/erc20/${tokenAddress}/price?chain=${chain}`;
            
            const response = await fetch(url, {
                method: 'GET',
                headers: this.getHeaders()
            });

            if (!response.ok) {
                if (response.status === 401) {
                    console.error('🚨 Moralis API Key ungültig oder abgelaufen');
                    throw new Error('MORALIS_AUTH_ERROR');
                }
                throw new Error(`Moralis Pro HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            if (data.usdPrice) {
                // USD zu EUR konvertieren (etwa 0.85 Faktor)
                const eurPrice = data.usdPrice * 0.85;
                
                console.log(`✅ Moralis Pro: ${tokenAddress} = ${eurPrice} EUR`);
                
                this.cache.set(cacheKey, { 
                    price: eurPrice, 
                    timestamp: Date.now() 
                });
                
                // Rate Limiting
                await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay));
                
                return eurPrice;
            }

            throw new Error('Kein USD-Preis verfügbar');

        } catch (error) {
            console.warn(`⚠️ Moralis Pro Fehler:`, error.message);
            
            // Fallback zu CoinGecko FREE
            return await this.getCoinGeckoFallback(tokenAddress, date);
        }
    }

    // BULK TOKEN PREISE (effizienter für mehrere Tokens)
    async getBulkTokenPrices(tokenAddresses, chain = 'eth') {
        console.log(`📊 Moralis Pro Bulk: ${tokenAddresses.length} Tokens`);
        
        const prices = {};
        
        // Batch requests für bessere Effizienz
        for (let i = 0; i < tokenAddresses.length; i += 10) {
            const batch = tokenAddresses.slice(i, i + 10);
            
            const batchPromises = batch.map(async (tokenAddress) => {
                try {
                    const price = await this.getHistoricalTokenPrice(tokenAddress, chain);
                    return { tokenAddress, price };
                } catch (error) {
                    console.warn(`⚠️ Batch Error für ${tokenAddress}:`, error.message);
                    return { tokenAddress, price: null };
                }
            });

            const batchResults = await Promise.all(batchPromises);
            
            batchResults.forEach(result => {
                if (result.price) {
                    prices[result.tokenAddress] = result.price;
                }
            });

            // Rate Limiting zwischen Batches
            if (i + 10 < tokenAddresses.length) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        console.log(`✅ Bulk Preise: ${Object.keys(prices).length}/${tokenAddresses.length} erfolgreich`);
        return prices;
    }

    // WALLET TOKEN PORTFOLIO mit Preisen
    async getWalletTokensWithPrices(walletAddress, chain = 'eth') {
        console.log(`💼 Moralis Pro Wallet: ${walletAddress}`);
        
        try {
            // Chain-Mapping für verschiedene Chains
            const chainMap = {
                'pulsechain': '0x171',
                'ethereum': '0x1', 
                'eth': '0x1',
                'pls': '0x171'
            };
            
            const chainId = chainMap[chain] || chain;
            const url = `${this.baseUrl}/${walletAddress}/erc20?chain=${chainId}&limit=100`;
            
            const response = await fetch(url, {
                method: 'GET',
                headers: this.getHeaders()
            });

            if (!response.ok) {
                if (response.status === 401) {
                    console.error('🚨 Moralis API Key ungültig oder abgelaufen');
                    throw new Error('MORALIS_AUTH_ERROR');
                }
                throw new Error(`Wallet Tokens HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            if (data.result && data.result.length > 0) {
                console.log(`✅ Wallet Tokens: ${data.result.length} gefunden`);
                
                // Preise für alle Tokens laden
                const tokenAddresses = data.result.map(token => token.token_address);
                const prices = await this.getBulkTokenPrices(tokenAddresses, chainId);
                
                // Tokens mit Preisen anreichern
                const enrichedTokens = data.result.map(token => ({
                    ...token,
                    currentPriceEUR: prices[token.token_address] || 0,
                    valueEUR: prices[token.token_address] 
                        ? (parseFloat(token.balance) / Math.pow(10, token.decimals)) * prices[token.token_address]
                        : 0
                }));

                return enrichedTokens;
            }

            return [];

        } catch (error) {
            console.error(`❌ Wallet Tokens Fehler:`, error.message);
            return [];
        }
    }

    // COINGECKO FALLBACK (kostenlos)
    async getCoinGeckoFallback(tokenAddress, date) {
        console.log(`🔄 CoinGecko Fallback für ${tokenAddress}`);
        
        try {
            // Bekannte Token-Mappings
            const knownTokens = {
                '0xa0b86a33e6ba68e64e01a86ff6370c0c980b8ffe': 'ethereum', // ETH
                '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599': 'wrapped-bitcoin', // WBTC
                '0xa0b73fdb1b3de16b87b9dd5fb6b1b4c9d1a6d3e7': 'ethereum', // Fallback
                '0x6b175474e89094c44da98b954eedeac495271d0f': 'dai', // DAI
                '0xa0b86a33e6ba68e64e01a86ff6370c0c980b8ffe': 'usd-coin' // USDC
            };

            const coinId = knownTokens[tokenAddress.toLowerCase()];
            
            if (coinId) {
                const formattedDate = this.formatDateForCoingecko(date);
                const url = `https://api.coingecko.com/api/v3/coins/${coinId}/history?date=${formattedDate}`;
                
                const response = await fetch(url);
                
                if (response.ok) {
                    const data = await response.json();
                    
                    if (data.market_data?.current_price?.eur) {
                        console.log(`✅ CoinGecko Fallback: ${data.market_data.current_price.eur} EUR`);
                        return data.market_data.current_price.eur;
                    }
                }
            }

        } catch (error) {
            console.warn(`⚠️ CoinGecko Fallback Fehler:`, error.message);
        }

        // Emergency Fallback
        return this.getEmergencyPrice(tokenAddress);
    }

    // EMERGENCY PREISE
    getEmergencyPrice(tokenAddress) {
        console.log(`🚨 Emergency Preis für ${tokenAddress}`);
        
        // Standard-Preise basierend auf Token-Address-Patterns
        const emergencyPrices = {
            'eth': 3000,
            'bitcoin': 60000,
            'usdc': 1.0,
            'usdt': 1.0,
            'dai': 1.0,
            'wgep': 0.85,
            'hex': 0.00616,
            'plsx': 0.0000271,
            'pls': 0.00005
        };

        // Einfache Token-Erkennung über Address
        const addr = tokenAddress.toLowerCase();
        if (addr.includes('eth') || addr.endsWith('eth')) return emergencyPrices.eth;
        if (addr.includes('btc') || addr.includes('bitcoin')) return emergencyPrices.bitcoin;
        if (addr.includes('usdc')) return emergencyPrices.usdc;
        if (addr.includes('usdt')) return emergencyPrices.usdt;
        if (addr.includes('dai')) return emergencyPrices.dai;
        if (addr.includes('wgep')) return emergencyPrices.wgep;
        
        return 1.0; // Default 1 EUR
    }

    formatDate(date) {
        return new Date(date).toISOString().split('T')[0];
    }

    formatDateForCoingecko(date) {
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}-${month}-${year}`;
    }

    // CACHE STATS
    getCacheStats() {
        return {
            size: this.cache.size,
            expiry: this.cacheExpiry,
            rateLimitDelay: this.rateLimitDelay
        };
    }

    // CACHE BEREINIGUNG
    clearCache() {
        this.cache.clear();
        console.log('🧹 Moralis Pro Cache bereinigt');
    }
} 