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
            startDate: '2025-01-01', // 🔥 FEST: Ab 1.1.2025
            endDate: '2025-12-31',   // 🔥 FEST: Bis 31.12.2025
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
              Professionelle Transaktionsanalyse • Automatische PDF-Generierung • Multi-Chain Support
            </p>
            
            {/* 🚨 RECHTLICHER HAFTUNGSAUSSCHLUSS */}
            <div className="mt-6 p-4 bg-red-900/50 border-2 border-red-500 rounded-lg text-left">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-red-400 mt-1 flex-shrink-0" size={20} />
                <div className="text-sm text-red-100">
                  <h3 className="font-bold text-red-300 mb-2">⚖️ RECHTLICHER HAFTUNGSAUSSCHLUSS</h3>
                  <p className="mb-2">
                    <strong>Keine Steuerberatung:</strong> Diese Software stellt keine steuerliche Beratung dar und ersetzt nicht die Beratung durch einen qualifizierten Steuerberater oder Wirtschaftsprüfer.
                  </p>
                  <p className="mb-2">
                    <strong>Keine Gewähr für Vollständigkeit:</strong> Es wird keine Gewähr für die Vollständigkeit, Richtigkeit oder Aktualität der bereitgestellten Informationen und Berechnungen übernommen.
                  </p>
                  <p className="mb-2">
                    <strong>Professionelle Prüfung erforderlich:</strong> Alle generierten Steuerberichte müssen zwingend von einem qualifizierten Steuerberater geprüft und validiert werden, bevor sie für steuerliche Zwecke verwendet werden.
                  </p>
                  <p className="text-red-200 font-semibold">
                    Die Nutzung dieser Software erfolgt auf eigene Verantwortung. Der Anbieter übernimmt keine Haftung für Schäden, die durch die Verwendung der bereitgestellten Informationen entstehen.
                  </p>
                </div>
              </div>
            </div>
            <div className="text-lg text-green-400">
              ✅ Bis zu 300.000 Transaktionen • ✅ Multi-Chain Support • ✅ Professionelle Analyse
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
                📊 Detaillierte Steuerreport-Analyse
              </h3>
              
              <div className="space-y-6">
                {data.reports.map((report, index) => (
                  <div key={index} className="bg-gray-700 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="font-mono text-white text-lg">
                        🏦 Wallet: {report.wallet.slice(0, 12)}...{report.wallet.slice(-8)}
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm ${
                        report.success 
                          ? 'bg-green-600/20 text-green-400' 
                          : 'bg-red-600/20 text-red-400'
                      }`}>
                        {report.success ? '✅ Erfolgreich' : '❌ Fehler'}
                      </div>
                    </div>
                    
                    {report.success && report.report ? (
                      <div className="space-y-6">
                        {/* ÜBERSICHT */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="bg-gray-600 p-3 rounded">
                            <div className="text-gray-400">Total Transaktionen</div>
                            <div className="text-white font-bold text-xl">
                              {report.report?.transactions?.length || 0}
                            </div>
                          </div>
                          <div className="bg-orange-600/20 p-3 rounded">
                            <div className="text-gray-400">Steuerpflichtig</div>
                            <div className="text-orange-400 font-bold text-xl">
                              {report.report?.summary?.taxableTransactions || 0}
                            </div>
                          </div>
                          <div className="bg-green-600/20 p-3 rounded">
                            <div className="text-gray-400">ROI Einkommen</div>
                            <div className="text-green-400 font-bold text-xl">
                              ${(report.report?.summary?.roiIncome || 0).toFixed(2)}
                            </div>
                          </div>
                          <div className="bg-blue-600/20 p-3 rounded">
                            <div className="text-gray-400">Chains</div>
                            <div className="text-blue-400 font-bold text-xl">
                              {report.report?.chainStats ? Object.keys(report.report.chainStats).length : 0}
                            </div>
                          </div>
                        </div>

                        {/* ROI TRANSAKTIONEN DETAILS */}
                        {report.report?.transactions && (
                          <div className="bg-green-900/20 border border-green-600 rounded-lg p-4">
                            <h4 className="text-lg font-bold text-green-400 mb-3">💰 ROI-Transaktionen (§22 EStG)</h4>
                            <div className="max-h-64 overflow-y-auto">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="border-b border-green-600">
                                    <th className="text-left p-2 text-green-300">Datum</th>
                                    <th className="text-left p-2 text-green-300">Token</th>
                                    <th className="text-left p-2 text-green-300">Menge</th>
                                    <th className="text-left p-2 text-green-300">USD Wert</th>
                                    <th className="text-left p-2 text-green-300">Von (Label)</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {report.report.transactions
                                    .filter(tx => tx.taxCategory === 'ROI_INCOME')
                                    .slice(0, 10)
                                    .map((tx, idx) => (
                                    <tr key={idx} className="border-b border-green-800">
                                      <td className="p-2 text-white">
                                        {new Date(tx.timestamp).toLocaleDateString('de-DE')}
                                      </td>
                                      <td className="p-2 text-green-400 font-mono">
                                        {tx.tokenSymbol || 'ETH'}
                                      </td>
                                      <td className="p-2 text-white">
                                        {parseFloat(tx.tokenAmount || tx.ethAmount || 0).toFixed(6)}
                                      </td>
                                      <td className="p-2 text-green-400 font-bold">
                                        ${(tx.usdValue || 0).toFixed(2)}
                                      </td>
                                      <td className="p-2 text-blue-300">
                                        {tx.from_address_label || tx.from_address_entity || 
                                         `${tx.fromAddress?.slice(0, 8)}...`}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                              {report.report.transactions.filter(tx => tx.taxCategory === 'ROI_INCOME').length > 10 && (
                                <div className="text-center text-green-400 mt-2">
                                  ... und {report.report.transactions.filter(tx => tx.taxCategory === 'ROI_INCOME').length - 10} weitere ROI-Transaktionen
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* WGEP HOLDINGS & HALTEFRISTEN */}
                        {report.report?.wgepHoldings && Object.keys(report.report.wgepHoldings).length > 0 && (
                          <div className="bg-purple-900/20 border border-purple-600 rounded-lg p-4">
                            <h4 className="text-lg font-bold text-purple-400 mb-3">🏭 WGEP Holdings & Haltefristen (§23 EStG)</h4>
                            <div className="space-y-3">
                              {Object.entries(report.report.wgepHoldings).map(([token, holdings], idx) => (
                                <div key={idx} className="bg-purple-800/20 rounded p-3">
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="text-purple-300 font-bold">{token}</span>
                                    <span className="text-white">
                                      Total: {holdings.reduce((sum, h) => sum + h.amount, 0).toFixed(6)}
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                                    {holdings.slice(0, 5).map((holding, hidx) => {
                                      const holdingDays = Math.floor((Date.now() - new Date(holding.purchaseDate).getTime()) / (1000 * 60 * 60 * 24));
                                      const isSpeculative = holdingDays < 365;
                                      return (
                                        <div key={hidx} className={`p-2 rounded ${isSpeculative ? 'bg-red-900/30' : 'bg-green-900/30'}`}>
                                          <div className="flex justify-between">
                                            <span>Menge: {holding.amount.toFixed(6)}</span>
                                            <span className={isSpeculative ? 'text-red-400' : 'text-green-400'}>
                                              {holdingDays} Tage
                                            </span>
                                          </div>
                                          <div className="text-gray-400">
                                            Kauf: {new Date(holding.purchaseDate).toLocaleDateString('de-DE')}
                                          </div>
                                          <div className="text-gray-400">
                                            Preis: ${holding.purchasePrice.toFixed(2)}
                                          </div>
                                          <div className={`text-xs ${isSpeculative ? 'text-red-400' : 'text-green-400'}`}>
                                            {isSpeculative ? '⚠️ Spekulationsfrist' : '✅ Steuerfrei'}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                  {holdings.length > 5 && (
                                    <div className="text-center text-purple-400 mt-2 text-xs">
                                      ... und {holdings.length - 5} weitere Holdings
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* VERKÄUFE & GEWINNE/VERLUSTE */}
                        {report.report?.transactions && (
                          <div className="bg-orange-900/20 border border-orange-600 rounded-lg p-4">
                            <h4 className="text-lg font-bold text-orange-400 mb-3">💸 Verkäufe & Gewinne/Verluste (§23 EStG)</h4>
                            <div className="max-h-64 overflow-y-auto">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="border-b border-orange-600">
                                    <th className="text-left p-2 text-orange-300">Datum</th>
                                    <th className="text-left p-2 text-orange-300">Token</th>
                                    <th className="text-left p-2 text-orange-300">Menge</th>
                                    <th className="text-left p-2 text-orange-300">Verkaufspreis</th>
                                    <th className="text-left p-2 text-orange-300">Gewinn/Verlust</th>
                                    <th className="text-left p-2 text-orange-300">Haltefrist</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {report.report.transactions
                                    .filter(tx => tx.taxCategory === 'VERKAUF')
                                    .slice(0, 10)
                                    .map((tx, idx) => (
                                    <tr key={idx} className="border-b border-orange-800">
                                      <td className="p-2 text-white">
                                        {new Date(tx.timestamp).toLocaleDateString('de-DE')}
                                      </td>
                                      <td className="p-2 text-orange-400 font-mono">
                                        {tx.tokenSymbol || 'ETH'}
                                      </td>
                                      <td className="p-2 text-white">
                                        {parseFloat(tx.tokenAmount || tx.ethAmount || 0).toFixed(6)}
                                      </td>
                                      <td className="p-2 text-orange-400">
                                        ${(tx.usdValue || 0).toFixed(2)}
                                      </td>
                                      <td className={`p-2 font-bold ${(tx.gainLoss || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        ${(tx.gainLoss || 0).toFixed(2)}
                                      </td>
                                      <td className={`p-2 ${(tx.holdingPeriodDays || 0) >= 365 ? 'text-green-400' : 'text-red-400'}`}>
                                        {tx.holdingPeriodDays || 0} Tage
                                        {(tx.holdingPeriodDays || 0) >= 365 ? ' ✅' : ' ⚠️'}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                              {report.report.transactions.filter(tx => tx.taxCategory === 'VERKAUF').length > 10 && (
                                <div className="text-center text-orange-400 mt-2">
                                  ... und {report.report.transactions.filter(tx => tx.taxCategory === 'VERKAUF').length - 10} weitere Verkäufe
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* MORALIS LABELS & ENTITIES */}
                        {report.report?.transactions && (
                          <div className="bg-blue-900/20 border border-blue-600 rounded-lg p-4">
                            <h4 className="text-lg font-bold text-blue-400 mb-3">🏷️ Moralis Labels & Entities</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <h5 className="text-blue-300 font-semibold mb-2">🏢 Erkannte Entities:</h5>
                                <div className="space-y-1 max-h-32 overflow-y-auto">
                                  {[...new Set(report.report.transactions
                                    .filter(tx => tx.from_address_entity || tx.to_address_entity)
                                    .flatMap(tx => [tx.from_address_entity, tx.to_address_entity])
                                    .filter(Boolean)
                                  )].slice(0, 10).map((entity, idx) => (
                                    <div key={idx} className="bg-blue-800/30 px-2 py-1 rounded text-sm">
                                      {entity}
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <h5 className="text-blue-300 font-semibold mb-2">🏷️ Erkannte Labels:</h5>
                                <div className="space-y-1 max-h-32 overflow-y-auto">
                                  {[...new Set(report.report.transactions
                                    .filter(tx => tx.from_address_label || tx.to_address_label)
                                    .flatMap(tx => [tx.from_address_label, tx.to_address_label])
                                    .filter(Boolean)
                                  )].slice(0, 10).map((label, idx) => (
                                    <div key={idx} className="bg-blue-800/30 px-2 py-1 rounded text-sm">
                                      {label}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
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
                <li>• FIFO-Berechnung nach deutschem Muster</li>
                <li>• 365-Tage Haltefrist-Tracking</li>
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