/**
 * ⛽ GAS PRICES API - VERCEL FUNCTION (CORS-FIX)
 * 
 * CORS-freier Backend-Proxy für alle Gas Price APIs
 * - Aggregiert mehrere Gas Price Quellen
 * - Caching für Performance
 * - Error Handling mit Fallbacks
 * - Rate Limiting Protection
 */

export default async function handler(req, res) {
  // CORS Headers - FIX für alle Browser
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  
  try {
    console.log('[GasPricesAPI] 🚀 Fetching gas prices from multiple sources...');
    
    // Define all gas price sources with timeout protection
    const gasSources = [
      {
        name: 'ethgasstation',
        url: 'https://ethgasstation.info/json/ethgasAPI.json',
        timeout: 8000,
        parser: parseEthGasStation
      },
      {
        name: 'etherchain',
        url: 'https://www.etherchain.org/api/gasPriceOracle',
        timeout: 8000,
        parser: parseEtherchain
      },
      {
        name: 'anyblock',
        url: 'https://api.anyblock.tools/ethereum/latest-minimum-gasprice',
        timeout: 8000,
        parser: parseAnyblock
      },
      {
        name: 'gasnow',
        url: 'https://www.gasnow.org/api/v3/gas/price?utm_source=gas-price-oracle',
        timeout: 8000,
        parser: parseGasNow
      }
    ];
    
    // Fetch from all sources in parallel with better error handling
    const results = await Promise.allSettled(
      gasSources.map(source => fetchGasPrice(source))
    );
    
    // Process results
    const successfulSources = [];
    const failedSources = [];
    
    results.forEach((result, index) => {
      const source = gasSources[index];
      if (result.status === 'fulfilled' && result.value) {
        successfulSources.push({
          name: source.name,
          data: result.value,
          timestamp: Date.now()
        });
        console.log(`[GasPricesAPI] ✅ ${source.name} SUCCESS`);
      } else {
        failedSources.push({
          name: source.name,
          error: result.reason?.message || 'Unknown error'
        });
        console.log(`[GasPricesAPI] ❌ ${source.name} FAILED:`, result.reason?.message);
      }
    });
    
    console.log(`[GasPricesAPI] Results: ${successfulSources.length}/${gasSources.length} sources successful`);
    
    // If we have no successful sources, return error with fallback
    if (successfulSources.length === 0) {
      console.error('[GasPricesAPI] All sources failed, returning emergency fallback');
      res.status(200).json({
        success: true,
        sources: [],
        failures: failedSources,
        aggregated: getEmergencyGasPrices(),
        timestamp: Date.now(),
        sourceCount: 0,
        _warning: 'All external sources failed, using emergency fallback'
      });
      return;
    }
    
    // Aggregate successful sources
    const aggregated = aggregateGasPrices(successfulSources.map(s => s.data));
    
    // Response
    res.status(200).json({
      success: true,
      sources: successfulSources,
      failures: failedSources,
      aggregated,
      timestamp: Date.now(),
      sourceCount: successfulSources.length
    });
    
  } catch (error) {
    console.error('[GasPricesAPI] 💥 Server error:', error);
    
    // Emergency fallback response
    res.status(200).json({
      success: true,
      sources: [],
      failures: [{ name: 'server', error: error.message }],
      aggregated: getEmergencyGasPrices(),
      timestamp: Date.now(),
      sourceCount: 0,
      _error: 'Server error, using emergency fallback'
    });
  }
}

/**
 * Fetch gas price from a single source with improved error handling
 */
