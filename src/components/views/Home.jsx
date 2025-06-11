import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAppContext } from '@/contexts/AppContext';
import { TrendingUp, Activity, Users, ExternalLink, RefreshCw, Download, FileText, Crown } from 'lucide-react';
import { logger } from '@/lib/logger';
import WalletReader from '@/components/WalletReader';
import WalletManualInput from '@/components/WalletManualInput';
import ROICalculator from '@/components/ROICalculator';
import CentralDataService from '@/services/CentralDataService';
import { GlobalRateLimiter } from '@/services/GlobalRateLimiter';

const Home = () => {
  const navigate = useNavigate();
  const { user, signOut, loading: authLoading } = useAuth();
  const { t, language, subscriptionStatus } = useAppContext();

  // 💎 Portfolio Dashboard State
  const [portfolioData, setPortfolioData] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  const safeT = (key, fallback) => {
    if (typeof t === 'function') {
      return t(key) || fallback;
    }
    return fallback;
  };

  // 💎 Portfolio-Daten laden (V2: Mit Smart Caching + Rate Limiting)
  const loadDashboardData = async (forceRefresh = false) => {
    if (!user?.id) return;
    
    // 🛡️ RATE LIMITING CHECK
    const now = Date.now();
    const timeSinceLastRefresh = now - lastRefresh;
    
    if (!forceRefresh && timeSinceLastRefresh < RATE_LIMIT_MS) {
      const remainingSeconds = Math.ceil((RATE_LIMIT_MS - timeSinceLastRefresh) / 1000);
      console.log(`🛡️ RATE LIMITED: Please wait ${remainingSeconds} seconds before refreshing again`);
      setRefreshCooldown(remainingSeconds);
      return;
    }
    
    setDashboardLoading(true);
    try {
      console.log('🏠 DASHBOARD V2: Loading portfolio data with smart caching...');
      const data = await CentralDataService.loadCompletePortfolio(user.id);
      
      console.log('📊 DASHBOARD: Portfolio response:', {
        success: data.success,
        isLoaded: data.isLoaded,
        fromCache: data.fromCache,
        totalValue: data.totalValue,
        tokenCount: data.tokenCount,
        apiCalls: data.apiCalls || 'N/A',
        cacheInfo: data.cacheOptimization
      });
      
      if (data.success || data.isLoaded) {
        setPortfolioData(data);
        setLastUpdate(new Date());
        setLastRefresh(now);
        
        if (data.fromCache) {
          console.log('✅ DASHBOARD: Portfolio loaded from CACHE - 0 API calls used!');
        } else {
          console.log(`✅ DASHBOARD: Portfolio loaded from APIs - ${data.apiCalls || 0} API calls used, next request will use cache`);
        }
      } else {
        console.warn('⚠️ DASHBOARD: Portfolio could not be loaded:', data.error);
        setPortfolioData({
          success: false,
          totalValue: 0,
          tokens: [],
          wallets: [],
          tokenCount: 0,
          walletCount: 0,
          error: data.error
        });
      }
    } catch (error) {
      console.error('💥 DASHBOARD: Error loading portfolio:', error);
      setPortfolioData({
        success: false,
        totalValue: 0,
        tokens: [],
        wallets: [],
        tokenCount: 0,
        walletCount: 0,
        error: error.message
      });
    } finally {
      setDashboardLoading(false);
    }
  };

  // 📊 Format-Funktionen
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value || 0);
  };

  // 💾 CSV Export Funktion
  const exportToCSV = () => {
    if (!portfolioData?.tokens) {
      alert('❌ Keine Portfolio-Daten zum Exportieren verfügbar');
      return;
    }

    try {
      const csvData = (portfolioData?.tokens || []).map(token => ({
        Symbol: token.symbol,
        Name: token.name || 'Unknown',
        Balance: token.balance,
        Preis_USD: token.price,
        Wert_USD: token.value,
        Anteil_Prozent: token.percentageOfPortfolio?.toFixed(2) || '0',
        Contract_Address: token.contractAddress || 'Native'
      }));

      const headers = Object.keys(csvData[0]).join(',');
      const rows = csvData.map(row => Object.values(row).join(','));
      const csv = [headers, ...rows].join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `PulseManager_Portfolio_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      console.log('✅ DASHBOARD: CSV Export successful');
    } catch (error) {
      console.error('💥 DASHBOARD: CSV Export failed:', error);
      alert('❌ CSV Export fehlgeschlagen');
    }
  };

  // 🛡️ RATE LIMITING STATE
  const [lastRefresh, setLastRefresh] = useState(0);
  const [refreshCooldown, setRefreshCooldown] = useState(0);
  const RATE_LIMIT_MS = 2 * 60 * 1000; // 2 Minuten Rate Limit

  // Initiales Laden (EINMALIG beim Login) - BYPASS RATE LIMITING für Auto-Load
  useEffect(() => {
    if (user?.id && lastRefresh === 0) {
      console.log('🚀 INITIAL LOAD: Portfolio wird beim Login geladen...');
      
      // BYPASS Rate Limiting für Auto-Load beim Login
      setDashboardLoading(true);
      CentralDataService.loadCompletePortfolio(user.id)
        .then(data => {
          console.log('📊 DASHBOARD: Portfolio response:', {
            success: data.success,
            isLoaded: data.isLoaded,
            fromCache: data.fromCache,
            totalValue: data.totalValue,
            tokenCount: data.tokenCount,
            apiCalls: data.apiCalls || 'N/A'
          });
          
          if (data.success || data.isLoaded) {
            setPortfolioData(data);
            setLastUpdate(new Date());
            setLastRefresh(Date.now());
            
            if (data.fromCache) {
              console.log('✅ DASHBOARD AUTO-LOAD: Portfolio loaded from CACHE - 0 API calls used!');
            } else {
              console.log(`✅ DASHBOARD AUTO-LOAD: Portfolio loaded from APIs - ${data.apiCalls || 0} API calls used`);
            }
          } else {
            console.warn('⚠️ DASHBOARD AUTO-LOAD: Portfolio could not be loaded:', data.error);
            setPortfolioData({
              success: false,
              totalValue: 0,
              tokens: [],
              wallets: [],
              tokenCount: 0,
              walletCount: 0,
              error: data.error
            });
          }
        })
        .catch(error => {
          console.error('💥 DASHBOARD AUTO-LOAD: Error loading portfolio:', error);
          setPortfolioData({
            success: false,
            totalValue: 0,
            tokens: [],
            wallets: [],
            tokenCount: 0,
            walletCount: 0,
            error: error.message
          });
        })
        .finally(() => {
          setDashboardLoading(false);
        });
    }
  }, [user?.id]);

  // 🔄 COOLDOWN TIMER
  useEffect(() => {
    if (refreshCooldown > 0) {
      const timer = setInterval(() => {
        setRefreshCooldown(prev => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [refreshCooldown]);
  
  const handleLogout = async () => {
    logger.info('Home: Attempting logout.');
    try {
      await signOut();
      logger.info('Home: Logout successful, navigating to /auth.');
      navigate('/auth');
    } catch (error) {
      logger.error('Home: Error during logout:', error);
      
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white p-4">
        <div className="animate-pulse text-center">
          <Crown className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
          <p className="text-2xl font-semibold">
            {safeT('common.loadingApp', 'Loading Application...')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pulse-text">
      {/* 🎯 PulseChain Welcome Header */}
      <div className="pulse-card p-8 mb-8" style={{outline: 'none', boxShadow: 'none', border: '1px solid rgba(255, 255, 255, 0.1)'}}>
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <h1 className="pulse-title mb-2">
              Welcome back, {user?.email?.split('@')[0] || 'PulseChainer'}
            </h1>
            <p className="pulse-subtitle">
              Ready to track your PulseChain portfolio? 🚀
            </p>
            <div className="pulse-community-badge mt-4">
              🔥 Community Member
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm pulse-text-secondary">Status</div>
              <div className={`font-semibold ${subscriptionStatus === 'active' ? 'text-green-400' : 'text-yellow-400'}`}>
                {subscriptionStatus === 'active' ? '✅ Premium' : '⚡ Basic'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 📊 Portfolio Overview - Echte Daten */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {/* Portfolio Value */}
        <div className="pulse-card p-6 text-center" style={{outline: 'none', boxShadow: 'none', border: '1px solid rgba(255, 255, 255, 0.1)'}}>
          <div className="text-3xl font-bold text-green-400 mb-2">
            {dashboardLoading ? (
              <RefreshCw className="h-8 w-8 animate-spin mx-auto" />
            ) : (
              formatCurrency(portfolioData?.totalValue || 0)
            )}
          </div>
          <div className="text-sm pulse-text-secondary mb-1">Portfolio Value</div>
          <div className="text-xs pulse-text-secondary">
            {lastUpdate ? `Update: ${lastUpdate.toLocaleTimeString()}` : 'Klicke Refresh'}
            {portfolioData?.fromCache && <span className="text-green-400 ml-1">📦 Cache</span>}
          </div>
        </div>

        {/* Wallets Count */}
        <div className="pulse-card p-6 text-center" style={{outline: 'none', boxShadow: 'none', border: '1px solid rgba(255, 255, 255, 0.1)'}}>
          <div className="text-3xl font-bold text-blue-400 mb-2">
            {portfolioData?.walletCount || 0}
          </div>
          <div className="text-sm pulse-text-secondary mb-1">Connected Wallets</div>
          <div className="text-xs pulse-text-secondary">
            Multi-Chain Support
          </div>
        </div>

        {/* Token Count */}
        <div className="pulse-card p-6 text-center" style={{outline: 'none', boxShadow: 'none', border: '1px solid rgba(255, 255, 255, 0.1)'}}>
          <div className="text-3xl font-bold text-purple-400 mb-2">
            {portfolioData?.tokenCount || 0}
          </div>
          <div className="text-sm pulse-text-secondary mb-1">Token Holdings</div>
          <div className="text-xs pulse-text-secondary">
            {portfolioData?.apiCalls ? `${portfolioData.apiCalls} API calls` : 'Cached Data'}
          </div>
        </div>

        {/* CSV Export Button */}
        <div className="pulse-card p-6 text-center" style={{outline: 'none', boxShadow: 'none', border: '1px solid rgba(255, 255, 255, 0.1)'}}>
          <button 
            onClick={exportToCSV}
            disabled={!portfolioData?.tokens}
            className="w-full h-full flex flex-col items-center justify-center hover:bg-white/5 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="text-3xl font-bold text-orange-400 mb-2">
              <Download className="h-8 w-8 mx-auto" />
            </div>
            <div className="text-sm pulse-text-secondary mb-1">CSV Export</div>
            <div className="text-xs pulse-text-secondary">
              Portfolio als CSV
            </div>
          </button>
        </div>
      </div>

      {/* 🔄 Refresh Button mit Rate Limiting */}
      <div className="flex justify-center mb-6">
        <button
          onClick={() => loadDashboardData()}
          disabled={dashboardLoading || refreshCooldown > 0}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white font-semibold rounded-lg hover:from-green-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <RefreshCw className={`h-4 w-4 ${dashboardLoading ? 'animate-spin' : ''}`} />
          {dashboardLoading ? 'Lade Portfolio...' : 
           refreshCooldown > 0 ? `Warten (${refreshCooldown}s)` : 
           'Portfolio Aktualisieren'}
        </button>
        {refreshCooldown > 0 && (
          <div className="ml-4 flex items-center text-sm text-orange-400">
            ⏱️ Rate Limit: {refreshCooldown}s
          </div>
        )}
      </div>

      {/* 🔌 WalletReader - DOM-sichere Wallet-Verbindung */}
      <div className="mb-8">
        <WalletReader />
      </div>

      {/* 📝 Manual Wallet Input - Tangem/Mobile Support */}
      <div className="mb-8">
        <WalletManualInput />
      </div>

      {/* 💰 ROI Calculator & Portfolio Tracking */}
      <div className="mb-8">
        <ROICalculator />
      </div>

      {/* 📈 Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Portfolio Status */}
        <div className="pulse-card p-6" style={{outline: 'none', boxShadow: 'none', border: '1px solid rgba(255, 255, 255, 0.1)'}}>
          <div className="flex items-center gap-3 mb-4">
            <Activity className="h-6 w-6 text-green-400" />
            <h2 className="text-xl font-bold pulse-text">Portfolio Status</h2>
          </div>
          
          {(portfolioData?.success || portfolioData?.isLoaded) ? (
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-green-500/10 rounded-lg">
                <span className="text-sm pulse-text-secondary">
                  ✅ Portfolio geladen {portfolioData.fromCache ? '📦' : '🔄'}
                </span>
                <span className="text-sm text-green-400 font-medium">{portfolioData.tokenCount || 0} Tokens</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-blue-500/10 rounded-lg">
                <span className="text-sm pulse-text-secondary">💼 Wallets verbunden</span>
                <span className="text-sm text-blue-400 font-medium">{portfolioData.walletCount || 0} Wallets</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-purple-500/10 rounded-lg">
                <span className="text-sm pulse-text-secondary">💰 Gesamtwert</span>
                <span className="text-sm text-purple-400 font-medium">{formatCurrency(portfolioData.totalValue || 0)}</span>
              </div>
              {portfolioData.fromCache ? (
                <div className="flex justify-between items-center p-3 bg-orange-500/10 rounded-lg">
                  <span className="text-sm pulse-text-secondary">📦 Cache Hit</span>
                  <span className="text-sm text-orange-400 font-medium">0 API calls</span>
                </div>
              ) : (
                <div className="flex justify-between items-center p-3 bg-cyan-500/10 rounded-lg">
                  <span className="text-sm pulse-text-secondary">🔄 Fresh Data</span>
                  <span className="text-sm text-cyan-400 font-medium">{portfolioData.apiCalls || 0} API calls</span>
                </div>
              )}
              {lastUpdate && (
                <div className="text-xs pulse-text-secondary text-center mt-3">
                  Update: {lastUpdate.toLocaleString()}
                  {portfolioData.fromCache && <span className="text-orange-400 ml-2">(From Cache)</span>}
                </div>
              )}
              <div className="text-xs pulse-text-secondary text-center mt-2 p-2 bg-blue-500/10 rounded">
                🛡️ Rate Limit: Refresh alle 2 Minuten möglich (schützt vor API-Überlastung)
                <br />
                📊 Global: {GlobalRateLimiter.getStats().activeUsers} User aktiv, {GlobalRateLimiter.getStats().cacheHitRate}% Cache Hit Rate
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="pulse-text-secondary">
                {portfolioData?.error ? `Fehler: ${portfolioData.error}` : 'Keine Portfolio-Daten geladen'}
              </p>
              <p className="text-sm pulse-text-secondary mt-2">Klicke "Portfolio Aktualisieren" für Live-Daten</p>
            </div>
          )}
        </div>

        {/* Quick Actions & Exports */}
        <div className="pulse-card p-6" style={{outline: 'none', boxShadow: 'none', border: '1px solid rgba(255, 255, 255, 0.1)'}}>
          <div className="flex items-center gap-3 mb-4">
            <FileText className="h-6 w-6 text-orange-400" />
            <h2 className="text-xl font-bold pulse-text">Quick Actions</h2>
          </div>
          
          <div className="space-y-3">
            {/* Portfolio CSV Export */}
            <button
              onClick={exportToCSV}
              disabled={!portfolioData?.tokens}
              className="w-full flex items-center justify-between p-4 bg-orange-500/10 rounded-lg hover:bg-orange-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center gap-3">
                <Download className="h-5 w-5 text-orange-400" />
                <div className="text-left">
                  <div className="font-medium pulse-text">Portfolio CSV Export</div>
                  <div className="text-sm pulse-text-secondary">Alle Token-Holdings als CSV</div>
                </div>
              </div>
              <div className="text-sm text-orange-400 font-medium">
                {portfolioData?.tokens?.length || 0} Tokens
              </div>
            </button>

            {/* Tax Report Navigation */}
            <button
              onClick={() => navigate('/tax-report')}
              className="w-full flex items-center justify-between p-4 bg-red-500/10 rounded-lg hover:bg-red-500/20 transition-colors"
            >
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-red-400" />
                <div className="text-left">
                  <div className="font-medium pulse-text">Tax Report</div>
                  <div className="text-sm pulse-text-secondary">Steuer-Export (CSV/PDF)</div>
                </div>
              </div>
              <div className="text-sm text-red-400 font-medium">
                →
              </div>
            </button>

            {/* ROI Tracker Navigation */}
            <button
              onClick={() => navigate('/roi-tracker')}
              className="w-full flex items-center justify-between p-4 bg-green-500/10 rounded-lg hover:bg-green-500/20 transition-colors"
            >
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-green-400" />
                <div className="text-left">
                  <div className="font-medium pulse-text">ROI Tracker</div>
                  <div className="text-sm pulse-text-secondary">Performance Analyse</div>
                </div>
              </div>
              <div className="text-sm text-green-400 font-medium">
                →
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* 🌐 PulseChain Community */}
      <div className="pulse-card p-6" style={{outline: 'none', boxShadow: 'none', border: '1px solid rgba(255, 255, 255, 0.1)'}}>
        <div className="flex items-center gap-3 mb-6">
          <Users className="h-6 w-6 text-green-400" />
          <h2 className="text-xl font-bold pulse-text">PulseChain Community</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a 
            href="https://pulsechain.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="p-4 rounded-lg flex items-center justify-between"
            style={{outline: 'none', boxShadow: 'none', textDecoration: 'none'}}
          >
            <div>
              <div className="font-medium pulse-text">🔗 PulseChain.com</div>
              <div className="text-sm pulse-text-secondary">Official PulseChain website</div>
            </div>
            <ExternalLink className="h-4 w-4 pulse-text-secondary" />
          </a>
          
          <a 
            href="https://scan.pulsechain.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="p-4 rounded-lg flex items-center justify-between"
            style={{outline: 'none', boxShadow: 'none', textDecoration: 'none'}}
          >
            <div>
              <div className="font-medium pulse-text">🔍 PulseScan</div>
              <div className="text-sm pulse-text-secondary">Blockchain explorer</div>
            </div>
            <ExternalLink className="h-4 w-4 pulse-text-secondary" />
          </a>
          
          <a 
            href="https://app.pulsex.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="p-4 rounded-lg flex items-center justify-between"
            style={{outline: 'none', boxShadow: 'none', textDecoration: 'none'}}
          >
            <div>
              <div className="font-medium pulse-text">💱 PulseX DEX</div>
              <div className="text-sm pulse-text-secondary">Decentralized exchange</div>
            </div>
            <ExternalLink className="h-4 w-4 pulse-text-secondary" />
          </a>
          
          <a 
            href="https://www.pulsewatch.app" 
            target="_blank" 
            rel="noopener noreferrer"
            className="p-4 rounded-lg flex items-center justify-between"
            style={{outline: 'none', boxShadow: 'none', textDecoration: 'none'}}
          >
            <div>
              <div className="font-medium pulse-text">📊 PulseWatch</div>
              <div className="text-sm pulse-text-secondary">Portfolio tracker</div>
            </div>
            <ExternalLink className="h-4 w-4 pulse-text-secondary" />
          </a>
        </div>
      </div>
    </div>
  );
};
  
export { Home };
export default Home;