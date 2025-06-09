// 💰 DEXSCREENER API PROXY - für Token-Preise
// Proxied requests to DexScreener API for real-time pricing

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { endpoint, addresses } = req.query;

    if (!endpoint || !addresses) {
      return res.status(400).json({ error: 'Endpoint and addresses parameters required' });
    }

    // 🌐 DexScreener API Base
    const DEXSCREENER_API_BASE = 'https://api.dexscreener.com/latest/dex';
    
    let apiUrl;
    
    if (endpoint === 'tokens') {
      // Multiple token lookup
      const addressList = addresses.split(',').slice(0, 30); // Limit to 30 addresses
      apiUrl = `${DEXSCREENER_API_BASE}/tokens/${addressList.join(',')}`;
    } else {
      return res.status(400).json({ error: 'Invalid endpoint. Use: tokens' });
    }

    console.log(`💰 DEXSCREENER PROXY: ${endpoint} for ${addresses.split(',').length} addresses`);

    // Make request to DexScreener API
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'PulseManager/1.0',
        'Accept': 'application/json'
      },
      timeout: 15000
    });

    if (!response.ok) {
      console.error(`❌ DexScreener API Error: ${response.status} ${response.statusText}`);
      return res.status(response.status).json({ 
        error: `DexScreener API Error: ${response.status}`,
        message: response.statusText 
      });
    }

    const data = await response.json();
    
    // 📊 Log successful requests
    if (data.pairs && Array.isArray(data.pairs)) {
      const pricedTokens = data.pairs.filter(p => p.priceUsd && parseFloat(p.priceUsd) > 0);
      console.log(`✅ DEXSCREENER: Found prices for ${pricedTokens.length}/${data.pairs.length} tokens`);
    }

    return res.status(200).json(data);

  } catch (error) {
    console.error('💥 DEXSCREENER PROXY ERROR:', error.message);
    
    return res.status(500).json({ 
      error: 'Proxy request failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
} 