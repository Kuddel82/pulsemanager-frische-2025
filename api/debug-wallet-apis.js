/**
 * 🔍 UNIVERSAL DEBUG API - Funktioniert für ALLE WALLETS
 * 
 * Testet jede Wallet-Adresse die übergeben wird
 * Findet die richtigen Chain IDs für jede Wallet
 */

const MORALIS_API_KEY = process.env.MORALIS_API_KEY;

export default async function handler(req, res) {
  console.log('🔍 UNIVERSAL DEBUG API - Testing ANY wallet');
  
  try {
    // CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    const { address, apiKey } = req.method === 'POST' ? req.body : req.query;

    if (!address) {
      return res.status(400).json({
        error: 'Missing address parameter',
        usage: 'POST /api/debug-wallet-apis with { address: "0x..." }',
        success: false
      });
    }

    // Use provided API key or environment variable
    const apiKeyToUse = apiKey || MORALIS_API_KEY;
    
    if (!apiKeyToUse) {
      return res.status(503).json({
        error: 'No API key provided',
        success: false
      });
    }

    console.log(`🔍 DEBUGGING WALLET: ${address.slice(0, 8)}...`);

    const results = {
      walletAddress: address,
      pulsechain: {},
      ethereum: {},
      walletHistory: {},
      summary: {}
    };

    // Test 1: PulseChain mit verschiedenen Chain IDs
    console.log('\n🟣 TESTING PULSECHAIN...');
    
    const pulsechainChainIds = ['0x171', '369', 'pulsechain'];
    
    for (const chainId of pulsechainChainIds) {
      console.log(`🔗 Testing PulseChain with chain ID: ${chainId}`);
      
      try {
        const url = `https://deep-index.moralis.io/api/v2/${address}/erc20/transfers?chain=${chainId}&limit=10`;
        
        const response = await fetch(url, {
          headers: {
            'X-API-Key': apiKeyToUse,
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
            console.log(`🎯 WORKING CHAIN ID: ${chainId}`);
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
      const url = `https://deep-index.moralis.io/api/v2/${address}/erc20/transfers?chain=0x1&limit=10`;
      
      const response = await fetch(url, {
        headers: {
          'X-API-Key': apiKeyToUse,
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
      const url = `https://deep-index.moralis.io/api/v2/wallets/${address}/history?chain=0x171&limit=10`;
      
      const response = await fetch(url, {
        headers: {
          'X-API-Key': apiKeyToUse,
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

    // Summary
    results.summary = {
      pulsechainWorking: Object.values(results.pulsechain).some(r => r.success && r.hasData),
      ethereumWorking: results.ethereum.success && results.ethereum.hasData,
      walletHistoryWorking: results.walletHistory?.success && results.walletHistory?.hasData,
      bestPulsechainChainId: Object.entries(results.pulsechain).find(([id, r]) => r.success && r.hasData)?.[0] || 'none',
      totalPulsechainTransactions: Object.values(results.pulsechain).reduce((sum, r) => sum + (r.count || 0), 0),
      totalEthereumTransactions: results.ethereum.count || 0,
      totalWalletHistoryTransactions: results.walletHistory?.count || 0
    };

    console.log('\n🏁 DEBUG COMPLETE - Returning results');

    return res.status(200).json({
      success: true,
      debugResults: results,
      summary: {
        totalTests: Object.keys(results.pulsechain).length + 2, // +2 for ETH and Wallet History
        walletAddress: address.slice(0, 8) + '...',
        timestamp: new Date().toISOString(),
        message: 'Universal debug for ANY wallet address'
      }
    });

  } catch (error) {
    console.error('💥 DEBUG API ERROR:', error);
    return res.status(500).json({
      success: false,
      error: 'Debug API error',
      message: error.message
    });
  }
} 