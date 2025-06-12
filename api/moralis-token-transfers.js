// 🚀 CRASH-SAFE MORALIS API - Absolutely NO crashes allowed
// Ultra-defensive programming for bulletproof API

export default async function handler(req, res) {
  try {
    // 🛡️ CORS Headers - Always set first
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // 🛡️ OPTIONS handling - Always handle first
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // 🛡️ METHOD validation - Fail gracefully
    if (req.method !== 'POST') {
      return res.status(200).json({ 
        success: false,
        result: [],
        total: 0,
        error: 'Method not allowed - use POST',
        _safe_mode: true
      });
    }

    // 🛡️ ABSOLUTE SAFE REQUEST PARSING
    let requestData = {};
    
    try {
      // Multiple fallback layers for request parsing
      if (req.body && typeof req.body === 'object') {
        requestData = req.body;
      } else if (req.body && typeof req.body === 'string') {
        try {
          requestData = JSON.parse(req.body);
        } catch {
          requestData = {};
        }
      }
    } catch (error) {
      console.error('💥 REQUEST PARSE ERROR (non-critical):', error.message);
      requestData = {};
    }

    // 🛡️ SAFE PARAMETER EXTRACTION with defaults
    const address = requestData.address || '';
    const chain = requestData.chain || '0x171';
    const cursor = requestData.cursor || null;
    const limit = parseInt(requestData.limit) || 100;

    // 🛡️ BASIC VALIDATION - Return safe response on validation failure
    if (!address || typeof address !== 'string' || address.length < 10) {
      console.warn('⚠️ Invalid address parameter, returning empty result');
      return res.status(200).json({
        success: false,
        result: [],
        total: 0,
        page: 0,
        page_size: limit,
        cursor: null,
        error: 'Invalid or missing address parameter',
        _safe_mode: true,
        _validation_failed: true
      });
    }

    // 🛡️ ENVIRONMENT CHECK - Fail gracefully if no API key
    const MORALIS_API_KEY = process.env.MORALIS_API_KEY;
    
    if (!MORALIS_API_KEY || MORALIS_API_KEY === 'YOUR_MORALIS_API_KEY_HERE') {
      console.error('🚨 CRITICAL: Moralis API Key required for API functionality');
      return res.status(401).json({
        error: 'API ERROR: Moralis API Key required',
        message: 'Add valid MORALIS_API_KEY to .env file',
        critical: true
      });
    }

    // 🛡️ CHAIN NORMALIZATION - Safe with fallback
    let normalizedChain = '0x171'; // Safe default
    try {
      if (chain === '369' || chain === 'pulsechain' || chain === 'pls') {
        normalizedChain = '0x171';
      } else if (chain === '1' || chain === 'ethereum' || chain === 'eth') {
        normalizedChain = '0x1';
      } else if (typeof chain === 'string' && chain.startsWith('0x')) {
        normalizedChain = chain;
      }
    } catch (error) {
      console.error('💥 CHAIN NORMALIZATION ERROR (non-critical):', error.message);
      normalizedChain = '0x171';
    }

    // 🛡️ SAFE URL CONSTRUCTION
    let apiUrl = '';
    let fullUrl = '';
    
    try {
      apiUrl = `https://deep-index.moralis.io/api/v2.2/${address}/erc20/transfers`;
      
      const params = new URLSearchParams();
      params.append('chain', normalizedChain);
      // 🚀 VERCEL PRO: Erhöhe Limits für bessere Performance
      params.append('limit', Math.min(Math.max(parseInt(limit) || 500, 1), 500).toString());
      
      if (cursor && typeof cursor === 'string' && cursor.length > 0) {
        params.append('cursor', cursor);
      }

      fullUrl = `${apiUrl}?${params.toString()}`;
    } catch (error) {
      console.error('💥 URL CONSTRUCTION ERROR:', error.message);
      return res.status(200).json({
        success: false,
        result: [],
        total: 0,
        error: 'URL construction failed',
        _safe_mode: true,
        _url_error: true
      });
    }

    console.log(`🚀 SAFE MORALIS REQUEST: ${address.slice(0, 8)}... on ${normalizedChain}`);

    // 🛡️ ULTRA-SAFE FETCH with multiple fallback layers
    let response = null;
    let responseText = '';
    
    try {
      // 🚀 VERCEL PRO: Längerer Timeout für große Datenmengen
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 Sekunden für Pro
      
      response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'X-API-Key': MORALIS_API_KEY,
          'Accept': 'application/json',
          'User-Agent': 'PulseManager-Safe/1.0'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
    } catch (fetchError) {
      console.error('💥 FETCH ERROR (returning empty result):', fetchError.message);
      return res.status(200).json({
        success: false,
        result: [],
        total: 0,
        page: 0,
        page_size: limit,
        cursor: null,
        error: 'Network request failed',
        _safe_mode: true,
        _fetch_error: fetchError.message
      });
    }

    // 🛡️ SAFE RESPONSE STATUS CHECK
    if (!response || !response.ok) {
      console.error(`💥 MORALIS API ERROR: ${response?.status || 'unknown'} - ${response?.statusText || 'unknown'}`);
      
      return res.status(200).json({
        success: false,
        result: [],
        total: 0,
        page: 0,
        page_size: limit,
        cursor: null,
        error: `Moralis API error: ${response?.status || 'unknown'}`,
        _safe_mode: true,
        _api_error: {
          status: response?.status || 'unknown',
          statusText: response?.statusText || 'unknown'
        }
      });
    }

    // 🛡️ ULTRA-SAFE RESPONSE PARSING
    let data = {};
    
    try {
      responseText = await response.text();
      
      if (!responseText || responseText.length === 0) {
        throw new Error('Empty response from Moralis');
      }
      
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('💥 RESPONSE PARSE ERROR (returning empty result):', parseError.message);
      console.error('💥 RAW RESPONSE (first 500 chars):', responseText.slice(0, 500));
      
      return res.status(200).json({
        success: false,
        result: [],
        total: 0,
        page: 0,
        page_size: limit,
        cursor: null,
        error: 'Invalid JSON response from Moralis API',
        _safe_mode: true,
        _parse_error: parseError.message,
        _raw_response_length: responseText.length
      });
    }

    // 🛡️ SAFE DATA PROCESSING
    let transfers = [];
    
    try {
      if (data && data.result && Array.isArray(data.result)) {
        transfers = data.result.map(transfer => {
          try {
            return {
              // Standard fields with safe defaults
              transaction_hash: transfer.transaction_hash || '',
              block_number: transfer.block_number || 0,
              block_timestamp: transfer.block_timestamp || new Date().toISOString(),
              
              // Addresses with safe defaults
              from_address: transfer.from_address || '',
              to_address: transfer.to_address || '',
              
              // Token info with safe defaults
              address: transfer.address || '',
              value: transfer.value || '0',
              
              // Enhanced fields for tax calculation
              is_incoming: (transfer.to_address || '').toLowerCase() === address.toLowerCase(),
              is_token_transfer: true,
              chain_id: normalizedChain,
              
              // Metadata
              _moralis: {
                api_version: 'v2.2',
                data_source: 'moralis',
                processed_at: new Date().toISOString()
              }
            };
          } catch (transferError) {
            console.error('💥 TRANSFER PROCESSING ERROR (skipping item):', transferError.message);
            return null;
          }
        }).filter(transfer => transfer !== null); // Remove failed items
      }
    } catch (processingError) {
      console.error('💥 DATA PROCESSING ERROR (returning empty result):', processingError.message);
      transfers = [];
    }

    // 🛡️ SAFE RESULT CONSTRUCTION
    const result = {
      success: true,
      result: transfers,
      total: data.total || transfers.length,
      page: data.page || 0,
      page_size: data.page_size || limit,
      cursor: data.cursor || null,
      
      // API metadata
      _metadata: {
        provider: 'moralis',
        api_version: 'v2.2',
        endpoint: 'token_transfers',
        chain_id: normalizedChain,
        user_scalable: '1000+',
        cache_strategy: 'blockchain_confirmed',
        timestamp: new Date().toISOString()
      },
      _safe_mode: true,
      _processed_transfers: transfers.length
    };

    // 🛡️ SAFE RESPONSE HEADERS
    try {
      res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');
    } catch (headerError) {
      console.error('💥 HEADER ERROR (non-critical):', headerError.message);
    }
    
    console.log(`✅ SAFE MORALIS SUCCESS: ${transfers.length} transfers for ${address.slice(0, 8)}...`);
    
    return res.status(200).json(result);

  } catch (criticalError) {
    // 🛡️ ABSOLUTE LAST RESORT - This should NEVER fail
    console.error('💥 CRITICAL ERROR IN SAFE API:', criticalError.message);
    console.error('💥 CRITICAL ERROR STACK:', criticalError.stack);
    
    try {
      return res.status(200).json({ 
        success: false,
        result: [],
        total: 0,
        page: 0,
        page_size: 100,
        cursor: null,
        _critical_error: {
          message: criticalError.message || 'Unknown critical error',
          name: criticalError.name || 'Error',
          endpoint: 'moralis-token-transfers',
          timestamp: new Date().toISOString(),
          fallback: 'System operating in emergency mode'
        },
        _safe_mode: true
      });
    } catch (emergencyError) {
      // 🛡️ FINAL EMERGENCY FALLBACK
      console.error('💥 EMERGENCY FALLBACK ACTIVATED:', emergencyError.message);
      return res.status(200).json({ 
        success: false,
        result: [],
        total: 0,
        _emergency: true
      });
    }
  }
} 