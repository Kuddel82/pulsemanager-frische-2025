// 🎯 STRUCTURED TOKEN PRICING API
// Stand: 14.06.2025 - Saubere Preis-Resolution nach User-Spezifikationen
// ✅ Moralis First → DexScreener Fallback → PulseWatch Preferred → Emergency Fallback

// 🔑 MORALIS API CONFIGURATION
const MORALIS_API_KEY = process.env.MORALIS_API_KEY;
const MORALIS_BASE_URL = 'https://deep-index.moralis.io/api/v2';

// 🎯 PULSEWATCH PREFERRED PRICES (überschreiben andere Quellen)
const PULSEWATCH_PRICES = {
  'DOMINANCE': 0.32,
  'HEX': 0.00616,
  'PLSX': 0.0000271,
  'INC': 0.005,
  'PLS': 0.00005
};

// 💰 EMERGENCY FALLBACK PRICES
const EMERGENCY_PRICES = {
  'HEX': 0.0025,
  'PLSX': 0.00008,
  'INC': 0.005,
  'PLS': 0.00005,
  'ETH': 2400,
  'USDC': 1.0,
  'USDT': 1.0,
  'DAI': 1.0,
  'DOMINANCE': 0.32
};

// 🎯 PRICE MEMORY CACHE (10 Minuten TTL)
const priceCache = new Map();
const CACHE_TTL = 10 * 60 * 1000; // 10 Minuten

/**
 * 🚀 Moralis API Helper
 */
