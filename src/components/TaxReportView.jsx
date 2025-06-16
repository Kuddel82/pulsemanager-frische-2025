// 🎯 WGEP TEST FUNCTION für spezifische Wallet
const handleWGEPTest = async () => {
  if (!walletAddress) {
    showNotification('❌ Bitte Wallet verbinden für WGEP Test', 'error');
    return;
  }
  
  try {
    setIsGenerating(true);
    setGenerationStatus('Führe WGEP Test durch...');
    
    console.log('🎯 Starte WGEP Test für:', walletAddress);
    
    // Importiere den TaxReportService dynamisch
    const { TaxReportService_Rebuild } = await import('../services/TaxReportService_Rebuild');
    
    // Führe WGEP Test Report durch
    const testResult = await TaxReportService_Rebuild.generateWGEPTestReport(walletAddress);
    
    if (testResult.success) {
      setGenerationStatus(`✅ WGEP Test erfolgreich: ${testResult.fileName}`);
      
      showNotification(
        `🎯 WGEP Test Report generiert!\n\n` +
        `📊 ${testResult.transactionCount} Transaktionen\n` +
        `🎯 ${testResult.wgepROICount} WGEP ROI-Einträge\n` +
        `🔄 ${testResult.wgepSwapCount} WGEP Swaps\n` +
        `💰 $${testResult.totalROIValue.toFixed(2)} Gesamt ROI\n` +
        `⚠️ ${testResult.problematicEntries} Fehlerhafte Einträge korrigiert\n\n` +
        `📁 PDF gespeichert: ${testResult.fileName}`,
        'success'
      );
      
      // Erweiterte Logs für User
      console.log('🎯 WGEP TEST ERGEBNIS:', testResult);
      console.log('🏦 WGEP HOLDINGS:', testResult.wgepHoldings);
      
    } else {
      setGenerationStatus(`❌ WGEP Test fehlgeschlagen: ${testResult.error}`);
      showNotification(`❌ WGEP Test fehlgeschlagen: ${testResult.error}`, 'error');
    }
    
  } catch (error) {
    console.error('❌ WGEP Test Error:', error);
    setGenerationStatus('❌ WGEP Test fehlgeschlagen');
    showNotification(`❌ WGEP Test Error: ${error.message}`, 'error');
  } finally {
    setIsGenerating(false);
  }
}; 

            <button
              onClick={handleGenerateTaxReport}
              disabled={isGenerating || !walletAddress}
              className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                isGenerating || !walletAddress
                  ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                  : 'bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white'
              }`}
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Generiere Report...
                </>
              ) : (
                <>
                  <FileDown className="w-5 h-5" />
                  Steuerreport generieren
                </>
              )}
            </button>

            {/* 🎯 WGEP TEST BUTTON für Wallet 0x308e77 */}
            {walletAddress?.toLowerCase().startsWith('0x308e77') && (
              <button
                onClick={handleWGEPTest}
                disabled={isGenerating}
                className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                  isGenerating
                    ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                    : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white'
                }`}
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    WGEP Test läuft...
                  </>
                ) : (
                  <>
                    <FileDown className="w-5 h-5" />
                    🎯 WGEP TEST REPORT
                  </>
                )}
              </button>
            )} 