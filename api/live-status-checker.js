// 📊 LIVE STATUS CHECKER - OPTIMIZED FOR PULSECHAIN
// Mit Rate Limiting, Caching und intelligentem Error Handling

const MORALIS_API_KEY = process.env.MORALIS_API_KEY;
const MORALIS_BASE = 'https://deep-index.moralis.io/api/v2';
const CHAIN_ID = '0x171'; // PulseChain

// 🚦 RATE LIMITING: Max 5 API Calls pro Sekunde
let lastCallTime = 0;
const MIN_CALL_INTERVAL = 200; // 200ms zwischen Calls

async function rateLimitedCall(fn) {
  const now = Date.now();
  const timeSinceLastCall = now - lastCallTime;
  
  if (timeSinceLastCall < MIN_CALL_INTERVAL) {
    await new Promise(resolve => setTimeout(resolve, MIN_CALL_INTERVAL - timeSinceLastCall));
  }
  
  lastCallTime = Date.now();
  return await fn();
}

// 💾 SIMPLE CACHE: 5 Minuten für Token-Preise
const priceCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 Minuten

function getCachedPrice(tokenAddress) {
  const cached = priceCache.get(tokenAddress.toLowerCase());
  if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
    console.log(`💾 Cache hit for ${tokenAddress}`);
    return cached.price;
  }
  return null;
}

function setCachedPrice(tokenAddress, price) {
  priceCache.set(tokenAddress.toLowerCase(), {
    price,
    timestamp: Date.now()
  });
}

// 🏭 MORALIS API CALLS
async function fetchTokenBalances(address) {
  try {
    console.log(`📊 Fetching balances for ${address}`);
    const res = await fetch(`${MORALIS_BASE}/${address}/erc20?chain=${CHAIN_ID}`, {
      headers: { 'X-API-Key': MORALIS_API_KEY }
    });
    
    if (!res.ok) {
      console.error(`❌ Balance API error: ${res.status}`);
      return { result: [] };
    }
    
    const data = await res.json();
    console.log(`✅ Found ${data?.result?.length || 0} token balances`);
    return data;
  } catch (error) {
    console.error('❌ fetchTokenBalances error:', error.message);
    return { result: [] };
  }
}

async function fetchTokenPrice(tokenAddress) {
  // 1. Check cache first
  const cachedPrice = getCachedPrice(tokenAddress);
  if (cachedPrice !== null) {
    return cachedPrice;
  }
  
  // 2. Rate limited API call
  try {
    const price = await rateLimitedCall(async () => {
      console.log(`💰 Fetching price for ${tokenAddress}`);
      const res = await fetch(`${MORALIS_BASE}/erc20/${tokenAddress}/price?chain=${CHAIN_ID}&include=percent_change`, {
        headers: { 'X-API-Key': MORALIS_API_KEY }
      });
      
      if (!res.ok) {
        console.log(`⚠️ Price API error ${res.status} for ${tokenAddress}`);
        return null;
      }
      
      const json = await res.json();
      const usdPrice = json?.usdPrice ?? null;
      
      if (usdPrice) {
        console.log(`✅ Price found: $${usdPrice} for ${tokenAddress}`);
      } else {
        console.log(`⚠️ No price data for ${tokenAddress}`);
      }
      
      return {
        price: usdPrice,
        symbol: json?.tokenSymbol,
        name: json?.tokenName,
        change24h: json?.['24hrPercentChange'],
        source: 'moralis'
      };
    });
    
    // 3. Cache the result (even if null)
    setCachedPrice(tokenAddress, price);
    return price;
    
  } catch (error) {
    console.error(`❌ fetchTokenPrice error for ${tokenAddress}:`, error.message);
    setCachedPrice(tokenAddress, null);
    return null;
  }
}

