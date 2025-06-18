// 🚨 EMERGENCY TRANSACTIONS FIX
// Sofortige Lösung für das 0-Transaktionen-Problem
// Funktioniert für ALLE Wallets, nicht nur WGEP

const MORALIS_API_KEY = process.env.MORALIS_API_KEY;
const MORALIS_BASE_URL = 'https://deep-index.moralis.io/api/v2.2';

/**
 * 🚨 EMERGENCY MORALIS FETCH
 */
async function emergencyMoralisFetch(endpoint, params = {}) {
  try {
    const url = `${MORALIS_BASE_URL}/${endpoint}`;
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value);
      }
    });
    
    const fullUrl = `${url}?${queryParams.toString()}`;
    
    console.log(`🚨 EMERGENCY REQUEST: ${endpoint} with ${Object.keys(params).length} params`);
    
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'X-API-Key': MORALIS_API_KEY,
        'Accept': 'application/json'
      },
      timeout: 30000
    });
    
    if (!response.ok) {
      console.error(`❌ EMERGENCY API ERROR: ${response.status} ${response.statusText}`);
      return null;
    }
    
    const data = await response.json();
    return data;
    
  } catch (error) {
    console.error(`💥 EMERGENCY FETCH EXCEPTION: ${error.message}`);
    return null;
  }
}

/**
 * 🚨 EMERGENCY TRANSACTIONS API
 */
export default async function handler(req, res) {
  console.log('🚨 EMERGENCY TRANSACTIONS API: Starting emergency fix...');
  
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
        _debug: 'Check MORALIS_API_KEY environment variable'
      });
    }

    // Extract parameters
    const params = req.method === 'POST' ? { ...req.query, ...req.body } : req.query;
    const { 
      address, 
      chain = 'pulsechain', 
      limit = 100, 
      cursor,
      from_date,
      to_date
    } = params;

    console.log('🚨 EMERGENCY PARAMS:', { 
      chain, 
      address: address ? address.slice(0, 8) + '...' : 'MISSING', 
      limit,
      hasCursor: !!cursor
    });

    if (!address) {
      return res.status(400).json({ 
        error: 'Missing address parameter.',
        usage: 'POST /api/emergency-transactions-fix with address, chain, limit',
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
    console.log(`🚨 EMERGENCY CHAIN MAPPING: ${chain} -> ${chainId}`);

    // 🚨 EMERGENCY: Load ERC20 transfers (ORIGINAL WORKING LOGIC)
    const moralisParams = { 
      chain: chainId,
      limit: Math.min(parseInt(limit) || 100, 100) // Back to original limit
    };

    if (cursor) moralisParams.cursor = cursor;
    if (from_date) moralisParams.from_date = from_date;
    if (to_date) moralisParams.to_date = to_date;
    
    console.log(`🚨 EMERGENCY: Loading transfers for ${address} on ${chainId}`);

    const result = await emergencyMoralisFetch(`${address}/erc20/transfers`, moralisParams);
    
    if (!result) {
      console.warn(`⚠️ EMERGENCY: No transfer data for ${address}`);
      return res.status(200).json({
        result: [],
        cursor: null,
        page: 0,
        page_size: parseInt(limit) || 100,
        total: 0,
        _source: 'emergency_transactions_fix_empty',
        _chain: chainId,
        _address: address,
        _warning: 'No transfer data available'
      });
    }

    // 🚨 EMERGENCY: Simple transaction processing (ORIGINAL LOGIC)
    const transferCount = result.result?.length || 0;
    
    console.log(`✅ EMERGENCY SUCCESS: ${transferCount} transfers for ${address}`);

    return res.status(200).json({
      ...result,
      _source: 'emergency_transactions_fix_success',
      _chain: chainId,
      _address: address,
      _timestamp: new Date().toISOString(),
      _count: transferCount,
      _emergency_fix: true
    });

  } catch (error) {
    console.error('💥 EMERGENCY TRANSACTIONS API CRITICAL ERROR:', error);
    
    return res.status(200).json({
      result: [],
      cursor: null,
      page: 0,
      page_size: 100,
      total: 0,
      _source: 'emergency_transactions_fix_error',
      _error: error.message,
      _timestamp: new Date().toISOString()
    });
  }
} 