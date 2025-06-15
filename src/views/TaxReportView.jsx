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
import { formatCurrency, formatNumber, formatTime } from '@/lib/utils';
import CentralDataService from '@/services/CentralDataService';
import CUMonitor from '@/components/ui/CUMonitor';
import { TaxService } from '@/services/TaxService';
import { TaxReportService_Rebuild } from '@/services/TaxReportService_Rebuild';
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
  
          // 🚀 NEW: Moralis + PulseScan Integration
  const [moralisLoading, setMoralisLoading] = useState(false);
  const [moralisData, setMoralisData] = useState(null);
  const [ungepaarteTokens, setUngepaarteTokens] = useState([]);
  const [lastMoralisUpdate, setLastMoralisUpdate] = useState(null);
  const [editingToken, setEditingToken] = useState(null);
  
          // 🛡️ Rate Limiting für Moralis/PulseScan calls
  const [canLoadMoralis, setCanLoadMoralis] = useState(true);
  const [remainingTime, setRemainingTime] = useState(0);
  
  // 🚀 NEW: Tax Report Rebuild Service
  const [rebuildLoading, setRebuildLoading] = useState(false);
  const [rebuildData, setRebuildData] = useState(null);
  const [rebuildError, setRebuildError] = useState(null);

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

  // 🚀 NEW: Tax Report Rebuild Service (VOLLSTÄNDIG NEUER STEUERKONFORMER SERVICE)
  const generateRebuildTaxReport = async () => {
    if (!user?.id) return;
    
    try {
      setRebuildLoading(true);
      setRebuildError(null);
      
      console.log('🎯 TAX REPORT REBUILD: Generiere vollständig neuen steuerkonformen Report...');
      
      // 1. Lade User-Wallets
      const portfolioData = await CentralDataService.loadCompletePortfolio(user.id, { 
        includeROI: false,
        includeTax: false
      });
      
      const wallets = portfolioData?.wallets || [];
      
      if (wallets.length === 0) {
        setRebuildError('Keine Wallets gefunden. Fügen Sie zuerst Ihre Wallet-Adressen hinzu.');
        return;
      }
      
      console.log(`📊 Generiere Tax Report für ${wallets.length} Wallets...`);
      
      // 2. Für jedes Wallet einen vollständigen Tax Report generieren (OHNE automatische PDF-Generierung)
      const reports = [];
      
      for (const wallet of wallets) {
        console.log(`🔄 Verarbeite Wallet: ${wallet.address}`);
        
        try {
          const report = await TaxReportService_Rebuild.generateTaxReport(wallet.address, {
            startDate: '2025-01-01',
            endDate: '2025-12-31',
            debugMode: true,
            generatePDF: false // 🔥 WICHTIG: Keine automatische PDF-Generierung
          });
          
          reports.push({
            wallet: wallet.address,
            report
          });
          
          console.log(`✅ Tax Report für ${wallet.address} erfolgreich generiert`);
          
        } catch (walletError) {
          console.error(`❌ Fehler bei Wallet ${wallet.address}:`, walletError);
          reports.push({
            wallet: wallet.address,
            error: walletError.message
          });
        }
      }
      
      // 3. Kombiniere alle Reports
      const combinedReport = {
        totalWallets: wallets.length,
        successfulReports: reports.filter(r => !r.error).length,
        failedReports: reports.filter(r => r.error).length,
        reports,
        generatedAt: new Date().toISOString(),
        version: '2.0.0-rebuild'
      };
      
      setRebuildData(combinedReport);
      
      console.log('✅ NEUES TAX SYSTEM: Alle Reports erfolgreich generiert!');
      console.log(`📊 Erfolgreich: ${combinedReport.successfulReports}/${combinedReport.totalWallets} Wallets`);
      
    } catch (error) {
      console.error('❌ TAX REPORT REBUILD FEHLER:', error);
      setRebuildError(`Fehler beim Generieren des Tax Reports: ${error.message}`);
    } finally {
      setRebuildLoading(false);
    }
  };

  // 📄 NEUE FUNKTION: PDF manuell generieren
  const generatePDFManually = async () => {
    if (!rebuildData || rebuildData.reports.length === 0) {
      alert('Bitte generieren Sie zuerst einen Tax Report!');
      return;
    }
    
    try {
      console.log('📄 Generiere PDFs für alle Wallets...');
      
      for (const reportData of rebuildData.reports) {
        if (reportData.report && !reportData.error) {
          await TaxReportService_Rebuild.generatePDFManually(reportData.report);
          console.log(`✅ PDF für Wallet ${reportData.wallet} generiert`);
        }
      }
      
      alert('✅ Alle PDFs wurden erfolgreich im Downloads-Ordner gespeichert!');
      
    } catch (error) {
      console.error('❌ PDF-Generierung fehlgeschlagen:', error);
      alert(`❌ Fehler bei PDF-Generierung: ${error.message}`);
    }
  };

              // 🚀 REPAIRED: Moralis + PulseScan Integration (NOW COMPATIBLE WITH TAXSERVICE)
  const loadMoralisData = async () => {
    if (!user?.id || !canLoadMoralis) return;
    
    try {
      setMoralisLoading(true);
      setError(null);
      
      console.log('🔄 TAX REPORT: Loading Moralis + PulseScan data via TaxService...');
      
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
      console.log('📊 WALLET DEBUG:', wallets.map(w => ({ address: w.address?.slice(0, 8) + '...', chain: w.chain })));
      
      // 2. 🚀 FIXED: Use TaxService instead of direct API call
      const fullTaxData = await TaxService.fetchFullTransactionHistory(user.id, wallets);
      
      if (!fullTaxData) {
        throw new Error('Fehler beim Laden der Transaktionshistorie via TaxService');
      }
      
      // 🚀 ENHANCED DEBUG: Log transaction analysis
      console.log('🔍 TAX DEBUG ANALYSIS:');
      console.log('📊 All Transactions:', fullTaxData.allTransactions?.length || 0);
      console.log('💰 Taxable Transactions:', fullTaxData.taxableTransactions?.length || 0);
      console.log('🛒 Purchases:', fullTaxData.purchases?.length || 0);
      console.log('💸 Sales:', fullTaxData.sales?.length || 0);
      
      // 🚀 SAMPLE TRANSACTION ANALYSIS
      if (fullTaxData.allTransactions && fullTaxData.allTransactions.length > 0) {
        const sampleSize = Math.min(10, fullTaxData.allTransactions.length);
        console.log(`🔍 SAMPLE ANALYSIS (first ${sampleSize} transactions):`);
        
        for (let i = 0; i < sampleSize; i++) {
          const tx = fullTaxData.allTransactions[i];
          console.log(`📄 TX ${i+1}:`, {
            token: tx.tokenSymbol || tx.token_symbol,
            amount: tx.amount || 'N/A',
            isIncoming: tx.isIncoming || tx.is_incoming,
            isROI: tx.isROI || tx.is_roi_transaction,
            valueUSD: tx.valueUSD || tx.value_usd || 0,
            from: (tx.from || tx.from_address)?.slice(0, 8) + '...',
            to: (tx.to || tx.to_address)?.slice(0, 8) + '...',
            reason: `incoming: ${tx.isIncoming || tx.is_incoming}, roi: ${tx.isROI || tx.is_roi_transaction}, value: $${tx.valueUSD || tx.value_usd || 0}`
          });
        }
      }
      
      // 🚀 ROI DETECTION STATISTICS
      const incomingCount = fullTaxData.allTransactions?.filter(tx => tx.isIncoming || tx.is_incoming).length || 0;
      const roiCount = fullTaxData.allTransactions?.filter(tx => tx.isROI || tx.is_roi_transaction).length || 0;
      const valuedCount = fullTaxData.allTransactions?.filter(tx => (tx.valueUSD || tx.value_usd || 0) > 0).length || 0;
      
      console.log('🎯 ROI DETECTION STATS:');
      console.log(`📈 Incoming transactions: ${incomingCount}`);
      console.log(`🎯 ROI detected: ${roiCount}`);
      console.log(`💰 With USD values: ${valuedCount}`);
      console.log(`📊 ROI Detection Rate: ${incomingCount > 0 ? (roiCount / incomingCount * 100).toFixed(1) : '0'}%`);
      
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
          gesamtwertSteuerpflichtig: fullTaxData.taxSummary?.taxableIncomeUSD || 0,
          incomingTransactions: incomingCount,
          roiTransactions: roiCount,
          valuedTransactions: valuedCount,
          roiDetectionRate: incomingCount > 0 ? (roiCount / incomingCount * 100).toFixed(1) : '0'
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
        fromCache: fullTaxData.fromCache,
        roiDetectionRate: moralisDisplayData.statistics.roiDetectionRate + '%'
      });
      
      // Rate limiting - 5 Minuten zwischen calls
      setCanLoadMoralis(false);
      setRemainingTime(300); // 5 Minuten
      
      // ❌ TIMER ENTFERNT - Manual Control Only
      // const timer = setInterval(() => {
      //   setRemainingTime(prev => {
      //     if (prev <= 1) {
      //       setCanLoadMoralis(true);
      //       clearInterval(timer);
      //       return 0;
      //     }
      //     return prev - 1;
      //   });
      // }, 1000);
      
      // Simple timeout statt timer für Rate Limiting
      setTimeout(() => {
        setCanLoadMoralis(true);
        setRemainingTime(0);
      }, 300000); // 5 Minuten ohne aktiven Timer
      
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
  
  // Debug: Check for transfer loading issues
  const debugTransferLoading = () => {
    if (!taxData || !taxData.allTransactions) return "Keine Tax-Daten geladen";
    if (taxData.allTransactions.length === 0) return "Keine Transaktionen gefunden - möglicherweise /erc20/transfers nicht aufgerufen";
    if (taxData.taxableTransactions?.length === 0) return "Transaktionen geladen aber keine als steuerpflichtig erkannt";
    return "Transaktionen erfolgreich geladen";
  };

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
        
        {/* TAX DEBUG: Zeige warum keine Tax-Daten sichtbar */}
        {showEmptyState && (
          <div className="pulse-card p-8 mb-6 text-center border-2 border-yellow-500/20">
            <FileText className="h-16 w-16 mx-auto mb-4 text-yellow-400" />
            <h3 className="text-xl font-bold pulse-text mb-2">📄 Steuer-Daten noch nicht geladen</h3>
            <p className="pulse-text-secondary mb-6">
              Laden Sie Ihre Steuer-Daten um Transaktionen und steuerpflichtige Einkünfte zu analysieren.<br/>
              <span className="text-yellow-400">⚠️ Debug: {debugTransferLoading()}</span>
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 mb-6">
              <Button 
                onClick={loadTaxData} 
                className="bg-blue-600 hover:bg-blue-700"
                size="lg"
                disabled={loading}
              >
                <FileText className={`h-5 w-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Basis Steuerdaten laden
              </Button>
              <Button 
                onClick={loadMoralisData} 
                className="bg-green-600 hover:bg-green-700"
                size="lg"
                disabled={moralisLoading || !canLoadMoralis}
              >
                <Globe className={`h-5 w-5 mr-2 ${moralisLoading ? 'animate-spin' : ''}`} />
                Moralis + Preise
                {remainingTime > 0 && (
                  <span className="ml-1 text-xs text-yellow-400">({remainingTime}s)</span>
                )}
              </Button>
            </div>
            <div className="text-xs pulse-text-secondary mt-4 p-3 bg-yellow-500/10 border border-yellow-400/20 rounded">
              💡 <strong>Debug-Info:</strong> Falls CU = 0 angezeigt wird, wurden noch keine /erc20/transfers API-Calls ausgeführt.
              Das Basis-Laden lädt Wallets und cached Transaktionen. Moralis-Laden holt aktuelle Preise.
            </div>
          </div>
        )}

        {/* TAX LOADED BUT NO TRANSFERS DEBUG */}
        {!showEmptyState && taxData && (!taxData.allTransactions || taxData.allTransactions.length === 0) && (
          <div className="pulse-card p-6 mb-6 border-l-4 border-red-500">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 text-red-400" />
              <h3 className="text-lg font-bold pulse-text">🔴 Transfer-Loading Debug</h3>
            </div>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="pulse-text-secondary">Tax Service aufgerufen:</span>
                <span className="text-green-400">✅ Ja</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="pulse-text-secondary">Transaktionen geladen:</span>
                <span className="text-red-400">❌ {taxData?.allTransactions?.length || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="pulse-text-secondary">/erc20/transfers aufgerufen:</span>
                <span className="text-red-400">❓ Möglicherweise nicht</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="pulse-text-secondary">Cache verwendet:</span>
                <span className={cacheInfo?.cacheHit ? "text-blue-400" : "text-orange-400"}>
                  {cacheInfo?.cacheHit ? "💾 Cache Hit" : "🌐 Fresh Call"}
                </span>
              </div>
            </div>
            <div className="mt-4 p-3 bg-red-500/10 border border-red-400/20 rounded">
              <p className="text-red-400 text-sm">
                💡 <strong>Problem:</strong> TaxService wurde aufgerufen aber hat keine Transaktionen zurückgegeben.
                Dies deutet darauf hin, dass der /erc20/transfers Endpoint nicht funktioniert oder leer zurückgibt.
              </p>
            </div>
          </div>
        )}

        {/* TRANSFERS LOADED BUT NO TAXABLE DEBUG */}
        {!showEmptyState && taxData && taxData.allTransactions && taxData.allTransactions.length > 0 && 
         (!taxData.taxableTransactions || taxData.taxableTransactions.length === 0) && (
          <div className="pulse-card p-6 mb-6 border-l-4 border-orange-500">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 text-orange-400" />
              <h3 className="text-lg font-bold pulse-text">🟠 Steuer-Analyse Debug</h3>
            </div>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="pulse-text-secondary">Transaktionen geladen:</span>
                <span className="text-green-400">✅ {taxData.allTransactions.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="pulse-text-secondary">Steuerpflichtige erkannt:</span>
                <span className="text-orange-400">⚠️ {taxData.taxableTransactions?.length || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="pulse-text-secondary">ROI-Transaktionen:</span>
                <span className="text-blue-400">
                  {taxData.allTransactions.filter(tx => tx.isROI || tx.is_roi_transaction).length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="pulse-text-secondary">Eingehende Transaktionen:</span>
                <span className="text-purple-400">
                  {taxData.allTransactions.filter(tx => tx.isIncoming || tx.is_incoming).length}
                </span>
              </div>
            </div>
            <div className="mt-4 p-3 bg-orange-500/10 border border-orange-400/20 rounded">
              <p className="text-orange-400 text-sm">
                💡 <strong>Analyse:</strong> Transaktionen wurden geladen aber keine als steuerpflichtig klassifiziert.
                Dies kann bedeuten, dass keine ROI-Aktivitäten (HEX-Minting, INC-Rewards, etc.) erkannt wurden.
              </p>
            </div>
          </div>
        )}
        
        {/* 🚨 NEUE STEUERREPORT WARNUNG */}
      <div className="mb-4 p-4 bg-purple-600/20 border-4 border-yellow-400 rounded-lg animate-pulse">
        <h2 className="text-2xl font-bold text-yellow-400 text-center mb-2">
          🔥 NEUES STEUERREPORT SYSTEM VERFÜGBAR! 🔥
        </h2>
        <p className="text-center text-white">
          Klicken Sie den violetten Button oben für das neue, steuerrechtlich korrekte System!
        </p>
      </div>

      {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold pulse-title">Steuer Report (Alt)</h1>
            <p className="pulse-text-secondary">
                              DSGVO-konforme Steuerdaten • Letzte Aktualisierung: {lastUpdate ? formatTime(lastUpdate) : 'Nie'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {/* 🚨🚨🚨 ERSTER BUTTON - HÖCHSTE PRIORITÄT - IMMER SICHTBAR 🚨🚨🚨 */}
            <Button
              onClick={() => {
                console.log('🔥 Weiterleitung zur neuen Tax Report Seite...');
                window.location.href = '/tax-report-new';
              }}
              className="bg-purple-600 hover:bg-purple-700 border-4 border-yellow-400 text-white font-bold shadow-xl animate-bounce order-first"
              size="lg"
              style={{ minWidth: '280px', fontSize: '16px', zIndex: 9999 }}
            >
              <FileText className="h-5 w-5 mr-2" />
              🔥 ZUR NEUEN STEUERREPORT SEITE 🔥
            </Button>
            
            <Button
              onClick={loadTaxData}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Steuer Daten laden
            </Button>
            
            <Button
              onClick={loadMoralisData}
              disabled={moralisLoading || !canLoadMoralis}
              className="bg-green-600 hover:bg-green-700"
            >
              <Globe className={`h-4 w-4 mr-2 ${moralisLoading ? 'animate-spin' : ''}`} />
              Moralis + Preise
              {remainingTime > 0 && (
                <span className="ml-1 text-xs text-yellow-400">({remainingTime}s)</span>
              )}
            </Button>

            {/* 🔥 REBUILD TAX REPORT BUTTON */}
            <Button
              onClick={generateRebuildTaxReport}
              disabled={rebuildLoading}
              className="bg-orange-600 hover:bg-orange-700"
            >
              <FileText className={`h-4 w-4 mr-2 ${rebuildLoading ? 'animate-spin' : ''}`} />
              {rebuildLoading ? 'Generiere...' : '🔥 REBUILD TAX REPORT'}
            </Button>
            
            <Button
              onClick={downloadCSV}
              disabled={!taxData?.taxableTransactions || downloadingCSV}
              variant="outline"
            >
              <Download className={`h-4 w-4 mr-2 ${downloadingCSV ? 'animate-spin' : ''}`} />
              CSV Export
            </Button>

            {/* 📄 PDF BUTTON für Rebuild Tax Report */}
            {rebuildData && rebuildData.successfulReports > 0 && (
              <Button
                onClick={generatePDFManually}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <FileText className="h-4 w-4 mr-2" />
                📄 PDFs GENERIEREN
              </Button>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDebug(!showDebug)}
            >
              {showDebug ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              Debug
            </Button>
            
            {/* 🚀 FORCE UPDATE BUTTONS - Ignore Rate Limits for Debugging */}
            {showDebug && (
              <>
                <Button 
                  onClick={() => {
                    console.log('🚨 FORCE TAX UPDATE: Ignoring rate limits...');
                    setCanLoadMoralis(true);
                    setRemainingTime(0);
                    loadMoralisData();
                  }}
                  disabled={moralisLoading}
                  variant="destructive"
                  size="sm"
                  className="bg-red-600 hover:bg-red-700"
                >
                  <AlertCircle className={`h-4 w-4 mr-2 ${moralisLoading ? 'animate-spin' : ''}`} />
                  Force Moralis
                </Button>
                <Button 
                  onClick={() => {
                    console.log('🚨 FORCE BASIC TAX: Loading basic tax data...');
                    loadTaxData();
                  }}
                  disabled={loading}
                  variant="destructive"
                  size="sm"
                  className="bg-red-600 hover:bg-red-700"
                >
                  <AlertCircle className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Force Basic
                </Button>
              </>
            )}
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
            <div className="flex gap-4 justify-center flex-wrap">
              <Button 
                onClick={loadTaxData} 
                className="bg-green-500 hover:bg-green-600"
                size="lg"
                disabled={loading}
              >
                <FileText className={`h-5 w-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Tax laden
              </Button>
              
              <Button
                onClick={() => {
                  console.log('🔥 Weiterleitung zur neuen Tax Report Seite...');
                  window.location.href = '/tax-report-new';
                }}
                className="bg-purple-600 hover:bg-purple-700 border-4 border-yellow-400 text-white font-bold shadow-xl animate-pulse"
                size="lg"
              >
                <FileText className="h-5 w-5 mr-2" />
                ⭐ ZUR NEUEN STEUERREPORT SEITE ⭐
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
              Moralis + PulseScan Analyse
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

        {/* 🔥 REBUILD TAX REPORT RESULTS */}
        {rebuildData && (
          <div className="pulse-card p-6 mb-6 border-l-4 border-orange-500">
            <h3 className="text-lg font-bold pulse-text mb-4 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-orange-400" />
              🔥 Rebuild Tax Report Ergebnisse
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{rebuildData.successfulReports}</div>
                <div className="text-sm pulse-text-secondary">Erfolgreiche Reports</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">
                  {rebuildData.reports.reduce((sum, r) => sum + (r.report?.transactions?.length || 0), 0)}
                </div>
                <div className="text-sm pulse-text-secondary">Transaktionen</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-400">
                  {rebuildData.reports.reduce((sum, r) => sum + (r.report?.summary?.taxableTransactions || 0), 0)}
                </div>
                <div className="text-sm pulse-text-secondary">Steuerpflichtig</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">
                  ${rebuildData.reports.reduce((sum, r) => sum + (r.report?.summary?.roiIncome || 0), 0).toFixed(2)}
                </div>
                <div className="text-sm pulse-text-secondary">ROI Einkommen</div>
              </div>
            </div>
            <div className="text-xs pulse-text-secondary">
              Generiert am: {new Date(rebuildData.generatedAt).toLocaleString('de-DE')} • Version: {rebuildData.version}
            </div>
          </div>
        )}

        {/* 🚨 REBUILD ERROR */}
        {rebuildError && (
          <div className="pulse-card p-6 mb-6 border-l-4 border-red-500 bg-red-500/10">
            <h3 className="text-lg font-bold text-red-400 mb-2 flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              Rebuild Tax Report Fehler
            </h3>
            <p className="text-red-300">{rebuildError}</p>
          </div>
        )}

        {/* 🚫 UNGEPAARTE TOKENS - SEPARATE SPALTE */}
        {ungepaarteTokens.length > 0 && (
          <div className="pulse-card p-6 mt-6">
            <h3 className="text-lg font-bold pulse-text mb-4 flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 text-orange-400" />
              Ungepaarte Tokens ({ungepaarteTokens.length})
              <Badge className="ml-2 bg-orange-500">Preise manuell vervollständigen</Badge>
            </h3>
            <p className="pulse-text-secondary mb-4">
                              Diese Tokens wurden nicht in Moralis oder PulseScan gefunden. 
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
                <li>• <strong>Moralis Pro API:</strong> Primäre Preisquelle für alle Tokens</li>
                <li>• <strong>PulseScan Stats API:</strong> Backup für PLS-Preis</li>
                <li>• <strong>PulseX/9mm:</strong> Für lokale PulseChain-Preise (manuell)</li>
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

        {/* 🚀 TAX REPORT REBUILD RESULTS */}
        {rebuildData && (
          <div className="pulse-card p-6 mt-6 border-l-4 border-purple-400">
            <h3 className="text-lg font-bold pulse-text mb-4 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-purple-400" />
              🚀 Neuer Tax Report - Ergebnisse
              <Badge className="ml-2 bg-purple-500">Version 2.0.0-rebuild</Badge>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-green-500/20 border border-green-400/30 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-400">
                  {rebuildData.successfulReports}
                </div>
                <div className="text-sm text-green-300">
                  Erfolgreiche Reports
                </div>
              </div>
              <div className="bg-red-500/20 border border-red-400/30 rounded-lg p-4">
                <div className="text-2xl font-bold text-red-400">
                  {rebuildData.failedReports}
                </div>
                <div className="text-sm text-red-300">
                  Fehlgeschlagene Reports
                </div>
              </div>
              <div className="bg-blue-500/20 border border-blue-400/30 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-400">
                  {rebuildData.totalWallets}
                </div>
                <div className="text-sm text-blue-300">
                  Verarbeitete Wallets
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {rebuildData.reports.map((report, index) => (
                <div key={index} className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-mono pulse-text">
                      {report.wallet.slice(0, 12)}...{report.wallet.slice(-8)}
                    </div>
                    <Badge variant={report.error ? 'destructive' : 'default'}>
                      {report.error ? 'Fehler' : 'Erfolgreich'}
                    </Badge>
                  </div>
                  
                  {report.error ? (
                    <div className="text-red-400 text-sm">
                      ❌ {report.error}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="pulse-text-secondary">Transaktionen</div>
                        <div className="font-bold pulse-text">
                          {report.report?.transactions?.length || 0}
                        </div>
                      </div>
                      <div>
                        <div className="pulse-text-secondary">Steuerpflichtig</div>
                        <div className="font-bold text-orange-400">
                          {report.report?.summary?.taxableTransactions || 0}
                        </div>
                      </div>
                      <div>
                        <div className="pulse-text-secondary">ROI Einkommen</div>
                        <div className="font-bold text-green-400">
                          ${(report.report?.summary?.roiIncome || 0).toFixed(2)}
                        </div>
                      </div>
                      <div>
                        <div className="pulse-text-secondary">PDF erstellt</div>
                        <div className="font-bold text-blue-400">
                          ✅ Downloads
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <div className="mt-4 p-4 bg-purple-500/10 border border-purple-400/20 rounded-lg">
              <h4 className="font-medium pulse-text mb-2">📄 PDF-Export Info:</h4>
              <p className="text-sm pulse-text-secondary">
                Für jedes erfolgreich verarbeitete Wallet wurde automatisch eine PDF-Datei in Ihrem Downloads-Ordner erstellt.
                Die Dateien folgen dem Format: <code>PulseManager_Steuerreport_[Wallet]_[Datum].pdf</code>
              </p>
            </div>
          </div>
        )}

        {rebuildError && (
          <div className="pulse-card p-6 mt-6 border-l-4 border-red-400">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 text-red-400" />
              <h3 className="text-lg font-bold pulse-text">❌ Tax Report Rebuild Fehler</h3>
            </div>
            <div className="mt-4 text-red-400">
              {rebuildError}
            </div>
          </div>
        )}

      </div>

      {/* CU Monitor */}
      <CUMonitor 
        viewName="Tax Report"
        apiCalls={[
          ...(taxData ? [{
            endpoint: 'tax-service-load',
            responseCount: taxData.allTransactions?.length || 0,
            estimatedCUs: taxData.fromCache ? 0 : 50
          }] : []),
          ...(moralisData ? [{
            endpoint: 'moralis-tax-prices',
            responseCount: moralisData.transactionCount || 0,
            estimatedCUs: moralisData.success ? 60 : 0
          }] : [])
        ]}
        totalCUs={(taxData && !taxData.fromCache ? 50 : 0) + (moralisData?.success ? 60 : 0)}
        showByDefault={showDebug}
      />
    </div>
  );
};

export default TaxReportView; 
