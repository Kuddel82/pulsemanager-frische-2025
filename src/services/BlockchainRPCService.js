/**
 * 🔗 BLOCKCHAIN RPC SERVICE - UPDATED 2025
 * 
 * Multi-chain RPC management with failover support
 * - PulseChain: Updated to working mainnet RPCs
 * - Ethereum: Multiple provider fallbacks
 * - Health monitoring and automatic switching
 * - Circuit breaker pattern for failed RPCs
 */

import { ExternalAPIService } from './core/ExternalAPIService.js';
import errorMonitor from './core/ErrorMonitoringService.js';

export class BlockchainRPCService extends ExternalAPIService {
  constructor() {
    super('BlockchainRPCService', {
      cacheTimeout: 30000,      // 30 second cache
      requestTimeout: 10000,    // 10 second timeout
      failureThreshold: 3,      // Open circuit after 3 failures
      recoveryTimeout: 60000,   // 1 minute recovery
      rateLimit: 60            // 60 requests per minute
    });
    
    // RPC Provider Pools - UPDATED WITH WORKING ENDPOINTS
    this.rpcPools = {
      pulsechain: [
        {
          name: 'PulseChain Official',
          url: 'https://rpc.pulsechain.com',
          priority: 1,
          chainId: '0x171', // 369
          timeout: 8000
        },
        {
          name: 'PulseChain G4MM4',
          url: 'https://rpc-pulsechain.g4mm4.io',
          priority: 2,
          chainId: '0x171',
          timeout: 10000
        },
        {
          name: 'PulseChain PublicNode',
          url: 'https://pulsechain.publicnode.com',
          priority: 3,
          chainId: '0x171',
          timeout: 10000
        }
        // ❌ ENTFERNT: Defekte Sepolia Testnet URLs
        // {
        //   name: 'PulseChain Testnet',
        //   url: 'https://rpc.sepolia.v4.testnet.pulsechain.com',
        //   priority: 4,
        //   chainId: '0x171',
        //   timeout: 10000
        // }
      ],
      ethereum: [
        {
          name: 'Ethereum LlamaRPC',
          url: 'https://eth.llamarpc.com',
          priority: 1,
          chainId: '0x1',
          timeout: 8000
        },
        {
          name: 'Ethereum PublicNode',
          url: 'https://ethereum.publicnode.com',
          priority: 2,
          chainId: '0x1',
          timeout: 10000
        },
        {
          name: 'Ethereum Ankr',
          url: 'https://rpc.ankr.com/eth',
          priority: 3,
          chainId: '0x1',
          timeout: 10000
        },
        {
          name: 'Ethereum CloudFlare',
          url: 'https://cloudflare-eth.com',
          priority: 4,
          chainId: '0x1',
          timeout: 12000
        }
      ]
    };
    
    // Provider health tracking
    this.providerHealth = new Map();
    this.currentProviders = new Map();
    
    // Load Balancing
    this.lastUsedProvider = new Map();
    this.requestCounts = new Map();
    
    // Initialize provider health monitoring
    this.initializeHealthMonitoring();
  }

  /**
   * Get working RPC provider for chain
   */
  async getWorkingProvider(chain = 'pulsechain') {
    try {
      const chainLower = chain.toLowerCase();
      const providers = this.rpcPools[chainLower];
      
      if (!providers || providers.length === 0) {
        throw new Error(`No RPC providers configured for chain: ${chain}`);
      }
      
      // Check if we have a cached working provider
      const cachedProvider = this.currentProviders.get(chainLower);
      if (cachedProvider && await this.isProviderHealthy(cachedProvider)) {
        console.log(`[BlockchainRPC] Using cached provider: ${cachedProvider.name}`);
        return cachedProvider;
      }
      
      // Find working provider by priority
      const sortedProviders = providers.sort((a, b) => a.priority - b.priority);
      
      for (const provider of sortedProviders) {
        try {
          console.log(`[BlockchainRPC] Testing provider: ${provider.name} (${provider.url})`);
          
          if (await this.testProvider(provider)) {
            console.log(`[BlockchainRPC] ✅ Provider working: ${provider.name}`);
            this.currentProviders.set(chainLower, provider);
            this.recordProviderHealth(provider, true);
            return provider;
          }
          
        } catch (error) {
          console.warn(`[BlockchainRPC] ❌ Provider failed: ${provider.name} - ${error.message}`);
          this.recordProviderHealth(provider, false);
        }
      }
      
      throw new Error(`No working RPC providers found for ${chain}`);
      
    } catch (error) {
      console.error(`[BlockchainRPC] 💥 Failed to get provider for ${chain}:`, error.message);
      throw error;
    }
  }

