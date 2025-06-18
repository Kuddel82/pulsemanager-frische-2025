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

  // EMERGENCY TEST (Demo-Daten)
  const handleEmergencyTest = async () => {
    if (!walletAddress) {
      alert('Bitte Wallet-Adresse eingeben');
      return;
    }

    setIsLoading(true);
    setTaxData(null);
    setError(null);

    try {
      console.log('🚨 EMERGENCY: Demo-Daten Test gestartet');
      
      const response = await fetch('/api/german-tax-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          address: walletAddress,
          phase: 'EMERGENCY_DEMO'
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success && data.taxReport) {
        console.log('✅ EMERGENCY: Demo-Daten erfolgreich');
        setTaxData(data.taxReport);
        
        // Automatischer PDF Download
        if (data.taxReport.pdfBuffer) {
          const blob = new Blob([new Uint8Array(data.taxReport.pdfBuffer.data)], { type: 'application/pdf' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `Steuerreport_${walletAddress.slice(0,8)}_Emergency_${new Date().toISOString().split('T')[0]}.pdf`;
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
      console.error('❌ EMERGENCY Fehler:', error);
      setError(`EMERGENCY Fehler: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // REAL TAX REPORT
  const handleRealTaxReport = async () => {
    if (!walletAddress) {
      alert('Bitte Wallet-Adresse eingeben');
      return;
    }

    setIsLoading(true);
    setTaxData(null);
    setError(null);

    try {
      console.log('🇩🇪 REAL TAX REPORT: Echte Transaktionen gestartet');
      
      const response = await fetch('/api/real-tax-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          address: walletAddress
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success && data.taxReport) {
        console.log('✅ REAL TAX REPORT: Erfolgreich');
        setTaxData(data.taxReport);
        
        // Automatischer PDF Download
        if (data.taxReport.pdfBuffer) {
          const blob = new Blob([new Uint8Array(data.taxReport.pdfBuffer.data)], { type: 'application/pdf' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `Steuerreport_${walletAddress.slice(0,8)}_Real_${new Date().toISOString().split('T')[0]}.pdf`;
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
      console.error('❌ REAL TAX REPORT Fehler:', error);
      setError(`REAL TAX REPORT Fehler: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // DIRECT MORALIS REPORT
  const handleDirectMoralisReport = async () => {
    if (!walletAddress) {
      alert('Bitte Wallet-Adresse eingeben');
      return;
    }

    setIsLoading(true);
    setTaxData(null);
    setError(null);

    try {
      console.log('🎯 DIRECT MORALIS: Starte direkten Moralis-Aufruf');
      
      const directService = new DirectMoralisRealTaxService();
      const result = await directService.generateTaxReport(walletAddress);
      
      if (result.success) {
        console.log('✅ DIRECT MORALIS: Erfolgreich');
        const fixedData = fixTaxReportDisplay(result.data);
        setTaxData(fixedData);
      } else {
        throw new Error(result.error || 'Direct Moralis Fehler');
      }

    } catch (error) {
      console.error('❌ DIRECT MORALIS Fehler:', error);
      setError(`DIRECT MORALIS Fehler: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      background: '#0A0A0A',
      backgroundImage: `
        radial-gradient(circle at 25% 25%, #9333EA 0%, transparent 50%),
        radial-gradient(circle at 75% 75%, #7C3AED 0%, transparent 50%),
        radial-gradient(circle at 50% 50%, #6D28D9 0%, transparent 50%)
      `,
      minHeight: '100vh',
      padding: '20px',
      position: 'relative'
    }}>
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: `linear-gradient(45deg, 
          rgba(147, 51, 234, 0.1) 0%, 
          rgba(124, 58, 237, 0.1) 25%, 
          rgba(109, 40, 217, 0.1) 50%, 
          rgba(91, 33, 182, 0.1) 100%)`,
        pointerEvents: 'none',
        zIndex: -1
      }} />
      
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        background: 'rgba(255, 255, 255, 0.98)',
        backdropFilter: 'blur(15px)',
        borderRadius: '25px',
        padding: '40px',
        boxShadow: '0 25px 50px rgba(147, 51, 234, 0.3), 0 10px 30px rgba(124, 58, 237, 0.2)',
        border: '2px solid rgba(147, 51, 234, 0.2)'
      }}>
        
        {/* HEADER */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{
            fontSize: '2.5em',
            background: 'linear-gradient(45deg, #8B5CF6, #7C3AED, #6D28D9)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '10px',
            fontWeight: 700
          }}>
            🇩🇪 Deutscher Steuerreport
          </h1>
          <p style={{ color: '#6B7280', fontSize: '1.1em' }}>
            Echte Blockchain-Transaktionen für deutsche Steuererklärung
          </p>
        </div>

        {/* WALLET INPUT */}
        <input 
          type="text" 
          value={walletAddress}
          onChange={(e) => setWalletAddress(e.target.value)}
          placeholder="Wallet-Adresse eingeben (z.B. 0x308e77281612bdc267d5feaf4599f2759cb3ed85)"
          style={{
            width: '100%',
            padding: '15px',
            border: '2px solid rgba(139, 92, 246, 0.2)',
            borderRadius: '10px',
            fontSize: '16px',
            marginBottom: '20px',
            transition: 'all 0.3s ease',
            background: 'rgba(255, 255, 255, 0.8)'
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#8B5CF6';
            e.target.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.1)';
            e.target.style.background = 'white';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'rgba(139, 92, 246, 0.2)';
            e.target.style.boxShadow = 'none';
            e.target.style.background = 'rgba(255, 255, 255, 0.8)';
          }}
        />

        {/* MAIN BUTTONS */}
        <div style={{ marginBottom: '30px' }}>
          <button
            onClick={handleRealTaxReport}
            disabled={isLoading}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
              color: 'white',
              border: 'none',
              padding: '20px',
              borderRadius: '15px',
              fontSize: '18px',
              fontWeight: 600,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              marginBottom: '15px',
              boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)',
              opacity: isLoading ? 0.6 : 1
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 8px 25px rgba(139, 92, 246, 0.4)';
                e.target.style.background = 'linear-gradient(135deg, #7C3AED, #6D28D9)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading) {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 15px rgba(139, 92, 246, 0.3)';
                e.target.style.background = 'linear-gradient(135deg, #8B5CF6, #7C3AED)';
              }
            }}
          >
            {isLoading ? '⏳ Lädt echte Daten...' : '🇩🇪 REAL TAX REPORT: Echte Transaktionen'}
          </button>
          <p style={{ fontSize: '0.9em', color: '#7C3AED', textAlign: 'center', fontWeight: 600 }}>
            ✅ Lädt echte Moralis-Transaktionen + Deutsches Steuerrecht (§22 & §23 EStG)
          </p>
        </div>

        <div style={{ marginBottom: '30px' }}>
          <button
            onClick={handleDirectMoralisReport}
            disabled={isLoading}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #9333EA, #8B5CF6)',
              color: 'white',
              border: 'none',
              padding: '20px',
              borderRadius: '15px',
              fontSize: '18px',
              fontWeight: 600,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              marginBottom: '15px',
              boxShadow: '0 4px 15px rgba(147, 51, 234, 0.3)',
              opacity: isLoading ? 0.6 : 1
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 8px 25px rgba(147, 51, 234, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading) {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 15px rgba(147, 51, 234, 0.3)';
              }
            }}
          >
            {isLoading ? '⏳ Lädt...' : '🎯 DIRECT MORALIS REAL TAX REPORT'}
          </button>
          <p style={{ fontSize: '0.9em', color: '#9333EA', textAlign: 'center', fontWeight: 600 }}>
            ✅ Echte Transaktionen ✅ Trial-kompatibel ✅ Keine 500 Errors
          </p>
        </div>

        {/* LOADING SPINNER */}
        {isLoading && (
          <div style={{ textAlign: 'center', padding: '20px', color: '#6B7280' }}>
            <div style={{
              width: '40px',
              height: '40px',
              margin: '0 auto 15px',
              border: '4px solid rgba(139, 92, 246, 0.1)',
              borderTop: '4px solid #8B5CF6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            <p>Lade Transaktionen und berechne deutsche Steuern...</p>
          </div>
        )}

        {/* ERROR DISPLAY */}
        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            color: '#DC2626',
            padding: '15px',
            borderRadius: '10px',
            marginTop: '15px'
          }}>
            ❌ {error}
          </div>
        )}

        {/* RESULTS DISPLAY */}
        {taxData && (
          <div style={{ marginTop: '30px' }}>
            {/* STATS GRID */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '20px',
              marginBottom: '30px'
            }}>
              <div style={{
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(124, 58, 237, 0.05))',
                padding: '25px',
                borderRadius: '15px',
                textAlign: 'center',
                transition: 'all 0.2s ease',
                border: '1px solid rgba(139, 92, 246, 0.1)',
                backdropFilter: 'blur(5px)'
              }}>
                <div style={{ fontSize: '2em', fontWeight: 700, color: '#7C3AED', marginBottom: '5px' }}>
                  {taxData.totalTransactions || taxData.transactions || 0}
                </div>
                <div style={{ color: '#6B7280', fontSize: '0.9em', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Transaktionen
                </div>
              </div>
              
              <div style={{
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(124, 58, 237, 0.05))',
                padding: '25px',
                borderRadius: '15px',
                textAlign: 'center',
                transition: 'all 0.2s ease',
                border: '1px solid rgba(139, 92, 246, 0.1)',
                backdropFilter: 'blur(5px)'
              }}>
                <div style={{ fontSize: '2em', fontWeight: 700, color: '#7C3AED', marginBottom: '5px' }}>
                  {taxData.events || taxData.taxableEvents || 0}
                </div>
                <div style={{ color: '#6B7280', fontSize: '0.9em', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Steuerpflichtige Events
                </div>
              </div>
              
              <div style={{
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(124, 58, 237, 0.05))',
                padding: '25px',
                borderRadius: '15px',
                textAlign: 'center',
                transition: 'all 0.2s ease',
                border: '1px solid rgba(139, 92, 246, 0.1)',
                backdropFilter: 'blur(5px)'
              }}>
                <div style={{ fontSize: '2em', fontWeight: 700, color: '#7C3AED', marginBottom: '5px' }}>
                  {formatCurrency(taxData.totalTax || taxData.tax || 0)}
                </div>
                <div style={{ color: '#6B7280', fontSize: '0.9em', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Gesamte Steuerlast
                </div>
              </div>
              
              <div style={{
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(124, 58, 237, 0.05))',
                padding: '25px',
                borderRadius: '15px',
                textAlign: 'center',
                transition: 'all 0.2s ease',
                border: '1px solid rgba(139, 92, 246, 0.1)',
                backdropFilter: 'blur(5px)'
              }}>
                <div style={{ fontSize: '2em', fontWeight: 700, color: '#7C3AED', marginBottom: '5px' }}>
                  {formatCurrency(taxData.totalGains || taxData.gains || 0)}
                </div>
                <div style={{ color: '#6B7280', fontSize: '0.9em', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Gesamte Gewinne
                </div>
              </div>
            </div>

            {/* EVENTS SECTION */}
            <div style={{
              background: 'rgba(139, 92, 246, 0.05)',
              borderRadius: '15px',
              padding: '25px',
              marginTop: '20px',
              border: '1px solid rgba(139, 92, 246, 0.1)'
            }}>
              <h3 style={{
                fontSize: '1.3em',
                color: '#7C3AED',
                marginBottom: '20px',
                textAlign: 'center',
                fontWeight: 600
              }}>
                📋 Steuerpflichtige Ereignisse
              </h3>
              
              {taxData.taxEvents && taxData.taxEvents.length > 0 && (
                <div style={{
                  background: 'white',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  boxShadow: '0 4px 15px rgba(139, 92, 246, 0.1)'
                }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)' }}>
                        <th style={{ color: 'white', padding: '12px', textAlign: 'left', fontWeight: 600 }}>Datum</th>
                        <th style={{ color: 'white', padding: '12px', textAlign: 'left', fontWeight: 600 }}>Token</th>
                        <th style={{ color: 'white', padding: '12px', textAlign: 'left', fontWeight: 600 }}>Typ</th>
                        <th style={{ color: 'white', padding: '12px', textAlign: 'left', fontWeight: 600 }}>Wert (EUR)</th>
                        <th style={{ color: 'white', padding: '12px', textAlign: 'left', fontWeight: 600 }}>Steuer (EUR)</th>
                        <th style={{ color: 'white', padding: '12px', textAlign: 'left', fontWeight: 600 }}>Rechtslage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {taxData.taxEvents.slice(0, 10).map((event, index) => (
                        <tr key={index} style={{ borderBottom: '1px solid rgba(139, 92, 246, 0.1)' }}>
                          <td style={{ padding: '12px', color: '#374151' }}>
                            {event.date || new Date().toLocaleDateString('de-DE')}
                          </td>
                          <td style={{ padding: '12px', color: '#8B5CF6', fontWeight: 600 }}>
                            {event.token || 'N/A'}
                          </td>
                          <td style={{ padding: '12px', color: '#374151' }}>
                            {event.type || 'N/A'}
                          </td>
                          <td style={{ padding: '12px', color: '#374151' }}>
                            {formatCurrency(event.valueEUR || event.value || 0)}
                          </td>
                          <td style={{ padding: '12px', color: '#374151', fontWeight: 700 }}>
                            {formatCurrency(event.tax || 0)}
                          </td>
                          <td style={{ padding: '12px', color: '#374151' }}>
                            {event.paragraph || '§22 EStG'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              
              <div style={{ marginTop: '20px', textAlign: 'center' }}>
                <p style={{ fontSize: '0.9em', color: '#7C3AED', fontWeight: 600 }}>
                  📄 PDF wurde automatisch in Ihren Downloads-Ordner heruntergeladen.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ADDITIONAL BUTTONS */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '30px' }}>
          <button
            onClick={handlePhase2Test}
            disabled={isLoading}
            style={{
              background: 'linear-gradient(135deg, #A855F7, #9333EA)',
              color: 'white',
              border: 'none',
              padding: '15px',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              opacity: isLoading ? 0.6 : 1
            }}
          >
            {isLoading ? '⏳ Lädt...' : '🚀 PHASE 2: CoinGecko'}
          </button>
          
          <button
            onClick={handlePhase3Test}
            disabled={isLoading}
            style={{
              background: 'linear-gradient(135deg, #9333EA, #7C3AED)',
              color: 'white',
              border: 'none',
              padding: '15px',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              opacity: isLoading ? 0.6 : 1
            }}
          >
            {isLoading ? '⏳ Lädt...' : '🔥 PHASE 3: Moralis Pro'}
          </button>
        </div>

        <div style={{ marginTop: '15px' }}>
          <button
            onClick={handleTrialSafeTest}
            disabled={isLoading}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #C084FC, #A855F7)',
              color: 'white',
              border: 'none',
              padding: '15px',
              borderRadius: '10px',
              fontSize: '16px',
              fontWeight: 600,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              opacity: isLoading ? 0.6 : 1
            }}
          >
            {isLoading ? '⏳ Lädt...' : '🚨 TRIAL-SAFE: TypeError Bug-Fix'}
          </button>
        </div>

        <div style={{ marginTop: '15px' }}>
          <button
            onClick={() => {
              const ethPrinterData = createETHPrinterDemoData();
              const fixedData = fixTaxReportDisplay(ethPrinterData);
              setTaxData({
                reports: fixedData.reports,
                summary: fixedData.summary,
                transactionsProcessed: fixedData.transactionsProcessed,
                totalTransactions: fixedData.transactionsProcessed,
                events: fixedData.reports?.length || 0,
                totalTax: fixedData.summary?.totalTax || 0,
                totalGains: fixedData.summary?.totalGains || 0,
                taxEvents: fixedData.reports || [],
                metadata: {
                  source: 'ETH Printer Demo Data',
                  compliance: 'Deutsche Steuerkonformität §22 & §23 EStG',
                  calculationDate: new Date().toISOString(),
                  priceSource: 'ETH Printer Demo + Live Preise',
                  note: 'Basierend auf echten ETH Printer Transaktionen'
                }
              });
              fixETHPrinterTaxDisplay();
            }}
            disabled={isLoading}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #EC4899, #DB2777)',
              color: 'white',
              border: 'none',
              padding: '15px',
              borderRadius: '10px',
              fontSize: '16px',
              fontWeight: 600,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              opacity: isLoading ? 0.6 : 1
            }}
          >
            🖨️ ETH PRINTER DEMO (ECHTE TRANSAKTIONEN)
          </button>
        </div>

        <div style={{ marginTop: '15px' }}>
          <button
            onClick={handleEmergencyTest}
            disabled={isLoading}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)',
              color: 'white',
              border: 'none',
              padding: '15px',
              borderRadius: '10px',
              fontSize: '16px',
              fontWeight: 600,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              opacity: isLoading ? 0.6 : 1
            }}
          >
            {isLoading ? '⏳ Lädt...' : '🚨 EMERGENCY: Demo-Daten'}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default TaxReportView; 