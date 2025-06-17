/**
 * 🇩🇪 TAX EXPORT INTERFACE
 * 
 * Spezialisierte Export-Komponente für deutsche Steuer-Reports
 * - PDF Steuer-Reports
 * - CSV für Steuerberater
 * - ELSTER XML für Finanzamt
 * - Bulk Export für mehrere Wallets
 */

import React, { useState } from 'react';
import { Download, FileText, Database, Receipt, Calendar, Settings, CheckCircle, AlertCircle, Loader2, User, Building2 } from 'lucide-react';

const TaxExportInterface = ({ walletAddress, taxData }) => {
  const [activeTab, setActiveTab] = useState('single');
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState(null);
  const [progress, setProgress] = useState(0);

  // Single Export State
  const [singleExport, setSingleExport] = useState({
    format: 'pdf',
    walletAddress: walletAddress || '',
    taxYear: new Date().getFullYear(),
    options: {
      includeTransactions: true,
      includeLegalNotices: true,
      language: 'de',
      format: 'detailed'
    }
  });

  // Bulk Export State
  const [bulkExport, setBulkExport] = useState({
    format: 'pdf',
    wallets: walletAddress ? [walletAddress] : [],
    walletInput: '',
    taxYear: new Date().getFullYear(),
    options: {
      includeTransactions: true,
      includeLegalNotices: true,
      language: 'de',
      format: 'detailed',
      zipOutput: true
    }
  });

  // ELSTER Export State
  const [elsterExport, setElsterExport] = useState({
    walletAddress: walletAddress || '',
    taxYear: new Date().getFullYear(),
    taxpayer: {
      name: '',
      street: '',
      zipCode: '',
      city: '',
      taxNumber: ''
    }
  });

  const formats = [
    { id: 'pdf', name: 'PDF Report', icon: FileText, color: 'text-red-500', description: 'Vollständiger Steuer-Report' },
    { id: 'csv', name: 'CSV Export', icon: Database, color: 'text-green-500', description: 'Für Excel/Steuerberater' },
    { id: 'elster', name: 'ELSTER XML', icon: Building2, color: 'text-blue-500', description: 'Für Finanzamt-Abgabe' }
  ];

  const taxYears = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i);

  const handleSingleExport = async () => {
    if (!singleExport.walletAddress.trim()) {
      setExportStatus({ type: 'error', message: 'Bitte geben Sie eine Wallet-Adresse ein' });
      return;
    }

    setIsExporting(true);
    setProgress(0);
    setExportStatus(null);

    try {
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 300);

      let endpoint = '';
      switch (singleExport.format) {
        case 'pdf':
          endpoint = '/api/export-pdf';
          break;
        case 'csv':
          endpoint = '/api/export-csv';
          break;
        case 'elster':
          endpoint = '/api/export-elster';
          break;
        default:
          endpoint = '/api/export-pdf';
      }

      const response = await fetch(`${endpoint}?wallet=${singleExport.walletAddress}&year=${singleExport.taxYear}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (response.ok) {
        const result = await response.json();
        
        if (result.success && result.data) {
          if (result.data.downloadUrl) {
            const a = document.createElement('a');
            a.href = result.data.downloadUrl;
            a.download = result.data.filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          }

          setExportStatus({ 
            type: 'success', 
            message: `${singleExport.format.toUpperCase()} Export erfolgreich!` 
          });
        } else {
          throw new Error(result.error || 'Export fehlgeschlagen');
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Export fehlgeschlagen');
      }
    } catch (error) {
      setExportStatus({ type: 'error', message: 'Export fehlgeschlagen: ' + error.message });
    } finally {
      setIsExporting(false);
      setTimeout(() => setProgress(0), 2000);
    }
  };

  const handleBulkExport = async () => {
    if (bulkExport.wallets.length === 0) {
      setExportStatus({ type: 'error', message: 'Bitte fügen Sie mindestens eine Wallet-Adresse hinzu' });
      return;
    }

    setIsExporting(true);
    setProgress(0);
    setExportStatus(null);

    try {
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 5, 90));
      }, 500);

      // Sequentiell alle Wallets exportieren
      const results = [];
      for (const wallet of bulkExport.wallets) {
        const endpoint = bulkExport.format === 'pdf' ? '/api/export-pdf' : '/api/export-csv';
        const response = await fetch(`${endpoint}?wallet=${wallet}&year=${bulkExport.taxYear}`);
        
        if (response.ok) {
          const result = await response.json();
          results.push({ wallet, success: true, data: result.data });
        } else {
          results.push({ wallet, success: false, error: 'Export fehlgeschlagen' });
        }
      }

      clearInterval(progressInterval);
      setProgress(100);

      const successCount = results.filter(r => r.success).length;
      setExportStatus({ 
        type: successCount > 0 ? 'success' : 'error', 
        message: `${successCount}/${bulkExport.wallets.length} Wallets erfolgreich exportiert!` 
      });

      // Download der ersten erfolgreichen Datei als Beispiel
      const firstSuccess = results.find(r => r.success);
      if (firstSuccess && firstSuccess.data.downloadUrl) {
        const a = document.createElement('a');
        a.href = firstSuccess.data.downloadUrl;
        a.download = firstSuccess.data.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }

    } catch (error) {
      setExportStatus({ type: 'error', message: 'Bulk Export fehlgeschlagen: ' + error.message });
    } finally {
      setIsExporting(false);
      setTimeout(() => setProgress(0), 2000);
    }
  };

  const handleElsterExport = async () => {
    if (!elsterExport.walletAddress.trim() || !elsterExport.taxpayer.name.trim()) {
      setExportStatus({ type: 'error', message: 'Bitte füllen Sie alle Pflichtfelder aus' });
      return;
    }

    setIsExporting(true);
    setProgress(0);
    setExportStatus(null);

    try {
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 8, 90));
      }, 400);

      const response = await fetch('/api/export-elster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet: elsterExport.walletAddress,
          year: elsterExport.taxYear,
          taxpayer: elsterExport.taxpayer
        })
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (response.ok) {
        const result = await response.json();
        
        if (result.success && result.data) {
          // ELSTER XML Download
          if (result.data.downloadUrl) {
            const a = document.createElement('a');
            a.href = result.data.downloadUrl;
            a.download = result.data.filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          }

          setExportStatus({ 
            type: 'success', 
            message: `ELSTER XML erfolgreich erstellt! ⚠️ ${result.data.warning}` 
          });
        } else {
          throw new Error(result.error || 'ELSTER Export fehlgeschlagen');
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'ELSTER Export fehlgeschlagen');
      }
    } catch (error) {
      setExportStatus({ type: 'error', message: 'ELSTER Export fehlgeschlagen: ' + error.message });
    } finally {
      setIsExporting(false);
      setTimeout(() => setProgress(0), 2000);
    }
  };

  const addWalletToBulk = () => {
    const wallet = bulkExport.walletInput.trim();
    if (wallet && /^0x[a-fA-F0-9]{40}$/.test(wallet) && !bulkExport.wallets.includes(wallet)) {
      setBulkExport(prev => ({
        ...prev,
        wallets: [...prev.wallets, wallet],
        walletInput: ''
      }));
    }
  };

  const removeWalletFromBulk = (index) => {
    setBulkExport(prev => ({
      ...prev,
      wallets: prev.wallets.filter((_, i) => i !== index)
    }));
  };

  const FormatSelector = ({ value, onChange, className = "" }) => (
    <div className={`grid grid-cols-3 gap-3 ${className}`}>
      {formats.map(format => (
        <button
          key={format.id}
          onClick={() => onChange(format.id)}
          className={`p-4 rounded-lg border-2 transition-all duration-200 flex flex-col items-center gap-3 ${
            value === format.id 
              ? 'border-blue-500 bg-blue-50 text-blue-700' 
              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
          }`}
        >
          <format.icon className={`w-8 h-8 ${format.color}`} />
          <div className="text-center">
            <div className="font-medium">{format.name}</div>
            <div className="text-xs text-gray-500 mt-1">{format.description}</div>
          </div>
        </button>
      ))}
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
          <Receipt className="w-8 h-8 text-blue-600" />
          🇩🇪 Deutsches Steuer-Export System
        </h1>
        <p className="text-gray-600">Professionelle Export-Tools für deutsche Krypto-Steuererklärungen nach EStG §22 & §23</p>
      </div>

      {/* Progress Bar */}
      {isExporting && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-700 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Steuer-Export läuft...
            </span>
            <span className="text-sm text-blue-600">{progress}%</span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Status Messages */}
      {exportStatus && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
          exportStatus.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {exportStatus.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span>{exportStatus.message}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'single', name: 'Einzelner Export', icon: FileText },
              { id: 'bulk', name: 'Bulk Export', icon: Database },
              { id: 'elster', name: 'ELSTER Export', icon: Building2 }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Single Export Tab */}
      {activeTab === 'single' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Wallet-Adresse</label>
              <input
                type="text"
                value={singleExport.walletAddress}
                onChange={(e) => setSingleExport(prev => ({ ...prev, walletAddress: e.target.value }))}
                placeholder="0x742d35Cc6634C0532925a3b8D85E2C5b0b6c6F98"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Steuerjahr</label>
              <select
                value={singleExport.taxYear}
                onChange={(e) => setSingleExport(prev => ({ ...prev, taxYear: parseInt(e.target.value) }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {taxYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Export-Format</label>
            <FormatSelector 
              value={singleExport.format}
              onChange={(format) => setSingleExport(prev => ({ ...prev, format }))}
            />
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 flex items-center gap-2 mb-3">
              <Settings className="w-4 h-4" />
              Export-Optionen
            </h4>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={singleExport.options.includeTransactions}
                  onChange={(e) => setSingleExport(prev => ({ 
                    ...prev, 
                    options: { ...prev.options, includeTransactions: e.target.checked }
                  }))}
                  className="mr-2 rounded"
                />
                <span className="text-sm text-gray-700">Transaktions-Details einbinden</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={singleExport.options.includeLegalNotices}
                  onChange={(e) => setSingleExport(prev => ({ 
                    ...prev, 
                    options: { ...prev.options, includeLegalNotices: e.target.checked }
                  }))}
                  className="mr-2 rounded"
                />
                <span className="text-sm text-gray-700">Rechtliche Hinweise einbinden</span>
              </label>
            </div>
          </div>

          <button
            onClick={handleSingleExport}
            disabled={isExporting || !singleExport.walletAddress.trim()}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
          >
            {isExporting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Download className="w-5 h-5" />
            )}
            {isExporting ? 'Exportiere...' : `${singleExport.format.toUpperCase()} Steuer-Report erstellen`}
          </button>
        </div>
      )}

      {/* Bulk Export Tab */}
      {activeTab === 'bulk' && (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Wallet-Adresse hinzufügen</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={bulkExport.walletInput}
                  onChange={(e) => setBulkExport(prev => ({ ...prev, walletInput: e.target.value }))}
                  onKeyPress={(e) => e.key === 'Enter' && addWalletToBulk()}
                  placeholder="0x742d35Cc6634C0532925a3b8D85E2C5b0b6c6F98"
                  className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                />
                <button
                  onClick={addWalletToBulk}
                  className="px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Hinzufügen
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Steuerjahr</label>
              <select
                value={bulkExport.taxYear}
                onChange={(e) => setBulkExport(prev => ({ ...prev, taxYear: parseInt(e.target.value) }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {taxYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>

          {bulkExport.wallets.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Wallet-Adressen ({bulkExport.wallets.length})
              </label>
              <div className="max-h-40 overflow-y-auto space-y-1 p-3 bg-gray-50 rounded-lg">
                {bulkExport.wallets.map((wallet, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                    <span className="text-sm font-mono truncate">{wallet}</span>
                    <button
                      onClick={() => removeWalletFromBulk(index)}
                      className="text-red-500 hover:text-red-700 ml-2 px-2"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Export-Format</label>
            <FormatSelector 
              value={bulkExport.format}
              onChange={(format) => setBulkExport(prev => ({ ...prev, format }))}
            />
          </div>

          <button
            onClick={handleBulkExport}
            disabled={isExporting || bulkExport.wallets.length === 0}
            className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
          >
            {isExporting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Download className="w-5 h-5" />
            )}
            {isExporting ? 'Exportiere...' : `${bulkExport.wallets.length} Wallets exportieren`}
          </button>
        </div>
      )}

      {/* ELSTER Export Tab */}
      {activeTab === 'elster' && (
        <div className="space-y-6">
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-700">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">Wichtiger Hinweis</span>
            </div>
            <p className="text-sm text-yellow-600 mt-1">
              ELSTER XML ist nur für Testzwecke. Konsultieren Sie vor der Abgabe einen Steuerberater.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Wallet-Adresse</label>
              <input
                type="text"
                value={elsterExport.walletAddress}
                onChange={(e) => setElsterExport(prev => ({ ...prev, walletAddress: e.target.value }))}
                placeholder="0x742d35Cc6634C0532925a3b8D85E2C5b0b6c6F98"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Steuerjahr</label>
              <select
                value={elsterExport.taxYear}
                onChange={(e) => setElsterExport(prev => ({ ...prev, taxYear: parseInt(e.target.value) }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {taxYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 flex items-center gap-2 mb-3">
              <User className="w-4 h-4" />
              Steuerpflichtige/r
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={elsterExport.taxpayer.name}
                  onChange={(e) => setElsterExport(prev => ({ 
                    ...prev, 
                    taxpayer: { ...prev.taxpayer, name: e.target.value }
                  }))}
                  placeholder="Max Mustermann"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Steuernummer</label>
                <input
                  type="text"
                  value={elsterExport.taxpayer.taxNumber}
                  onChange={(e) => setElsterExport(prev => ({ 
                    ...prev, 
                    taxpayer: { ...prev.taxpayer, taxNumber: e.target.value }
                  }))}
                  placeholder="12345678901"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Straße</label>
                <input
                  type="text"
                  value={elsterExport.taxpayer.street}
                  onChange={(e) => setElsterExport(prev => ({ 
                    ...prev, 
                    taxpayer: { ...prev.taxpayer, street: e.target.value }
                  }))}
                  placeholder="Musterstraße 1"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">PLZ</label>
                  <input
                    type="text"
                    value={elsterExport.taxpayer.zipCode}
                    onChange={(e) => setElsterExport(prev => ({ 
                      ...prev, 
                      taxpayer: { ...prev.taxpayer, zipCode: e.target.value }
                    }))}
                    placeholder="12345"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ort</label>
                  <input
                    type="text"
                    value={elsterExport.taxpayer.city}
                    onChange={(e) => setElsterExport(prev => ({ 
                      ...prev, 
                      taxpayer: { ...prev.taxpayer, city: e.target.value }
                    }))}
                    placeholder="Musterstadt"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleElsterExport}
            disabled={isExporting || !elsterExport.walletAddress.trim() || !elsterExport.taxpayer.name.trim()}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
          >
            {isExporting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Building2 className="w-5 h-5" />
            )}
            {isExporting ? 'Erstelle ELSTER XML...' : 'ELSTER XML für Finanzamt erstellen'}
          </button>
        </div>
      )}
    </div>
  );
};

export default TaxExportInterface; 