/**
 * 🔥 DIREKTER MORALIS TEST - Zeigt sofort was passiert
 * 
 * Testet direkt die Moralis APIs ohne Fallback-Logik
 */

const MORALIS_API_KEY = process.env.MORALIS_API_KEY;

export default async function handler(req, res) {
  console.log('🔥🔥🔥 DIREKTER MORALIS TEST STARTING 🔥🔥🔥');
  
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

    const { address } = req.method === 'POST' ? req.body : req.query;

    if (!address) {
      return res.status(400).json({
        error: 'Missing address parameter',
        success: false
      });
    }

    console.log('🎯 TESTING WALLET:', address);
    console.log('🔑 API KEY:', MORALIS_API_KEY.slice(0, 10) + '...');

    const results = {
      walletAddress: address,
      tests: []
    };

    // Test 1: Wallet History API mit 0x1 (Ethereum)
    console.log('\n📋 TEST 1: Wallet History API (0x1)');
    try {
      const url = `https://deep-index.moralis.io/api/v2/wallets/${address}/history?chain=0x1&limit=10`;
      console.log('🚀 URL:', url);
      
      const response = await fetch(url, {
        headers: {
          'X-API-Key': MORALIS_API_KEY,
          'Accept': 'application/json'
        }
      });

      console.log('📡 Response Status:', response.status);
      console.log('📡 Response Headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const data = await response.json();
        console.log('✅ SUCCESS - Data:', data);
        results.tests.push({
          test: 'Wallet History (0x1)',
          success: true,
          status: response.status,
          count: data.result?.length || 0,
          data: data
        });
      } else {
        const errorText = await response.text();
        console.log('❌ ERROR - Status:', response.status);
        console.log('❌ ERROR - Text:', errorText);
        results.tests.push({
          test: 'Wallet History (0x1)',
          success: false,
          status: response.status,
          error: errorText
        });
      }
    } catch (error) {
      console.log('💥 EXCEPTION:', error);
      results.tests.push({
        test: 'Wallet History (0x1)',
        success: false,
        error: error.message
      });
    }

    // Test 2: ERC20 Transfers mit 0x1 (Ethereum)
    console.log('\n🪙 TEST 2: ERC20 Transfers (0x1)');
    try {
      const url = `https://deep-index.moralis.io/api/v2/${address}/erc20/transfers?chain=0x1&limit=10`;
      console.log('🚀 URL:', url);
      
      const response = await fetch(url, {
        headers: {
          'X-API-Key': MORALIS_API_KEY,
          'Accept': 'application/json'
        }
      });

      console.log('📡 Response Status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ SUCCESS - Data:', data);
        results.tests.push({
          test: 'ERC20 Transfers (0x1)',
          success: true,
          status: response.status,
          count: data.result?.length || 0,
          data: data
        });
      } else {
        const errorText = await response.text();
        console.log('❌ ERROR - Status:', response.status);
        console.log('❌ ERROR - Text:', errorText);
        results.tests.push({
          test: 'ERC20 Transfers (0x1)',
          success: false,
          status: response.status,
          error: errorText
        });
      }
    } catch (error) {
      console.log('💥 EXCEPTION:', error);
      results.tests.push({
        test: 'ERC20 Transfers (0x1)',
        success: false,
        error: error.message
      });
    }

    // Test 3: ERC20 Transfers mit 369 (PulseChain)
    console.log('\n🟣 TEST 3: ERC20 Transfers (369)');
    try {
      const url = `https://deep-index.moralis.io/api/v2/${address}/erc20/transfers?chain=369&limit=10`;
      console.log('🚀 URL:', url);
      
      const response = await fetch(url, {
        headers: {
          'X-API-Key': MORALIS_API_KEY,
          'Accept': 'application/json'
        }
      });

      console.log('📡 Response Status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ SUCCESS - Data:', data);
        results.tests.push({
          test: 'ERC20 Transfers (369)',
          success: true,
          status: response.status,
          count: data.result?.length || 0,
          data: data
        });
      } else {
        const errorText = await response.text();
        console.log('❌ ERROR - Status:', response.status);
        console.log('❌ ERROR - Text:', errorText);
        results.tests.push({
          test: 'ERC20 Transfers (369)',
          success: false,
          status: response.status,
          error: errorText
        });
      }
    } catch (error) {
      console.log('💥 EXCEPTION:', error);
      results.tests.push({
        test: 'ERC20 Transfers (369)',
        success: false,
        error: error.message
      });
    }

    // Test 4: ERC20 Transfers mit pulsechain (PulseChain)
    console.log('\n🟣 TEST 4: ERC20 Transfers (pulsechain)');
    try {
      const url = `https://deep-index.moralis.io/api/v2/${address}/erc20/transfers?chain=pulsechain&limit=10`;
      console.log('🚀 URL:', url);
      
      const response = await fetch(url, {
        headers: {
          'X-API-Key': MORALIS_API_KEY,
          'Accept': 'application/json'
        }
      });

      console.log('📡 Response Status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ SUCCESS - Data:', data);
        results.tests.push({
          test: 'ERC20 Transfers (pulsechain)',
          success: true,
          status: response.status,
          count: data.result?.length || 0,
          data: data
        });
      } else {
        const errorText = await response.text();
        console.log('❌ ERROR - Status:', response.status);
        console.log('❌ ERROR - Text:', errorText);
        results.tests.push({
          test: 'ERC20 Transfers (pulsechain)',
          success: false,
          status: response.status,
          error: errorText
        });
      }
    } catch (error) {
      console.log('💥 EXCEPTION:', error);
      results.tests.push({
        test: 'ERC20 Transfers (pulsechain)',
        success: false,
        error: error.message
      });
    }

    console.log('\n🏁 ALL TESTS COMPLETE');

    return res.status(200).json({
      success: true,
      results: results,
      summary: {
        totalTests: results.tests.length,
        successfulTests: results.tests.filter(t => t.success).length,
        failedTests: results.tests.filter(t => !t.success).length,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('💥 TEST API ERROR:', error);
    return res.status(500).json({
      success: false,
      error: 'Test API error',
      message: error.message
    });
  }
} 