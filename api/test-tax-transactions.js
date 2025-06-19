// 🔍 TAX TRANSACTIONS TEST API - Diagnose für 0 Transaktionen Problem
// Testet verschiedene Methoden um Transaktionen für Tax Report zu laden

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

  console.log(`🔍 TAX TRANSACTIONS TEST: Testing transactions for ${address}`);

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
    // 🧪 TEST 1: Moralis ERC20 Transfers (Ethereum)
    console.log(`🧪 TEST 1: Moralis ERC20 Transfers (Ethereum)`);
    try {
      const response1 = await fetch(`https://deep-index.moralis.io/api/v2/${address}/erc20/transfers?chain=0x1&limit=10`, {
        headers: {
          'X-API-Key': MORALIS_API_KEY,
          'Accept': 'application/json'
        }
      });

      if (response1.ok) {
        const data1 = await response1.json();
        results.tests.erc20_ethereum = {
          success: true,
          count: data1.result?.length || 0,
          status: response1.status,
          sample: data1.result?.slice(0, 2) || []
        };
        console.log(`✅ TEST 1: ${data1.result?.length || 0} ERC20 transfers on Ethereum`);
      } else {
        results.tests.erc20_ethereum = {
          success: false,
          error: `${response1.status} - ${response1.statusText}`,
          status: response1.status
        };
        console.log(`❌ TEST 1: ${response1.status} - ${response1.statusText}`);
      }
    } catch (error) {
      results.tests.erc20_ethereum = {
        success: false,
        error: error.message
      };
      console.log(`❌ TEST 1: ${error.message}`);
    }

    // 🧪 TEST 2: Moralis ERC20 Transfers (PulseChain)
    console.log(`🧪 TEST 2: Moralis ERC20 Transfers (PulseChain)`);
    try {
      const response2 = await fetch(`https://deep-index.moralis.io/api/v2/${address}/erc20/transfers?chain=0x171&limit=10`, {
        headers: {
          'X-API-Key': MORALIS_API_KEY,
          'Accept': 'application/json'
        }
      });

      if (response2.ok) {
        const data2 = await response2.json();
        results.tests.erc20_pulsechain = {
          success: true,
          count: data2.result?.length || 0,
          status: response2.status,
          sample: data2.result?.slice(0, 2) || []
        };
        console.log(`✅ TEST 2: ${data2.result?.length || 0} ERC20 transfers on PulseChain`);
      } else {
        results.tests.erc20_pulsechain = {
          success: false,
          error: `${response2.status} - ${response2.statusText}`,
          status: response2.status
        };
        console.log(`❌ TEST 2: ${response2.status} - ${response2.statusText}`);
      }
    } catch (error) {
      results.tests.erc20_pulsechain = {
        success: false,
        error: error.message
      };
      console.log(`❌ TEST 2: ${error.message}`);
    }

    // 🧪 TEST 3: Moralis Native Transactions (Ethereum)
    console.log(`🧪 TEST 3: Moralis Native Transactions (Ethereum)`);
    try {
      const response3 = await fetch(`https://deep-index.moralis.io/api/v2/${address}?chain=0x1&limit=10`, {
        headers: {
          'X-API-Key': MORALIS_API_KEY,
          'Accept': 'application/json'
        }
      });

      if (response3.ok) {
        const data3 = await response3.json();
        results.tests.native_ethereum = {
          success: true,
          count: data3.result?.length || 0,
          status: response3.status,
          sample: data3.result?.slice(0, 2) || []
        };
        console.log(`✅ TEST 3: ${data3.result?.length || 0} native transactions on Ethereum`);
      } else {
        results.tests.native_ethereum = {
          success: false,
          error: `${response3.status} - ${response3.statusText}`,
          status: response3.status
        };
        console.log(`❌ TEST 3: ${response3.status} - ${response3.statusText}`);
      }
    } catch (error) {
      results.tests.native_ethereum = {
        success: false,
        error: error.message
      };
      console.log(`❌ TEST 3: ${error.message}`);
    }

    // 🧪 TEST 4: Moralis Native Transactions (PulseChain)
    console.log(`🧪 TEST 4: Moralis Native Transactions (PulseChain)`);
    try {
      const response4 = await fetch(`https://deep-index.moralis.io/api/v2/${address}?chain=0x171&limit=10`, {
        headers: {
          'X-API-Key': MORALIS_API_KEY,
          'Accept': 'application/json'
        }
      });

      if (response4.ok) {
        const data4 = await response4.json();
        results.tests.native_pulsechain = {
          success: true,
          count: data4.result?.length || 0,
          status: response4.status,
          sample: data4.result?.slice(0, 2) || []
        };
        console.log(`✅ TEST 4: ${data4.result?.length || 0} native transactions on PulseChain`);
      } else {
        results.tests.native_pulsechain = {
          success: false,
          error: `${response4.status} - ${response4.statusText}`,
          status: response4.status
        };
        console.log(`❌ TEST 4: ${response4.status} - ${response4.statusText}`);
      }
    } catch (error) {
      results.tests.native_pulsechain = {
        success: false,
        error: error.message
      };
      console.log(`❌ TEST 4: ${error.message}`);
    }

    // 🧪 TEST 5: Tax Report API Test
    console.log(`🧪 TEST 5: Tax Report API Test`);
    try {
      const response5 = await fetch(`/api/german-tax-report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          address: address,
          chain: 'all',
          limit: 100
        })
      });

      if (response5.ok) {
        const data5 = await response5.json();
        results.tests.tax_report_api = {
          success: true,
          count: data5.taxReport?.transactions?.length || 0,
          status: response5.status,
          summary: data5.taxReport?.summary || {},
          metadata: data5.taxReport?.metadata || {}
        };
        console.log(`✅ TEST 5: ${data5.taxReport?.transactions?.length || 0} transactions via Tax Report API`);
      } else {
        results.tests.tax_report_api = {
          success: false,
          error: `${response5.status} - ${response5.statusText}`,
          status: response5.status
        };
        console.log(`❌ TEST 5: ${response5.status} - ${response5.statusText}`);
      }
    } catch (error) {
      results.tests.tax_report_api = {
        success: false,
        error: error.message
      };
      console.log(`❌ TEST 5: ${error.message}`);
    }

    // 🧪 TEST 6: Etherscan API Test (Free)
    console.log(`🧪 TEST 6: Etherscan API Test`);
    try {
      const response6 = await fetch(`https://api.etherscan.io/api?module=account&action=txlist&address=${address}&startblock=0&endblock=latest&page=1&offset=10&sort=desc`);
      
      if (response6.ok) {
        const data6 = await response6.json();
        if (data6.status === '1') {
          results.tests.etherscan = {
            success: true,
            count: data6.result?.length || 0,
            status: response6.status,
            sample: data6.result?.slice(0, 2) || []
          };
          console.log(`✅ TEST 6: ${data6.result?.length || 0} transactions via Etherscan`);
        } else {
          results.tests.etherscan = {
            success: false,
            error: data6.message || 'Etherscan API error',
            status: response6.status
          };
          console.log(`❌ TEST 6: ${data6.message}`);
        }
      } else {
        results.tests.etherscan = {
          success: false,
          error: `${response6.status} - ${response6.statusText}`,
          status: response6.status
        };
        console.log(`❌ TEST 6: ${response6.status} - ${response6.statusText}`);
      }
    } catch (error) {
      results.tests.etherscan = {
        success: false,
        error: error.message
      };
      console.log(`❌ TEST 6: ${error.message}`);
    }

    // 📊 SUMMARY
    const successfulTests = Object.values(results.tests).filter(test => test.success).length;
    const totalTests = Object.keys(results.tests).length;
    
    // Berechne Gesamtanzahl Transaktionen
    let totalTransactions = 0;
    Object.values(results.tests).forEach(test => {
      if (test.success && test.count) {
        totalTransactions += test.count;
      }
    });
    
    results.summary = {
      total_tests: totalTests,
      successful_tests: successfulTests,
      success_rate: `${((successfulTests / totalTests) * 100).toFixed(1)}%`,
      total_transactions: totalTransactions,
      has_transactions: totalTransactions > 0,
      recommended_action: totalTransactions === 0 ? 'Check wallet address or try different chains' : 'Transactions found'
    };

    console.log(`📊 SUMMARY: ${successfulTests}/${totalTests} tests successful, ${totalTransactions} total transactions`);
    if (totalTransactions === 0) {
      console.log(`⚠️ WARNING: No transactions found for ${address}`);
    } else {
      console.log(`✅ SUCCESS: Found ${totalTransactions} transactions`);
    }

    return res.status(200).json({
      success: true,
      ...results
    });

  } catch (error) {
    console.error(`💥 TAX TRANSACTIONS TEST ERROR: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: error.message,
      address: address,
      timestamp: new Date().toISOString()
    });
  }
} 