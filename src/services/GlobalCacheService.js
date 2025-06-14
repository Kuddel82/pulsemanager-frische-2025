// 🗄️ GLOBAL CACHE SERVICE - Verhindert ständiges Neu-Laden
// Cached Daten zwischen Portfolio, ROI Tracker und Tax Report

export class GlobalCacheService {
  
  // 🔄 Session Storage für persistente Daten zwischen Views
  static SESSION_KEYS = {
    PORTFOLIO_DATA: 'pulsemanager_portfolio_data',
    ROI_TRACKER_DATA: 'pulsemanager_roi_tracker_data', 
    TAX_REPORT_DATA: 'pulsemanager_tax_report_data',
    USER_SETTINGS: 'pulsemanager_user_settings'
  };
  
  // 💾 Cache TTL Settings
  static CACHE_TTL = {
    PORTFOLIO: 15 * 60 * 1000,      // 15 Minuten
    ROI_TRACKER: 2 * 60 * 60 * 1000, // 2 Stunden  
    TAX_REPORT: 24 * 60 * 60 * 1000, // 24 Stunden
    SETTINGS: 7 * 24 * 60 * 60 * 1000 // 7 Tage
  };

  // Memory cache für super-schnelle Zugriffe
  static memoryCache = new Map();
  
  /**
   * 🔄 Portfolio-Daten cachen
   */
  static cachePortfolioData(userId, data) {
    const key = `portfolio_${userId}`;
    this.memoryCache.set(key, {
      data,
      timestamp: Date.now(),
      type: 'portfolio'
    });
    console.log(`💾 CACHE: Portfolio data cached for user ${userId}`);
  }
  
  /**
   * 📊 Portfolio-Daten aus Cache laden
   */
  static getCachedPortfolioData(userId) {
    const key = `portfolio_${userId}`;
    const cached = this.memoryCache.get(key);
    
    if (!cached) return null;
    
    const age = Date.now() - cached.timestamp;
    if (age > this.CACHE_TTL.PORTFOLIO) {
      this.memoryCache.delete(key);
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
    this.memoryCache.set(key, {
      data,
      timestamp: Date.now(),
      type: 'tax'
    });
    console.log(`💾 CACHE: Tax data cached for user ${userId}`);
  }
  
  /**
   * 📊 Tax-Daten aus Cache laden
   */
  static getCachedTaxData(userId) {
    const key = `tax_${userId}`;
    const cached = this.memoryCache.get(key);
    
    if (!cached) return null;
    
    const age = Date.now() - cached.timestamp;
    if (age > this.CACHE_TTL.TAX_REPORT) {
      this.memoryCache.delete(key);
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
    this.memoryCache.set(key, {
      data,
      timestamp: Date.now(),
      type: 'roi'
    });
    console.log(`💾 CACHE: ROI data cached for user ${userId}`);
  }
  
  /**
   * 📊 ROI-Daten aus Cache laden
   */
  static getCachedROIData(userId) {
    const key = `roi_${userId}`;
    const cached = this.memoryCache.get(key);
    
    if (!cached) return null;
    
    const age = Date.now() - cached.timestamp;
    if (age > this.CACHE_TTL.ROI_TRACKER) {
      this.memoryCache.delete(key);
      console.log(`🗑️ CACHE: ROI cache expired for user ${userId}`);
      return null;
    }
    
    console.log(`✅ CACHE HIT: ROI data loaded from cache (age: ${Math.round(age/1000)}s)`);
    return cached.data;
  }
  
  /**
   * 💾 SAVE ROI TRACKER DATA (Session + Memory)
   * @param {String} userId - User ID
   * @param {Object} roiData - ROI Tracker Daten
   */
  static saveROITrackerData(userId, roiData) {
    try {
      const cacheData = {
        userId,
        data: roiData,
        timestamp: Date.now(),
        expiresAt: Date.now() + this.CACHE_TTL.ROI_TRACKER
      };
      
      // Memory Cache
      this.memoryCache.set(`roi_${userId}`, cacheData);
      
      // Session Storage für Persistierung
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(this.SESSION_KEYS.ROI_TRACKER_DATA, JSON.stringify(cacheData));
      }
      
      console.log(`💾 ROI GLOBAL: Saved ${roiData.transactions?.length || 0} transactions, $${roiData.monthlyROI} monthly`);
      return true;
      
    } catch (error) {
      console.error(`💥 ROI GLOBAL SAVE ERROR: ${error.message}`);
      return false;
    }
  }

  /**
   * 🔍 GET ROI TRACKER DATA (Memory -> Session -> null)
   * @param {String} userId - User ID
   * @returns {Object|null} - ROI Data oder null
   */
  static getROITrackerData(userId) {
    try {
      // 1. Memory Cache Check (fastest)
      const memoryKey = `roi_${userId}`;
      const memoryData = this.memoryCache.get(memoryKey);
      
      if (memoryData && memoryData.expiresAt > Date.now()) {
        console.log(`✅ ROI MEMORY HIT: ${memoryData.data.transactions?.length || 0} transactions`);
        return {
          ...memoryData.data,
          fromCache: true,
          cacheType: 'memory',
          cacheAge: Date.now() - memoryData.timestamp
        };
      }
      
      // 2. Session Storage Check
      if (typeof window !== 'undefined') {
        const sessionData = sessionStorage.getItem(this.SESSION_KEYS.ROI_TRACKER_DATA);
        if (sessionData) {
          const parsed = JSON.parse(sessionData);
          
          if (parsed.userId === userId && parsed.expiresAt > Date.now()) {
            // Restore to memory cache
            this.memoryCache.set(memoryKey, parsed);
            
            console.log(`✅ ROI SESSION HIT: ${parsed.data.transactions?.length || 0} transactions`);
            return {
              ...parsed.data,
              fromCache: true,
              cacheType: 'session',
              cacheAge: Date.now() - parsed.timestamp
            };
          }
        }
      }
      
      console.log(`❌ ROI GLOBAL MISS: No valid cache for user ${userId}`);
      return null;
      
    } catch (error) {
      console.error(`💥 ROI GLOBAL GET ERROR: ${error.message}`);
      return null;
    }
  }

  /**
   * 💾 SAVE TAX REPORT DATA (Session + Memory)
   * @param {String} userId - User ID
   * @param {Object} taxData - Tax Report Daten
   */
  static saveTaxReportData(userId, taxData) {
    try {
      const cacheData = {
        userId,
        data: taxData,
        timestamp: Date.now(),
        expiresAt: Date.now() + this.CACHE_TTL.TAX_REPORT
      };
      
      // Memory Cache
      this.memoryCache.set(`tax_${userId}`, cacheData);
      
      // Session Storage für Persistierung
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(this.SESSION_KEYS.TAX_REPORT_DATA, JSON.stringify(cacheData));
      }
      
      console.log(`💾 TAX GLOBAL: Saved ${taxData.transactions?.length || 0} transactions`);
      return true;
      
    } catch (error) {
      console.error(`💥 TAX GLOBAL SAVE ERROR: ${error.message}`);
      return false;
    }
  }

