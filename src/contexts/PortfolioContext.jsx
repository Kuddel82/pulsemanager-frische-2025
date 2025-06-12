import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import CentralDataService from '@/services/CentralDataService';
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

  // 🔄 LOAD FROM CACHE ON INIT
  useEffect(() => {
    if (!user?.id) return;
    
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const { data, timestamp } = JSON.parse(cached);
        const age = Date.now() - timestamp;
        
        if (age < CACHE_DURATION) {
          console.log('🚀 PORTFOLIO CACHE HIT: Loading from localStorage');
          setPortfolioData(data);
          setLastUpdate(new Date(timestamp));
          setStats(prev => ({ ...prev, fromCache: true }));
        } else {
          console.log('⏰ PORTFOLIO CACHE EXPIRED: Removing old data');
          localStorage.removeItem(CACHE_KEY);
        }
      } catch (err) {
        console.error('💥 PORTFOLIO CACHE ERROR:', err);
        localStorage.removeItem(CACHE_KEY);
      }
    }
  }, [user?.id, CACHE_KEY]);

  // 🚀 INTELLIGENT AUTO-LOADING - Only when needed
  useEffect(() => {
    if (user?.id && !portfolioData && !loading) {
      console.log('🚀 SMART AUTO-LOAD: First-time portfolio loading...');
      
      // Check if we have recent cache first
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        try {
          const { timestamp } = JSON.parse(cached);
          const age = Date.now() - timestamp;
          
          if (age < CACHE_DURATION) {
            console.log('✅ AUTO-LOAD SKIPPED: Recent cache available');
            return; // Cache already loaded in previous useEffect
          }
        } catch (err) {
          console.error('💥 Cache check failed:', err);
        }
      }
      
      // Only auto-load if no recent data and user just logged in
      const isFirstLoad = !lastLoadTime.current || lastLoadTime.current === 0;
      if (isFirstLoad) {
        console.log('🚀 AUTO-LOADING: First portfolio load for user');
        loadPortfolioData();
      }
    }
  }, [user?.id, portfolioData, loading, loadPortfolioData, CACHE_KEY]);

  // 🚀 LOAD PORTFOLIO DATA
  const loadPortfolioData = useCallback(async (forceLoad = false) => {
    if (!user?.id) {
      setError('Kein User angemeldet');
      return null;
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
      console.log('🔄 GLOBAL PORTFOLIO LOAD: Loading fresh data...');
      
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
      
      console.log(`✅ GLOBAL PORTFOLIO LOADED: ${data.apiCalls || 0} API calls used (${loadDuration}ms)`);
      return data;
      
    } catch (err) {
      console.error('💥 GLOBAL PORTFOLIO ERROR:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user?.id, portfolioData, CACHE_KEY]);

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

  // 🚪 CLEAR ON LOGOUT
  useEffect(() => {
    if (!user) {
      clearData();
    }
  }, [user, clearData]);

  // 🚀 FIXED: Allow navigation without loading data first
  // User can navigate to Portfolio view and see empty state with load button
  const canNavigateToPortfolio = true; // Always allow navigation
  
  const contextValue = {
    // Portfolio Data
    portfolioData,
    loading,
    error,
    lastUpdate,
    
    // Navigation & Control  
    canNavigateToPortfolio, // 🚀 NEW: Always allow navigation
    canRefresh,
    remainingTime: getRemainingTime(),
    hasData: !!portfolioData,
    isCached: stats.fromCache,
    
    // Methods
    loadPortfolioData,
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