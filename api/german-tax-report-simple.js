/**
 * 🚨 KRITISCHER GERMAN-TAX-REPORT-TEST-ENDPUNKT
 * Testet ob die german-tax-report API überhaupt läuft
 */
export default async function handler(req, res) {
  // 🚨 KRITISCHER TEST - MUSS SICHTBAR SEIN
  console.log('🚨🚨🚨 GERMAN TAX REPORT: CLAUDE GERMAN TAX REPORT TEST IS RUNNING! 🚨🚨🚨');
  console.log('🚨🚨🚨 IF YOU SEE THIS, THE GERMAN TAX REPORT API WORKS! 🚨🚨🚨');
  
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
      message: '🚨 GERMAN TAX REPORT TEST API FUNKTIONIERT! 🚨',
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url,
      hasMoralisApiKey: hasApiKey,
      moraliKeyLength: MORALIS_API_KEY ? MORALIS_API_KEY.length : 0,
      status: 'CLAUDE_GERMAN_TAX_REPORT_TEST_WORKS',
      test: 'Dieser Endpunkt läuft - wenn du das siehst, funktioniert die German Tax Report API!',
      note: 'Das Frontend sollte diesen Endpunkt aufrufen: /api/german-tax-report'
    });

  } catch (error) {
    console.error('💥 GERMAN TAX REPORT TEST API ERROR:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
      status: 'GERMAN_TAX_REPORT_TEST_API_ERROR'
    });
  }
} 