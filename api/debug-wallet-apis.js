/**
 * 🔍 DEBUG SCRIPT - Warum bekommst du 0 Transaktionen?
 * 
 * Führe das in der Browser Console aus oder als separaten API Call
 */

// 1. TESTE DIREKT die Moralis APIs
async function debugWalletAPIs(address, apiKey) {
  console.log('🔥 DEBUGGING WALLET APIs für:', address);
  
  const chains = [
    { id: '0x1', name: 'Ethereum' },
    { id: '0x171', name: 'PulseChain' }
  ];
  
  for (const chain of chains) {
    console.log(`\n🔗 TESTING ${chain.name} (${chain.id})...`);
    
    // TEST 1: Wallet History API (der neue)
    await testWalletHistory(address, chain.id, apiKey);
    
    // TEST 2: ERC20 Transfers (der alte)
    await testERC20Transfers(address, chain.id, apiKey);
    
    // TEST 3: Native Transactions
    await testNativeTransactions(address, chain.id, apiKey);
    
    // TEST 4: Simple Balance Check
    await testTokenBalance(address, chain.id, apiKey);
  }
}

async function testWalletHistory(address, chainId, apiKey) {
  console.log(`📋 Testing Wallet History API...`);
  
  const url = `https://deep-index.moralis.io/api/v2/wallets/${address}/history?chain=${chainId}&limit=10`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'X-API-Key': apiKey,
        'Accept': 'application/json'
      }
    });
    
    console.log(`📡 Wallet History Response: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Wallet History Success: ${data.result?.length || 0} transactions`);
      if (data.result?.length > 0) {
        console.log(`📄 Sample transaction:`, data.result[0]);
      } else {
        console.log(`⚠️ Wallet History: No transactions found`);
        console.log(`🔍 Full response:`, data);
      }
    } else {
      const errorText = await response.text();
      console.error(`❌ Wallet History Failed: ${response.status} - ${errorText}`);
    }
  } catch (error) {
    console.error(`💥 Wallet History Exception:`, error);
  }
}

async function testERC20Transfers(address, chainId, apiKey) {
  console.log(`🪙 Testing ERC20 Transfers API...`);
  
  const url = `https://deep-index.moralis.io/api/v2/${address}/erc20/transfers?chain=${chainId}&limit=10`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'X-API-Key': apiKey,
        'Accept': 'application/json'
      }
    });
    
    console.log(`📡 ERC20 Transfers Response: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ ERC20 Transfers Success: ${data.result?.length || 0} transfers`);
      if (data.result?.length > 0) {
        console.log(`📄 Sample transfer:`, data.result[0]);
      } else {
        console.log(`⚠️ ERC20 Transfers: No transfers found`);
      }
    } else {
      const errorText = await response.text();
      console.error(`❌ ERC20 Transfers Failed: ${response.status} - ${errorText}`);
    }
  } catch (error) {
    console.error(`💥 ERC20 Transfers Exception:`, error);
  }
}

async function testNativeTransactions(address, chainId, apiKey) {
  console.log(`⛽ Testing Native Transactions API...`);
  
  const url = `https://deep-index.moralis.io/api/v2/${address}?chain=${chainId}&limit=10`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'X-API-Key': apiKey,
        'Accept': 'application/json'
      }
    });
    
    console.log(`📡 Native Transactions Response: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Native Transactions Success: ${data.result?.length || 0} transactions`);
      if (data.result?.length > 0) {
        console.log(`📄 Sample transaction:`, data.result[0]);
      } else {
        console.log(`⚠️ Native Transactions: No transactions found`);
      }
    } else {
      const errorText = await response.text();
      console.error(`❌ Native Transactions Failed: ${response.status} - ${errorText}`);
    }
  } catch (error) {
    console.error(`💥 Native Transactions Exception:`, error);
  }
}

