// 💰 Token Price Service - 100% MORALIS ENTERPRISE INTEGRATION
// Komplette Umstellung von DexScreener auf Moralis für maximale Datenqualität

export class TokenPriceService {
  
  // 🔵 MORALIS ENTERPRISE API CONFIGURATION
  static MORALIS_CONFIG = {
    baseUrl: '/api/moralis-prices',
    defaultChain: 369, // PulseChain
    batchSize: 25,     // Moralis limit
    timeout: 30000
  };

  // 🏷️ MINIMAL FALLBACK PRICES (nur für kritische native Tokens)
  static MINIMAL_FALLBACKS = {
    'PLS': 0.000088,      // PulseChain Native
    'PLSX': 0.00002622,   // PulseX
    'HEX': 0.005943,      // HEX
    'ETH': 2400,          // Ethereum
    'WETH': 2400,         // Wrapped Ethereum
    'DAI': 1.0,           // DAI Stablecoin
    'USDC': 1.0,          // USDC Stablecoin
    'USDT': 1.0,          // USDT Stablecoin
  };

  // 🔵 MORALIS ENTERPRISE: Einzelner Token-Preis
  static async fetchMoralisPrice(contractAddress, chainId = 369) {
    try {
      console.log(`🔵 Moralis API call for ${contractAddress}`);
      
      const response = await fetch(
        `${this.MORALIS_CONFIG.baseUrl}?endpoint=token-prices&addresses=${contractAddress}&chain=${chainId}`,
        { timeout: this.MORALIS_CONFIG.timeout }
      );
      
      if (!response.ok) {
        console.warn(`⚠️ Moralis API Error: ${response.status} ${response.statusText}`);
        return null;
      }
      
      const data = await response.json();
      
      if (data.result && data.result.length > 0) {
        const tokenPrice = data.result[0];
        
        if (tokenPrice.tokenAddress && tokenPrice.usdPrice > 0) {
          const price = parseFloat(tokenPrice.usdPrice);
          console.log(`💰 Moralis: ${contractAddress} = $${price.toFixed(6)}`);
          
          return {
            price: price,
            source: 'moralis_enterprise',
            timestamp: new Date().toISOString(),
            tokenAddress: tokenPrice.tokenAddress,
            tokenSymbol: tokenPrice.tokenSymbol
          };
        }
      }
      
      console.log(`🔍 Moralis: Preis für ${contractAddress} nicht verfügbar`);
      return null;
      
    } catch (error) {
      console.warn(`⚠️ Moralis API Error:`, error.message);
      return null;
    }
  }

  // 🔵 MORALIS ENTERPRISE: Batch-Preise für mehrere Token
  static async fetchBatchPrices(contractAddresses, chainId = 369) {
    try {
      const batchSize = this.MORALIS_CONFIG.batchSize;
      const priceMap = new Map();
      
      for (let i = 0; i < contractAddresses.length; i += batchSize) {
        const batch = contractAddresses.slice(i, i + batchSize);
        const addressParam = batch.join(',');
        
        console.log(`🔵 Moralis Batch API call (${batch.length} tokens)`);
        
        const response = await fetch(
          `${this.MORALIS_CONFIG.baseUrl}?endpoint=token-prices&addresses=${addressParam}&chain=${chainId}`
        );
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.result && Array.isArray(data.result)) {
            for (const tokenPrice of data.result) {
              if (tokenPrice.tokenAddress && tokenPrice.usdPrice > 0) {
                const price = parseFloat(tokenPrice.usdPrice);
                priceMap.set(tokenPrice.tokenAddress.toLowerCase(), {
                  price: price,
                  source: 'moralis_enterprise',
                  symbol: tokenPrice.tokenSymbol
                });
              }
            }
          }
        }
        
        // Rate limiting für Moralis
        if (i + batchSize < contractAddresses.length) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }
      
