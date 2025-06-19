/**
 * 🚨 KRITISCHER TAX-TEST-ENDPUNKT
 * Testet ob die Tax-API überhaupt läuft
 */
export default async function handler(req, res) {
  // 🚨 KRITISCHER TEST - MUSS SICHTBAR SEIN
  console.log('🚨🚨🚨 TAX TEST API: CLAUDE TAX TEST ENDPOINT IS RUNNING! 🚨🚨🚨');
  console.log('🚨🚨🚨 IF YOU SEE THIS, THE TAX API SYSTEM WORKS! 🚨🚨🚨');
  
  try {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // Teste Moralis API Key
    const MORALIS_API_KEY = process.env.MORALIS_API_KEY;
    const hasApiKey = MORALIS_API_KEY && MORALIS_API_KEY !== 'YOUR_MORALIS_API_KEY_HERE';

    // Einfache Test-Antwort
    return res.status(200).json({
      success: true,
      message: '🚨 TAX TEST API FUNKTIONIERT! 🚨',
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url,
      hasMoralisApiKey: hasApiKey,
      moraliKeyLength: MORALIS_API_KEY ? MORALIS_API_KEY.length : 0,
      status: 'CLAUDE_TAX_TEST_ENDPOINT_WORKS',
      test: 'Dieser Endpunkt läuft - wenn du das siehst, funktioniert die API!'
    });

  } catch (error) {
    console.error('💥 TAX TEST API ERROR:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
      status: 'TAX_TEST_API_ERROR'
    });
  }
} 