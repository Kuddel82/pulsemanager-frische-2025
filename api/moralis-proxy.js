// 🔄 MORALIS PROXY API - CSP Bypass
// Umgeht CSP-Probleme durch Server-seitige Moralis-Aufrufe

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { endpoint, address, chain = 'eth', limit = 100, cursor } = req.query;
  const MORALIS_API_KEY = process.env.MORALIS_API_KEY;

  if (!MORALIS_API_KEY) {
    return res.status(500).json({
      error: 'MORALIS_API_KEY nicht konfiguriert',
      success: false
    });
  }

  if (!endpoint || !address) {
    return res.status(400).json({
      error: 'endpoint und address Parameter erforderlich',
      success: false,
      availableEndpoints: ['transactions', 'erc20-transfers', 'balances']
    });
  }

  try {
    let apiUrl;
    
    // API Endpoint auswählen
    switch (endpoint) {
      case 'transactions':
        apiUrl = `https://deep-index.moralis.io/api/v2/${address}?chain=${chain}&limit=${limit}`;
        if (cursor) apiUrl += `&cursor=${cursor}`;
        break;
        
      case 'erc20-transfers':
        apiUrl = `https://deep-index.moralis.io/api/v2/${address}/erc20/transfers?chain=${chain}&limit=${limit}`;
        if (cursor) apiUrl += `&cursor=${cursor}`;
        break;
        
      case 'balances':
        apiUrl = `https://deep-index.moralis.io/api/v2/${address}/erc20?chain=${chain}&limit=${limit}`;
        if (cursor) apiUrl += `&cursor=${cursor}`;
        break;
        
      default:
        return res.status(400).json({
          error: `Unbekannter Endpoint: ${endpoint}`,
          success: false,
          availableEndpoints: ['transactions', 'erc20-transfers', 'balances']
        });
    }

    console.log(`🚀 PROXY: ${endpoint} für ${address} auf ${chain}`);

    // Moralis API Aufruf
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'X-API-Key': MORALIS_API_KEY,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Moralis API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    console.log(`✅ PROXY: ${data.result?.length || 0} Einträge geladen`);

    return res.status(200).json({
      success: true,
      endpoint: endpoint,
      address: address,
      chain: chain,
      result: data.result || [],
      cursor: data.cursor,
      total: data.total,
      page: data.page,
      page_size: data.page_size,
      timestamp: new Date().toISOString(),
      source: 'moralis_proxy'
    });

  } catch (error) {
    console.error(`💥 PROXY Error (${endpoint}):`, error);
    
    return res.status(500).json({
      success: false,
      error: error.message,
      endpoint: endpoint,
      address: address,
      chain: chain,
      timestamp: new Date().toISOString()
    });
  }
} 