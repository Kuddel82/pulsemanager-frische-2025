// 🧪 TEST API - Moralis Connection Check
// Überprüft ob Moralis API erreichbar ist

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const MORALIS_API_KEY = process.env.MORALIS_API_KEY;
    
    if (!MORALIS_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'MORALIS_API_KEY nicht gefunden',
        envCheck: {
          hasMoralisKey: false,
          keyLength: 0
        }
      });
    }

    // Test API Call - Simple Chain Info
    const testResponse = await fetch('https://deep-index.moralis.io/api/v2.2/erc20/metadata?chain=eth&addresses=0xA0b86a33E6441b0a05f1974fc59d1b92f8b0aa8c', {
      method: 'GET',
      headers: {
        'X-API-Key': MORALIS_API_KEY,
        'Accept': 'application/json'
      }
    });

    const testData = await testResponse.json();

    return res.status(200).json({
      success: true,
      message: 'Moralis API Test erfolgreich',
      envCheck: {
        hasMoralisKey: true,
        keyLength: MORALIS_API_KEY.length,
        keyPreview: MORALIS_API_KEY.slice(0, 8) + '...'
      },
      apiTest: {
        status: testResponse.status,
        success: testResponse.ok,
        data: testData
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('💥 Moralis Test Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
} 