      console.log(`🔵 Moralis Batch: ${priceMap.size} prices fetched from ${contractAddresses.length} requests`);
      return priceMap;
      
    } catch (error) {
      console.error(`💥 Moralis Batch Error:`, error);
      return new Map();
    }
  }

  // 💰 HAUPTFUNKTION: Token-Preis abrufen (100% Moralis)
  static async getTokenPrice(tokenSymbol, contractAddress = null, chainId = 369) {
    const symbol = tokenSymbol?.toUpperCase();
    
    // 1. PRIORITY 1: Moralis Enterprise API
    if (contractAddress && contractAddress !== 'native' && contractAddress !== 'unknown') {
      const moralisResult = await this.fetchMoralisPrice(contractAddress, chainId);
      if (moralisResult && moralisResult.price > 0) {
        return moralisResult.price;
      }
    }

    // 2. PRIORITY 2: Minimal Fallbacks (nur für native/kritische Tokens)
    if (this.MINIMAL_FALLBACKS[symbol]) {
      const fallbackPrice = this.MINIMAL_FALLBACKS[symbol];
      console.log(`🔄 Fallback-Preis für ${symbol}: $${fallbackPrice}`);
      return fallbackPrice;
    }

    // 3. Kein Preis gefunden
    console.log(`❌ Kein Preis verfügbar für ${symbol} (${contractAddress})`);
    return 0;
  }

  // 🔄 Batch-Preise für Token-Array
  static async getBatchTokenPrices(tokens, chainId = 369) {
    const prices = {};
    
    // Extrahiere Contract-Adressen
    const contractAddresses = tokens
      .filter(token => token.contractAddress && token.contractAddress !== 'native')
      .map(token => token.contractAddress.toLowerCase());
    
    if (contractAddresses.length > 0) {
      // Moralis Batch API
      const priceMap = await this.fetchBatchPrices(contractAddresses, chainId);
      
      // Ordne Preise den Tokens zu
      for (const token of tokens) {
        const contractKey = token.contractAddress?.toLowerCase();
        
        if (contractKey && priceMap.has(contractKey)) {
          prices[token.symbol] = priceMap.get(contractKey).price;
        } else if (this.MINIMAL_FALLBACKS[token.symbol?.toUpperCase()]) {
          prices[token.symbol] = this.MINIMAL_FALLBACKS[token.symbol.toUpperCase()];
        } else {
          prices[token.symbol] = 0;
        }
      }
    } else {
      // Nur Fallback-Preise verwenden
      for (const token of tokens) {
        prices[token.symbol] = this.MINIMAL_FALLBACKS[token.symbol?.toUpperCase()] || 0;
      }
    }
    
    console.log(`💰 Batch Prices: ${Object.keys(prices).length} tokens processed`);
    return prices;
  }

  // 📈 Portfolio-Wert berechnen mit Moralis-Preisen
  static calculatePortfolioValue(tokens, prices) {
    let totalValue = 0;
    const valueBreakdown = [];
    
    for (const token of tokens) {
      const price = prices[token.symbol] || 0;
      const value = token.balance * price;
      
      if (value > 0) {
        totalValue += value;
        valueBreakdown.push({
          symbol: token.symbol,
          balance: token.balance,
          price: price,
          value: value,
          percentage: 0 // Wird später berechnet
        });
      }
    }
    
    // Berechne Prozentanteile
    valueBreakdown.forEach(item => {
      item.percentage = totalValue > 0 ? (item.value / totalValue) * 100 : 0;
    });
    
    // Sortiere nach Wert
    valueBreakdown.sort((a, b) => b.value - a.value);
    
    // Logging für wichtige Holdings
    valueBreakdown.slice(0, 10).forEach(item => {
      console.log(`🪙 ${item.symbol}: ${item.balance.toFixed(4)} × $${item.price.toFixed(6)} = $${item.value.toFixed(2)} (${item.percentage.toFixed(1)}%)`);
    });
    
    console.log(`💰 GESAMT PORTFOLIO-WERT (MORALIS): $${totalValue.toFixed(2)}`);
    
    return {
      totalValue: totalValue,
      breakdown: valueBreakdown,
      tokenCount: valueBreakdown.length
    };
  }

  // 🛡️ Plausibilitätsprüfung für Preise
  static validatePrice(price, tokenSymbol) {
    if (!price || price <= 0) return false;
    
    // Prüfe auf unrealistisch hohe Preise (außer für bekannte wertvolle Tokens)
    const expensiveTokens = ['WBTC', 'BTC', 'ETH', 'WETH'];
    if (!expensiveTokens.includes(tokenSymbol?.toUpperCase()) && price > 10000) {
      console.warn(`🚨 Suspicious high price blocked: ${tokenSymbol} = $${price}`);
      return false;
    }
    
    return true;
  }

  // 📊 Preis-Statistiken
  static analyzeMarketData(tokens, prices) {
    const stats = {
      totalTokens: tokens.length,
      tokensWithPrices: 0,
      tokensWithoutPrices: 0,
      avgPrice: 0,
      highestPrice: 0,
      lowestPrice: Infinity,
      pricesSources: {
        moralis: 0,
        fallback: 0,
        missing: 0
      }
    };
    
    let priceSum = 0;
    
    for (const token of tokens) {
      const price = prices[token.symbol] || 0;
      
      if (price > 0) {
        stats.tokensWithPrices++;
        priceSum += price;
        stats.highestPrice = Math.max(stats.highestPrice, price);
        stats.lowestPrice = Math.min(stats.lowestPrice, price);
        
        // Bestimme Preis-Quelle
        if (this.MINIMAL_FALLBACKS[token.symbol?.toUpperCase()]) {
          stats.pricesSources.fallback++;
        } else {
          stats.pricesSources.moralis++;
        }
      } else {
        stats.tokensWithoutPrices++;
        stats.pricesSources.missing++;
      }
    }
    
    stats.avgPrice = stats.tokensWithPrices > 0 ? priceSum / stats.tokensWithPrices : 0;
    if (stats.lowestPrice === Infinity) stats.lowestPrice = 0;
    
    console.log(`📊 Market Data Analysis:`, stats);
    return stats;
  }
}

export default TokenPriceService; 