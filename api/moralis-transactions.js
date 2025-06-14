//🚀 MORALIS TRANSACTIONS API - PRO COMPATIBLE (FIXED)
// Endpoint: POST /api/moralis-transactions
// Purpose: Load ERC20 transfers for tax reporting
// Compatible with Pro Plan using separate API calls

const MORALIS_API_KEY = process.env.MORALIS_API_KEY;
const MORALIS_BASE_URL = 'https://deep-index.moralis.io/api/v2';

/**
 * Helper to fetch data from Moralis REST API with improved error handling
 */
async function moralisFetch(endpoint, params = {}) {
  try {
    const url = new URL(`${MORALIS_BASE_URL}/${endpoint}`);
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null) {
        url.searchParams.append(key, val);
      }
    });

    console.log(`🚀 MORALIS FETCH: ${url.toString()}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
    
    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'X-API-Key': MORALIS_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`❌ MORALIS API ERROR: ${res.status} - ${res.statusText}`);
      console.error(`❌ ERROR DETAILS: ${errorText}`);
      return null;
    }

    const jsonData = await res.json();
    console.log(`✅ MORALIS SUCCESS: ${endpoint} returned ${jsonData?.result?.length || 0} items`);
    return jsonData;

  } catch (error) {
    console.error(`💥 MORALIS FETCH EXCEPTION: ${error.message}`);
    return null;
  }
}

/**
 * 🎯 TRANSACTIONS API - Load ERC20 transfers for tax reporting (FIXED)
 */
export default async function handler(req, res) {
  console.log('🔵 MORALIS TRANSACTIONS API: Starting request processing');
  
  try {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // API Key validation
    if (!MORALIS_API_KEY || MORALIS_API_KEY === 'YOUR_MORALIS_API_KEY_HERE') {
      console.error('🚨 MORALIS API KEY MISSING');
      return res.status(503).json({ 
        error: 'Moralis API Key missing or invalid.',
        _pro_mode: true,
        _debug: 'Check MORALIS_API_KEY environment variable'
      });
    }

    // Extract parameters with better handling
    const params = req.method === 'POST' ? { ...req.query, ...req.body } : req.query;
    const { 
      address, 
      chain = 'pulsechain', 
      limit = 100, 
      cursor,
      from_date,
      to_date
    } = params;

    console.log('🔵 TRANSACTIONS PARAMS:', { 
      chain, 
      address: address ? address.slice(0, 8) + '...' : 'MISSING', 
      limit,
      hasCursor: !!cursor,
      hasDateRange: !!(from_date && to_date)
    });

    if (!address) {
      return res.status(400).json({ 
        error: 'Missing address parameter.',
        usage: 'POST /api/moralis-transactions with address, chain, limit',
        received: params
      });
    }

    // Convert chain names to Moralis chain IDs
    const chainMap = {
      ethereum: '0x1',
      eth: '0x1', 
      '1': '0x1',
      '0x1': '0x1',
      pulsechain: '0x171',
      pls: '0x171',
      '369': '0x171',
      '0x171': '0x171',
      bsc: '0x38',
      polygon: '0x89',
      arbitrum: '0xa4b1'
    };
    
    const chainId = chainMap[chain.toLowerCase()] || chain;
    console.log(`🔵 CHAIN MAPPING: ${chain} -> ${chainId}`);

    // Build Moralis API parameters - KLEINERE PAGES für Stabilität
    const moralisParams = { 
      chain: chainId,
      limit: Math.min(parseInt(limit) || 50, 50) // Max 50 per request (reduziert von 100)
    };

    // Add optional parameters
    if (cursor) moralisParams.cursor = cursor;
    if (from_date) moralisParams.from_date = from_date;
    if (to_date) moralisParams.to_date = to_date;
    
    console.log(`🔧 PAGE SIZE: Limited to ${moralisParams.limit} items per request for stability`);

    // Load ERC20 transfers from Moralis
    console.log(`🚀 FETCHING TRANSFERS: ${address} on ${chainId}`);
    
    const result = await moralisFetch(`${address}/erc20/transfers`, moralisParams);
    
    if (!result) {
      console.warn(`⚠️ NO TRANSFER DATA: Returning empty result for ${address}`);
      return res.status(200).json({
        result: [],
        cursor: null,
        page: 0,
        page_size: parseInt(limit) || 100,
        total: 0,
        _source: 'moralis_v2_pro_transactions_empty',
        _chain: chainId,
        _address: address,
        _warning: 'No transfer data available or API error'
      });
    }

    // Successful response
    const transferCount = result.result?.length || 0;
    console.log(`✅ TRANSFERS LOADED: ${transferCount} transfers for ${address}`);

    return res.status(200).json({
      ...result,
      _source: 'moralis_v2_pro_transactions_success',
      _chain: chainId,
      _address: address,
      _timestamp: new Date().toISOString(),
      _count: transferCount
    });

  } catch (error) {
    console.error('💥 TRANSACTIONS API CRITICAL ERROR:', error);
    console.error('💥 ERROR STACK:', error.stack);
    
    // Return graceful error response to prevent tax report crash
    return res.status(200).json({
      result: [],
      cursor: null,
      page: 0,
      page_size: 100,
      total: 0,
      _source: 'moralis_v2_pro_transactions_error',
      _error: error.message,
      _stack: error.stack,
      _timestamp: new Date().toISOString(),
      _debug: 'Check server logs for details'
    });
  }
} 