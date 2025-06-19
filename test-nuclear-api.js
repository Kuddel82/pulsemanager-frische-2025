/**
 * 🧪 TEST: NUCLEAR TAX API
 * Testet die neue tax-report-nuclear.js API
 */

const API_URL = 'https://pulsemanager.vip/api/tax-report-nuclear';

async function testNuclearAPI() {
  console.log('🧪 Teste NUCLEAR API direkt...');
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        address: '0x3f020b',
        chain: 'pulsechain',
        limit: 2000
      })
    });

    const data = await response.json();
    
    console.log('✅ API Response:', data);
    
    if (data.success && data.taxReport) {
      console.log('📊 Transaktionen:', data.taxReport.transactions.length);
      console.log('📈 Summary:', data.taxReport.summary);
      console.log('🔍 Metadata:', data.taxReport.metadata);
      
      // Prüfe ob es die Nuclear Version ist
      if (data.taxReport.metadata.source.includes('nuclear')) {
        console.log('🚀 NUCLEAR VERSION AKTIV!');
        console.log('📊 Typ-Statistiken:', data.taxReport.summary.typeStats);
        console.log('🔍 Transaction Types:', data.taxReport.metadata.transactionTypes);
      } else {
        console.log('⚠️ ALTE VERSION AKTIV!');
      }
    }
    
  } catch (error) {
    console.error('❌ API Test Error:', error);
  }
}

testNuclearAPI(); 