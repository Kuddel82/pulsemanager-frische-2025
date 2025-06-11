// 🛡️ ULTRA-CRASH-SAFE MORALIS TRANSACTIONS API - NEVER RETURNS 500
// Professional Web3 Data API v2.2 für PulseManager - 1000+ User Ready

export default async function handler(req, res) {
  try {
    // 🛡️ CORS Headers - Always set first
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // 🛡️ OPTIONS handling
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // 🛡️ METHOD validation - Return safe response
    if (req.method !== 'POST') {
      return res.status(200).json({ 
        success: false,
        result: [],
        total: 0,
        error: 'Method not allowed - use POST',
        _safe_mode: true
      });
    }

    // 🛡️ SAFE REQUEST PARSING
    let requestData = {};
    
    try {
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

    // 🛡️ SAFE PARAMETER EXTRACTION
    const address = requestData.address || '';
    const chain = requestData.chain || '0x171';
    const cursor = requestData.cursor || null;
    const limit = parseInt(requestData.limit) || 100;

    // 🛡️ VALIDATION with safe response
    if (!address || typeof address !== 'string' || address.length < 10) {
      console.warn('⚠️ Invalid address parameter');
      return res.status(200).json({
        success: false,
        result: [],
        total: 0,
        page: 0,
        page_size: limit,
        cursor: null,
        error: 'Invalid or missing address parameter',
        _safe_mode: true
      });
    }

    // 🛡️ ENVIRONMENT CHECK
    const MORALIS_API_KEY = process.env.MORALIS_API_KEY;
    
    if (!MORALIS_API_KEY || MORALIS_API_KEY === 'YOUR_MORALIS_API_KEY_HERE') {
      console.warn('⚠️ MORALIS API KEY not configured');
      return res.status(200).json({
        success: true,
        result: [],
        total: 0,
        page: 0,
        page_size: limit,
        cursor: null,
        _fallback: {
          reason: 'moralis_api_key_not_configured',
          message: 'Add MORALIS_API_KEY to environment for transaction data'
        },
        _safe_mode: true
      });
    }

    // 🛡️ SAFE URL CONSTRUCTION
    let apiUrl = '';
    let fullUrl = '';
    
    try {
      apiUrl = `https://deep-index.moralis.io/api/v2.2/${address}`;
      
      const params = new URLSearchParams();
      params.append('chain', chain);
      params.append('limit', Math.min(Math.max(parseInt(limit) || 100, 1), 100).toString());
      
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
        _safe_mode: true
      });
    }

    console.log(`🚀 SAFE MORALIS TRANSACTIONS: ${address.slice(0, 8)}... on ${chain}`);

    // 🛡️ ULTRA-SAFE FETCH with timeout
    let response = null;
    let responseText = '';
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000); // 45s for Vercel Pro
      
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
        error: 'Network request failed',
        _safe_mode: true,
        _fetch_error: fetchError.message
      });
    }

    // 🛡️ SAFE RESPONSE STATUS CHECK
    if (!response || !response.ok) {
      console.error(`💥 MORALIS API ERROR: ${response?.status || 'unknown'}`);
      
      return res.status(200).json({
        success: false,
        result: [],
        total: 0,
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
      console.error('💥 RESPONSE PARSE ERROR:', parseError.message);
      console.error('💥 RAW RESPONSE (first 500 chars):', responseText.slice(0, 500));
      
      return res.status(200).json({
        success: false,
        result: [],
        total: 0,
        error: 'Invalid JSON response from Moralis API',
        _safe_mode: true,
        _parse_error: parseError.message
      });
    }
    
    // 🛡️ SAFE DATA PROCESSING
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
              
              // Addresses
              from_address: tx.from_address || '',
              to_address: tx.to_address || '',
              
              // Value and gas with safe defaults
              value: tx.value || '0',
              gas: tx.gas || '0',
              gas_price: tx.gas_price || '0',
              receipt_gas_used: tx.receipt_gas_used || '0',
              
              // Status
              receipt_status: tx.receipt_status || '0',
              
              // Enhanced fields
              is_incoming: (tx.to_address || '').toLowerCase() === address.toLowerCase(),
              is_native: true,
              chain_id: chain,
              
              // Metadata
              _moralis: {
                api_version: 'v2.2',
                data_source: 'enterprise',
                processed_at: new Date().toISOString()
              }
            };
          } catch (txError) {
            console.error('💥 TRANSACTION PROCESSING ERROR (skipping):', txError.message);
            return null;
          }
        }).filter(tx => tx !== null);
      }
    } catch (processingError) {
      console.error('💥 DATA PROCESSING ERROR:', processingError.message);
      transactions = [];
    }

    // 🛡️ SAFE RESULT CONSTRUCTION
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
      },
      _safe_mode: true,
      _processed_transactions: transactions.length
    };

    // 🛡️ SAFE RESPONSE HEADERS
    try {
      res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');
    } catch (headerError) {
      console.error('💥 HEADER ERROR (non-critical):', headerError.message);
    }
    
    console.log(`✅ SAFE MORALIS TRANSACTIONS: ${transactions.length} transactions for ${address.slice(0, 8)}...`);
    
    return res.status(200).json(result);

  } catch (criticalError) {
    // 🛡️ ABSOLUTE LAST RESORT - Never fail
    console.error('💥 CRITICAL ERROR IN TRANSACTIONS API:', criticalError.message);
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
          endpoint: 'moralis-transactions',
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