// 📄 TAX REPORT VIEW - Zeigt echte Steuerdaten von PulseChain
// Datum: 2025-01-08 - PHASE 3: ECHTE STEUERDATEN INTEGRATION + SAFETY GUARDS

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
  Clock,
  Globe
} from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/utils';
import CentralDataService from '@/services/CentralDataService';
import { TaxService } from '@/services/TaxService';
import { useAuth } from '@/contexts/AuthContext';
import WalletDebugInfo from '@/components/ui/WalletDebugInfo';

const TaxReportView = () => {
  const { user } = useAuth();
  const [taxData, setTaxData] = useState(null);
  const [loading, setLoading] = useState(false); // MORALIS PRO: Start without loading
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [showDebug, setShowDebug] = useState(false);
  const [filterCategory, setFilterCategory] = useState('all'); // all, taxable, purchases, sales
  const [downloadingCSV, setDownloadingCSV] = useState(false);
  const [cacheInfo, setCacheInfo] = useState(null);
  
  // 🚀 NEW: Moralis + DEXScreener Integration
  const [moralisLoading, setMoralisLoading] = useState(false);
  const [moralisData, setMoralisData] = useState(null);
  const [ungepaarteTokens, setUngepaarteTokens] = useState([]);
  const [lastMoralisUpdate, setLastMoralisUpdate] = useState(null);
  const [editingToken, setEditingToken] = useState(null);
  
  // 🛡️ Rate Limiting für Moralis/DEXScreener calls
  const [canLoadMoralis, setCanLoadMoralis] = useState(true);
  const [remainingTime, setRemainingTime] = useState(0);

  // 🚀 TAX SERVICE: Lade Wallets + vollständige Transaktionshistorie  
  const loadTaxData = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 TAX REPORT V2: Loading with smart caching...');
      
      // 1. 📦 Lade User-Wallets via Smart Cache System (COST OPTIMIZED - only wallets)
      const portfolioData = await CentralDataService.loadCompletePortfolio(user.id, { 
        includeROI: false,
        includeTax: false // TaxService handles this separately
      });
      
      console.log('📊 TAX REPORT: Portfolio Cache Response:', {
        success: portfolioData.success,
        fromCache: portfolioData.fromCache,
        apiCalls: portfolioData.apiCalls || 'Cache Hit',
        walletCount: portfolioData.wallets?.length || 0
      });
      
      // SAFETY: Check if portfolioData is valid
      if (!portfolioData || (!portfolioData.success && !portfolioData.isLoaded)) {
        setError(portfolioData?.error || 'Unbekannter Fehler beim Laden der Portfolio-Daten');
        return;
      }
      
      const wallets = portfolioData.wallets || [];
      
      if (wallets.length === 0) {
        setError('Keine Wallets gefunden. Fügen Sie zuerst Ihre Wallet-Adressen hinzu.');
        return;
      }
      
      console.log(`📊 Loading tax data for ${wallets.length} wallets...`);
      
      // 2. TaxService für alle Transaction-Daten (mit Caching!)
      const fullTaxData = await TaxService.fetchFullTransactionHistory(user.id, wallets);
      
      // SAFETY: Check if fullTaxData is valid
      if (!fullTaxData) {
        setError('Fehler beim Laden der Transaktionshistorie');
        return;
      }
      
      setTaxData(fullTaxData);
      setLastUpdate(new Date());
      setCacheInfo({
        totalLoaded: fullTaxData.allTransactions?.length || 0,
        taxable: fullTaxData.taxableTransactions?.length || 0,
        cacheHit: fullTaxData.fromCache || false
      });
      
      console.log('✅ TAX REPORT: Data loaded successfully', {
        total: fullTaxData.allTransactions?.length || 0,
        taxable: fullTaxData.taxableTransactions?.length || 0,
        taxableIncomeUSD: fullTaxData.taxSummary?.taxableIncomeUSD || '0.00',
        fromCache: fullTaxData.fromCache
      });
      
    } catch (err) {
      console.error('💥 TAX REPORT ERROR:', err);
      setError(`Fehler beim Laden der Steuerdaten: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 🚀 REPAIRED: Moralis + DEXScreener Integration (NOW COMPATIBLE WITH TAXSERVICE)
  const loadMoralisData = async () => {
    if (!user?.id || !canLoadMoralis) return;
    
    try {
      setMoralisLoading(true);
      setError(null);
      
      console.log('🔄 TAX REPORT: Loading Moralis + DEXScreener data via TaxService...');
      
              // 1. Lade User-Wallets (BASIC - TaxService macht den Rest)
        const portfolioData = await CentralDataService.loadCompletePortfolio(user.id, { 
          includeTax: false, // TaxService macht das besser mit UNLIMITED
          includeROI: false
        });
      const wallets = portfolioData?.wallets || [];
      
      if (wallets.length === 0) {
        setError('Keine Wallets gefunden für Moralis-Preisfindung');
        return;
      }
      
      console.log(`📊 Loading Moralis tax data for ${wallets.length} wallets...`);
      
      // 2. 🚀 FIXED: Use TaxService instead of direct API call
      const fullTaxData = await TaxService.fetchFullTransactionHistory(user.id, wallets);
      
      if (!fullTaxData) {
        throw new Error('Fehler beim Laden der Transaktionshistorie via TaxService');
      }
      
      // 3. Set the tax data (compatible with TaxService format)
      setTaxData(fullTaxData);
      setLastUpdate(new Date());
      setLastMoralisUpdate(new Date());
      
      // 4. Extract additional info for Moralis display
      const moralisDisplayData = {
        success: true,
        transactionCount: fullTaxData.allTransactions?.length || 0,
        ungepaarteCount: 0, // TaxService handles prices differently
        statistics: {
          steuerpflichtigeTransaktionen: fullTaxData.taxableTransactions?.length || 0,
          gesamtwertSteuerpflichtig: fullTaxData.taxSummary?.taxableIncomeUSD || 0
        },
        apiUsage: {
          totalCalls: 'Handled by TaxService',
          moralisCallsUsed: 'Optimized via caching'
        }
      };
      
      setMoralisData(moralisDisplayData);
      setUngepaarteTokens([]); // TaxService handles missing prices internally
      
      // 5. Update cache info
      setCacheInfo({
        totalLoaded: fullTaxData.allTransactions?.length || 0,
        taxable: fullTaxData.taxableTransactions?.length || 0,
        cacheHit: fullTaxData.fromCache || false
      });
      
      console.log('✅ MORALIS TAX DATA (via TaxService):', {
        total: fullTaxData.allTransactions?.length || 0,
        taxable: fullTaxData.taxableTransactions?.length || 0,
        taxableIncomeUSD: fullTaxData.taxSummary?.taxableIncomeUSD || '0.00',
        fromCache: fullTaxData.fromCache
      });
      
      // Rate limiting - 5 Minuten zwischen calls
      setCanLoadMoralis(false);
      setRemainingTime(300); // 5 Minuten
      
      const timer = setInterval(() => {
        setRemainingTime(prev => {
          if (prev <= 1) {
            setCanLoadMoralis(true);
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
    } catch (err) {
      console.error('💥 MORALIS TAX ERROR:', err);
      setError(`Moralis-Fehler: ${err.message}`);
    } finally {
      setMoralisLoading(false);
    }
  };

  // 💰 Manual Price Update for ungepaarte tokens
  const updateTokenPrice = async (tokenIndex, manualPrice) => {
    if (!ungepaarteTokens[tokenIndex] || !manualPrice) return;
    
    try {
      const updatedTokens = [...ungepaarteTokens];
      updatedTokens[tokenIndex] = {
        ...updatedTokens[tokenIndex],
        manualPrice: parseFloat(manualPrice),
        valueEUR: updatedTokens[tokenIndex].amount * parseFloat(manualPrice) * 0.92, // EUR conversion
        source: 'manual_user_input'
      };
      
      setUngepaarteTokens(updatedTokens);
      setEditingToken(null);
      
      console.log(`✅ Manual price updated for ${updatedTokens[tokenIndex].token}: $${manualPrice}`);
    } catch (error) {
      console.error('💥 Manual price update error:', error);
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

  // ❌ DISABLED FOR MORALIS PRO: No auto-loading to save API calls
  // Initial load removed - only manual loading via button
  // useEffect(() => {
  //   loadTaxData();
  // }, [user?.id]);

  // ❌ DISABLED FOR MORALIS PRO: Auto-refresh removed to save costs
  // useEffect(() => {
  //   const interval = setInterval(loadTaxData, 10 * 60 * 1000);
  //   return () => clearInterval(interval);
  // }, [user?.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="pulse-card p-8 text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-green-400 mx-auto mb-4" />
          <div className="space-y-2">
            <span className="text-lg pulse-text">💰 MORALIS PRO: Lade Steuerdaten...</span>
            <p className="text-sm pulse-text-secondary">Manual Load Mode • Kostenkontrolle aktiv</p>
            <p className="text-xs pulse-text-secondary text-green-400">
              ✅ Kein Auto-Refresh • API-Calls nur bei manueller Anfrage
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ❌ REMOVED: Manual loading screen - show normal UI instead

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

  // ❌ REMOVED: Show normal UI even without data - let user navigate freely

  // 🎯 Filter transactions by category (NEUES FORMAT)
  const getFilteredTransactions = () => {
    // SAFETY: Return empty array if no taxData
    if (!taxData || !taxData.allTransactions) {
      return [];
    }
    
    return taxData.allTransactions.filter(tx => {
      try {
        if (filterCategory === 'taxable' && !tx.isTaxable) return false;
        if (filterCategory === 'purchases' && tx.direction !== 'out') return false;
        if (filterCategory === 'sales' && tx.direction !== 'in') return false;
        return true;
      } catch (error) {
        console.warn('Filter error for transaction:', tx, error);
        return false;
      }
    });
  };

  // 📊 Get tax statistics from TaxService summary with SAFETY GUARDS
  const getTaxStats = () => {
    // SAFETY: Return default values if no taxData
    if (!taxData || !taxData.taxSummary) {
      return {
        totalTransactions: 0,
        taxableTransactions: 0,
        taxableIncome: 0,
        purchases: 0,
        sales: 0,
        purchasesCount: 0,
        salesCount: 0
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

  // SAFETY: Get filtered transactions and stats with guards
  const filteredTransactions = getFilteredTransactions();
  const taxStats = getTaxStats();
  
  // Show empty state info when no data loaded
  const showEmptyState = !loading && !taxData && !error;

  const statsCards = [
    {
      title: 'Gesamte Transaktionen',
      value: showEmptyState ? '-' : taxStats.totalTransactions.toString(),
      subtitle: showEmptyState ? 'Nicht geladen' : (cacheInfo ? `${cacheInfo.totalLoaded} geladen` : ''),
      icon: FileText,
      color: 'bg-blue-500'
    },
    {
      title: 'Steuerpflichtige',
      value: showEmptyState ? '-' : taxStats.taxableTransactions.toString(),
      subtitle: showEmptyState ? 'Nicht geladen' : 'ROI/Minting',
      icon: AlertCircle,
      color: 'bg-orange-500'
    },
    {
      title: 'Steuerpflichtiges Einkommen',
      value: showEmptyState ? '-' : formatCurrency(taxStats.taxableIncome),
      subtitle: showEmptyState ? 'Nicht geladen' : '§ 22 EStG',
      icon: DollarSign,
      color: 'bg-green-500'
    },
    {
      title: 'Status',
      value: showEmptyState ? 'Bereit zum Laden' : (cacheInfo?.cacheHit ? 'Cache Hit' : 'Fresh Load'),
      subtitle: showEmptyState ? 'MORALIS PRO' : (cacheInfo ? `${cacheInfo.totalLoaded} Transaktionen` : ''),
      icon: showEmptyState ? RefreshCw : (cacheInfo?.cacheHit ? Database : Clock),
      color: showEmptyState ? 'bg-green-500' : (cacheInfo?.cacheHit ? 'bg-purple-500' : 'bg-yellow-500')
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
            <Button 
              onClick={loadMoralisData} 
              disabled={moralisLoading || !canLoadMoralis}
              className="bg-blue-500 hover:bg-blue-600"
            >
              <Globe className={`h-4 w-4 mr-2 ${moralisLoading ? 'animate-spin' : ''}`} />
              {moralisLoading ? 'Lade Preise...' : 'Moralis Preise'}
              {!canLoadMoralis && (
                <span className="ml-2 text-xs">({Math.floor(remainingTime / 60)}:{(remainingTime % 60).toString().padStart(2, '0')})</span>
              )}
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

        {/* 🚀 MORALIS PRO: Prominent Load Button when no data */}
        {showEmptyState && (
          <div className="pulse-card p-8 mb-6 text-center border-2 border-green-500/20">
            <FileText className="h-16 w-16 mx-auto mb-4 text-green-400" />
            <h3 className="text-xl font-bold pulse-text mb-2">💰 MORALIS PRO: Steuerdaten laden</h3>
            <p className="pulse-text-secondary mb-6">
              Klicken Sie hier um Ihre Transaktionshistorie für die Steuerberechnung zu laden.<br/>
              <span className="text-green-400">✅ Kostenoptimiert - nur bei Bedarf</span>
            </p>
            <div className="flex gap-4 justify-center">
              <Button 
                onClick={loadTaxData} 
                className="bg-green-500 hover:bg-green-600"
                size="lg"
                disabled={loading}
              >
                <FileText className={`h-5 w-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Steuerdaten laden
              </Button>
              <Button 
                onClick={loadMoralisData} 
                className="bg-blue-500 hover:bg-blue-600"
                size="lg"
                disabled={moralisLoading || !canLoadMoralis}
              >
                <Globe className={`h-5 w-5 mr-2 ${moralisLoading ? 'animate-spin' : ''}`} />
                Mit Moralis Preisen
              </Button>
            </div>
          </div>
        )}

        {/* 💰 MORALIS DATA SUMMARY */}
        {moralisData && (
          <div className="pulse-card p-6 mb-6 border-l-4 border-blue-500">
            <h3 className="text-lg font-bold pulse-text mb-4 flex items-center">
              <Globe className="h-5 w-5 mr-2 text-blue-400" />
              Moralis + DEXScreener Analyse
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">{moralisData.transactionCount}</div>
                <div className="text-sm pulse-text-secondary">Transaktionen</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{moralisData.statistics?.steuerpflichtigeTransaktionen || 0}</div>
                <div className="text-sm pulse-text-secondary">Steuerpflichtig</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-400">{moralisData.ungepaarteCount}</div>
                <div className="text-sm pulse-text-secondary">Ungepaarte Tokens</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">{moralisData.apiUsage?.totalCalls || 0}</div>
                <div className="text-sm pulse-text-secondary">API Calls</div>
              </div>
            </div>
            {lastMoralisUpdate && (
              <div className="text-xs pulse-text-secondary mt-2">
                Letzte Aktualisierung: {lastMoralisUpdate.toLocaleString('de-DE')}
              </div>
            )}
          </div>
        )}

        {/* Debug Information */}
        {showDebug && (
          <div className="space-y-6 mb-6">
            {/* Wallet Debug Info - ALWAYS show in debug mode */}
            <WalletDebugInfo />
            
            {/* Tax Data Debug - only when tax data loaded */}
            {taxData && (
              <div className="pulse-card p-6">
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
                { key: 'all', label: 'Alle Transaktionen', count: taxData?.allTransactions?.length || 0 },
                { key: 'taxable', label: 'Steuerpflichtig (ROI)', count: taxData?.taxableTransactions?.length || 0 },
                { key: 'purchases', label: 'Käufe', count: taxData?.purchases?.length || 0 },
                { key: 'sales', label: 'Verkäufe', count: taxData?.sales?.length || 0 }
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
                    <p className="text-xs pulse-text-secondary">{taxData?.taxSummary?.taxNote || 'Basierend auf § 22 EStG'}</p>
                  </div>
                  <span className="font-bold text-red-400">{formatCurrency(taxStats.taxableIncome)}</span>
                </div>
              </div>
              
              {/* Steuerhinweis */}
              <div className="text-xs pulse-text-secondary p-2 bg-yellow-500/10 border border-yellow-400/20 rounded">
                ⚖️ {taxData?.taxSummary?.disclaimerNote || 'Steuerrechtliche Beratung durch einen Experten empfohlen'}
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
                    {filteredTransactions.map((tx, index) => (
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

        {/* 🚫 UNGEPAARTE TOKENS - SEPARATE SPALTE */}
        {ungepaarteTokens.length > 0 && (
          <div className="pulse-card p-6 mt-6">
            <h3 className="text-lg font-bold pulse-text mb-4 flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 text-orange-400" />
              Ungepaarte Tokens ({ungepaarteTokens.length})
              <Badge className="ml-2 bg-orange-500">Preise manuell vervollständigen</Badge>
            </h3>
            <p className="pulse-text-secondary mb-4">
              Diese Tokens wurden nicht in Moralis oder DEXScreener gefunden. 
              Geben Sie manuell Preise ein oder nutzen Sie andere Quellen.
            </p>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-2 pulse-text-secondary">Token</th>
                    <th className="text-right py-3 px-2 pulse-text-secondary">Menge</th>
                    <th className="text-left py-3 px-2 pulse-text-secondary">Datum</th>
                    <th className="text-center py-3 px-2 pulse-text-secondary">Typ</th>
                    <th className="text-right py-3 px-2 pulse-text-secondary">Preis (USD)</th>
                    <th className="text-right py-3 px-2 pulse-text-secondary">Wert (EUR)</th>
                    <th className="text-center py-3 px-2 pulse-text-secondary">Steuerpflichtig</th>
                    <th className="text-center py-3 px-2 pulse-text-secondary">Aktion</th>
                  </tr>
                </thead>
                <tbody>
                  {ungepaarteTokens.map((token, index) => (
                    <tr key={index} className="border-b border-white/5 hover:bg-white/5">
                      <td className="py-3 px-2">
                        <div>
                          <div className="font-medium pulse-text">{token.token}</div>
                          <div className="text-xs pulse-text-secondary font-mono">
                            {token.tokenAddress?.slice(0, 8)}...{token.tokenAddress?.slice(-6)}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <div className="font-mono pulse-text">
                          {token.amount.toFixed(6)}
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <div className="text-sm pulse-text">
                          {new Date(token.date).toLocaleDateString('de-DE')}
                        </div>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <Badge 
                          variant={token.type === 'ROI' ? 'default' : 
                                  token.type === 'Verkauf' ? 'destructive' : 'secondary'}
                        >
                          {token.type}
                        </Badge>
                      </td>
                      <td className="py-3 px-2 text-right">
                        {editingToken === index ? (
                          <div className="flex items-center space-x-2">
                            <input
                              type="number"
                              step="0.000001"
                              placeholder="0.00"
                              className="w-24 px-2 py-1 bg-white/10 border border-white/20 rounded text-sm pulse-text"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  updateTokenPrice(index, e.target.value);
                                } else if (e.key === 'Escape') {
                                  setEditingToken(null);
                                }
                              }}
                              autoFocus
                            />
                          </div>
                        ) : (
                          <div className="font-mono">
                            {token.manualPrice ? 
                              `$${token.manualPrice.toFixed(6)}` : 
                              <span className="text-red-400">Kein Preis</span>
                            }
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-2 text-right">
                        <div className="font-bold">
                          {token.valueEUR > 0 ? 
                            `€${token.valueEUR.toFixed(2)}` : 
                            <span className="text-gray-500">-</span>
                          }
                        </div>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <Badge variant={token.steuerpflichtig ? 'destructive' : 'secondary'}>
                          {token.steuerpflichtig ? 'Ja' : 'Nein'}
                        </Badge>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingToken(editingToken === index ? null : index)}
                        >
                          {editingToken === index ? 'Abbrechen' : 'Preis eingeben'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mt-4 p-4 bg-orange-500/10 border border-orange-400/20 rounded-lg">
              <h4 className="font-medium pulse-text mb-2">💡 Preisfindung-Tipps:</h4>
              <ul className="text-sm pulse-text-secondary space-y-1">
                <li>• <strong>CoinGecko/CoinMarketCap:</strong> Für etablierte Tokens</li>
                <li>• <strong>DEXTools/DexScreener:</strong> Für neue PulseChain-Tokens</li>
                <li>• <strong>PulseX/9mm:</strong> Für lokale PulseChain-Preise</li>
                <li>• <strong>0 eingeben:</strong> Für wertlose/Spam-Tokens</li>
              </ul>
            </div>
          </div>
        )}

        {/* CSV Export Info */}
        {taxData?.taxableTransactions?.length > 0 && (
          <div className="pulse-card p-4 mt-6 border-l-4 border-green-400">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Download className="h-5 w-5 text-green-400" />
                <div className="text-sm">
                  <p className="font-medium pulse-text">CSV-Export verfügbar</p>
                  <p className="pulse-text-secondary">
                    Alle {taxData?.taxableTransactions?.length || 0} Transaktionen können als CSV für die Steuererklärung exportiert werden.
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
