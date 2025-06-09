// 🔗 PULSECHAIN API PROXY - für Tax Service & Portfolio
// Proxied requests to PulseChain API to avoid CORS issues

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { address, action, module, page, offset, sort } = req.query;

    if (!address) {
      return res.status(400).json({ error: 'Address parameter required' });
    }

    // 🌐 PulseChain API Endpoints
    const PULSECHAIN_API_BASE = 'https://scan.pulsechain.com/api';
    
    // Default parameters
    const apiParams = new URLSearchParams({
      module: module || 'account',
      action: action || 'tokenlist',
      address: address.toLowerCase(),
      page: page || '1',
      offset: offset || '1000',
      sort: sort || 'desc'
    });

    console.log(`🔗 PULSECHAIN PROXY: ${action} for ${address.slice(0, 8)}...`);

    // Make request to PulseChain API
    const apiUrl = `${PULSECHAIN_API_BASE}?${apiParams.toString()}`;
    
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'PulseManager/1.0',
        'Accept': 'application/json'
      },
      timeout: 30000
    });

    if (!response.ok) {
      console.error(`❌ PulseChain API Error: ${response.status} ${response.statusText}`);
      return res.status(response.status).json({ 
        error: `PulseChain API Error: ${response.status}`,
        message: response.statusText 
      });
    }

    const data = await response.json();
    
    // 📊 Log successful requests (but limit spam)
    if (data.status === '1' && Array.isArray(data.result)) {
      console.log(`✅ PULSECHAIN: ${data.result.length} ${action} results for ${address.slice(0, 8)}...`);
    } else if (data.message === 'NOTOK') {
      // Normal for empty wallets - don't spam logs
      console.log(`📱 PULSECHAIN: Empty wallet ${address.slice(0, 8)}... (NOTOK - normal)`);
    }

    return res.status(200).json(data);

  } catch (error) {
    console.error('💥 PULSECHAIN PROXY ERROR:', error.message);
    
    return res.status(500).json({ 
      error: 'Proxy request failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
} 