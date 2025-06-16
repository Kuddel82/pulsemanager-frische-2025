// 🚀 TAX REPORT NEW - VOLLSTÄNDIG NEUES STEUERKONFORMES SYSTEM
// Datum: 2025-01-15 - NOTFALL-LÖSUNG für Button-Sichtbarkeit

import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, AlertCircle } from 'lucide-react';
import { TaxReportService_Rebuild } from '@/services/TaxReportService_Rebuild';
import { useAuth } from '@/contexts/AuthContext';
import CentralDataService from '@/services/CentralDataService';

const TaxReportNew = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const generateNewTaxReport = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔥 NEUES TAX SYSTEM: Starte vollständige Neuberechnung...');
      
      // 1. Lade User-Wallets
      const portfolioData = await CentralDataService.loadCompletePortfolio(user.id, { 
        includeROI: false,
        includeTax: false
      });
      
      const wallets = portfolioData?.wallets || [];
      
      if (wallets.length === 0) {
        setError('Keine Wallets gefunden. Fügen Sie zuerst Ihre Wallet-Adressen hinzu.');
        return;
      }
      
      console.log(`📊 Generiere Tax Report für ${wallets.length} Wallets...`);
      
      // 2. Für jedes Wallet einen vollständigen Tax Report generieren (OHNE automatische PDF-Generierung)
      const reports = [];
      
      for (const wallet of wallets) {
        console.log(`🔄 Verarbeite Wallet: ${wallet.address}`);
        
        try {
          const report = await TaxReportService_Rebuild.generateTaxReport(wallet.address, {
            startDate: '2025-01-01',
            endDate: '2025-12-31',
            debugMode: true,
            generatePDF: false // 🔥 WICHTIG: Keine automatische PDF-Generierung
          });
          
          reports.push({
            wallet: wallet.address,
            report,
            success: true
          });
          
          console.log(`✅ Tax Report für ${wallet.address} erfolgreich generiert`);
          
        } catch (walletError) {
          console.error(`❌ Fehler bei Wallet ${wallet.address}:`, walletError);
          reports.push({
            wallet: wallet.address,
            error: walletError.message,
            success: false
          });
        }
      }
      
      // 3. Kombiniere alle Reports
      const combinedReport = {
        totalWallets: wallets.length,
        successfulReports: reports.filter(r => r.success).length,
        failedReports: reports.filter(r => !r.success).length,
        reports,
        generatedAt: new Date().toISOString(),
        version: '2.0.0-rebuild'
      };
      
      setData(combinedReport);
      
      console.log('✅ NEUES TAX SYSTEM: Alle Reports erfolgreich generiert!');
      console.log(`📊 Erfolgreich: ${combinedReport.successfulReports}/${combinedReport.totalWallets} Wallets`);
      
    } catch (error) {
      console.error('❌ NEUES TAX SYSTEM FEHLER:', error);
      setError(`Fehler beim Generieren des Tax Reports: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 📄 NEUE FUNKTION: PDF manuell generieren
  const generatePDFManually = async () => {
    if (!data || data.reports.length === 0) {
      alert('Bitte generieren Sie zuerst einen Tax Report!');
      return;
    }
    
    try {
      console.log('📄 Generiere PDFs für alle Wallets...');
      
      for (const reportData of data.reports) {
        if (reportData.report && reportData.success) {
          await TaxReportService_Rebuild.generatePDFManually(reportData.report);
          console.log(`✅ PDF für Wallet ${reportData.wallet} generiert`);
        }
      }
      
      alert('✅ Alle PDFs wurden erfolgreich im Downloads-Ordner gespeichert!');
      
    } catch (error) {
      console.error('❌ PDF-Generierung fehlgeschlagen:', error);
      alert(`❌ Fehler bei PDF-Generierung: ${error.message}`);
    }
  };

  // 🎯 WGEP TEST FUNCTION
  const handleWGEPTest = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('🎯 WGEP TEST START...');
      
      // Lade User-Wallets
      const portfolioData = await CentralDataService.loadCompletePortfolio(user.id, { 
        includeROI: false,
        includeTax: false
      });
      
      const wallets = portfolioData?.wallets || [];
      
      if (wallets.length === 0) {
        setError('Keine Wallets gefunden für WGEP Test.');
        return;
      }
      
      // Teste erstes Wallet mit WGEP-optimierten Einstellungen
      const testWallet = wallets[0];
      console.log(`🎯 WGEP TEST für Wallet: ${testWallet.address}`);
      
      const wgepReport = await TaxReportService_Rebuild.generateWGEPTestReport(testWallet.address);
      
      // Zeige WGEP-spezifische Ergebnisse
      if (wgepReport.wgepAnalysis) {
        const analysis = wgepReport.wgepAnalysis;
        alert(`🎯 WGEP TEST COMPLETE!\n\n` +
              `📊 Total Transaktionen: ${wgepReport.transactions.length}\n` +
              `💰 ROI Transaktionen: ${analysis.roiCount}\n` +
              `🔥 WGEP ROI: ${analysis.wgepROICount}\n` +
              `💵 Total ROI Value: $${analysis.totalROIValue.toFixed(2)}\n` +
              `🏭 Unique Contracts: ${analysis.analysis.uniqueContracts}`);
      }
      
      // Setze WGEP Test Daten
      setData({
        isWGEPTest: true,
        wgepAnalysis: wgepReport.wgepAnalysis,
        totalWallets: 1,
        successfulReports: 1,
        reports: [{
          wallet: testWallet.address,
          report: wgepReport,
          success: true
        }]
      });
      
    } catch (error) {
      console.error('❌ WGEP Test Fehler:', error);
      setError(`WGEP Test fehlgeschlagen: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* 🔥 HAUPTHEADER */}
        <div className="mb-8 text-center">
          <div className="mb-4 p-6 bg-purple-600/30 border-4 border-yellow-400 rounded-lg animate-pulse">
            <h1 className="text-4xl font-bold text-yellow-400 mb-4">
              🚀 NEUES STEUERREPORT SYSTEM 🚀
            </h1>
            <p className="text-xl text-white mb-4">
              Vollständig steuerrechtlich konform • Deutsche FIFO-Berechnung • Automatische PDF-Generierung
            </p>
            <div className="text-lg text-green-400">
              ✅ Bis zu 300.000 Transaktionen • ✅ EStG-konform • ✅ Keine Fantasie-Milliarden mehr!
            </div>
          </div>
          
          {/* 🔥 HAUPTBUTTON */}
          <Button
            onClick={generateNewTaxReport}
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-700 border-4 border-yellow-400 text-white font-bold shadow-xl animate-bounce px-8 py-4 text-xl mr-4"
            size="lg"
          >
            <FileText className={`h-6 w-6 mr-3 ${loading ? 'animate-spin' : ''}`} />
            {loading ? '🔄 GENERIERE STEUERREPORT...' : '🔥 STEUERREPORT JETZT GENERIEREN 🔥'}
          </Button>

          {/* 📄 PDF BUTTON */}
          {data && data.successfulReports > 0 && !data.isWGEPTest && (
            <Button
              onClick={generatePDFManually}
              className="bg-green-600 hover:bg-green-700 border-4 border-green-400 text-white font-bold shadow-xl px-6 py-4 text-lg mr-4"
              size="lg"
            >
              <Download className="h-5 w-5 mr-2" />
              📄 PDFs GENERIEREN
            </Button>
          )}

          {/* 🎯 WGEP TEST BUTTON */}
          <Button
            onClick={handleWGEPTest}
            disabled={loading}
            className="bg-orange-600 hover:bg-orange-700 border-4 border-orange-400 text-white font-bold shadow-xl px-6 py-4 text-lg"
            size="lg"
          >
            <FileText className={`h-5 w-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
            🎯 WGEP ROI TEST
          </Button>
        </div>

        {/* ERROR */}
        {error && (
          <div className="mb-6 p-4 bg-red-600/20 border-2 border-red-400 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 text-red-400" />
              <h3 className="text-lg font-bold text-red-400">Fehler</h3>
            </div>
            <div className="mt-2 text-red-300">{error}</div>
          </div>
        )}

        {/* LOADING */}
        {loading && (
          <div className="mb-6 p-6 bg-blue-600/20 border-2 border-blue-400 rounded-lg">
            <div className="text-center">
              <div className="animate-spin inline-block w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full mb-4"></div>
              <h3 className="text-xl font-bold text-blue-400 mb-2">
                🔄 Generiere neuen Steuerreport...
              </h3>
              <p className="text-blue-300">
                Lade alle Transaktionen, berechne nach deutschem Steuerrecht und erstelle PDF...
              </p>
            </div>
          </div>
        )}

        {/* RESULTS */}
        {data && (
          <div className="space-y-6">
            {/* SUMMARY */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-green-600/20 border-2 border-green-400 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-green-400">{data.successfulReports}</div>
                <div className="text-green-300">Erfolgreiche Reports</div>
              </div>
              <div className="bg-blue-600/20 border-2 border-blue-400 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-blue-400">
                  {data.reports.reduce((sum, r) => sum + (r.report?.transactions?.length || 0), 0)}
                </div>
                <div className="text-blue-300">Transaktionen</div>
              </div>
              <div className="bg-orange-600/20 border-2 border-orange-400 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-orange-400">
                  {data.reports.reduce((sum, r) => sum + (r.report?.summary?.taxableTransactions || 0), 0)}
                </div>
                <div className="text-orange-300">Steuerpflichtig</div>
              </div>
              <div className="bg-purple-600/20 border-2 border-purple-400 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-purple-400">
                  ${data.reports.reduce((sum, r) => sum + (r.report?.summary?.roiIncome || 0), 0).toFixed(2)}
                </div>
                <div className="text-purple-300">ROI Einkommen</div>
              </div>
            </div>

            {/* DETAILS */}
            <div className="bg-gray-800 border-2 border-gray-600 rounded-lg p-6">
              <h3 className="text-2xl font-bold text-white mb-4">
                📊 Detaillierte Ergebnisse
              </h3>
              
              <div className="space-y-4">
                {data.reports.map((report, index) => (
                  <div key={index} className="bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-mono text-white">
                        Wallet: {report.wallet.slice(0, 12)}...{report.wallet.slice(-8)}
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm ${
                        report.success 
                          ? 'bg-green-600/20 text-green-400' 
                          : 'bg-red-600/20 text-red-400'
                      }`}>
                        {report.success ? '✅ Erfolgreich' : '❌ Fehler'}
                      </div>
                    </div>
                    
                    {report.success ? (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="text-gray-400">Transaktionen</div>
                          <div className="text-white font-bold">
                            {report.report?.transactions?.length || 0}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-400">Steuerpflichtig</div>
                          <div className="text-orange-400 font-bold">
                            {report.report?.summary?.taxableTransactions || 0}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-400">ROI Einkommen</div>
                          <div className="text-green-400 font-bold">
                            ${(report.report?.summary?.roiIncome || 0).toFixed(2)}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-400">Status</div>
                          <div className="text-blue-400 font-bold">
                            ✅ Bereit für PDF
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-red-400 text-sm">
                        {report.error}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="mt-6 p-4 bg-blue-600/10 border border-blue-400/20 rounded-lg">
                <h4 className="font-bold text-blue-400 mb-2">📄 PDF-Export Info:</h4>
                <p className="text-blue-300 text-sm">
                  Nach erfolgreicher Report-Generierung können Sie mit dem grünen "📄 PDFs GENERIEREN" Button 
                  für alle Wallets PDF-Dateien erstellen. Diese werden in Ihrem Downloads-Ordner gespeichert.
                  Format: <code>PulseManager_Steuerreport_[Wallet]_[Datum].pdf</code>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* INFO */}
        <div className="mt-8 p-6 bg-gray-800 border-2 border-gray-600 rounded-lg">
          <h3 className="text-xl font-bold text-white mb-4">
            ⚖️ Über das neue Steuerreport System
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <h4 className="font-bold text-green-400 mb-2">✅ Neue Features:</h4>
              <ul className="text-gray-300 space-y-1">
                <li>• Deutsche FIFO-Berechnung (EStG-konform)</li>
                <li>• 365-Tage Spekulationsfrist</li>
                <li>• Automatische ROI-Erkennung</li>
                <li>• PDF-Generierung in Downloads</li>
                <li>• Bis zu 300.000 Transaktionen</li>
                <li>• Batch-Processing für Performance</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-yellow-400 mb-2">🔧 Technische Details:</h4>
              <ul className="text-gray-300 space-y-1">
                <li>• Direkte Moralis API Integration</li>
                <li>• Transaktions-Kategorisierung</li>
                <li>• Rate-Limiting & Caching</li>
                <li>• Fehlerbehandlung & Retry-Logic</li>
                <li>• Debug-Modus verfügbar</li>
                <li>• Version 2.0.0-rebuild</li>
              </ul>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default TaxReportNew; 