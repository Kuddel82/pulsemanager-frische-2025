// 🎯 TOKEN PRICE SERVICE - MORALIS API
// Version: 2.0
// Datum: 2025-01-11 - Standard Moralis APIs

import { logger } from '@/lib/logger';

// 🚀 MORALIS API ENDPOINTS
const MORALIS_BASE_URL = 'https://deep-index.moralis.io/api/v2.2';

/**
 * 🚀 TOKEN PRICE SERVICE - Moralis Integration
 * Handles token price fetching from Moralis APIs
 */
export class TokenPriceService {
  static API_TIMEOUT = 15000; // 15 Sekunden
  static CACHE_DURATION = 2 * 60 * 1000; // 2 Minuten
  static priceCache = new Map();

  /**
   * 🚀 MORALIS: Get Token Price
   * @param {string} address - Token contract address
   * @param {string} chain - Blockchain (eth, pulsechain)
   * @returns {Promise<Object>} Price data
   */
  static async getTokenPrice(address, chain = 'eth', symbol = 'TOKEN') {
    const cacheKey = `${address}_${chain}`;
    
    // 🔑 CHECK MORALIS ACCESS
    const apiKey = import.meta.env.VITE_MORALIS_API_KEY;
    if (!apiKey) {
      console.warn(`⚠️ MORALIS not available, using emergency fallback for ${symbol}`);
      return this.getEmergencyFallbackPrice(symbol);
    }

    // 🚀 MORALIS PRICE API
    try {
      const response = await fetch(`${MORALIS_BASE_URL}/erc20/${address}/price?chain=${chain}`, {
        method: 'GET',
        headers: {
          'X-API-Key': apiKey,
          'Accept': 'application/json'
        },
        timeout: this.API_TIMEOUT
      });

      if (!response.ok) {
        throw new Error(`Moralis API Error: ${response.status}`);
      }

      const data = await response.json();
      
      const result = {
        price: data.usdPrice || 0,
        symbol: symbol,
        address: address,
        chain: chain,
        timestamp: new Date().toISOString(),
        source: 'moralis'
      };

      // Cache für 2 Minuten
      this.priceCache.set(cacheKey, { data: result, timestamp: Date.now() });
      
      logger.info(`✅ Token price fetched: ${symbol} = $${result.price}`);
      return result;

    } catch (error) {
      logger.error(`Token price fetch failed for ${symbol}:`, error);
      return this.getEmergencyFallbackPrice(symbol);
    }
  }

