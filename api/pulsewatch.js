// 🚀 PulseWatch API Proxy - Vercel Serverless Function v1.0.0
// Eliminiert DNS/CORS-Probleme durch Server-seitigen Proxy
// Route: /api/pulsewatch?address=0x...&action=transactions&limit=20
// Deploy Time: 2025-01-08 PULSEWATCH PROXY - CRITICAL FIX!

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
    const { address, action = 'transactions', limit = 20, ...otherParams } = req.query;

    if (!address) {
      return res.status(400).json({
        error: 'Missing required parameters',
        required: ['address']
      });
    }

    // 🎯 PulseWatch API Base URL
    const PULSEWATCH_API = 'https://api.pulsewatch.app';

    // Build endpoint URL based on action
    let endpoint = '';
    const params = new URLSearchParams();

    switch (action) {
      case 'transactions':
        endpoint = `/address/${address}/transactions`;
        if (limit) params.append('limit', limit);
        break;
      default:
        endpoint = `/address/${address}/${action}`;
    }

    // Add any additional parameters
    Object.entries(otherParams).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });

    const queryString = params.toString();
    const proxyUrl = `${PULSEWATCH_API}${endpoint}${queryString ? `?${queryString}` : ''}`;
    
    console.log('🔗 PulseWatch Proxy URL:', proxyUrl);

    const response = await fetch(proxyUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'PulseManager/1.0'
      },
      timeout: 30000
    });

    if (!response.ok) {
      // If PulseWatch API is down, return empty result instead of error
      console.log(`⚠️ PulseWatch API returned ${response.status}: ${response.statusText}`);
      return res.status(200).json({
        data: [],
        _metadata: {
          source: 'api.pulsewatch.app',
          status: 'unavailable',
          timestamp: new Date().toISOString(),
          proxy: 'vercel-function'
        }
      });
    }

    const data = await response.json();
    
    // Add success metadata
    const result = {
      data: Array.isArray(data) ? data : [data],
      _metadata: {
        source: 'api.pulsewatch.app',
        status: 'success',
        timestamp: new Date().toISOString(),
        proxy: 'vercel-function'
      }
    };

    res.status(200).json(result);

  } catch (error) {
    console.error('❌ PulseWatch Proxy Error:', error);
    
    // Return empty result on error to prevent app crashes
    res.status(200).json({
      data: [],
      _metadata: {
        source: 'api.pulsewatch.app',
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString(),
        proxy: 'vercel-function'
      }
    });
  }
} 