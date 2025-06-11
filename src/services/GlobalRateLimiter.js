// 🛡️ GLOBAL RATE LIMITER
// Schützt vor API-Überlastung bei vielen gleichzeitigen Usern

export class GlobalRateLimiter {
  
  // 🛡️ RATE LIMITING KONFIGURATION
  static CONFIG = {
    // User-spezifische Limits
    USER_RATE_LIMIT_MS: 2 * 60 * 1000,    // 2 Minuten zwischen Requests pro User
    
    // Globale Limits (für alle User zusammen)
    GLOBAL_RATE_LIMIT_MS: 5 * 1000,       // 5 Sekunden zwischen Requests global
    MAX_CONCURRENT_REQUESTS: 5,           // Max 5 gleichzeitige API-Requests
    
    // Cache Limits
    CACHE_HIT_RATE_TARGET: 0.8,          // 80% Cache Hit Rate anstreben
    MAX_API_CALLS_PER_HOUR: 100          // Max 100 API Calls pro Stunde global
  };
  
  // 📊 TRACKING STATE
  static state = {
    userLastRequests: new Map(),          // userId -> timestamp
    globalLastRequest: 0,                 // Letzter globaler Request
    currentRequests: 0,                   // Aktuell laufende Requests
    apiCallsThisHour: 0,                  // API Calls diese Stunde
    hourStartTime: Date.now(),            // Start der aktuellen Stunde
    
    // Statistiken
    totalRequests: 0,
    cacheHits: 0,
    rateLimitHits: 0
  };
  
  /**
   * 🛡️ Prüfe ob User eine Anfrage machen darf
   */
  static canUserMakeRequest(userId) {
    const now = Date.now();
    
    // 1. User-spezifisches Rate Limiting
    const userLastRequest = this.state.userLastRequests.get(userId) || 0;
    const timeSinceUserRequest = now - userLastRequest;
    
    if (timeSinceUserRequest < this.CONFIG.USER_RATE_LIMIT_MS) {
      const remainingTime = this.CONFIG.USER_RATE_LIMIT_MS - timeSinceUserRequest;
      this.state.rateLimitHits++;
      
      return {
        allowed: false,
        reason: 'user_rate_limit',
        waitTimeMs: remainingTime,
        waitTimeSeconds: Math.ceil(remainingTime / 1000)
      };
    }
    
    // 2. Globales Rate Limiting
    const timeSinceGlobalRequest = now - this.state.globalLastRequest;
    
    if (timeSinceGlobalRequest < this.CONFIG.GLOBAL_RATE_LIMIT_MS) {
      const remainingTime = this.CONFIG.GLOBAL_RATE_LIMIT_MS - timeSinceGlobalRequest;
      this.state.rateLimitHits++;
      
      return {
        allowed: false,
        reason: 'global_rate_limit',
        waitTimeMs: remainingTime,
        waitTimeSeconds: Math.ceil(remainingTime / 1000)
      };
    }
    
    // 3. Concurrent Request Limit
    if (this.state.currentRequests >= this.CONFIG.MAX_CONCURRENT_REQUESTS) {
      this.state.rateLimitHits++;
      
      return {
        allowed: false,
        reason: 'too_many_concurrent',
        waitTimeMs: 5000, // 5 Sekunden warten
        waitTimeSeconds: 5
      };
    }
    
    // 4. Stündliches API Call Limit
    this.updateHourlyStats(now);
    
    if (this.state.apiCallsThisHour >= this.CONFIG.MAX_API_CALLS_PER_HOUR) {
      this.state.rateLimitHits++;
      
      return {
        allowed: false,
        reason: 'hourly_limit_exceeded',
        waitTimeMs: 60 * 60 * 1000, // 1 Stunde warten
        waitTimeSeconds: 3600
      };
    }
    
    // ✅ REQUEST ERLAUBT
    return {
      allowed: true,
      reason: 'approved'
    };
  }
  
  /**
   * 📝 Registriere eine Anfrage
   */
  static registerRequest(userId, fromCache = false) {
    const now = Date.now();
    
    this.state.userLastRequests.set(userId, now);
    this.state.globalLastRequest = now;
    this.state.totalRequests++;
    
    if (fromCache) {
      this.state.cacheHits++;
    } else {
      this.state.currentRequests++;
      this.state.apiCallsThisHour++;
    }
    
    console.log(`📊 RATE LIMITER: Registered request for user ${userId}, fromCache: ${fromCache}`);
    console.log(`📊 STATS: ${this.state.currentRequests} concurrent, ${this.state.apiCallsThisHour}/h API calls, ${this.getCacheHitRate()}% cache hit rate`);
  }
  
