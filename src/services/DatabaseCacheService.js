// 🗄️ DATABASE CACHE SERVICE - SKALIERBARE DATENSPEICHERUNG
// Eliminiert redundante API-Calls durch intelligentes Caching
// Nutzt Supabase für user-spezifische Datenpersistierung

import { supabase } from '@/lib/supabaseClient';

export class DatabaseCacheService {
  
  // 🕒 Cache-Zeitfenster (in Minuten)
  static CACHE_DURATIONS = {
    PORTFOLIO: 15,        // Portfolio-Daten: 15 Minuten
    TRANSACTIONS: 60,     // Transaktionen: 1 Stunde  
    PRICES: 5,           // Token-Preise: 5 Minuten
    DEFI_POSITIONS: 30,  // DeFi-Positionen: 30 Minuten
    ROI_ANALYSIS: 20     // ROI-Analyse: 20 Minuten
  };

  /**
   * 💾 PORTFOLIO CACHE - Basis für Dashboard, ROI Tracker, Tax Report
   */
  static async getCachedPortfolio(userId) {
    try {
      console.log(`📊 DATABASE CACHE: Loading portfolio for user ${userId}`);
      
      // 1. Prüfe Cache-Gültigkeit
      const { data: cacheEntry, error: cacheError } = await supabase
        .from('portfolio_cache')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (cacheError && cacheError.code !== 'PGRST116') {
        console.warn('Cache read error:', cacheError);
      }
      
      // 2. Cache-Hit? Prüfe Freshness
      if (cacheEntry && this.isCacheValid(cacheEntry.updated_at, this.CACHE_DURATIONS.PORTFOLIO)) {
        console.log('✅ CACHE HIT: Portfolio data from cache');
        return {
          success: true,
          fromCache: true,
          data: cacheEntry.portfolio_data,
          lastUpdate: cacheEntry.updated_at,
          cacheStatus: 'hit'
        };
      }
      
      // 3. Cache-Miss oder veraltet
      console.log('❌ CACHE MISS: Portfolio data needs refresh');
      return {
        success: false,
        fromCache: false,
        cacheStatus: 'miss',
        reason: cacheEntry ? 'stale' : 'not_found'
      };
      
    } catch (error) {
      console.error('💥 Portfolio Cache Error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 💾 SPEICHERE PORTFOLIO IN CACHE
   */
  static async setCachedPortfolio(userId, portfolioData) {
    try {
      console.log(`💾 DATABASE CACHE: Storing portfolio for user ${userId}`);
      
      const cacheData = {
        user_id: userId,
        portfolio_data: portfolioData,
        total_value: portfolioData.totalValue || 0,
        token_count: portfolioData.tokenCount || 0,
        wallet_count: portfolioData.walletCount || 0,
        updated_at: new Date().toISOString()
      };
      
      const { error } = await supabase
        .from('portfolio_cache')
        .upsert(cacheData, { onConflict: 'user_id' });
      
      if (error) throw error;
      
      console.log('✅ Portfolio cached successfully');
      return { success: true };
      
    } catch (error) {
      console.error('💥 Portfolio Cache Store Error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 🔄 INCREMENTAL TRANSACTION SYNC
   * Lädt nur neue Transaktionen seit letztem Update
   */
  static async getIncrementalTransactions(userId, walletAddress, lastSyncTimestamp = null) {
    try {
      console.log(`🔄 INCREMENTAL SYNC: Checking new transactions for ${walletAddress}`);
      
      // 1. Bestimme letzten Sync-Zeitpunkt
      if (!lastSyncTimestamp) {
        const { data: lastTx } = await supabase
          .from('transactions')
          .select('timestamp')
          .eq('user_id', userId)
          .eq('wallet_address', walletAddress)
          .order('timestamp', { ascending: false })
          .limit(1)
          .single();
        
        lastSyncTimestamp = lastTx?.timestamp || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 Tage fallback
      }
      
      // 2. Prüfe, ob Sync nötig ist
      const timeSinceSync = Date.now() - new Date(lastSyncTimestamp).getTime();
      const syncIntervalMs = this.CACHE_DURATIONS.TRANSACTIONS * 60 * 1000;
      
      if (timeSinceSync < syncIntervalMs) {
        console.log('⏭️ SYNC SKIPPED: Too recent');
        return {
          success: true,
          newTransactions: [],
          synced: false,
          reason: 'too_recent'
        };
      }
      
      // 3. Lade cached Transaktionen
      const { data: cachedTransactions, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .eq('wallet_address', walletAddress)
        .order('timestamp', { ascending: false });
      
      if (error) throw error;
      
      return {
        success: true,
        transactions: cachedTransactions || [],
        fromCache: true,
        count: cachedTransactions?.length || 0,
        lastSync: lastSyncTimestamp
      };
      
    } catch (error) {
      console.error('💥 Incremental Transaction Sync Error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 💰 TOKEN PRICE CACHE
   */
  static async getCachedTokenPrices(tokenAddresses) {
    try {
      const { data: prices, error } = await supabase
        .from('token_price_cache')
        .select('*')
        .in('token_address', tokenAddresses)
        .gte('updated_at', new Date(Date.now() - this.CACHE_DURATIONS.PRICES * 60 * 1000).toISOString());
      
      if (error) throw error;
      
      const priceMap = new Map();
      prices?.forEach(price => {
        priceMap.set(price.token_address.toLowerCase(), {
          usd: price.price_usd,
          lastUpdate: price.updated_at
        });
      });
      
      const missingTokens = tokenAddresses.filter(addr => 
        !priceMap.has(addr.toLowerCase())
      );
      
      return {
        success: true,
        priceMap,
        missingTokens,
        hitRate: ((tokenAddresses.length - missingTokens.length) / tokenAddresses.length * 100).toFixed(1)
      };
      
    } catch (error) {
      console.error('💥 Token Price Cache Error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 📊 ROI ANALYSIS CACHE
   */
  static async getCachedROIAnalysis(userId) {
    try {
      const { data: roiCache, error } = await supabase
        .from('roi_analysis_cache')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      
      if (roiCache && this.isCacheValid(roiCache.updated_at, this.CACHE_DURATIONS.ROI_ANALYSIS)) {
        return {
          success: true,
          fromCache: true,
          data: roiCache.analysis_data,
          lastUpdate: roiCache.updated_at
        };
      }
      
      return { success: false, fromCache: false, reason: 'cache_miss' };
      
    } catch (error) {
      console.error('💥 ROI Analysis Cache Error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 🚀 SMART REFRESH STRATEGY
   * Entscheidet intelligent, welche Daten aktualisiert werden müssen
   */
  static async getSmartRefreshPlan(userId) {
    try {
      console.log(`🧠 SMART REFRESH: Planning updates for user ${userId}`);
      
      const refreshPlan = {
        portfolio: false,
        transactions: false,
        prices: false,
        defiPositions: false,
        roiAnalysis: false,
        reason: {}
      };
      
      // 1. Prüfe Portfolio-Cache
      const portfolioCache = await this.getCachedPortfolio(userId);
      refreshPlan.portfolio = !portfolioCache.success;
      refreshPlan.reason.portfolio = portfolioCache.success ? 'cached' : 'stale';
      
      // 2. Prüfe ROI-Cache
      const roiCache = await this.getCachedROIAnalysis(userId);
      refreshPlan.roiAnalysis = !roiCache.success;
      refreshPlan.reason.roiAnalysis = roiCache.success ? 'cached' : 'stale';
      
      // 3. Prüfe User-Aktivität
      const { data: lastActivity } = await supabase
        .from('user_activity_log')
        .select('last_action_at')
        .eq('user_id', userId)
        .single();
      
      const timeSinceActivity = lastActivity ? 
        Date.now() - new Date(lastActivity.last_action_at).getTime() : 
        Infinity;
      
      // 4. Intelligent refresh based on activity
      if (timeSinceActivity < 5 * 60 * 1000) { // 5 Minuten
        refreshPlan.prices = true;
        refreshPlan.reason.activity = 'recent_user_activity';
      }
      
      console.log('🎯 REFRESH PLAN:', refreshPlan);
      return refreshPlan;
      
    } catch (error) {
      console.error('💥 Smart Refresh Planning Error:', error);
      return {
        portfolio: true,
        transactions: true,
        prices: true,
        defiPositions: true,
        roiAnalysis: true,
        error: error.message
      };
    }
  }

  /**
   * 🔧 HELPER: Cache-Gültigkeit prüfen
   */
  static isCacheValid(timestamp, durationMinutes) {
    const cacheAge = Date.now() - new Date(timestamp).getTime();
    const maxAge = durationMinutes * 60 * 1000;
    return cacheAge < maxAge;
  }

  /**
   * 📊 CACHE STATISTICS
   */
  static async getCacheStats(userId) {
    try {
      const stats = {};
      
      // Portfolio Cache Stats
      const { data: portfolioCache } = await supabase
        .from('portfolio_cache')
        .select('updated_at, total_value')
        .eq('user_id', userId)
        .single();
      
      stats.portfolio = {
        cached: !!portfolioCache,
        lastUpdate: portfolioCache?.updated_at,
        totalValue: portfolioCache?.total_value || 0
      };
      
      // Transaction Count
      const { count: transactionCount } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
      
      stats.transactions = {
        count: transactionCount || 0
      };
      
      return { success: true, stats };
      
    } catch (error) {
      console.error('💥 Cache Stats Error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 🧹 CACHE CLEANUP
   * Entfernt veraltete Cache-Einträge
   */
  static async cleanupOldCache() {
    try {
      const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 Tage
      
      await supabase
        .from('portfolio_cache')
        .delete()
        .lt('updated_at', cutoffDate.toISOString());
      
      await supabase
        .from('token_price_cache')
        .delete()
        .lt('updated_at', cutoffDate.toISOString());
        
      console.log('🧹 Cache cleanup completed');
      return { success: true };
      
    } catch (error) {
      console.error('💥 Cache Cleanup Error:', error);
      return { success: false, error: error.message };
    }
  }
} 