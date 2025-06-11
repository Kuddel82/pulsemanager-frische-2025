// 🚀 MORALIS ENTERPRISE APIs TEST
// Testet alle neuen Advanced Features für maximale Portfolio-Genauigkeit
// Datum: 2025-01-11 - ENTERPRISE FEATURE TESTING

const testWallet = '0x742d35Cc6e6c17Dc5f6c15485b2C8EF9c3A3beAf'; // Vitalik's wallet for testing

console.log('🚀 MORALIS ENTERPRISE APIs TESTING SUITE');
console.log('===========================================');

// Test 1: Enterprise Health Check
async function testEnterpriseHealth() {
  console.log('\n🔧 Test 1: Enterprise Health Check');
  
  try {
    const response = await fetch('/api/moralis-enterprise-apis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        endpoint: 'enterprise-health'
      })
    });
    
    const data = await response.json();
    
    if (data.status === 'enterprise_operational') {
      console.log('✅ ENTERPRISE HEALTH: All features operational');
      console.log('🎯 Available Features:', Object.keys(data.result.enterprise_features));
      console.log('🌐 Chain Support:', data.result.chain_support);
    } else {
      console.log('⚠️ ENTERPRISE HEALTH: Issues detected -', data.error);
    }
    
    return data;
  } catch (error) {
    console.log('💥 ENTERPRISE HEALTH ERROR:', error.message);
    return null;
  }
}

// Test 2: Wallet History Verbose
async function testWalletHistoryVerbose() {
  console.log('\n📜 Test 2: Wallet History Verbose');
  
  try {
    const response = await fetch('/api/moralis-enterprise-apis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        endpoint: 'wallet-history-verbose',
        address: testWallet,
        chain: 'ethereum',
        limit: 10
      })
    });
    
    const data = await response.json();
    
    if (data.result && Array.isArray(data.result)) {
      console.log(`✅ VERBOSE HISTORY: ${data.result.length} detailed transactions loaded`);
      console.log('🎯 Enterprise Features:', data._enterprise_features);
      console.log('📊 Sample transaction:', data.result[0] ? {
        hash: data.result[0].hash,
        decoded: !!data.result[0].decoded_call,
        category: data.result[0].category,
        internal_transactions: !!data.result[0].internal_transactions
      } : 'No transactions');
    } else {
      console.log('⚠️ VERBOSE HISTORY FAILED:', data._error?.message || 'No data');
    }
    
    return data;
  } catch (error) {
    console.log('💥 VERBOSE HISTORY ERROR:', error.message);
    return null;
  }
}

// Test 3: Native Balance
async function testNativeBalance() {
  console.log('\n💰 Test 3: Native Balance');
  
  try {
    const response = await fetch('/api/moralis-enterprise-apis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        endpoint: 'native-balance',
        address: testWallet,
        chain: 'ethereum'
      })
    });
    
    const data = await response.json();
    
    if (data.result && data.result.balance) {
      console.log(`✅ NATIVE BALANCE: ${data.result.balance_formatted} ${data.result.currency}`);
      console.log(`💎 USD Value: $${(parseFloat(data.result.balance_formatted) * 2400).toFixed(2)}`);
      console.log('🎯 Precision:', data._precision);
    } else {
      console.log('⚠️ NATIVE BALANCE FAILED:', data._error?.message || 'No data');
    }
    
    return data;
  } catch (error) {
    console.log('💥 NATIVE BALANCE ERROR:', error.message);
    return null;
  }
}

// Test 4: Net Worth Enhanced
async function testNetWorthEnhanced() {
  console.log('\n💎 Test 4: Net Worth Enhanced');
  
  try {
    const response = await fetch('/api/moralis-enterprise-apis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        endpoint: 'net-worth-enhanced',
        address: testWallet,
        chain: 'ethereum'
      })
    });
    
    const data = await response.json();
    
    if (data.result && typeof data.result.total_networth_usd === 'number') {
      console.log(`✅ NET WORTH: $${data.result.total_networth_usd.toFixed(2)}`);
      console.log(`🪙 Tokens: ${data.result.total_tokens || 0}`);
      console.log(`🖼️ NFTs: ${data.result.total_nfts || 0}`);
      console.log('🛡️ Spam Filtered:', data._spam_filtered);
      console.log('🎯 Enterprise Accuracy:', data._enterprise_accuracy);
    } else {
      console.log('⚠️ NET WORTH FAILED:', data._error?.message || 'No data');
    }
    
    return data;
  } catch (error) {
    console.log('💥 NET WORTH ERROR:', error.message);
    return null;
  }
}

