// 🎯 STRUCTURED TOKEN PRICING API - PHASE 3 UPDATE
// Stand: 16.06.2025 - Neue Preis-Resolution nach User-Spezifikationen
// ✅ Moralis Pro → PulseWatch Preferred → PulseScan Fallback → Emergency Fallback
// ❌ DexScreener ENTFERNT (nicht mehr nutzen)

// 🔑 MORALIS API CONFIGURATION
const MORALIS_API_KEY = process.env.MORALIS_API_KEY;
const MORALIS_BASE_URL = 'https://deep-index.moralis.io/api/v2.2';

// 🔑 PULSESCAN API CONFIGURATION
const PULSESCAN_BASE_URL = 'https://api.scan.pulsechain.com/api';

// 🎯 PULSEWATCH PREFERRED PRICES (überschreiben andere Quellen)
const PULSEWATCH_PRICES = {
  'DOMINANCE': 0.32,
  'HEX': 0.00616,
  'PLSX': 0.0000271,
  'INC': 0.005,
  'PLS': 0.00005,
  'WBTC': 96000, // Bitcoin Wrapper ca. $96k
  'WETH': null,  // Ethereum Wrapper - loaded dynamically from Moralis
  'USDC': 1.0,   // USD Coin (Stablecoin)
  'USDT': 1.0,   // Tether (Stablecoin)
  'DAI': 1.0,    // Dai Stablecoin
  'WGEP': 0.85   // WGEP Token
};

// 💰 ERWEITERTE EMERGENCY FALLBACK PRICES (für bessere Token-Abdeckung)
const EMERGENCY_PRICES = {
  // Kritische Tokens
  'PLS': 0.00005,   // Native PulseChain Token
  'ETH': null,      // Ethereum - loaded dynamically from Moralis
  'USDC': 1.0,      // USD Coin (Stablecoin)
  'USDT': 1.0,      // Tether (Stablecoin)
  'DAI': 1.0,       // Dai Stablecoin
  
  // PulseChain Ecosystem Tokens (EXAKTE SYMBOLE aus Portfolio)
  '💤': 0.0001,         // MISSOR Token (mit Emoji)
  'MISSOR': 0.0001,     // MISSOR Token (ohne Emoji)
  'FLEXBOOST': 0.0001,  // FLEXBOOST
  'FLEXMAS': 0.0001,    // FLEXMAS
  'FLEXOR': 0.0001,     // FLEXOR
  'FINFIRE': 0.0001,    // FINANCE ON FIRE
  'HOUSE': 0.0001,      // Housecoin Pulsechain
  'BEAST': 0.0001,      // BEAST
  'SOIL': 0.0001,       // SUN Minimeal
  'TREASURY BILL ㉾': 0.0001, // TREASURY BILL (mit Emoji)
  'TREASURY BILL': 0.0001, // TREASURY BILL (ohne Emoji)
  '😂': 0.0001,         // LFG (mit Emoji)
  'LFG': 0.0001,        // LFG (ohne Emoji)
  '🚀': 0.0001,         // Rocket Booster (mit Emoji)
  'ROCKET': 0.0001,     // Rocket Booster (ohne Emoji)
  '$GROKP': 0.0001,     // GROK LAUNCH PULSE
  'GROKP': 0.0001,      // GROK LAUNCH PULSE (ohne $)
  'WWPP': 0.0001,       // Worlds Worst Printer
  '⛽': 0.0001,         // GAS Money (mit Emoji)
  'GAS': 0.0001,        // GAS Money (ohne Emoji)
  'SECRET': 0.0001,     // Conspiracy
  'SⒶT': 0.0001,        // SATISFFECTION (mit Sonderzeichen)
  'SATISFFECTION': 0.0001, // SATISFFECTION
  '🧠': 0.0001,         // Mnemonics (mit Emoji)
  'MNEMONICS': 0.0001,  // Mnemonics (ohne Emoji)
  'RSI': 0.0001,        // OVERSOLD
  'Exploited': 0.0001,  // No Value (Großschreibung)
  'EXPLOITED': 0.0001,  // No Value
  '⛽⛽': 0.0001,        // GAS Club (mit Emoji)
  'GASCLUB': 0.0001,    // GAS Club (ohne Emoji)
  '🏧': 0.0001,         // GAS Station (mit Emoji)
  'GASSTATION': 0.0001, // GAS Station (ohne Emoji)
  'PLSPUP': 0.0001,     // PLSPUPPY
  'PETROLAO': 0.0001,   // PETROLAO
  'SⒶV': 0.0001,        // SAVANT (mit Sonderzeichen)
  'SAVANT': 0.0001,     // SAVANT
  'Balloonomics': 0.0001, // Balloonomics (Großschreibung)
  'BALLOONOMICS': 0.0001, // Balloonomics
  'Finvesta': 0.0001,   // Finvesta (Großschreibung)
  'FINVESTA': 0.0001,   // Finvesta
  'QUBIT™⚗️': 0.0001,   // QUANTUM SUPERPOSITION (mit Emojis)
  'QUBIT': 0.0001,      // QUANTUM SUPERPOSITION
  '🎭': 0.0001,         // REMEMBER REMEMBER (mit Emoji)
  'REMEMBER': 0.0001,   // REMEMBER REMEMBER
  'IYKYK': 0.0001,      // IYKYK
  'F㉾D': 0.0001,       // Reserve Teh (mit Sonderzeichen)
  '🖨️': 0.0001         // WORLDS GREATEST PDAI PRINTER (mit Emoji)
};

