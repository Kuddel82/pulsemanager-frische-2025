/**
 * ⛓️ BLOCKCHAIN RPC SERVICE - MULTI-PROVIDER MANAGEMENT
 * 
 * Strukturelle Lösung für RPC-Verbindungen mit:
 * - Multi-Provider Pools mit automatischem Failover
 * - Health Monitoring und Provider-Ranking
 * - Load Balancing zwischen verfügbaren RPCs
 * - Circuit Breaker für defekte Endpoints
 * - Real-time Provider-Switching
 */

import { ExternalAPIService } from './core/ExternalAPIService.js';
import errorMonitor from './core/ErrorMonitoringService.js';

export class BlockchainRPCService extends ExternalAPIService {
  constructor() {
    super('BlockchainRPCService', {
      // RPC-specific configuration
      cacheTimeout: 30000,       // 30 seconds cache for RPC calls
      requestTimeout: 20000,     // 20 second timeout
      failureThreshold: 5,       // Open circuit after 5 failures
      recoveryTimeout: 180000,   // 3 minute recovery
      rateLimit: 100            // 100 requests per minute per RPC
    });
    
    // RPC Provider Pools
    this.rpcPools = {
      pulsechain: {
        mainnet: [
          {
            name: 'pulsechain-official',
            url: 'https://rpc.pulsechain.com',
            priority: 1,
            chainId: '0x171', // 369
            features: ['archive', 'trace']
          },
          {
            name: 'pulsechain-g4mm4',
            url: 'https://rpc-pulsechain.g4mm4.io',
            priority: 2,
            chainId: '0x171',
            features: ['standard']
          },
          {
            name: 'pulsechain-publicnode',
            url: 'https://pulsechain.publicnode.com',
            priority: 3,
            chainId: '0x171',
            features: ['standard']
          }
        ],
        testnet: [
          {
            name: 'pulsechain-testnet-v4',
            url: 'https://rpc.v4.testnet.pulsechain.com',
            priority: 1,
            chainId: '0x3AF', // 943
            features: ['standard']
          }
        ]
      },
      
      ethereum: {
        mainnet: [
          {
            name: 'ethereum-llamarpc',
            url: 'https://eth.llamarpc.com',
            priority: 1,
            chainId: '0x1',
            features: ['archive', 'trace']
          },
          {
            name: 'ethereum-publicnode',
            url: 'https://ethereum.publicnode.com',
            priority: 2,
            chainId: '0x1',
            features: ['standard']
          },
          {
            name: 'ethereum-ankr',
            url: 'https://rpc.ankr.com/eth',
            priority: 3,
            chainId: '0x1',
            features: ['standard']
          }
        ],
        sepolia: [
          {
            name: 'sepolia-tenderly',
            url: 'https://sepolia.gateway.tenderly.co',
            priority: 1,
            chainId: '0xaa36a7',
            features: ['standard']
          }
        ]
      }
    };
    
    // Provider Health Tracking
    this.providerHealth = new Map();
    this.activeProviders = new Map();
    this.providerStats = new Map();
    
    // Load Balancing
    this.lastUsedProvider = new Map();
    this.requestCounts = new Map();
    
    // Initialize provider health monitoring
    this.initializeHealthMonitoring();
  }

  /**
   * Get working RPC provider for chain/network
   */
  async getWorkingProvider(chain, network = 'mainnet', requiredFeatures = []) {
    const cacheKey = `provider-${chain}-${network}`;
    
    try {
      return await this.callWithFallbacks(
        cacheKey,
        () => this.findBestProvider(chain, network, requiredFeatures),
        [
          () => this.findAnyWorkingProvider(chain, network),
          () => this.getLastKnownGoodProvider(chain, network),
          () => this.getFallbackProvider(chain, network)
        ]
      );
    } catch (error) {
      errorMonitor.recordError('BlockchainRPCService', error, {
        chain,
        network,
        method: 'getWorkingProvider',
        isCritical: true
      });
      throw error;
    }
  }

  /**
   * Find best provider based on health and features
   */
  async findBestProvider(chain, network, requiredFeatures = []) {
    const providers = this.getRPCPool(chain, network);
    if (!providers || providers.length === 0) {
      throw new Error(`No RPC providers configured for ${chain}/${network}`);
    }
    
    console.log(`[BlockchainRPCService] Finding best provider for ${chain}/${network}`);
    
    // Filter providers by required features
    const compatibleProviders = providers.filter(provider => 
      requiredFeatures.every(feature => provider.features.includes(feature))
    );
    
    const candidateProviders = compatibleProviders.length > 0 ? compatibleProviders : providers;
    
    // Sort by health and priority
    const rankedProviders = this.rankProviders(candidateProviders);
    
    // Test providers in order until we find a working one
    for (const provider of rankedProviders) {
      try {
        const isHealthy = await this.testProviderHealth(provider);
        if (isHealthy) {
          console.log(`[BlockchainRPCService] Selected provider: ${provider.name}`);
          this.recordProviderSuccess(provider);
          return this.createProviderInstance(provider);
        }
      } catch (error) {
        console.warn(`[BlockchainRPCService] Provider ${provider.name} failed health check:`, error.message);
        this.recordProviderFailure(provider, error);
      }
    }
    
    throw new Error(`No healthy RPC providers found for ${chain}/${network}`);
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
   * Get provider health status
   */
  getProviderHealthStatus() {
    const status = {
      timestamp: Date.now(),
      providers: {},
      summary: { healthy: 0, unhealthy: 0, total: 0 }
    };
    
    for (const [healthKey, health] of this.providerHealth) {
      const providerName = healthKey.replace('-health', '');
      status.providers[providerName] = {
        healthy: health.healthy,
        responseTime: health.responseTime,
        lastChecked: health.timestamp,
        lastError: health.lastError
      };
      
      status.summary.total++;
      if (health.healthy) {
        status.summary.healthy++;
      } else {
        status.summary.unhealthy++;
      }
    }
    
    return status;
  }

  /**
   * Get provider statistics
   */
  getProviderStats() {
    return Object.fromEntries(this.providerStats);
  }
}

// Create singleton instance
const blockchainRPCService = new BlockchainRPCService();

export { blockchainRPCService };
export default blockchainRPCService; 