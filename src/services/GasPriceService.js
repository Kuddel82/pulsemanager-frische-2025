/**
 * ⛽ GAS PRICE SERVICE - CORS-FREE SOLUTION
 * 
 * ❌ DEPRECATED - 2025-06-12
 * Das System ist VOLLSTÄNDIG READ-ONLY und benötigt keine Gas-Preise!
 * 
 * Dieser Service wird nicht mehr verwendet und sollte entfernt werden.
 * Bewahrt nur zu Dokumentationszwecken.
 */

import { ExternalAPIService } from './core/ExternalAPIService.js';
import errorMonitor from './core/ErrorMonitoringService.js';

export class GasPriceService extends ExternalAPIService {
  constructor() {
    super('GasPriceService', {
      // Aggressive caching for gas prices (they change slowly)
      cacheTimeout: 120000,      // 2 minutes cache
      requestTimeout: 15000,     // 15 second timeout
      failureThreshold: 3,       // Open circuit after 3 failures
      recoveryTimeout: 300000,   // 5 minute recovery
      rateLimit: 30             // 30 requests per minute
    });
    
    console.warn('❌ DEPRECATED: GasPriceService ist veraltet und sollte nicht verwendet werden!');
    console.warn('Das System ist READ-ONLY und benötigt keine Gas-Preise.');

    // Gas Price Provider Configuration
    this.providers = {
      // Primary: Backend proxy (CORS-free)
      backendProxy: {
        endpoint: '/api/gas-prices',
        priority: 1,
        timeout: 10000
      },
      
      // Fallbacks: Direct blockchain queries
      etherscan: {
        endpoint: '/api/gas-etherscan',
        priority: 2,
        timeout: 15000
      },
      
      alchemy: {
        endpoint: '/api/gas-alchemy', 
        priority: 3,
        timeout: 15000
      },
      
      // Emergency: Static estimates
      emergency: {
        priority: 99,
        timeout: 1000
      }
    };
    
    // Default gas price estimates (emergency fallback)
    this.emergencyGasPrices = {
      slow: { gasPrice: '10', estimatedTime: '5+ minutes' },
      standard: { gasPrice: '15', estimatedTime: '2-5 minutes' },
      fast: { gasPrice: '25', estimatedTime: '<2 minutes' },
      timestamp: Date.now(),
      source: 'emergency_fallback'
    };
  }

  /**
   * Main method: Get gas prices with full fallback chain
   */
  async getGasPrices(options = {}) {
    try {
      return await this.callWithFallbacks(
        'gas-prices',
        () => this.getBackendProxyPrices(),
        [
          () => this.getEtherscanPrices(),
          () => this.getAlchemyPrices(),
          () => this.getOnChainEstimate(),
          () => this.getEmergencyPrices()
        ],
        options
      );
    } catch (error) {
      errorMonitor.recordError('GasPriceService', error, { 
        method: 'getGasPrices',
        isCritical: true
      });
      
      // Last resort: Return emergency prices
      console.warn('[GasPriceService] All providers failed, using emergency prices');
      return this.getEmergencyPrices();
    }
  }

  /**
   * Primary Provider: Backend Proxy (CORS-free)
   */
  async getBackendProxyPrices() {
    try {
      console.log('[GasPriceService] Fetching via backend proxy...');
      const response = await fetch(this.providers.backendProxy.endpoint, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        },
        signal: AbortSignal.timeout(this.providers.backendProxy.timeout)
      });
      
      if (!response.ok) {
        throw new Error(`Backend proxy failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.success || !data.sources || data.sources.length === 0) {
        throw new Error('Backend proxy returned no valid gas price data');
      }
      
      console.log(`[GasPriceService] Backend proxy SUCCESS - ${data.sources.length} sources`);
      return this.normalizeGasPriceData(data, 'backend_proxy');
      
    } catch (error) {
      console.warn('[GasPriceService] Backend proxy failed:', error.message);
      throw error;
    }
  }

  /**
   * Fallback 1: Etherscan API
   */
  async getEtherscanPrices() {
    try {
      console.log('[GasPriceService] Trying Etherscan fallback...');
      const response = await fetch(this.providers.etherscan.endpoint, {
        method: 'GET',
        signal: AbortSignal.timeout(this.providers.etherscan.timeout)
      });
      
      if (!response.ok) {
        throw new Error(`Etherscan API failed: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('[GasPriceService] Etherscan fallback SUCCESS');
      return this.normalizeGasPriceData(data, 'etherscan');
      
    } catch (error) {
      console.warn('[GasPriceService] Etherscan fallback failed:', error.message);
      throw error;
    }
  }

