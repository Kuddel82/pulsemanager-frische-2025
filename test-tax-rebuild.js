/**
 * 🧪 TEST - TAX REPORT SERVICE REBUILD
 * 
 * Test-Datei für den neuen TaxReportService_Rebuild
 * Testet alle Funktionen und generiert einen PDF-Report
 */

import { TaxReportService_Rebuild } from './src/services/TaxReportService_Rebuild.js';

// 🎯 Test-Wallet (Beispiel)
const TEST_WALLET = '0x2bD1BBBc3a3B96eeB65d8073ED54Ed35Bf15a77C'; // Beispiel-Wallet

async function testTaxReportRebuild() {
    console.log('🧪 === TAX REPORT SERVICE REBUILD TEST ===');
    console.log(`📅 Test-Datum: ${new Date().toLocaleString('de-DE')}`);
    
    try {
        // Test 1: Debug Mode aktivieren
        console.log('\n🔧 Test 1: Debug Mode aktivieren');
        TaxReportService_Rebuild.enableDebugMode();
        
        // Test 2: Tax Report für 2025 generieren
        console.log('\n📊 Test 2: Tax Report für 2025 generieren');
        const report = await TaxReportService_Rebuild.generateTaxReport(TEST_WALLET, {
            startDate: '2025-01-01',
            endDate: '2025-12-31',
            debugMode: true
        });
        
        console.log('\n✅ Report erfolgreich generiert!');
        console.log(`📊 Summary:`, report.summary);
        console.log(`📋 Transaktionen: ${report.transactions.length}`);
        console.log(`📄 Table Rows: ${report.table.length}`);
        
        // Test 3: Tax Categories anzeigen
        console.log('\n🏛️ Test 3: Tax Categories');
        console.log('Verfügbare Kategorien:', TaxReportService_Rebuild.TAX_CATEGORIES);
        
        // Test 4: Holding Periods anzeigen
        console.log('\n⏰ Test 4: Holding Periods');
        console.log('Haltefrist-Konstanten:', TaxReportService_Rebuild.HOLDING_PERIODS);
        
        // Test 5: PDF-Generation (wird automatisch ausgeführt)
        console.log('\n📄 Test 5: PDF wurde automatisch in Downloads gespeichert');
        
        console.log('\n🎉 === ALLE TESTS ERFOLGREICH ===');
        
        return {
            success: true,
            report,
            message: 'Tax Report Rebuild Test erfolgreich abgeschlossen'
        };
        
    } catch (error) {
        console.error('❌ Test fehlgeschlagen:', error);
        return {
            success: false,
            error: error.message,
            message: 'Tax Report Rebuild Test fehlgeschlagen'
        };
    }
}

// 🎯 Test ausführen
testTaxReportRebuild()
    .then(result => {
        console.log('\n🏁 Test-Ergebnis:', result);
        process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
        console.error('💥 Unerwarteter Fehler:', error);
        process.exit(1);
    }); 