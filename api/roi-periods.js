//🚀 ROI PERIODS API - Zeitraumbasierte ROI-Berechnung
// Endpoint: POST /api/roi-periods
// Purpose: ROI-Daten für verschiedene Zeiträume (24h, 7d, 30d, all)

const MORALIS_API_KEY = process.env.MORALIS_API_KEY;

export default async function handler(req, res) {
  console.log('🔵 ROI PERIODS API: Starting request processing');
  
  try {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // API Key validation
    if (!MORALIS_API_KEY || MORALIS_API_KEY === 'YOUR_MORALIS_API_KEY_HERE') {
      console.error('🚨 MORALIS API KEY MISSING');
      return res.status(503).json({ 
        error: 'Moralis API Key missing or invalid.',
        _debug: 'Check MORALIS_API_KEY environment variable'
      });
    }

    // Extract parameters
    const params = req.method === 'POST' ? { ...req.query, ...req.body } : req.query;
    const { address, chain = 'pulsechain' } = params;

    console.log('🔵 ROI PERIODS PARAMS:', { 
      chain, 
      address: address ? address.slice(0, 8) + '...' : 'MISSING'
    });

    if (!address) {
      return res.status(400).json({ 
        error: 'Missing address parameter.',
        usage: 'POST /api/roi-periods with address, chain'
      });
    }

    // Import ROI Detection Service dynamically
    const { ROIDetectionService } = await import('../src/services/ROIDetectionService.js');
    
    // Get ROI data for all periods
    const roiResult = await ROIDetectionService.getROIByPeriods(address, chain);
    
    if (!roiResult.success) {
      console.warn(`⚠️ ROI PERIODS: Failed to load ROI data: ${roiResult.error}`);
      return res.status(200).json({
        success: false,
        error: roiResult.error,
        periods: {
          '24h': { value: 0, sources: 0, transactions: 0 },
          '7d': { value: 0, sources: 0, transactions: 0 },
          '30d': { value: 0, sources: 0, transactions: 0 },
          'all': { value: 0, sources: 0, transactions: 0 }
        },
        _source: 'roi_periods_api_empty',
        _address: address,
        _chain: chain
      });
    }

    console.log(`✅ ROI PERIODS: Successfully calculated ROI for all periods`);

    return res.status(200).json({
      success: true,
      ...roiResult,
      _source: 'roi_periods_api_success',
      _timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('💥 ROI PERIODS API ERROR:', error);
    
    return res.status(200).json({
      success: false,
      error: error.message,
      periods: {
        '24h': { value: 0, sources: 0, transactions: 0 },
        '7d': { value: 0, sources: 0, transactions: 0 },
        '30d': { value: 0, sources: 0, transactions: 0 },
        'all': { value: 0, sources: 0, transactions: 0 }
      },
      _source: 'roi_periods_api_error',
      _error: error.message,
      _stack: error.stack
    });
  }
} 