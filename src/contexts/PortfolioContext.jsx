import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import CentralDataService from '@/services/CentralDataService';
import { restoreLastPortfolio } from '@/services/portfolioService';
import { useAuth } from '@/contexts/AuthContext';

const PortfolioContext = createContext();

export const PortfolioProvider = ({ children }) => {
  const { user } = useAuth();
  
  // 🏦 GLOBAL PORTFOLIO STATE
  const [portfolioData, setPortfolioData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  
  // 🛡️ RATE LIMITING
  const lastLoadTime = useRef(0);
  const RATE_LIMIT_MS = 5 * 60 * 1000; // 5 Minuten
  
  // 📊 STATS
  const [stats, setStats] = useState({
    totalLoads: 0,
    lastLoadDuration: 0,
    isRateLimited: false,
    nextAllowedLoad: null,
    fromCache: false,
    apiCallsUsed: 0
  });

  // 💾 LOCAL STORAGE CACHING
  const CACHE_KEY = `portfolio_${user?.id}`;
  const CACHE_DURATION = 10 * 60 * 1000; // 10 Minuten

  // ❌ KOMPLETT DEAKTIVIERT: KEINE AUTOMATISCHEN CACHE-LOADS MEHR!
  // 🚨 Das war der Grund für die ungewollten API-Calls beim Homepage-Load!
  // Jetzt wird NICHTS mehr automatisch geladen - nur manuelle Button-Clicks!

  console.log('🚨 PORTFOLIO CONTEXT: 100% MANUAL MODE - Keine Auto-Loads!');

  // 🚀 MANUAL CACHE CHECK (NUR bei Button-Click!)
  const checkAndLoadCache = useCallback(() => {
    if (!user?.id) return null;
    
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const { data, timestamp } = JSON.parse(cached);
        const age = Date.now() - timestamp;
        
        if (age < CACHE_DURATION) {
          console.log('💾 MANUAL CACHE HIT: Loading cached data');
          setPortfolioData(data);
          setLastUpdate(new Date(timestamp));
          setStats(prev => ({ ...prev, fromCache: true }));
          return data;
        } else {
          console.log('🗑️ CACHE EXPIRED: Removing old cache');
          localStorage.removeItem(CACHE_KEY);
        }
      } catch (err) {
        console.error('💥 CACHE ERROR:', err);
        localStorage.removeItem(CACHE_KEY);
      }
    }
    return null;
  }, [user?.id, CACHE_KEY]);

  // 🚀 LOAD PORTFOLIO DATA (NUR BEI MANUELLER ANFRAGE!)
  const loadPortfolioData = useCallback(async (forceLoad = false) => {
    if (!user?.id) {
      setError('Kein User angemeldet');
      return null;
    }

    // 🚀 ERST Cache prüfen, dann API nur bei Bedarf
    if (!forceLoad) {
      const cachedData = checkAndLoadCache();
      if (cachedData) {
        console.log('✅ CACHE HIT: Keine API-Calls nötig!');
        return cachedData;
      }
    }

    const now = Date.now();
    const timeSinceLastLoad = now - lastLoadTime.current;
    
    // 🛡️ RATE LIMITING CHECK
    if (!forceLoad && timeSinceLastLoad < RATE_LIMIT_MS) {
      const remainingTime = Math.ceil((RATE_LIMIT_MS - timeSinceLastLoad) / 1000);
      console.log(`⏱️ RATE LIMITED: Warte noch ${remainingTime} Sekunden`);
      
      setStats(prev => ({
        ...prev,
        isRateLimited: true,
        nextAllowedLoad: new Date(lastLoadTime.current + RATE_LIMIT_MS)
      }));
      
      setError(`Bitte warten Sie noch ${remainingTime} Sekunden vor dem nächsten Update`);
      return portfolioData;
    }

    try {
      setLoading(true);
      setError(null);
      
      const startTime = Date.now();
      console.log('🔄 MANUAL PORTFOLIO LOAD: Fresh API call...');
      
      // 🚨 COST OPTIMIZED: Only load basic portfolio data (no ROI/Tax)
    const data = await CentralDataService.loadCompletePortfolio(user.id, { 
      includeROI: false,
      includeTax: false 
    });
      
      if (!data.success && !data.isLoaded && data.error) {
        setError(data.error);
        return null;
      }
      
      const loadDuration = Date.now() - startTime;
      
      // 💾 SAVE TO CACHE
      const cacheData = {
        data,
        timestamp: now
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
      
      setPortfolioData(data);
      setLastUpdate(new Date());
      lastLoadTime.current = now;
      
      // 📊 Update Stats
      setStats(prev => ({
        totalLoads: prev.totalLoads + 1,
        lastLoadDuration: loadDuration,
        isRateLimited: false,
        nextAllowedLoad: new Date(now + RATE_LIMIT_MS),
        fromCache: false,
        apiCallsUsed: data.apiCalls || 0
      }));
      
      console.log(`✅ MANUAL PORTFOLIO LOADED: ${data.apiCalls || 0} API calls used (${loadDuration}ms)`);
      return data;
      
    } catch (err) {
      console.error('💥 MANUAL PORTFOLIO ERROR:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user?.id, portfolioData, CACHE_KEY, checkAndLoadCache]);

  // 🔍 REFRESH CHECK
  const canRefresh = useCallback(() => {
    const timeSinceLastLoad = Date.now() - lastLoadTime.current;
    return timeSinceLastLoad >= RATE_LIMIT_MS;
  }, []);

  // ⏱️ REMAINING TIME
  const getRemainingTime = useCallback(() => {
    const timeSinceLastLoad = Date.now() - lastLoadTime.current;
    const remaining = Math.max(0, RATE_LIMIT_MS - timeSinceLastLoad);
    return Math.ceil(remaining / 1000);
  }, []);

  // 🧹 CLEAR DATA
  const clearData = useCallback(() => {
    setPortfolioData(null);
    setError(null);
    setLastUpdate(null);
    lastLoadTime.current = 0;
    setStats({
      totalLoads: 0,  
      lastLoadDuration: 0,
      isRateLimited: false,
      nextAllowedLoad: null,
      fromCache: false,
      apiCallsUsed: 0
    });
    if (user?.id) {
      localStorage.removeItem(`portfolio_${user.id}`);
    }
  }, [user?.id]);

  // 🚪 LIFECYCLE: Clear on logout, Restore on login
  useEffect(() => {
    if (!user) {
      // User logged out - clear data
      clearData();
    } else if (user?.id && !portfolioData) {
      // User logged in but no portfolio - try to restore
      console.log('👤 LOGIN DETECTED: Attempting portfolio restore...');
      restorePortfolioOnLogin();
    }
  }, [user, clearData]);

  // 💾 RESTORE Portfolio on Login (OHNE API-Calls!)
  const restorePortfolioOnLogin = useCallback(async () => {
    if (!user?.id) return;

    try {
      console.log('💾 AUTO-RESTORE: Checking for cached portfolio...');
      const restored = await restoreLastPortfolio(user.id);
      
      if (restored.data && restored.data.length > 0) {
        console.log(`✅ AUTO-RESTORE: Portfolio restored! ${restored.data.length} tokens, ${Math.round(restored.cacheAge / 60)} min old`);
        
        setPortfolioData(restored.data);
        setLastUpdate(restored.lastUpdate);
        setStats(prev => ({
          ...prev,
          fromCache: true,
          totalLoads: prev.totalLoads + 1,
          lastLoadDuration: 0, // No API call
          apiCallsUsed: 0      // No API call
        }));
        setError(null);
      } else {
        console.log('📭 AUTO-RESTORE: No cached portfolio found - ready for manual load');
      }
    } catch (error) {
      console.error('💥 AUTO-RESTORE ERROR:', error);
      // Kein Error setzen - User kann manuell laden
    }
  }, [user?.id]);
  
  const contextValue = {
    // Portfolio Data
    portfolioData,
    loading,
    error,
    lastUpdate,
    
    // Navigation & Control  
    canRefresh,
    remainingTime: getRemainingTime(),
    hasData: !!portfolioData,
    isCached: stats.fromCache,
    
    // Methods
    loadPortfolioData,
    checkAndLoadCache, // 🚀 NEW: Manual cache check
    restorePortfolioData: restorePortfolioOnLogin, // 🚀 NEW: Manual restore
    clearPortfolioData: () => {
      setPortfolioData(null);
      setError(null);
      setLastUpdate(null);
      console.log('🗑️ Portfolio data cleared');
    },
    
    // Helper
    refreshPortfolioData: () => {
      console.log('🔄 Manual portfolio refresh requested');
      loadPortfolioData();
    },
    
    // Status
    stats
  };

  return (
    <PortfolioContext.Provider value={contextValue}>
      {children}
    </PortfolioContext.Provider>
  );
};

export const usePortfolioContext = () => {
  const context = useContext(PortfolioContext);
  if (!context) {
    throw new Error('usePortfolioContext must be used within PortfolioProvider');
  }
  return context;
}; 