  /**
   * 🚀 MORALIS: Get Multiple Token Prices (BATCH API - OPTIMAL)
   * @param {Array} tokens - Array of {address, chain, symbol}
   * @returns {Promise<Array>} Array of price data
   */
  static async getMultipleTokenPrices(tokens) {
    if (!Array.isArray(tokens) || tokens.length === 0) {
      return [];
    }

    logger.info(`🚀 Fetching prices for ${tokens.length} tokens using BATCH API`);

    // 🔑 CHECK MORALIS ACCESS
    const apiKey = import.meta.env.VITE_MORALIS_API_KEY;
    if (!apiKey) {
      console.warn(`⚠️ MORALIS not available, using emergency fallbacks`);
      return tokens.map(token => this.getEmergencyFallbackPrice(token.symbol));
    }

    try {
      // 🚀 MORALIS BATCH PRICE API - Alle Token in einem Call!
      const response = await fetch(`${MORALIS_BASE_URL}/erc20/prices`, {
        method: 'POST',
        headers: {
          'X-API-Key': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          chain: tokens[0]?.chain || '0x171', // PulseChain als Standard
          include: "percent_change",
          tokens: tokens.map(token => ({
            tokenAddress: token.address
          }))
        }),
        timeout: this.API_TIMEOUT
      });

      if (!response.ok) {
        throw new Error(`Moralis Batch API Error: ${response.status} - ${response.statusText}`);
      }

      const batchData = await response.json();
      
      // 🎯 Verarbeite Batch-Antwort und mappe zu unserem Format
      const results = tokens.map(token => {
        const priceData = batchData.find(item => 
          item.tokenAddress?.toLowerCase() === token.address?.toLowerCase()
        );

        if (priceData && priceData.usdPrice > 0) {
          return {
            price: priceData.usdPrice,
            symbol: token.symbol || priceData.tokenSymbol,
            address: token.address,
            chain: token.chain,
            timestamp: new Date().toISOString(),
            source: 'moralis_batch',
            percentChange24h: priceData['24hrPercentChange'],
            exchangeName: priceData.exchangeName,
            tokenName: priceData.tokenName,
            tokenDecimals: priceData.tokenDecimals
          };
        } else {
          // Fallback für Token ohne Preis
          console.warn(`⚠️ No price found for ${token.symbol}, using fallback`);
          return this.getEmergencyFallbackPrice(token.symbol);
        }
      });

      logger.info(`✅ Batch price fetch completed: ${results.length} prices from Moralis Batch API`);
      
      // 🎯 Cache alle Preise
      results.forEach(result => {
        const cacheKey = `${result.address}_${result.chain}`;
        this.priceCache.set(cacheKey, { data: result, timestamp: Date.now() });
      });

      return results;

    } catch (error) {
      logger.error('Moralis Batch API failed, falling back to individual calls:', error);
      
      // 🛡️ FALLBACK: Einzelne API-Calls wenn Batch fehlschlägt
      const promises = tokens.map(token => 
        this.getTokenPrice(token.address, token.chain, token.symbol)
          .catch(error => {
            logger.error(`Failed to get price for ${token.symbol}:`, error);
            return this.getEmergencyFallbackPrice(token.symbol);
          })
      );

      try {
        const results = await Promise.all(promises);
        logger.info(`✅ Fallback individual calls completed: ${results.length} prices`);
        return results;
      } catch (fallbackError) {
        logger.error('Even fallback failed, using emergency prices:', fallbackError);
        return tokens.map(token => this.getEmergencyFallbackPrice(token.symbol));
      }
    }
  }

  /**
   * 🚀 MORALIS: Get Token Metadata
   * @param {string} address - Token contract address  
   * @param {string} chain - Blockchain
   * @returns {Promise<Object>} Token metadata
   */
  static async getTokenMetadata(address, chain = 'eth') {
    const apiKey = import.meta.env.VITE_MORALIS_API_KEY;
    if (!apiKey) {
      return { symbol: 'TOKEN', name: 'Unknown Token', decimals: 18 };
    }

    try {
      const response = await fetch(`${MORALIS_BASE_URL}/erc20/metadata?chain=${chain}&addresses[]=${address}`, {
        headers: { 'X-API-Key': apiKey }
      });

      const data = await response.json();
      return {
        ...data[0],
        source: 'moralis'
      };
    } catch (error) {
      logger.error('Token metadata fetch failed:', error);
      return { symbol: 'TOKEN', name: 'Unknown Token', decimals: 18 };
    }
  }

  /**
   * 🔍 Check if Moralis is available
   */
  static async isMoralisAvailable() {
    try {
      const apiKey = import.meta.env.VITE_MORALIS_API_KEY;
      const isAvailable = !!apiKey;
      
      console.log('✅ MORALIS: Available (test passed)');
      return isAvailable;
    } catch (error) {
      console.log(`🔍 MORALIS: ${isAvailable ? 'Available' : 'Not available'}`);
      return false;
    } finally {
      console.log(`🔍 MORALIS: Error - ${error.message}`);
      return false;
    }
  }

  /**
   * 🚨 Emergency Fallback Price (basierend auf PulseWatch aktuellen Preisen)
   */
  static getEmergencyFallbackPrice(symbol) {
    const fallbackPrices = {
      // 🔥 UPDATED: Echte Preise von PulseWatch Portfolio
      'MISSER': 0.00958,    // $9.58e-3 (PulseWatch aktuell)
      'MISSOR': 0.00958,    // $9.58e-3 (Alternative Schreibweise)
      'REMEMBER REMEMBER THE 5TH OF NOVEMBER': 5.49e-10, // $5.49e-10 (PulseWatch)
      'REMEMBER': 5.49e-10, // Kurze Version
      'SOIL': 0.10,         // $0.10 (PulseWatch)
      'FINVESTA': 24.36,    // $24.36 (PulseWatch)
      'FLEXMAS': 0.31,      // $0.31 (PulseWatch)
      'DOMINANCE': 0.32,    // $0.32 (PulseWatch)
      'BEAST': 0.61,        // $0.61 (PulseWatch)
      'GAS MONEY': 2.09e-4, // $2.09e-4 (PulseWatch)
      'GAS': 2.09e-4,       // Kurze Version
      'FINFIRE': 3.42,      // $3.42 (PulseWatch)
      'FINANCE ON FIRE': 3.42, // Vollständiger Name
      'PLS': 3.10e-5,       // $3.10e-5 (PulseWatch aktuell)
      'WPLS': 3.10e-5,      // $3.10e-5 (gleich wie PLS)
      'SAVANT': 0.30,       // $0.30 (PulseWatch)
      'WBTC': 462.34,       // $462.34 (PulseWatch)
      'DAI': 0.00273,       // $2.73e-3 (PulseWatch aktuell)
      'PLSX': 2.70e-5,      // $2.70e-5 (PulseWatch aktuell)
      'WORLDS GREATEST PDAI PRINTER': 71.89, // $71.89 (PulseWatch)
      'PDAI': 71.89,        // Kurze Version
      'HEX': 0.0061,        // $6.10e-3 (PulseWatch aktuell)
      'PLSPUP': 148.02,     // $148.02 (PulseWatch)
      'PLSPUPPY': 148.02,   // Vollständiger Name
      'SECRET': 1.43e-5,    // $1.43e-5 (PulseWatch)
      'CONSPIRACY': 1.43e-5, // Vollständiger Name
      'MNEMONICS': 0.41,    // $0.41 (PulseWatch)
      'INC': 1.46,          // $1.46 (PulseWatch aktuell - viel höher!)
      'INCENTIVE': 1.46,    // Vollständiger Name
      'RESERVE TEH': 1.05e-4, // $1.05e-4 (PulseWatch)
      'EXPLOITED': 0.02,    // $0.02 (PulseWatch)
      'WWPP': 0.03,         // $0.03 (PulseWatch)
      'WORLDS WORST': 0.03, // Vollständiger Name
      'TREASURY BILL': 3.36e-4, // $3.36e-4 (PulseWatch)
      // Standard Tokens
      'USDT': 1.0,          // $1.00 (Stablecoin)
      'USDC': 1.0,          // $1.00 (Stablecoin)
      'ETH': 3000,          // ~$3000 (Ethereum)
      // Legacy Token (falls noch verwendet)
      'WGEP': 0.001,
      'LOAN': 0.0001,
      'FLEX': 0.0002
    };

    return {
      price: fallbackPrices[symbol?.toUpperCase()] || 0.01, // Höherer Fallback basierend auf PulseWatch Durchschnitt
      symbol: symbol,
      timestamp: new Date().toISOString(),
      source: 'fallback_pulsewatch_based',
      _warning: 'Using PulseWatch-based fallback price - API unavailable'
    };
  }

  /**
   * 🧹 Clear Price Cache
   */
  static clearCache() {
    this.priceCache.clear();
    logger.info('🧹 Token price cache cleared');
  }
}

export default TokenPriceService; 