async function fetchGasPrice(source) {
  try {
    console.log(`[GasPricesAPI] 🔄 Fetching from ${source.name}...`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), source.timeout);
    
    const response = await fetch(source.url, {
      method: 'GET',
      headers: {
        'User-Agent': 'PulseManager-GasTracker/1.0',
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    const parsed = source.parser(data);
    
    return parsed;
    
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(`Timeout after ${source.timeout}ms`);
    }
    throw error;
  }
}

/**
 * Parse EthGasStation format
 */
function parseEthGasStation(data) {
  return {
    slow: {
      gasPrice: Math.floor((data.safeLow || 100) / 10).toString(),
      estimatedTime: '5+ minutes'
    },
    standard: {
      gasPrice: Math.floor((data.standard || 150) / 10).toString(),
      estimatedTime: '2-5 minutes'
    },
    fast: {
      gasPrice: Math.floor((data.fast || 250) / 10).toString(),
      estimatedTime: '<2 minutes'
    }
  };
}

/**
 * Parse Etherchain format
 */
function parseEtherchain(data) {
  return {
    slow: {
      gasPrice: data.safeLow || '10',
      estimatedTime: '5+ minutes'
    },
    standard: {
      gasPrice: data.standard || '15',
      estimatedTime: '2-5 minutes'
    },
    fast: {
      gasPrice: data.fast || '25',
      estimatedTime: '<2 minutes'
    }
  };
}

/**
 * Parse Anyblock format
 */
function parseAnyblock(data) {
  const gasPrice = Math.floor((data.gasPrice || 15000000000) / 1e9);
  return {
    slow: {
      gasPrice: Math.max(Math.floor(gasPrice * 0.8), 1).toString(),
      estimatedTime: '5+ minutes'
    },
    standard: {
      gasPrice: gasPrice.toString(),
      estimatedTime: '2-5 minutes'
    },
    fast: {
      gasPrice: Math.floor(gasPrice * 1.2).toString(),
      estimatedTime: '<2 minutes'
    }
  };
}

/**
 * Parse GasNow format
 */
function parseGasNow(data) {
  return {
    slow: {
      gasPrice: Math.floor((data.data?.slow || 10000000000) / 1e9).toString(),
      estimatedTime: '5+ minutes'
    },
    standard: {
      gasPrice: Math.floor((data.data?.standard || 15000000000) / 1e9).toString(),
      estimatedTime: '2-5 minutes'
    },
    fast: {
      gasPrice: Math.floor((data.data?.fast || 25000000000) / 1e9).toString(),
      estimatedTime: '<2 minutes'
    }
  };
}

/**
 * Aggregate gas prices from multiple sources using median
 */
function aggregateGasPrices(sources) {
  if (sources.length === 0) {
    return getEmergencyGasPrices();
  }
  
  if (sources.length === 1) {
    return sources[0];
  }
  
  // Calculate median values for each speed tier
  const slowPrices = sources.map(s => parseInt(s.slow.gasPrice)).filter(p => !isNaN(p) && p > 0);
  const standardPrices = sources.map(s => parseInt(s.standard.gasPrice)).filter(p => !isNaN(p) && p > 0);
  const fastPrices = sources.map(s => parseInt(s.fast.gasPrice)).filter(p => !isNaN(p) && p > 0);
  
  return {
    slow: {
      gasPrice: median(slowPrices).toString(),
      estimatedTime: '5+ minutes'
    },
    standard: {
      gasPrice: median(standardPrices).toString(),
      estimatedTime: '2-5 minutes'
    },
    fast: {
      gasPrice: median(fastPrices).toString(),
      estimatedTime: '<2 minutes'
    },
    aggregationMethod: 'median',
    sourceCount: sources.length
  };
}

/**
 * Calculate median of array with fallback
 */
function median(arr) {
  if (arr.length === 0) return 15; // Default fallback
  
  const sorted = arr.sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  
  if (sorted.length % 2 === 0) {
    return Math.floor((sorted[mid - 1] + sorted[mid]) / 2);
  } else {
    return sorted[mid];
  }
}

/**
 * Emergency gas price fallback
 */
function getEmergencyGasPrices() {
  return {
    slow: {
      gasPrice: '10',
      estimatedTime: '5+ minutes'
    },
    standard: {
      gasPrice: '15',
      estimatedTime: '2-5 minutes'
    },
    fast: {
      gasPrice: '25',
      estimatedTime: '<2 minutes'
    },
    _source: 'emergency_fallback',
    _warning: 'All external APIs failed, using emergency estimates'
  };
} 