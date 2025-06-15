// 🎯 PULSESCAN API SERVICE - PHASE 3 INTEGRATION
// Stand: 16.06.2025 - Neue API-Quelle für Token-Preise und Chain-Daten
// API: https://api.scan.pulsechain.com/api

export class PulseScanService {
  
  static BASE_URL = 'https://api.scan.pulsechain.com/api';
  static cache = new Map();
  static CACHE_TTL = 15 * 60 * 1000; // 15 Minuten Cache
  
  /**
   * 💰 PLS Preis von PulseScan Stats-API
   * @returns {Number} - PLS Preis in USD
   */
  static async getPLSPrice() {
    try {
      const cacheKey = 'pls_price';
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached.price;
      
      console.log('🔍 PULSESCAN: Fetching PLS price from stats API');
      
      const response = await fetch(`${this.BASE_URL}?module=stats&action=coinprice`);
      const data = await response.json();
      
      if (data.status === '1' && data.result?.usd) {
        const plsPrice = parseFloat(data.result.usd);
        
        this.saveToCache(cacheKey, { price: plsPrice });
        console.log(`✅ PULSESCAN: PLS = $${plsPrice}`);
        
        return plsPrice;
      }
      
      console.warn('⚠️ PULSESCAN: No valid PLS price found');
      return 0;
      
    } catch (error) {
      console.error(`❌ PULSESCAN: PLS price error - ${error.message}`);
      return 0;
    }
  }
  
  /**
   * 🔍 Token-Info von PulseScan
   * @param {String} contractAddress - Token Contract Address
   * @returns {Object} - Token-Info
   */
  static async getTokenInfo(contractAddress) {
    try {
      const cacheKey = `token_${contractAddress.toLowerCase()}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;
      
      console.log(`🔍 PULSESCAN: Fetching token info for ${contractAddress.slice(0,10)}...`);
      
      const response = await fetch(
        `${this.BASE_URL}?module=token&action=getToken&contractaddress=${contractAddress}`
      );
      const data = await response.json();
      
      if (data.status === '1' && data.result) {
        const tokenInfo = {
          symbol: data.result.symbol,
          name: data.result.name,
          decimals: parseInt(data.result.decimals),
          totalSupply: data.result.totalSupply,
          verified: data.result.contractVerified === 'True',
          source: 'pulsescan'
        };
        
        this.saveToCache(cacheKey, tokenInfo);
        console.log(`✅ PULSESCAN: ${tokenInfo.symbol} info loaded`);
        
        return tokenInfo;
      }
      
      console.warn(`⚠️ PULSESCAN: No token info found for ${contractAddress}`);
      return null;
      
    } catch (error) {
      console.error(`❌ PULSESCAN: Token info error - ${error.message}`);
      return null;
    }
  }
  
  /**
   * 📊 Account Token Balance
   * @param {String} address - Wallet Address
   * @param {String} contractAddress - Token Contract Address
   * @returns {String} - Token Balance
   */
  static async getTokenBalance(address, contractAddress) {
    try {
      console.log(`🔍 PULSESCAN: Checking balance for ${address.slice(0,10)}...`);
      
      const response = await fetch(
        `${this.BASE_URL}?module=account&action=tokenbalance&contractaddress=${contractAddress}&address=${address}&tag=latest`
      );
      const data = await response.json();
      
      if (data.status === '1' && data.result) {
        console.log(`✅ PULSESCAN: Balance loaded`);
        return data.result;
      }
      
      console.warn('⚠️ PULSESCAN: No balance found');
      return '0';
      
    } catch (error) {
      console.error(`❌ PULSESCAN: Balance error - ${error.message}`);
      return '0';
    }
  }
  
  /**
   * 📜 Token Transactions
   * @param {String} address - Wallet Address
   * @param {String} contractAddress - Token Contract Address (optional)
   * @param {Number} page - Page Number
   * @param {Number} offset - Items per page
   * @returns {Array} - Token Transactions
   */
  static async getTokenTransactions(address, contractAddress = null, page = 1, offset = 100) {
    try {
      console.log(`🔍 PULSESCAN: Fetching transactions for ${address.slice(0,10)}... (page ${page})`);
      
      let url = `${this.BASE_URL}?module=account&action=tokentx&address=${address}&page=${page}&offset=${offset}&sort=desc`;
      
      if (contractAddress) {
        url += `&contractaddress=${contractAddress}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === '1' && data.result && Array.isArray(data.result)) {
        console.log(`✅ PULSESCAN: ${data.result.length} transactions loaded`);
        
        return data.result.map(tx => ({
          blockNumber: tx.blockNumber,
          hash: tx.hash,
          from: tx.from,
          to: tx.to,
          contractAddress: tx.contractAddress,
          value: tx.value,
          tokenName: tx.tokenName,
          tokenSymbol: tx.tokenSymbol,
          tokenDecimal: tx.tokenDecimal,
          timeStamp: tx.timeStamp,
          gas: tx.gas,
          gasPrice: tx.gasPrice,
          gasUsed: tx.gasUsed,
          source: 'pulsescan'
        }));
      }
      
      console.warn('⚠️ PULSESCAN: No transactions found');
      return [];
      
    } catch (error) {
      console.error(`❌ PULSESCAN: Transactions error - ${error.message}`);
      return [];
    }
  }
  
  /**
   * 💎 Batch Token Preise (experimentell - PulseScan hat keine direkten Preise)
   * Nutzt PLS-Preis als Referenz für relative Bewertungen
   * @param {Array} tokens - Token Array
   * @returns {Object} - Preis-Daten
   */
  static async getBatchTokenPrices(tokens) {
    try {
      console.log(`🔍 PULSESCAN: Batch processing ${tokens.length} tokens`);
      
      // PLS Basis-Preis laden
      const plsPrice = await this.getPLSPrice();
      const results = {};
      
      // Für jeden Token Info laden
      await Promise.all(tokens.map(async (token) => {
        try {
          const tokenInfo = await this.getTokenInfo(token.address);
          
          if (tokenInfo) {
            results[token.address.toLowerCase()] = {
              symbol: tokenInfo.symbol,
              name: tokenInfo.name,
              verified: tokenInfo.verified,
              // Kein direkter Preis verfügbar von PulseScan
              usdPrice: 0,
              plsReferencePrice: plsPrice,
              source: 'pulsescan_info'
            };
          }
          
        } catch (error) {
          console.warn(`⚠️ PULSESCAN: Error processing ${token.address} - ${error.message}`);
        }
      }));
      
      console.log(`✅ PULSESCAN: ${Object.keys(results).length} token infos loaded`);
      return results;
      
    } catch (error) {
      console.error(`❌ PULSESCAN: Batch error - ${error.message}`);
      return {};
    }
  }
  
  /**
   * 💾 Cache Management
   */
  static saveToCache(key, data) {
    this.cache.set(key, {
      ...data,
      cachedAt: Date.now()
    });
  }
  
  static getFromCache(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    const age = Date.now() - cached.cachedAt;
    if (age > this.CACHE_TTL) {
      this.cache.delete(key);
      return null;
    }
    
    return cached;
  }
  
  static clearExpiredCache() {
    const now = Date.now();
    const expired = [];
    
    for (const [key, data] of this.cache.entries()) {
      if (now - data.cachedAt > this.CACHE_TTL) {
        expired.push(key);
      }
    }
    
    expired.forEach(key => this.cache.delete(key));
    
    if (expired.length > 0) {
      console.log(`🧹 PULSESCAN: Cleared ${expired.length} expired cache entries`);
    }
  }
} 