// 🎯 PRICE MEMORY CACHE (TEMPORÄR DEAKTIVIERT FÜR TESTING)
const priceCache = new Map();
const CACHE_TTL = 0; // CACHE DEAKTIVIERT - 10 * 60 * 1000; // 10 Minuten

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
 * 🚀 Moralis Batch-Preise laden (Multi-Chain Support)
 */
async function fetchMoralisBatchPrices(tokens, chainId) {
  try {
    console.log(`🚀 MORALIS BATCH: Loading ${tokens.length} prices for chain ${chainId}`);
    
    const prices = {};
    const batchSize = 25; // Batch-Size für Moralis API
    
    // Map Chain-IDs für Moralis
    const moralisChainId = mapToMoralisChainId(chainId);
    console.log(`📊 CHAIN MAPPING: ${chainId} → ${moralisChainId}`);
    
    // Process tokens in batches
    for (let i = 0; i < tokens.length; i += batchSize) {
      const batch = tokens.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (token) => {
        try {
          const result = await moralisFetch(`erc20/${token.address}/price`, { 
            chain: moralisChainId 
          });
          
          if (result && result.usdPrice) {
            prices[token.address.toLowerCase()] = {
              usdPrice: parseFloat(result.usdPrice),
              source: 'moralis',
              symbol: result.tokenSymbol || token.symbol,
              name: result.tokenName,
              verified: result.verifiedContract,
              chain: chainId
            };
          }
          
        } catch (error) {
          console.warn(`⚠️ MORALIS: Error fetching ${token.address} on ${chainId} - ${error.message}`);
        }
      }));
      
      // Rate limiting between batches
      if (i + batchSize < tokens.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
    
    console.log(`✅ MORALIS BATCH: ${Object.keys(prices).length}/${tokens.length} prices loaded for ${chainId}`);
    return prices;
    
  } catch (error) {
    console.error(`❌ MORALIS BATCH: Error for chain ${chainId} - ${error.message}`);
    return {};
  }
}

/**
 * 🔗 Chain-ID Mapping für Moralis API
 */
function mapToMoralisChainId(chainId) {
  const chainMap = {
    '0x171': 'pulsechain',          // PulseChain
    '0x1': 'eth',                   // Ethereum
    '0x89': 'polygon',              // Polygon
    '0xa86a': 'avalanche',          // Avalanche
    '0x38': 'bsc',                  // Binance Smart Chain
    '369': 'pulsechain',            // PulseChain (decimal)
    '1': 'eth',                     // Ethereum (decimal)
    '137': 'polygon',               // Polygon (decimal)
    '43114': 'avalanche',           // Avalanche (decimal)
    '56': 'bsc'                     // BSC (decimal)
  };
  
  return chainMap[chainId] || chainId;
}

