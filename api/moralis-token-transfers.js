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
    // 🔒 SAFE JSON PARSING: Prevent crashes
    let requestData = {};
    
    try {
      requestData = req.body || {};
    } catch (parseError) {
      console.error('💥 JSON PARSE ERROR:', parseError);
      return res.status(400).json({ 
        error: 'Invalid JSON in request body',
        message: parseError.message
      });
    }

    const { address, chain = '0x171', cursor, limit = 100 } = requestData;

    // 🛡️ IMPROVED VALIDATION
    if (!address || typeof address !== 'string') {
      return res.status(400).json({ 
        error: 'Missing or invalid address parameter',
        required: { address: 'Valid wallet address string required' },
        received: { address: typeof address }
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

    // 🌐 CHAIN NORMALIZATION: Handle different chain formats
    let normalizedChain = chain;
    if (chain === '369' || chain === 'pulsechain' || chain === 'pls') {
      normalizedChain = '0x171';
    } else if (chain === '1' || chain === 'ethereum' || chain === 'eth') {
      normalizedChain = '0x1';
    }

    // 🌐 Moralis Web3 Data API v2.2 - ERC20 Token Transfers Endpoint
    const apiUrl = `https://deep-index.moralis.io/api/v2.2/${address}/erc20/transfers`;
    
    const params = new URLSearchParams({
      chain: normalizedChain,
      limit: Math.min(parseInt(limit) || 100, 100).toString()
    });
    
    if (cursor && typeof cursor === 'string') {
      params.append('cursor', cursor);
    }

    const fullUrl = `${apiUrl}?${params.toString()}`;
    
    console.log(`🚀 MORALIS TOKEN TRANSFERS: Loading ERC20 transfers for ${address.slice(0, 8)}... (${normalizedChain})`);

    // 📡 Moralis Enterprise API Call with timeout
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'X-API-Key': MORALIS_API_KEY,
        'Accept': 'application/json',
        'User-Agent': 'PulseManager-Enterprise/1.0'
      },
      timeout: 30000
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

    // 🔒 SAFE JSON PARSING: Handle malformed responses
    let data = {};
    try {
      const text = await response.text();
      data = JSON.parse(text);
    } catch (jsonError) {
      console.error('💥 MORALIS RESPONSE JSON ERROR:', jsonError);
      return res.status(200).json({
        success: false,
        result: [],
        total: 0,
        _error: {
          message: 'Invalid JSON response from Moralis API',
          raw_response_length: jsonError.toString().length,
          fallback: 'Use alternative data source'
        }
      });
    }
    
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
    console.error('💥 MORALIS TOKEN TRANSFERS CRITICAL ERROR:', error.message);
    console.error('💥 ERROR STACK:', error.stack);
    
    // 🛡️ ABSOLUTE FALLBACK: NEVER return 500 error - always return 200 with error info
    return res.status(200).json({ 
      success: false,
      result: [],
      total: 0,
      page: 0,
      page_size: 100,
      cursor: null,
      _critical_error: {
        message: error.message || 'Unknown error',
        name: error.name || 'Error',
        endpoint: 'moralis-token-transfers',
        timestamp: new Date().toISOString(),
        fallback: 'System will continue with empty transaction data',
        request_debug: {
          hasBody: !!req.body,
          method: req.method,
          userAgent: req.headers['user-agent'] || 'unknown'
        }
      }
    });
  }
} 