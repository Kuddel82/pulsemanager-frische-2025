/**
 * 🏗️ EXTERNAL API SERVICE - STRUCTURAL FOUNDATION
 * 
 * Basis-Klasse für alle externen API-Services mit:
 * - Circuit Breaker Pattern
 * - Fallback-Strategien  
 * - Error-Handling
 * - Caching-Layer
 * - Rate-Limiting
 */

export class ExternalAPIService {
  constructor(serviceName, options = {}) {
    this.serviceName = serviceName;
    this.options = {
      // Circuit Breaker Configuration
      failureThreshold: options.failureThreshold || 5,
      recoveryTimeout: options.recoveryTimeout || 60000, // 1 minute
      requestTimeout: options.requestTimeout || 10000,   // 10 seconds
      
      // Cache Configuration  
      cacheTimeout: options.cacheTimeout || 300000,      // 5 minutes
      maxCacheSize: options.maxCacheSize || 100,
      
      // Retry Configuration
      maxRetries: options.maxRetries || 3,
      retryDelay: options.retryDelay || 1000,
      
      ...options
    };
    
    // Circuit Breaker State
    this.circuitBreakers = new Map();
    this.failureCounts = new Map();
    this.lastFailureTime = new Map();
    
    // Cache Layer
    this.cache = new Map();
    this.cacheTimestamps = new Map();
    
    // Error Monitoring
    this.errorCounts = new Map();
    this.successCounts = new Map();
    
    // Rate Limiting
    this.requestCounts = new Map();
    this.requestWindows = new Map();
  }

  /**
   * Main method: Call API with fallbacks and circuit breaker protection
   */
  async callWithFallbacks(apiName, primaryCall, fallbackCalls = [], options = {}) {
    const startTime = Date.now();
    
    try {
      // Rate limiting check
      if (this.isRateLimited(apiName)) {
        console.warn(`[${this.serviceName}] Rate limited for ${apiName}, using cache/fallback`);
        return this.getCachedOrFallback(apiName, fallbackCalls);
      }
      
      // Circuit breaker check
      if (this.isCircuitOpen(apiName)) {
        console.warn(`[${this.serviceName}] Circuit breaker OPEN for ${apiName}, using fallback`);
        return this.getCachedOrFallback(apiName, fallbackCalls);
      }
      
      // Check cache first
      const cached = this.getCachedData(apiName);
      if (cached && !options.forceRefresh) {
        console.log(`[${this.serviceName}] Cache HIT for ${apiName}`);
        return cached;
      }
      
      // Execute primary call with timeout
      console.log(`[${this.serviceName}] Executing primary call for ${apiName}`);
      const result = await this.executeWithTimeout(primaryCall, this.options.requestTimeout);
      
      // Success: Reset circuit breaker, cache result
      this.recordSuccess(apiName);
      this.setCachedData(apiName, result);
      
      const duration = Date.now() - startTime;
      console.log(`[${this.serviceName}] Primary call SUCCESS for ${apiName} (${duration}ms)`);
      
      return result;
      
    } catch (error) {
      const duration = Date.now() - startTime;
      console.warn(`[${this.serviceName}] Primary call FAILED for ${apiName} (${duration}ms):`, error.message);
      
      // Record failure
      this.recordFailure(apiName, error);
      
      // Execute fallback chain
      return this.executeFallbackChain(apiName, fallbackCalls, error);
    }
  }

  /**
   * Execute fallback chain until one succeeds
   */
  async executeFallbackChain(apiName, fallbackCalls, originalError) {
    console.log(`[${this.serviceName}] Executing ${fallbackCalls.length} fallbacks for ${apiName}`);
    
    for (let i = 0; i < fallbackCalls.length; i++) {
      try {
        console.log(`[${this.serviceName}] Trying fallback ${i + 1}/${fallbackCalls.length} for ${apiName}`);
        const result = await this.executeWithTimeout(fallbackCalls[i], this.options.requestTimeout);
        
        console.log(`[${this.serviceName}] Fallback ${i + 1} SUCCESS for ${apiName}`);
        this.setCachedData(apiName, result, true); // Mark as fallback data
        return result;
        
      } catch (fallbackError) {
        console.warn(`[${this.serviceName}] Fallback ${i + 1} FAILED for ${apiName}:`, fallbackError.message);
      }
    }
    
    // All fallbacks failed - try cache as last resort
    const cached = this.getCachedData(apiName, true); // Allow stale cache
    if (cached) {
      console.warn(`[${this.serviceName}] Using STALE cache for ${apiName}`);
      return cached;
    }
    
    // Complete failure
    console.error(`[${this.serviceName}] ALL CALLS FAILED for ${apiName}`);
    throw new Error(`${this.serviceName}: All API calls failed for ${apiName}. Original error: ${originalError.message}`);
  }

