/**
 * MoralisAPIService.js
 * 
 * Enhanced Moralis API Service für PulseManager Tax System
 * Features: Rate Limiting, Pagination, DEX Detection, Price Caching
 * 
 * @author PulseManager Tax Team
 * @version 1.0.0
 * @since 2024-06-14
 */

const axios = require('axios');
const NodeCache = require('node-cache');

class MoralisAPIService {
    constructor(options = {}) {
        this.apiKey = options.apiKey || process.env.MORALIS_API_KEY;
        this.baseURL = 'https://deep-index.moralis.io/api/v2.2';
        this.rateLimitDelay = options.rateLimitDelay || 200; // 5 req/sec für Enterprise
        this.maxRetries = options.maxRetries || 3;
        this.timeout = options.timeout || 30000;
        
        // Caching für Performance
        this.cache = new NodeCache({ 
            stdTTL: 3600, // 1 Stunde Standard TTL
            checkperiod: 120 // Check alle 2 Minuten
        });
        
        // Request Statistics
        this.stats = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            cacheHits: 0,
            rateLimitHits: 0
        };

        // DEX Contract Addresses
        this.dexContracts = {
            // Ethereum Mainnet
            '0x7a250d5630b4cf539739df2c5dacb4c659f2488d': 'Uniswap V2',
            '0xe592427a0aece92de3edee1f18e0157c05861564': 'Uniswap V3',
            '0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45': 'Uniswap Universal Router',
            '0x111111125421ca6dc452d289314280a0f8842a65': '1inch V5',
            '0x1111111254eeb25477b68fb85ed929f73a960582': '1inch V4',
            '0xd9e1ce17f2641f24ae83637ab66a2cca9c378b9f': 'SushiSwap',
            '0x881d40237659c251811cec9c364ef91dc08d300c': 'Metamask Swap',
            '0xdef1c0ded9bec7f1a1670819833240f027b25eff': '0x Protocol',
            
            // PulseChain
            '0x98bf93ebf5c380c0e6ae8e192a7e2ae08edacc95': 'PulseX',
            '0x165c3410fC91EF562C50559f7d2289fEbed552d9': 'PulseX Router',
            
            // Polygon
            '0xa5e0829caced8ffdd4de3c43696c57f7d7a678ff': 'QuickSwap',
            
            // BSC
            '0x10ed43c718714eb63d5aa57b78b54704e256024e': 'PancakeSwap V2'
        };

        // Known ROI Token Patterns (WGEP, MASKMAN, etc.)
        this.roiTokenPatterns = {
            'WGEP': { confidence: 95, category: 'staking' },
            'MASKMAN': { confidence: 90, category: 'staking' },
            'BORK': { confidence: 90, category: 'staking' },
            'PLSX': { confidence: 85, category: 'staking' },
            'HEX': { confidence: 85, category: 'staking' },
            'PULSE': { confidence: 80, category: 'staking' }
        };

