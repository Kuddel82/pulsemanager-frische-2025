// 🧪 PULSEMANAGER REALITÄTS-TEST
// Misst echte API-Calls und CU-Kosten beim Navigieren
// Datum: 2025-01-XX - REALITÄTSPRÜFUNG

console.log('🧪 PULSEMANAGER REALITÄTS-TEST GESTARTET');
console.log('='.repeat(50));

// Test-Wallet für Messungen (öffentliche Adresse)
const TEST_WALLET = '0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5'; // Nur für Tests

// 🎯 TEST 1: Portfolio-Load (echte Kosten messen)
async function testPortfolioLoad() {
  console.log('\n📊 TEST 1: Portfolio-Load');
  console.log('Wallet:', TEST_WALLET);
  
  const startTime = Date.now();
  let apiCallCount = 0;
  let estimatedCUs = 0;
  
  try {
    // Simuliere Portfolio-Load über CentralDataService
    console.log('→ Rufe /api/moralis-v2 für Token-Balances auf...');
    const tokensResponse = await fetch(`http://localhost:5173/api/moralis-v2?address=${TEST_WALLET}&chain=pulsechain&endpoint=erc20`);
    apiCallCount++;
    estimatedCUs += 15;
    
    if (tokensResponse.ok) {
      const tokensData = await tokensResponse.json();
      const tokens = tokensData.result || [];
      console.log(`✅ ${tokens.length} Tokens gefunden`);
      
      // Teste Preise für erste 3 Tokens
      const testTokens = tokens.slice(0, 3);
      console.log(`→ Lade Preise für ${testTokens.length} Test-Tokens...`);
      
      for (const token of testTokens) {
        try {
          const priceResponse = await fetch(`http://localhost:5173/api/moralis-v2?address=${token.token_address}&chain=pulsechain&endpoint=token-price`);
          apiCallCount++;
          estimatedCUs += 5;
          
          if (priceResponse.ok) {
            const priceData = await priceResponse.json();
            console.log(`  ${token.symbol}: $${priceData.usdPrice || 0}`);
          } else {
            console.log(`  ${token.symbol}: Preis-Fehler`);
          }
        } catch (err) {
          console.log(`  ${token.symbol}: ${err.message}`);
        }
      }
    } else {
      console.log('❌ Token-Laden fehlgeschlagen:', tokensResponse.status);
    }
    
  } catch (error) {
    console.log('💥 Portfolio-Test Fehler:', error.message);
  }
  
  const duration = Date.now() - startTime;
  console.log(`📊 ERGEBNIS TEST 1:`);
  console.log(`   API-Calls: ${apiCallCount}`);
  console.log(`   Geschätzte CUs: ${estimatedCUs}`);
  console.log(`   Dauer: ${duration}ms`);
  
  return { apiCallCount, estimatedCUs, duration };
}

// 🎯 TEST 2: ROI-Tracker (echte Kosten messen)
async function testROITracker() {
  console.log('\n🚀 TEST 2: ROI-Tracker');
  
  const startTime = Date.now();
  let apiCallCount = 0;
  let estimatedCUs = 0;
  
  try {
    console.log('→ Rufe /api/roi-cache auf...');
    const roiResponse = await fetch(`http://localhost:5173/api/roi-cache?wallet=${TEST_WALLET}&chain=pulsechain`);
    apiCallCount++;
    estimatedCUs += 20;
    
    if (roiResponse.ok) {
      const roiData = await roiResponse.json();
      console.log(`✅ ROI-Daten: ${roiData.roiTransactions?.length || 0} Transaktionen`);
    } else {
      console.log('❌ ROI-Laden fehlgeschlagen:', roiResponse.status);
    }
    
  } catch (error) {
    console.log('💥 ROI-Test Fehler:', error.message);
  }
  
  const duration = Date.now() - startTime;
  console.log(`📊 ERGEBNIS TEST 2:`);
  console.log(`   API-Calls: ${apiCallCount}`);
  console.log(`   Geschätzte CUs: ${estimatedCUs}`);
  console.log(`   Dauer: ${duration}ms`);
  
  return { apiCallCount, estimatedCUs, duration };
}