  /**
   * ✅ Markiere Request als abgeschlossen
   */
  static completeRequest(userId) {
    this.state.currentRequests = Math.max(0, this.state.currentRequests - 1);
    console.log(`✅ RATE LIMITER: Completed request for user ${userId}, ${this.state.currentRequests} still running`);
  }
  
  /**
   * 🔄 Update stündliche Statistiken
   */
  static updateHourlyStats(now) {
    const hoursPassed = (now - this.state.hourStartTime) / (60 * 60 * 1000);
    
    if (hoursPassed >= 1) {
      // Neue Stunde begonnen
      this.state.apiCallsThisHour = 0;
      this.state.hourStartTime = now;
      console.log('🕐 RATE LIMITER: New hour started, API call counter reset');
    }
  }
  
  /**
   * 📊 Berechne Cache Hit Rate
   */
  static getCacheHitRate() {
    if (this.state.totalRequests === 0) return 100;
    return Math.round((this.state.cacheHits / this.state.totalRequests) * 100);
  }
  
  /**
   * 📈 Hole aktuelle Statistiken
   */
  static getStats() {
    return {
      totalRequests: this.state.totalRequests,
      cacheHits: this.state.cacheHits,
      rateLimitHits: this.state.rateLimitHits,
      cacheHitRate: this.getCacheHitRate(),
      currentRequests: this.state.currentRequests,
      apiCallsThisHour: this.state.apiCallsThisHour,
      
      // Health Indicators
      isHealthy: this.getCacheHitRate() >= this.CONFIG.CACHE_HIT_RATE_TARGET * 100,
      apiUsagePercentage: (this.state.apiCallsThisHour / this.CONFIG.MAX_API_CALLS_PER_HOUR) * 100,
      
      // User Stats
      activeUsers: this.state.userLastRequests.size,
      
      // Rate Limiting Effectiveness
      rateLimitEffectiveness: this.state.totalRequests > 0 ? 
        (this.state.rateLimitHits / this.state.totalRequests) * 100 : 0
    };
  }
  
  /**
   * 🧹 Cleanup alte User-Daten
   */
  static cleanup() {
    const now = Date.now();
    const cleanupThreshold = 24 * 60 * 60 * 1000; // 24 Stunden
    
    for (const [userId, lastRequest] of this.state.userLastRequests.entries()) {
      if (now - lastRequest > cleanupThreshold) {
        this.state.userLastRequests.delete(userId);
      }
    }
    
    console.log(`🧹 RATE LIMITER: Cleaned up old user data, ${this.state.userLastRequests.size} active users remaining`);
  }
  
  /**
   * 🚨 Emergency Mode für Überlastung
   */
  static enableEmergencyMode() {
    console.warn('🚨 EMERGENCY MODE: Enabling strict rate limiting due to high load');
    
    // Verschärfe Limits
    this.CONFIG.USER_RATE_LIMIT_MS = 5 * 60 * 1000;  // 5 Minuten statt 2
    this.CONFIG.GLOBAL_RATE_LIMIT_MS = 10 * 1000;    // 10 Sekunden statt 5
    this.CONFIG.MAX_CONCURRENT_REQUESTS = 2;         // 2 statt 5
  }
  
  /**
   * ✅ Normale Mode wiederherstellen
   */
  static disableEmergencyMode() {
    console.log('✅ EMERGENCY MODE: Returning to normal rate limits');
    
    // Normale Limits wiederherstellen
    this.CONFIG.USER_RATE_LIMIT_MS = 2 * 60 * 1000;
    this.CONFIG.GLOBAL_RATE_LIMIT_MS = 5 * 1000;
    this.CONFIG.MAX_CONCURRENT_REQUESTS = 5;
  }
}

// 🧹 Auto-Cleanup alle 30 Minuten
if (typeof window !== 'undefined') {
  setInterval(() => {
    GlobalRateLimiter.cleanup();
  }, 30 * 60 * 1000);
} 