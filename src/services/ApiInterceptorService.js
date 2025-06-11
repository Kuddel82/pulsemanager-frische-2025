// 🛡️ API INTERCEPTOR SERVICE
// Verhindert 400-Fehler bei nicht unterstützten Chains und stellt Fallbacks bereit

export class ApiInterceptorService {
  
  static SUPPORTED_CHAINS = ['1', '56', '137', '43114', '250']; // Ethereum, BSC, Polygon, Avalanche, Fantom
  static UNSUPPORTED_CHAINS = ['369']; // PulseChain
  
  /**
   * 🔍 Prüfe ob Chain von Moralis unterstützt wird
   */
  static isChainSupported(chainId) {
    return this.SUPPORTED_CHAINS.includes(chainId.toString());
  }
  
  /**
   * 🚫 Intercepte Moralis API Calls für nicht unterstützte Chains
   */
  static async interceptMoralisApiCall(url, options, walletInfo = null) {
    try {
      // Extrahiere Chain aus Request
      const chain = this.extractChainFromRequest(url, options);
      
      if (chain && !this.isChainSupported(chain)) {
        console.warn(`⚠️ API INTERCEPTOR: Chain ${chain} not supported by Moralis - returning empty response`);
        
        return {
          ok: true,
          json: () => Promise.resolve({
            result: [],
            total: 0,
            _intercepted: true,
            _reason: `Chain ${chain} not supported by Moralis Enterprise APIs`,
            _supportedChains: this.SUPPORTED_CHAINS,
            _wallet: walletInfo
          })
        };
      }
      
      // Chain wird unterstützt - normaler API Call
      console.log(`✅ API INTERCEPTOR: Chain ${chain} supported - proceeding with API call`);
      return await fetch(url, options);
      
    } catch (error) {
      console.error('💥 API INTERCEPTOR: Error during interception:', error);
      
      // Fallback: Leere Response zurückgeben
      return {
        ok: false,
        json: () => Promise.resolve({
          result: [],
          error: error.message,
          _intercepted: true,
          _fallback: true
        })
      };
    }
  }
  
  /**
   * 🔍 Extrahiere Chain ID aus API Request
   */
  static extractChainFromRequest(url, options) {
    try {
      // URL Parameter check
      const urlObj = new URL(url, window.location.origin);
      const chainParam = urlObj.searchParams.get('chain');
      if (chainParam) return chainParam;
      
      // Body Parameter check (POST requests)
      if (options?.body) {
        const body = typeof options.body === 'string' 
          ? JSON.parse(options.body) 
          : options.body;
        
        if (body.chain) return body.chain;
        if (body.chainId) return body.chainId;
      }
      
      return null;
    } catch (error) {
      console.warn('⚠️ Could not extract chain from request:', error);
      return null;
    }
  }
  
  /**
   * 🎯 Smart API Strategy für Mixed Wallets
   */
  static async handleMixedWalletPortfolio(wallets) {
    const strategies = {
      supported: [],
      unsupported: [],
      results: {
        tokens: [],
        transactions: [],
        totalValue: 0
      }
    };
    
    // Gruppiere Wallets nach Chain-Support
    wallets.forEach(wallet => {
      const chainId = wallet.chain_id?.toString() || wallet.chain;
      
      if (this.isChainSupported(chainId)) {
        strategies.supported.push({
          ...wallet,
          strategy: 'moralis_api'
        });
      } else {
        strategies.unsupported.push({
          ...wallet,
          strategy: 'local_cache_only',
          reason: `Chain ${chainId} not supported by Moralis`
        });
      }
    });
    
    console.log(`🎯 MIXED STRATEGY: ${strategies.supported.length} supported, ${strategies.unsupported.length} unsupported wallets`);
    
    return strategies;
  }
  
  /**
   * 🔄 Fallback Portfolio für nicht unterstützte Chains
   */
  static getFallbackPortfolioData(walletAddress, chainId) {
    return {
      success: false,
      portfolio: [],
      transactions: [],
      totalValue: 0,
      message: `Portfolio data for Chain ${chainId} not available via Moralis APIs`,
      fallback: true,
      recommendedAction: 'Use local PulseChain APIs or cache data',
      walletAddress: walletAddress,
      chainId: chainId
    };
  }
  
  /**
   * 🎯 Override fetch für automatische Interception
   */
  static enableGlobalInterception() {
    if (typeof window !== 'undefined' && !window.__apiInterceptorEnabled) {
      const originalFetch = window.fetch;
      
      window.fetch = async (url, options = {}) => {
        // Nur Moralis API Calls intercepten
        if (url.includes('/api/moralis-') || url.includes('moralis')) {
          return await this.interceptMoralisApiCall(url, options);
        }
        
        // Alle anderen Calls normal durchführen
        return await originalFetch(url, options);
      };
      
      window.__apiInterceptorEnabled = true;
      console.log('🛡️ API INTERCEPTOR: Global interception enabled');
    }
  }
  
  /**
   * 🔧 Disable Global Interception
   */
  static disableGlobalInterception() {
    if (typeof window !== 'undefined' && window.__originalFetch) {
      window.fetch = window.__originalFetch;
      window.__apiInterceptorEnabled = false;
      console.log('🛡️ API INTERCEPTOR: Global interception disabled');
    }
  }
}

// Auto-enable in Browser
if (typeof window !== 'undefined') {
  ApiInterceptorService.enableGlobalInterception();
} 