// 🔗 ETHEREUM API PROXY - Vercel Serverless Function v1.0.0
// Für Token-Balances und Transaktionen auf Ethereum Mainnet
// Route: /api/ethereum-proxy?address=0x...&action=tokenlist

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { address, action, module, ...otherParams } = req.query;

    if (!address || !action || !module) {
      return res.status(400).json({
        error: 'Missing required parameters',
        required: ['address', 'action', 'module']
      });
    }

    // 🔗 ETHEREUM API URLs (öffentliche APIs)
    const ETHEREUM_APIS = {
      // Etherscan API (kostenlos mit Rate Limiting)
      etherscan: 'https://api.etherscan.io/api',
      // Backup: Blockscout (falls Etherscan überlastet)
      blockscout: 'https://eth.blockscout.com/api'
    };

    // Build query parameters
    const params = new URLSearchParams({
      module,
      action,
      address,
      ...otherParams
    });

    // Versuche zuerst Etherscan
    let apiUrl = `${ETHEREUM_APIS.etherscan}?${params.toString()}`;
    let apiSource = 'etherscan';
    
    console.log('🔗 Ethereum Proxy URL:', apiUrl);

    let response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'PulseManager/1.0'
      },
      timeout: 30000
    });

    // Fallback zu Blockscout bei Etherscan-Problemen
    if (!response.ok && response.status === 429) {
      console.log('⚠️ Etherscan rate limited, trying Blockscout...');
      apiUrl = `${ETHEREUM_APIS.blockscout}?${params.toString()}`;
      apiSource = 'blockscout';
      
      response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'PulseManager/1.0'
        },
        timeout: 30000
      });
    }

    if (!response.ok) {
      throw new Error(`Ethereum API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Add metadata
    const result = {
      ...data,
      _metadata: {
        source: apiSource,
        chain: 'ethereum',
        chainId: 1,
        timestamp: new Date().toISOString(),
        proxy: 'vercel-function'
      }
    };

    res.status(200).json(result);

  } catch (error) {
    console.error('❌ Ethereum Proxy Error:', error);
    
    res.status(500).json({
      error: 'Ethereum proxy request failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
} 