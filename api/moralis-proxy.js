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

  // 🚨 CRITICAL: API Key Check mit detaillierter Diagnose
  if (!MORALIS_API_KEY || MORALIS_API_KEY === 'YOUR_MORALIS_API_KEY_HERE') {
    console.error('🚨 PROXY: MORALIS_API_KEY missing or invalid');
    console.error('🔧 LÖSUNG: Erstelle eine .env Datei mit: MORALIS_API_KEY=dein_echter_api_key');
    console.error('🌐 Moralis Account: https://admin.moralis.io/');
    
    return res.status(500).json({
      error: '🚨 MORALIS API KEY FEHLT',
      success: false,
      debug: 'Server-side API key missing or invalid',
      solution: {
        step1: 'Erstelle eine .env Datei im Root-Verzeichnis',
        step2: 'Füge hinzu: MORALIS_API_KEY=dein_echter_moralis_api_key',
        step3: 'Hole deinen API Key von https://admin.moralis.io/',
        step4: 'Starte den Server neu: npm run dev'
      },
      fallback: 'System läuft im eingeschränkten Modus ohne Live-Daten'
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
        // 🚀 ERHÖHTES LIMIT: Bis zu 2000 Transaktionen pro Request für Tax Reports
        apiUrl = `https://deep-index.moralis.io/api/v2/${address}?chain=${normalizedChain}&limit=${Math.min(limit, 2000)}`;
        if (cursor) apiUrl += `&cursor=${cursor}`;
        break;
        
      case 'verbose':
        // 🆕 MORALIS TRANSACTION LABELING: /verbose Endpoint für decoded_call/decoded_event
        // 🚀 ERHÖHTES LIMIT: Bis zu 2000 verbose Transaktionen pro Request
        apiUrl = `https://deep-index.moralis.io/api/v2/${address}/verbose?chain=${normalizedChain}&limit=${Math.min(limit, 2000)}`;
        if (cursor) apiUrl += `&cursor=${cursor}`;
        break;
        
      case 'erc20-transfers':
        // 🚀 ERHÖHTES LIMIT: Bis zu 2000 ERC20-Transfers pro Request für vollständige Steuerberichte
        apiUrl = `https://deep-index.moralis.io/api/v2/${address}/erc20/transfers?chain=${normalizedChain}&limit=${Math.min(limit, 2000)}`;
        if (cursor) apiUrl += `&cursor=${cursor}`;
        break;
        
      case 'balances':
        apiUrl = `https://deep-index.moralis.io/api/v2/${address}/erc20?chain=${normalizedChain}&limit=${Math.min(limit, 100)}`;
        if (cursor) apiUrl += `&cursor=${cursor}`;
        break;
        
      case 'internal-transactions':
        // 🆕 INTERNAL TRANSACTIONS: Für vollständige Transaktionshistorie (OPTIONAL ENDPOINT)
        // ⚠️ WARNUNG: Nicht alle Chains unterstützen internal-transactions
        if (normalizedChain === '0x171') {
          // PulseChain: Internal transactions nicht verfügbar
          return res.status(400).json({
            success: false,
            error: 'internal-transactions für PulseChain nicht unterstützt',
            alternative: 'Verwende transactions + erc20-transfers für vollständige Daten',
            chain: normalizedChain
          });
        }
        apiUrl = `https://deep-index.moralis.io/api/v2/${address}/internal-transactions?chain=${normalizedChain}&limit=${Math.min(limit, 100)}`;
        if (cursor) apiUrl += `&cursor=${cursor}`;
        break;
        
      case 'bulk-token-prices':
        // 🚀 BULK TOKEN PRICES: Moralis v2.2 Multiple Token Prices für Steuerreport
        apiUrl = `https://deep-index.moralis.io/api/v2.2/erc20/prices?chain=${normalizedChain}&include=percent_change`;
        break;
        
      case 'wallet-history':
        // 🚀 WALLET HISTORY: Moralis v2.2 Complete Transaction History (ALLE TYPEN!)
        apiUrl = `https://deep-index.moralis.io/api/v2.2/wallets/${address}/history?chain=${normalizedChain}&limit=${Math.min(limit, 100)}&order=DESC&include_internal_transactions=true`;
        if (cursor) apiUrl += `&cursor=${cursor}`;
        break;
        
      case 'wallet-transactions':
        // 🆕 WALLET TRANSACTIONS: Moralis v2.2 Native Transactions mit Labels & Entities
        // 🚀 ERHÖHTES LIMIT: Bis zu 2000 Wallet-Transaktionen pro Request
        apiUrl = `https://deep-index.moralis.io/api/v2.2/${address}?chain=${normalizedChain}&limit=${Math.min(limit, 2000)}&order=DESC&include=internal_transactions`;
        if (cursor) apiUrl += `&cursor=${cursor}`;
        break;
        
      case 'erc20-price':
        // 🚀 ERC20 TOKEN PRICE: Einzelner Token-Preis für Tax Reports
        apiUrl = `https://deep-index.moralis.io/api/v2/erc20/${address}/price?chain=${normalizedChain}&include=percent_change`;
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
          availableEndpoints: ['transactions', 'verbose', 'erc20-transfers', 'internal-transactions', 'balances', 'bulk-token-prices', 'wallet-history', 'wallet-transactions', 'erc20-price'],
          note: 'wallet-transactions ist der NEUESTE Endpoint mit Labels & Entities (v2.2), wallet-history für vollständige Historie'
        });
    }

    console.log(`🚀 PROXY: ${endpoint} für ${address?.slice(0,8)}... auf ${normalizedChain}`);
    console.log(`🔗 PROXY URL: ${apiUrl}`);

    // 🔑 API Key Validation vor dem Request
    if (MORALIS_API_KEY.length < 20) {
      console.error('🚨 PROXY: API Key zu kurz - wahrscheinlich ungültig');
      return res.status(500).json({
        success: false,
        error: 'Moralis API Key ungültig (zu kurz)',
        debug: `Key length: ${MORALIS_API_KEY.length}, expected: >20`,
        solution: 'Überprüfe deinen API Key von https://admin.moralis.io/'
      });
    }

    // 🔥 MORALIS API CALL mit GET/POST Support für bulk-token-prices
    const isPostRequest = endpoint === 'bulk-token-prices';
    const requestOptions = {
      method: isPostRequest ? 'POST' : 'GET',
      headers: {
        'X-API-Key': MORALIS_API_KEY,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'PulseManager-Proxy/1.0'
      },
      timeout: 30000
    };
    
    // 🚀 POST Body für bulk-token-prices
    if (isPostRequest && req.body?.tokens) {
      requestOptions.body = JSON.stringify({
        tokens: req.body.tokens
      });
      console.log(`📦 BULK PRICES: ${req.body.tokens.length} Token-Adressen`);
    }
    
    const response = await fetch(apiUrl, requestOptions);

    console.log(`📡 PROXY Response: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ MORALIS API ERROR: ${response.status} - ${errorText}`);
      
      // Spezifische Fehlerbehandlung mit Lösungsvorschlägen
      if (response.status === 401) {
        return res.status(500).json({
          success: false,
          error: '🔑 Moralis API Authentication failed',
          debug: 'Invalid API key or permissions',
          moralisStatus: response.status,
          solution: {
            step1: 'Überprüfe deinen API Key auf https://admin.moralis.io/',
            step2: 'Stelle sicher, dass der Key korrekt in .env gesetzt ist',
            step3: 'Prüfe ob dein Moralis Plan aktiv ist'
          }
        });
      }
      
      if (response.status === 429) {
        return res.status(500).json({
          success: false,
          error: '⏰ Moralis API Rate limit exceeded',
          debug: 'Too many requests',
          moralisStatus: response.status,
          solution: 'Warte 60 Sekunden und versuche es erneut'
        });
      }

      if (response.status === 404) {
        return res.status(500).json({
          success: false,
          error: '🔍 Moralis API Endpoint not found',
          debug: `URL: ${apiUrl}`,
          moralisStatus: response.status,
          solution: 'Überprüfe Chain-ID und Endpoint-Parameter'
        });
      }
      
      return res.status(500).json({
        success: false,
        error: `🚨 Moralis API Error: ${response.status}`,
        debug: errorText,
        moralisStatus: response.status,
        url: apiUrl
      });
    }

    const data = await response.json();

    console.log(`✅ PROXY: ${data.result?.length || (endpoint === 'erc20-price' ? 'price data' : 0)} Einträge geladen`);

    // 🔥 SPEZIELLE BEHANDLUNG für erc20-price (hat keine result-Array)
    if (endpoint === 'erc20-price') {
      return res.status(200).json({
        success: true,
        endpoint: endpoint,
        address: address,
        chain: normalizedChain,
        result: data, // Direkte Preis-Daten
        timestamp: new Date().toISOString(),
        source: 'moralis_proxy_price'
      });
    }

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
      source: 'moralis_proxy_enhanced'
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
      debug: 'Proxy internal error',
      solution: 'Überprüfe Netzwerkverbindung und API-Konfiguration'
    });
  }
} 