// 🚀 ROI TRACKER VIEW - MORALIS V2 DEFI INTEGRATION 
// Echte DeFi ROI-Daten von Moralis Enterprise APIs

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
  TrendingUp, 
  Calendar,
  Coins,
  AlertCircle,
  ExternalLink,
  DollarSign,
  Clock,
  Eye,
  EyeOff,
  Activity,
  Target,
  Zap,
  PieChart,
  BarChart3
} from 'lucide-react';
import { formatCurrency, formatNumber, formatPercentage } from '@/lib/utils';
import { usePortfolioContext } from '@/contexts/PortfolioContext';
import CUMonitor from '@/components/ui/CUMonitor';
import { MoralisV2Service } from '@/services/MoralisV2Service';
import { ROIDetectionService } from '@/services/ROIDetectionService';
import { useAuth } from '@/contexts/AuthContext';

const ROITrackerView = () => {
  const { user } = useAuth();
  
  // 🚀 GLOBAL PORTFOLIO CONTEXT - Shared data between views
  const {
    portfolioData,
    loading: portfolioLoading,
    error: portfolioError,
    lastUpdate: portfolioLastUpdate,
    loadPortfolioData,
    canRefresh,
    remainingTime,
    hasData: hasPortfolioData,
    isCached
  } = usePortfolioContext();
  
  // 🎯 ROI-SPECIFIC STATE (DeFi data nur für ROI)
  const [defiData, setDefiData] = useState(null);
  const [roiDetectionData, setROIDetectionData] = useState(null);
  const [defiLoading, setDefiLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastDefiUpdate, setLastDefiUpdate] = useState(null);
  const [timeFrame, setTimeFrame] = useState('monthly');
  const [showDebug, setShowDebug] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // overview, defi, positions, detection

  // 🚀 LOAD DEFI DATA ONLY - Portfolio comes from Global Context
  const loadDefiData = async () => {
    if (!user?.id || !hasPortfolioData) {
      console.log('⚠️ Cannot load DeFi data: No user or portfolio data');
      return;
    }
    
    try {
      setDefiLoading(true);
      setError(null);
      
      console.log('🔄 ROI TRACKER: Loading DeFi data using Global Portfolio Context...');
      
             console.log('📊 ROI TRACKER: Using Global Portfolio Data:', {
        success: portfolioData?.success,
        isLoaded: portfolioData?.isLoaded,
        fromCache: isCached,
        totalValue: portfolioData?.totalValue,
        tokenCount: portfolioData?.tokenCount
      });
      
      // 2. 🔥 MULTI-CHAIN WALLET SELECTION für Moralis DeFi APIs
      const wallets = portfolioData?.wallets || [];
      console.log('📱 Available wallets:', wallets.map(w => ({ address: w.address?.slice(0, 8) + '...', chain: w.chain })));
      
      // Suche Ethereum-Wallet ODER verwende PulseChain-Wallet für Ethereum DeFi Test
      let primaryWallet = wallets.find(w => w.chain === 'ethereum');
      
      if (!primaryWallet && wallets.length > 0) {
        // 🔄 FALLBACK: Verwende PulseChain-Wallet für Ethereum DeFi Test
        primaryWallet = wallets.find(w => w.chain === 'pulsechain') || wallets[0];
        console.log('🔄 FALLBACK: Using PulseChain wallet for Ethereum DeFi testing');
      }
      
      let defiResponse = null;
      let roiDetectionResponse = null;
      
      if (primaryWallet?.address) {
        console.log(`🚀 Loading DeFi data for wallet: ${primaryWallet.address} (Original chain: ${primaryWallet.chain})`);
        
        try {
          // 3. Parallel: DeFi Summary und ROI Detection (IMMER mit Ethereum Chain ID)
          const [defiSummary, defiPositions, roiDetection] = await Promise.all([
            MoralisV2Service.getDefiSummary(primaryWallet.address, '1').catch(err => {
              console.log('DeFi Summary Error:', err.message);
              return { 
                success: false, 
                error: err.message, 
                originalWalletChain: primaryWallet.chain,
                // Mock data for testing
                result: {
                  active_protocols: '0',
                  total_positions: '0',
                  total_usd_value: '0',
                  total_unclaimed_usd_value: '0'
                }
              };
            }),
            MoralisV2Service.getDefiPositions(primaryWallet.address, '1').catch(err => {
              console.log('DeFi Positions Error:', err.message);
              return { 
                success: false, 
                error: err.message,
                originalWalletChain: primaryWallet.chain,
                // Mock data for testing
                result: [],
                positions: []
              };
            }),
            ROIDetectionService.detectROISources(primaryWallet.address, '1').catch(err => {
              console.log('ROI Detection Error:', err.message);
              return { 
                success: false, 
                error: err.message,
                originalWalletChain: primaryWallet.chain,
                // Mock data for testing
                sources: []
              };
            })
          ]);
          
          // Verbesserte DeFi Response mit besserer Fehlerbehandlung
          defiResponse = {
            summary: {
              ...defiSummary,
              roiAnalysis: {
                activeProtocols: defiSummary?.result?.active_protocols || 0,
                totalValue: parseFloat(defiSummary?.result?.total_usd_value || '0'),
                unclaimedValue: parseFloat(defiSummary?.result?.total_unclaimed_usd_value || '0'),
                roiPotential: parseFloat(defiSummary?.result?.total_unclaimed_usd_value || '0') > 100 ? 'high' : 'low'
              }
            },
            positions: {
              ...defiPositions,
              positions: defiPositions?.result || defiPositions?.positions || [],
              roiAnalysis: {
                totalPositions: (defiPositions?.result || defiPositions?.positions || []).length,
                totalDailyROI: 0,
                estimatedMonthlyROI: 0
              }
            },
            wallet: primaryWallet.address,
            originalChain: primaryWallet.chain,
            testedAsEthereum: true
          };
          
          roiDetectionResponse = roiDetection;
          
          console.log('🔥 MORALIS RESULTS:', {
            wallet: primaryWallet.address.slice(0, 8) + '...',
            originalChain: primaryWallet.chain,
            defiSummarySuccess: defiSummary.success,
            defiPositionsSuccess: defiPositions.success,
            roiDetectionSuccess: roiDetection.success,
            portfolioData: {
              totalValue: portfolioData?.totalValue || 0,
              monthlyROI: portfolioData?.monthlyROI || 0,
              dailyROI: portfolioData?.dailyROI || 0,
              weeklyROI: portfolioData?.weeklyROI || 0
            }
          });
        } catch (apiError) {
          console.error('API Error:', apiError);
          // Fallback mit Mock-Daten
          defiResponse = {
            summary: { 
              success: false, 
              error: apiError.message,
              roiAnalysis: {
                activeProtocols: 0,
                totalValue: 0,
                unclaimedValue: 0,
                roiPotential: 'low'
              }
            },
            positions: { 
              success: false, 
              positions: [],
              roiAnalysis: {
                totalPositions: 0,
                totalDailyROI: 0,
                estimatedMonthlyROI: 0
              }
            },
            wallet: primaryWallet.address,
            originalChain: primaryWallet.chain,
            testedAsEthereum: true
          };
        }
      } else {
        console.log('⚠️ No wallet address found for DeFi analysis');
        // Mock-Daten wenn keine Wallet
        defiResponse = {
          summary: { 
            success: false, 
            error: 'No wallet found',
            roiAnalysis: {
              activeProtocols: 0,
              totalValue: 0,
              unclaimedValue: 0,
              roiPotential: 'low'
            }
          },
          positions: { 
            success: false, 
            positions: [],
            roiAnalysis: {
              totalPositions: 0,
              totalDailyROI: 0,
              estimatedMonthlyROI: 0
            }
          },
          wallet: null,
          originalChain: null,
          testedAsEthereum: false
        };
      }
      
      // 💾 Store DeFi-specific data only (Portfolio comes from Global Context)
      setDefiData(defiResponse);
      setROIDetectionData(roiDetectionResponse);
      setLastDefiUpdate(new Date());
      
      console.log('✅ ROI TRACKER: DeFi data loaded', {
        portfolioROI: portfolioData?.monthlyROI || 0,
        portfolioValue: portfolioData?.totalValue || 0,
        defiPositions: defiResponse?.positions?.positions?.length || 0,
        roiSources: roiDetectionResponse?.sources?.length || 0,
        walletUsed: primaryWallet?.address?.slice(0, 8) + '...' || 'None',
        originalChain: primaryWallet?.chain || 'None',
        usingGlobalPortfolio: true
      });
      
    } catch (err) {
      console.error('💥 ROI TRACKER DeFi ERROR:', err);
      setError(err.message);
      
      // Set fallback DeFi data (Portfolio data remains from Global Context)
      setDefiData({
        summary: { success: false, error: err.message, roiAnalysis: { activeProtocols: 0, totalValue: 0, unclaimedValue: 0, roiPotential: 'low' } },
        positions: { success: false, positions: [], roiAnalysis: { totalPositions: 0, totalDailyROI: 0, estimatedMonthlyROI: 0 } }
      });
    } finally {
      setDefiLoading(false);
    }
  };

  // ❌ DISABLED FOR MORALIS PRO: No auto-loading to save API calls
  // Initial load removed - only manual loading via button
  // useEffect(() => {
  //   loadAllROIData();
  // }, [user?.id]);

  // ❌ DISABLED FOR MORALIS PRO: Auto-refresh removed to save costs
  // useEffect(() => {
  //   const interval = setInterval(loadAllROIData, 10 * 60 * 1000);
  //   return () => clearInterval(interval);
  // }, [user?.id]);

  // Loading states: Portfolio (global) + DeFi (local)
  const isLoading = portfolioLoading || defiLoading;

  // ❌ REMOVED: Manual loading screen - show normal UI instead

  if (error) {
    return (
      <div className="min-h-screen bg-black p-6">
        <div className="pulse-card max-w-lg mx-auto p-6 text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-400" />
          <h2 className="text-xl font-semibold mb-2 pulse-text">Fehler beim Laden der ROI-Daten</h2>
          <p className="pulse-text-secondary mb-4">{error}</p>
          <Button onClick={loadDefiData} className="bg-green-500 hover:bg-green-600">
            <RefreshCw className="h-4 w-4 mr-2" />
            DeFi-Daten erneut laden
          </Button>
        </div>
      </div>
    );
  }

  // BERECHNE KOMBINIERTE ROI-STATISTIKEN
  const getCombinedROIStats = () => {
    console.log('📊 Calculating ROI Stats:', { 
      portfolioData: portfolioData ? 'loaded' : 'null', 
      defiData: defiData ? 'loaded' : 'null' 
    });
    
    const portfolioROI = {
      daily: portfolioData?.dailyROI || 0,
      weekly: portfolioData?.weeklyROI || 0,
      monthly: portfolioData?.monthlyROI || 0
    };
    
    const defiROI = {
      daily: defiData?.positions?.roiAnalysis?.totalDailyROI || 0,
      weekly: (defiData?.positions?.roiAnalysis?.totalDailyROI || 0) * 7,
      monthly: defiData?.positions?.roiAnalysis?.estimatedMonthlyROI || 0
    };
    
    const totalROI = {
      daily: portfolioROI.daily + defiROI.daily,
      weekly: portfolioROI.weekly + defiROI.weekly,
      monthly: portfolioROI.monthly + defiROI.monthly
    };
    
    console.log('💰 ROI Calculation Result:', {
      portfolioROI,
      defiROI,
      totalROI,
      portfolioValue: portfolioData?.totalValue || 0
    });
    
    return { portfolioROI, defiROI, totalROI };
  };

  const roiStats = getCombinedROIStats();
  
  const getCurrentROI = () => {
    return roiStats.totalROI[timeFrame] || 0;
  };

  const getROIPercentage = () => {
    const totalValue = portfolioData?.totalValue || 0;
    const currentROI = getCurrentROI();
    return totalValue > 0 ? (currentROI / totalValue) * 100 : 0;
  };

  // Show empty state when no portfolio data available
  const showEmptyState = !isLoading && !hasPortfolioData && !portfolioError;

  const tabs = [
    { id: 'overview', label: 'Überblick', icon: PieChart },
    { id: 'defi', label: 'DeFi Positionen', icon: Target },
    { id: 'positions', label: 'ROI Quellen', icon: Zap },
    { id: 'detection', label: 'ROI Detection', icon: Activity }
  ];

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header mit Portfolio-Status */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold pulse-title">ROI Tracker</h1>
            <div className="flex items-center space-x-4 text-sm pulse-text-secondary">
              <span>💰 MORALIS PRO MODUS</span>
              <span className="text-green-400">✅ Globaler Portfolio-State</span>
              {hasPortfolioData && <span>Portfolio geladen: {portfolioData?.tokenCount || 0} Tokens</span>}
              {remainingTime > 0 && (
                <span className="text-yellow-400">⏱️ Nächstes Update in {remainingTime}s</span>
              )}
            </div>
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
            <div className="flex space-x-2">
              <Button 
                onClick={loadPortfolioData} 
                disabled={portfolioLoading || !canRefresh}
                variant="default"
                size="sm"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${portfolioLoading ? 'animate-spin' : ''}`} />
                Portfolio
                {remainingTime > 0 && (
                  <span className="ml-1 text-xs text-yellow-400">({remainingTime}s)</span>
                )}
              </Button>
              <Button 
                onClick={loadDefiData} 
                disabled={defiLoading || !hasPortfolioData}
                variant="outline"
                size="sm"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${defiLoading ? 'animate-spin' : ''}`} />
                DeFi
                {!hasPortfolioData && (
                  <span className="ml-1 text-xs text-red-400">(Portfolio zuerst)</span>
                )}
              </Button>
              {/* 🚀 COMBINED LOAD BUTTON for convenience */}
              <Button 
                onClick={loadCompleteROI}
                disabled={portfolioLoading || defiLoading || !canRefresh}
                variant="default"
                size="sm"
                className="bg-green-500 hover:bg-green-600"
              >
                <TrendingUp className={`h-4 w-4 mr-2 ${(portfolioLoading || defiLoading) ? 'animate-spin' : ''}`} />
                Komplett laden
              </Button>
            </div>
          </div>
        </div>

        {/* ERROR NOTICES: Nicht blockierend */}
        {portfolioError && (
          <div className="pulse-card p-4 mb-6 border-l-4 border-red-500">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 text-red-400" />
              <span className="pulse-text font-medium">Portfolio-Fehler (nicht blockierend)</span>
            </div>
            <p className="pulse-text-secondary text-sm mt-1">{portfolioError}</p>
          </div>
        )}

        {defiError && (
          <div className="pulse-card p-4 mb-6 border-l-4 border-orange-500">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 text-orange-400" />
              <span className="pulse-text font-medium">DeFi-Fehler (nicht blockierend)</span>
            </div>
            <p className="pulse-text-secondary text-sm mt-1">{defiError}</p>
          </div>
        )}

        {/* 🚫 REMOVED: Hässlicher "Portfolio-Daten laden" Kasten entfernt wie gewünscht */}

        {/* ROI DEBUG: Zeige warum keine ROI-Daten sichtbar */}
        {hasPortfolioData && !defiData && !defiLoading && !showEmptyState && (
          <div className="pulse-card p-6 mb-6 border-l-4 border-yellow-500">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 text-yellow-400" />
              <h3 className="text-lg font-bold pulse-text">⚠️ ROI-Daten Debug</h3>
            </div>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="pulse-text-secondary">Portfolio geladen:</span>
                <span className="text-green-400">✅ {portfolioData?.tokenCount || 0} Tokens</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="pulse-text-secondary">DeFi-Daten geladen:</span>
                <span className="text-red-400">❌ Noch nicht geladen</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="pulse-text-secondary">Transaktionen verfügbar:</span>
                <span className="text-gray-400">❓ Unbekannt (DeFi-Load erforderlich)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="pulse-text-secondary">ROI-Sources erkannt:</span>
                <span className="text-gray-400">❓ Unbekannt (DeFi-Load erforderlich)</span>
              </div>
            </div>
            <div className="mt-4 p-3 bg-blue-500/10 border border-blue-400/20 rounded">
              <p className="text-blue-400 text-sm">
                💡 <strong>Grund:</strong> Klicken Sie auf "DeFi" oder "Alles laden" um ROI-Analysen zu starten.
                Ohne DeFi-Daten können keine ROI-Quellen erkannt werden.
              </p>
            </div>
          </div>
        )}

        {/* DeFi LOADED BUT NO ROI DEBUG */}
        {hasPortfolioData && defiData && (!roiDetectionData?.sources || roiDetectionData.sources.length === 0) && (
          <div className="pulse-card p-6 mb-6 border-l-4 border-orange-500">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 text-orange-400" />
              <h3 className="text-lg font-bold pulse-text">📊 ROI-Detection Debug</h3>
            </div>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="pulse-text-secondary">DeFi Summary Erfolg:</span>
                <span className={defiData?.summary?.success ? "text-green-400" : "text-red-400"}>
                  {defiData?.summary?.success ? "✅ Ja" : "❌ Nein"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="pulse-text-secondary">DeFi Positionen:</span>
                <span className="text-blue-400">{defiData?.positions?.positions?.length || 0} gefunden</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="pulse-text-secondary">ROI-Quellen erkannt:</span>
                <span className="text-yellow-400">{roiDetectionData?.sources?.length || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="pulse-text-secondary">Wallet getestet:</span>
                <span className="text-purple-400">{defiData?.wallet?.slice(0, 8)}... ({defiData?.originalChain})</span>
              </div>
            </div>
            <div className="mt-4 p-3 bg-orange-500/10 border border-orange-400/20 rounded">
              <p className="text-orange-400 text-sm">
                💡 <strong>Grund für leere ROI:</strong> {
                  !defiData?.summary?.success ? "DeFi Summary API-Fehler" :
                  defiData?.positions?.positions?.length === 0 ? "Keine DeFi-Positionen gefunden" :
                  !roiDetectionData?.sources ? "ROI-Detection nicht ausgeführt" :
                  "Keine ROI-Quellen in DeFi-Positionen erkannt"
                }
              </p>
            </div>
          </div>
        )}

        {/* 🔥 SMART CACHE STATUS */}
        {portfolioData && (
          <div className="pulse-card p-4 mb-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Target className="h-5 w-5 mr-2 text-green-400" />
                <div>
                  <span className="pulse-text font-medium">
                    🚀 Smart Cache Status: {portfolioData?.fromCache ? 'CACHE HIT' : 'FRESH DATA'}
                  </span>
                  <p className="pulse-text-secondary text-sm">
                    Portfolio: {portfolioData ? '✅' : '❌'} • 
                    Source: {portfolioData?.fromCache ? '📦 Cache' : '🔄 API'} • 
                    API Calls: {portfolioData?.fromCache ? '0' : (portfolioData?.apiCalls || 'N/A')} • 
                    Value: ${(portfolioData?.totalValue || 0).toFixed(0)}
                  </p>
                </div>
              </div>
              {portfolioData?.fromCache ? (
                <Badge variant="outline" className="text-orange-400 border-orange-400">
                  📦 CACHED
                </Badge>
              ) : (
                <Badge variant="outline" className="text-cyan-400 border-cyan-400">
                  🔄 FRESH
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* 🔍 PRO PLAN ROI DEBUG INFORMATION */}
        {showDebug && (
          <div className="pulse-card p-6 mb-6 border-l-4 border-purple-500">
            <h3 className="flex items-center text-lg font-bold pulse-text mb-4">
              <Activity className="h-5 w-5 mr-2 text-purple-400" />
              🔍 ROI Tracker Pro Debug
            </h3>
            
            {/* CU TRACKING FOR ROI */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-6">
              <div className="p-3 bg-green-500/10 border border-green-400/20 rounded">
                <span className="font-medium text-green-400">💰 Portfolio CUs:</span>
                <p className="text-white font-mono text-lg">
                  {portfolioData?.apiCalls || 0} CUs
                </p>
                <p className="text-xs text-green-400">
                  {portfolioLastUpdate ? 'Portfolio geladen' : 'Nicht geladen'}
                </p>
              </div>
              
              <div className="p-3 bg-blue-500/10 border border-blue-400/20 rounded">
                <span className="font-medium text-blue-400">🎯 DeFi CUs:</span>
                <p className="text-white font-mono text-lg">
                  0 CUs
                </p>
                <p className="text-xs text-blue-400">
                  Enterprise deaktiviert
                </p>
              </div>
              
              <div className="p-3 bg-purple-500/10 border border-purple-400/20 rounded">
                <span className="font-medium text-purple-400">📅 Letzter ROI Cache:</span>
                <p className="text-white font-mono">
                  {lastDefiUpdate ? lastDefiUpdate.toLocaleTimeString('de-DE') : 'Nie'}
                </p>
                <p className="text-xs text-purple-400">
                  {defiData ? 'DeFi analysiert' : 'Keine DeFi-Daten'}
                </p>
              </div>
              
              <div className="p-3 bg-orange-500/10 border border-orange-400/20 rounded">
                <span className="font-medium text-orange-400">🎯 ROI Herkunft:</span>
                <p className="text-white">
                  {portfolioData?.roiTransactions?.length > 0 ? '📊 Transaktionen' : '❌ Keine ROI'}
                </p>
                <p className="text-xs text-orange-400">
                  Transaction-based ROI
                </p>
              </div>
            </div>
            
            {/* ENTERPRISE FEATURES DISABLED INFO */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
              <div className="p-3 bg-red-500/10 border border-red-400/20 rounded">
                <span className="font-medium text-red-400">❌ Enterprise Features deaktiviert:</span>
                <ul className="text-xs text-red-400 mt-2 space-y-1">
                  <li>• defi-summary (0 CUs gespart)</li>
                  <li>• defi-positions (0 CUs gespart)</li>
                  <li>• wallet-stats (0 CUs gespart)</li>
                </ul>
              </div>
              
              <div className="p-3 bg-green-500/10 border border-green-400/20 rounded">
                <span className="font-medium text-green-400">✅ Pro Plan ROI Detection:</span>
                <ul className="text-xs text-green-400 mt-2 space-y-1">
                  <li>• Transaction-based Analysis</li>
                  <li>• Known Minter Detection</li>
                  <li>• Transfer Pattern Recognition</li>
                </ul>
              </div>
            </div>
            
            {/* ROI STATS DEBUG */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
              <div>
                <span className="font-medium pulse-text-secondary">Portfolio ROI ({timeFrame}):</span>
                <p className="pulse-text font-mono text-green-400">{formatCurrency(roiStats.portfolioROI[timeFrame])}</p>
              </div>
              <div>
                <span className="font-medium pulse-text-secondary">DeFi ROI ({timeFrame}):</span>
                <p className="pulse-text font-mono text-blue-400">{formatCurrency(roiStats.defiROI[timeFrame])}</p>
              </div>
              <div>
                <span className="font-medium pulse-text-secondary">Gesamt ROI ({timeFrame}):</span>
                <p className="pulse-text font-mono text-purple-400">{formatCurrency(getCurrentROI())}</p>
              </div>
              <div>
                <span className="font-medium pulse-text-secondary">ROI Percentage:</span>
                <p className="pulse-text font-mono text-orange-400">{formatPercentage(getROIPercentage())}</p>
              </div>
            </div>
            
            {/* RAW DATA BUTTONS */}
            <div className="flex justify-between items-center pt-4 border-t border-white/10">
              <div className="text-xs text-gray-400">
                💡 ROI Debug: Enterprise-Features deaktiviert für Pro Plan Cost Reduction
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    console.log('🔍 PORTFOLIO ROI DATA:', portfolioData);
                    alert('Portfolio ROI-Daten in Konsole geloggt (F12 → Console)');
                  }}
                  className="text-xs"
                >
                  📊 Portfolio Raw
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    console.log('🔍 DEFI ROI DATA:', defiData);
                    alert('DeFi ROI-Daten in Konsole geloggt (F12 → Console)');
                  }}
                  className="text-xs"
                >
                  🎯 DeFi Raw
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Portfolio & DeFi Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="pulse-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm pulse-text-secondary">Portfolio ROI</p>
                <p className="text-xl font-bold text-green-400">
                  {formatCurrency(roiStats.portfolioROI[timeFrame])}
                </p>
                <p className="text-xs pulse-text-secondary">
                  {portfolioData?.roiTransactions?.length || 0} Transaktionen
                </p>
              </div>
              <BarChart3 className="h-6 w-6 text-green-400" />
            </div>
          </div>
          
          <div className="pulse-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm pulse-text-secondary">🔥 Moralis DeFi ROI</p>
                <p className="text-xl font-bold text-blue-400">
                  {formatCurrency(roiStats.defiROI[timeFrame])}
                </p>
                <p className="text-xs pulse-text-secondary">
                  ${(defiData?.summary?.roiAnalysis?.unclaimedValue || 0).toFixed(2)} unclaimed
                </p>
              </div>
              <Target className="h-6 w-6 text-blue-400" />
            </div>
          </div>
          
          <div className="pulse-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm pulse-text-secondary">Gesamt ROI</p>
                <p className="text-xl font-bold text-purple-400">
                  {formatCurrency(getCurrentROI())}
                </p>
                <p className="text-xs pulse-text-secondary">
                  {formatPercentage(getROIPercentage())} des Portfolios
                </p>
              </div>
              <TrendingUp className="h-6 w-6 text-purple-400" />
            </div>
          </div>
          
          <div className="pulse-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm pulse-text-secondary">DeFi Positionen</p>
                <p className="text-xl font-bold text-orange-400">
                  {defiData?.positions?.roiAnalysis?.totalPositions || 0}
                </p>
                <p className="text-xs pulse-text-secondary">
                  ${(defiData?.summary?.roiAnalysis?.totalValue || 0).toFixed(0)} DeFi Value
                </p>
              </div>
              <Coins className="h-6 w-6 text-orange-400" />
            </div>
          </div>
        </div>

        {/* Time Frame Selector */}
        {!showEmptyState && (
          <div className="flex justify-center mb-6">
            <div className="pulse-card p-1 flex">
              {['daily', 'weekly', 'monthly'].map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeFrame(tf)}
                  className={`px-4 py-2 rounded-lg transition-all ${
                    timeFrame === tf 
                      ? 'bg-green-500 text-white' 
                      : 'pulse-text hover:bg-white/5'
                  }`}
                >
                  {tf === 'daily' ? 'Täglich' : tf === 'weekly' ? 'Wöchentlich' : 'Monatlich'}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        {!showEmptyState && (
          <div className="flex justify-center mb-6">
            <div className="pulse-card p-1 flex">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                    activeTab === tab.id 
                      ? 'bg-blue-500 text-white' 
                      : 'pulse-text hover:bg-white/5'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* TAB CONTENT - Only show when data is loaded */}
        {!showEmptyState && (
          <>
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* ROI Summary */}
            <div className="pulse-card p-6">
              <h3 className="flex items-center text-lg font-bold pulse-title mb-4">
                <DollarSign className="h-5 w-5 mr-2 text-green-400" />
                {timeFrame === 'daily' ? 'Täglicher' : timeFrame === 'weekly' ? 'Wöchentlicher' : 'Monatlicher'} ROI Überblick
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-400">{formatCurrency(getCurrentROI())}</p>
                  <p className="text-sm pulse-text-secondary">Gesamt ROI</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-blue-400">{formatPercentage(getROIPercentage())}</p>
                  <p className="text-sm pulse-text-secondary">ROI %</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-purple-400">
                    {(portfolioData?.roiTransactions?.length || 0) + (defiData?.positions?.positions?.length || 0)}
                  </p>
                  <p className="text-sm pulse-text-secondary">Quellen</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-orange-400">
                    {formatCurrency(portfolioData?.totalValue || 0)}
                  </p>
                  <p className="text-sm pulse-text-secondary">Portfolio</p>
                </div>
              </div>
            </div>

            {/* ROI Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="pulse-card p-6">
                <h4 className="text-lg font-bold pulse-title mb-4">Portfolio ROI Breakdown</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="pulse-text-secondary">Transaktionen</span>
                    <span className="pulse-text font-medium">{formatCurrency(roiStats.portfolioROI[timeFrame])}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="pulse-text-secondary">DeFi Positionen</span>
                    <span className="pulse-text font-medium">{formatCurrency(roiStats.defiROI[timeFrame])}</span>
                  </div>
                  <div className="border-t border-white/10 pt-2 flex justify-between">
                    <span className="pulse-text font-medium">Gesamt</span>
                    <span className="pulse-text font-bold text-green-400">{formatCurrency(getCurrentROI())}</span>
                  </div>
                </div>
              </div>

              <div className="pulse-card p-6">
                <h4 className="text-lg font-bold pulse-title mb-4">Moralis DeFi Status</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="pulse-text-secondary">Aktive Protokolle</span>
                    <Badge variant="outline" className="text-green-400 border-green-400">
                      {defiData?.summary?.roiAnalysis?.activeProtocols || 0}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="pulse-text-secondary">DeFi Wert</span>
                    <span className="pulse-text font-medium">
                      {formatCurrency(defiData?.summary?.roiAnalysis?.totalValue || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="pulse-text-secondary">Unclaimed Rewards</span>
                    <span className="pulse-text font-medium text-green-400">
                      {formatCurrency(defiData?.summary?.roiAnalysis?.unclaimedValue || 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* DEFI TAB */}
        {activeTab === 'defi' && (
          <div className="space-y-6">
            {defiData?.summary?.success ? (
              <>
                {/* DeFi Summary */}
                <div className="pulse-card p-6">
                  <h3 className="text-lg font-bold pulse-title mb-4">DeFi Portfolio Summary</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-400">
                        {defiData.summary.roiAnalysis.activeProtocols}
                      </p>
                      <p className="text-sm pulse-text-secondary">Aktive Protokolle</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-400">
                        {formatCurrency(defiData.summary.roiAnalysis.totalValue)}
                      </p>
                      <p className="text-sm pulse-text-secondary">DeFi Wert</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-400">
                        {formatCurrency(defiData.summary.roiAnalysis.unclaimedValue)}
                      </p>
                      <p className="text-sm pulse-text-secondary">Unclaimed</p>
                    </div>
                    <div className="text-center">
                      <Badge variant="outline" className={`text-lg px-3 py-1 ${
                        defiData.summary.roiAnalysis.roiPotential === 'high' 
                          ? 'text-green-400 border-green-400' 
                          : 'text-yellow-400 border-yellow-400'
                      }`}>
                        {defiData.summary.roiAnalysis.roiPotential === 'high' ? 'HIGH ROI' : 'LOW ROI'}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* DeFi Positions */}
                {defiData.positions?.success && defiData.positions.positions?.length > 0 && (
                  <div className="pulse-card p-6">
                    <h3 className="text-lg font-bold pulse-title mb-4">DeFi Positionen</h3>
                    <div className="space-y-4">
                      {defiData.positions.positions.map((position, index) => (
                        <div key={index} className="border border-white/10 rounded-lg p-4 bg-slate-800/30">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-medium pulse-text">{position.protocol}</h4>
                              <p className="text-sm pulse-text-secondary">{position.label}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-green-400">{formatCurrency(position.balanceUsd)}</p>
                              {position.unclaimedUsd > 0 && (
                                <p className="text-sm text-blue-400">+{formatCurrency(position.unclaimedUsd)} unclaimed</p>
                              )}
                            </div>
                          </div>
                          
                          {position.apy > 0 && (
                            <div className="flex justify-between text-sm mb-2">
                              <span className="pulse-text-secondary">APY:</span>
                              <span className="text-green-400 font-medium">{position.apy.toFixed(2)}%</span>
                            </div>
                          )}
                          
                          {position.estimatedDailyROI > 0 && (
                            <div className="flex justify-between text-sm mb-2">
                              <span className="pulse-text-secondary">Tägliche ROI:</span>
                              <span className="text-purple-400">{formatCurrency(position.estimatedDailyROI)}</span>
                            </div>
                          )}
                          
                          {position.tokens && position.tokens.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-white/10">
                              <p className="text-sm pulse-text-secondary mb-2">Token:</p>
                              <div className="flex flex-wrap gap-2">
                                {position.tokens.map((token, tokenIndex) => (
                                  <Badge key={tokenIndex} variant="outline" className="text-xs">
                                    {token.balanceFormatted} {token.symbol}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="pulse-card p-6 text-center">
                <Target className="h-12 w-12 mx-auto mb-4 opacity-50 pulse-text-secondary" />
                <h3 className="text-lg font-medium pulse-text mb-2">Keine DeFi-Daten verfügbar</h3>
                <p className="pulse-text-secondary">
                  {defiData?.summary?.error || 'DeFi-Daten konnten nicht geladen werden'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* POSITIONS TAB */}
        {activeTab === 'positions' && (
          <div className="space-y-6">
            {/* Portfolio ROI Transactions */}
            {portfolioData?.roiTransactions && portfolioData.roiTransactions.length > 0 ? (
              <div className="pulse-card p-6">
                <h3 className="text-lg font-bold pulse-title mb-4">Portfolio ROI Transaktionen</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {portfolioData.roiTransactions.slice(0, 20).map((tx, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border border-white/10 rounded-lg bg-slate-800/30">
                      <div className="flex items-center space-x-3">
                        <div>
                          <div className="font-medium pulse-text">{tx.tokenSymbol}</div>
                          <div className="text-sm pulse-text-secondary">
                            {new Date(tx.timestamp).toLocaleDateString('de-DE')}
                          </div>
                          <div className="text-xs pulse-text-secondary opacity-75">
                            {tx.roiReason}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-400">
                          {formatCurrency(tx.value)}
                        </div>
                        <div className="text-sm pulse-text-secondary">
                          {formatNumber(tx.amount, 4)} {tx.tokenSymbol}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="pulse-card p-6 text-center">
                <Zap className="h-12 w-12 mx-auto mb-4 opacity-50 pulse-text-secondary" />
                <h3 className="text-lg font-medium pulse-text mb-2">Keine ROI-Transaktionen</h3>
                <p className="pulse-text-secondary">Fügen Sie Wallet-Adressen hinzu oder warten Sie auf neue ROI-Aktivitäten</p>
              </div>
            )}
          </div>
        )}

        {/* DETECTION TAB */}
        {activeTab === 'detection' && (
          <div className="space-y-6">
            {roiDetectionData?.success ? (
              <div className="pulse-card p-6">
                <h3 className="text-lg font-bold pulse-title mb-4">ROI Detection Results</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-400">{roiDetectionData.sources?.length || 0}</p>
                    <p className="text-sm pulse-text-secondary">ROI Quellen</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-400">
                      {formatCurrency(roiDetectionData.totalPotential || 0)}
                    </p>
                    <p className="text-sm pulse-text-secondary">Potenzial</p>
                  </div>
                  <div className="text-center">
                    <Badge variant="outline" className={`text-lg px-3 py-1 ${
                      roiDetectionData.riskLevel === 'low' ? 'text-green-400 border-green-400' :
                      roiDetectionData.riskLevel === 'medium' ? 'text-yellow-400 border-yellow-400' :
                      'text-red-400 border-red-400'
                    }`}>
                      {roiDetectionData.riskLevel?.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-400">
                      {roiDetectionData.confidence ? `${(roiDetectionData.confidence * 100).toFixed(0)}%` : 'N/A'}
                    </p>
                    <p className="text-sm pulse-text-secondary">Confidence</p>
                  </div>
                </div>

                {roiDetectionData.sources && roiDetectionData.sources.length > 0 && (
                  <div className="space-y-3">
                    {roiDetectionData.sources.map((source, index) => (
                      <div key={index} className="border border-white/10 rounded-lg p-4 bg-slate-800/30">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium pulse-text">{source.type}</h4>
                            <p className="text-sm pulse-text-secondary">{source.description}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-green-400">{formatCurrency(source.potential || 0)}</p>
                            <Badge variant="outline" className="text-xs">
                              {source.confidence ? `${(source.confidence * 100).toFixed(0)}%` : 'N/A'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="pulse-card p-6 text-center">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50 pulse-text-secondary" />
                <h3 className="text-lg font-medium pulse-text mb-2">ROI Detection nicht verfügbar</h3>
                <p className="pulse-text-secondary">
                  {roiDetectionData?.error || 'ROI Detection konnte nicht ausgeführt werden'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Debug Information */}
        {showDebug && (
          <div className="pulse-card p-6 mt-6">
            <h3 className="flex items-center text-lg font-bold pulse-title mb-4">
              <AlertCircle className="h-5 w-5 mr-2 text-blue-400" />
              Debug Information
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium pulse-text-secondary">Portfolio Loaded:</span>
                <p className="pulse-text">{portfolioData?.success ? 'Yes' : 'No'}</p>
              </div>
              <div>
                <span className="font-medium pulse-text-secondary">DeFi Data:</span>
                <p className="pulse-text">{defiData?.summary?.success ? 'Yes' : 'No'}</p>
              </div>
              <div>
                <span className="font-medium pulse-text-secondary">ROI Detection:</span>
                <p className="pulse-text">{roiDetectionData?.success ? 'Yes' : 'No'}</p>
              </div>
              <div>
                <span className="font-medium pulse-text-secondary">Wallet:</span>
                <p className="pulse-text">{defiData?.wallet ? `${defiData.wallet.slice(0, 8)}...` : 'None'}</p>
              </div>
            </div>
          </div>
        )}
        </>
        )}

      </div>

      {/* CU Monitor */}
      <CUMonitor 
        viewName="ROI Tracker"
        apiCalls={[
          ...(portfolioData?.debug?.apiCalls ? [{
            endpoint: 'portfolio-defi',
            responseCount: portfolioData?.tokenCount || 0,
            estimatedCUs: portfolioData?.debug?.apiCalls || 0
          }] : []),
          ...(defiData ? [{
            endpoint: 'moralis-defi-summary',
            responseCount: defiData?.positions?.positions?.length || 0,
            estimatedCUs: defiData?.summary?.success ? 30 : 0
          }] : []),
          ...(roiDetectionData ? [{
            endpoint: 'roi-detection',
            responseCount: roiDetectionData?.sources?.length || 0,
            estimatedCUs: roiDetectionData?.success ? 20 : 0
          }] : [])
        ]}
        totalCUs={(portfolioData?.debug?.apiCalls || 0) + (defiData ? 30 : 0) + (roiDetectionData ? 20 : 0)}
        showByDefault={showDebug}
      />
    </div>
  );
};

export default ROITrackerView; 