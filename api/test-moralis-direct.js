/**
 * 🔥 DIREKTE MORALIS TEST API - Zeigt sofort was mit den TaxReport-Wallets passiert
 * Testet alle Moralis Endpoints direkt für die problematischen Wallets
 */

const MORALIS_API_KEY = process.env.MORALIS_API_KEY;
const MORALIS_BASE_URL = 'https://deep-index.moralis.io/api/v2';

export default async function handler(req, res) {
  console.log('🔥🔥🔥 DIREKTE MORALIS TEST API 🔥🔥🔥');
  
  try {
    // CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key');

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

    console.log(`🔍 TESTING DIRECT MORALIS for: ${address.slice(0, 8)}...`);

    const results = {
      address: address,
      timestamp: new Date().toISOString(),
      tests: {}
    };

    // Test 1: Wallet History (Ethereum)
    try {
      console.log(`🚀 TEST 1: Wallet History ETH for ${address.slice(0, 8)}...`);
      const ethHistoryUrl = `${MORALIS_BASE_URL}/wallets/${address}/history?chain=0x1&limit=50&order=DESC`;
      
      const ethHistoryResponse = await fetch(ethHistoryUrl, {
        headers: {
          'X-API-Key': MORALIS_API_KEY,
          'Content-Type': 'application/json'
        }
      });
      
      const ethHistoryData = await ethHistoryResponse.json();
      
      results.tests.ethHistory = {
        success: ethHistoryResponse.ok,
        status: ethHistoryResponse.status,
        data: ethHistoryData,
        count: ethHistoryData?.result?.length || 0,
        url: ethHistoryUrl
      };
      
      console.log(`✅ ETH History: ${ethHistoryData?.result?.length || 0} transactions`);
      
    } catch (error) {
      results.tests.ethHistory = {
        success: false,
        error: error.message
      };
      console.error(`❌ ETH History Error:`, error.message);
    }

    // Test 2: Wallet History (PulseChain)
    try {
      console.log(`🚀 TEST 2: Wallet History PLS for ${address.slice(0, 8)}...`);
      const plsHistoryUrl = `${MORALIS_BASE_URL}/wallets/${address}/history?chain=0x171&limit=50&order=DESC`;
      
      const plsHistoryResponse = await fetch(plsHistoryUrl, {
        headers: {
          'X-API-Key': MORALIS_API_KEY,
          'Content-Type': 'application/json'
        }
      });
      
      const plsHistoryData = await plsHistoryResponse.json();
      
      results.tests.plsHistory = {
        success: plsHistoryResponse.ok,
        status: plsHistoryResponse.status,
        data: plsHistoryData,
        count: plsHistoryData?.result?.length || 0,
        url: plsHistoryUrl
      };
      
      console.log(`✅ PLS History: ${plsHistoryData?.result?.length || 0} transactions`);
      
    } catch (error) {
      results.tests.plsHistory = {
        success: false,
        error: error.message
      };
      console.error(`❌ PLS History Error:`, error.message);
    }

    // Test 3: ERC20 Transfers (Ethereum)
    try {
      console.log(`🚀 TEST 3: ERC20 Transfers ETH for ${address.slice(0, 8)}...`);
      const ethTransfersUrl = `${MORALIS_BASE_URL}/${address}/erc20/transfers?chain=0x1&limit=50&order=DESC`;
      
      const ethTransfersResponse = await fetch(ethTransfersUrl, {
        headers: {
          'X-API-Key': MORALIS_API_KEY,
          'Content-Type': 'application/json'
        }
      });
      
      const ethTransfersData = await ethTransfersResponse.json();
      
      results.tests.ethTransfers = {
        success: ethTransfersResponse.ok,
        status: ethTransfersResponse.status,
        data: ethTransfersData,
        count: ethTransfersData?.result?.length || 0,
        url: ethTransfersUrl
      };
      
      console.log(`✅ ETH Transfers: ${ethTransfersData?.result?.length || 0} transfers`);
      
    } catch (error) {
      results.tests.ethTransfers = {
        success: false,
        error: error.message
      };
      console.error(`❌ ETH Transfers Error:`, error.message);
    }

    // Test 4: ERC20 Transfers (PulseChain)
    try {
      console.log(`🚀 TEST 4: ERC20 Transfers PLS for ${address.slice(0, 8)}...`);
      const plsTransfersUrl = `${MORALIS_BASE_URL}/${address}/erc20/transfers?chain=0x171&limit=50&order=DESC`;
      
      const plsTransfersResponse = await fetch(plsTransfersUrl, {
        headers: {
          'X-API-Key': MORALIS_API_KEY,
          'Content-Type': 'application/json'
        }
      });
      
      const plsTransfersData = await plsTransfersResponse.json();
      
      results.tests.plsTransfers = {
        success: plsTransfersResponse.ok,
        status: plsTransfersResponse.status,
        data: plsTransfersData,
        count: plsTransfersData?.result?.length || 0,
        url: plsTransfersUrl
      };
      
      console.log(`✅ PLS Transfers: ${plsTransfersData?.result?.length || 0} transfers`);
      
    } catch (error) {
      results.tests.plsTransfers = {
        success: false,
        error: error.message
      };
      console.error(`❌ PLS Transfers Error:`, error.message);
    }

    // Test 5: Native Balance (Ethereum)
    try {
      console.log(`🚀 TEST 5: Native Balance ETH for ${address.slice(0, 8)}...`);
      const ethBalanceUrl = `${MORALIS_BASE_URL}/${address}/balance?chain=0x1`;
      
      const ethBalanceResponse = await fetch(ethBalanceUrl, {
        headers: {
          'X-API-Key': MORALIS_API_KEY,
          'Content-Type': 'application/json'
        }
      });
      
      const ethBalanceData = await ethBalanceResponse.json();
      
      results.tests.ethBalance = {
        success: ethBalanceResponse.ok,
        status: ethBalanceResponse.status,
        data: ethBalanceData,
        balance: ethBalanceData?.balance || '0',
        url: ethBalanceUrl
      };
      
      console.log(`✅ ETH Balance: ${ethBalanceData?.balance || '0'}`);
      
    } catch (error) {
      results.tests.ethBalance = {
        success: false,
        error: error.message
      };
      console.error(`❌ ETH Balance Error:`, error.message);
    }

    // Test 6: Native Balance (PulseChain)
    try {
      console.log(`🚀 TEST 6: Native Balance PLS for ${address.slice(0, 8)}...`);
      const plsBalanceUrl = `${MORALIS_BASE_URL}/${address}/balance?chain=0x171`;
      
      const plsBalanceResponse = await fetch(plsBalanceUrl, {
        headers: {
          'X-API-Key': MORALIS_API_KEY,
          'Content-Type': 'application/json'
        }
      });
      
      const plsBalanceData = await plsBalanceResponse.json();
      
      results.tests.plsBalance = {
        success: plsBalanceResponse.ok,
        status: plsBalanceResponse.status,
        data: plsBalanceData,
        balance: plsBalanceData?.balance || '0',
        url: plsBalanceUrl
      };
      
      console.log(`✅ PLS Balance: ${plsBalanceData?.balance || '0'}`);
      
    } catch (error) {
      results.tests.plsBalance = {
        success: false,
        error: error.message
      };
      console.error(`❌ PLS Balance Error:`, error.message);
    }

    // Summary
    results.summary = {
      totalTests: Object.keys(results.tests).length,
      successfulTests: Object.values(results.tests).filter(t => t.success).length,
      totalTransactions: (results.tests.ethHistory?.count || 0) + (results.tests.plsHistory?.count || 0),
      totalTransfers: (results.tests.ethTransfers?.count || 0) + (results.tests.plsTransfers?.count || 0),
      hasEthBalance: parseFloat(results.tests.ethBalance?.balance || '0') > 0,
      hasPlsBalance: parseFloat(results.tests.plsBalance?.balance || '0') > 0
    };

    console.log(`📊 TEST SUMMARY:`, results.summary);

    return res.status(200).json({
      success: true,
      results: results
    });

  } catch (error) {
    console.error('💥 DIRECT TEST ERROR:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
} 