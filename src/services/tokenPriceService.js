// 🎯 TOKEN PRICE SERVICE - 100% MORALIS ENTERPRISE ONLY
// Eliminiert ALLE kostenlosen APIs für maximale Zuverlässigkeit
// Datum: 2025-01-11 - ENTERPRISE ONLY: Nur bezahlte Moralis APIs

export class TokenPriceService {
  
  // 🚀 100% MORALIS ENTERPRISE ENDPOINTS
  static MORALIS_ENDPOINTS = {
    prices: '/api/moralis-prices',
    tokens: '/api/moralis-tokens'
  };

  // 💰 EMERGENCY FALLBACKS: Nur für absolute Notfälle
  static EMERGENCY_PRICES = {
    'PLS': 0.000088,      // PulseChain Native
    'ETH': 2400,          // Ethereum Native
    'USDC': 1.0,          // Stablecoin
    'USDT': 1.0,          // Stablecoin
    'DAI': 1.0            // Stablecoin
  };

  /**
   * 🚀 100% MORALIS ENTERPRISE: Get Token Price
   */
  static async getTokenPrice(symbol, contractAddress, chainId = '0x171') {
    try {
      console.log(`💰 MORALIS PRICE: Getting price for ${symbol} (${contractAddress})`);
      
             // 🔑 CHECK MORALIS ENTERPRISE ACCESS  
       const testResponse = await fetch('/api/moralis-tokens?endpoint=wallet-tokens&chain=0x171&address=0x0000000000000000000000000000000000000000&limit=1');
       const testData = await testResponse.json();
       
       if (testData._fallback || testData._error || !testResponse.ok) {
         console.warn(`⚠️ MORALIS ENTERPRISE not available, using emergency fallback for ${symbol}`);
         return this.EMERGENCY_PRICES[symbol] || 0;
       }

      // 🚀 MORALIS ENTERPRISE PRICE API
      const response = await fetch(`/api/moralis-prices?endpoint=token-price&chain=${chainId}&address=${contractAddress}`);
      const data = await response.json();
      
      if (data.usdPrice && data.usdPrice > 0) {
        console.log(`💎 MORALIS PRICE: ${symbol} = $${data.usdPrice}`);
        return data.usdPrice;
      }
      
      // Emergency fallback if Moralis has no price
      if (this.EMERGENCY_PRICES[symbol]) {
        console.warn(`🚨 MORALIS: No price for ${symbol}, using emergency fallback: $${this.EMERGENCY_PRICES[symbol]}`);
        return this.EMERGENCY_PRICES[symbol];
      }
      
      console.warn(`⚠️ MORALIS: No price available for ${symbol}`);
      return 0;
      
    } catch (error) {
      console.error(`❌ MORALIS PRICE ERROR for ${symbol}:`, error);
      
      // Emergency fallback
      if (this.EMERGENCY_PRICES[symbol]) {
        return this.EMERGENCY_PRICES[symbol];
      }
      
      return 0;
    }
  }

  /**
   * 🚀 100% MORALIS ENTERPRISE: Get Multiple Token Prices
   */
  static async getMultipleTokenPrices(tokens, chainId = '0x171') {
    const priceMap = new Map();
    
    try {
      console.log(`💰 MORALIS BATCH PRICES: Getting prices for ${tokens.length} tokens`);
      
      // Batch process tokens in groups of 25 (Moralis limit)
      for (let i = 0; i < tokens.length; i += 25) {
        const batch = tokens.slice(i, i + 25);
        const addresses = batch.map(token => token.contractAddress).join(',');
        
        try {
          const response = await fetch(`/api/moralis-prices?endpoint=multiple-token-prices&chain=${chainId}&addresses=${addresses}`);
          const data = await response.json();
          
          if (data.result && Array.isArray(data.result)) {
            for (const priceData of data.result) {
              const contractAddress = priceData.tokenAddress?.toLowerCase();
              const price = parseFloat(priceData.usdPrice) || 0;
              
              if (contractAddress && price > 0) {
                priceMap.set(contractAddress, price);
                console.log(`💎 MORALIS BATCH: ${contractAddress.slice(0, 8)}... = $${price}`);
              }
            }
          }
        } catch (batchError) {
          console.error(`❌ MORALIS BATCH ERROR:`, batchError);
        }
        
        // Rate limiting
        if (i + 25 < tokens.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      // Add emergency fallbacks for tokens without prices
      for (const token of tokens) {
        const contractKey = token.contractAddress?.toLowerCase();
        if (contractKey && !priceMap.has(contractKey) && this.EMERGENCY_PRICES[token.symbol]) {
          priceMap.set(contractKey, this.EMERGENCY_PRICES[token.symbol]);
          console.log(`🚨 EMERGENCY FALLBACK: ${token.symbol} = $${this.EMERGENCY_PRICES[token.symbol]}`);
        }
      }
      
      console.log(`✅ MORALIS BATCH COMPLETE: ${priceMap.size} prices loaded`);
      
    } catch (error) {
      console.error(`💥 MORALIS BATCH PRICING ERROR:`, error);
    }
    
    return priceMap;
  }

  /**
   * 🚀 100% MORALIS ENTERPRISE: Get Token Metadata
   */
  static async getTokenMetadata(contractAddress, chainId = '0x171') {
    try {
      const response = await fetch(`/api/moralis-tokens?endpoint=token-metadata&chain=${chainId}&address=${contractAddress}`);
      const data = await response.json();
      
      if (data.result) {
        return {
          name: data.result.name,
          symbol: data.result.symbol,
          decimals: data.result.decimals,
          logo: data.result.logo,
          thumbnail: data.result.thumbnail,
          source: 'moralis_enterprise'
        };
      }
      
      return null;
      
    } catch (error) {
      console.error(`❌ MORALIS METADATA ERROR:`, error);
      return null;
    }
  }

  /**
   * 🔍 Check if Moralis Enterprise is available
   */
  static async isMoralisEnterpriseAvailable() {
    try {
      const response = await fetch('/api/moralis-tokens?endpoint=wallet-tokens&chain=0x171&address=0x0000000000000000000000000000000000000000&limit=1');
      const data = await response.json();
      
      return !data._fallback && !data._error && response.ok;
    } catch {
      return false;
    }
  }

  /**
   * 🏷️ Get emergency price for symbol (last resort)
   */
  static getEmergencyPrice(symbol) {
    return this.EMERGENCY_PRICES[symbol] || 0;
  }

  /**
   * 📊 Format price for display
   */
  static formatPrice(price) {
    if (price >= 1) {
      return `$${price.toFixed(2)}`;
    } else if (price >= 0.01) {
      return `$${price.toFixed(4)}`;
    } else if (price > 0) {
      return `$${price.toFixed(8)}`;
    } else {
      return '$0.00';
    }
  }

  /**
   * 🕐 Price cache for optimization (5 minute cache)
   */
  static priceCache = new Map();
  static CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  static getCachedPrice(contractAddress) {
    const cached = this.priceCache.get(contractAddress);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.price;
    }
    return null;
  }

  static setCachedPrice(contractAddress, price) {
    this.priceCache.set(contractAddress, {
      price: price,
      timestamp: Date.now()
    });
  }
} 