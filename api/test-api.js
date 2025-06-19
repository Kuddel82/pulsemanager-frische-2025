/**
 * 🚨 KRITISCHER TEST-ENDPUNKT
 * Testet ob die API überhaupt läuft
 */
export default async function handler(req, res) {
  // 🚨 KRITISCHER TEST - MUSS SICHTBAR SEIN
  console.log('🚨🚨🚨 TEST API: CLAUDE TEST ENDPOINT IS RUNNING! 🚨🚨🚨');
  console.log('🚨🚨🚨 IF YOU SEE THIS, THE API SYSTEM WORKS! 🚨🚨🚨');
  
  try {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // Einfache Test-Antwort
    return res.status(200).json({
      success: true,
      message: '🚨 TEST API FUNKTIONIERT! 🚨',
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url,
      headers: req.headers,
      body: req.body,
      query: req.query,
      status: 'CLAUDE_TEST_ENDPOINT_WORKS'
    });

  } catch (error) {
    console.error('💥 TEST API ERROR:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
      status: 'TEST_API_ERROR'
    });
  }
} 