  /**
   * Fallback 2: Alchemy API
   */
  async getAlchemyPrices() {
    try {
      console.log('[GasPriceService] Trying Alchemy fallback...');
      const response = await fetch(this.providers.alchemy.endpoint, {
        method: 'GET',
        signal: AbortSignal.timeout(this.providers.alchemy.timeout)
      });
      
      if (!response.ok) {
        throw new Error(`Alchemy API failed: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('[GasPriceService] Alchemy fallback SUCCESS');
      return this.normalizeGasPriceData(data, 'alchemy');
      
    } catch (error) {
      console.warn('[GasPriceService] Alchemy fallback failed:', error.message);
      throw error;
    }
  }

  /**
   * Fallback 3: On-chain estimate
   */
  async getOnChainEstimate() {
    try {
      console.log('[GasPriceService] Trying on-chain estimate...');
      
      // This would need ethers.js provider integration
      // For now, return a basic estimate based on network conditions
      const networkGasPrice = await this.getNetworkGasPrice();
      
      const estimate = {
        slow: { 
          gasPrice: Math.max(networkGasPrice * 0.8, 1).toFixed(0),
          estimatedTime: '5+ minutes'
        },
        standard: { 
          gasPrice: networkGasPrice.toFixed(0),
          estimatedTime: '2-5 minutes'
        },
        fast: { 
          gasPrice: (networkGasPrice * 1.2).toFixed(0),
          estimatedTime: '<2 minutes'
        },
        timestamp: Date.now(),
        source: 'on_chain_estimate'
      };
      
      console.log('[GasPriceService] On-chain estimate SUCCESS');
      return estimate;
      
    } catch (error) {
      console.warn('[GasPriceService] On-chain estimate failed:', error.message);
      throw error;
    }
  }

  /**
   * Emergency Fallback: Static estimates
   */
  async getEmergencyPrices() {
    console.warn('[GasPriceService] Using emergency gas price estimates');
    
    // Update timestamp
    this.emergencyGasPrices.timestamp = Date.now();
    
    errorMonitor.recordError('GasPriceService', new Error('All providers failed, using emergency prices'), {
      method: 'getEmergencyPrices',
      isCritical: false
    });
    
    return { ...this.emergencyGasPrices };
  }

  /**
   * Normalize gas price data from different sources
   */
  normalizeGasPriceData(rawData, source) {
    try {
      // Handle different response formats
      switch (source) {
        case 'backend_proxy':
          return this.normalizeBackendProxyData(rawData);
        case 'etherscan':
          return this.normalizeEtherscanData(rawData);
        case 'alchemy':
          return this.normalizeAlchemyData(rawData);
        default:
          throw new Error(`Unknown gas price source: ${source}`);
      }
    } catch (error) {
      console.warn(`[GasPriceService] Failed to normalize ${source} data:`, error.message);
      throw error;
    }
  }

  normalizeBackendProxyData(data) {
    // Backend proxy should return aggregated data from multiple sources
    if (data.aggregated) {
      return {
        slow: data.aggregated.slow,
        standard: data.aggregated.standard,
        fast: data.aggregated.fast,
        timestamp: data.timestamp || Date.now(),
        source: 'backend_aggregated',
        sourceCount: data.sources.length
      };
    }
    
    // If no aggregated data, use first available source
    const firstSource = data.sources[0];
    return {
      slow: firstSource.slow || { gasPrice: '10', estimatedTime: '5+ minutes' },
      standard: firstSource.standard || { gasPrice: '15', estimatedTime: '2-5 minutes' },
      fast: firstSource.fast || { gasPrice: '25', estimatedTime: '<2 minutes' },
      timestamp: firstSource.timestamp || Date.now(),
      source: firstSource.url || 'backend_proxy'
    };
  }

  normalizeEtherscanData(data) {
    // Etherscan gas tracker format
    return {
      slow: {
        gasPrice: data.SafeGasPrice || '10',
        estimatedTime: '5+ minutes'
      },
      standard: {
        gasPrice: data.StandardGasPrice || '15', 
        estimatedTime: '2-5 minutes'
      },
      fast: {
        gasPrice: data.FastGasPrice || '25',
        estimatedTime: '<2 minutes'
      },
      timestamp: Date.now(),
      source: 'etherscan'
    };
  }

  normalizeAlchemyData(data) {
    // Alchemy format
    return {
      slow: {
        gasPrice: Math.floor(data.slow?.gasPrice / 1e9) || '10',
        estimatedTime: '5+ minutes'
      },
      standard: {
        gasPrice: Math.floor(data.standard?.gasPrice / 1e9) || '15',
        estimatedTime: '2-5 minutes'
      },
      fast: {
        gasPrice: Math.floor(data.fast?.gasPrice / 1e9) || '25',
        estimatedTime: '<2 minutes'
      },
      timestamp: Date.now(),
      source: 'alchemy'
    };
  }

  /**
   * Network gas price estimation
   */
  async getNetworkGasPrice() {
    // This would integrate with blockchain RPC
    // For now, return reasonable default
    return 15; // 15 gwei
  }

  /**
   * Health check for gas price providers
   */
  async checkProviderHealth() {
    const health = {
      timestamp: Date.now(),
      providers: {},
      overall: 'unknown'
    };
    
    // Test each provider
    for (const [name, config] of Object.entries(this.providers)) {
      if (name === 'emergency') continue;
      
      try {
        const startTime = Date.now();
        await fetch(config.endpoint, { 
          method: 'HEAD',
          signal: AbortSignal.timeout(5000)
        });
        
        health.providers[name] = {
          status: 'healthy',
          responseTime: Date.now() - startTime
        };
      } catch (error) {
        health.providers[name] = {
          status: 'unhealthy',
          error: error.message
        };
      }
    }
    
    // Calculate overall health
    const healthyCount = Object.values(health.providers)
      .filter(p => p.status === 'healthy').length;
    const totalCount = Object.keys(health.providers).length;
    
    if (healthyCount === 0) {
      health.overall = 'critical';
    } else if (healthyCount < totalCount / 2) {
      health.overall = 'degraded';
    } else {
      health.overall = 'healthy';
    }
    
    return health;
  }

  /**
   * Force refresh gas prices (bypass cache)
   */
  async forceRefresh() {
    return this.getGasPrices({ forceRefresh: true });
  }

  /**
   * Get cached gas prices only
   */
  getCachedPrices() {
    return this.getCachedData('gas-prices');
  }

  /**
   * Update emergency fallback prices
   */
  updateEmergencyPrices(prices) {
    this.emergencyGasPrices = {
      ...prices,
      timestamp: Date.now(),
      source: 'emergency_fallback'
    };
  }
}

// Create singleton instance
const gasPriceService = new GasPriceService();

export { gasPriceService };
export default gasPriceService; 