const fetch = require('node-fetch');
const fs = require('fs');

/**
 * 🎯 TAX REPORT API TESTER
 * 
 * Testet die export-tax-report API mit verschiedenen Parametern
 * und speichert die resultierenden PDFs lokal.
 */
async function testTaxReportAPI() {
  console.log('🧪 Teste Tax Report API...\n');

  // Test-Daten
  const testCases = [
    {
      name: 'Standard Test',
      userId: 'test-user-123',
      wallet: '0x1234567890abcdef1234567890abcdef12345678',
      year: '2024'
    },
    {
      name: 'Aktuelles Jahr',
      userId: 'test-user-456',
      wallet: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
      year: new Date().getFullYear().toString()
    }
  ];

  for (const testCase of testCases) {
    console.log(`📋 Teste: ${testCase.name}`);
    
    try {
      const url = `http://localhost:5177/api/export-tax-report?userId=${testCase.userId}&wallet=${testCase.wallet}&year=${testCase.year}`;
      console.log(`🌐 URL: ${url}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/pdf',
        },
      });

      console.log(`📊 Status: ${response.status} ${response.statusText}`);
      console.log(`📄 Content-Type: ${response.headers.get('content-type')}`);
      
      if (response.ok) {
        const buffer = await response.buffer();
        const filename = `test_steuerreport_${testCase.year}_${testCase.wallet.substring(0, 8)}.pdf`;
        fs.writeFileSync(filename, buffer);
        
        console.log(`✅ PDF gespeichert: ${filename} (${Math.round(buffer.length / 1024)} KB)`);
      } else {
        const errorData = await response.text();
        console.log(`❌ Fehler: ${errorData}`);
      }
      
    } catch (error) {
      console.error(`💥 Exception: ${error.message}`);
    }
    
    console.log('─'.repeat(50));
  }

  // Test ungültige Parameter
  console.log('\n🚨 Teste ungültige Parameter...');
  
  const invalidTests = [
    {
      name: 'Fehlendes Jahr',
      params: 'userId=test&wallet=0x123'
    },
    {
      name: 'Ungültiges Jahr',
      params: 'userId=test&wallet=0x123&year=2019'
    },
    {
      name: 'Fehlende UserId',
      params: 'wallet=0x123&year=2024'
    }
  ];

  for (const test of invalidTests) {
    try {
      const url = `http://localhost:5177/api/export-tax-report?${test.params}`;
      const response = await fetch(url);
      const data = await response.json();
      
      console.log(`📋 ${test.name}: Status ${response.status}`);
      console.log(`   Response: ${JSON.stringify(data)}`);
      
    } catch (error) {
      console.error(`💥 ${test.name}: ${error.message}`);
    }
  }

  console.log('\n🎯 API-Tests abgeschlossen!');
}

// Script ausführen
if (require.main === module) {
  testTaxReportAPI()
    .then(() => {
      console.log('\n✅ Alle Tests abgeschlossen');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Test fehlgeschlagen:', error);
      process.exit(1);
    });
}

module.exports = { testTaxReportAPI }; 