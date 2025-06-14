// 💼 PORTFOLIO SERVICE - Frontend API für optimiertes Portfolio-Loading
// Verwendung: const { data: portfolio, source } = await getOrLoadPortfolio(user.id, walletAddress);

/**
 * 💾 Portfolio vom letzten Login wiederherstellen (OHNE API-Calls!)
 * @param {string} userId - User ID aus Auth
 * @returns {object} { data: portfolio, lastUpdate, source: 'restored'|null }
 */
export async function restoreLastPortfolio(userId) {
  try {
    console.log(`💾 RESTORE: Loading last portfolio for user ${userId}`);

    // 🔄 FALLBACK: Try localStorage first (temporary solution)
    const localStorageKey = `portfolio_cache_${userId}`;
    const cachedData = localStorage.getItem(localStorageKey);
    
    if (cachedData) {
      try {
        const parsed = JSON.parse(cachedData);
        const ageMinutes = Math.round((Date.now() - new Date(parsed.timestamp).getTime()) / (1000 * 60));
        
        console.log(`✅ RESTORE: Found localStorage cache (${ageMinutes} minutes old)`);
        
        return {
          success: true,
          data: parsed.portfolioData,
          lastUpdate: parsed.timestamp,
          ageMinutes: ageMinutes,
          source: 'localStorage_cache',
          stats: {
            totalTokens: parsed.portfolioData?.length || 0
          }
        };
      } catch (parseError) {
        console.warn('⚠️ RESTORE: localStorage parse error, removing bad cache');
        localStorage.removeItem(localStorageKey);
      }
    }

    // Hole letzten Cache aus Supabase - KEIN API Call an Moralis!
    const response = await fetch(`/api/portfolio-restore?userId=${userId}`);
    
    if (!response.ok) {
      console.log('📭 RESTORE: No cached portfolio found');
      return { 
        success: false,
        data: null, 
        source: 'no_cache',
        message: 'No cached portfolio available'
      };
    }
    
    const result = await response.json();
    
    if (result.success && result.data) {
      console.log(`✅ RESTORE: Portfolio restored from Supabase cache`);
      
      // Also store in localStorage for faster access
      const cacheData = {
        portfolioData: result.data,
        timestamp: result.lastUpdate || new Date().toISOString()
      };
      localStorage.setItem(localStorageKey, JSON.stringify(cacheData));
      
      return {
        success: true,
        data: result.data,
        lastUpdate: result.lastUpdate,
        ageMinutes: result.ageMinutes,
        source: 'supabase_cache',
        stats: result.stats
      };
    } else {
      console.log('📭 RESTORE: No portfolio cache available');
      return { 
        success: false,
        data: null, 
        source: 'no_cache',
        message: result.message || 'No cached portfolio found'
      };
    }
    
  } catch (error) {
    console.error('💥 Restore Error:', error);
    return { 
      success: false,
      data: null, 
      source: 'error',
      error: error.message 
    };
  }
}

/**
 * 💾 Portfolio in localStorage speichern (temporäre Lösung)
 * @param {string} userId - User ID
 * @param {Array} portfolioData - Portfolio data to cache
 */
export function savePortfolioToLocalCache(userId, portfolioData) {
  try {
    const localStorageKey = `portfolio_cache_${userId}`;
    const cacheData = {
      portfolioData: portfolioData,
      timestamp: new Date().toISOString()
    };
    
    localStorage.setItem(localStorageKey, JSON.stringify(cacheData));
    console.log(`💾 CACHE: Portfolio saved to localStorage (${portfolioData?.length || 0} tokens)`);
    
  } catch (error) {
    console.warn('⚠️ CACHE: Failed to save to localStorage:', error);
  }
}

/**
 * 🚀 Portfolio mit intelligentem Caching laden
 * @param {string} userId - User ID aus Auth
 * @param {string} walletAddress - Wallet-Adresse (z.B. '0xDEINEWALLET')
 * @param {object} options - Optionale Parameter
 * @returns {object} { data: portfolio, source: 'cache'|'fresh', stats, cacheAge }
 */
