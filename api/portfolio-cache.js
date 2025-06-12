// 💼 PORTFOLIO CACHE API - OPTIMIZED FOR PULSECHAIN
// Mit Supabase-Caching, Rate Limiting, DEXScreener Fallback und Performance Tracking

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const MORALIS_API_KEY = process.env.MORALIS_API_KEY;
const MORALIS_BASE = 'https://deep-index.moralis.io/api/v2';
const CACHE_TTL_MINUTES = 15; // Supabase Cache: 15 Minuten
const MEMORY_CACHE_TTL = 5 * 60 * 1000; // Memory Cache: 5 Minuten

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

// 💾 MEMORY CACHE: Schneller als Supabase für wiederholte Calls
const memoryCache = new Map();

function getMemoryCache(key) {
  const cached = memoryCache.get(key);
  if (cached && (Date.now() - cached.timestamp) < MEMORY_CACHE_TTL) {
    console.log(`🚀 Memory cache hit: ${key}`);
    return cached.data;
  }
  return null;
}

function setMemoryCache(key, data) {
  memoryCache.set(key, {
    data,
    timestamp: Date.now()
  });
}

// 🏭 MORALIS API CALLS mit Optimierungen
async function fetchTokenBalances(wallet, chainId) {
  try {
    console.log(`📊 Fetching balances: ${wallet} on chain ${chainId}`);
    
    const res = await fetch(`${MORALIS_BASE}/${wallet}/erc20?chain=${chainId}`, {
      headers: { 'X-API-Key': MORALIS_API_KEY }
    });
    
    if (!res.ok) {
      throw new Error(`Balance API error: ${res.status}`);
    }
    
    const data = await res.json();
    console.log(`✅ Found ${data?.result?.length || 0} token balances`);
    return data.result || [];
    
  } catch (error) {
    console.error('❌ fetchTokenBalances error:', error.message);
    return [];
  }
}

async function fetchTokenPrice(tokenAddress, chainId) {
  const cacheKey = `price_${tokenAddress.toLowerCase()}_${chainId}`;
  
  // 1. Check memory cache first
  const cached = getMemoryCache(cacheKey);
  if (cached) return cached;
  
  // 2. Rate limited API call
  try {
    const priceInfo = await rateLimitedCall(async () => {
      console.log(`💰 Fetching price: ${tokenAddress}`);
      
      const res = await fetch(`${MORALIS_BASE}/erc20/${tokenAddress}/price?chain=${chainId}&include=percent_change`, {
        headers: { 'X-API-Key': MORALIS_API_KEY }
      });
      
      if (!res.ok) {
        console.log(`⚠️ Price API error ${res.status} for ${tokenAddress}`);
        return null;
      }
      
      const json = await res.json();
      const result = {
        price: json?.usdPrice ?? null,
        symbol: json?.tokenSymbol,
        name: json?.tokenName,
        change24h: json?.['24hrPercentChange'],
        source: 'moralis'
      };
      
      if (result.price) {
        console.log(`✅ Price found: $${result.price} for ${tokenAddress}`);
      }
      
      return result;
    });
    
    // 3. Cache the result
    setMemoryCache(cacheKey, priceInfo);
    return priceInfo;
    
  } catch (error) {
    console.error(`❌ fetchTokenPrice error for ${tokenAddress}:`, error.message);
    const nullResult = { price: null, source: 'error' };
    setMemoryCache(cacheKey, nullResult);
    return nullResult;
  }
}

