// 🚀 MORALIS NATIVE TRANSACTIONS API 
// Holt native Transaktionen (PLS/ETH) für Tax/ROI Analysis

const MORALIS_API_KEY = process.env.MORALIS_API_KEY;
const MORALIS_BASE = 'https://deep-index.moralis.io/api/v2';

// 🌐 MORALIS API HELPER
async function moralisFetch(endpoint) {
  try {
    const res = await fetch(`${MORALIS_BASE}${endpoint}`, {
      headers: {
        'X-API-Key': MORALIS_API_KEY
      }
    });
    
    if (!res.ok) {
      console.error(`❌ Moralis error ${res.status}: ${endpoint}`);
      return null;
    }
    
    return await res.json();
  } catch (error) {
    console.error('❌ Moralis fetch error:', error.message);
    return null;
  }
}

//🚀 MORALIS TRANSACTIONS API - PRO COMPATIBLE
// Endpoint: POST /api/moralis-transactions
// Purpose: Load ERC20 transfers for tax reporting
// Compatible with Pro Plan using separate API calls

const MORALIS_API_KEY = process.env.MORALIS_API_KEY;
const MORALIS_BASE_URL = 'https://deep-index.moralis.io/api/v2';

/**
 * Helper to fetch data from Moralis REST API
 */
async function moralisFetch(endpoint, params = {}) {
  const url = new URL(`${MORALIS_BASE_URL}/${endpoint}`);
  Object.entries(params).forEach(([key, val]) => url.searchParams.append(key, val));

  const res = await fetch(url.toString(), {
    headers: {
      'X-API-Key': MORALIS_API_KEY
    }
  });

  if (!res.ok) {
    console.error(`Moralis Error: ${res.status} - ${res.statusText}`);
    return null;
  }

  return await res.json();
}

/**
 * 🎯 TRANSACTIONS API - Load ERC20 transfers for tax reporting
 */
export default async function handler(req, res) {
  console.log('🔵 MORALIS TRANSACTIONS: Loading ERC20 transfers for tax reporting');
  
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (!MORALIS_API_KEY || MORALIS_API_KEY === 'YOUR_MORALIS_API_KEY_HERE') {
    return res.status(503).json({ 
      error: 'Moralis API Key missing or invalid.',
      _pro_mode: true 
    });
  }

  // Extract parameters
  const params = req.method === 'POST' ? { ...req.query, ...req.body } : req.query;
  const { address, chain = 'pulsechain', limit = 100, cursor } = params;

  console.log('🔵 TRANSACTIONS PARAMS:', { chain, address: address?.slice(0, 8) + '...', limit });

  if (!address) {
    return res.status(400).json({ 
      error: 'Missing address parameter.',
      usage: 'POST /api/moralis-transactions with address, chain, limit'
    });
  }

  // Convert chain names to Moralis format
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

  console.log(`🔵 TRANSACTIONS CHAIN MAPPING: ${chain} -> ${chainId}`);

  try {
    // Load ERC20 transfers from Moralis
    console.log(`🚀 PRO TRANSACTIONS: Loading transfers for ${address} on ${chainId}`);
    
    const result = await moralisFetch(`${address}/erc20/transfers`, { 
      chain: chainId,
      limit: Math.min(limit, 100),
      cursor: cursor
    });
    
    if (!result) {
      console.warn(`⚠️ PRO TRANSACTIONS: No transfer data for ${address}, returning empty array`);
      return res.status(200).json({
        result: [],
        cursor: null,
        page: 0,
        page_size: limit,
        total: 0,
        _source: 'moralis_v2_pro_transactions_empty'
      });
    }

    console.log(`✅ PRO TRANSACTIONS: ${result.result?.length || 0} transfers loaded`);

    return res.status(200).json({
      ...result,
      _source: 'moralis_v2_pro_transactions',
      _chain: chainId,
      _address: address
    });

  } catch (error) {
    console.error('💥 PRO TRANSACTIONS ERROR:', error.message);
    
    // Return empty array instead of error to prevent tax report crash
    return res.status(200).json({
      result: [],
      cursor: null,
      page: 0,
      page_size: limit,
      total: 0,
      _source: 'moralis_v2_pro_transactions_error',
      _error: error.message
    });
  }
} 