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
      
      if (data.success && data.taxReport) {
        console.log('✅ Echte Daten erfolgreich geladen');
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
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            🇩🇪 Wallet Steuer-Tracker
          </h1>
          <p className="text-xl text-purple-200">
            Echte Blockchain-Daten für deine Steuererklärung
          </p>
        </div>

        {/* Wichtiger Disclaimer */}
        <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-6 rounded-r-lg">
          <div className="flex items-start">
            <AlertTriangle className="h-6 w-6 text-amber-400 mr-3 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-amber-800 mb-2">
                ⚠️ Wichtiger Hinweis
              </h3>
              <p className="text-amber-700">
                <strong>Diese Berechnung ist nur eine grobe Orientierung!</strong><br/>
                Für deine finale Steuererklärung MUSST du einen Steuerberater konsultieren. 
                Wir übernehmen keine Verantwortung für steuerliche Entscheidungen.
              </p>
            </div>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-6">
          
          {/* Wallet Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Wallet-Adresse
            </label>
            <input 
              type="text" 
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              placeholder="0x308e77281612bdc267d5feaf4599f2759cb3ed85"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-lg"
            />
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerateReport}
            disabled={isLoading || !walletAddress}
            className={`w-full py-4 px-6 rounded-xl text-lg font-semibold transition-all duration-200 ${
              isLoading || !walletAddress
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 hover:shadow-lg transform hover:-translate-y-0.5'
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

          {/* What happens info */}
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-start">
              <Info className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
              <div className="text-sm text-blue-700">
                <strong>Was passiert:</strong> Wir laden alle deine Transaktionen von Moralis & anderen APIs, 
                berechnen grob die steuerlichen Auswirkungen nach deutschem Recht und erstellen einen PDF-Report.
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="text-red-400">❌</div>
              <div className="ml-3 text-red-700">{error}</div>
            </div>
          </div>
        )}

        {/* Results */}
        {taxData && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
              📊 Deine Steuer-Übersicht
            </h2>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white text-center">
                <div className="text-3xl font-bold mb-2">
                  {taxData.totalTransactions || taxData.transactions || 0}
                </div>
                <div className="text-purple-100">Transaktionen</div>
              </div>
              
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white text-center">
                <div className="text-3xl font-bold mb-2">
                  {taxData.events || taxData.taxableEvents || 0}
                </div>
                <div className="text-blue-100">Steuer-Events</div>
              </div>
              
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white text-center">
                <div className="text-3xl font-bold mb-2">
                  {formatCurrency(taxData.totalGains || taxData.gains || 0)}
                </div>
                <div className="text-green-100">Gesamte Gewinne</div>
              </div>
              
              <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white text-center">
                <div className="text-3xl font-bold mb-2">
                  {formatCurrency(taxData.totalTax || taxData.tax || 0)}
                </div>
                <div className="text-red-100">Grobe Steuerlast</div>
              </div>
            </div>

            {/* Events Table */}
            {taxData.taxEvents && taxData.taxEvents.length > 0 && (
              <div className="overflow-x-auto">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">
                  📋 Steuerpflichtige Ereignisse (Top 10)
                </h3>
                <table className="w-full bg-white rounded-lg overflow-hidden shadow-lg">
                  <thead className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                    <tr>
                      <th className="px-4 py-3 text-left">Datum</th>
                      <th className="px-4 py-3 text-left">Token</th>
                      <th className="px-4 py-3 text-left">Typ</th>
                      <th className="px-4 py-3 text-left">Wert (EUR)</th>
                      <th className="px-4 py-3 text-left">Steuer (EUR)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {taxData.taxEvents.slice(0, 10).map((event, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                        <td className="px-4 py-3 text-sm">
                          {event.date || new Date().toLocaleDateString('de-DE')}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-purple-600">
                          {event.token || 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {event.type || 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {formatCurrency(event.valueEUR || event.value || 0)}
                        </td>
                        <td className="px-4 py-3 text-sm font-bold">
                          {formatCurrency(event.tax || 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Download Info */}
            <div className="mt-6 p-4 bg-green-50 rounded-lg text-center">
              <div className="text-green-700">
                ✅ <strong>PDF wurde automatisch heruntergeladen!</strong><br/>
                Schau in deinen Downloads-Ordner.
              </div>
            </div>
          </div>
        )}

        {/* Bottom Disclaimer */}
        <div className="mt-8 text-center text-purple-200 text-sm">
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