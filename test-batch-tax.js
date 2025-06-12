// 🚀 TEST: BATCH-OPTIMIZED TAX REPORT
console.log('🧪 Testing Batch-Optimized Tax Report API...');

const WALLET = '0x3f020b5bcfdfa9b5970b1b22bba6da6387d0ea7a';
const API_URL = `http://localhost:3000/api/tax-report?wallet=${WALLET}&chain=pulsechain&limit=10`;

async function testBatchTaxReport() {
  try {
    console.log('📡 Sending request to Tax Report API...');
    console.log('🔗 URL:', API_URL);
    
    const response = await fetch(API_URL);
    
    if (!response.ok) {
      console.error(`❌ API Error: ${response.status} ${response.statusText}`);
      const text = await response.text();
      console.error('Error details:', text);
      return;
    }
    
    const result = await response.json();
    
    console.log('\n✅ TAX REPORT SUCCESS!');
    console.log('📊 RESULTS:');
    console.log(`- Transactions: ${result.transactionCount}`);
    console.log(`- Ungepaarte Tokens: ${result.ungepaarteCount}`);
    console.log(`- Steuerpflichtige Transaktionen: ${result.statistics?.steuerpflichtigeTransaktionen}`);
    
    // 🚀 BATCH-OPTIMIERUNG DETAILS
    const batch = result.apiUsage?.batchOptimization;
    if (batch) {
      console.log('\n🚀 BATCH-OPTIMIERUNG:');
      console.log(`- Batch Enabled: ${batch.enabled}`);
      console.log(`- Unique Tokens: ${batch.uniqueTokens}`);
      console.log(`- Tokens in Batch: ${batch.tokensInBatch}`);
      console.log(`- Fallback Calls: ${batch.fallbackCalls}`);
      console.log(`- Estimated CUs Used: ${batch.estimatedCUsUsed}`);
      console.log(`- Old System CUs: ${batch.oldSystemCUs}`);
      console.log(`- CU Savings: ${batch.cuSavings}`);
      console.log(`- Efficiency: ${batch.efficiencyPercent}%`);
    }
    
    console.log('\n📋 API USAGE:');
    console.log(`- Moralis Calls: ${result.apiUsage?.moralisCallsUsed}`);
    console.log(`- DEXScreener Calls: ${result.apiUsage?.dexscreenerCallsUsed}`);
    console.log(`- Total Calls: ${result.apiUsage?.totalCalls}`);
    
    // Show sample transactions
    if (result.transactions?.length > 0) {
      console.log('\n💰 SAMPLE TRANSACTIONS:');
      result.transactions.slice(0, 3).forEach((tx, i) => {
        console.log(`${i+1}. ${tx.type} - ${tx.token} - $${tx.priceUSD?.toFixed(4)} (${tx.priceSource})`);
      });
    }
    
    console.log('\n🎯 TEST COMPLETE!');
    
  } catch (error) {
    console.error('💥 TEST ERROR:', error.message);
  }
}

// Run test
testBatchTaxReport(); 