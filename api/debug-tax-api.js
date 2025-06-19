/**
 * 🔍 DEBUG TAX API - Moralis API Test
 * Testet alle Moralis Endpunkte für eine Wallet-Adresse
 */

const MORALIS_API_KEY = process.env.MORALIS_API_KEY;
const MORALIS_BASE_URL = 'https://deep-index.moralis.io/api/v2';

async function testMoralisEndpoint(endpoint, params = {}) {
  try {
    const url = new URL(`${MORALIS_BASE_URL}/${endpoint}`);
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null) {
        url.searchParams.append(key, val);
      }
    });

    console.log(`🔍 TESTING: ${url.toString()}`);

    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'X-API-Key': MORALIS_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    const responseText = await res.text();
    let jsonData;
    
    try {
      jsonData = JSON.parse(responseText);
    } catch (e) {
      return {
        status: res.status,
        statusText: res.statusText,
        error: 'Invalid JSON response',
        rawResponse: responseText.substring(0, 500)
      };
    }

    return {
      status: res.status,
      statusText: res.statusText,
      success: res.ok,
      data: jsonData,
      resultCount: jsonData?.result?.length || 0,
      hasCursor: !!jsonData?.cursor,
      url: url.toString()
    };

  } catch (error) {
    return {
      status: 'ERROR',
      error: error.message,
      url: `${MORALIS_BASE_URL}/${endpoint}`
    };
  }
}

export default async function handler(req, res) {
  console.log('🔍 DEBUG TAX API: Moralis API Test gestartet');
  
  try {
    // CORS Setup
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // API Key Check
    if (!MORALIS_API_KEY || MORALIS_API_KEY === 'YOUR_MORALIS_API_KEY_HERE') {
      return res.status(503).json({ 
        error: 'Moralis API Key missing or invalid.',
        debug: 'API_KEY_MISSING'
      });
    }

    // Parameter Extraction
    const params = req.method === 'POST' ? { ...req.query, ...req.body } : req.query;
    const { address = '0x3f020b...' } = params;

    console.log('🔍 DEBUG PARAMS:', { address });

    if (!address || address.length < 10) {
      return res.status(400).json({ 
        error: 'Invalid address parameter.',
        usage: 'GET /api/debug-tax-api?address=0x...'
      });
    }

    // Test Wallet: 0x3f020b... (aus den Logs)
    const testAddress = address;
    
    // Alle Endpunkte testen
    const endpoints = [
      // Ethereum
      { endpoint: `${testAddress}/erc20/transfers`, params: { chain: '0x1', limit: 10 } },
      { endpoint: `${testAddress}/transactions`, params: { chain: '0x1', limit: 10 } },
      { endpoint: `${testAddress}/internal-transactions`, params: { chain: '0x1', limit: 10 } },
      
      // PulseChain
      { endpoint: `${testAddress}/erc20/transfers`, params: { chain: '0x171', limit: 10 } },
      { endpoint: `${testAddress}/transactions`, params: { chain: '0x171', limit: 10 } },
      { endpoint: `${testAddress}/internal-transactions`, params: { chain: '0x171', limit: 10 } }
    ];

    const results = {};
    
    for (const { endpoint, params } of endpoints) {
      const chainName = params.chain === '0x1' ? 'Ethereum' : 'PulseChain';
      const txType = endpoint.includes('erc20') ? 'ERC20' : 
                    endpoint.includes('internal') ? 'Internal' : 'Native';
      
      const key = `${chainName}_${txType}`;
      
      console.log(`🔍 Testing ${key}: ${endpoint}`);
      results[key] = await testMoralisEndpoint(endpoint, params);
      
      // Kurze Pause zwischen Requests
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // API Key Info (ohne den Key selbst zu zeigen)
    const apiKeyInfo = {
      exists: !!MORALIS_API_KEY,
      length: MORALIS_API_KEY ? MORALIS_API_KEY.length : 0,
      startsWith: MORALIS_API_KEY ? MORALIS_API_KEY.substring(0, 8) + '...' : 'N/A',
      isValid: MORALIS_API_KEY && MORALIS_API_KEY !== 'YOUR_MORALIS_API_KEY_HERE'
    };

    return res.status(200).json({
      success: true,
      debug: {
        timestamp: new Date().toISOString(),
        address: testAddress,
        apiKeyInfo,
        results,
        summary: {
          totalEndpoints: Object.keys(results).length,
          successfulRequests: Object.values(results).filter(r => r.success).length,
          failedRequests: Object.values(results).filter(r => !r.success).length,
          totalTransactions: Object.values(results)
            .filter(r => r.success && r.data?.result)
            .reduce((sum, r) => sum + (r.data.result.length || 0), 0)
        }
      }
    });

  } catch (error) {
    console.error('💥 DEBUG API ERROR:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error during debug',
      debug: error.message,
      timestamp: new Date().toISOString()
    });
  }
} 