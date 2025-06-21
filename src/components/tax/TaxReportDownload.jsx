/**
 * 🇩🇪 TAX REPORT DOWNLOAD COMPONENT
 * 
 * Einfache Download-Komponente für Steuerreports
 * Verwendet die neue german-tax-report API mit 300k Transaktionen
 */

import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const TaxReportDownload = ({ walletAddress }) => {
  const { user } = useAuth();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const handleDownload = async () => {
    if (!walletAddress) {
      setError('Bitte geben Sie eine Wallet-Adresse ein');
      return;
    }

    if (!user?.id) {
      setError('Sie müssen angemeldet sein');
      return;
    }

    setIsDownloading(true);
    setError(null);
    setSuccess(null);

    try {
      console.log('📥 Starte Tax Report Download...');
      
      // Verwende die neue german-tax-report API
      const response = await fetch('/api/german-tax-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        body: JSON.stringify({
          address: walletAddress,
          limit: 300000,
          format: 'pdf',
          requestToken: Date.now().toString()
        }),
        cache: 'no-cache'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Download fehlgeschlagen');
      }

      const data = await response.json();
      
      if (!data.success || !data.taxReport) {
        throw new Error('Keine Steuerdaten erhalten');
      }

      // HTML-Report generieren
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0];
      const walletShort = walletAddress.slice(0, 8);
      
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>PulseManager Steuerreport ${selectedYear}</title>
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
            <h1>🇩🇪 PulseManager Steuerreport ${selectedYear}</h1>
            <p>Wallet: ${walletAddress}</p>
            <p>Generiert am: ${today.toLocaleDateString('de-DE')}</p>
          </div>
          
          <div class="section">
            <h2>📊 Steuer-Übersicht</h2>
            <div class="stats">
              <div class="stat">
                <h3>${data.taxReport.summary?.totalTransactions || 0}</h3>
                <p>Gesamt Transaktionen</p>
              </div>
              <div class="stat">
                <h3>${data.taxReport.summary?.pulsechainCount || 0}</h3>
                <p>PulseChain</p>
              </div>
              <div class="stat">
                <h3>${data.taxReport.summary?.ethereumCount || 0}</h3>
                <p>Ethereum</p>
              </div>
              <div class="stat">
                <h3>${data.taxReport.summary?.roiCount || 0}</h3>
                <p>Steuer-Events</p>
              </div>
            </div>
          </div>
          
          <div class="section">
            <h2>📋 Transaktionen (${data.taxReport.transactions.length})</h2>
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
                ${data.taxReport.transactions.map((tx, index) => {
                  const date = tx.timestamp ? new Date(tx.timestamp).toLocaleDateString('de-DE') : 'N/A';
                  const chain = tx.sourceChainShort || (tx.sourceChain === 'Ethereum' ? 'ETH' : tx.sourceChain === 'PulseChain' ? 'PLS' : 'UNK');
                  const token = tx.tokenSymbol || 'N/A';
                  const direction = tx.directionIcon || (tx.direction === 'in' ? '📥 IN' : '📤 OUT');
                  const value = tx.formattedValue || (tx.value ? (Number(parseFloat(tx.value) / Math.pow(10, tx.tokenDecimal || 18)) || 0).toFixed(6) : '0');
                  return `
                    <tr>
                      <td>${date}</td>
                      <td>${chain}</td>
                      <td>${token}</td>
                      <td>${tx.taxCategory || 'N/A'}</td>
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

      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `PulseManager_Steuerreport_${selectedYear}_${walletShort}_${dateStr}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      setSuccess(`Steuerreport ${selectedYear} erfolgreich heruntergeladen!`);
      console.log('✅ Tax Report Download erfolgreich');

    } catch (error) {
      console.error('❌ Tax Report Download Error:', error);
      setError(`Download fehlgeschlagen: ${error.message}`);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-md mx-auto">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          📄 Steuerreport Download
        </h3>
        <p className="text-gray-600 text-sm">
          Generieren Sie einen HTML-Steuerreport für Ihre Krypto-Transaktionen
        </p>
      </div>

      <div className="space-y-4">
        {/* Wallet Adresse */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Wallet-Adresse
          </label>
          <input
            type="text"
            value={walletAddress || ''}
            readOnly
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
            placeholder="0x..."
          />
        </div>

        {/* Jahr Auswahl */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Steuerjahr
          </label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {years.map(year => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        {/* Download Button */}
        <button
          onClick={handleDownload}
          disabled={isDownloading || !walletAddress}
          className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
            isDownloading || !walletAddress
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500'
          }`}
        >
          {isDownloading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generiere HTML...
            </span>
          ) : (
            '📥 Steuerreport herunterladen'
          )}
        </button>

        {/* Status Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-md p-3">
            <p className="text-green-700 text-sm">{success}</p>
          </div>
        )}

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <p className="text-blue-700 text-xs">
            <strong>ℹ️ Hinweis:</strong> Dieser Steuerreport dient nur zu Informationszwecken. 
            Für Ihre finale Steuererklärung konsultieren Sie bitte einen qualifizierten Steuerberater.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TaxReportDownload; 