        console.log('🔗 Enhanced Moralis API Service initialisiert');
    }

    /**
     * Rate Limited Request mit Retry Logic
     */
    async makeRequest(endpoint, params = {}, retryCount = 0) {
        const cacheKey = `request_${endpoint}_${JSON.stringify(params)}`;
        
        // Cache Check
        const cached = this.cache.get(cacheKey);
        if (cached) {
            this.stats.cacheHits++;
            return cached;
        }

        // Rate Limiting
        await this.sleep(this.rateLimitDelay);
        
        try {
            this.stats.totalRequests++;
            
            const response = await axios.get(`${this.baseURL}${endpoint}`, {
                headers: { 
                    'X-API-Key': this.apiKey,
                    'Accept': 'application/json'
                },
                params: params,
                timeout: this.timeout
            });
            
            this.stats.successfulRequests++;
            
            // Cache successful responses
            this.cache.set(cacheKey, response.data, 1800); // 30 Min für API Responses
            
            return response.data;
            
        } catch (error) {
            this.stats.failedRequests++;
            
            // Retry Logic für Rate Limits und Timeouts
            if (this.shouldRetry(error) && retryCount < this.maxRetries) {
                console.warn(`⚠️ Moralis API Retry ${retryCount + 1}/${this.maxRetries}: ${error.message}`);
                
                if (error.response?.status === 429) {
                    this.stats.rateLimitHits++;
                    await this.sleep(this.rateLimitDelay * (retryCount + 2)); // Exponential backoff
                }
                
                return this.makeRequest(endpoint, params, retryCount + 1);
            }
            
            console.error(`❌ Moralis API Error: ${endpoint}`, {
                status: error.response?.status,
                message: error.message,
                params: params
            });
            
            throw error;
        }
    }

    /**
     * Alle Wallet-Transaktionen mit aggressiver Pagination
     */
    async getAllWalletTransactions(walletAddress, chain = 'eth', options = {}) {
        console.log(`📡 Lade Transaktionen für Wallet: ${walletAddress} (${chain})`);
        
        const maxPages = options.maxPages || 100; // 100 Seiten = 10.000 Transaktionen pro Chain
        const batchSize = options.batchSize || 100;
        
        let allTransactions = [];
        let cursor = null;
        let pageCount = 0;
        
        try {
            do {
                console.log(`📄 Lade Seite ${pageCount + 1}/${maxPages}...`);
                
                const params = {
                    chain: chain,
                    limit: batchSize,
                    ...(cursor && { cursor })
                };

                // Parallel laden: ERC20 Transfers und Native Transactions
                const [tokenTransfers, nativeTransactions] = await Promise.all([
                    this.makeRequest(`/${walletAddress}/erc20`, params),
                    this.makeRequest(`/${walletAddress}`, params)
                ]);

                // Transaktionen kombinieren und markieren
                const combinedPage = [
                    ...tokenTransfers.result.map(tx => ({ 
                        ...tx, 
                        type: 'erc20',
                        walletAddress: walletAddress,
                        chain: chain
                    })),
                    ...nativeTransactions.result.map(tx => ({ 
                        ...tx, 
                        type: 'native',
                        walletAddress: walletAddress,
                        chain: chain
                    }))
                ];

                allTransactions.push(...combinedPage);
                
                // Cursor für nächste Seite
                cursor = tokenTransfers.cursor || nativeTransactions.cursor;
                pageCount++;
                
                // Rate limiting
                await new Promise(resolve => setTimeout(resolve, 100));
                
            } while (cursor && pageCount < maxPages);
            
            console.log(`✅ ${allTransactions.length} Transaktionen geladen (${pageCount} Seiten)`);
            
            return {
                success: true,
                transactions: allTransactions,
                totalCount: allTransactions.length,
                pagesLoaded: pageCount,
                source: 'moralis_api_300k_ready'
            };
            
        } catch (error) {
            console.error('❌ Fehler beim Laden der Transaktionen:', error);
            return {
                success: false,
                error: error.message,
                transactions: [],
                totalCount: 0
            };
        }
    }

    /**
     * DEX Swap Transaktionen erkennen
     */
    async getWalletDEXTransactions(walletAddress, chain = 'eth') {
        console.log(`🔄 Lade DEX Swaps für ${walletAddress}...`);
        
        try {
            const dexAddresses = Object.keys(this.dexContracts);
            const dexTransactions = [];

            // Batch-weise DEX-Adressen abfragen
            for (let i = 0; i < dexAddresses.length; i += 10) {
                const batch = dexAddresses.slice(i, i + 10);
                
                const params = {
                    chain: chain,
                    to_address: batch,
                    limit: 100
                };

                try {
                    const transactions = await this.makeRequest(`/${walletAddress}`, params);
                    
                    const processedTxs = transactions.result.map(tx => ({
                        ...tx,
                        dex_name: this.dexContracts[tx.to_address?.toLowerCase()] || 'Unknown DEX',
                        type: 'dex_swap',
                        classification: 'swap',
                        walletAddress: walletAddress,
                        chain: chain
                    }));
                    
                    dexTransactions.push(...processedTxs);
                    
                } catch (batchError) {
                    console.warn(`⚠️ Fehler bei DEX-Batch ${i}-${i+10}:`, batchError.message);
                }
            }

            console.log(`🔄 ${dexTransactions.length} DEX Swaps gefunden`);
            return dexTransactions;
            
        } catch (error) {
            console.error('❌ Fehler beim Laden der DEX Transaktionen:', error);
            return [];
        }
    }

    /**
     * Historischen Preis mit mehreren Fallback-Strategien
     */
    async getHistoricalPrice(tokenAddress, date, chain = 'eth') {
        const cacheKey = `price_${tokenAddress}_${date}_${chain}`;
        
        // Cache Check
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        try {
            // Strategy 1: Moralis Price API
            const blockNumber = await this.getBlockByDate(date, chain);
            
            const params = {
                chain: chain,
                to_block: blockNumber
            };

            const priceData = await this.makeRequest(`/erc20/${tokenAddress}/price`, params);
            const price = priceData?.usdPrice || 0;
            
            if (price > 0) {
                this.cache.set(cacheKey, price, 7200); // 2 Stunden Cache für Preise
                return price;
            }

            // Strategy 2: Fallback zu aktuellen Preis
            console.warn(`⚠️ Historischer Preis nicht gefunden für ${tokenAddress} am ${date}, verwende aktuellen Preis`);
            const currentPrice = await this.getCurrentPrice(tokenAddress, chain);
            
            this.cache.set(cacheKey, currentPrice, 1800); // 30 Min Cache für Fallback
            return currentPrice;
            
        } catch (error) {
            console.warn(`⚠️ Preis-Abfrage fehlgeschlagen für ${tokenAddress} am ${date}:`, error.message);
            
            // Strategy 3: Strukturierte Preise für bekannte Token
            const structuredPrice = this.getStructuredTokenPrice(tokenAddress);
            if (structuredPrice > 0) {
                this.cache.set(cacheKey, structuredPrice, 3600);
                return structuredPrice;
            }
            
            return 0;
        }
    }

    /**
     * Aktueller Token-Preis
     */
    async getCurrentPrice(tokenAddress, chain = 'eth') {
        try {
            const params = { chain: chain };
            const priceData = await this.makeRequest(`/erc20/${tokenAddress}/price`, params);
            return priceData?.usdPrice || 0;
        } catch (error) {
            console.warn(`⚠️ Aktueller Preis nicht verfügbar für ${tokenAddress}`);
            return 0;
        }
    }

    /**
     * Block-Nummer für Datum
     */
    async getBlockByDate(date, chain = 'eth') {
        const cacheKey = `block_${date}_${chain}`;
        
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        try {
            const timestamp = Math.floor(new Date(date).getTime() / 1000);
            
            const blockData = await this.makeRequest('/dateToBlock', {
                chain: chain,
                date: timestamp
            });
            
            const blockNumber = blockData?.block || 'latest';
            this.cache.set(cacheKey, blockNumber, 86400); // 24 Stunden Cache
            
            return blockNumber;
            
        } catch (error) {
            console.warn('⚠️ Block-by-Date Error:', error.message);
            return 'latest';
        }
    }

    /**
     * Strukturierte Token-Preise für bekannte ROI-Token
     */
    getStructuredTokenPrice(tokenAddress) {
        const structuredPrices = {
            // WGEP - Beispielpreis
            '0x1234567890123456789012345678901234567890': 0.001,
            // MASKMAN
            '0x2345678901234567890123456789012345678901': 0.0005,
            // BORK
            '0x3456789012345678901234567890123456789012': 0.0001,
            // Weitere ROI-Token...
        };

        return structuredPrices[tokenAddress?.toLowerCase()] || 0;
    }

    /**
     * ROI-Transaktion erkennen
     */
    isROITransaction(transaction) {
        const tokenSymbol = transaction.token_symbol || transaction.symbol || '';
        const amount = parseFloat(transaction.value || transaction.amount || 0);
        const toAddress = transaction.to_address?.toLowerCase();
        const walletAddress = transaction.walletAddress?.toLowerCase();

        // Pattern 1: Bekannte ROI-Token
        if (this.roiTokenPatterns[tokenSymbol]) {
            return {
                isROI: true,
                confidence: this.roiTokenPatterns[tokenSymbol].confidence,
                category: this.roiTokenPatterns[tokenSymbol].category,
                reason: `Bekannter ROI-Token: ${tokenSymbol}`
            };
        }

        // Pattern 2: Incoming Transfer ohne Verkauf (potentielle ROI)
        if (toAddress === walletAddress && amount > 0 && !transaction.from_address === walletAddress) {
            return {
                isROI: true,
                confidence: 70,
                category: 'potential_roi',
                reason: 'Incoming Transfer ohne Verkauf'
            };
        }

        // Pattern 3: Sehr kleine Beträge (oft Rewards)
        if (amount > 0 && amount < 100 && toAddress === walletAddress) {
            return {
                isROI: true,
                confidence: 60,
                category: 'micro_reward',
                reason: 'Sehr kleiner Betrag (potentielle Reward)'
            };
        }

        return {
            isROI: false,
            confidence: 0,
            category: 'none',
            reason: 'Keine ROI-Pattern erkannt'
        };
    }

    /**
     * Spam-Token erkennen
     */
    isSpamToken(transaction) {
        const tokenName = (transaction.token_name || '').toLowerCase();
        const tokenSymbol = (transaction.token_symbol || '').toLowerCase();
        const amount = parseFloat(transaction.value || transaction.amount || 0);

        const spamPatterns = [
            /visit.*claim/i,
            /free.*token/i,
            /\.com/i,
            /reward.*claim/i,
            /bonus.*token/i,
            /airdrop.*claim/i,
            /www\./i,
            /http/i,
            /telegram/i,
            /discord/i
        ];

        // Pattern-basierte Erkennung
        const hasSpamPattern = spamPatterns.some(pattern => 
            pattern.test(tokenName) || pattern.test(tokenSymbol)
        );

        // Sehr große Mengen (oft Spam)
        const isSuspiciousAmount = amount > 1000000000;

        return hasSpamPattern || isSuspiciousAmount;
    }

    /**
     * Retry Logic
     */
    shouldRetry(error) {
        if (!error.response) return true; // Network errors
        
        const status = error.response.status;
        return status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
    }

    /**
     * Sleep Helper
     */
    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Token-Info mit Metadaten
     */
    async getTokenMetadata(tokenAddress, chain = 'eth') {
        const cacheKey = `metadata_${tokenAddress}_${chain}`;
        
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        try {
            const metadata = await this.makeRequest(`/erc20/metadata`, {
                chain: chain,
                addresses: [tokenAddress]
            });

            const tokenInfo = metadata[0] || {};
            this.cache.set(cacheKey, tokenInfo, 86400); // 24h Cache für Metadaten
            
            return tokenInfo;
            
        } catch (error) {
            console.warn(`⚠️ Token-Metadaten nicht verfügbar für ${tokenAddress}`);
            return {};
        }
    }

    /**
     * Batch-Token-Preise
     */
    async getBatchTokenPrices(tokenAddresses, chain = 'eth') {
        try {
            const prices = await this.makeRequest('/erc20/prices', {
                chain: chain,
                token_addresses: tokenAddresses
            });

            return prices || [];
            
        } catch (error) {
            console.warn('⚠️ Batch-Preise nicht verfügbar:', error.message);
            return [];
        }
    }

    /**
     * Service-Statistiken
     */
    getStats() {
        return {
            ...this.stats,
            cacheStats: this.cache.getStats(),
            avgSuccessRate: this.stats.totalRequests > 0 
                ? (this.stats.successfulRequests / this.stats.totalRequests * 100).toFixed(2) + '%'
                : '0%'
        };
    }

    /**
     * Cache leeren
     */
    clearCache() {
        this.cache.flushAll();
        console.log('🗑️ Moralis API Cache geleert');
    }

    /**
     * Graceful Shutdown
     */
    async shutdown() {
        console.log('🔄 Moralis API Service wird heruntergefahren...');
        this.clearCache();
        console.log('✅ Moralis API Service shutdown abgeschlossen');
    }
}

module.exports = MoralisAPIService; 