import React, { useState } from 'react';
import { FileText, AlertTriangle, Info } from 'lucide-react';

const SimpleTaxTracker = () => {
  const [walletAddress, setWalletAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [taxData, setTaxData] = useState(null);
  const [error, setError] = useState(null);

  const handleGenerateReport = async () => {
    if (!walletAddress) {
      alert('Bitte Wallet-Adresse eingeben');
      return;
    }

    setIsLoading(true);
    setTaxData(null);
    setError(null);

    try {
      console.log('🔥 Starte echte Moralis-Datenabfrage...');
      
      const response = await fetch('/api/real-tax-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          address: walletAddress,
          realDataOnly: true // Nur echte Daten!
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📊 API Response:', data); // Debug Log
      
      if (data.success && data.taxReport) {
        console.log('✅ Echte Daten erfolgreich geladen:', data.taxReport);
        setTaxData(data.taxReport);
        
        // Automatischer PDF Download
        if (data.taxReport.pdfBuffer) {
          const blob = new Blob([new Uint8Array(data.taxReport.pdfBuffer.data)], { type: 'application/pdf' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `Steuerreport_${walletAddress.slice(0,8)}_${new Date().toISOString().split('T')[0]}.pdf`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        }
        
      } else {
        throw new Error(data.error || 'Fehler beim Laden der Daten');
      }

    } catch (error) {
      console.error('❌ Fehler:', error);
      setError(`Fehler: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return '0,00 €';
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-6">
      <div className="max-w-4xl mx-auto">
        
        {/* Header - PulseChain Style */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-violet-400 to-purple-300 bg-clip-text text-transparent mb-4">
            🇩🇪 PulseChain Steuer-Tracker
          </h1>
          <p className="text-xl text-purple-200">
            Echte Blockchain-Daten für deine Steuererklärung
          </p>
        </div>

        {/* Wichtiger Disclaimer - PulseChain Colors */}
        <div className="bg-gradient-to-r from-purple-900 to-violet-900 border border-purple-500 p-4 mb-6 rounded-xl">
          <div className="flex items-start">
            <AlertTriangle className="h-6 w-6 text-purple-400 mr-3 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-purple-100 mb-2">
                ⚠️ Wichtiger Hinweis
              </h3>
              <p className="text-purple-200">
                <strong>Diese Berechnung ist nur eine grobe Orientierung!</strong><br/>
                Für deine finale Steuererklärung MUSST du einen Steuerberater konsultieren. 
                Wir übernehmen keine Verantwortung für steuerliche Entscheidungen.
              </p>
            </div>
          </div>
        </div>

        {/* Main Card - PulseChain Style */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-purple-500 rounded-2xl shadow-2xl p-8 mb-6">
          
          {/* Wallet Input - FIXED TEXT COLOR */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-purple-300 mb-2">
              Wallet-Adresse
            </label>
            <input 
              type="text" 
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              placeholder="0x308e77281612bdc267d5feaf4599f2759cb3ed85"
              className="w-full px-4 py-3 bg-gray-700 border border-purple-500 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-purple-400 text-white placeholder-gray-400 text-lg transition-all"
            />
          </div>

          {/* Generate Button - PulseChain Gradient */}
          <button
            onClick={handleGenerateReport}
            disabled={isLoading || !walletAddress}
            className={`w-full py-4 px-6 rounded-xl text-lg font-semibold transition-all duration-200 ${
              isLoading || !walletAddress
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 via-violet-600 to-purple-700 text-white hover:from-purple-700 hover:via-violet-700 hover:to-purple-800 hover:shadow-lg hover:shadow-purple-500/25 transform hover:-translate-y-0.5'
            }`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
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
          <div className="mt-4 p-4 bg-gradient-to-r from-purple-800 to-violet-800 rounded-lg border border-purple-600">
            <div className="flex items-start">
              <Info className="h-5 w-5 text-purple-300 mr-2 mt-0.5" />
              <div className="text-sm text-purple-100">
                <strong>Was passiert:</strong> Wir laden alle deine Transaktionen von Moralis & anderen APIs, 
                berechnen grob die steuerlichen Auswirkungen nach deutschem Recht und erstellen einen PDF-Report.
              </div>
            </div>
          </div>
        </div>

        {/* Error Display - PulseChain Style */}
        {error && (
          <div className="bg-gradient-to-r from-red-900 to-red-800 border border-red-500 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="text-red-400">❌</div>
              <div className="ml-3 text-red-100">{error}</div>
            </div>
          </div>
        )}

        {/* Results - PulseChain Style */}
        {taxData && (
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-purple-500 rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-violet-400 bg-clip-text text-transparent mb-6 text-center">
              📊 Deine Steuer-Übersicht
            </h2>
            
            {/* Stats Grid - PulseChain Colors */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-6 text-white text-center border border-purple-500">
                <div className="text-3xl font-bold mb-2">
                  {taxData.totalTransactions || taxData.transactions || 0}
                </div>
                <div className="text-purple-200">Transaktionen</div>
              </div>
              
              <div className="bg-gradient-to-br from-violet-600 to-violet-700 rounded-xl p-6 text-white text-center border border-violet-500">
                <div className="text-3xl font-bold mb-2">
                  {taxData.events || taxData.taxableEvents || 0}
                </div>
                <div className="text-violet-200">Steuer-Events</div>
              </div>
              
              <div className="bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl p-6 text-white text-center border border-purple-400">
                <div className="text-3xl font-bold mb-2">
                  {formatCurrency(taxData.totalGains || taxData.gains || 0)}
                </div>
                <div className="text-purple-200">Gesamte Gewinne</div>
              </div>
              
              <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl p-6 text-white text-center border border-violet-400">
                <div className="text-3xl font-bold mb-2">
                  {formatCurrency(taxData.totalTax || taxData.tax || 0)}
                </div>
                <div className="text-violet-200">Grobe Steuerlast</div>
              </div>
            </div>

            {/* Events Table - PulseChain Style */}
            {taxData.taxEvents && taxData.taxEvents.length > 0 && (
              <div className="overflow-x-auto">
                <h3 className="text-xl font-semibold text-purple-300 mb-4">
                  📋 Steuerpflichtige Ereignisse (Top 10)
                </h3>
                <table className="w-full bg-gray-800 rounded-lg overflow-hidden shadow-lg border border-purple-600">
                  <thead className="bg-gradient-to-r from-purple-700 to-violet-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-white font-semibold">Datum</th>
                      <th className="px-4 py-3 text-left text-white font-semibold">Token</th>
                      <th className="px-4 py-3 text-left text-white font-semibold">Typ</th>
                      <th className="px-4 py-3 text-left text-white font-semibold">Wert (EUR)</th>
                      <th className="px-4 py-3 text-left text-white font-semibold">Steuer (EUR)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {taxData.taxEvents.slice(0, 10).map((event, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-gray-700' : 'bg-gray-800'}>
                        <td className="px-4 py-3 text-sm text-purple-200">
                          {event.date || new Date().toLocaleDateString('de-DE')}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-purple-300">
                          {event.token || 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-sm text-violet-200">
                          {event.type || 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-sm text-purple-100">
                          {formatCurrency(event.valueEUR || event.value || 0)}
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-violet-300">
                          {formatCurrency(event.tax || 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Download Info - PulseChain Style */}
            <div className="mt-6 p-4 bg-gradient-to-r from-purple-800 to-violet-800 rounded-lg text-center border border-purple-600">
              <div className="text-purple-100">
                ✅ <strong>PDF wurde automatisch heruntergeladen!</strong><br/>
                Schau in deinen Downloads-Ordner.
              </div>
            </div>
          </div>
        )}

        {/* Bottom Disclaimer - PulseChain Style */}
        <div className="mt-8 text-center text-purple-300 text-sm">
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