  /**
   * Circuit Breaker Logic
   */
  isCircuitOpen(apiName) {
    const failures = this.failureCounts.get(apiName) || 0;
    const lastFailure = this.lastFailureTime.get(apiName) || 0;
    const timeSinceLastFailure = Date.now() - lastFailure;
    
    // Circuit is open if failure threshold exceeded and recovery timeout not passed
    return failures >= this.options.failureThreshold && 
           timeSinceLastFailure < this.options.recoveryTimeout;
  }

  recordSuccess(apiName) {
    // Reset circuit breaker
    this.failureCounts.set(apiName, 0);
    this.lastFailureTime.delete(apiName);
    
    // Track success metrics
    const successes = this.successCounts.get(apiName) || 0;
    this.successCounts.set(apiName, successes + 1);
  }

  recordFailure(apiName, error) {
    // Increment failure count
    const failures = this.failureCounts.get(apiName) || 0;
    this.failureCounts.set(apiName, failures + 1);
    this.lastFailureTime.set(apiName, Date.now());
    
    // Track error metrics
    const errorKey = `${apiName}:${error.message}`;
    const errors = this.errorCounts.get(errorKey) || 0;
    this.errorCounts.set(errorKey, errors + 1);
  }

  /**
   * Cache Management
   */
  getCachedData(apiName, allowStale = false) {
    const data = this.cache.get(apiName);
    const timestamp = this.cacheTimestamps.get(apiName);
    
    if (!data || !timestamp) return null;
    
    const age = Date.now() - timestamp;
    const isStale = age > this.options.cacheTimeout;
    
    if (isStale && !allowStale) return null;
    
    return data;
  }

  setCachedData(apiName, data, isFallback = false) {
    // Manage cache size
    if (this.cache.size >= this.options.maxCacheSize) {
      this.evictOldestCacheEntry();
    }
    
    this.cache.set(apiName, { data, isFallback, timestamp: Date.now() });
    this.cacheTimestamps.set(apiName, Date.now());
  }

  getCachedOrFallback(apiName, fallbackCalls) {
    const cached = this.getCachedData(apiName, true); // Allow stale
    if (cached) {
      return cached.data;
    }
    
    // If no cache, try fallback chain
    return this.executeFallbackChain(apiName, fallbackCalls, new Error('Circuit breaker open'));
  }

  evictOldestCacheEntry() {
    let oldestKey = null;
    let oldestTime = Date.now();
    
    for (const [key, timestamp] of this.cacheTimestamps) {
      if (timestamp < oldestTime) {
        oldestTime = timestamp;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.cacheTimestamps.delete(oldestKey);
    }
  }

  /**
   * Rate Limiting
   */
  isRateLimited(apiName) {
    const now = Date.now();
    const windowStart = this.requestWindows.get(apiName) || now;
    const windowDuration = 60000; // 1 minute window
    
    // Reset window if expired
    if (now - windowStart > windowDuration) {
      this.requestWindows.set(apiName, now);
      this.requestCounts.set(apiName, 0);
      return false;
    }
    
    const requestCount = this.requestCounts.get(apiName) || 0;
    const rateLimit = this.options.rateLimit || 60; // 60 requests per minute
    
    if (requestCount >= rateLimit) {
      return true;
    }
    
    // Increment request count
    this.requestCounts.set(apiName, requestCount + 1);
    return false;
  }

  /**
   * Timeout wrapper
   */
  async executeWithTimeout(asyncFunction, timeoutMs) {
    return Promise.race([
      asyncFunction(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs)
      )
    ]);
  }

  /**
   * Service Health Metrics
   */
  getHealthMetrics() {
    const metrics = {
      serviceName: this.serviceName,
      timestamp: Date.now(),
      circuitBreakers: {},
      errorCounts: Object.fromEntries(this.errorCounts),
      successCounts: Object.fromEntries(this.successCounts),
      cacheSize: this.cache.size,
      totalRequests: 0
    };
    
    // Circuit breaker states
    for (const [apiName, failures] of this.failureCounts) {
      metrics.circuitBreakers[apiName] = {
        failures,
        isOpen: this.isCircuitOpen(apiName),
        lastFailure: this.lastFailureTime.get(apiName)
      };
    }
    
    // Calculate total requests
    for (const count of this.successCounts.values()) {
      metrics.totalRequests += count;
    }
    for (const count of this.errorCounts.values()) {
      metrics.totalRequests += count;
    }
    
    return metrics;
  }

  /**
   * Reset service state (for testing/debugging)
   */
  reset() {
    this.circuitBreakers.clear();
    this.failureCounts.clear();
    this.lastFailureTime.clear();
    this.cache.clear();
    this.cacheTimestamps.clear();
    this.errorCounts.clear();
    this.successCounts.clear();
    this.requestCounts.clear();
    this.requestWindows.clear();
  }
}

export default ExternalAPIService; 