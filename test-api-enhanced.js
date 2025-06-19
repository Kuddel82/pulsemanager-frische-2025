/**
 * 🧪 TEST: ERWEITERTE TAX API
 * Testet die neue german-tax-report-enhanced.js API
 */

const API_URL = 'https://pulsemanager.vip/api/german-tax-report-enhanced';

async function testEnhancedAPI() {
  console.log('🧪 Teste ERWEITERTE API direkt...');
  
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
      
      // Prüfe ob es die erweiterte Version ist
      if (data.taxReport.metadata.source.includes('enhanced')) {
        console.log('🎉 ERWEITERTE VERSION AKTIV!');
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

testEnhancedAPI(); 