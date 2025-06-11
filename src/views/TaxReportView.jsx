// 📄 TAX REPORT VIEW - Zeigt echte Steuerdaten von PulseChain
// Datum: 2025-01-08 - PHASE 3: ECHTE STEUERDATEN INTEGRATION

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  RefreshCw, 
  Download, 
  FileText,
  DollarSign,
  Calendar,
  AlertCircle,
  ExternalLink,
  TrendingUp,
  Eye,
  EyeOff,
  Filter,
  Database,
  Clock
} from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/utils';
import CentralDataService from '@/services/CentralDataService';
import { TaxService } from '@/services/TaxService';
import { useAuth } from '@/contexts/AuthContext';

const TaxReportView = () => {
  const { user } = useAuth();
  const [taxData, setTaxData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [showDebug, setShowDebug] = useState(false);
  const [filterCategory, setFilterCategory] = useState('all'); // all, taxable, purchases, sales
  const [downloadingCSV, setDownloadingCSV] = useState(false);
  const [cacheInfo, setCacheInfo] = useState(null);

  // 🚀 NEUER TAX SERVICE: Lade vollständige Transaktionshistorie
  const loadTaxData = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 TAX REPORT: Loading with new TaxService...');
      
      // 1. Lade User-Wallets
      const portfolioData = await CentralDataService.loadCompletePortfolio(user.id);
      
      if (portfolioData.error) {
        setError(portfolioData.error);
        return;
      }
      
      const wallets = portfolioData.wallets || [];
      
      if (wallets.length === 0) {
        setError('Keine Wallets gefunden. Fügen Sie zuerst Ihre Wallet-Adressen hinzu.');
        return;
      }
      
      // 2. NEUER TAX SERVICE: Unbegrenzte Transaktionen mit Caching
      const fullTaxData = await TaxService.fetchFullTransactionHistory(user.id, wallets);
      
      setTaxData(fullTaxData);
      setLastUpdate(new Date());
      setCacheInfo({
        totalLoaded: fullTaxData.allTransactions.length,
        taxable: fullTaxData.taxableTransactions.length,
        cacheHit: fullTaxData.fromCache || false
      });
      
      console.log('✅ TAX REPORT: Full data loaded via TaxService', {
        total: fullTaxData.allTransactions.length,
        taxable: fullTaxData.taxableTransactions.length,
        taxableIncomeUSD: fullTaxData.taxSummary.taxableIncomeUSD
      });
      
    } catch (err) {
      console.error('💥 TAX REPORT ERROR:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 📄 CSV Download mit neuem TaxService
  const downloadCSV = async () => {
    if (!taxData?.taxableTransactions) return;
    
    try {
      setDownloadingCSV(true);
      
      const csv = TaxService.generateTaxCSV(taxData);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `pulsemanager-steuerdaten-${new Date().getFullYear()}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log('✅ TAX CSV downloaded successfully');
    } catch (error) {
      console.error('💥 CSV download error:', error);
    } finally {
      setDownloadingCSV(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadTaxData();
  }, [user?.id]);

  // Auto-refresh every 10 minutes (less frequent for tax data)
  useEffect(() => {
    const interval = setInterval(loadTaxData, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user?.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="pulse-card p-8 text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-green-400 mx-auto mb-4" />
          <span className="text-lg pulse-text">Steuerdaten werden geladen...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black p-6">
        <div className="pulse-card max-w-lg mx-auto p-6 text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-400" />
          <h2 className="text-xl font-semibold mb-2 pulse-text">Fehler beim Laden der Steuerdaten</h2>
          <p className="pulse-text-secondary mb-4">{error}</p>
          <Button onClick={loadTaxData} className="bg-green-500 hover:bg-green-600">
            <RefreshCw className="h-4 w-4 mr-2" />
            Erneut versuchen
          </Button>
        </div>
      </div>
    );
  }

  if (!taxData) {
    return (
      <div className="min-h-screen bg-black p-6">
        <div className="pulse-card max-w-lg mx-auto p-6 text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 text-blue-400" />
          <h2 className="text-xl font-semibold mb-2 pulse-text">Keine Steuerdaten verfügbar</h2>
          <p className="pulse-text-secondary mb-4">
            Fügen Sie zuerst Ihre Wallet-Adressen hinzu um Transaktionsdaten zu laden.
          </p>
          <Button onClick={loadTaxData} className="bg-green-500 hover:bg-green-600">
            <RefreshCw className="h-4 w-4 mr-2" />
            Erneut laden
          </Button>
        </div>
      </div>
    );
  }

  // 🎯 Filter transactions by category (NEUES FORMAT)
  const getFilteredTransactions = () => {
    if (!taxData) return [];
    
    switch (filterCategory) {
      case 'all':
        return taxData.allTransactions || [];
      case 'taxable':
        return taxData.taxableTransactions || [];
      case 'purchases':
        return taxData.purchases || [];
      case 'sales':
        return taxData.sales || [];
      default:
        return taxData.allTransactions || [];
    }
  };

  // 📊 Get tax statistics from TaxService summary
  const getTaxStats = () => {
    if (!taxData?.taxSummary) {
      return {
        totalTransactions: 0,
        taxableTransactions: 0,
        taxableIncome: 0,
        purchases: 0,
        sales: 0
      };
    }
    
    const summary = taxData.taxSummary;
    
    return {
      totalTransactions: parseInt(summary.totalTransactions) || 0,
      taxableTransactions: parseInt(summary.taxableTransactionsCount) || 0,
      taxableIncome: parseFloat(summary.taxableIncomeUSD) || 0,
      purchases: parseFloat(summary.purchasesUSD) || 0,
      sales: parseFloat(summary.salesUSD) || 0,
      purchasesCount: parseInt(summary.purchasesCount) || 0,
      salesCount: parseInt(summary.salesCount) || 0
    };
  };

  const filteredTransactions = getFilteredTransactions();
  const taxStats = getTaxStats();

  const statsCards = [
    {
      title: 'Gesamte Transaktionen',
      value: taxStats.totalTransactions.toString(),
      subtitle: cacheInfo ? `${cacheInfo.totalLoaded} geladen` : '',
      icon: FileText,
      color: 'bg-blue-500'
    },
    {
      title: 'Steuerpflichtige',
      value: taxStats.taxableTransactions.toString(),
      subtitle: 'ROI/Minting',
      icon: AlertCircle,
      color: 'bg-orange-500'
    },
    {
      title: 'Steuerpflichtiges Einkommen',
      value: formatCurrency(taxStats.taxableIncome),
      subtitle: '§ 22 EStG',
      icon: DollarSign,
      color: 'bg-green-500'
    },
    {
      title: 'Cache Status',
      value: cacheInfo?.cacheHit ? 'Cache Hit' : 'Fresh Load',
      subtitle: cacheInfo ? `${cacheInfo.totalLoaded} Transaktionen` : '',
      icon: cacheInfo?.cacheHit ? Database : Clock,
      color: cacheInfo?.cacheHit ? 'bg-purple-500' : 'bg-yellow-500'
    }
  ];

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold pulse-title">Steuer Report</h1>
            <p className="pulse-text-secondary">
              DSGVO-konforme Steuerdaten • Letzte Aktualisierung: {lastUpdate?.toLocaleTimeString('de-DE')}
            </p>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDebug(!showDebug)}
            >
              {showDebug ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              Debug
            </Button>
            <Button
              onClick={downloadCSV}
              disabled={downloadingCSV || !taxData?.taxableTransactions?.length}
            >
              <Download className={`h-4 w-4 mr-2 ${downloadingCSV ? 'animate-spin' : ''}`} />
              CSV Export
            </Button>
            <Button onClick={loadTaxData} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Aktualisieren
            </Button>
          </div>
        </div>

        {/* Tax Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          {statsCards.map((stat, index) => (
            <div key={index} className="pulse-card p-6">
              <div className="flex items-center">
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium pulse-text-secondary">{stat.title}</p>
                  <p className="text-2xl font-bold pulse-text">{stat.value}</p>
                  {stat.subtitle && (
                    <p className="text-xs pulse-text-secondary mt-1">{stat.subtitle}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Debug Information */}
        {showDebug && taxData && (
          <div className="pulse-card p-6 mb-6">
            <h3 className="flex items-center text-lg font-bold pulse-title mb-4">
              <AlertCircle className="h-5 w-5 mr-2 text-blue-400" />
              TAX SERVICE Debug Information
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium pulse-text-secondary">Alle Transaktionen:</span>
                <p className="pulse-text">{taxData.allTransactions?.length || 0}</p>
              </div>
              <div>
                <span className="font-medium pulse-text-secondary">Steuerpflichtig (ROI):</span>
                <p className="pulse-text">{taxData.taxableTransactions?.length || 0}</p>
              </div>
              <div>
                <span className="font-medium pulse-text-secondary">Käufe:</span>
                <p className="pulse-text">{taxData.purchases?.length || 0}</p>
              </div>
              <div>
                <span className="font-medium pulse-text-secondary">Verkäufe:</span>
                <p className="pulse-text">{taxData.sales?.length || 0}</p>
              </div>
              <div>
                <span className="font-medium pulse-text-secondary">Cache Hit:</span>
                <p className="pulse-text">{cacheInfo?.cacheHit ? '✅ Ja' : '❌ Nein'}</p>
              </div>
              <div>
                <span className="font-medium pulse-text-secondary">Geladen:</span>
                <p className="pulse-text">{cacheInfo?.totalLoaded || 0}</p>
              </div>
              <div>
                <span className="font-medium pulse-text-secondary">Gefiltert ({filterCategory}):</span>
                <p className="pulse-text">{filteredTransactions.length}</p>
              </div>
              <div>
                <span className="font-medium pulse-text-secondary">Steuerpflichtiges Einkommen:</span>
                <p className="pulse-text">{formatCurrency(taxStats.taxableIncome)}</p>
              </div>
            </div>
          </div>
        )}

        {/* DSGVO Notice */}
        <div className="pulse-card p-4 mb-6 border-l-4 border-blue-400">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium pulse-text">DSGVO-Hinweis</p>
              <p className="pulse-text-secondary">
                Diese Steuerdaten werden nur lokal verarbeitet und nicht an Dritte weitergegeben. 
                Der CSV-Export erfolgt direkt in Ihrem Browser ohne Server-Upload.
              </p>
            </div>
          </div>
        </div>

        {/* Filter & Tax Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          
          {/* Filter */}
          <div className="pulse-card p-6">
            <h3 className="flex items-center text-lg font-bold pulse-title mb-4">
              <Filter className="h-5 w-5 mr-2 text-green-400" />
              Filter
            </h3>
            <div className="space-y-2">
              {[
                { key: 'all', label: 'Alle Transaktionen', count: taxData.allTransactions?.length || 0 },
                { key: 'taxable', label: 'Steuerpflichtig (ROI)', count: taxData.taxableTransactions?.length || 0 },
                { key: 'purchases', label: 'Käufe', count: taxData.purchases?.length || 0 },
                { key: 'sales', label: 'Verkäufe', count: taxData.sales?.length || 0 }
              ].map(filter => (
                <Button
                  key={filter.key}
                  variant={filterCategory === filter.key ? 'default' : 'outline'}
                  className="w-full justify-between"
                  onClick={() => setFilterCategory(filter.key)}
                >
                  <span>{filter.label}</span>
                  <Badge variant="secondary">{filter.count}</Badge>
                </Button>
              ))}
            </div>
          </div>

          {/* Tax Summary - NEUE STEUERLOGIK */}
          <div className="pulse-card p-6 lg:col-span-2">
            <h3 className="text-lg font-bold pulse-title mb-4">Steuer Übersicht ({new Date().getFullYear()})</h3>
            <div className="space-y-4">
              
              {/* STEUERPFLICHTIG: Nur ROI/Minting nach § 22 EStG */}
              <div className="flex justify-between items-center p-3 bg-green-500/10 border border-green-400/20 rounded-lg">
                <div>
                  <span className="font-medium pulse-text">ROI/Minting Einkommen</span>
                  <p className="text-xs pulse-text-secondary">§ 22 EStG - Sonstige Einkünfte</p>
                </div>
                <span className="font-bold text-green-400">{formatCurrency(taxStats.taxableIncome)}</span>
              </div>
              
              {/* NICHT STEUERPFLICHTIG: Käufe */}
              <div className="flex justify-between items-center p-3 bg-blue-500/10 border border-blue-400/20 rounded-lg">
                <div>
                  <span className="font-medium pulse-text">Käufe/Transfers</span>
                  <p className="text-xs pulse-text-secondary">Nicht steuerpflichtig ({taxStats.purchasesCount} Transaktionen)</p>
                </div>
                <span className="font-bold text-blue-400">{formatCurrency(taxStats.purchases)}</span>
              </div>
              
              {/* VERKÄUFE: Separate Besteuerung */}
              <div className="flex justify-between items-center p-3 bg-orange-500/10 border border-orange-400/20 rounded-lg">
                <div>
                  <span className="font-medium pulse-text">Verkäufe</span>
                  <p className="text-xs pulse-text-secondary">Separate Besteuerung ({taxStats.salesCount} Transaktionen)</p>
                </div>
                <span className="font-bold text-orange-400">{formatCurrency(taxStats.sales)}</span>
              </div>
              
              <div className="border-t border-white/10 pt-3">
                <div className="flex justify-between items-center text-lg">
                  <div>
                    <span className="font-bold pulse-text">Steuerpflichtiges Einkommen</span>
                    <p className="text-xs pulse-text-secondary">{taxData?.taxSummary?.taxNote}</p>
                  </div>
                  <span className="font-bold text-red-400">{formatCurrency(taxStats.taxableIncome)}</span>
                </div>
              </div>
              
              {/* Steuerhinweis */}
              <div className="text-xs pulse-text-secondary p-2 bg-yellow-500/10 border border-yellow-400/20 rounded">
                ⚖️ {taxData?.taxSummary?.disclaimerNote}
              </div>
            </div>
          </div>

        </div>

        {/* Transactions Table */}
        <div className="pulse-card p-6">
                      <h3 className="text-lg font-bold pulse-title mb-4">
              Transaktionen ({filteredTransactions.length})
              {filterCategory !== 'all' && (
                <Badge className="ml-2" variant="secondary">
                  {filterCategory === 'taxable' ? 'Steuerpflichtig (ROI)' : 
                   filterCategory === 'purchases' ? 'Käufe' : 
                   filterCategory === 'sales' ? 'Verkäufe' : filterCategory}
                </Badge>
              )}
            </h3>
            {filteredTransactions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 px-2 pulse-text-secondary">Datum</th>
                      <th className="text-left py-3 px-2 pulse-text-secondary">Token</th>
                      <th className="text-right py-3 px-2 pulse-text-secondary">Menge</th>
                      <th className="text-right py-3 px-2 pulse-text-secondary">Preis</th>
                      <th className="text-right py-3 px-2 pulse-text-secondary">Wert (USD)</th>
                      <th className="text-center py-3 px-2 pulse-text-secondary">Richtung</th>
                      <th className="text-center py-3 px-2 pulse-text-secondary">Kategorie</th>
                      <th className="text-center py-3 px-2 pulse-text-secondary">ROI</th>
                      <th className="text-center py-3 px-2 pulse-text-secondary">Links</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.slice(0, 100).map((tx, index) => (
                      <tr key={index} className="border-b border-white/5 hover:bg-white/5">
                        <td className="py-3 px-2">
                          <div className="text-sm pulse-text">
                            {new Date(tx.blockTimestamp).toLocaleDateString('de-DE')}
                          </div>
                          <div className="text-xs pulse-text-secondary">
                            {new Date(tx.blockTimestamp).toLocaleTimeString('de-DE')}
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <div>
                            <div className="font-medium pulse-text">{tx.tokenSymbol}</div>
                            <div className="text-sm pulse-text-secondary">{tx.tokenName}</div>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-right">
                          <div className="font-mono text-sm pulse-text">
                            {formatNumber(tx.amount, 6)}
                          </div>
                        </td>
                        <td className="py-3 px-2 text-right">
                          <div className="font-mono text-sm pulse-text">
                            {tx.price > 0 ? formatCurrency(tx.price, 8) : 'N/A'}
                          </div>
                        </td>
                        <td className="py-3 px-2 text-right">
                          <div className="font-bold pulse-text">
                            {formatCurrency(tx.valueUSD)}
                          </div>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <Badge variant={tx.direction === 'in' ? 'default' : 'secondary'}>
                            {tx.direction === 'in' ? 'Eingehend' : 'Ausgehend'}
                          </Badge>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <Badge 
                            variant={tx.taxCategory === 'income' ? 'default' : 
                                   tx.taxCategory === 'capital_gain' ? 'destructive' : 'outline'}
                          >
                            {tx.taxCategory === 'income' ? 'Einkommen' : 
                             tx.taxCategory === 'capital_gain' ? 'Kapitalertrag' : 'Transfer'}
                          </Badge>
                        </td>
                        <td className="py-3 px-2 text-center">
                          {tx.isROITransaction && (
                            <Badge variant="outline" className="text-green-600 border-green-600">
                              ROI
                            </Badge>
                          )}
                        </td>
                        <td className="py-3 px-2 text-center">
                          <div className="flex justify-center space-x-1">
                            <a
                              href={tx.explorerUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:text-blue-700"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                                                    {tx.tokenExplorerUrl && (
                          <a
                            href={tx.tokenExplorerUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-green-500 hover:text-green-700"
                              >
                                <TrendingUp className="h-4 w-4" />
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {filteredTransactions.length > 100 && (
                  <div className="text-center py-4 pulse-text-secondary">
                    <p>Zeige 100 von {filteredTransactions.length} Transaktionen</p>
                    <p className="text-sm">Exportieren Sie alle Daten mit dem CSV-Download</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 pulse-text-secondary">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Keine Transaktionen in der ausgewählten Kategorie</p>
                <p className="text-sm mt-2">Ändern Sie den Filter oder fügen Sie Wallet-Adressen hinzu.</p>
              </div>
            )}
        </div>

        {/* CSV Export Info */}
        {portfolioData.taxTransactions?.length > 0 && (
          <div className="pulse-card p-4 mt-6 border-l-4 border-green-400">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Download className="h-5 w-5 text-green-400" />
                <div className="text-sm">
                  <p className="font-medium pulse-text">CSV-Export verfügbar</p>
                  <p className="pulse-text-secondary">
                    Alle {portfolioData.taxTransactions.length} Transaktionen können als CSV für die Steuererklärung exportiert werden.
                  </p>
                </div>
              </div>
              <Button onClick={downloadCSV} disabled={downloadingCSV} className="bg-green-500 hover:bg-green-600">
                <Download className="h-4 w-4 mr-2" />
                Jetzt exportieren
              </Button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default TaxReportView; 