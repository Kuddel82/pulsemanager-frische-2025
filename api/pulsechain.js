// 🚀 PulseChain API Proxy - Vercel Serverless Function v1.2.0
// Eliminiert CORS-Probleme durch Server-seitigen Proxy
// Route: /api/pulsechain?address=0x...&action=tokenlist&module=account
// Updated: 2025-01-11 - FIXED API Interface for EtherScan compatibility

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
    const { address, action, module, page, offset, sort, startblock, endblock, tag } = req.query;

    if (!address) {
      return res.status(400).json({
        error: 'Missing required parameter: address',
        example: '/api/pulsechain?address=0x...&action=tokenlist&module=account'
      });
    }

    // 🌐 PulseChain Scan API Configuration  
    const PULSECHAIN_API_BASE = 'https://scan.pulsechain.com/api';
    
    // Build query parameters for PulseChain API
    const params = new URLSearchParams({
      module: module || 'account',
      action: action || 'tokenlist', 
      address: address.toLowerCase()
    });

    // Add optional parameters
    if (page) params.append('page', page);
    if (offset) params.append('offset', offset);
    if (sort) params.append('sort', sort);
    if (startblock) params.append('startblock', startblock);
    if (endblock) params.append('endblock', endblock);
    if (tag) params.append('tag', tag);

    const proxyUrl = `${PULSECHAIN_API_BASE}?${params.toString()}`;
    
    console.log(`🔗 PulseChain Proxy: ${action || 'tokenlist'} for ${address.slice(0, 8)}...`);

    const response = await fetch(proxyUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'PulseManager/1.2'
      },
      timeout: 30000
    });

    if (!response.ok) {
      console.error(`❌ PulseChain API Error: ${response.status} ${response.statusText}`);
      return res.status(response.status).json({ 
        error: `PulseChain API Error: ${response.status}`,
        message: response.statusText,
        url: proxyUrl.replace(PULSECHAIN_API_BASE, '[API_BASE]') // Hide full URL in logs
      });
    }

    const data = await response.json();
    
    // 📊 Log successful requests with useful info
    if (data.status === '1' && Array.isArray(data.result)) {
      console.log(`✅ PULSECHAIN ${(action || 'tokenlist').toUpperCase()}: ${data.result.length} results for ${address.slice(0, 8)}...`);
    } else if (data.message === 'NOTOK') {
      // Normal for empty wallets - less logging
      console.log(`📱 PULSECHAIN: Empty result for ${address.slice(0, 8)}... (normal)`);
    }

    // Add proxy metadata
    const result = {
      ...data,
      _proxy: {
        source: 'scan.pulsechain.com',
        timestamp: new Date().toISOString(),
        version: '1.2.0'
      }
    };

    // Set caching headers (5 minutes for API data)
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');

    res.status(200).json(result);

  } catch (error) {
    console.error('💥 PulseChain Proxy Error:', error.message);
    
    // Handle different error types
    if (error.name === 'AbortError' || error.code === 'TIMEOUT') {
      return res.status(408).json({
        error: 'Request timeout',
        message: 'PulseChain API took too long to respond'
      });
    }

    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        error: 'Service unavailable', 
        message: 'PulseChain API is currently unreachable'
      });
    }
    
    res.status(500).json({
      error: 'Proxy request failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
} 