export async function getOrLoadPortfolio(userId, walletAddress, options = {}) {
  try {
    const {
      chainId = '0x171', // PulseChain default
      limit = 50,        // Token-Limit für CU-Kontrolle
      forceRefresh = false
    } = options;

    console.log(`💼 Loading portfolio: User ${userId}, Wallet ${walletAddress}`);

    // Build API URL
    const params = new URLSearchParams({
      userId,
      walletAddress,
      chainId,
      limit: limit.toString(),
      forceRefresh: forceRefresh.toString()
    });

    const apiUrl = `/api/portfolio-cache?${params}`;
    
    // API Call
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`Portfolio API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Portfolio loading failed');
    }

    // Log cache performance
    const { source, cacheAge = 0 } = result;
    console.log(`✅ Portfolio loaded from ${source} (${cacheAge}s old)`);
    
    if (result.stats?.apiCalls) {
      const { moralis, dexscreener, memoryCacheHits, efficiency } = result.stats.apiCalls;
      console.log(`📊 API Usage: ${moralis} Moralis, ${dexscreener} DEXScreener, ${memoryCacheHits} cache hits (${efficiency}% efficiency)`);
    }

    // Return in user's requested format
    return {
      data: result.data,           // Token array wie gewünscht
      source: source,              // 'memory_cache', 'supabase_cache', 'fresh'
      stats: result.stats,         // Performance stats
      cacheAge: cacheAge,          // Cache-Alter in Sekunden
      metadata: result.metadata    // Zusätzliche Infos
    };

  } catch (error) {
    console.error('💥 Portfolio loading error:', error);
    
    // Fallback: Empty portfolio
    return {
      data: [],
      source: 'error',
      error: error.message,
      stats: null,
      cacheAge: 0
    };
  }
}

/**
 * 🧹 Portfolio-Cache löschen (Force Refresh)
 * @param {string} userId - User ID
 * @param {string} walletAddress - Optional: Spezifische Wallet
 * @param {string} chainId - Optional: Spezifische Chain
 */
export async function clearPortfolioCache(userId, walletAddress = null, chainId = null) {
  try {
    const params = new URLSearchParams({ userId });
    if (walletAddress) params.append('walletAddress', walletAddress);
    if (chainId) params.append('chainId', chainId);

    const response = await fetch(`/api/portfolio-cache?${params}`, {
      method: 'DELETE'
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Portfolio cache cleared');
    } else {
      console.error('❌ Cache clear failed:', result.message);
    }

    return result.success;

  } catch (error) {
    console.error('💥 Cache clear error:', error);
    return false;
  }
}

/**
 * 📊 Portfolio-Statistiken abrufen (ohne Daten-Loading)
 */
export function getPortfolioStats(portfolioResult) {
  if (!portfolioResult?.stats) {
    return null;
  }

  const { stats } = portfolioResult;
  
  return {
    totalTokens: stats.totalTokens || 0,
    processedTokens: stats.processedTokens || 0,
    tokensWithPrice: stats.tokensWithPrice || 0,
    tokensWithoutPrice: stats.tokensWithoutPrice || 0,
    totalValueUSD: stats.totalValueUSD || 0,
    processingTime: stats.processingTime || 0,
    cacheEfficiency: stats.apiCalls?.efficiency || 0,
    source: portfolioResult.source,
    cacheAge: portfolioResult.cacheAge || 0
  };
}

/**
 * 💰 Portfolio-Gesamtwert berechnen
 */
export function calculatePortfolioValue(portfolio) {
  if (!Array.isArray(portfolio)) {
    return { totalUSD: 0, tokensWithValue: 0, topTokens: [] };
  }

  const tokensWithValue = portfolio.filter(token => token.totalValue > 0);
  const totalUSD = tokensWithValue.reduce((sum, token) => sum + token.totalValue, 0);
  const topTokens = [...tokensWithValue]
    .sort((a, b) => b.totalValue - a.totalValue)
    .slice(0, 10);

  return {
    totalUSD: Math.round(totalUSD * 100) / 100,
    tokensWithValue: tokensWithValue.length,
    topTokens
  };
}

// 🔧 UTILITY: Format Portfolio für UI
export function formatPortfolioForDisplay(portfolio, options = {}) {
  const { showZeroBalance = false, sortBy = 'value' } = options;
  
  if (!Array.isArray(portfolio)) {
    return [];
  }

  let filtered = portfolio;
  
  // Filter zero balances wenn gewünscht
  if (!showZeroBalance) {
    filtered = portfolio.filter(token => token.balance > 0);
  }

  // Sortierung
  switch (sortBy) {
    case 'value':
      return filtered.sort((a, b) => (b.totalValue || 0) - (a.totalValue || 0));
    case 'balance':
      return filtered.sort((a, b) => b.balance - a.balance);
    case 'symbol':
      return filtered.sort((a, b) => (a.symbol || '').localeCompare(b.symbol || ''));
    case 'price':
      return filtered.sort((a, b) => (b.priceUsd || 0) - (a.priceUsd || 0));
    default:
      return filtered;
  }
}

export default {
  getOrLoadPortfolio,
  clearPortfolioCache,
  getPortfolioStats,
  calculatePortfolioValue,
  formatPortfolioForDisplay
}; 