async function moralisFetch(endpoint, params = {}) {
  const url = new URL(`${MORALIS_BASE_URL}/${endpoint}`);
  Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
  
  const response = await fetch(url, {
    headers: {
      'X-API-Key': MORALIS_API_KEY,
      'Accept': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error(`Moralis API error: ${response.status}`);
  }
  
  return await response.json();
}

/**
 * 🔍 Moralis Preis-Validierung (keine willkürlichen Limits!)
 */
function validateMoralisPrice(price, symbol, chainId) {
  // Nur basic Plausibilität: Preis > 0 und keine extremen NaN/Infinity Werte
  if (!price || price <= 0 || !isFinite(price)) {
    console.log(`⚠️ INVALID: ${symbol} price ${price} is not a valid number`);
    return false;
  }
  
  return true; // Alle anderen Preise sind gültig
}

/**
 * 🚀 Moralis Batch-Preise laden
 */
async function fetchMoralisBatchPrices(tokens, chainId) {
  try {
    console.log(`🚀 MORALIS BATCH: Loading ${tokens.length} prices for chain ${chainId}`);
    
    const prices = {};
    const batchSize = 25; // Batch-Size für Moralis API
    
    // Process tokens in batches
    for (let i = 0; i < tokens.length; i += batchSize) {
      const batch = tokens.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (token) => {
        try {
          const result = await moralisFetch(`erc20/${token.address}/price`, { 
            chain: chainId 
          });
          
          if (result && result.usdPrice) {
            prices[token.address.toLowerCase()] = {
              usdPrice: parseFloat(result.usdPrice),
              source: 'moralis',
              symbol: result.tokenSymbol || token.symbol,
              name: result.tokenName,
              verified: result.verifiedContract
            };
          }
          
        } catch (error) {
          console.warn(`⚠️ MORALIS: Error fetching ${token.address} - ${error.message}`);
        }
      }));
      
      // Rate limiting between batches
      if (i + batchSize < tokens.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
    
    console.log(`✅ MORALIS BATCH: ${Object.keys(prices).length}/${tokens.length} prices loaded`);
    return prices;
    
  } catch (error) {
    console.error(`❌ MORALIS BATCH: Error - ${error.message}`);
    return {};
  }
}

/**
 * 🔄 DexScreener Einzelpreis-Fallback
 */
async function fetchDexScreenerPrice(tokenAddress, chainId) {
  try {
    console.log(`🔍 DEXSCREENER: Fetching ${tokenAddress}`);
    
    const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`);
    const data = await response.json();
    
    if (data.pairs && data.pairs.length > 0) {
      // Bevorzuge PulseChain-Pairs für PulseChain-Abfragen
      const pulsePairs = data.pairs.filter(p => p.chainId === 'pulsechain');
      const bestPair = pulsePairs.length > 0 ? pulsePairs[0] : data.pairs[0];
      
      const price = parseFloat(bestPair.priceUsd) || 0;
      if (price > 0) {
        console.log(`✅ DEXSCREENER: $${price} (liquidity: $${bestPair.liquidity?.usd || 0})`);
        return {
          usdPrice: price,
          source: 'dexscreener',
          liquidity: bestPair.liquidity?.usd || 0,
          volume24h: bestPair.volume?.h24 || 0
        };
      }
    }
    
    console.log(`⚠️ DEXSCREENER: No valid price found`);
    return null;
    
  } catch (error) {
    console.error(`❌ DEXSCREENER: Error - ${error.message}`);
    return null;
  }
}

/**
 * 🔄 PRICE RESOLUTION FLOW für einzelnen Token
 */
async function resolveSingleTokenPrice(token, batchPrices, chainId) {
  const tokenAddress = token.address.toLowerCase();
  const tokenSymbol = token.symbol?.toUpperCase();
  
  console.log(`🔍 RESOLVE: ${tokenSymbol} (${tokenAddress.slice(0,10)}...)`);
  
  // 1. Memory Cache Check
  const cacheKey = `${tokenAddress}_${chainId}`;
  const cached = priceCache.get(cacheKey);
  if (cached && (Date.now() - cached.cachedAt) < CACHE_TTL) {
    console.log(`💾 CACHED: ${tokenSymbol} = $${cached.final} (${cached.source})`);
    return cached;
  }
  
  let finalPrice = 0;
  let priceSource = 'no_price';
  let isReliable = false;
  let moralisPrice = 0;
  let dexscreenerPrice = null;
  
  // 2. Moralis Batch-Preis prüfen
  const moralisData = batchPrices[tokenAddress];
  if (moralisData && moralisData.usdPrice > 0) {
    moralisPrice = moralisData.usdPrice;
    
    // 2a. Prüfe ob plausibel (keine extremen Preise für PulseChain)
    const isPlausible = validateMoralisPrice(moralisPrice, tokenSymbol, chainId);
    
    if (isPlausible) {
      finalPrice = moralisPrice;
      priceSource = 'moralis';
      isReliable = true;
      console.log(`✅ MORALIS: ${tokenSymbol} = $${moralisPrice}`);
    } else {
      console.log(`⚠️ MORALIS SUSPICIOUS: ${tokenSymbol} = $${moralisPrice} (checking fallbacks)`);
    }
  }
  
  // 3. DexScreener Fallback (nur bei fehlenden/fragwürdigen Moralis-Preisen)
  if (!isReliable) {
    const dexData = await fetchDexScreenerPrice(tokenAddress, chainId);
    if (dexData && dexData.usdPrice > 0) {
      dexscreenerPrice = dexData.usdPrice;
      finalPrice = dexscreenerPrice;
      priceSource = 'dexscreener';
      isReliable = true;
      console.log(`🔄 DEXSCREENER: ${tokenSymbol} = $${dexscreenerPrice}`);
    }
  }
  
  // 4. PulseWatch Preferred (überschreibt andere Quellen wenn verfügbar)
  if (PULSEWATCH_PRICES[tokenSymbol]) {
    finalPrice = PULSEWATCH_PRICES[tokenSymbol];
    priceSource = 'pulsewatch';
    isReliable = true;
    console.log(`⭐ PULSEWATCH: ${tokenSymbol} = $${finalPrice} (preferred)`);
  }
  
  // 5. Emergency Fallback
  if (!isReliable && EMERGENCY_PRICES[tokenSymbol]) {
    finalPrice = EMERGENCY_PRICES[tokenSymbol];
    priceSource = 'emergency_fallback';
    isReliable = true;
    console.log(`🚨 EMERGENCY: ${tokenSymbol} = $${finalPrice}`);
  }
  
  const result = {
    token: tokenSymbol,
    contract: tokenAddress,
    moralis: moralisPrice,
    dexscreener: dexscreenerPrice,
    pulsewatch: PULSEWATCH_PRICES[tokenSymbol] || null,
    final: finalPrice,
    source: priceSource,
    status: isReliable ? 'verified' : 'unverified',
    timestamp: new Date().toISOString(),
    cachedAt: Date.now()
  };
  
  // Cache für 10 Minuten
  priceCache.set(cacheKey, result);
  
  return result;
}

/**
 * 📊 Tokens nach Chain gruppieren
 */
function groupTokensByChain(tokens) {
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

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { tokens } = req.body;
    
    if (!tokens || !Array.isArray(tokens)) {
      return res.status(400).json({ error: 'Missing tokens array' });
    }

    if (!MORALIS_API_KEY) {
      return res.status(500).json({ error: 'Moralis API key not configured' });
    }

    console.log(`🎯 STRUCTURED PRICING: Processing ${tokens.length} tokens`);
    
    const results = {};
    const batchedTokens = groupTokensByChain(tokens);
    
    for (const [chainId, chainTokens] of Object.entries(batchedTokens)) {
      console.log(`📊 PRICING: Processing ${chainTokens.length} tokens for chain ${chainId}`);
      
      // 1. Batch-Preis-Abruf über Moralis
      const batchPrices = await fetchMoralisBatchPrices(chainTokens, chainId);
      
      // 2. Individual-Verarbeitung mit Fallback-Kette
      for (const token of chainTokens) {
        const priceResult = await resolveSingleTokenPrice(token, batchPrices, chainId);
        results[token.address.toLowerCase()] = priceResult;
      }
    }
    
    console.log(`✅ PRICING: Loaded ${Object.keys(results).length} token prices`);

    return res.status(200).json({
      success: true,
      prices: results,
      source: 'structured_token_pricing_service',
      timestamp: new Date().toISOString(),
      tokensRequested: tokens.length,
      pricesResolved: Object.keys(results).length,
      cacheHits: Array.from(priceCache.values()).filter(p => p.source === 'cached').length
    });

  } catch (error) {
    console.error('❌ STRUCTURED PRICING API ERROR:', error);
    return res.status(500).json({ 
      error: 'Structured pricing failed', 
      details: error.message 
    });
  }
} 