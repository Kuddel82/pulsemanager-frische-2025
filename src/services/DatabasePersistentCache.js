// 🏛️ DATABASE PERSISTENT CACHE - Überlebt Page Reloads & Sessions
// Speichert Portfolio, ROI, Tax Daten in Supabase mit User-Zuordnung

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export class DatabasePersistentCache {
  
  // 🕐 Cache TTL Settings (in Milliseconds)
  static TTL = {
    PORTFOLIO: 15 * 60 * 1000,      // 15 Minuten
    ROI_TRACKER: 2 * 60 * 60 * 1000, // 2 Stunden
    TAX_REPORT: 24 * 60 * 60 * 1000, // 24 Stunden
    WALLET_LIST: 30 * 60 * 1000     // 30 Minuten
  };

  /**
   * 💾 SAVE PORTFOLIO DATA (Database Persistent)
   * @param {String} userId - User ID
   * @param {Object} portfolioData - Portfolio Daten
   */
  static async savePortfolioData(userId, portfolioData) {
    try {
      const cacheData = {
        user_id: userId,
        cache_type: 'portfolio',
        data: portfolioData,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + this.TTL.PORTFOLIO).toISOString(),
        version: '2.0'
      };

      const { data, error } = await supabase
        .from('cache_data')
        .upsert(cacheData, { 
          onConflict: 'user_id,cache_type',
          ignoreDuplicates: false 
        })
        .select();

      if (error) throw error;

      console.log(`💾 DB PORTFOLIO: Saved ${portfolioData.tokens?.length || 0} tokens, $${portfolioData.totalValue} for user ${userId}`);
      return true;

    } catch (error) {
      console.error(`💥 DB PORTFOLIO SAVE ERROR: ${error.message}`);
      return false;
    }
  }

  /**
   * 🔍 GET PORTFOLIO DATA (Database Persistent)
   * @param {String} userId - User ID
   * @returns {Object|null} - Portfolio Data oder null
   */
  static async getPortfolioData(userId) {
    try {
      const { data, error } = await supabase
        .from('cache_data')
        .select('*')
        .eq('user_id', userId)
        .eq('cache_type', 'portfolio')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      if (!data) return null;

      // Check if expired
      const expiresAt = new Date(data.expires_at).getTime();
      const now = Date.now();
      
      if (now > expiresAt) {
        console.log(`❌ DB PORTFOLIO: Expired for user ${userId}`);
        await this.deletePortfolioData(userId); // Clean up
        return null;
      }

      const cacheAge = now - new Date(data.created_at).getTime();
      console.log(`✅ DB PORTFOLIO: Found ${data.data.tokens?.length || 0} tokens, $${data.data.totalValue} (${Math.round(cacheAge / 60000)}min old)`);
      
      return {
        ...data.data,
        fromCache: true,
        cacheType: 'database',
        cacheAge: cacheAge,
        cachedAt: data.created_at
      };

    } catch (error) {
      console.error(`💥 DB PORTFOLIO GET ERROR: ${error.message}`);
      return null;
    }
  }

  /**
   * 💾 SAVE ROI TRACKER DATA (Database Persistent)
   * @param {String} userId - User ID  
   * @param {Object} roiData - ROI Tracker Daten
   */
  static async saveROITrackerData(userId, roiData) {
    try {
      const cacheData = {
        user_id: userId,
        cache_type: 'roi_tracker',
        data: roiData,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + this.TTL.ROI_TRACKER).toISOString(),
        version: '2.0'
      };

      const { data, error } = await supabase
        .from('cache_data')
        .upsert(cacheData, { 
          onConflict: 'user_id,cache_type',
          ignoreDuplicates: false 
        })
        .select();

      if (error) throw error;

      console.log(`💾 DB ROI: Saved ${roiData.transactions?.length || 0} transactions, $${roiData.monthlyROI} monthly for user ${userId}`);
      return true;

    } catch (error) {
      console.error(`💥 DB ROI SAVE ERROR: ${error.message}`);
      return false;
    }
  }

  /**
   * 🔍 GET ROI TRACKER DATA (Database Persistent)
   * @param {String} userId - User ID
   * @returns {Object|null} - ROI Data oder null
   */
  static async getROITrackerData(userId) {
    try {
      const { data, error } = await supabase
        .from('cache_data')
        .select('*')
        .eq('user_id', userId)
        .eq('cache_type', 'roi_tracker')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      if (!data) return null;

      // Check if expired
      const expiresAt = new Date(data.expires_at).getTime();
      const now = Date.now();
      
      if (now > expiresAt) {
        console.log(`❌ DB ROI: Expired for user ${userId}`);
        await this.deleteROITrackerData(userId);
        return null;
      }

      const cacheAge = now - new Date(data.created_at).getTime();
      console.log(`✅ DB ROI: Found ${data.data.transactions?.length || 0} transactions, $${data.data.monthlyROI} monthly (${Math.round(cacheAge / 60000)}min old)`);
      
      return {
        ...data.data,
        fromCache: true,
        cacheType: 'database',
        cacheAge: cacheAge,
        cachedAt: data.created_at
      };

    } catch (error) {
      console.error(`💥 DB ROI GET ERROR: ${error.message}`);
      return null;
    }
  }

  /**
   * 💾 SAVE TAX REPORT DATA (Database Persistent)
   * @param {String} userId - User ID
   * @param {Object} taxData - Tax Report Daten
   */
  static async saveTaxReportData(userId, taxData) {
    try {
      const cacheData = {
        user_id: userId,
        cache_type: 'tax_report',
        data: taxData,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + this.TTL.TAX_REPORT).toISOString(),
        version: '2.0'
      };

      const { data, error } = await supabase
        .from('cache_data')
        .upsert(cacheData, { 
          onConflict: 'user_id,cache_type',
          ignoreDuplicates: false 
        })
        .select();

      if (error) throw error;

      console.log(`💾 DB TAX: Saved ${taxData.transactions?.length || 0} transactions for user ${userId}`);
      return true;

    } catch (error) {
      console.error(`💥 DB TAX SAVE ERROR: ${error.message}`);
      return false;
    }
  }

  /**
   * 🔍 GET TAX REPORT DATA (Database Persistent)
   * @param {String} userId - User ID
   * @returns {Object|null} - Tax Data oder null
   */
  static async getTaxReportData(userId) {
    try {
      const { data, error } = await supabase
        .from('cache_data')
        .select('*')
        .eq('user_id', userId)
        .eq('cache_type', 'tax_report')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      if (!data) return null;

      // Check if expired
      const expiresAt = new Date(data.expires_at).getTime();
      const now = Date.now();
      
      if (now > expiresAt) {
        console.log(`❌ DB TAX: Expired for user ${userId}`);
        await this.deleteTaxReportData(userId);
        return null;
      }

      const cacheAge = now - new Date(data.created_at).getTime();
      console.log(`✅ DB TAX: Found ${data.data.transactions?.length || 0} transactions (${Math.round(cacheAge / 3600000)}h old)`);
      
      return {
        ...data.data,
        fromCache: true,
        cacheType: 'database',
        cacheAge: cacheAge,
        cachedAt: data.created_at
      };

    } catch (error) {
      console.error(`💥 DB TAX GET ERROR: ${error.message}`);
      return null;
    }
  }

  /**
   * 🧹 DELETE SPECIFIC CACHE DATA
   */
  static async deletePortfolioData(userId) {
    return await this.deleteCacheData(userId, 'portfolio');
  }

  static async deleteROITrackerData(userId) {
    return await this.deleteCacheData(userId, 'roi_tracker');
  }

  static async deleteTaxReportData(userId) {
    return await this.deleteCacheData(userId, 'tax_report');
  }

  static async deleteCacheData(userId, cacheType) {
    try {
      const { error } = await supabase
        .from('cache_data')
        .delete()
        .eq('user_id', userId)
        .eq('cache_type', cacheType);

      if (error) throw error;
      console.log(`🗑️ DB CACHE: Deleted ${cacheType} for user ${userId}`);
      return true;

    } catch (error) {
      console.error(`💥 DB CACHE DELETE ERROR: ${error.message}`);
      return false;
    }
  }

  /**
   * 🧹 CLEAR ALL USER CACHE (Database)
   * @param {String} userId - User ID
   */
  static async clearAllUserCache(userId) {
    try {
      const { error } = await supabase
        .from('cache_data')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;
      console.log(`🧹 DB CACHE: Cleared all cache for user ${userId}`);
      return true;

    } catch (error) {
      console.error(`💥 DB CACHE CLEAR ERROR: ${error.message}`);
      return false;
    }
  }

  /**
   * 📊 GET CACHE STATUS für User
   * @param {String} userId - User ID
   * @returns {Object} - Cache Status
   */
  static async getCacheStatus(userId) {
    try {
      const { data, error } = await supabase
        .from('cache_data')
        .select('cache_type, created_at, expires_at, version')
        .eq('user_id', userId);

      if (error) throw error;

      const status = {
        portfolio: null,
        roi_tracker: null,
        tax_report: null,
        totalCacheEntries: data?.length || 0
      };

      data?.forEach(entry => {
        const cacheAge = Date.now() - new Date(entry.created_at).getTime();
        const isExpired = Date.now() > new Date(entry.expires_at).getTime();
        
        status[entry.cache_type] = {
          cached: true,
          age: cacheAge,
          expired: isExpired,
          createdAt: entry.created_at,
          expiresAt: entry.expires_at,
          version: entry.version
        };
      });

      return status;

    } catch (error) {
      console.error(`💥 DB CACHE STATUS ERROR: ${error.message}`);
      return {
        portfolio: null,
        roi_tracker: null,
        tax_report: null,
        totalCacheEntries: 0,
        error: error.message
      };
    }
  }

  /**
   * 🚀 AUTO-LOAD USER DATA beim App-Start
   * @param {String} userId - User ID
   * @returns {Object} - Alle verfügbaren Cache-Daten
   */
  static async autoLoadUserData(userId) {
    try {
      console.log(`🚀 AUTO-LOAD: Loading persistent data for user ${userId}`);

      const [portfolio, roi, tax] = await Promise.all([
        this.getPortfolioData(userId),
        this.getROITrackerData(userId),
        this.getTaxReportData(userId)
      ]);

      const result = {
        portfolio: portfolio,
        roi: roi,
        tax: tax,
        hasAnyData: !!(portfolio || roi || tax),
        loadedAt: new Date().toISOString()
      };

      if (result.hasAnyData) {
        console.log(`✅ AUTO-LOAD: Found persistent data - Portfolio: ${!!portfolio}, ROI: ${!!roi}, Tax: ${!!tax}`);
      } else {
        console.log(`⚪ AUTO-LOAD: No persistent data found for user ${userId}`);
      }

      return result;

    } catch (error) {
      console.error(`💥 AUTO-LOAD ERROR: ${error.message}`);
      return {
        portfolio: null,
        roi: null,
        tax: null,
        hasAnyData: false,
        error: error.message
      };
    }
  }

  /**
   * 🧼 CLEANUP EXPIRED CACHE (Background Task)
   */
  static async cleanupExpiredCache() {
    try {
      const { data, error } = await supabase
        .from('cache_data')
        .delete()
        .lt('expires_at', new Date().toISOString())
        .select();

      if (error) throw error;

      const deletedCount = data?.length || 0;
      if (deletedCount > 0) {
        console.log(`🧼 CLEANUP: Removed ${deletedCount} expired cache entries`);
      }

      return deletedCount;

    } catch (error) {
      console.error(`💥 CLEANUP ERROR: ${error.message}`);
      return 0;
    }
  }
} 