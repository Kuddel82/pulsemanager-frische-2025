// 📄 TAX REPORT VIEW - Vereinfacht mit CentralDataService
// DSGVO-konforme Steuerberichte für PulseChain - Datum: 2025-01-08 REPARATUR

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Download, 
  Calendar, 
  DollarSign, 
  ExternalLink,
  AlertCircle,
  RefreshCw,
  Filter
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import CentralDataService from '@/services/CentralDataService';

const TaxReportView = () => {
  const { user } = useAuth();
  const [portfolioData, setPortfolioData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');

  // Filter States
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0], // Start of current year
    endDate: new Date().toISOString().split('T')[0], // Today
    showOnlyROI: true
  });

  // Portfolio laden
  const loadTaxData = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    setError(null);
    setStatusMessage('📄 Lade Steuerdaten...');
    
    try {
      console.log('📄 TAX REPORT: Loading tax data with CentralDataService');
      
      const data = await CentralDataService.loadCompletePortfolio(user.id);
      
      if (data.isLoaded) {
        setPortfolioData(data);
        setStatusMessage(`✅ Steuerdaten geladen: ${data.taxTransactions.length} Transaktionen, $${data.taxSummary.totalIncome.toFixed(2)} Einkommen`);
        console.log('✅ TAX REPORT: Data loaded successfully');
      } else {
        setError(data.error);
        setStatusMessage(`❌ Fehler: ${data.error}`);
      }
      
    } catch (error) {
      console.error('💥 TAX REPORT: Error loading data:', error);
      setError(error.message);
      setStatusMessage(`💥 Fehler beim Laden: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // CSV Export generieren
  const exportTaxCSV = async () => {
    if (!portfolioData?.taxTransactions) return;
    
    setExporting(true);
    try {
      // Filtere Transaktionen basierend auf Einstellungen
      const filteredTransactions = portfolioData.taxTransactions.filter(tx => {
        const txDate = new Date(tx.blockTimestamp);
        const startDate = new Date(filters.startDate);
        const endDate = new Date(filters.endDate);
        
        if (txDate < startDate || txDate > endDate) return false;
        if (filters.showOnlyROI && !tx.isROITransaction) return false;
        
        return true;
      });
      
      const csv = CentralDataService.generateTaxCSV(filteredTransactions);
      
      // Download CSV
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `PulseManager_Steuerreport_${new Date().getFullYear()}.csv`;
      link.click();
      
      setStatusMessage(`✅ CSV Export erfolgreich: ${filteredTransactions.length} Transaktionen`);
      setTimeout(() => setStatusMessage(''), 3000);
      
    } catch (error) {
      console.error('❌ CSV Export failed:', error);
      setStatusMessage(`❌ Export Fehler: ${error.message}`);
    } finally {
      setExporting(false);
    }
  };

  // Initiales Laden
  useEffect(() => {
    loadTaxData();
  }, [user?.id]);

  // Format Funktionen
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('de-DE');
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('de-DE');
  };

  // Gefilterte Transaktionen berechnen
  const getFilteredTransactions = () => {
    if (!portfolioData?.taxTransactions) return [];
    
    return portfolioData.taxTransactions.filter(tx => {
      const txDate = new Date(tx.blockTimestamp);
      const startDate = new Date(filters.startDate);
      const endDate = new Date(filters.endDate);
      
      if (txDate < startDate || txDate > endDate) return false;
      if (filters.showOnlyROI && !tx.isROITransaction) return false;
      
      return true;
    });
  };

  const filteredTransactions = getFilteredTransactions();

  // Steuer-Zusammenfassung berechnen
  const getTaxSummary = () => {
    if (!filteredTransactions.length) return { totalIncome: 0, totalTransactions: 0, uniqueTokens: 0 };
    
    const totalIncome = filteredTransactions
      .filter(tx => tx.isROITransaction)
      .reduce((sum, tx) => sum + (tx.valueUSD || 0), 0);
    
    const uniqueTokens = new Set(filteredTransactions.map(tx => tx.tokenSymbol)).size;
    
    return {
      totalIncome,
      totalTransactions: filteredTransactions.length,
      uniqueTokens
    };
  };

  const taxSummary = getTaxSummary();

  // Fallback für leere Daten
  if (!user?.id) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Anmeldung erforderlich</h3>
            <p className="text-gray-600">Bitte melden Sie sich an, um Ihre Steuerberichte zu erstellen.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header mit Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Steuerreport</h1>
          <p className="text-gray-600">DSGVO-konforme Steuerberichte für deutsche Steuererklärung</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            onClick={loadTaxData}
            disabled={loading}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Lade...' : 'Aktualisieren'}
          </Button>
          
          <Button 
            onClick={exportTaxCSV}
            disabled={exporting || !filteredTransactions.length}
            className="flex items-center gap-2"
          >
            <Download className={`h-4 w-4 ${exporting ? 'animate-spin' : ''}`} />
            {exporting ? 'Exportiere...' : 'CSV Export'}
          </Button>
        </div>
      </div>

      {/* Status Message */}
      {statusMessage && (
        <Card>
          <CardContent className="p-4">
            <p className="text-sm font-mono">{statusMessage}</p>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-4 w-4" />
              <p className="font-medium">Fehler beim Laden der Steuerdaten</p>
            </div>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Filter Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter & Einstellungen
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Startdatum</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                className="w-full p-2 border rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Enddatum</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                className="w-full p-2 border rounded-md"
              />
            </div>
            
            <div className="flex items-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.showOnlyROI}
                  onChange={(e) => setFilters({...filters, showOnlyROI: e.target.checked})}
                  className="rounded"
                />
                <span className="text-sm font-medium">Nur ROI-Transaktionen</span>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tax Summary Cards */}
      {portfolioData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Total Taxable Income */}
          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Steuerpflichtiges Einkommen</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(taxSummary.totalIncome)}
                  </p>
                  <p className="text-green-200 text-sm">
                    {filters.startDate} - {filters.endDate}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          {/* Total Transactions */}
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Transaktionen</p>
                  <p className="text-2xl font-bold">
                    {taxSummary.totalTransactions}
                  </p>
                  <p className="text-blue-200 text-sm">
                    Im ausgewählten Zeitraum
                  </p>
                </div>
                <FileText className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          {/* Unique Tokens */}
          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Verschiedene Token</p>
                  <p className="text-2xl font-bold">
                    {taxSummary.uniqueTokens}
                  </p>
                  <p className="text-purple-200 text-sm">
                    Token-Arten
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Transaction Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Steuerrelevante Transaktionen
            <Badge variant="outline" className="ml-2">
              {filteredTransactions.length} Transaktionen
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTransactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 font-medium">Datum</th>
                    <th className="text-left p-2 font-medium">Token</th>
                    <th className="text-right p-2 font-medium">Menge</th>
                    <th className="text-right p-2 font-medium">Wert (USD)</th>
                    <th className="text-center p-2 font-medium">Kategorie</th>
                    <th className="text-center p-2 font-medium">ROI</th>
                    <th className="text-center p-2 font-medium">Links</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.slice(0, 100).map((tx, index) => (
                    <tr key={`${tx.txHash}-${index}`} className="border-b hover:bg-gray-50">
                      <td className="p-2 text-sm">
                        {formatDate(tx.blockTimestamp)}
                        <div className="text-xs text-gray-500">
                          {new Date(tx.blockTimestamp).toLocaleTimeString('de-DE')}
                        </div>
                      </td>
                      
                      <td className="p-2">
                        <div className="font-medium">{tx.tokenSymbol}</div>
                        <div className="text-sm text-gray-600">
                          {tx.tokenName || 'Unknown Token'}
                        </div>
                      </td>
                      
                      <td className="p-2 text-right">
                        <div className="font-mono">
                          +{tx.amount.toFixed(6)}
                        </div>
                      </td>
                      
                      <td className="p-2 text-right">
                        <div className="font-semibold text-green-600">
                          {formatCurrency(tx.valueUSD)}
                        </div>
                      </td>
                      
                      <td className="p-2 text-center">
                        <Badge variant={tx.taxCategory === 'income' ? 'default' : 'secondary'}>
                          {tx.taxCategory === 'income' ? 'Einkommen' : 'Transfer'}
                        </Badge>
                      </td>
                      
                      <td className="p-2 text-center">
                        {tx.isROITransaction ? (
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            ROI
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            Normal
                          </Badge>
                        )}
                      </td>
                      
                      <td className="p-2 text-center">
                        <div className="flex justify-center gap-1">
                          <a 
                            href={tx.explorerUrl}
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:text-blue-700"
                            title="Auf PulseChain Scan anzeigen"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                          {tx.dexScreenerUrl && (
                            <a 
                              href={tx.dexScreenerUrl}
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-green-500 hover:text-green-700"
                              title="Auf DexScreener anzeigen"
                            >
                              <DollarSign className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredTransactions.length > 100 && (
                <div className="mt-4 text-center text-sm text-gray-500">
                  Zeige die ersten 100 von {filteredTransactions.length} Transaktionen. 
                  Exportieren Sie alle Daten als CSV für die vollständige Liste.
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                Keine Transaktionen gefunden
              </h3>
              <p className="text-gray-500 mb-4">
                {portfolioData ? 
                  'Keine Transaktionen im ausgewählten Zeitraum oder mit den aktuellen Filtern.' :
                  'Laden Sie zuerst Ihre Portfolio-Daten, um Steuerberichte zu erstellen.'
                }
              </p>
              {!portfolioData && (
                <Button onClick={loadTaxData}>
                  Daten laden
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* German Tax Information */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-800">💡 Deutsche Steuerhinweise</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-blue-700 space-y-2 text-sm">
            <p><strong>§ 22 EStG (Sonstige Einkünfte):</strong> ROI-Transaktionen und Staking-Belohnungen sind als sonstige Einkünfte zu versteuern.</p>
            <p><strong>Dokumentation:</strong> Alle Transaktionen werden mit Datum, Uhrzeit, Betrag und Blockchain-Nachweis dokumentiert.</p>
            <p><strong>DSGVO-Konformität:</strong> Alle Daten werden lokal verarbeitet und können jederzeit exportiert oder gelöscht werden.</p>
            <p><strong>Disclaimer:</strong> Diese Software ersetzt keine professionelle Steuerberatung. Konsultieren Sie einen Steuerberater für individuelle Fragen.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TaxReportView;