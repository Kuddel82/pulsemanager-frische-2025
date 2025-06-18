/**
 * 🇩🇪 TAX REPORT DOWNLOAD COMPONENT
 * 
 * Einfache Download-Komponente für Steuerreports
 * Verwendet die funktionierende export-tax-report API
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
      
      // Verwende die funktionierende export-tax-report API
      const response = await fetch(
        `/api/export-tax-report?userId=${user.id}&wallet=${walletAddress}&year=${selectedYear}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Download fehlgeschlagen');
      }

      // HTML-Download (statt PDF)
      const htmlContent = await response.text();
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Steuerreport_${selectedYear}_${walletAddress.substring(0, 8)}.html`;
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