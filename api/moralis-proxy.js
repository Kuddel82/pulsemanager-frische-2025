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

  console.log(`🔍 PROXY DEBUG: endpoint=${endpoint}, address=${address?.slice(0,8)}..., chain=${chain}, limit=${limit}`);

  if (!MORALIS_API_KEY) {
    console.error('🚨 PROXY: MORALIS_API_KEY missing');
    return res.status(500).json({
      error: 'MORALIS_API_KEY nicht konfiguriert',
      success: false,
      debug: 'Server-side API key missing'
    });
  }

  if (!endpoint || !address) {
    return res.status(400).json({
      error: 'endpoint und address Parameter erforderlich',
      success: false,
      availableEndpoints: ['transactions', 'erc20-transfers', 'balances'],
      note: 'native-transfers nicht unterstützt - verwende transactions für ETH-Transaktionen'
    });
  }

  try {
    let apiUrl;
    
    // Chain mapping für bessere Kompatibilität
    const chainMap = {
      'eth': '0x1',
      'ethereum': '0x1',
      '1': '0x1',
      '0x1': '0x1',
      'pls': '0x171',
      'pulsechain': '0x171',
      '369': '0x171',
      '0x171': '0x171'
    };
    
    const normalizedChain = chainMap[chain.toLowerCase()] || chain;
    console.log(`🔍 PROXY: Chain mapping ${chain} -> ${normalizedChain}`);
    
    // API Endpoint auswählen
    switch (endpoint) {
      case 'transactions':
        apiUrl = `https://deep-index.moralis.io/api/v2/${address}?chain=${normalizedChain}&limit=${Math.min(limit, 100)}`;
        if (cursor) apiUrl += `&cursor=${cursor}`;
        break;
        
      case 'erc20-transfers':
        apiUrl = `https://deep-index.moralis.io/api/v2/${address}/erc20/transfers?chain=${normalizedChain}&limit=${Math.min(limit, 100)}`;
        if (cursor) apiUrl += `&cursor=${cursor}`;
        break;
        
      case 'balances':
        apiUrl = `https://deep-index.moralis.io/api/v2/${address}/erc20?chain=${normalizedChain}&limit=${Math.min(limit, 100)}`;
        if (cursor) apiUrl += `&cursor=${cursor}`;
        break;
        
      case 'native-transfers':
        // 🚨 DEPRECATED: native-transfers nicht unterstützt, verwende transactions
        return res.status(400).json({
          error: `native-transfers Endpoint nicht unterstützt`,
          success: false,
          availableEndpoints: ['transactions', 'erc20-transfers', 'balances'],
          suggestion: 'Verwende "transactions" für ETH-Transaktionen'
        });
        
      default:
        return res.status(400).json({
          error: `Unbekannter Endpoint: ${endpoint}`,
          success: false,
          availableEndpoints: ['transactions', 'erc20-transfers', 'balances'],
          note: 'native-transfers nicht unterstützt'
        });
    }

    console.log(`🚀 PROXY: ${endpoint} für ${address?.slice(0,8)}... auf ${normalizedChain}`);
    console.log(`🔗 PROXY URL: ${apiUrl}`);

    // Moralis API Aufruf mit besserer Fehlerbehandlung
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'X-API-Key': MORALIS_API_KEY,
        'Accept': 'application/json',
        'User-Agent': 'PulseManager-Proxy/1.0'
      },
      timeout: 30000
    });

    console.log(`📡 PROXY Response: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ MORALIS API ERROR: ${response.status} - ${errorText}`);
      
      // Spezifische Fehlerbehandlung
      if (response.status === 401) {
        return res.status(500).json({
          success: false,
          error: 'Moralis API Authentication failed',
          debug: 'Invalid API key or permissions',
          moralisStatus: response.status
        });
      }
      
      if (response.status === 429) {
        return res.status(500).json({
          success: false,
          error: 'Moralis API Rate limit exceeded',
          debug: 'Too many requests',
          moralisStatus: response.status
        });
      }
      
      return res.status(500).json({
        success: false,
        error: `Moralis API Error: ${response.status}`,
        debug: errorText,
        moralisStatus: response.status
      });
    }

    const data = await response.json();

    console.log(`✅ PROXY: ${data.result?.length || 0} Einträge geladen`);

    return res.status(200).json({
      success: true,
      endpoint: endpoint,
      address: address,
      chain: normalizedChain,
      result: data.result || [],
      cursor: data.cursor,
      total: data.total,
      page: data.page,
      page_size: data.page_size,
      timestamp: new Date().toISOString(),
      source: 'moralis_proxy_fixed'
    });

  } catch (error) {
    console.error(`💥 PROXY Error (${endpoint}):`, error);
    
    return res.status(500).json({
      success: false,
      error: error.message,
      endpoint: endpoint,
      address: address,
      chain: chain,
      timestamp: new Date().toISOString(),
      debug: 'Proxy internal error'
    });
  }
} 