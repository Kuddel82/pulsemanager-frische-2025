// 🚀 MORALIS ENTERPRISE API - NATIVE TRANSACTIONS
// Professional Web3 Data API v2.2 für PulseManager - 1000+ User Ready

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Nur POST für bessere Parameter-Übergabe
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'Use POST for transaction requests',
      required: { address: 'string', chain: 'string', cursor?: 'string', limit?: 'number' }
    });
  }

  try {
    const { address, chain = '0x171', cursor, limit = 100 } = req.body;

    // Validierung
    if (!address) {
      return res.status(400).json({ 
        error: 'Missing required parameter',
        required: { address: 'Wallet address required' }
      });
    }

    // Moralis Enterprise Configuration
    const MORALIS_API_KEY = process.env.MORALIS_API_KEY;
    
    if (!MORALIS_API_KEY) {
      return res.status(500).json({ 
        error: 'Server configuration error',
        message: 'Moralis API key not configured'
      });
    }

    // 🌐 Moralis Web3 Data API v2.2 - Native Transactions Endpoint
    const apiUrl = `https://deep-index.moralis.io/api/v2.2/${address}`;
    
    const params = new URLSearchParams({
      chain: chain,
      limit: Math.min(parseInt(limit), 100).toString()
    });
    
    if (cursor) {
      params.append('cursor', cursor);
    }

    const fullUrl = `${apiUrl}?${params.toString()}`;
    
    console.log(`🚀 MORALIS TRANSACTIONS: Loading native transactions for ${address.slice(0, 8)}... (${chain})`);

    // 📡 Moralis Enterprise API Call
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'X-API-Key': MORALIS_API_KEY,
        'Accept': 'application/json',
        'User-Agent': 'PulseManager-Enterprise/1.0'
      }
    });

    if (!response.ok) {
      console.error(`❌ Moralis API Error: ${response.status} - ${response.statusText}`);
      
      if (response.status === 429) {
        return res.status(429).json({ 
          error: 'Rate limit exceeded',
          retryAfter: response.headers.get('retry-after') || '60',
          enterprise: 'Upgrade to higher tier for 1000+ users'
        });
      }

      if (response.status === 401) {
        return res.status(401).json({ 
          error: 'Authentication failed',
          message: 'Invalid Moralis API key'
        });
      }

      return res.status(response.status).json({ 
        error: `Moralis API Error`,
        status: response.status,
        message: response.statusText 
      });
    }

    const data = await response.json();
    
    // 📊 Process and enhance transaction data
    const transactions = (data.result || []).map(tx => ({
      // Standard fields
      hash: tx.hash,
      block_number: tx.block_number,
      block_timestamp: tx.block_timestamp,
      
      // Addresses
      from_address: tx.from_address,
      to_address: tx.to_address,
      
      // Value (native currency)
      value: tx.value,
      gas: tx.gas,
      gas_price: tx.gas_price,
      receipt_gas_used: tx.receipt_gas_used,
      
      // Status
      receipt_status: tx.receipt_status,
      
      // Enhanced fields for tax calculation
      is_incoming: tx.to_address?.toLowerCase() === address.toLowerCase(),
      is_native: true,
      chain_id: chain,
      
      // Metadata
      _moralis: {
        api_version: 'v2.2',
        data_source: 'enterprise',
        processed_at: new Date().toISOString()
      }
    }));

    // 📈 Response with enterprise metadata
    const result = {
      success: true,
      result: transactions,
      total: data.total || transactions.length,
      page: data.page || 0,
      page_size: data.page_size || limit,
      cursor: data.cursor || null,
      
      // Enterprise metadata
      _enterprise: {
        provider: 'moralis',
        api_version: 'v2.2',
        endpoint: 'native_transactions',
        chain_id: chain,
        user_scalable: '1000+',
        cache_strategy: 'blockchain_confirmed',
        timestamp: new Date().toISOString()
      }
    };

    // 🔄 Caching for enterprise performance
    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');
    
    console.log(`✅ MORALIS TRANSACTIONS: ${transactions.length} native transactions loaded for ${address.slice(0, 8)}...`);
    
    return res.status(200).json(result);

  } catch (error) {
    console.error('💥 MORALIS TRANSACTIONS ERROR:', error.message);
    
    return res.status(500).json({ 
      error: 'Transaction loading failed',
      message: error.message,
      endpoint: 'moralis-transactions',
      timestamp: new Date().toISOString()
    });
  }
} 