  /**
   * Test if RPC provider is working
   */
  async testProvider(provider) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), provider.timeout);
      
      const response = await fetch(provider.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_chainId',
          params: [],
          id: 1
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(`RPC Error: ${data.error.message}`);
      }
      
      // Verify chain ID matches
      if (data.result && data.result !== provider.chainId) {
        console.warn(`[BlockchainRPC] Chain ID mismatch: expected ${provider.chainId}, got ${data.result}`);
      }
      
      return true;
      
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error(`Timeout after ${provider.timeout}ms`);
      }
      throw error;
    }
  }

  /**
   * Check if provider is healthy
   */
  async isProviderHealthy(provider) {
    try {
      const health = this.providerHealth.get(provider.url);
      if (!health) return false;
      
      // Consider provider unhealthy if last failure was recent
      const timeSinceLastFailure = Date.now() - (health.lastFailure || 0);
      if (timeSinceLastFailure < 60000) { // 1 minute
        return false;
      }
      
      // Quick health check
      return await this.testProvider(provider);
    } catch (error) {
      return false;
    }
  }

  /**
   * Record provider health status
   */
  recordProviderHealth(provider, isHealthy) {
    const health = this.providerHealth.get(provider.url) || {
      successCount: 0,
      failureCount: 0,
      lastSuccess: null,
      lastFailure: null
    };
    
    if (isHealthy) {
      health.successCount++;
      health.lastSuccess = Date.now();
    } else {
      health.failureCount++;
      health.lastFailure = Date.now();
    }
    
    this.providerHealth.set(provider.url, health);
  }

  /**
   * Get RPC URL for chain
   */
  async getRPCUrl(chain = 'pulsechain') {
    try {
      const provider = await this.getWorkingProvider(chain);
      return provider.url;
    } catch (error) {
      console.error(`[BlockchainRPC] Failed to get RPC URL for ${chain}:`, error.message);
      
      // Emergency fallback URLs
      const fallbacks = {
        pulsechain: 'https://rpc.pulsechain.com',
        ethereum: 'https://eth.llamarpc.com'
      };
      
      const fallbackUrl = fallbacks[chain.toLowerCase()];
      if (fallbackUrl) {
        console.warn(`[BlockchainRPC] Using emergency fallback: ${fallbackUrl}`);
        return fallbackUrl;
      }
      
      throw error;
    }
  }

  /**
   * Get chain ID for chain
   */
  getChainId(chain = 'pulsechain') {
    const chainMap = {
      pulsechain: '0x171',
      pls: '0x171',
      ethereum: '0x1',
      eth: '0x1'
    };
    
    return chainMap[chain.toLowerCase()] || '0x171';
  }

  /**
   * Make RPC call
   */
  async makeRPCCall(method, params = [], chain = 'pulsechain') {
    try {
      const provider = await this.getWorkingProvider(chain);
      
      const response = await fetch(provider.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method,
          params,
          id: Date.now()
        }),
        signal: AbortSignal.timeout(provider.timeout)
      });
      
      if (!response.ok) {
        throw new Error(`RPC HTTP Error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(`RPC Method Error: ${data.error.message}`);
      }
      
      return data.result;
      
    } catch (error) {
      console.error(`[BlockchainRPC] RPC call failed: ${method}`, error.message);
      throw error;
    }
  }

  /**
   * Get provider health status
   */
  getProviderHealthStatus() {
    const status = {};
    
    Object.entries(this.rpcPools).forEach(([chain, providers]) => {
      status[chain] = providers.map(provider => {
        const health = this.providerHealth.get(provider.url) || {};
        const current = this.currentProviders.get(chain);
        
        return {
          name: provider.name,
          url: provider.url,
          isCurrent: current?.url === provider.url,
          successCount: health.successCount || 0,
          failureCount: health.failureCount || 0,
          lastSuccess: health.lastSuccess,
          lastFailure: health.lastFailure,
          priority: provider.priority
        };
      });
    });
    
    return status;
  }

  /**
   * Force refresh provider health
   */
  async refreshProviderHealth() {
    console.log('[BlockchainRPC] Refreshing provider health...');
    
    const promises = [];
    
    Object.entries(this.rpcPools).forEach(([chain, providers]) => {
      providers.forEach(provider => {
        promises.push(
          this.testProvider(provider)
            .then(() => this.recordProviderHealth(provider, true))
            .catch(() => this.recordProviderHealth(provider, false))
        );
      });
    });
    
    await Promise.allSettled(promises);
    console.log('[BlockchainRPC] Provider health refresh complete');
  }

  /**
   * Initialize health monitoring
   */
  initializeHealthMonitoring() {
    // Run health checks every 5 minutes
    setInterval(() => {
      this.runHealthCheckCycle();
    }, 300000);
    
    // Initial health check
    setTimeout(() => this.runHealthCheckCycle(), 5000);
  }

  /**
   * Run health check cycle for all providers
   */
  async runHealthCheckCycle() {
    console.log('[BlockchainRPCService] Running health check cycle...');
    
    for (const [chain, networks] of Object.entries(this.rpcPools)) {
      for (const [network, providers] of Object.entries(networks)) {
        for (const provider of providers) {
          try {
            await this.testProviderHealth(provider);
          } catch (error) {
            // Health check failures are already logged
          }
        }
      }
    }
  }

  /**
   * Test provider health
   */
  async testProviderHealth(provider) {
    const healthKey = `${provider.name}-health`;
    
    // Check if recently tested and healthy
    const recentHealth = this.providerHealth.get(healthKey);
    if (recentHealth && (Date.now() - recentHealth.timestamp) < 60000 && recentHealth.healthy) {
      return true;
    }
    
    try {
      console.log(`[BlockchainRPCService] Testing health of ${provider.name}...`);
      const startTime = Date.now();
      
      // Test basic connectivity with net_version
      const response = await fetch(provider.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'net_version',
          params: [],
          id: 1
        }),
        signal: AbortSignal.timeout(10000)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      const responseTime = Date.now() - startTime;
      
      if (data.error) {
        throw new Error(`RPC Error: ${data.error.message}`);
      }
      
      // Verify chain ID if provided
      if (provider.chainId) {
        const chainIdResponse = await this.callRPCMethod(provider, 'eth_chainId', []);
        if (chainIdResponse.result !== provider.chainId) {
          throw new Error(`Chain ID mismatch: expected ${provider.chainId}, got ${chainIdResponse.result}`);
        }
      }
      
      // Record health status
      this.providerHealth.set(healthKey, {
        healthy: true,
        responseTime,
        timestamp: Date.now(),
        lastError: null
      });
      
      console.log(`[BlockchainRPCService] ${provider.name} is healthy (${responseTime}ms)`);
      return true;
      
    } catch (error) {
      this.providerHealth.set(healthKey, {
        healthy: false,
        responseTime: null,
        timestamp: Date.now(),
        lastError: error.message
      });
      
      console.warn(`[BlockchainRPCService] ${provider.name} health check failed:`, error.message);
      return false;
    }
  }

  /**
   * Call RPC method on provider
   */
  async callRPCMethod(provider, method, params, options = {}) {
    try {
      const response = await fetch(provider.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method,
          params,
          id: Date.now()
        }),
        signal: AbortSignal.timeout(options.timeout || this.options.requestTimeout)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(`RPC Error: ${data.error.message} (${data.error.code})`);
      }
      
      return data;
      
    } catch (error) {
      this.recordProviderFailure(provider, error);
      throw error;
    }
  }

  /**
   * Rank providers by health and priority
   */
  rankProviders(providers) {
    return providers.sort((a, b) => {
      // First sort by health
      const aHealth = this.providerHealth.get(`${a.name}-health`);
      const bHealth = this.providerHealth.get(`${b.name}-health`);
      
      const aHealthy = aHealth?.healthy !== false;
      const bHealthy = bHealth?.healthy !== false;
      
      if (aHealthy !== bHealthy) {
        return bHealthy - aHealthy; // Healthy providers first
      }
      
      // Then by priority (lower number = higher priority)
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      
      // Finally by response time
      const aResponseTime = aHealth?.responseTime || Infinity;
      const bResponseTime = bHealth?.responseTime || Infinity;
      
      return aResponseTime - bResponseTime;
    });
  }

  /**
   * Get RPC pool for chain/network
   */
  getRPCPool(chain, network) {
    const chainPools = this.rpcPools[chain];
    if (!chainPools) {
      console.warn(`[BlockchainRPCService] No RPC pools configured for chain: ${chain}`);
      return null;
    }
    
    const networkPool = chainPools[network];
    if (!networkPool) {
      console.warn(`[BlockchainRPCService] No RPC pool configured for ${chain}/${network}`);
      return null;
    }
    
    return [...networkPool]; // Return copy to avoid mutations
  }

  /**
   * Record provider success
   */
  recordProviderSuccess(provider) {
    const stats = this.providerStats.get(provider.name) || {
      successCount: 0,
      failureCount: 0,
      lastSuccess: null,
      lastFailure: null
    };
    
    stats.successCount++;
    stats.lastSuccess = Date.now();
    this.providerStats.set(provider.name, stats);
  }

  /**
   * Record provider failure
   */
  recordProviderFailure(provider, error) {
    const stats = this.providerStats.get(provider.name) || {
      successCount: 0,
      failureCount: 0,
      lastSuccess: null,
      lastFailure: null
    };
    
    stats.failureCount++;
    stats.lastFailure = Date.now();
    stats.lastError = error.message;
    this.providerStats.set(provider.name, stats);
    
    // Record in error monitor
    errorMonitor.recordError('BlockchainRPCService', error, {
      provider: provider.name,
      url: provider.url,
      method: 'recordProviderFailure'
    });
  }

  /**
   * Create provider instance (could be ethers.js provider or similar)
   */
  createProviderInstance(provider) {
    // For now, return provider config
    // In full implementation, this would create ethers.js JsonRpcProvider
    return {
      name: provider.name,
      url: provider.url,
      chainId: provider.chainId,
      features: provider.features,
      call: (method, params, options) => this.callRPCMethod(provider, method, params, options)
    };
  }

  /**
   * Find any working provider (less strict)
   */
  async findAnyWorkingProvider(chain, network) {
    const providers = this.getRPCPool(chain, network);
    if (!providers) throw new Error(`No providers for ${chain}/${network}`);
    
    for (const provider of providers) {
      try {
        await this.testProviderHealth(provider);
        return this.createProviderInstance(provider);
      } catch (error) {
        continue;
      }
    }
    
    throw new Error(`No working providers found for ${chain}/${network}`);
  }

  /**
   * Get last known good provider
   */
  getLastKnownGoodProvider(chain, network) {
    const lastUsedKey = `${chain}-${network}`;
    const lastProvider = this.lastUsedProvider.get(lastUsedKey);
    
    if (lastProvider) {
      console.warn(`[BlockchainRPCService] Using last known good provider: ${lastProvider.name}`);
      return lastProvider;
    }
    
    throw new Error(`No last known good provider for ${chain}/${network}`);
  }

  /**
   * Get fallback provider (first in list)
   */
  getFallbackProvider(chain, network) {
    const providers = this.getRPCPool(chain, network);
    if (providers && providers.length > 0) {
      console.warn(`[BlockchainRPCService] Using fallback provider: ${providers[0].name}`);
      return this.createProviderInstance(providers[0]);
    }
    
    throw new Error(`No fallback provider for ${chain}/${network}`);
  }
}

// Create singleton instance
const blockchainRPCService = new BlockchainRPCService();

export { blockchainRPCService };
export default blockchainRPCService; 