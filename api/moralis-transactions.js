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

export default async function handler(req, res) {
  console.log('🚀 MORALIS TRANSACTIONS API: Request received');
  
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed. Use POST.',
      allowedMethods: ['POST']
    });
  }

  const { address, chain = '0x171', limit = 100 } = req.body;

  // Validation
  if (!address) {
    return res.status(400).json({ 
      error: 'Wallet-Adresse fehlt',
      usage: 'POST { "address": "0x...", "chain": "0x171", "limit": 100 }'
    });
  }

  if (!MORALIS_API_KEY || MORALIS_API_KEY === 'YOUR_MORALIS_API_KEY_HERE') {
    return res.status(503).json({ 
      error: 'Moralis API Key nicht konfiguriert'
    });
  }

  // Chain mapping
  const chainMap = {
    '0x171': '0x171', // PulseChain
    '0x1': '0x1',     // Ethereum
    'pulsechain': '0x171',
    'ethereum': '0x1',
    'eth': '0x1',
    'pls': '0x171'
  };
  const normalizedChain = chainMap[chain.toLowerCase()] || chain;

  try {
    console.log(`🚀 Loading native transactions for ${address} on chain ${normalizedChain}`);

    // 🚀 Get native transactions via Moralis
    const endpoint = `/${address}?chain=${normalizedChain}&limit=${Math.min(limit, 500)}`;
    const data = await moralisFetch(endpoint);
    
    if (!data?.result) {
      return res.status(404).json({ 
        success: false,
        error: 'Keine native Transaktionen gefunden',
        address,
        chain: normalizedChain
      });
    }

    console.log(`📊 Found ${data.result.length} native transactions`);

    // 🚀 Process transactions for TaxService compatibility
    let transactions = [];
    
    try {
      if (data && data.result && Array.isArray(data.result)) {
        transactions = data.result.map(tx => {
          try {
            return {
              // Standard fields with safe defaults
              hash: tx.hash || '',
              block_number: tx.block_number || 0,
              block_timestamp: tx.block_timestamp || new Date().toISOString(),
              
              // Addresses with safe defaults  
              from_address: tx.from_address || '',
              to_address: tx.to_address || '',
              
              // Value
              value: tx.value || '0',
              
              // Enhanced fields for tax calculation
              is_incoming: (tx.to_address || '').toLowerCase() === address.toLowerCase(),
              is_native_transaction: true,
              chain_id: normalizedChain,
              
              // Gas info
              gas: tx.gas || '0',
              gas_price: tx.gas_price || '0',
              receipt_gas_used: tx.receipt_gas_used || '0',
              
              // Metadata
              _moralis: {
                api_version: 'v2.2',
                data_source: 'enterprise',
                processed_at: new Date().toISOString()
              }
            };
          } catch (transactionError) {
            console.error('💥 TRANSACTION PROCESSING ERROR (skipping item):', transactionError.message);
            return null;
          }
        }).filter(tx => tx !== null); // Remove failed items
      }
    } catch (processingError) {
      console.error('💥 DATA PROCESSING ERROR (returning empty result):', processingError.message);
      transactions = [];
    }

    console.log(`✅ Processed ${transactions.length} native transactions successfully`);

    return res.status(200).json({
      success: true,
      result: transactions,
      total: transactions.length,
      address,
      chain: normalizedChain,
      source: 'moralis_native_transactions',
      apiInfo: {
        endpoint: 'moralis-transactions',
        version: '1.0',
        processed_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('💥 MORALIS TRANSACTIONS ERROR:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      address,
      chain: normalizedChain
    });
  }
} 