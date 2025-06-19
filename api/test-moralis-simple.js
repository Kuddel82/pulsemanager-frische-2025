/**
 * 🔥 EINFACHE MORALIS TEST API - Zeigt sofort was passiert
 */

const MORALIS_API_KEY = process.env.MORALIS_API_KEY;

export default async function handler(req, res) {
  console.log('🔥🔥🔥 EINFACHE MORALIS TEST 🔥🔥🔥');
  
  try {
    // CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // API Key Check
    if (!MORALIS_API_KEY) {
      return res.status(503).json({ 
        error: 'Moralis API Key missing',
        success: false
      });
    }

    // Extract parameters
    const { address = '0x3f020b5bcfdfa9b5970b1b22bba6da6387d0ea7a' } = req.query;

    console.log(`🔍 TESTING SIMPLE MORALIS for: ${address.slice(0, 8)}...`);

    const results = {
      address: address,
      timestamp: new Date().toISOString(),
      tests: {}
    };

    // Test 1: Wallet History ETH
    try {
      console.log(`🚀 TEST 1: Wallet History ETH`);
      const url = `https://deep-index.moralis.io/api/v2/wallets/${address}/history?chain=0x1&limit=10`;
      
      const response = await fetch(url, {
        headers: {
          'X-API-Key': MORALIS_API_KEY,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      results.tests.ethHistory = {
        success: response.ok,
        status: response.status,
        data: data,
        count: data?.result?.length || 0,
        url: url
      };
      
      console.log(`✅ ETH History: ${data?.result?.length || 0} transactions`);
      
    } catch (error) {
      results.tests.ethHistory = {
        success: false,
        error: error.message
      };
      console.error(`❌ ETH History Error:`, error.message);
    }

    // Test 2: Wallet History PLS
    try {
      console.log(`🚀 TEST 2: Wallet History PLS`);
      const url = `https://deep-index.moralis.io/api/v2/wallets/${address}/history?chain=0x171&limit=10`;
      
      const response = await fetch(url, {
        headers: {
          'X-API-Key': MORALIS_API_KEY,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      results.tests.plsHistory = {
        success: response.ok,
        status: response.status,
        data: data,
        count: data?.result?.length || 0,
        url: url
      };
      
      console.log(`✅ PLS History: ${data?.result?.length || 0} transactions`);
      
    } catch (error) {
      results.tests.plsHistory = {
        success: false,
        error: error.message
      };
      console.error(`❌ PLS History Error:`, error.message);
    }

    // Test 3: ERC20 Transfers ETH
    try {
      console.log(`🚀 TEST 3: ERC20 Transfers ETH`);
      const url = `https://deep-index.moralis.io/api/v2/${address}/erc20/transfers?chain=0x1&limit=10`;
      
      const response = await fetch(url, {
        headers: {
          'X-API-Key': MORALIS_API_KEY,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      results.tests.ethTransfers = {
        success: response.ok,
        status: response.status,
        data: data,
        count: data?.result?.length || 0,
        url: url
      };
      
      console.log(`✅ ETH Transfers: ${data?.result?.length || 0} transfers`);
      
    } catch (error) {
      results.tests.ethTransfers = {
        success: false,
        error: error.message
      };
      console.error(`❌ ETH Transfers Error:`, error.message);
    }

    // Test 4: ERC20 Transfers PLS
    try {
      console.log(`🚀 TEST 4: ERC20 Transfers PLS`);
      const url = `https://deep-index.moralis.io/api/v2/${address}/erc20/transfers?chain=0x171&limit=10`;
      
      const response = await fetch(url, {
        headers: {
          'X-API-Key': MORALIS_API_KEY,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      results.tests.plsTransfers = {
        success: response.ok,
        status: response.status,
        data: data,
        count: data?.result?.length || 0,
        url: url
      };
      
      console.log(`✅ PLS Transfers: ${data?.result?.length || 0} transfers`);
      
    } catch (error) {
      results.tests.plsTransfers = {
        success: false,
        error: error.message
      };
      console.error(`❌ PLS Transfers Error:`, error.message);
    }

    // Summary
    results.summary = {
      totalTests: Object.keys(results.tests).length,
      successfulTests: Object.values(results.tests).filter(t => t.success).length,
      totalTransactions: (results.tests.ethHistory?.count || 0) + (results.tests.plsHistory?.count || 0),
      totalTransfers: (results.tests.ethTransfers?.count || 0) + (results.tests.plsTransfers?.count || 0)
    };

    console.log(`📊 SIMPLE TEST SUMMARY:`, results.summary);

    return res.status(200).json({
      success: true,
      results: results
    });

  } catch (error) {
    console.error('💥 SIMPLE TEST ERROR:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
} 