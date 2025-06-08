// 💰 DEXSCREENER API PROXY - Token-Preise für PulseChain
// Vercel Serverless Function für Token-Preis-Abfragen

export default async function handler(req, res) {
  // CORS Headers setzen
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // OPTIONS Request für CORS Preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // Nur GET Requests erlauben
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { endpoint, addresses, pairs } = req.query;
    
    let apiUrl;
    
    if (endpoint === 'tokens') {
      // Token prices by addresses
      if (!addresses) {
        return res.status(400).json({ 
          error: 'Missing addresses parameter for tokens endpoint' 
        });
      }
      
      // Validate addresses
      const addressList = addresses.split(',');
      for (const addr of addressList) {
        if (!addr.match(/^0x[a-fA-F0-9]{40}$/)) {
          return res.status(400).json({ 
            error: `Invalid address format: ${addr}` 
          });
        }
      }
      
      apiUrl = `https://api.dexscreener.com/latest/dex/tokens/${addresses}`;
      
    } else if (endpoint === 'pairs') {
      // Pairs data
      if (!pairs) {
        return res.status(400).json({ 
          error: 'Missing pairs parameter for pairs endpoint' 
        });
      }
      
      apiUrl = `https://api.dexscreener.com/latest/dex/pairs/pulsechain/${pairs}`;
      
    } else if (endpoint === 'search') {
      // Search tokens
      const { q } = req.query;
      if (!q) {
        return res.status(400).json({ 
          error: 'Missing search query parameter' 
        });
      }
      
      apiUrl = `https://api.dexscreener.com/latest/dex/search/?q=${encodeURIComponent(q)}`;
      
    } else {
      return res.status(400).json({ 
        error: 'Invalid endpoint. Use: tokens, pairs, or search' 
      });
    }
    
    console.log(`🔗 DEXSCREENER PROXY: ${apiUrl}`);
    
    // Fetch from DexScreener API with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    
    const response = await fetch(apiUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'PulseManager/1.0',
        'Accept': 'application/json',
      }
    });
    
    clearTimeout(timeoutId);
    
    // Check if response is ok
    if (!response.ok) {
      console.error(`❌ DexScreener API Error: ${response.status} ${response.statusText}`);
      return res.status(response.status).json({ 
        error: `DexScreener API error: ${response.status} ${response.statusText}`,
        status: response.status
      });
    }
    
    // Parse JSON response
    const data = await response.json();
    
    // Log successful request
    console.log(`✅ DEXSCREENER SUCCESS: ${endpoint} - ${Object.keys(data).length} items`);
    
    // Add metadata
    const responseData = {
      ...data,
      _proxy: {
        timestamp: new Date().toISOString(),
        endpoint,
        source: 'dexscreener'
      }
    };
    
    // Set caching headers (DexScreener data can be cached longer)
    res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=600');
    
    res.status(200).json(responseData);
    
  } catch (error) {
    console.error('❌ DEXSCREENER PROXY ERROR:', error);
    
    // Handle specific error types
    if (error.name === 'AbortError') {
      return res.status(408).json({ 
        error: 'Request timeout - DexScreener API took too long to respond',
        code: 'TIMEOUT'
      });
    }
    
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return res.status(503).json({ 
        error: 'DexScreener API is currently unavailable',
        code: 'SERVICE_UNAVAILABLE'
      });
    }
    
    res.status(500).json({ 
      error: 'Internal DexScreener proxy error',
      message: error.message,
      code: 'INTERNAL_ERROR'
    });
  }
} 