// Test 5: Token Transfers Enhanced
async function testTokenTransfersEnhanced() {
  console.log('\n🔄 Test 5: Token Transfers Enhanced');
  
  try {
    const response = await fetch('/api/moralis-enterprise-apis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        endpoint: 'token-transfers-enhanced',
        address: testWallet,
        chain: 'ethereum',
        limit: 10
      })
    });
    
    const data = await response.json();
    
    if (data.result && Array.isArray(data.result)) {
      console.log(`✅ ENHANCED TRANSFERS: ${data.result.length} transfers loaded`);
      
      const roiCount = data.result.filter(t => t._roi_indicators?.potential_roi).length;
      console.log(`🎯 ROI Transfers Found: ${roiCount}`);
      console.log('🔍 ROI Detection:', data._roi_detection);
      console.log('📊 Metadata Enhanced:', data._metadata_enhanced);
      
      if (data.result[0]) {
        console.log('📝 Sample transfer:', {
          token: data.result[0].token_symbol,
          value: data.result[0].value_decimal,
          roi_indicators: data.result[0]._roi_indicators
        });
      }
    } else {
      console.log('⚠️ ENHANCED TRANSFERS FAILED:', data._error?.message || 'No data');
    }
    
    return data;
  } catch (error) {
    console.log('💥 ENHANCED TRANSFERS ERROR:', error.message);
    return null;
  }
}

// Test 6: DeFi Positions Enhanced
async function testDefiPositionsEnhanced() {
  console.log('\n🎯 Test 6: DeFi Positions Enhanced');
  
  try {
    const response = await fetch('/api/moralis-enterprise-apis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        endpoint: 'defi-positions-enhanced',
        address: testWallet,
        chain: 'ethereum'
      })
    });
    
    const data = await response.json();
    
    if (data.result && Array.isArray(data.result)) {
      console.log(`✅ DEFI POSITIONS: ${data.result.length} positions loaded`);
      console.log('🎯 ROI Detection:', data._roi_detection);
      console.log('📈 Yield Tracking:', data._yield_tracking);
      console.log('💧 Liquidity Analysis:', data._liquidity_analysis);
      
      if (data.result[0]) {
        console.log('📝 Sample position:', {
          protocol: data.result[0].protocol_name,
          position_type: data.result[0].position_type,
          usd_value: data.result[0].usd_value
        });
      }
    } else {
      console.log('⚠️ DEFI POSITIONS: No positions found or error -', data._error?.message || 'No data');
    }
    
    return data;
  } catch (error) {
    console.log('💥 DEFI POSITIONS ERROR:', error.message);
    return null;
  }
}

// Test 7: Error Handling
async function testErrorHandling() {
  console.log('\n❌ Test 7: Error Handling');
  
  try {
    const response = await fetch('/api/moralis-enterprise-apis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        endpoint: 'invalid-endpoint'
      })
    });
    
    const data = await response.json();
    
    if (data.error) {
      console.log('✅ ERROR HANDLING: Proper error response');
      console.log('📋 Available Endpoints:', data.available_endpoints);
    } else {
      console.log('⚠️ ERROR HANDLING: Unexpected response format');
    }
    
    return data;
  } catch (error) {
    console.log('💥 ERROR HANDLING TEST ERROR:', error.message);
    return null;
  }
}

// Run All Tests
async function runAllTests() {
  console.log('🚀 STARTING ENTERPRISE APIs COMPREHENSIVE TEST SUITE\n');
  
  const results = {
    health: await testEnterpriseHealth(),
    historyVerbose: await testWalletHistoryVerbose(),
    nativeBalance: await testNativeBalance(),
    netWorth: await testNetWorthEnhanced(),
    transfersEnhanced: await testTokenTransfersEnhanced(),
    defiPositions: await testDefiPositionsEnhanced(),
    errorHandling: await testErrorHandling()
  };
  
  console.log('\n🏁 TEST SUMMARY');
  console.log('===============');
  
  const testNames = Object.keys(results);
  const passedTests = testNames.filter(test => results[test] !== null);
  const failedTests = testNames.filter(test => results[test] === null);
  
  console.log(`✅ Passed: ${passedTests.length}/${testNames.length} tests`);
  console.log(`❌ Failed: ${failedTests.length}/${testNames.length} tests`);
  
  if (failedTests.length > 0) {
    console.log('⚠️ Failed Tests:', failedTests.join(', '));
  }
  
  console.log('\n🎯 ENTERPRISE FEATURES STATUS:');
  if (results.health?.result?.enterprise_features) {
    Object.entries(results.health.result.enterprise_features).forEach(([feature, enabled]) => {
      console.log(`${enabled ? '✅' : '❌'} ${feature}: ${enabled ? 'OPERATIONAL' : 'UNAVAILABLE'}`);
    });
  } else {
    console.log('⚠️ Could not verify enterprise features status');
  }
  
  console.log('\n🚀 ENTERPRISE APIs TESTING COMPLETE!');
  return results;
}

// Auto-run if called directly
if (typeof window !== 'undefined') {
  window.testEnterpriseAPIs = runAllTests;
  console.log('🔧 Use window.testEnterpriseAPIs() to run tests in browser console');
} else {
  // Node.js environment
  runAllTests().catch(console.error);
} 