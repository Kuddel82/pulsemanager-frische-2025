// 🚀 MORALIS API PROXY - Professional Web3 Data Provider (WITH FALLBACK)
// Enterprise-grade APIs für PulseManager mit Rate Limiting & Fallbacks

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { endpoint, chain, address, addresses, cursor, limit } = req.query;

    // 🔑 Moralis API Configuration
    const MORALIS_API_KEY = process.env.MORALIS_API_KEY;
    const MORALIS_BASE_URL = process.env.MORALIS_BASE_URL || 'https://deep-index.moralis.io/api/v2.2';

    // 🛡️ FALLBACK: If no Moralis API key, return empty results
    if (!MORALIS_API_KEY || MORALIS_API_KEY === 'YOUR_MORALIS_API_KEY_HERE') {
      console.warn('⚠️ MORALIS TOKENS: API Key not configured - returning empty results');
      
      // Return empty results based on endpoint
      const emptyResult = {
        result: [],
        total: 0,
        page: 0,
        page_size: limit || 100,
        cursor: null,
        _fallback: {
          reason: 'moralis_api_key_not_configured',
          message: 'Add MORALIS_API_KEY to environment for token data',
          alternative: 'Use PulseChain Scanner API instead'
        }
      };
      
      return res.status(200).json(emptyResult);
    }

    // 🌐 Chain ID Mapping
    const chainIdMap = {
      'pulsechain': '0x171',
      'ethereum': '0x1',
      'pls': '0x171',
      'eth': '0x1'
    };

    const chainId = chainIdMap[chain?.toLowerCase()] || '0x171'; // Default PulseChain

    let apiUrl;
    let params = new URLSearchParams();

    // 📊 API Endpoint Routing
    switch (endpoint) {
      case 'wallet-tokens':
        // Token balances für eine Wallet
        if (!address) {
          return res.status(200).json({ 
            success: false,
            error: 'Address parameter required for wallet-tokens',
            _safe_mode: true
          });
        }
        apiUrl = `${MORALIS_BASE_URL}/${address}/erc20`;
        params.append('chain', chainId);
        if (cursor) params.append('cursor', cursor);
        if (limit) params.append('limit', Math.min(parseInt(limit), 100));
        break;

      case 'wallet-history':
        // Transaction history für eine Wallet
        if (!address) {
          return res.status(200).json({ 
            success: false,
            error: 'Address parameter required for wallet-history',
            _safe_mode: true
          });
        }
        apiUrl = `${MORALIS_BASE_URL}/${address}`;
        params.append('chain', chainId);
        if (cursor) params.append('cursor', cursor);
        if (limit) params.append('limit', Math.min(parseInt(limit), 100));
        break;

      case 'token-prices':
        // Bulk token price lookup
        if (!addresses) {
          return res.status(200).json({ 
            success: false,
            error: 'Addresses parameter required for token-prices',
            _safe_mode: true
          });
        }
        apiUrl = `${MORALIS_BASE_URL}/erc20/prices`;
        params.append('chain', chainId);
        // Split addresses and limit to 25 (Moralis limit)
        const addressList = addresses.split(',').slice(0, 25);
        addressList.forEach(addr => params.append('tokens', addr));
        break;

      case 'token-metadata':
        // Token metadata (symbol, name, decimals)
        if (!addresses) {
          return res.status(200).json({ 
            success: false,
            error: 'Addresses parameter required for token-metadata',
            _safe_mode: true
          });
        }
        apiUrl = `${MORALIS_BASE_URL}/erc20/metadata`;
        params.append('chain', chainId);
        const metadataAddresses = addresses.split(',').slice(0, 25);
        metadataAddresses.forEach(addr => params.append('addresses', addr));
        break;

            default:
        return res.status(200).json({
          success: false,
          error: 'Invalid endpoint',
          available: ['wallet-tokens', 'wallet-history', 'token-prices', 'token-metadata'],
          _safe_mode: true
        });
    }

    const fullUrl = `${apiUrl}?${params.toString()}`;
    console.log(`🚀 MORALIS PROXY: ${endpoint} for ${chain} - ${address?.slice(0, 8) || addresses?.split(',').length + ' addresses'}...`);

    // 📡 Make request to Moralis API
    const response = await fetch(fullUrl, {
      headers: {
        'X-API-Key': MORALIS_API_KEY,
        'Accept': 'application/json',
        'User-Agent': 'PulseManager/1.0'
      },
      timeout: 30000
    });

    if (!response.ok) {
      console.error(`❌ Moralis API Error: ${response.status} ${response.statusText}`);
      
      // Check for specific error codes
      if (response.status === 429) {
        return res.status(429).json({ 
          error: 'Rate limit exceeded',
          message: 'Moralis API rate limit reached. Try again later.',
          retryAfter: response.headers.get('retry-after') || '60'
        });
      }

      if (response.status === 401) {
        // 🛡️ FALLBACK: Return empty result for auth errors
        console.warn('⚠️ MORALIS AUTH ERROR - returning empty result');
        return res.status(200).json({
          result: [],
          total: 0,
          _fallback: {
            reason: 'moralis_auth_error',
            message: 'Check MORALIS_API_KEY configuration'
          }
        });
      }

      // 🛡️ FALLBACK: For other errors, return empty result
      return res.status(200).json({
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
    
    // 📊 Log successful requests with useful stats
    let logMessage = `✅ MORALIS ${endpoint.toUpperCase()}:`;
    
    if (data.result && Array.isArray(data.result)) {
      logMessage += ` ${data.result.length} items`;
      
      // Specific logging for different endpoints
      if (endpoint === 'wallet-tokens') {
        const nonZeroTokens = data.result.filter(token => 
          parseFloat(token.balance) > 0 || parseFloat(token.balance_formatted) > 0
        );
        logMessage += ` (${nonZeroTokens.length} with balance)`;
      }
      
      if (endpoint === 'token-prices') {
        const tokensWithPrice = data.result.filter(token => token.usdPrice > 0);
        logMessage += ` (${tokensWithPrice.length} with prices)`;
      }
    }
    
    console.log(logMessage);

    // 🔄 Add metadata to response
    const responseData = {
      ...data,
      _proxy: {
        provider: 'moralis',
        endpoint,
        chain: chainId,
        timestamp: new Date().toISOString(),
        hasMore: data.cursor ? true : false
      }
    };

    // 📈 Set appropriate caching headers
    const cacheTime = endpoint === 'token-prices' ? 60 : 300; // Prices cache 1min, other data 5min
    res.setHeader('Cache-Control', `s-maxage=${cacheTime}, stale-while-revalidate=${cacheTime * 2}`);
    
    return res.status(200).json(responseData);

  } catch (error) {
    console.error('💥 MORALIS PROXY ERROR:', error.message);
    
    // 🛡️ FALLBACK: Return empty result instead of errors
    return res.status(200).json({
      result: [],
      total: 0,
      _error: {
        message: error.message,
        endpoint: 'moralis-tokens',
        timestamp: new Date().toISOString(),
        fallback: 'Use alternative data source'
      }
    });
  }
} 