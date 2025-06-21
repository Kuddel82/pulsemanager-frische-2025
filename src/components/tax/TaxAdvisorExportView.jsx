import React, { useState, useEffect } from 'react';
import GermanTaxDataExporter from '../../services/GermanTaxDataExporter';

const TaxAdvisorExportView = ({ taxData }) => {
  const [exportData, setExportData] = useState(null);
  const [loading, setLoading] = useState(false);

  // WORKING DOWNLOAD FUNCTIONS
  const downloadCSV = (csvData) => {
    try {
      if (!csvData) {
        alert('CSV Daten nicht verfügbar');
        return;
      }
      
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.href = url;
      link.download = `tax_advisor_export_${new Date().toISOString().split('T')[0]}.csv`;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      console.log('✅ CSV Download erfolgreich');
    } catch (error) {
      console.error('❌ CSV Download Fehler:', error);
      alert('CSV Download fehlgeschlagen');
    }
  };

  const downloadHTML = (htmlData) => {
    try {
      if (!htmlData) {
        alert('HTML Daten nicht verfügbar');
        return;
      }
      
      const blob = new Blob([htmlData], { type: 'text/html;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.href = url;
      link.download = `tax_advisor_report_${new Date().toISOString().split('T')[0]}.html`;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      console.log('✅ HTML Download erfolgreich');
    } catch (error) {
      console.error('❌ HTML Download Fehler:', error);
      alert('HTML Download fehlgeschlagen');
    }
  };

  // LOAD EXPORT DATA
  const loadExportData = async () => {
    if (!taxData?.transactions?.length) return;
    
    setLoading(true);
    try {
      // Use SAME transactions as main report to avoid data discrepancies
      const exporter = new GermanTaxDataExporter();
      const result = exporter.createTaxAdvisorDataExport(taxData.transactions);
      setExportData(result);
    } catch (error) {
      console.error('Export generation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // AUTO-LOAD on mount
  useEffect(() => {
    loadExportData();
  }, [taxData]);

  if (loading) {
    return <div className="text-center py-8">Lade Export-Daten...</div>;
  }

  if (!exportData) {
    return <div className="text-center py-8">Export-Daten nicht verfügbar</div>;
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mt-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">🔒 SICHERER TAX ADVISOR EXPORT - KEINE STEUERBERECHNUNGEN</h3>
        
        <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-4 mb-4">
          <h4 className="font-semibold text-yellow-800 mb-2">⚠️ WICHTIGER HINWEIS</h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• <strong>KEINE STEUERBERECHNUNGEN</strong> - Nur Datensammlung für Steuerberater</li>
            <li>• <strong>DSGVO-konform</strong> - Keine steuerliche Beratung</li>
            <li>• <strong>Professionelle Grundlage</strong> - Für qualifizierte Steuerberater</li>
            <li>• <strong>Export-Formate:</strong> CSV, HTML</li>
          </ul>
        </div>

        <div className="bg-red-100 border border-red-300 rounded-lg p-4 mb-6">
          <p className="text-sm text-red-700">
            <strong>⚠️ WICHTIGER HINWEIS:</strong> Dies ist KEINE Steuerberatung! 
            Diese Datensammlung dient nur als Grundlage für Ihren Steuerberater. 
            Für finale Steuerberechnungen wenden Sie sich an einen qualifizierten Steuerberater.
          </p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <h4 className="font-semibold text-green-800 mb-3">Tax Advisor Export Status</h4>
          <p className="text-green-700 mb-4">Export erfolgreich erstellt!</p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{exportData.summary.totalTransactions}</div>
              <div className="text-sm text-gray-600">Transaktionen</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{exportData.summary.categories.purchases}</div>
              <div className="text-sm text-gray-600">Käufe</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{exportData.summary.categories.sales}</div>
              <div className="text-sm text-gray-600">Verkäufe</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{exportData.summary.categories.roiEvents}</div>
              <div className="text-sm text-gray-600">ROI Events</div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">€{exportData.summary.totalValues.purchaseValueEUR.toFixed(2)}</div>
              <div className="text-sm text-gray-600">Gesamtwert Käufe</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-red-600">€{exportData.summary.totalValues.salesValueEUR.toFixed(2)}</div>
              <div className="text-sm text-gray-600">Gesamtwert Verkäufe</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-purple-600">€{exportData.summary.totalValues.roiValueEUR.toFixed(2)}</div>
              <div className="text-sm text-gray-600">Gesamtwert ROI Events</div>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h4 className="font-semibold mb-3">Export Downloads</h4>
          <div className="flex gap-4 mb-4">
            <button 
              onClick={() => downloadCSV(exportData.exports.csv)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              📊 CSV Download
            </button>
            
            <button 
              onClick={() => downloadHTML(exportData.exports.html)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              🌐 HTML Report
            </button>
          </div>
          <p className="text-sm text-gray-600">
            Alle Exporte enthalten strukturierte Daten für Ihren Steuerberater. Keine Steuerberechnungen enthalten.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-green-800 mb-2">✅ Features</h4>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• FIFO Haltefrist-Berechnung (informativ)</li>
              <li>• Transaktions-Kategorisierung</li>
              <li>• ROI Event Markierung</li>
              <li>• Export-Formate: CSV, HTML</li>
              <li>• Professionelle Steuerberater-Grundlage</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Limitations</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Nur eine Wallet analysiert</li>
              <li>• Keine finalen Steuerberechnungen</li>
              <li>• Andere Trades/Wallets nicht berücksichtigt</li>
              <li>• Professionelle Steuerberatung empfohlen</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 text-center">
          <button 
            onClick={loadExportData}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Export neu laden
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaxAdvisorExportView; 