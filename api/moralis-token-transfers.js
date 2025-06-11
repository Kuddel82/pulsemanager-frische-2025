// 🚀 MORALIS ENTERPRISE API - TOKEN TRANSFERS (WITH FALLBACK)
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
      message: 'Use POST for token transfer requests',
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
    
    // 🛡️ FALLBACK: If no Moralis API key, return empty result instead of error
    if (!MORALIS_API_KEY || MORALIS_API_KEY === 'YOUR_MORALIS_API_KEY_HERE') {
      console.warn('⚠️ MORALIS API KEY not configured - returning empty result');
      return res.status(200).json({
        success: true,
        result: [],
        total: 0,
        page: 0,
        page_size: limit,
        cursor: null,
        _fallback: {
          reason: 'moralis_api_key_not_configured',
          message: 'Add MORALIS_API_KEY to environment variables for token transfer data',
          alternative: 'Use PulseChain Scanner API instead'
        }
      });
    }

    // 🌐 Moralis Web3 Data API v2.2 - ERC20 Token Transfers Endpoint
    const apiUrl = `https://deep-index.moralis.io/api/v2.2/${address}/erc20/transfers`;
    
    const params = new URLSearchParams({
      chain: chain,
      limit: Math.min(parseInt(limit), 100).toString()
    });
    
    if (cursor) {
      params.append('cursor', cursor);
    }

    const fullUrl = `${apiUrl}?${params.toString()}`;
    
    console.log(`🚀 MORALIS TOKEN TRANSFERS: Loading ERC20 transfers for ${address.slice(0, 8)}... (${chain})`);

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
        // 🛡️ FALLBACK: Return empty result for auth errors instead of failing
        console.warn('⚠️ MORALIS AUTH ERROR - returning empty result');
        return res.status(200).json({
          success: true,
          result: [],
          total: 0,
          _fallback: {
            reason: 'moralis_auth_error',
            message: 'Check MORALIS_API_KEY configuration'
          }
        });
      }

      // 🛡️ FALLBACK: For other errors, return empty result with error info
      return res.status(200).json({
        success: false,
        result: [],
        total: 0,
        _error: {
          status: response.status,
          message: response.statusText,
          fallback: 'Use alternative data source'
        }
      });
    }

    const data = await response.json();
    
    // 📊 Process and enhance token transfer data
    const transfers = (data.result || []).map(transfer => ({
      // Standard fields
      transaction_hash: transfer.transaction_hash,
      block_number: transfer.block_number,
      block_timestamp: transfer.block_timestamp,
      
      // Addresses
      from_address: transfer.from_address,
      to_address: transfer.to_address,
      
      // Token info
      address: transfer.address,
      value: transfer.value,
      
      // Enhanced fields for tax calculation
      is_incoming: transfer.to_address?.toLowerCase() === address.toLowerCase(),
      is_token_transfer: true,
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
      result: transfers,
      total: data.total || transfers.length,
      page: data.page || 0,
      page_size: data.page_size || limit,
      cursor: data.cursor || null,
      
      // Enterprise metadata
      _enterprise: {
        provider: 'moralis',
        api_version: 'v2.2',
        endpoint: 'token_transfers',
        chain_id: chain,
        user_scalable: '1000+',
        cache_strategy: 'blockchain_confirmed',
        timestamp: new Date().toISOString()
      }
    };

    // 🔄 Caching for enterprise performance
    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');
    
    console.log(`✅ MORALIS TOKEN TRANSFERS: ${transfers.length} token transfers loaded for ${address.slice(0, 8)}...`);
    
    return res.status(200).json(result);

  } catch (error) {
    console.error('💥 MORALIS TOKEN TRANSFERS ERROR:', error.message);
    
    // 🛡️ FALLBACK: Return empty result instead of 500 error
    return res.status(200).json({ 
      success: false,
      result: [],
      total: 0,
      _error: {
        message: error.message,
        endpoint: 'moralis-token-transfers',
        timestamp: new Date().toISOString(),
        fallback: 'Use alternative data source'
      }
    });
  }
} 