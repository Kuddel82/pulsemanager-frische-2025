/**
 * 🔥 LIVE MORALIS TEST API
 * Testet ob der Moralis API Key auf der Live-Website funktioniert
 */

const MORALIS_API_KEY = process.env.MORALIS_API_KEY;

export default async function handler(req, res) {
  console.log('🔥 LIVE TEST: Moralis API Key Test');
  
  try {
    // CORS Setup
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // API Key Check
    if (!MORALIS_API_KEY) {
      return res.status(503).json({ 
        error: 'Moralis API Key missing',
        debug: 'API_KEY_MISSING'
      });
    }

    // Test Wallet: 0x3f020b... (aus den Logs)
    const testAddress = '0x3f020b8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c';
    
    // Einfacher Test: PulseChain ERC20 Transfers
    const url = `https://deep-index.moralis.io/api/v2/${testAddress}/erc20/transfers?chain=0x171&limit=5`;
    
    console.log(`🔍 LIVE TEST: ${url}`);

    const res2 = await fetch(url, {
      method: 'GET',
      headers: {
        'X-API-Key': MORALIS_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    const responseText = await res2.text();
    let jsonData;
    
    try {
      jsonData = JSON.parse(responseText);
    } catch (e) {
      return res.status(200).json({
        success: false,
        error: 'Invalid JSON response from Moralis',
        status: res2.status,
        statusText: res2.statusText,
        rawResponse: responseText.substring(0, 500),
        apiKeyExists: !!MORALIS_API_KEY,
        apiKeyLength: MORALIS_API_KEY ? MORALIS_API_KEY.length : 0
      });
    }

    return res.status(200).json({
      success: true,
      test: {
        timestamp: new Date().toISOString(),
        address: testAddress,
        url: url,
        status: res2.status,
        statusText: res2.statusText,
        resultCount: jsonData?.result?.length || 0,
        hasData: !!jsonData?.result,
        apiKeyExists: !!MORALIS_API_KEY,
        apiKeyLength: MORALIS_API_KEY ? MORALIS_API_KEY.length : 0,
        response: jsonData
      }
    });

  } catch (error) {
    console.error('💥 LIVE TEST ERROR:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error during live test',
      debug: error.message,
      apiKeyExists: !!MORALIS_API_KEY,
      timestamp: new Date().toISOString()
    });
  }
} 