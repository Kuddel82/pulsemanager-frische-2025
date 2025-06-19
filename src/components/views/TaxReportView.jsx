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
  const [reportGenerated, setReportGenerated] = useState(false);

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
      
      // Automatisch erste Wallet setzen (OHNE API-Aufruf!)
      if (wallets && wallets.length > 0 && !walletAddress) {
        const firstWallet = wallets[0].address;
        setWalletAddress(firstWallet);
        console.log('✅ Wallet automatisch geladen:', firstWallet.slice(0, 8) + '...');
        // KEIN AUTOMATISCHER API-AUFRUF MEHR!
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
    // Reset report data when wallet changes
    setTaxData(null);
    setReportGenerated(false);
    setError(null);
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
    setReportGenerated(false);

    try {
      console.log('🔥🔥🔥 STEUERREPORT: ROLLBACK TO STABLE VERSION 🔥🔥🔥');
      console.log(`🔍 DEBUG: Processing wallet address: ${walletAddress}`);
      
      // 🇩🇪 STABILE VERSION: NUR ERC20 TRANSFERS - BEWÄHRT
      const response = await fetch('/api/german-tax-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: walletAddress,
          chain: 'all', // Lade beide Chains
          limit: 2000 // Stabiles Limit
        })
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Fehler beim Laden der Steuerdaten');
      }

      console.log('✅ Stabile Steuerreport erfolgreich geladen:', data.taxReport);
      setTaxData(data.taxReport);
      setReportGenerated(true);

    } catch (error) {
      console.error('❌ Fehler:', error);
      setError(`Fehler: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Manueller PDF Download
  const handleDownloadPDF = async () => {
    if (!taxData) {
      alert('Keine Steuerdaten verfügbar');
      return;
    }

    try {
      console.log('📄 Generiere PDF für Steuerreport...');
      
      // 🔥 EINFACHE HTML ZU PDF LÖSUNG
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0];
      const walletShort = walletAddress.slice(0, 8);
      
      // HTML Content erstellen
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>PulseManager Steuerreport</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .section { margin-bottom: 20px; }
            .stats { display: flex; justify-content: space-between; margin-bottom: 20px; }
            .stat { text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .legal { margin-top: 30px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🇩🇪 PulseManager Steuerreport</h1>
            <p>Wallet: ${walletAddress}</p>
            <p>Generiert am: ${today.toLocaleDateString('de-DE')}</p>
          </div>
          
          <div class="section">
            <h2>📊 Steuer-Übersicht</h2>
            <div class="stats">
              <div class="stat">
                <h3>${taxData.summary?.totalTransactions || taxData.transactions?.length || 0}</h3>
                <p>Gesamt Transaktionen</p>
              </div>
              <div class="stat">
                <h3>${taxData.summary?.pulsechainTransactions || 0}</h3>
                <p>PulseChain</p>
              </div>
              <div class="stat">
                <h3>${taxData.summary?.ethereumTransactions || 0}</h3>
                <p>Ethereum</p>
              </div>
              <div class="stat">
                <h3>${taxData.summary?.roiCount || 0}</h3>
                <p>Steuer-Events</p>
              </div>
              <div class="stat">
                <h3>${formatCurrency(taxData.summary?.totalROIValueEUR || 0)}</h3>
                <p>Gesamte Gewinne</p>
              </div>
              <div class="stat">
                <h3>${formatCurrency(taxData.summary?.totalTaxEUR || 0)}</h3>
                <p>Grobe Steuerlast</p>
              </div>
            </div>
          </div>
          
          <div class="section">
            <h2>📋 Transaktionen (${taxData.transactions.length} von ${taxData.transactions.length})</h2>
            <table>
              <thead>
                <tr>
                  <th>Datum</th>
                  <th>Chain</th>
                  <th>Token</th>
                  <th>Typ</th>
                  <th>Richtung</th>
                  <th>Wert</th>
                </tr>
              </thead>
              <tbody>
                ${taxData.transactions.map((tx, index) => {
                  const date = tx.timestamp ? new Date(tx.timestamp).toLocaleDateString('de-DE') : 'N/A';
                  const chain = tx.chain === '0x1' ? 'ETH' : tx.chain === '0x171' ? 'PLS' : 'UNK';
                  const token = tx.tokenSymbol || 'N/A';
                  const direction = tx.directionIcon || (tx.direction === 'in' ? '📥 IN' : '📤 OUT');
                  const value = tx.formattedValue || (tx.value ? (parseFloat(tx.value) / Math.pow(10, tx.tokenDecimal || 18)).toFixed(6) : '0');
                  return `
                    <tr>
                      <td>${date}</td>
                      <td>${chain}</td>
                      <td>${token}</td>
                      <td>${tx.type || 'N/A'}</td>
                      <td>${direction}</td>
                      <td>${value}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
          
          <div class="legal">
            <h3>⚖️ Rechtlicher Hinweis</h3>
            <p>Dieser Steuerreport dient nur zu Informationszwecken und stellt keine Steuerberatung dar.</p>
            <p>Für Ihre finale Steuererklärung müssen Sie einen qualifizierten Steuerberater konsultieren.</p>
            <p>Wir übernehmen keine Verantwortung für steuerliche Entscheidungen.</p>
            <p><strong>Generiert von PulseManager</strong></p>
          </div>
        </body>
        </html>
      `;
      
      // 📁 AUTOMATISCH IN DOWNLOADS-ORDNER SPEICHERN
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `PulseManager_Steuerreport_${walletShort}_${dateStr}.html`;
      
      // 🎯 AUTOMATISCH KLICKEN UND SPEICHERN
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      console.log('📄 HTML-Report erfolgreich generiert:', a.download);
      alert(`✅ Steuerreport erfolgreich heruntergeladen!\n📁 Datei: ${a.download}\n📂 Ort: Downloads-Ordner\n💡 Öffnen Sie die HTML-Datei und drucken Sie sie als PDF!`);
      
    } catch (error) {
      console.error('❌ Report-Generierung Fehler:', error);
      alert(`❌ Fehler bei Report-Generierung: ${error.message}`);
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
                  {taxData.summary?.totalTransactions || taxData.transactions?.length || 0}
                </div>
                <div className="pulse-stat-label">Transaktionen</div>
              </div>
              
              <div className="pulse-stat">
                <div className="pulse-stat-value">
                  {(taxData.summary?.roiCount || 0) + (taxData.summary?.saleCount || 0)}
                </div>
                <div className="pulse-stat-label">Steuer-Events</div>
              </div>
              
              <div className="pulse-stat">
                <div className="pulse-stat-value">
                  {formatCurrency(taxData.summary?.totalGainsEUR || 0)}
                </div>
                <div className="pulse-stat-label">Gesamte Gewinne</div>
              </div>
              
              <div className="pulse-stat">
                <div className="pulse-stat-value">
                  {formatCurrency(taxData.summary?.totalTaxEUR || 0)}
                </div>
                <div className="pulse-stat-label">Grobe Steuerlast</div>
              </div>
            </div>

            {/* Events Table - PulseChain Style */}
            {taxData.transactions && taxData.transactions.length > 0 && (
              <div className="overflow-x-auto mb-6">
                <h3 className="text-xl font-semibold pulse-text mb-4">
                  📋 Transaktionen ({taxData.transactions.length} von {taxData.transactions.length})
                </h3>
                <table className="w-full rounded-lg overflow-hidden" style={{backgroundColor: 'var(--bg-secondary)'}}>
                  <thead style={{background: 'var(--pulse-gradient-primary)'}}>
                    <tr>
                      <th className="px-4 py-3 text-left text-black font-semibold">Datum</th>
                      <th className="px-4 py-3 text-left text-black font-semibold">Token</th>
                      <th className="px-4 py-3 text-left text-black font-semibold">Typ</th>
                      <th className="px-4 py-3 text-left text-black font-semibold">Richtung</th>
                      <th className="px-4 py-3 text-left text-black font-semibold">Wert</th>
                    </tr>
                  </thead>
                  <tbody>
                    {taxData.transactions.map((tx, index) => (
                      <tr key={index} style={{backgroundColor: index % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-secondary)'}}>
                        <td className="px-4 py-3 text-sm pulse-text-secondary">
                          {tx.block_timestamp ? new Date(tx.block_timestamp).toLocaleDateString('de-DE') : 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium pulse-text">
                          {tx.token_symbol || tx.tokenSymbol || 'UNKNOWN'}
                        </td>
                        <td className="px-4 py-3 text-sm pulse-text-secondary">
                          {tx.taxCategory || 'ERC20_TRANSFER'}
                        </td>
                        <td className="px-4 py-3 text-sm pulse-text">
                          <span className={`px-2 py-1 rounded text-xs ${
                            tx.direction === 'in' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {tx.directionIcon || (tx.direction === 'in' ? '📥 IN' : '📤 OUT')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm font-bold pulse-text-gradient">
                          {tx.amount ? tx.amount.toFixed(6) : (tx.value ? (parseFloat(tx.value) / Math.pow(10, tx.token_decimals || 18)).toFixed(6) : '0')}
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
                📁 Klicke um den HTML-Report in deinen <strong>Downloads-Ordner</strong> zu speichern.
              </div>
              <button
                onClick={handleDownloadPDF}
                disabled={!taxData}
                className={`pulse-btn ${!taxData ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02]'}`}
              >
                <Download className="h-5 w-5 mr-2" />
                📂 In Downloads-Ordner speichern
              </button>
              <div className="mt-2 text-xs pulse-text-secondary">
                💡 Dateiname: PulseManager_Steuerreport_{formatAddress(walletAddress)}_{new Date().toISOString().split('T')[0]}.html
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