async function testTokenBalance(address, chainId, apiKey) {
  console.log(`💰 Testing Token Balance API...`);
  
  const url = `https://deep-index.moralis.io/api/v2/${address}/erc20?chain=${chainId}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'X-API-Key': apiKey,
        'Accept': 'application/json'
      }
    });
    
    console.log(`📡 Token Balance Response: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Token Balance Success: ${data?.length || 0} tokens`);
      if (data?.length > 0) {
        console.log(`📄 Sample token:`, data[0]);
      } else {
        console.log(`⚠️ Token Balance: No tokens found`);
      }
    } else {
      const errorText = await response.text();
      console.error(`❌ Token Balance Failed: ${response.status} - ${errorText}`);
    }
  } catch (error) {
    console.error(`💥 Token Balance Exception:`, error);
  }
}

// 2. TESTE Alternative Chain IDs
async function testAlternativeChainIds(address, apiKey) {
  console.log('\n🔗 TESTING ALTERNATIVE CHAIN IDs...');
  
  const alternativeChains = [
    { id: 'eth', name: 'Ethereum (String)' },
    { id: '1', name: 'Ethereum (Number)' },
    { id: 'pulsechain', name: 'PulseChain (String)' },
    { id: '369', name: 'PulseChain (Decimal)' }
  ];
  
  for (const chain of alternativeChains) {
    console.log(`\n🧪 Testing ${chain.name} (${chain.id})...`);
    
    const url = `https://deep-index.moralis.io/api/v2/${address}/erc20/transfers?chain=${chain.id}&limit=5`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'X-API-Key': apiKey,
          'Accept': 'application/json'
        }
      });
      
      console.log(`📡 ${chain.name}: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ ${chain.name}: ${data.result?.length || 0} transfers found`);
      } else {
        const errorText = await response.text();
        console.log(`❌ ${chain.name}: ${errorText}`);
      }
    } catch (error) {
      console.log(`💥 ${chain.name}: ${error.message}`);
    }
  }
}

