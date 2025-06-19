/**
 * 🔥 TEST API - Richtige Wallet mit 9562 PLS Transaktionen
 * 
 * Testet die Wallet 0x3f020b5bcfdfa9b5970b1b22bba6da6387d0ea7a
 * die vorher 9562 PulseChain Transaktionen hatte!
 */

const MORALIS_API_KEY = process.env.MORALIS_API_KEY;

export default async function handler(req, res) {
  console.log('🔥🔥🔥 TESTING CORRECT WALLET API 🔥🔥🔥');
  
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

    // 🔥 RICHTIGE WALLET - Die mit 9562 PLS Transaktionen!
    const correctWallet = '0x3f020b5bcfdfa9b5970b1b22bba6da6387d0ea7a';
    
    console.log('🎯 TESTING CORRECT WALLET:', correctWallet);
    console.log('🎯 Diese Wallet hatte vorher 9562+ PLS Transaktionen!');

    const results = {
      pulsechain: {},
      ethereum: {},
      alternativeChains: {}
    };

    // Test 1: PulseChain mit verschiedenen Chain IDs
    console.log('\n🟣 TESTING PULSECHAIN...');
    
    const pulsechainChainIds = ['0x171', '369', 'pulsechain'];
    
    for (const chainId of pulsechainChainIds) {
      console.log(`🔗 Testing PulseChain with chain ID: ${chainId}`);
      
      try {
        const url = `https://deep-index.moralis.io/api/v2/${correctWallet}/erc20/transfers?chain=${chainId}&limit=10`;
        
        const response = await fetch(url, {
          headers: {
            'X-API-Key': MORALIS_API_KEY,
            'Accept': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          const count = data.result?.length || 0;
          
          results.pulsechain[chainId] = {
            success: true,
            count: count,
            hasData: count > 0,
            sample: data.result?.[0] || null
          };
          
          console.log(`✅ PulseChain (${chainId}): ${count} transfers found`);
          
          if (count > 0) {
            console.log(`🎯 RICHTIGE CHAIN ID GEFUNDEN: ${chainId}`);
            console.log(`📄 Sample transaction:`, data.result[0]);
          }
        } else {
          const errorText = await response.text();
          results.pulsechain[chainId] = {
            success: false,
            status: response.status,
            error: errorText
          };
          console.log(`❌ PulseChain (${chainId}): ${response.status} - ${errorText}`);
        }
      } catch (error) {
        results.pulsechain[chainId] = {
          success: false,
          error: error.message
        };
        console.log(`💥 PulseChain (${chainId}): ${error.message}`);
      }
    }

    // Test 2: Ethereum
    console.log('\n📊 TESTING ETHEREUM...');
    
    try {
      const url = `https://deep-index.moralis.io/api/v2/${correctWallet}/erc20/transfers?chain=0x1&limit=10`;
      
      const response = await fetch(url, {
        headers: {
          'X-API-Key': MORALIS_API_KEY,
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const count = data.result?.length || 0;
        
        results.ethereum = {
          success: true,
          count: count,
          hasData: count > 0,
          sample: data.result?.[0] || null
        };
        
        console.log(`✅ Ethereum: ${count} transfers found`);
      } else {
        const errorText = await response.text();
        results.ethereum = {
          success: false,
          status: response.status,
          error: errorText
        };
        console.log(`❌ Ethereum: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      results.ethereum = {
        success: false,
        error: error.message
      };
      console.log(`💥 Ethereum: ${error.message}`);
    }

    // Test 3: Wallet History API
    console.log('\n📋 TESTING WALLET HISTORY API...');
    
    try {
      const url = `https://deep-index.moralis.io/api/v2/wallets/${correctWallet}/history?chain=0x171&limit=10`;
      
      const response = await fetch(url, {
        headers: {
          'X-API-Key': MORALIS_API_KEY,
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const count = data.result?.length || 0;
        
        results.walletHistory = {
          success: true,
          count: count,
          hasData: count > 0,
          sample: data.result?.[0] || null
        };
        
        console.log(`✅ Wallet History: ${count} transactions found`);
      } else {
        const errorText = await response.text();
        results.walletHistory = {
          success: false,
          status: response.status,
          error: errorText
        };
        console.log(`❌ Wallet History: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      results.walletHistory = {
        success: false,
        error: error.message
      };
      console.log(`💥 Wallet History: ${error.message}`);
    }

    console.log('\n🏁 TEST COMPLETE - Returning results');

    return res.status(200).json({
      success: true,
      walletAddress: correctWallet,
      expectedTransactions: '9562+ PLS + 45+ ETH',
      results: results,
      summary: {
        pulsechainWorking: Object.values(results.pulsechain).some(r => r.success && r.hasData),
        ethereumWorking: results.ethereum.success && results.ethereum.hasData,
        walletHistoryWorking: results.walletHistory?.success && results.walletHistory?.hasData,
        bestChainId: Object.entries(results.pulsechain).find(([id, r]) => r.success && r.hasData)?.[0] || 'none'
      },
      timestamp: new Date().toISOString()
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