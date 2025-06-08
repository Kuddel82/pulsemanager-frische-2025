// 💰 Token Price Service - Echte Marktpreise für PulseChain Token
// Integriert DexScreener, CoinGecko und weitere APIs für aktuelle Preise

export class TokenPriceService {
  
  // 🏷️ Bekannte Token-Contract-Adressen auf PulseChain
  static PULSECHAIN_TOKENS = {
    'PLSX': '0x95B303987A60C71504D99Aa1b13B4DA07b0790ab',
    'HEX': '0x2b591e99afE9f32eAA6214f7B7629768c40Eeb39', 
    'INC': '0x2fa878Ab3F87CC1C9737Fc071108F904c0B0C95d',
    'WBTC': '0xb17D901469B9208B17d916112988A3FeD19b5cA1',
    'WETH': '0xA1077a294dDE1B09bB078844df40758a5D0f9a27',
    'DAI': '0xefD766cCb38EaF1dfd701853BFCe31359239F305',
    'USDC': '0x15D38573d2feeb82e7ad5187aB8c1D52810B1f07',
    'USDT': '0x0Cb6F5a34ad42ec934882A05265A7d5F59b51A2f'
  };

  // 🌐 Fallback-Preise (falls APIs nicht verfügbar)
  static FALLBACK_PRICES = {
    'PLSX': 0.00002622,   // CoinMarketCap
    'HEX': 0.005943,      // CoinMarketCap
    'INC': 0.000001,      // Geschätzt
    'WBTC': 105000,       // ~Bitcoin Preis
    'ETH': 2500,          // ~Ethereum Preis
    'WETH': 2500,         // ~Ethereum Preis
    'DAI': 1.0,           // Stablecoin
    'USDC': 1.0,          // Stablecoin
    'USDT': 1.0,          // Stablecoin
    'pDAI': 1.0           // pDAI = pulsechain DAI
  };

  // 📊 DexScreener API - Echte Marktpreise
  static async fetchDexScreenerPrice(tokenAddress) {
    try {
      const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`);
      if (!response.ok) return null;
      
      const data = await response.json();
      if (data.pairs && data.pairs.length > 0) {
        // Nimm das Paar mit der höchsten Liquidität
        const bestPair = data.pairs.sort((a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0))[0];
        return parseFloat(bestPair.priceUsd) || null;
      }
      return null;
    } catch (error) {
      console.warn(`🔍 DexScreener API Error für ${tokenAddress}:`, error.message);
      return null;
    }
  }

  // 🦎 CoinGecko API (Backup)
  static async fetchCoinGeckoPrice(tokenSymbol) {
    try {
      const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${tokenSymbol}&vs_currencies=usd`);
      if (!response.ok) return null;
      
      const data = await response.json();
      return data[tokenSymbol]?.usd || null;
    } catch (error) {
      console.warn(`🦎 CoinGecko API Error für ${tokenSymbol}:`, error.message);
      return null;
    }
  }

  // 💰 Hauptfunktion: Token-Preis abrufen
  static async getTokenPrice(tokenSymbol, contractAddress = null) {
    const symbol = tokenSymbol?.toUpperCase();
    
    // 1. Versuche DexScreener mit Contract-Adresse
    if (contractAddress && contractAddress !== 'native' && contractAddress !== 'unknown') {
      const dexPrice = await this.fetchDexScreenerPrice(contractAddress);
      if (dexPrice) {
        console.log(`💰 DexScreener-Preis für ${symbol}: $${dexPrice}`);
        return dexPrice;
      }
    }

    // 2. Versuche bekannte Contract-Adressen
    if (this.PULSECHAIN_TOKENS[symbol]) {
      const dexPrice = await this.fetchDexScreenerPrice(this.PULSECHAIN_TOKENS[symbol]);
      if (dexPrice) {
        console.log(`💰 DexScreener-Preis für ${symbol} (bekannt): $${dexPrice}`);
        return dexPrice;
      }
    }

    // 3. Fallback zu statischen Preisen
    if (this.FALLBACK_PRICES[symbol]) {
      console.log(`💰 Fallback-Preis für ${symbol}: $${this.FALLBACK_PRICES[symbol]}`);
      return this.FALLBACK_PRICES[symbol];
    }

    // 4. Unbekannter Token
    console.warn(`⚠️ Kein Preis gefunden für ${symbol} (${contractAddress})`);
    return 0;
  }

  // 🔄 Batch-Preise für mehrere Token
  static async getBatchPrices(tokens) {
    const prices = {};
    const promises = tokens.map(async (token) => {
      const price = await this.getTokenPrice(token.symbol, token.contractAddress);
      prices[token.symbol] = price;
    });
    
    await Promise.all(promises);
    return prices;
  }

  // 📈 Portfolio-Wert berechnen
  static calculatePortfolioValue(tokens, prices) {
    let totalValue = 0;
    
    for (const token of tokens) {
      const price = prices[token.symbol] || 0;
      const value = token.balance * price;
      totalValue += value;
      
      console.log(`🪙 ${token.symbol}: ${token.balance.toFixed(4)} × $${price} = $${value.toFixed(2)}`);
    }
    
    return totalValue;
  }
}

export default TokenPriceService; 