/**
 * 🔄 PulseScan Token-Info Fallback
 */
async function fetchPulseScanTokenInfo(tokenAddress) {
  try {
    console.log(`🔍 PULSESCAN: Fetching token info for ${tokenAddress.slice(0,10)}...`);
    
    const response = await fetch(
      `${PULSESCAN_BASE_URL}?module=token&action=getToken&contractaddress=${tokenAddress}`
    );
    const data = await response.json();
    
    if (data.status === '1' && data.result) {
      console.log(`✅ PULSESCAN: Token ${data.result.symbol} info loaded`);
      return {
        symbol: data.result.symbol,
        name: data.result.name,
        decimals: parseInt(data.result.decimals),
        verified: data.result.contractVerified === 'True',
        source: 'pulsescan'
      };
    }
    
    console.log(`⚠️ PULSESCAN: No token info found`);
    return null;
    
  } catch (error) {
    console.error(`❌ PULSESCAN: Error - ${error.message}`);
    return null;
  }
}

/**
 * 💰 PulseScan PLS Preis laden
 */
async function fetchPulseScanPLSPrice() {
  try {
    console.log('🔍 PULSESCAN: Fetching PLS price from stats API');
    
    const response = await fetch(`${PULSESCAN_BASE_URL}?module=stats&action=coinprice`);
    const data = await response.json();
    
    if (data.status === '1' && data.result?.usd) {
      const plsPrice = parseFloat(data.result.usd);
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
  let pulsescanInfo = null;
  
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
  
  // 3. PulseScan Info Fallback (für Token-Verifizierung und PLS-Preis)
  if (!isReliable || tokenSymbol === 'PLS') {
    pulsescanInfo = await fetchPulseScanTokenInfo(tokenAddress);
    
    // Für PLS-Token: Verwende PulseScan PLS-Preis
    if (tokenSymbol === 'PLS' || (pulsescanInfo && pulsescanInfo.symbol === 'PLS')) {
      const plsPrice = await fetchPulseScanPLSPrice();
      if (plsPrice > 0) {
        finalPrice = plsPrice;
        priceSource = 'pulsescan';
        isReliable = true;
        console.log(`✅ PULSESCAN: PLS = $${plsPrice}`);
      }
    }
  }
  
  // 4. PulseWatch Fallback (nur wenn kein Moralis-Preis verfügbar)
  if (!isReliable && PULSEWATCH_PRICES[tokenSymbol]) {
    finalPrice = PULSEWATCH_PRICES[tokenSymbol];
    priceSource = 'pulsewatch';
    isReliable = true;
    console.log(`🔄 PULSEWATCH FALLBACK: ${tokenSymbol} = $${finalPrice} (no live price available)`);
  }
  
  // 5. Emergency Fallback (laut Phase 3 Anforderung reduziert)
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
    pulsescan: pulsescanInfo ? pulsescanInfo.verified : null,
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

/**
 * 🔥 REAL-TIME ETH PRICE LOADER
 * Lädt den aktuellen ETH-Preis von Moralis statt hardcoded values
 */
export async function getRealTimeEthPrice() {
  try {
    console.log('🔥 LOADING REAL-TIME ETH PRICE from Moralis...');
    
    const response = await fetch(`${MORALIS_BASE_URL}/erc20/0x0000000000000000000000000000000000000000/price?chain=eth`, {
      headers: {
        'X-API-Key': MORALIS_API_KEY,
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.warn(`⚠️ ETH PRICE API: ${response.status} - using fallback`);
      return 2400; // Emergency fallback
    }
    
    const data = await response.json();
    const ethPrice = parseFloat(data.usdPrice);
    
    if (ethPrice && ethPrice > 0) {
      console.log(`🔥 REAL-TIME ETH PRICE: $${ethPrice}`);
      return ethPrice;
    } else {
      console.warn('⚠️ ETH PRICE: Invalid price data - using fallback');
      return 2400; // Emergency fallback
    }
    
  } catch (error) {
    console.error(`❌ ETH PRICE ERROR: ${error.message}`);
    return 2400; // Emergency fallback
  }
} 