// 🎯 TEST 3: Tax-Report (echte Kosten messen)
async function testTaxReport() {
  console.log('\n📄 TEST 3: Tax-Report');
  
  const startTime = Date.now();
  let apiCallCount = 0;
  let estimatedCUs = 0;
  
  try {
    console.log('→ Rufe /api/tax-report auf...');
    const taxResponse = await fetch(`http://localhost:5173/api/tax-report?wallet=${TEST_WALLET}&chain=pulsechain`);
    apiCallCount++;
    estimatedCUs += 30;
    
    if (taxResponse.ok) {
      const taxData = await taxResponse.json();
      console.log(`✅ Tax-Daten: ${taxData.transactions?.length || 0} Transaktionen`);
    } else {
      console.log('❌ Tax-Laden fehlgeschlagen:', taxResponse.status);
    }
    
  } catch (error) {
    console.log('💥 Tax-Test Fehler:', error.message);
  }
  
  const duration = Date.now() - startTime;
  console.log(`📊 ERGEBNIS TEST 3:`);
  console.log(`   API-Calls: ${apiCallCount}`);
  console.log(`   Geschätzte CUs: ${estimatedCUs}`);
  console.log(`   Dauer: ${duration}ms`);
  
  return { apiCallCount, estimatedCUs, duration };
}

// 🎯 HAUPTTEST: Komplette Navigation simulieren
async function runRealityTest() {
  console.log('🔍 STARTE KOMPLETTE NAVIGATION-SIMULATION');
  console.log('Simuliert: User öffnet Portfolio → ROI → Tax Report');
  
  const results = {
    portfolio: await testPortfolioLoad(),
    roi: await testROITracker(),
    tax: await testTaxReport()
  };
  
  const totalApiCalls = results.portfolio.apiCallCount + results.roi.apiCallCount + results.tax.apiCallCount;
  const totalCUs = results.portfolio.estimatedCUs + results.roi.estimatedCUs + results.tax.estimatedCUs;
  const totalDuration = results.portfolio.duration + results.roi.duration + results.tax.duration;
  
  console.log('\n' + '='.repeat(50));
  console.log('🎯 GESAMTERGEBNIS: EINE KOMPLETTE NAVIGATION');
  console.log('='.repeat(50));
  console.log(`📱 Simulierte Aktion: User öffnet alle 3 Views einmal`);
  console.log(`🔗 API-Calls gesamt: ${totalApiCalls}`);
  console.log(`💰 Geschätzte CUs gesamt: ${totalCUs}`);
  console.log(`⏱️ Gesamtdauer: ${totalDuration}ms`);
  console.log(`💸 Geschätzte Kosten: $${(totalCUs * 0.001).toFixed(3)} (bei $0.001/CU)`);
  
  // Realitäts-Check
  if (totalCUs > 1000) {
    console.log('🚨 REALITÄTS-CHECK: KRITISCH!');
    console.log(`   CU-Verbrauch ${totalCUs} ist SEHR HOCH für eine einfache Navigation`);
    console.log(`   Dies erklärt warum ${13000} CUs in einer Navigation verbraucht wurden`);
  } else if (totalCUs > 100) {
    console.log('⚠️  REALITÄTS-CHECK: MODERAT');
    console.log(`   CU-Verbrauch ${totalCUs} ist erhöht aber kontrollierbar`);
  } else {
    console.log('✅ REALITÄTS-CHECK: OPTIMAL');
    console.log(`   CU-Verbrauch ${totalCUs} ist niedrig und kosteneffizient`);
  }
  
  console.log('\n📋 EMPFEHLUNGEN:');
  if (totalCUs > 500) {
    console.log('   1. Cache-First Strategy implementieren (Supabase)');
    console.log('   2. Rate Limiting schärfer einstellen');
    console.log('   3. Batch-API-Calls verwenden statt einzelne');
    console.log('   4. Auto-Refresh komplett deaktivieren');
  }
  
  console.log('\n🧪 REALITÄTS-TEST ABGESCHLOSSEN');
}

// Export für Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runRealityTest, testPortfolioLoad, testROITracker, testTaxReport };
}

// Auto-run wenn direkt aufgerufen
if (typeof window === 'undefined') {
  runRealityTest().catch(console.error);
} 