  /**
   * 🔍 GET TAX REPORT DATA (Memory -> Session -> null)
   * @param {String} userId - User ID
   * @returns {Object|null} - Tax Data oder null
   */
  static getTaxReportData(userId) {
    try {
      // 1. Memory Cache Check (fastest)
      const memoryKey = `tax_${userId}`;
      const memoryData = this.memoryCache.get(memoryKey);
      
      if (memoryData && memoryData.expiresAt > Date.now()) {
        console.log(`✅ TAX MEMORY HIT: ${memoryData.data.transactions?.length || 0} transactions`);
        return {
          ...memoryData.data,
          fromCache: true,
          cacheType: 'memory',
          cacheAge: Date.now() - memoryData.timestamp
        };
      }
      
      // 2. Session Storage Check
      if (typeof window !== 'undefined') {
        const sessionData = sessionStorage.getItem(this.SESSION_KEYS.TAX_REPORT_DATA);
        if (sessionData) {
          const parsed = JSON.parse(sessionData);
          
          if (parsed.userId === userId && parsed.expiresAt > Date.now()) {
            // Restore to memory cache
            this.memoryCache.set(memoryKey, parsed);
            
            console.log(`✅ TAX SESSION HIT: ${parsed.data.transactions?.length || 0} transactions`);
            return {
              ...parsed.data,
              fromCache: true,
              cacheType: 'session', 
              cacheAge: Date.now() - parsed.timestamp
            };
          }
        }
      }
      
      console.log(`❌ TAX GLOBAL MISS: No valid cache for user ${userId}`);
      return null;
      
    } catch (error) {
      console.error(`💥 TAX GLOBAL GET ERROR: ${error.message}`);
      return null;
    }
  }

  /**
   * 🧹 CLEAR ALL CACHE für User
   * @param {String} userId - User ID
   */
  static clearUserCache(userId) {
    try {
      // Memory Cache
      this.memoryCache.delete(`roi_${userId}`);
      this.memoryCache.delete(`tax_${userId}`);
      this.memoryCache.delete(`portfolio_${userId}`);
      
      // Session Storage
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem(this.SESSION_KEYS.ROI_TRACKER_DATA);
        sessionStorage.removeItem(this.SESSION_KEYS.TAX_REPORT_DATA);
        sessionStorage.removeItem(this.SESSION_KEYS.PORTFOLIO_DATA);
      }
      
      console.log(`🧹 GLOBAL CACHE: Cleared all data for user ${userId}`);
      return true;
      
    } catch (error) {
      console.error(`💥 CACHE CLEAR ERROR: ${error.message}`);
      return false;
    }
  }

  /**
   * 📊 CACHE STATISTICS
   * @param {String} userId - User ID
   * @returns {Object} - Cache Stats
   */
  static getCacheStats(userId) {
    const stats = {
      memory: {
        roi: this.memoryCache.has(`roi_${userId}`),
        tax: this.memoryCache.has(`tax_${userId}`),
        portfolio: this.memoryCache.has(`portfolio_${userId}`)
      },
      session: {
        roi: false,
        tax: false,
        portfolio: false
      }
    };
    
    if (typeof window !== 'undefined') {
      stats.session.roi = !!sessionStorage.getItem(this.SESSION_KEYS.ROI_TRACKER_DATA);
      stats.session.tax = !!sessionStorage.getItem(this.SESSION_KEYS.TAX_REPORT_DATA);
      stats.session.portfolio = !!sessionStorage.getItem(this.SESSION_KEYS.PORTFOLIO_DATA);
    }
    
    return stats;
  }
} 