// 🗄️ GLOBAL CACHE SERVICE - Verhindert ständiges Neu-Laden
// Cached Daten zwischen Portfolio, ROI Tracker und Tax Report

export class GlobalCacheService {
  
  // 💾 Memory Cache für Session
  static cache = new Map();
  static lastUpdate = new Map();
  static CACHE_DURATION = 5 * 60 * 1000; // 5 Minuten
  
  /**
   * 🔄 Portfolio-Daten cachen
   */
  static cachePortfolioData(userId, data) {
    const key = `portfolio_${userId}`;
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      type: 'portfolio'
    });
    this.lastUpdate.set(key, Date.now());
    console.log(`💾 CACHE: Portfolio data cached for user ${userId}`);
  }
  
  /**
   * 📊 Portfolio-Daten aus Cache laden
   */
  static getCachedPortfolioData(userId) {
    const key = `portfolio_${userId}`;
    const cached = this.cache.get(key);
    
    if (!cached) return null;
    
    const age = Date.now() - cached.timestamp;
    if (age > this.CACHE_DURATION) {
      this.cache.delete(key);
      this.lastUpdate.delete(key);
      console.log(`🗑️ CACHE: Portfolio cache expired for user ${userId}`);
      return null;
    }
    
    console.log(`✅ CACHE HIT: Portfolio data loaded from cache (age: ${Math.round(age/1000)}s)`);
    return cached.data;
  }
  
  /**
   * 🔄 Tax-Daten cachen
   */
  static cacheTaxData(userId, data) {
    const key = `tax_${userId}`;
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      type: 'tax'
    });
    this.lastUpdate.set(key, Date.now());
    console.log(`💾 CACHE: Tax data cached for user ${userId}`);
  }
  
  /**
   * 📊 Tax-Daten aus Cache laden
   */
  static getCachedTaxData(userId) {
    const key = `tax_${userId}`;
    const cached = this.cache.get(key);
    
    if (!cached) return null;
    
    const age = Date.now() - cached.timestamp;
    if (age > this.CACHE_DURATION) {
      this.cache.delete(key);
      this.lastUpdate.delete(key);
      console.log(`🗑️ CACHE: Tax cache expired for user ${userId}`);
      return null;
    }
    
    console.log(`✅ CACHE HIT: Tax data loaded from cache (age: ${Math.round(age/1000)}s)`);
    return cached.data;
  }
  
  /**
   * 🔄 ROI-Daten cachen
   */
  static cacheROIData(userId, data) {
    const key = `roi_${userId}`;
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      type: 'roi'
    });
    this.lastUpdate.set(key, Date.now());
    console.log(`💾 CACHE: ROI data cached for user ${userId}`);
  }
  
  /**
   * 📊 ROI-Daten aus Cache laden
   */
  static getCachedROIData(userId) {
    const key = `roi_${userId}`;
    const cached = this.cache.get(key);
    
    if (!cached) return null;
    
    const age = Date.now() - cached.timestamp;
    if (age > this.CACHE_DURATION) {
      this.cache.delete(key);
      this.lastUpdate.delete(key);
      console.log(`🗑️ CACHE: ROI cache expired for user ${userId}`);
      return null;
    }
    
    console.log(`✅ CACHE HIT: ROI data loaded from cache (age: ${Math.round(age/1000)}s)`);
    return cached.data;
  }
  
  /**
   * 🗑️ Cache für User leeren
   */
  static clearUserCache(userId) {
    const keys = [`portfolio_${userId}`, `tax_${userId}`, `roi_${userId}`];
    keys.forEach(key => {
      this.cache.delete(key);
      this.lastUpdate.delete(key);
    });
    console.log(`🗑️ CACHE: All data cleared for user ${userId}`);
  }
  
  /**
   * 🗑️ Gesamten Cache leeren
   */
  static clearAllCache() {
    this.cache.clear();
    this.lastUpdate.clear();
    console.log(`🗑️ CACHE: All cache cleared`);
  }
  
  /**
   * 📊 Cache-Status abrufen
   */
  static getCacheStatus(userId) {
    const portfolio = this.cache.get(`portfolio_${userId}`);
    const tax = this.cache.get(`tax_${userId}`);
    const roi = this.cache.get(`roi_${userId}`);
    
    return {
      portfolio: portfolio ? {
        cached: true,
        age: Date.now() - portfolio.timestamp,
        size: portfolio.data?.tokens?.length || 0
      } : { cached: false },
      
      tax: tax ? {
        cached: true,
        age: Date.now() - tax.timestamp,
        size: tax.data?.allTransactions?.length || 0
      } : { cached: false },
      
      roi: roi ? {
        cached: true,
        age: Date.now() - roi.timestamp,
        size: roi.data?.roiTransactions?.length || 0
      } : { cached: false },
      
      totalCacheSize: this.cache.size,
      lastUpdate: Math.max(
        this.lastUpdate.get(`portfolio_${userId}`) || 0,
        this.lastUpdate.get(`tax_${userId}`) || 0,
        this.lastUpdate.get(`roi_${userId}`) || 0
      )
    };
  }
  
  /**
   * 🔄 Force Refresh - Cache invalidieren und neu laden
   */
  static invalidateCache(userId, type = 'all') {
    if (type === 'all') {
      this.clearUserCache(userId);
    } else {
      const key = `${type}_${userId}`;
      this.cache.delete(key);
      this.lastUpdate.delete(key);
      console.log(`🗑️ CACHE: ${type} cache invalidated for user ${userId}`);
    }
  }
} 