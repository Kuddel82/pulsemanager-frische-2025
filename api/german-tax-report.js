// 🚨 EMERGENCY MINIMAL WORKING VERSION - OHNE IMPORTS
// Direkt testbare Version für sofortige Fehlerdiagnose

module.exports = async function handler(req, res) {
  console.log('🔥 BACKEND HIT - NEW VERSION!');
  
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    const { address } = req.query;
    
    if (!address) {
      return res.status(400).json({
        success: false,
        error: 'Address required'
      });
    }

    console.log('🔥 Loading transactions for:', address);

    // DIREKT WORKING API CALL
    const ethResponse = await fetch(`/api/moralis-v2?address=${address}&chain=eth&type=transactions&limit=1000`);
    const plsResponse = await fetch(`/api/moralis-v2?address=${address}&chain=pls&type=transactions&limit=1000`);
    
    const ethData = await ethResponse.json();
    const plsData = await plsResponse.json();
    
    console.log('🎯 API Results:', {
      eth: ethData?.result?.length || 0,
      pls: plsData?.result?.length || 0
    });
    
    const allTransactions = [
      ...(ethData?.result || []),
      ...(plsData?.result || [])
    ];
    
    console.log('✅ Total loaded:', allTransactions.length);
    
    const summary = {
      totalTransactions: allTransactions.length,
      ethereumCount: ethData?.result?.length || 0,
      pulsechainCount: plsData?.result?.length || 0,
      roiCount: 0,
      taxableCount: 0,
      printerCount: 5 // FAKE PRINTER COUNT FOR TESTING
    };
    
    return res.status(200).json({
      success: true,
      taxReport: {
        walletAddress: address,
        generatedAt: new Date().toISOString(),
        summary,
        transactions: allTransactions,
        chainResults: {
          ETH: { count: ethData?.result?.length || 0 },
          PLS: { count: plsData?.result?.length || 0 }
        }
      },
      debug: {
        version: 'minimal_test',
        backendWorking: true
      }
    });
    
  } catch (error) {
    console.error('❌ Backend Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};