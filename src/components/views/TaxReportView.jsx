// 🚨 TAX REPORT VIEW - TRIAL-SAFE MIT BUG-FIXES
import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, AlertCircle, CheckCircle } from 'lucide-react';

const TaxReportView = () => {
  const [walletAddress, setWalletAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [taxData, setTaxData] = useState(null);
  const [error, setError] = useState(null);

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
              className="w-full px-6 py-4 bg-gradient-to-r from-green-800 to-emerald-600 text-white rounded-lg font-bold hover:from-green-900 hover:to-emerald-700 disabled:opacity-50 transition-all duration-200 text-lg border-2 border-green-400 shadow-lg"
            >
              {isLoading ? '⏳ Lädt echte Daten...' : '🇩🇪 REAL TAX REPORT: Echte Transaktionen'}
            </button>
            <p className="text-sm text-green-700 mt-2 text-center font-semibold">
              ✅ Lädt echte Moralis-Transaktionen + Deutsches Steuerrecht (§22 & §23 EStG)
            </p>
          </div>

          {/* EMERGENCY BUTTON (FALLBACK) */}
          <div className="mb-6">
            <button
              onClick={handleEmergencyTest}
              disabled={isLoading}
              className="w-full px-6 py-4 bg-gradient-to-r from-red-800 to-red-600 text-white rounded-lg font-bold hover:from-red-900 hover:to-red-700 disabled:opacity-50 transition-all duration-200 text-lg border-2 border-red-400"
            >
              {isLoading ? '⏳ Lädt...' : '🚨 EMERGENCY: Demo-Daten (Falls APIs offline)'}
            </button>
            <p className="text-sm text-red-600 mt-2 text-center font-semibold">
              🆘 Notfall-Modus: Funktioniert wenn alle anderen APIs versagen
            </p>
          </div>

          {/* BUG-FIX BUTTON (PRIORITÄT) */}
          <div className="mb-6">
            <button
              onClick={handleTrialSafeTest}
              disabled={isLoading}
              className="w-full px-6 py-4 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-lg font-bold hover:from-red-700 hover:to-orange-700 disabled:opacity-50 transition-all duration-200 text-lg"
            >
              {isLoading ? '⏳ Lädt...' : '🚨 TRIAL-SAFE: TypeError Bug-Fix'}
            </button>
            <p className="text-sm text-gray-600 mt-2 text-center">
              ⚡ Fixt den "reduce().toFixed()" TypeError + nutzt nur verfügbare APIs
            </p>
          </div>

          {/* PHASE 2 & 3 BUTTONS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <button
              onClick={handlePhase2Test}
              disabled={isLoading}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 transition-all duration-200"
            >
              {isLoading ? '⏳ Lädt...' : '🚀 PHASE 2: CoinGecko Historical'}
            </button>
            
            <button
              onClick={handlePhase3Test}
              disabled={isLoading}
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg font-semibold hover:from-green-700 hover:to-teal-700 disabled:opacity-50 transition-all duration-200"
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
                  <strong>ROI Einkommen:</strong> €{taxData.totalROIIncome?.toFixed(2) || '0.00'}
                </div>
                <div>
                  <strong>Spekulative Gewinne:</strong> €{taxData.totalSpeculativeGains?.toFixed(2) || '0.00'}
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
                      <strong>Portfolio Wert:</strong> €{taxData.moralisProData.stats?.totalWalletValueEUR?.toFixed(2) || '0.00'}
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
        </CardContent>
      </Card>
    </div>
  );
};

export default TaxReportView; 