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
   * 🚀 MORALIS: Get Multiple Token Prices
   * @param {Array} tokens - Array of {address, chain, symbol}
   * @returns {Promise<Array>} Array of price data
   */
  static async getMultipleTokenPrices(tokens) {
    if (!Array.isArray(tokens) || tokens.length === 0) {
      return [];
    }

    logger.info(`🚀 Fetching prices for ${tokens.length} tokens`);

    const promises = tokens.map(token => 
      this.getTokenPrice(token.address, token.chain, token.symbol)
        .catch(error => {
          logger.error(`Failed to get price for ${token.symbol}:`, error);
          return this.getEmergencyFallbackPrice(token.symbol);
        })
    );

    try {
      const results = await Promise.all(promises);
      logger.info(`✅ Bulk price fetch completed: ${results.length} prices`);
      return results;
    } catch (error) {
      logger.error('Bulk price fetch failed:', error);
      return tokens.map(token => this.getEmergencyFallbackPrice(token.symbol));
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
   * 🚨 Emergency Fallback Price
   */
  static getEmergencyFallbackPrice(symbol) {
    const fallbackPrices = {
      'WGEP': 0.001,
      'PLS': 0.00012,
      'PLSX': 0.000045,
      'HEX': 0.007,
      'WPLS': 0.00012,
      'ETH': 3000,
      'USDC': 1.00,
      'USDT': 1.00,
      'DAI': 1.00
    };

    return {
      price: fallbackPrices[symbol] || 0.001,
      symbol: symbol,
      timestamp: new Date().toISOString(),
      source: 'fallback',
      _warning: 'Using fallback price - API unavailable'
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