// 3. TESTE BEKANNTE WALLETS (um sicherzustellen, dass API grundsätzlich funktioniert)
async function testKnownWallets(apiKey) {
  console.log('\n👑 TESTING KNOWN ACTIVE WALLETS...');
  
  const knownWallets = [
    { address: '0xddfabcdc4d8ffc6d5beaf154f18b778f892a0740', name: 'Coinbase 3' },
    { address: '0x28c6c06298d514db089934071355e5743bf21d60', name: 'Binance 14' },
    { address: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', name: 'WBTC Contract' }
  ];
  
  for (const wallet of knownWallets) {
    console.log(`\n🏦 Testing ${wallet.name}...`);
    
    const url = `https://deep-index.moralis.io/api/v2/${wallet.address}/erc20/transfers?chain=0x1&limit=5`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'X-API-Key': apiKey,
          'Accept': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ ${wallet.name}: ${data.result?.length || 0} transfers (Should have many)`);
      } else {
        console.log(`❌ ${wallet.name}: ${response.status}`);
      }
    } catch (error) {
      console.log(`💥 ${wallet.name}: ${error.message}`);
    }
  }
}

// 4. HAUPTFUNKTION - Führe alle Tests aus
async function runFullDiagnostic() {
  console.log('🔥🔥🔥 FULL WALLET DIAGNOSTIC STARTING 🔥🔥🔥');
  
  // Ersetze diese Werte mit deinen echten Daten
  const YOUR_WALLET = '0x3f020b...'; // Deine echte Wallet-Adresse
  const YOUR_API_KEY = 'YOUR_MORALIS_API_KEY'; // Dein echter API Key
  
  if (YOUR_WALLET === '0x3f020b...' || YOUR_API_KEY === 'YOUR_MORALIS_API_KEY') {
    console.error('🚨 BITTE ERST DEINE ECHTEN WERTE EINTRAGEN!');
    return;
  }
  
  // Test 1: Deine Wallet
  await debugWalletAPIs(YOUR_WALLET, YOUR_API_KEY);
  
  // Test 2: Alternative Chain IDs
  await testAlternativeChainIds(YOUR_WALLET, YOUR_API_KEY);
  
  // Test 3: Bekannte Wallets (um API zu validieren)
  await testKnownWallets(YOUR_API_KEY);
  
  console.log('\n🏁 DIAGNOSTIC COMPLETE - Check the results above!');
}

/**
 * 🔥 API ENDPOINT - Für Browser Console Tests
 */
export default async function handler(req, res) {
  console.log('🔍 DEBUG WALLET API ENDPOINT STARTING');
  
  try {
    // CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    const { address, apiKey } = req.method === 'POST' ? req.body : req.query;

    if (!address || !apiKey) {
      return res.status(400).json({
        error: 'Missing address or apiKey parameter',
        usage: 'POST /api/debug-wallet-apis with { address: "0x...", apiKey: "..." }',
        success: false
      });
    }

    console.log(`🔍 DEBUGGING WALLET: ${address.slice(0, 8)}...`);

    // Führe alle Tests aus
    const results = {
      walletAPIs: [],
      alternativeChains: [],
      knownWallets: []
    };

    // Test 1: Wallet APIs
    const chains = [
      { id: '0x1', name: 'Ethereum' },
      { id: '0x171', name: 'PulseChain' }
    ];
    
    for (const chain of chains) {
      console.log(`\n🔗 TESTING ${chain.name} (${chain.id})...`);
      
      // Test Wallet History
      const walletHistoryResult = await testWalletHistoryAPI(address, chain.id, apiKey);
      results.walletAPIs.push({
        chain: chain.name,
        test: 'Wallet History',
        ...walletHistoryResult
      });
      
      // Test ERC20 Transfers
      const erc20Result = await testERC20TransfersAPI(address, chain.id, apiKey);
      results.walletAPIs.push({
        chain: chain.name,
        test: 'ERC20 Transfers',
        ...erc20Result
      });
    }

    // Test 2: Alternative Chain IDs
    const alternativeChains = [
      { id: 'eth', name: 'Ethereum (String)' },
      { id: '1', name: 'Ethereum (Number)' },
      { id: 'pulsechain', name: 'PulseChain (String)' },
      { id: '369', name: 'PulseChain (Decimal)' }
    ];
    
    for (const chain of alternativeChains) {
      const result = await testAlternativeChainAPI(address, chain.id, chain.name, apiKey);
      results.alternativeChains.push(result);
    }

    // Test 3: Known Wallets
    const knownWallets = [
      { address: '0xddfabcdc4d8ffc6d5beaf154f18b778f892a0740', name: 'Coinbase 3' },
      { address: '0x28c6c06298d514db089934071355e5743bf21d60', name: 'Binance 14' }
    ];
    
    for (const wallet of knownWallets) {
      const result = await testKnownWalletAPI(wallet.address, wallet.name, apiKey);
      results.knownWallets.push(result);
    }

    console.log('✅ DEBUG COMPLETE - Returning results');

    return res.status(200).json({
      success: true,
      debugResults: results,
      summary: {
        totalTests: results.walletAPIs.length + results.alternativeChains.length + results.knownWallets.length,
        walletAddress: address.slice(0, 8) + '...',
        timestamp: new Date().toISOString()
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

// Helper functions für API
async function testWalletHistoryAPI(address, chainId, apiKey) {
  const url = `https://deep-index.moralis.io/api/v2/wallets/${address}/history?chain=${chainId}&limit=10`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'X-API-Key': apiKey,
        'Accept': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        status: response.status,
        count: data.result?.length || 0,
        hasData: data.result?.length > 0
      };
    } else {
      const errorText = await response.text();
      return {
        success: false,
        status: response.status,
        error: errorText
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function testERC20TransfersAPI(address, chainId, apiKey) {
  const url = `https://deep-index.moralis.io/api/v2/${address}/erc20/transfers?chain=${chainId}&limit=10`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'X-API-Key': apiKey,
        'Accept': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        status: response.status,
        count: data.result?.length || 0,
        hasData: data.result?.length > 0
      };
    } else {
      const errorText = await response.text();
      return {
        success: false,
        status: response.status,
        error: errorText
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function testAlternativeChainAPI(address, chainId, chainName, apiKey) {
  const url = `https://deep-index.moralis.io/api/v2/${address}/erc20/transfers?chain=${chainId}&limit=5`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'X-API-Key': apiKey,
        'Accept': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      return {
        chainId,
        chainName,
        success: true,
        status: response.status,
        count: data.result?.length || 0,
        hasData: data.result?.length > 0
      };
    } else {
      const errorText = await response.text();
      return {
        chainId,
        chainName,
        success: false,
        status: response.status,
        error: errorText
      };
    }
  } catch (error) {
    return {
      chainId,
      chainName,
      success: false,
      error: error.message
    };
  }
}

async function testKnownWalletAPI(walletAddress, walletName, apiKey) {
  const url = `https://deep-index.moralis.io/api/v2/${walletAddress}/erc20/transfers?chain=0x1&limit=5`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'X-API-Key': apiKey,
        'Accept': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      return {
        walletName,
        success: true,
        status: response.status,
        count: data.result?.length || 0,
        hasData: data.result?.length > 0
      };
    } else {
      return {
        walletName,
        success: false,
        status: response.status
      };
    }
  } catch (error) {
    return {
      walletName,
      success: false,
      error: error.message
    };
  }
} 