// 🔄 DEXSCREENER FALLBACK
async function fetchDEXScreenerPrice(tokenAddress) {
  try {
    console.log(`🔍 DEXScreener fallback: ${tokenAddress}`);
    
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

// 🚀 OPTIMIERTE TOKEN DATA FETCHING
async function fetchTokenDataOptimized(wallet, chainId, limit = 50) {
  const startTime = Date.now();
  let moralisCallsUsed = 0;
  let dexscreenerCallsUsed = 0;
  let memoryCacheHits = 0;

  // 1. LADE TOKEN BALANCES
  const tokens = await fetchTokenBalances(wallet, chainId);
  moralisCallsUsed = 1; // Balance API Call
  
  if (!tokens.length) {
    return {
      tokens: [],
      stats: {
        totalTokens: 0,
        processingTime: Date.now() - startTime,
        apiCalls: { moralis: moralisCallsUsed, dexscreener: 0, memoryCacheHits: 0 }
      }
    };
  }

  // 2. LIMITIERE VERARBEITUNG (CU-Kontrolle)
  const tokensToProcess = tokens.slice(0, limit);
  console.log(`📊 Processing ${tokensToProcess.length} tokens (limited from ${tokens.length})`);

  // 3. SAMMLE PREISE FÜR ALLE TOKENS
  const enrichedTokens = [];
  let totalValue = 0;
  let tokensWithPrice = 0;

  for (const token of tokensToProcess) {
    const tokenAddr = token.token_address.toLowerCase();
    const decimals = parseInt(token.decimals) || 18;
    const balance = parseFloat(token.balance) / Math.pow(10, decimals);
    
    // Skip Zero-Balance Tokens
    if (balance === 0) continue;

    // 4. PREISFINDUNG: Memory Cache → Moralis → DEXScreener
    let priceInfo = await fetchTokenPrice(tokenAddr, chainId);
    
    if (getMemoryCache(`price_${tokenAddr}_${chainId}`)) {
      memoryCacheHits++;
    } else {
      moralisCallsUsed++;
    }
    
    // Fallback zu DEXScreener wenn Moralis fehlschlägt
    if (!priceInfo || priceInfo.price === null) {
      priceInfo = await fetchDEXScreenerPrice(tokenAddr);
      if (priceInfo) {
        dexscreenerCallsUsed++;
      }
    }

    const hasPrice = priceInfo && priceInfo.price !== null;
    const priceUsd = hasPrice ? priceInfo.price : null;
    const tokenValue = hasPrice ? balance * priceUsd : 0;
    
    if (hasPrice) {
      tokensWithPrice++;
      totalValue += tokenValue;
    }

    enrichedTokens.push({
      symbol: priceInfo?.symbol || token.symbol || 'Unknown',
      name: priceInfo?.name || token.name || 'Unknown Token',
      address: tokenAddr,
      balance,
      decimals,
      priceUsd,
      totalValue: tokenValue,
      priceSource: priceInfo?.source || 'none',
      change24h: priceInfo?.change24h,
      hasPrice
    });
  }

  // 5. SORTIERE NACH WERT
  enrichedTokens.sort((a, b) => (b.totalValue || 0) - (a.totalValue || 0));

  const processingTime = Date.now() - startTime;
  
  console.log(`✅ Portfolio processed: ${enrichedTokens.length} tokens in ${processingTime}ms`);
  console.log(`📊 API Usage: ${moralisCallsUsed} Moralis, ${dexscreenerCallsUsed} DEXScreener, ${memoryCacheHits} cache hits`);

  return {
    tokens: enrichedTokens,
    stats: {
      totalTokens: tokens.length,
      processedTokens: enrichedTokens.length,
      tokensWithPrice,
      tokensWithoutPrice: enrichedTokens.length - tokensWithPrice,
      totalValueUSD: Math.round(totalValue * 100) / 100,
      processingTime,
      apiCalls: {
        moralis: moralisCallsUsed,
        dexscreener: dexscreenerCallsUsed,
        total: moralisCallsUsed + dexscreenerCallsUsed,
        memoryCacheHits,
        efficiency: Math.round((memoryCacheHits / (moralisCallsUsed + memoryCacheHits)) * 100)
      }
    }
  };
}

// 🎯 HAUPT-FUNKTION: Portfolio mit Cache-Management
export async function getOrLoadPortfolio(userId, walletAddress, chainId = '0x171', options = {}) {
  const { limit = 50, forceRefresh = false } = options;
  const now = new Date();
  const cacheKey = `${userId}_${walletAddress}_${chainId}`;
  
  console.log(`💼 Portfolio request: User ${userId}, Wallet ${walletAddress}, Chain ${chainId}`);

  try {
    // 1. CHECK MEMORY CACHE FIRST (schnellster)
    if (!forceRefresh) {
      const memoryData = getMemoryCache(`portfolio_${cacheKey}`);
      if (memoryData) {
        console.log(`🚀 Memory cache hit for portfolio ${cacheKey}`);
        return {
          source: 'memory_cache',
          cacheAge: Math.round((Date.now() - memoryData.timestamp) / 1000),
          ...memoryData
        };
      }
    }

    // 2. CHECK SUPABASE CACHE
    if (!forceRefresh) {
      const { data: existing, error } = await supabase
        .from('portfolio_cache')
        .select('*')
        .eq('user_id', userId)
        .eq('wallet_address', walletAddress)
        .eq('chain_id', chainId)
        .single();

      if (!error && existing && new Date(existing.cache_expires_at) > now) {
        console.log(`💾 Supabase cache hit for ${cacheKey}`);
        
        // Setze auch in Memory Cache
        setMemoryCache(`portfolio_${cacheKey}`, {
          data: existing.cache_data,
          stats: existing.cache_stats || {},
          timestamp: new Date(existing.updated_at).getTime()
        });
        
        return {
          source: 'supabase_cache',
          cacheAge: Math.round((now - new Date(existing.updated_at)) / 1000),
          data: existing.cache_data,
          stats: existing.cache_stats || {}
        };
      }
    }

    // 3. FRESH DATA LOADING
    console.log(`🔄 Loading fresh portfolio data for ${cacheKey}`);
    const portfolioResult = await fetchTokenDataOptimized(walletAddress, chainId, limit);
    
    const cacheData = {
      data: portfolioResult.tokens,
      stats: portfolioResult.stats,
      metadata: {
        generatedAt: now.toISOString(),
        walletAddress,
        chainId,
        version: 'v0.1.9-CACHE-OPTIMIZED'
      }
    };

    // 4. SPEICHERE IN SUPABASE
    const upsertData = {
      user_id: userId,
      wallet_address: walletAddress,
      chain_id: chainId,
      cache_data: portfolioResult.tokens,
      cache_stats: portfolioResult.stats,
      cache_expires_at: new Date(now.getTime() + CACHE_TTL_MINUTES * 60 * 1000).toISOString(),
      updated_at: now.toISOString()
    };

    const { error: upsertError } = await supabase
      .from('portfolio_cache')
      .upsert(upsertData, { 
        onConflict: ['user_id', 'wallet_address', 'chain_id'] 
      });

    if (upsertError) {
      console.error('⚠️ Supabase cache save error:', upsertError.message);
    } else {
      console.log(`✅ Portfolio cached in Supabase for ${CACHE_TTL_MINUTES} minutes`);
    }

    // 5. SPEICHERE IN MEMORY CACHE
    setMemoryCache(`portfolio_${cacheKey}`, cacheData);

    return {
      source: 'fresh',
      cacheAge: 0,
      ...cacheData
    };

  } catch (error) {
    console.error('💥 Portfolio loading error:', error);
    throw error;
  }
}

// 🧹 CACHE CLEANUP (optional)
export async function clearPortfolioCache(userId, walletAddress = null, chainId = null) {
  try {
    let query = supabase.from('portfolio_cache').delete().eq('user_id', userId);
    
    if (walletAddress) query = query.eq('wallet_address', walletAddress);
    if (chainId) query = query.eq('chain_id', chainId);
    
    const { error } = await query;
    
    if (error) {
      console.error('❌ Cache clear error:', error.message);
      return false;
    }
    
    // Clear memory cache too
    const keys = Array.from(memoryCache.keys()).filter(key => 
      key.startsWith(`portfolio_${userId}`)
    );
    keys.forEach(key => memoryCache.delete(key));
    
    console.log(`✅ Cache cleared for user ${userId}`);
    return true;
    
  } catch (error) {
    console.error('💥 Cache clear error:', error);
    return false;
  }
}

// 📊 API ENDPOINT
export default async function handler(req, res) {
  console.log('💼 PORTFOLIO CACHE API: Request received');
  
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { userId, walletAddress, chainId = '0x171', limit = 50, forceRefresh = false } = req.query;

  // Validation
  if (!userId || !walletAddress) {
    return res.status(400).json({ 
      error: 'userId und walletAddress erforderlich',
      usage: '/api/portfolio-cache?userId=123&walletAddress=0x...'
    });
  }

  if (!MORALIS_API_KEY || !process.env.SUPABASE_URL) {
    return res.status(503).json({ 
      error: 'API-Konfiguration fehlt (Moralis oder Supabase)'
    });
  }

  try {
    if (req.method === 'DELETE') {
      // CACHE LÖSCHEN
      const success = await clearPortfolioCache(userId, walletAddress, chainId);
      return res.status(200).json({
        success,
        message: success ? 'Cache gelöscht' : 'Cache-Löschung fehlgeschlagen'
      });
    }
    
    // PORTFOLIO LADEN
    const result = await getOrLoadPortfolio(userId, walletAddress, chainId, {
      limit: parseInt(limit),
      forceRefresh: forceRefresh === 'true'
    });

    return res.status(200).json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('💥 Portfolio API error:', error);
    return res.status(500).json({
      error: 'Fehler beim Laden des Portfolios',
      message: error.message
    });
  }
} 