// 🔄 DEXSCREENER FALLBACK für ungepaarte Tokens
async function fetchDEXScreenerPrice(tokenAddress) {
  try {
    console.log(`🔍 DEXScreener fallback for ${tokenAddress}`);
    const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`);
    const data = await res.json();
    
    const pulsePairs = data.pairs?.filter(p => p.chainId === 'pulsechain') || [];
    const pair = pulsePairs[0] || data.pairs?.[0];
    const price = pair?.priceUsd ? parseFloat(pair.priceUsd) : null;
    
    if (price) {
      console.log(`✅ DEXScreener price: $${price}`);
      return {
        price,
        symbol: pair.baseToken?.symbol,
        name: pair.baseToken?.name,
        source: 'dexscreener'
      };
    }
    
    return null;
  } catch (error) {
    console.error(`❌ DEXScreener error for ${tokenAddress}:`, error.message);
    return null;
  }
}

export default async function handler(req, res) {
  console.log('📊 LIVE STATUS CHECKER: Request received');
  
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { address, limit = 50 } = req.query;

  // Validation
  if (!address) {
    return res.status(400).json({ 
      error: 'Wallet-Adresse fehlt',
      usage: '/api/live-status-checker?address=0x...'
    });
  }

  if (!MORALIS_API_KEY || MORALIS_API_KEY === 'YOUR_MORALIS_API_KEY_HERE') {
    return res.status(503).json({ 
      error: 'Moralis API Key nicht konfiguriert'
    });
  }

  const startTime = Date.now();
  let moralisCallsUsed = 0;
  let dexscreenerCallsUsed = 0;
  let cacheHits = 0;

  try {
    // 1. LADE TOKEN BALANCES
    const balanceData = await fetchTokenBalances(address);
    moralisCallsUsed = 1; // Balance API Call
    
    if (!balanceData?.result?.length) {
      return res.status(404).json({
        error: 'Keine Token-Balances gefunden',
        wallet: address,
        chain: 'PulseChain'
      });
    }

    // Limitiere auf die ersten X Tokens um CU-Verbrauch zu kontrollieren
    const tokens = balanceData.result.slice(0, parseInt(limit));
    console.log(`📊 Processing ${tokens.length} tokens (limited from ${balanceData.result.length})`);

    // 2. SAMMLE PREISE FÜR ALLE TOKENS
    const enrichedTokens = [];
    let totalValue = 0;
    let tokensWithPrice = 0;
    let tokensWithoutPrice = 0;

    for (const token of tokens) {
      const tokenAddr = token.token_address.toLowerCase();
      const decimals = parseInt(token.decimals) || 18;
      const balanceReadable = parseFloat(token.balance) / Math.pow(10, decimals);
      
      // Skip tokens with zero balance
      if (balanceReadable === 0) continue;

      // 3. PREISFINDUNG: Moralis → DEXScreener
      let priceInfo = await fetchTokenPrice(tokenAddr);
      
      if (priceInfo === null) {
        moralisCallsUsed++;
      } else if (priceInfo && priceInfo.price === null) {
        // Moralis fehlgeschlagen → DEXScreener Fallback
        priceInfo = await fetchDEXScreenerPrice(tokenAddr);
        dexscreenerCallsUsed++;
        moralisCallsUsed++;
      } else {
        // Cache hit oder erfolgreicher Moralis Call
        if (getCachedPrice(tokenAddr) !== null) {
          cacheHits++;
        } else {
          moralisCallsUsed++;
        }
      }

      const hasPrice = priceInfo && priceInfo.price !== null;
      const usdPrice = hasPrice ? priceInfo.price : null;
      const tokenValue = hasPrice ? balanceReadable * usdPrice : 0;
      
      if (hasPrice) {
        tokensWithPrice++;
        totalValue += tokenValue;
      } else {
        tokensWithoutPrice++;
      }

      enrichedTokens.push({
        symbol: priceInfo?.symbol || token.symbol || 'Unknown',
        name: priceInfo?.name || token.name || 'Unknown Token',
        tokenAddress: tokenAddr,
        balance: balanceReadable,
        decimals: decimals,
        priceUSD: usdPrice,
        valueUSD: tokenValue,
        priceSource: priceInfo?.source || 'none',
        change24h: priceInfo?.change24h,
        status: hasPrice ? '✅ Preis verfügbar' : '⚠️ Kein Preis gefunden'
      });
    }

    // 4. SORTIERE NACH WERT (höchster zuerst)
    enrichedTokens.sort((a, b) => (b.valueUSD || 0) - (a.valueUSD || 0));

    const processingTime = Date.now() - startTime;
    
    console.log(`✅ LIVE STATUS COMPLETE: ${enrichedTokens.length} tokens processed in ${processingTime}ms`);
    console.log(`📊 API Usage: ${moralisCallsUsed} Moralis, ${dexscreenerCallsUsed} DEXScreener, ${cacheHits} cache hits`);

    // 5. RESPONSE
    return res.status(200).json({
      success: true,
      wallet: address,
      chain: 'PulseChain',
      chainId: CHAIN_ID,
      
      // Token Data
      tokens: enrichedTokens,
      tokenCount: enrichedTokens.length,
      totalTokens: balanceData.result.length,
      
      // Portfolio Summary
      portfolio: {
        totalValueUSD: Math.round(totalValue * 100) / 100,
        tokensWithPrice: tokensWithPrice,
        tokensWithoutPrice: tokensWithoutPrice,
        priceSuccessRate: Math.round((tokensWithPrice / enrichedTokens.length) * 100)
      },
      
      // Performance & API Usage
      performance: {
        processingTimeMs: processingTime,
        apiCalls: {
          moralis: moralisCallsUsed,
          dexscreener: dexscreenerCallsUsed,
          total: moralisCallsUsed + dexscreenerCallsUsed,
          cacheHits: cacheHits,
          efficiency: Math.round((cacheHits / (moralisCallsUsed + cacheHits)) * 100)
        }
      },
      
      // Metadata
      generatedAt: new Date().toISOString(),
      version: "v0.1.9-LIVE-OPTIMIZED",
      note: "PulseChain: Individual API Calls mit Rate Limiting & Caching"
    });

  } catch (error) {
    console.error('💥 LIVE STATUS ERROR:', error);
    return res.status(500).json({
      error: 'Fehler beim Abrufen der Live-Daten',
      message: error.message,
      wallet: address,
      chain: 'PulseChain'
    });
  }
} 