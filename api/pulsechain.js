// 🚀 PulseChain API Proxy - Vercel Serverless Function v0.0.7
// Eliminiert CORS-Probleme durch Server-seitigen Proxy
// Route: /api/pulsechain?address=0x...&action=tokenlist
// Deploy Time: 2025-01-08 API-URL FIX - KRITISCH!

export default async function handler(req, res) {
  // Add CORS headers
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

    // ✅ KORREKTE API BASE URL - OFFICIAL PULSECHAIN API
    const PULSECHAIN_API = 'https://api.scan.pulsechain.com/api';

    // Build query parameters
    const params = new URLSearchParams({
      module,
      action,
      address,
      ...otherParams
    });

    const proxyUrl = `${PULSECHAIN_API}?${params.toString()}`;
    
    console.log('🔗 PulseChain Proxy URL:', proxyUrl);

    const response = await fetch(proxyUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'PulseManager/1.0'
      },
      timeout: 30000
    });

    if (!response.ok) {
      throw new Error(`PulseChain API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Add success metadata
    const result = {
      ...data,
      _metadata: {
        source: 'api.scan.pulsechain.com',
        timestamp: new Date().toISOString(),
        proxy: 'vercel-function'
      }
    };

    res.status(200).json(result);

  } catch (error) {
    console.error('❌ PulseChain Proxy Error:', error);
    
    res.status(500).json({
      error: 'Proxy request failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
} 