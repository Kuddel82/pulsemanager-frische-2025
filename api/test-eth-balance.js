// 🔍 ETH BALANCE TEST API - Diagnose und Fix für ETH Balance Problem
// Testet verschiedene Methoden um ETH Balance zu laden

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { address = '0x3f020b8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c' } = req.query;
  const MORALIS_API_KEY = process.env.MORALIS_API_KEY;

  console.log(`🔍 ETH BALANCE TEST: Testing balance for ${address}`);

  if (!MORALIS_API_KEY) {
    return res.status(500).json({
      error: 'Moralis API Key fehlt',
      success: false
    });
  }

  const results = {
    address: address,
    timestamp: new Date().toISOString(),
    tests: {}
  };

  try {
    // 🧪 TEST 1: Moralis Native Balance API
    console.log(`🧪 TEST 1: Moralis Native Balance API`);
    try {
      const response1 = await fetch(`https://deep-index.moralis.io/api/v2/${address}/balance?chain=0x1`, {
        headers: {
          'X-API-Key': MORALIS_API_KEY,
          'Accept': 'application/json'
        }
      });

      if (response1.ok) {
        const data1 = await response1.json();
        const balance1 = parseFloat(data1.balance) / 1e18;
        results.tests.moralis_native = {
          success: true,
          balance: data1.balance,
          balance_formatted: balance1,
          currency: 'ETH',
          status: response1.status
        };
        console.log(`✅ TEST 1: ${balance1} ETH`);
      } else {
        results.tests.moralis_native = {
          success: false,
          error: `${response1.status} - ${response1.statusText}`,
          status: response1.status
        };
        console.log(`❌ TEST 1: ${response1.status} - ${response1.statusText}`);
      }
    } catch (error) {
      results.tests.moralis_native = {
        success: false,
        error: error.message
      };
      console.log(`❌ TEST 1: ${error.message}`);
    }

    // 🧪 TEST 2: Etherscan API (Free)
    console.log(`🧪 TEST 2: Etherscan API`);
    try {
      const response2 = await fetch(`https://api.etherscan.io/api?module=account&action=balance&address=${address}&tag=latest`);
      
      if (response2.ok) {
        const data2 = await response2.json();
        if (data2.status === '1') {
          const balance2 = parseFloat(data2.result) / 1e18;
          results.tests.etherscan = {
            success: true,
            balance: data2.result,
            balance_formatted: balance2,
            currency: 'ETH',
            status: response2.status
          };
          console.log(`✅ TEST 2: ${balance2} ETH`);
        } else {
          results.tests.etherscan = {
            success: false,
            error: data2.message || 'Etherscan API error',
            status: response2.status
          };
          console.log(`❌ TEST 2: ${data2.message}`);
        }
      } else {
        results.tests.etherscan = {
          success: false,
          error: `${response2.status} - ${response2.statusText}`,
          status: response2.status
        };
        console.log(`❌ TEST 2: ${response2.status} - ${response2.statusText}`);
      }
    } catch (error) {
      results.tests.etherscan = {
        success: false,
        error: error.message
      };
      console.log(`❌ TEST 2: ${error.message}`);
    }

    // 🧪 TEST 3: CoinGecko API (Free)
    console.log(`🧪 TEST 3: CoinGecko API`);
    try {
      const response3 = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
      
      if (response3.ok) {
        const data3 = await response3.json();
        if (data3.ethereum?.usd) {
          results.tests.coingecko_eth_price = {
            success: true,
            price: data3.ethereum.usd,
            currency: 'USD',
            status: response3.status
          };
          console.log(`✅ TEST 3: $${data3.ethereum.usd} ETH price`);
        } else {
          results.tests.coingecko_eth_price = {
            success: false,
            error: 'No ETH price data',
            status: response3.status
          };
          console.log(`❌ TEST 3: No ETH price data`);
        }
      } else {
        results.tests.coingecko_eth_price = {
          success: false,
          error: `${response3.status} - ${response3.statusText}`,
          status: response3.status
        };
        console.log(`❌ TEST 3: ${response3.status} - ${response3.statusText}`);
      }
    } catch (error) {
      results.tests.coingecko_eth_price = {
        success: false,
        error: error.message
      };
      console.log(`❌ TEST 3: ${error.message}`);
    }

    // 🧪 TEST 4: Proxy API Test
    console.log(`🧪 TEST 4: Proxy API Test`);
    try {
      const response4 = await fetch(`/api/moralis-v2?endpoint=native-balance&address=${address}&chain=0x1`);
      
      if (response4.ok) {
        const data4 = await response4.json();
        if (data4.balance) {
          const balance4 = parseFloat(data4.balance) / 1e18;
          results.tests.proxy_api = {
            success: true,
            balance: data4.balance,
            balance_formatted: balance4,
            currency: data4.currency || 'ETH',
            status: response4.status
          };
          console.log(`✅ TEST 4: ${balance4} ETH via Proxy`);
        } else {
          results.tests.proxy_api = {
            success: false,
            error: 'No balance data in response',
            status: response4.status,
            data: data4
          };
          console.log(`❌ TEST 4: No balance data`);
        }
      } else {
        results.tests.proxy_api = {
          success: false,
          error: `${response4.status} - ${response4.statusText}`,
          status: response4.status
        };
        console.log(`❌ TEST 4: ${response4.status} - ${response4.statusText}`);
      }
    } catch (error) {
      results.tests.proxy_api = {
        success: false,
        error: error.message
      };
      console.log(`❌ TEST 4: ${error.message}`);
    }

    // 📊 SUMMARY
    const successfulTests = Object.values(results.tests).filter(test => test.success).length;
    const totalTests = Object.keys(results.tests).length;
    
    results.summary = {
      total_tests: totalTests,
      successful_tests: successfulTests,
      success_rate: `${((successfulTests / totalTests) * 100).toFixed(1)}%`,
      recommended_balance: null,
      recommended_source: null
    };

    // 🎯 FIND BEST BALANCE
    if (results.tests.moralis_native?.success) {
      results.summary.recommended_balance = results.tests.moralis_native.balance_formatted;
      results.summary.recommended_source = 'moralis_native';
    } else if (results.tests.etherscan?.success) {
      results.summary.recommended_balance = results.tests.etherscan.balance_formatted;
      results.summary.recommended_source = 'etherscan';
    } else if (results.tests.proxy_api?.success) {
      results.summary.recommended_balance = results.tests.proxy_api.balance_formatted;
      results.summary.recommended_source = 'proxy_api';
    }

    console.log(`📊 SUMMARY: ${successfulTests}/${totalTests} tests successful`);
    if (results.summary.recommended_balance !== null) {
      console.log(`🎯 RECOMMENDED: ${results.summary.recommended_balance} ETH from ${results.summary.recommended_source}`);
    }

    return res.status(200).json({
      success: true,
      ...results
    });

  } catch (error) {
    console.error(`💥 ETH BALANCE TEST ERROR: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: error.message,
      address: address,
      timestamp: new Date().toISOString()
    });
  }
} 