import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  TrendingUp, 
  TrendingDown, 
  RefreshCw, 
  ExternalLink, 
  DollarSign,
  Calendar,
  Coins,
  BarChart3,
  AlertCircle
} from 'lucide-react';
import { dbService } from '@/lib/dbService';
import { supabase } from '@/lib/supabaseClient';
import WalletBalanceService from '@/lib/walletBalanceService';
import WalletParser from '@/services/walletParser';
import { PulseWatchService } from '@/services/pulseWatchService';
import { TokenPriceService } from '@/services/tokenPriceService';
import { TransactionHistoryService } from '@/services/TransactionHistoryService';
import { TaxExportService } from '@/services/TaxExportService';
import CentralDataService from '@/services/CentralDataService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const ROITrackerView = () => {
  const { user } = useAuth();
  const [portfolioData, setPortfolioData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');

  // Portfolio laden mit ROI CACHING
  const loadPortfolioData = async (forceRefresh = false) => {
    if (!user?.id) return;
    
    setLoading(true);
    setError(null);
    setStatusMessage('📊 Prüfe ROI Cache...');
    
    try {
      console.log('🔄 ROI TRACKER: Loading ROI data with caching');
      
      // 🚨 CACHE TEMPORARILY DISABLED für PulseScan API Testing
      console.log(`🔄 ROI CACHE DISABLED: Testing PulseScan API (forceRefresh: ${forceRefresh})`);
      
      setStatusMessage('🚀 Lade ROI-Daten (kann 1-2 Minuten dauern)...');
      
      // 🔍 SCHRITT 2: ROI Laden mit includeROI=true
      const data = await CentralDataService.loadCompletePortfolio(user.id, { 
        includeROI: true, 
        includeTax: false // Nur ROI für ROI Tracker
      });
      
      if (data.isLoaded) {
        // Format für ROI Tracker
        const roiData = {
          success: true,
          isLoaded: true,
          userId: user.id,
          transactions: data.roiTransactions || [],
          dailyROI: data.dailyROI || 0,
          weeklyROI: data.weeklyROI || 0,
          monthlyROI: data.monthlyROI || 0,
          totalValue: data.totalValue || 0,
          tokenCount: data.tokenCount || 0,
          apiCallsUsed: data.apiCalls || 0,
          source: data.dataSource || 'central_data_service',
          lastUpdated: data.lastUpdated || new Date().toISOString(),
          fromCache: false
        };
        
        setPortfolioData({
          ...roiData,
          roiTransactions: roiData.transactions
        });
        
        // 💾 SCHRITT 3: DATABASE PERSISTENT CACHE für 2h speichern
        try {
          const { DatabasePersistentCache } = await import('@/services/DatabasePersistentCache');
          await DatabasePersistentCache.saveROITrackerData(user.id, roiData);
          console.log(`💾 ROI DB: Saved for user ${user.id}`);
        } catch (cacheError) {
          console.warn(`⚠️ ROI DB SAVE: ${cacheError.message}`);
        }

        // 💾 SCHRITT 3.5: FALLBACK - Session Cache speichern
        const { GlobalCacheService } = await import('@/services/GlobalCacheService');
        GlobalCacheService.saveROITrackerData(user.id, roiData);
        
        setStatusMessage(`✅ ROI LOADED: ${roiData.transactions.length} Transaktionen, $${roiData.monthlyROI} monthly (${data.apiCalls} API calls)`);
        console.log('✅ ROI TRACKER: ROI data loaded successfully');
        
      } else {
        setError(data.error);
        setStatusMessage(`❌ Fehler: ${data.error}`);
      }
      
    } catch (error) {
      console.error('💥 ROI TRACKER: Error loading ROI data:', error);
      setError(error.message);
      setStatusMessage(`💥 Fehler beim Laden: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Initiales Laden
  // ❌ EMERGENCY DISABLED: Auto-loading komplett deaktiviert für Kostenreduktion
  // useEffect(() => {
  //   loadPortfolioData();
  //   
  //   // Auto-refresh alle 5 Minuten
  //   const interval = setInterval(loadPortfolioData, 5 * 60 * 1000);
  //   return () => clearInterval(interval);
  // }, [user?.id]);

  // Format Funktionen
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value || 0);
  };

  const formatCrypto = (value, symbol) => {
    const formatted = (value || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    });
    return `${formatted} ${symbol}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // ROI-Projekt-Erkennung basierend auf PulseWatch
  const getROIProjectInfo = (tx) => {
    const symbol = tx.tokenSymbol?.toUpperCase();
    const name = tx.tokenName?.toLowerCase() || '';
    const amount = tx.amount || 0;
    
    // Bekannte ROI-Projekte von PulseWatch
    const roiProjects = {
      'WPLS': { name: 'GAS Money', color: 'bg-green-500', icon: '⛽' },
      'HEX': { name: 'HEX Staking', color: 'bg-red-500', icon: '🔥' },
      'PLSX': { name: 'PulseX Rewards', color: 'bg-blue-500', icon: '💎' },
      'INC': { name: 'Incentive', color: 'bg-purple-500', icon: '🎯' },
      'LOAN': { name: 'Lending', color: 'bg-yellow-500', icon: '🏦' },
      'DAI': { name: 'Stablecoin Yield', color: 'bg-orange-500', icon: '💰' },
      'USDC': { name: 'Stablecoin Yield', color: 'bg-blue-400', icon: '💰' },
      'WGEP': { name: 'PRINTER', color: 'bg-pink-500', icon: '🖨️' },
      '🖨️': { name: 'PRINTER', color: 'bg-pink-500', icon: '🖨️' }
    };
    
    // Spezielle Projekt-Erkennung basierend auf Transaktionsmustern
    if (amount > 1000 && symbol === 'WPLS') {
      return { name: 'REMEMBER REMEMBER THE 5TH OF NOVEMBER', color: 'bg-yellow-600', icon: '🎭' };
    }
    
    if (amount < 10 && (symbol === 'FINVESTA' || name.includes('finvesta'))) {
      return { name: 'MISSOR', color: 'bg-pink-600', icon: '🎯' };
    }
    
    if (name.includes('treasury') || symbol === 'TR') {
      return { name: 'TREASURY BILL', color: 'bg-indigo-500', icon: '🏛️' };
    }
    
    return roiProjects[symbol] || { name: 'ROI Earnings', color: 'bg-gray-500', icon: '💎' };
  };

  // Fallback für leere Daten
  if (!user?.id) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Anmeldung erforderlich</h3>
            <p className="text-gray-600">Bitte melden Sie sich an, um Ihr ROI-Portfolio zu verwalten.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header mit Status */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">ROI Tracker</h1>
          <p className="text-gray-600">Echte ROI-Daten von PulseChain API</p>
        </div>
        
        <Button 
          onClick={loadPortfolioData}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Lade...' : 'Aktualisieren'}
        </Button>
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
              <p className="font-medium">Fehler beim Laden der Daten</p>
            </div>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Portfolio Overview Cards */}
      {portfolioData && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Total Portfolio Value */}
            <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">Portfolio Wert</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(portfolioData.totalValue)}
                    </p>
                    <p className="text-blue-200 text-sm">
                      {portfolioData.tokenCount} Tokens
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-blue-200" />
                </div>
              </CardContent>
            </Card>

            {/* Daily ROI */}
            <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium">24h ROI</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(portfolioData.dailyROI)}
                    </p>
                    <p className="text-green-200 text-sm">
                      Letzte 24 Stunden
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-200" />
                </div>
              </CardContent>
            </Card>

            {/* Monthly ROI */}
            <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm font-medium">30 Tage ROI</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(portfolioData.monthlyROI)}
                    </p>
                    <p className="text-orange-200 text-sm">
                      Letzte 30 Tage
                    </p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-orange-200" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 24h Earnings Summary - PulseWatch Style */}
          <Card className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                24h Earnings
                <Badge variant="outline" className="ml-auto bg-white/20 text-white border-white/30">
                  Total: {formatCurrency(portfolioData.dailyROI)}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-purple-100">PulseChain</p>
                  <p className="text-xl font-bold">{formatCurrency(portfolioData.dailyROI * 0.8)}</p>
                </div>
                <div>
                  <p className="text-purple-100">Ethereum</p>
                  <p className="text-xl font-bold">{formatCurrency(portfolioData.dailyROI * 0.2)}</p>
                </div>
              </div>
              <div className="mt-4 flex justify-between items-center">
                <span className="text-purple-200 text-sm">
                  {portfolioData.roiTransactions.filter(tx => {
                    const txTime = new Date(tx.timestamp);
                    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                    return txTime >= oneDayAgo;
                  }).length} Transaktionen heute
                </span>
                <div className="flex space-x-2">
                  <Badge variant="outline" className="bg-white/10 text-white border-white/30 text-xs">Cards</Badge>
                  <Badge variant="outline" className="bg-white/10 text-white border-white/30 text-xs">Table</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent ROI Transactions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                Aktuelle ROI-Transaktionen
                <Badge variant="outline" className="ml-2">
                  {portfolioData.roiTransactions.length} Transaktionen
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {portfolioData.roiTransactions.length > 0 ? (
                <div className="space-y-3">
                  {portfolioData.roiTransactions.slice(0, 15).map((tx, index) => {
                    const projectInfo = getROIProjectInfo(tx);
                    
                    return (
                    <div key={`${tx.txHash}-${index}`} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className={`w-10 h-10 ${projectInfo.color} rounded-full flex items-center justify-center text-white`}>
                          <span className="text-lg">{projectInfo.icon}</span>
                        </div>
                        
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-lg">{tx.tokenSymbol}</span>
                            <Badge variant="outline" className={`text-xs text-white border-white/30 ${projectInfo.color}`}>
                              {projectInfo.name}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600">
                            {tx.tokenName || 'Token Rewards'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {(() => {
                              const now = new Date();
                              const txTime = new Date(tx.timestamp);
                              const diffHours = Math.floor((now - txTime) / (1000 * 60 * 60));
                              
                              if (diffHours < 1) return 'vor wenigen Minuten';
                              if (diffHours === 1) return '1 Stunde her';
                              if (diffHours < 24) return `${diffHours} Stunden her`;
                              
                              const diffDays = Math.floor(diffHours / 24);
                              if (diffDays === 1) return '1 Tag her';
                              return `${diffDays} Tage her`;
                            })()}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="font-bold text-green-600 text-lg">
                          +{formatCurrency(tx.value)}
                        </div>
                        <div className="text-sm text-gray-600">
                          +{formatCrypto(tx.amount, tx.tokenSymbol)}
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          {tx.txHash && (
                            <a 
                              href={tx.chainId === 369 || tx.chain === 'pulsechain' ? 
                                `https://scan.pulsechain.com/tx/${tx.txHash}` : 
                                `https://etherscan.io/tx/${tx.txHash}`
                              }
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:text-blue-700 transition-colors"
                              title={tx.chainId === 369 || tx.chain === 'pulsechain' ? 
                                "PulseChain Explorer" : "Etherscan"
                              }
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          )}
                          {tx.tokenAddress && (
                            <a 
                              href={tx.chainId === 369 || tx.chain === 'pulsechain' ? 
                                `https://scan.pulsechain.com/token/${tx.tokenAddress}` : 
                                `https://etherscan.io/token/${tx.tokenAddress}`
                              }
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-green-500 hover:text-green-700 transition-colors"
                              title="Token Contract"
                            >
                              <BarChart3 className="h-4 w-4" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                    );
                  })}
                  
                  {portfolioData.roiTransactions.length > 15 && (
                    <div className="text-center pt-4">
                      <p className="text-sm text-gray-500">
                        ... und {portfolioData.roiTransactions.length - 15} weitere ROI-Transaktionen
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <TrendingUp className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">Keine ROI-Transaktionen gefunden</h3>
                  <p className="text-gray-500">
                    ROI-Transaktionen werden automatisch aus der PulseChain API geladen.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Token Holdings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-blue-500" />
                Top Token Holdings
                <Badge variant="outline" className="ml-2">
                  {portfolioData?.tokens?.length || 0} Tokens
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(portfolioData?.tokens?.length || 0) > 0 ? (
                <div className="space-y-2">
                  {(portfolioData?.tokens || []).slice(0, 10).map((token, index) => (
                    <div key={`${token.symbol}-${token.contractAddress}-${index}`} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="text-sm font-mono text-gray-500 w-8">
                          #{token.holdingRank}
                        </div>
                        
                        <div>
                          <div className="font-semibold">{token.symbol}</div>
                          <div className="text-sm text-gray-600">
                            {token.name || 'Unknown Token'}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="font-semibold">
                          {formatCurrency(token.value)}
                        </div>
                        <div className="text-sm text-gray-600">
                          {formatCrypto(token.balance, token.symbol)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {token.percentageOfPortfolio.toFixed(1)}% von Portfolio
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Coins className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">Keine Tokens gefunden</h3>
                  <p className="text-gray-500">
                    Fügen Sie Wallets hinzu, um Token-Holdings zu sehen.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Empty State - Kein Portfolio geladen */}
      {!portfolioData && !loading && !error && (
        <Card>
          <CardContent className="p-12 text-center">
            <BarChart3 className="h-16 w-16 mx-auto text-gray-300 mb-6" />
            <h3 className="text-xl font-semibold text-gray-600 mb-4">ROI Tracker bereit</h3>
            <p className="text-gray-500 mb-6">
              Klicken Sie auf "Aktualisieren", um Ihre ROI-Daten zu laden.
            </p>
            <Button onClick={loadPortfolioData}>
              Portfolio laden
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ROITrackerView;