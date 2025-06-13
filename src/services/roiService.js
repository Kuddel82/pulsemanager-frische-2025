// 💰 ROI SERVICE - Frontend API für optimiertes ROI-Tracking
// Verwendung: const { data: roi, source } = await getOrLoadROI(user.id, walletAddress);

/**
 * 🚀 ROI Daten mit intelligentem Caching laden
 * @param {string} userId - User ID aus Auth
 * @param {string} walletAddress - Wallet-Adresse
 * @param {object} options - Optionale Parameter
 * @returns {object} { data: roiData, source: 'cache'|'fresh', stats, cacheAge }
 */
export async function getOrLoadROI(userId, walletAddress, options = {}) {
  try {
    const {
      chainId = '0x171', // PulseChain default
      forceRefresh = false
    } = options;

    console.log(`💰 Loading ROI: User ${userId}, Wallet ${walletAddress}`);

    // Build API URL
    const params = new URLSearchParams({
      userId,
      walletAddress,
      chainId,
      forceRefresh: forceRefresh.toString()
    });

    const apiUrl = `/api/roi-cache?${params}`;
    
    // API Call
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`ROI API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'ROI loading failed');
    }

    // Log cache performance
    const { source, cacheAge = 0 } = result;
    console.log(`✅ ROI loaded from ${source} (${cacheAge}s old)`);
    
    if (result.stats?.apiCalls) {
      const { moralis, total } = result.stats.apiCalls;
      console.log(`📊 API Usage: ${moralis} Moralis calls, ${total} total`);
    }

    // Return in user's requested format
    return {
      data: result.data,           // ROI data wie gewünscht
      source: source,              // 'memory_cache', 'supabase_cache', 'fresh'
      stats: result.stats,         // Performance stats
      cacheAge: cacheAge,          // Cache-Alter in Sekunden
      metadata: result.metadata    // Zusätzliche Infos
    };

  } catch (error) {
    console.error('💥 ROI loading error:', error);
    
    // Fallback: Empty ROI
    return {
      data: {
        roiTransactions: [],
        totalTokensReceived: 0,
        uniqueTokens: 0,
        totalValue: 0,
        minterStats: {}
      },
      source: 'error',
      error: error.message,
      stats: null,
      cacheAge: 0
    };
  }
}

/**
 * 🧹 ROI-Cache löschen (Force Refresh)
 * @param {string} userId - User ID
 * @param {string} walletAddress - Optional: Spezifische Wallet
 * @param {string} chainId - Optional: Spezifische Chain
 */
export async function clearROICache(userId, walletAddress = null, chainId = null) {
  try {
    const params = new URLSearchParams({ userId });
    if (walletAddress) params.append('walletAddress', walletAddress);
    if (chainId) params.append('chainId', chainId);

    const response = await fetch(`/api/roi-cache?${params}`, {
      method: 'DELETE'
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ ROI cache cleared');
    } else {
      console.error('❌ ROI cache clear failed:', result.message);
    }

    return result.success;

  } catch (error) {
    console.error('💥 ROI cache clear error:', error);
    return false;
  }
}

/**
 * 📊 ROI-Statistiken abrufen (ohne Daten-Loading)
 */
export function getROIStats(roiResult) {
  if (!roiResult?.data) {
    return null;
  }

  const { data, stats } = roiResult;
  
  return {
    totalTokensReceived: data.totalTokensReceived || 0,
    uniqueTokens: data.uniqueTokens || 0,
    totalValue: data.totalValue || 0,
    minterCount: Object.keys(data.minterStats || {}).length,
    processingTime: stats?.processingTime || 0,
    source: roiResult.source,
    cacheAge: roiResult.cacheAge || 0,
    dateRange: data.dateRange || null
  };
}

/**
 * 💎 ROI-Wert nach Minter gruppieren
 */
export function groupROIByMinter(roiData) {
  if (!roiData?.roiTransactions) {
    return {};
  }

  const grouped = {};
  
  roiData.roiTransactions.forEach(tx => {
    const minter = tx.minter;
    if (!grouped[minter]) {
      grouped[minter] = {
        name: tx.minterName,
        transactions: [],
        tokens: new Set(),
        totalTransactions: 0
      };
    }
    
    grouped[minter].transactions.push(tx);
    grouped[minter].tokens.add(tx.token);
    grouped[minter].totalTransactions++;
  });

  // Convert Sets to arrays
  Object.keys(grouped).forEach(minter => {
    grouped[minter].tokens = Array.from(grouped[minter].tokens);
    grouped[minter].uniqueTokens = grouped[minter].tokens.length;
  });

  return grouped;
}

/**
 * 🏆 Top ROI Tokens ermitteln
 */
export function getTopROITokens(roiData, limit = 10) {
  if (!roiData?.roiTransactions) {
    return [];
  }

  // Gruppiere nach Token
  const tokenMap = {};
  
  roiData.roiTransactions.forEach(tx => {
    const token = tx.token;
    if (!tokenMap[token]) {
      tokenMap[token] = {
        token,
        tokenAddress: tx.tokenAddress,
        totalAmount: 0,
        transactionCount: 0,
        minters: new Set(),
        latestReceived: null
      };
    }
    
    tokenMap[token].totalAmount += tx.amount;
    tokenMap[token].transactionCount++;
    tokenMap[token].minters.add(tx.minterName);
    
    const txDate = new Date(tx.timestamp);
    if (!tokenMap[token].latestReceived || txDate > new Date(tokenMap[token].latestReceived)) {
      tokenMap[token].latestReceived = tx.timestamp;
    }
  });

  // Convert to array and sort by transaction count
  const tokens = Object.values(tokenMap)
    .map(token => ({
      ...token,
      minters: Array.from(token.minters),
      uniqueMinters: token.minters.size
    }))
    .sort((a, b) => b.transactionCount - a.transactionCount)
    .slice(0, limit);

  return tokens;
}

/**
 * 📅 ROI Timeline erstellen
 */
export function createROITimeline(roiData, groupBy = 'month') {
  if (!roiData?.roiTransactions) {
    return [];
  }

  const timeline = {};
  
  roiData.roiTransactions.forEach(tx => {
    const date = new Date(tx.timestamp);
    let key;
    
    switch (groupBy) {
      case 'day':
        key = date.toISOString().split('T')[0];
        break;
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
        break;
      case 'month':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        break;
      case 'year':
        key = date.getFullYear().toString();
        break;
      default:
        key = date.toISOString().split('T')[0];
    }
    
    if (!timeline[key]) {
      timeline[key] = {
        period: key,
        transactions: [],
        count: 0,
        tokens: new Set(),
        minters: new Set()
      };
    }
    
    timeline[key].transactions.push(tx);
    timeline[key].count++;
    timeline[key].tokens.add(tx.token);
    timeline[key].minters.add(tx.minterName);
  });

  // Convert to array and format
  return Object.values(timeline)
    .map(period => ({
      ...period,
      tokens: Array.from(period.tokens),
      minters: Array.from(period.minters),
      uniqueTokens: period.tokens.size,
      uniqueMinters: period.minters.size
    }))
    .sort((a, b) => a.period.localeCompare(b.period));
}

// 🔧 UTILITY: Format ROI für UI
export function formatROIForDisplay(roiData, options = {}) {
  const { sortBy = 'date', filterMinter = null, limit = null } = options;
  
  if (!roiData?.roiTransactions) {
    return [];
  }

  let filtered = roiData.roiTransactions;
  
  // Filter nach Minter wenn gewünscht
  if (filterMinter) {
    filtered = filtered.filter(tx => tx.minter.toLowerCase() === filterMinter.toLowerCase());
  }

  // Sortierung
  switch (sortBy) {
    case 'date':
      filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      break;
    case 'amount':
      filtered.sort((a, b) => b.amount - a.amount);
      break;
    case 'token':
      filtered.sort((a, b) => a.token.localeCompare(b.token));
      break;
    case 'minter':
      filtered.sort((a, b) => a.minterName.localeCompare(b.minterName));
      break;
    default:
      // Keine Sortierung
      break;
  }

  // Limit anwenden
  if (limit && limit > 0) {
    filtered = filtered.slice(0, limit);
  }

  return filtered;
}

export default {
  getOrLoadROI,
  clearROICache,
  getROIStats,
  groupROIByMinter,
  getTopROITokens,
  createROITimeline,
  formatROIForDisplay
}; 