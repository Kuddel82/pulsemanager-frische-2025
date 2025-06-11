// 🚀 SMART PORTFOLIO HOOK - Manual Loading + Rate Limiting
// Verhindert API-Spam und reduziert Moralis CU-Kosten drastisch

import { useState, useCallback, useRef } from 'react';
import CentralDataService from '@/services/CentralDataService';
import { useAuth } from '@/contexts/AuthContext';

export const usePortfolioData = () => {
  const { user } = useAuth();
  const [portfolioData, setPortfolioData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  
  // 🛡️ RATE LIMITING: Verhindert Spam-Requests
  const lastLoadTime = useRef(0);
  const RATE_LIMIT_MS = 2 * 60 * 1000; // 2 Minuten zwischen Loads
  
  // 📊 STATS für User Feedback
  const [stats, setStats] = useState({
    totalLoads: 0,
    lastLoadDuration: 0,
    isRateLimited: false,
    nextAllowedLoad: null
  });

  /**
   * 🎯 SMART LOAD: Nur wenn erlaubt und nötig
   */
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
      return portfolioData; // Return cached data
    }

    try {
      setLoading(true);
      setError(null);
      
      const startTime = Date.now();
      console.log('🔄 SMART LOAD V2: Loading portfolio with smart caching...');
      
      const data = await CentralDataService.loadCompletePortfolio(user.id);
      
      if (!data.success && !data.isLoaded && data.error) {
        setError(data.error);
        return null;
      }
      
      const loadDuration = Date.now() - startTime;
      
      setPortfolioData(data);
      setLastUpdate(new Date());
      lastLoadTime.current = now;
      
      // 📊 Update Stats with Cache Info
      setStats(prev => ({
        totalLoads: prev.totalLoads + 1,
        lastLoadDuration: loadDuration,
        isRateLimited: false,
        nextAllowedLoad: new Date(now + RATE_LIMIT_MS),
        // NEW: Cache information
        fromCache: data.fromCache || false,
        apiCallsUsed: data.apiCalls || 0,
        cacheHitRate: data.fromCache ? 100 : 0
      }));
      
      if (data.fromCache) {
        console.log(`✅ SMART LOAD V2: CACHE HIT - 0 API calls used! (${loadDuration}ms)`);
      } else {
        console.log(`✅ SMART LOAD V2: Fresh data loaded - ${data.apiCalls || 0} API calls used (${loadDuration}ms)`);
      }
      return data;
      
    } catch (err) {
      console.error('💥 SMART LOAD ERROR:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user?.id, portfolioData]);

  /**
   * 🔄 CHECK if refresh is allowed
   */
  const canRefresh = useCallback(() => {
    const timeSinceLastLoad = Date.now() - lastLoadTime.current;
    return timeSinceLastLoad >= RATE_LIMIT_MS;
  }, []);

  /**
   * ⏱️ GET remaining time until next refresh allowed
   */
  const getRemainingTime = useCallback(() => {
    const timeSinceLastLoad = Date.now() - lastLoadTime.current;
    const remaining = Math.max(0, RATE_LIMIT_MS - timeSinceLastLoad);
    return Math.ceil(remaining / 1000);
  }, []);

  /**
   * 🧹 CLEAR cached data (for logout etc.)
   */
  const clearData = useCallback(() => {
    setPortfolioData(null);
    setError(null);
    setLastUpdate(null);
    lastLoadTime.current = 0;
    setStats({
      totalLoads: 0,
      lastLoadDuration: 0,
      isRateLimited: false,
      nextAllowedLoad: null
    });
  }, []);

  return {
    // Data
    portfolioData,
    loading,
    error,
    lastUpdate,
    
    // Actions
    loadPortfolioData,
    clearData,
    
    // Status
    canRefresh: canRefresh(),
    remainingTime: getRemainingTime(),
    stats,
    
    // Helpers
    hasData: !!portfolioData,
    isStale: lastUpdate && (Date.now() - lastUpdate.getTime()) > 10 * 60 * 1000 // 10 Min
  };
}; 