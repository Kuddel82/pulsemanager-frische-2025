// 🎯 TOKEN PRICING SERVICE - STRUKTURIERTE PREISLOGIK
// Stand: 14.06.2025 - Saubere Implementierung nach User-Spezifikationen
// ✅ Moralis First → DexScreener Fallback → PulseWatch Preferred → Emergency Fallback

import { supabase } from '@/lib/supabaseClient';

export class TokenPricingService {
  
  // 🎯 PREIS-MEMORY CACHE (10 Minuten TTL pro Token)
  static priceCache = new Map();
  static CACHE_TTL = 10 * 60 * 1000; // 10 Minuten
  
  // EMERGENCY FALLBACK PRICES ENTFERNT (laut Arbeitsanweisung)

  // 🎯 PULSEWATCH PREFERRED PRICES (überschreiben andere Quellen)
  static PULSEWATCH_PRICES = {
    'DOMINANCE': 0.32,
    'HEX': 0.00616,
    'PLSX': 0.0000271,
    'INC': 0.005,
    'PLS': 0.00005,
    'WBTC': 96000, // Bitcoin Wrapper ca. $96k
    'WETH': 2400,  // Ethereum Wrapper ca. $2.4k
    'USDC': 1.0,   // USD Coin
    'USDT': 1.0,   // Tether
    'DAI': 1.0     // Dai Stablecoin
  };

  // 🎯 ROI MINTER MAPPING für ROI-Tracking
  static ROI_MINTER_MAPPING = {
    'missor': 'flexmess',
    'wgprinter': 'wgep',
    'hex': 'hex_staking',
    'plsx': 'pulsex_staking'
  };

  /**
   * 📊 HAUPTFUNKTION: Token-Preise strukturiert laden
   * @param {Array} tokens - Array von Token-Objekten mit {address, symbol, chain}
   * @returns {Object} - Strukturierte Preisdaten mit Quelle
   */
  static async getTokenPrices(tokens) {
    console.log(`🎯 PRICING: Loading prices for ${tokens.length} tokens`);
    
    // Verwende die neue strukturierte Preis-API
    const results = await this.fetchStructuredPrices(tokens);
    
    // Speichere Preise in token-pricing.json Memory
    await this.saveTokenPricingData(results);
    
    console.log(`✅ PRICING: Loaded ${Object.keys(results).length} token prices`);
    return results;
  }

  /**
   * 🔄 PRICE RESOLUTION FLOW für einzelnen Token
   * @param {Object} token - Token-Objekt
   * @param {Object} batchPrices - Batch-Preis-Daten von Moralis
   * @param {String} chainId - Chain ID
   * @returns {Object} - Finaler Preis mit Quelle
   */
  static async resolveSingleTokenPrice(token, batchPrices, chainId) {
    const tokenAddress = token.address.toLowerCase();
    const tokenSymbol = token.symbol?.toUpperCase();
    
    console.log(`🔍 RESOLVE: ${tokenSymbol} (${tokenAddress.slice(0,10)}...)`);
    
    // 1. Memory Cache Check
    const cached = this.getFromCache(tokenAddress);
    if (cached) {
      console.log(`💾 CACHED: ${tokenSymbol} = $${cached.price} (${cached.source})`);
      return cached;
    }
    
    let finalPrice = 0;
    let priceSource = 'no_price';
    let isReliable = false;
    
    // 2. Moralis Batch-Preis prüfen
    const moralisPrice = batchPrices[tokenAddress]?.usdPrice || 0;
    if (moralisPrice > 0) {
      // 2a. Prüfe ob plausibel (keine extremen Preise für PulseChain)
      const isPlausible = this.validateMoralisPrice(moralisPrice, tokenSymbol, chainId);
      
      if (isPlausible) {
        finalPrice = moralisPrice;
        priceSource = 'moralis';
        isReliable = true;
        console.log(`✅ MORALIS: ${tokenSymbol} = $${moralisPrice}`);
      } else {
        console.log(`⚠️ MORALIS SUSPICIOUS: ${tokenSymbol} = $${moralisPrice} (checking fallbacks)`);
      }
    }
    
    // 3. DexScreener Fallback ENTFERNT (laut Arbeitsanweisung)
    
    // 4. PulseWatch Preferred (überschreibt andere Quellen wenn verfügbar)
    if (this.PULSEWATCH_PRICES[tokenSymbol]) {
      finalPrice = this.PULSEWATCH_PRICES[tokenSymbol];
      priceSource = 'pulsewatch';
      isReliable = true;
      console.log(`⭐ PULSEWATCH: ${tokenSymbol} = $${finalPrice} (preferred)`);
    }
    
    // 5. Emergency Fallback ENTFERNT (laut Arbeitsanweisung)
    
    const result = {
      token: tokenSymbol,
      contract: tokenAddress,
      moralis: moralisPrice,
      // dexscreener: ENTFERNT
      pulsewatch: this.PULSEWATCH_PRICES[tokenSymbol] || null,
      final: finalPrice,
      source: priceSource,
      status: isReliable ? 'verified' : 'unverified',
      timestamp: new Date().toISOString()
    };
    
    // Cache für 10 Minuten
    this.saveToCache(tokenAddress, result);
    
    return result;
  }

