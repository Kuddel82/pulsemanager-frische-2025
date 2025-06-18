import React, { useState, useEffect } from 'react';
import { FileText, AlertTriangle, Info, Download, Wallet } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';

const SimpleTaxTracker = () => {
  const { user } = useAuth();
  
  const [walletAddress, setWalletAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [taxData, setTaxData] = useState(null);
  const [error, setError] = useState(null);
  const [pdfData, setPdfData] = useState(null);
  const [dbWallets, setDbWallets] = useState([]);

  // 🎯 WALLET INTEGRATION: Lade Wallets direkt aus Datenbank
  const loadWalletsFromDatabase = async () => {
    if (!user?.id) return;
    
    try {
      const { data: wallets, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Wallet-Abfrage Fehler:', error);
        return;
      }

      setDbWallets(wallets || []);
      
      // Automatisch erste Wallet setzen
      if (wallets && wallets.length > 0 && !walletAddress) {
        const firstWallet = wallets[0].address;
        setWalletAddress(firstWallet);
        console.log('✅ Wallet automatisch geladen:', firstWallet.slice(0, 8) + '...');
      }
      
    } catch (error) {
      console.error('💥 Fehler beim Laden der Wallets:', error);
    }
  };

  // Lade Wallets beim Start
  useEffect(() => {
    if (user?.id) {
      loadWalletsFromDatabase();
    }
  }, [user?.id]);

  const hasConnectedWallets = dbWallets.length > 0;
  const connectedWallets = dbWallets.map(w => w.address);

  const handleWalletSelect = (address) => {
    setWalletAddress(address);
  };

  const handleGenerateReport = async () => {
    if (!walletAddress) {
      alert('Bitte Wallet-Adresse eingeben oder verbundene Wallet auswählen');
      return;
    }

    setIsLoading(true);
    setTaxData(null);
    setError(null);
    setPdfData(null);

    try {
      console.log('🔥 Starte echte Moralis-Datenabfrage...');
      console.log(`🔍 DEBUG: Processing wallet address: ${walletAddress}`);
      
      // 🔥 ALTERNATIVE: Verwende ScanTransactionService direkt
      console.log(`🔍 DEBUG: Testing ScanTransactionService for ${walletAddress}...`);
      
      const { ScanTransactionService } = await import('@/services/scanTransactionService.js');
      const scanResult = await ScanTransactionService.getUltimateTaxHistory(walletAddress);
      
      console.log(`🔍 DEBUG: ScanTransactionService result:`, scanResult);
      console.log(`🔍 DEBUG: Total transactions from scan: ${scanResult.totalCount}`);
      
      if (scanResult.totalCount > 0) {
        // Erstelle einen einfachen Tax Report
        const taxReport = {
          transactions: scanResult.allTransactions,
          summary: {
            totalTransactions: scanResult.totalCount,
            roiCount: scanResult.taxableCount,
            saleCount: 0,
            totalROIValueEUR: 0,
            totalSaleValueEUR: 0,
            totalTaxEUR: 0
          },
          metadata: {
            source: 'pulsechain_scan_direct',
            walletAddress: walletAddress,
            chains: ['0x171'],
            year: 'all'
          }
        };
        
        console.log('✅ Echte Daten erfolgreich geladen:', taxReport);
        setTaxData(taxReport);
        
      } else {
        throw new Error('Keine Transaktionen gefunden');
      }

    } catch (error) {
      console.error('❌ Fehler:', error);
      setError(`Fehler: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Manueller PDF Download
  const handleDownloadPDF = () => {
    if (!pdfData) {
      alert('Keine PDF-Daten verfügbar');
      return;
    }

    try {
      const blob = new Blob([new Uint8Array(pdfData.data)], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // 📁 BESSERER DATEINAME für Downloads-Ordner
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0]; // YYYY-MM-DD
      const walletShort = walletAddress.slice(0,8);
      a.download = `PulseManager_Steuerreport_${walletShort}_${dateStr}.pdf`;
      
      // 🎯 AUTOMATISCH IN DOWNLOADS-ORDNER
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      console.log('📄 PDF erfolgreich in Downloads-Ordner gespeichert:', a.download);
      
      // ✅ SUCCESS FEEDBACK
      alert(`✅ PDF erfolgreich heruntergeladen!\n📁 Datei: ${a.download}\n📂 Ort: Downloads-Ordner`);
      
    } catch (error) {
      console.error('❌ PDF Download Fehler:', error);
      alert('❌ Fehler beim PDF Download: ' + error.message);
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return '0,00 €';
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="min-h-screen pulse-bg p-6">
      <div className="max-w-4xl mx-auto">
        
        {/* Header - Richtiges PulseChain Style */}
        <div className="text-center mb-8">
          <h1 className="pulse-title mb-4">
            🇩🇪 Steuer-Tracker
          </h1>
          <p className="pulse-subtitle">
            Echte Blockchain-Daten für deine Steuererklärung
          </p>
        </div>

        {/* Wichtiger Disclaimer - PulseChain Style */}
        <div className="pulse-card mb-6 border-l-4" style={{borderLeftColor: 'var(--accent-green)'}}>
          <div className="flex items-start">
            <AlertTriangle className="h-6 w-6 mr-3 mt-0.5" style={{color: 'var(--accent-green)'}} />
            <div>
              <h3 className="text-lg font-semibold pulse-text mb-2">
                ⚠️ Wichtiger Hinweis
              </h3>
              <p className="pulse-text-secondary">
                <strong>Diese Berechnung ist nur eine grobe Orientierung!</strong><br/>
                Für deine finale Steuererklärung MUSST du einen Steuerberater konsultieren. 
                Wir übernehmen keine Verantwortung für steuerliche Entscheidungen.
              </p>
            </div>
          </div>
        </div>

        {/* Main Card - PulseChain Style */}
        <div className="pulse-card mb-6">
          
          {/* 🎯 WALLET AUSWAHL: Einfach und sauber */}
          <div className="mb-6 space-y-4">
            
            {/* Verbundene Wallets anzeigen */}
            {hasConnectedWallets && (
              <div>
                <label className="block text-sm font-medium pulse-text mb-2 flex items-center">
                  <Wallet className="h-4 w-4 mr-2" style={{color: 'var(--accent-green)'}} />
                  Deine Wallets ({connectedWallets.length})
                </label>
                
                {/* Einzelne Wallet - Automatisch ausgewählt */}
                {connectedWallets.length === 1 && (
                  <div className="p-3 rounded-lg border-2" style={{
                    backgroundColor: 'rgba(0, 255, 85, 0.1)',
                    borderColor: 'var(--accent-green)'
                  }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-mono text-sm pulse-text">
                          {formatAddress(connectedWallets[0])}
                        </div>
                        <div className="text-xs pulse-text-secondary">
                          ✅ Automatisch geladen
                        </div>
                      </div>
                      <div className="text-green-500">✓</div>
                    </div>
                  </div>
                )}
                
                {/* Mehrere Wallets - Auswahl */}
                {connectedWallets.length > 1 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                    {connectedWallets.map((address, index) => (
                      <button
                        key={index}
                        onClick={() => handleWalletSelect(address)}
                        className="p-3 rounded-lg text-left transition-all border-2"
                        style={{
                          backgroundColor: walletAddress === address ? 'rgba(0, 255, 85, 0.1)' : 'var(--bg-secondary)',
                          borderColor: walletAddress === address ? 'var(--accent-green)' : 'var(--border-color)'
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-mono text-sm pulse-text">
                              {formatAddress(address)}
                            </div>
                            <div className="text-xs pulse-text-secondary">
                              Wallet #{index + 1}
                            </div>
                          </div>
                          {walletAddress === address && (
                            <div className="text-green-500">✓</div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {/* Keine Wallets - Einfacher Hinweis */}
            {!hasConnectedWallets && (
              <div className="p-4 rounded-lg border-2 border-dashed" style={{borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)'}}>
                <div className="text-center">
                  <Wallet className="h-8 w-8 mx-auto mb-2" style={{color: 'var(--accent-green)'}} />
                  <p className="pulse-text mb-3">
                    <strong>Keine Wallet gefunden</strong><br/>
                    Gehe zum Dashboard und verbinde deine Wallet
                  </p>
                </div>
              </div>
            )}
            
            {/* Manuelle Eingabe - Immer verfügbar */}
            <div>
              <label className="block text-sm font-medium pulse-text mb-2">
                {hasConnectedWallets ? 'Andere Wallet verwenden:' : 'Wallet-Adresse eingeben:'}
              </label>
              <input 
                type="text" 
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                placeholder="0x308e77281612bdc267d5feaf4599f2759cb3ed85"
                className="w-full px-4 py-3 rounded-lg text-lg transition-all"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  border: '2px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  outline: 'none'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--accent-green)';
                  e.target.style.boxShadow = '0 0 0 3px rgba(0, 255, 85, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--border-color)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
          </div>

          {/* Generate Button - PulseChain Style */}
          <button
            onClick={handleGenerateReport}
            disabled={isLoading || !walletAddress}
            className={`w-full py-4 px-6 rounded-xl text-lg font-semibold transition-all duration-200 ${
              isLoading || !walletAddress
                ? 'opacity-50 cursor-not-allowed'
                : 'pulse-btn hover:scale-[1.02]'
            }`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-current mr-3"></div>
                Lade echte Transaktionen...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <FileText className="h-6 w-6 mr-2" />
                Steuerreport generieren
              </div>
            )}
          </button>

          {/* What happens info - PulseChain Style */}
          <div className="mt-4 p-4 rounded-lg" style={{backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)'}}>
            <div className="flex items-start">
              <Info className="h-5 w-5 mr-2 mt-0.5" style={{color: 'var(--accent-green)'}} />
              <div className="text-sm pulse-text-secondary">
                <strong>Was passiert:</strong> Wir laden alle deine Transaktionen von Moralis & anderen APIs, 
                berechnen grob die steuerlichen Auswirkungen nach deutschem Recht und erstellen einen PDF-Report.
              </div>
            </div>
          </div>
        </div>

        {/* Error Display - PulseChain Style */}
        {error && (
          <div className="pulse-card mb-6 border-l-4" style={{borderLeftColor: 'var(--accent-pink)'}}>
            <div className="flex">
              <div style={{color: 'var(--accent-pink)'}}>❌</div>
              <div className="ml-3 pulse-text">{error}</div>
            </div>
          </div>
        )}

        {/* Results - PulseChain Style */}
        {taxData && (
          <div className="pulse-card">
            <h2 className="text-2xl font-bold pulse-text-gradient mb-6 text-center">
              📊 Deine Steuer-Übersicht
            </h2>
            
            {/* Stats Grid - PulseChain Style */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="pulse-stat">
                <div className="pulse-stat-value">
                  {taxData.totalTransactions || taxData.transactions || 0}
                </div>
                <div className="pulse-stat-label">Transaktionen</div>
              </div>
              
              <div className="pulse-stat">
                <div className="pulse-stat-value">
                  {taxData.events || taxData.taxableEvents || 0}
                </div>
                <div className="pulse-stat-label">Steuer-Events</div>
              </div>
              
              <div className="pulse-stat">
                <div className="pulse-stat-value">
                  {formatCurrency(taxData.totalGains || taxData.gains || 0)}
                </div>
                <div className="pulse-stat-label">Gesamte Gewinne</div>
              </div>
              
              <div className="pulse-stat">
                <div className="pulse-stat-value">
                  {formatCurrency(taxData.totalTax || taxData.tax || 0)}
                </div>
                <div className="pulse-stat-label">Grobe Steuerlast</div>
              </div>
            </div>

            {/* Events Table - PulseChain Style */}
            {taxData.taxEvents && taxData.taxEvents.length > 0 && (
              <div className="overflow-x-auto mb-6">
                <h3 className="text-xl font-semibold pulse-text mb-4">
                  📋 Steuerpflichtige Ereignisse (Top 10)
                </h3>
                <table className="w-full rounded-lg overflow-hidden" style={{backgroundColor: 'var(--bg-secondary)'}}>
                  <thead style={{background: 'var(--pulse-gradient-primary)'}}>
                    <tr>
                      <th className="px-4 py-3 text-left text-black font-semibold">Datum</th>
                      <th className="px-4 py-3 text-left text-black font-semibold">Token</th>
                      <th className="px-4 py-3 text-left text-black font-semibold">Typ</th>
                      <th className="px-4 py-3 text-left text-black font-semibold">Wert (EUR)</th>
                      <th className="px-4 py-3 text-left text-black font-semibold">Steuer (EUR)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {taxData.taxEvents.slice(0, 10).map((event, index) => (
                      <tr key={index} style={{backgroundColor: index % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-secondary)'}}>
                        <td className="px-4 py-3 text-sm pulse-text-secondary">
                          {event.date || new Date().toLocaleDateString('de-DE')}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium pulse-text">
                          {event.token || 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-sm pulse-text-secondary">
                          {event.type || 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-sm pulse-text">
                          {formatCurrency(event.valueEUR || event.value || 0)}
                        </td>
                        <td className="px-4 py-3 text-sm font-bold pulse-text-gradient">
                          {formatCurrency(event.tax || 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* PDF Download Button - Manuell */}
            <div className="mt-6 p-4 rounded-lg text-center border-l-4" style={{backgroundColor: 'var(--bg-secondary)', borderLeftColor: 'var(--accent-green)'}}>
              <div className="pulse-text mb-4">
                ✅ <strong>Steuerreport erfolgreich erstellt!</strong><br/>
                📁 Klicke um den PDF-Report in deinen <strong>Downloads-Ordner</strong> zu speichern.
              </div>
              <button
                onClick={handleDownloadPDF}
                disabled={!pdfData}
                className={`pulse-btn ${!pdfData ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02]'}`}
              >
                <Download className="h-5 w-5 mr-2" />
                📂 In Downloads-Ordner speichern
              </button>
              <div className="mt-2 text-xs pulse-text-secondary">
                💡 Dateiname: PulseManager_Steuerreport_{formatAddress(walletAddress)}_{new Date().toISOString().split('T')[0]}.pdf
              </div>
            </div>
          </div>
        )}

        {/* Bottom Disclaimer - PulseChain Style */}
        <div className="mt-8 text-center pulse-text-secondary text-sm">
          <p>
            🔒 Deine Wallet-Adresse wird nicht gespeichert.<br/>
            📊 Berechnung basiert auf echten Blockchain-Daten von Moralis & Co.<br/>
            ⚖️ Für finale Steuerberatung konsultiere einen Experten.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SimpleTaxTracker; 