  /**
   * 🔍 Moralis Preis-Validierung (reine Plausibilitätsprüfung)
   * @param {Number} price - Preis von Moralis
   * @param {String} symbol - Token Symbol
   * @param {String} chainId - Chain ID
   * @returns {Boolean} - Ist Preis plausibel?
   */
  static validateMoralisPrice(price, symbol, chainId) {
    // Nur basic Plausibilität: Preis > 0 und keine extremen NaN/Infinity Werte
    if (!price || price <= 0 || !isFinite(price)) {
      console.log(`⚠️ INVALID: ${symbol} price ${price} is not a valid number`);
      return false;
    }
    
    return true; // Alle anderen Preise sind gültig
  }

  /**
   * 🚀 Strukturierte Preis-API aufrufen
   * @param {Array} tokens - Token-Array
   * @returns {Object} - Strukturierte Preis-Daten
   */
  static async fetchStructuredPrices(tokens) {
    try {
      console.log(`🎯 STRUCTURED API: Loading prices for ${tokens.length} tokens`);
      
      const response = await fetch('/api/structured-token-pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokens })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ STRUCTURED API: ${data.pricesResolved} prices loaded`);
        return data.prices || {};
      }
      
      console.warn(`⚠️ STRUCTURED API: Failed with ${response.status}`);
      return {};
      
    } catch (error) {
      console.error(`❌ STRUCTURED API: Error - ${error.message}`);
      return {};
    }
  }

  // fetchDexScreenerPrice ENTFERNT (laut Arbeitsanweisung)

  /**
   * 📊 Tokens nach Chain gruppieren
   * @param {Array} tokens - Token-Array
   * @returns {Object} - Nach Chain gruppierte Tokens
   */
  static groupTokensByChain(tokens) {
    const grouped = {};
    
    tokens.forEach(token => {
      const chainId = token.chain || '0x171'; // Default: PulseChain
      if (!grouped[chainId]) {
        grouped[chainId] = [];
      }
      grouped[chainId].push(token);
    });
    
    return grouped;
  }

  /**
   * 💾 Memory Cache Funktionen
   */
  static saveToCache(tokenAddress, priceData) {
    this.priceCache.set(tokenAddress.toLowerCase(), {
      ...priceData,
      cachedAt: Date.now()
    });
  }

  static getFromCache(tokenAddress) {
    const cached = this.priceCache.get(tokenAddress.toLowerCase());
    if (!cached) return null;
    
    const age = Date.now() - cached.cachedAt;
    if (age > this.CACHE_TTL) {
      this.priceCache.delete(tokenAddress.toLowerCase());
      return null;
    }
    
    return cached;
  }

  /**
   * 💾 Token-Pricing-Daten speichern (in Memory und optional Supabase)
   * @param {Object} pricingData - Alle Preis-Daten
   */
  static async saveTokenPricingData(pricingData) {
    try {
      // Memory-System: Speichere in globalem Window-Objekt
      if (typeof window !== 'undefined') {
        window.tokenPricingData = {
          prices: pricingData,
          timestamp: new Date().toISOString(),
          ttl: Date.now() + this.CACHE_TTL
        };
      }
      
      console.log(`💾 PRICING DATA: Saved ${Object.keys(pricingData).length} token prices to memory`);
      
    } catch (error) {
      console.warn(`⚠️ PRICING DATA: Could not save to memory - ${error.message}`);
    }
  }

  /**
   * 🔍 ROI-Transaktion klassifizieren
   * @param {String} fromAddress - Sender Address
   * @param {String} toAddress - Empfänger Address
   * @param {String} tokenSymbol - Token Symbol
   * @returns {String} - ROI-Klassifikation
   */
  static classifyROITransaction(fromAddress, toAddress, tokenSymbol) {
    const mapping = this.ROI_MINTER_MAPPING;
    
    // Prüfe bekannte Minter-Adressen
    for (const [targetToken, sourceToken] of Object.entries(mapping)) {
      if (tokenSymbol.toLowerCase() === targetToken) {
        return `roi_${sourceToken}`;
      }
    }
    
    return 'roi_unknown';
  }

  /**
   * 🧹 Cache aufräumen
   */
  static clearExpiredCache() {
    const now = Date.now();
    const expired = [];
    
    for (const [key, data] of this.priceCache.entries()) {
      if (now - data.cachedAt > this.CACHE_TTL) {
        expired.push(key);
      }
    }
    
    expired.forEach(key => this.priceCache.delete(key));
    
    if (expired.length > 0) {
      console.log(`🧹 CACHE: Cleared ${expired.length} expired entries`);
    }
  }
} 