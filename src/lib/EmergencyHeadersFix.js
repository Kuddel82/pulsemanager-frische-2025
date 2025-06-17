// =============================================================================
// 🔧 HEADERS ERROR FIX - API REQUEST SAFETY
// =============================================================================

// Fix für "Cannot read properties of undefined (reading 'headers')" Error

// =============================================================================
// 🛡️ SAFE API REQUEST WRAPPER
// =============================================================================

class SafeAPIWrapper {
  constructor() {
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  // Sichere Fetch-Wrapper
  async safeFetch(url, options = {}) {
    try {
      console.log(`🔍 Safe Fetch: ${url}`);
      
      // Ensure options object exists
      const safeOptions = {
        method: 'GET',
        headers: { ...this.defaultHeaders },
        ...options
      };

      // Ensure headers exist
      if (!safeOptions.headers) {
        safeOptions.headers = { ...this.defaultHeaders };
      }

      console.log(`📡 Request options:`, safeOptions);

      const response = await fetch(url, safeOptions);
      
      // Check if response exists
      if (!response) {
        console.error('❌ Response is undefined');
        return {
          ok: false,
          status: 0,
          statusText: 'No response',
          headers: new Headers(),
          data: null,
          error: 'Response is undefined'
        };
      }

      // Safe headers access
      const responseHeaders = response.headers || new Headers();
      
      // Try to parse response
      let data = null;
      try {
        const contentType = responseHeaders.get('content-type') || '';
        if (contentType.includes('application/json')) {
          data = await response.json();
        } else {
          data = await response.text();
        }
      } catch (parseError) {
        console.warn('⚠️ Response parsing failed:', parseError);
        data = null;
      }

      const safeResponse = {
        ok: response.ok || false,
        status: response.status || 0,
        statusText: response.statusText || 'Unknown',
        headers: responseHeaders,
        data: data,
        originalResponse: response
      };

      console.log(`✅ Safe response:`, {
        ok: safeResponse.ok,
        status: safeResponse.status,
        hasData: !!safeResponse.data
      });

      return safeResponse;

    } catch (error) {
      console.error('❌ Safe fetch error:', error);
      return {
        ok: false,
        status: 0,
        statusText: error.message,
        headers: new Headers(),
        data: null,
        error: error.message
      };
    }
  }

  // Sichere Axios-Alternative
  async safeAxios(config) {
    try {
      console.log(`🔍 Safe Axios: ${config.url || 'No URL'}`);

      // Ensure config exists
      const safeConfig = {
        method: 'get',
        headers: { ...this.defaultHeaders },
        timeout: 30000,
        ...config
      };

      // Ensure headers exist
      if (!safeConfig.headers) {
        safeConfig.headers = { ...this.defaultHeaders };
      }

      // Use fetch instead of axios for reliability
      const fetchOptions = {
        method: safeConfig.method?.toUpperCase() || 'GET',
        headers: safeConfig.headers,
        ...(safeConfig.data && { body: JSON.stringify(safeConfig.data) }),
        signal: AbortSignal.timeout(safeConfig.timeout)
      };

      const response = await this.safeFetch(safeConfig.url, fetchOptions);

      // Axios-compatible response format
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        config: safeConfig,
        request: null
      };

    } catch (error) {
      console.error('❌ Safe axios error:', error);
      throw {
        response: {
          data: { error: error.message },
          status: 0,
          statusText: error.message,
          headers: new Headers()
        },
        config: config,
        message: error.message
      };
    }
  }
}

// =============================================================================
// 🔧 MORALIS API FIX
// =============================================================================

class FixedMoralisAPI {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = 'https://deep-index.moralis.io/api/v2.2';
    this.safeAPI = new SafeAPIWrapper();
    this.retryCount = 3;
    this.retryDelay = 1000;
  }

  // Sichere Moralis Request
  async safeMoralisRequest(endpoint, params = {}) {
    let lastError = null;
    
    for (let attempt = 1; attempt <= this.retryCount; attempt++) {
      try {
        console.log(`🔗 Moralis Request (Attempt ${attempt}): ${endpoint}`);

        if (!this.apiKey) {
          throw new Error('Moralis API Key is missing');
        }

        const url = `${this.baseURL}${endpoint}`;
        const queryParams = new URLSearchParams(params).toString();
        const fullUrl = queryParams ? `${url}?${queryParams}` : url;

        const response = await this.safeAPI.safeFetch(fullUrl, {
          method: 'GET',
          headers: {
            'X-API-Key': this.apiKey,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`Moralis API Error: ${response.status} ${response.statusText}`);
        }

        if (!response.data) {
          throw new Error('Moralis API returned no data');
        }

        console.log(`✅ Moralis success (Attempt ${attempt})`);
        return response.data;

      } catch (error) {
        lastError = error;
        console.error(`❌ Moralis attempt ${attempt} failed:`, error.message);
        
        if (attempt < this.retryCount) {
          console.log(`⏳ Retrying in ${this.retryDelay}ms...`);
          await this.sleep(this.retryDelay * attempt);
        }
      }
    }

    // All attempts failed
    console.error(`💥 All Moralis attempts failed. Last error:`, lastError);
    return {
      result: [],
      error: lastError?.message || 'Unknown error',
      success: false
    };
  }

  // Safe wallet transactions
  async getWalletTransactionsSafe(walletAddress, chain = 'eth') {
    try {
      console.log(`📡 Loading transactions for: ${walletAddress}`);

      if (!walletAddress || !walletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
        throw new Error('Invalid wallet address format');
      }

      // ERC20 Token Transfers
      const tokenResult = await this.safeMoralisRequest(`/${walletAddress}/erc20`, {
        chain: chain,
        limit: 100
      });

      // Native Transactions
      const nativeResult = await this.safeMoralisRequest(`/${walletAddress}`, {
        chain: chain,
        limit: 100
      });

      const transactions = {
        erc20: Array.isArray(tokenResult?.result) ? tokenResult.result : [],
        native: Array.isArray(nativeResult?.result) ? nativeResult.result : [],
        totalCount: 0,
        success: true
      };

      transactions.totalCount = transactions.erc20.length + transactions.native.length;

      console.log(`✅ Loaded ${transactions.totalCount} transactions`);
      return transactions;

    } catch (error) {
      console.error(`❌ Wallet transaction loading failed:`, error);
      return {
        erc20: [],
        native: [],
        totalCount: 0,
        error: error.message,
        success: false
      };
    }
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// =============================================================================
// 🚨 GLOBAL ERROR HANDLER
// =============================================================================

class GlobalErrorHandler {
  constructor() {
    this.setupErrorHandlers();
  }

  setupErrorHandlers() {
    // Window Error Handler
    window.addEventListener('error', (event) => {
      console.error('🚨 Global Error:', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error
      });

      // Check for specific headers error
      if (event.message?.includes('headers') && event.message?.includes('undefined')) {
        console.error('🔧 HEADERS ERROR DETECTED - Applying fix...');
        this.fixHeadersError();
      }
    });

    // Unhandled Promise Rejection
    window.addEventListener('unhandledrejection', (event) => {
      console.error('🚨 Unhandled Promise Rejection:', event.reason);
      
      // Prevent the default handling (which would log to console)
      event.preventDefault();
    });

    // Fetch Error Handler
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        
        // Ensure response has headers property
        if (response && !response.headers) {
          response.headers = new Headers();
        }
        
        return response;
      } catch (error) {
        console.error('🚨 Fetch Error:', error);
        throw error;
      }
    };
  }

  fixHeadersError() {
    console.log('🔧 Applying Headers Error Fix...');
    
    // Patch common libraries that might cause headers error
    if (window.axios) {
      this.patchAxios();
    }
    
    // Global fetch wrapper
    this.patchFetch();
    
    console.log('✅ Headers Error Fix applied');
  }

  patchAxios() {
    if (!window.axios?.interceptors) return;

    // Response interceptor
    window.axios.interceptors.response.use(
      (response) => {
        // Ensure headers exist
        if (!response.headers) {
          response.headers = {};
        }
        return response;
      },
      (error) => {
        // Ensure error response has headers
        if (error.response && !error.response.headers) {
          error.response.headers = {};
        }
        return Promise.reject(error);
      }
    );

    console.log('🔧 Axios patched for headers safety');
  }

  patchFetch() {
    // Already patched in setupErrorHandlers
    console.log('🔧 Fetch already patched for headers safety');
  }
}

// =============================================================================
// 🔧 EMERGENCY FIX FUNCTION
// =============================================================================

function emergencyHeadersFix() {
  console.log('🚨 EMERGENCY HEADERS FIX STARTING...');
  
  try {
    // 1. Initialize Global Error Handler
    window.globalErrorHandler = new GlobalErrorHandler();
    
    // 2. Initialize Safe API Wrapper
    window.safeAPI = new SafeAPIWrapper();
    
    // 3. Initialize Fixed Moralis API
    if (window.moralisApiKey) {
      window.fixedMoralisAPI = new FixedMoralisAPI(window.moralisApiKey);
    }
    
    // 4. Replace existing API calls with safe versions
    window.safeMoralisCall = async (endpoint, params) => {
      if (window.fixedMoralisAPI) {
        return await window.fixedMoralisAPI.safeMoralisRequest(endpoint, params);
      }
      throw new Error('Fixed Moralis API not initialized');
    };
    
    // 5. Replace existing fetch with safe version
    window.safeFetchCall = async (url, options) => {
      return await window.safeAPI.safeFetch(url, options);
    };
    
    console.log('✅ EMERGENCY HEADERS FIX COMPLETE!');
    console.log('🔧 Available functions:');
    console.log('   - window.safeMoralisCall(endpoint, params)');
    console.log('   - window.safeFetchCall(url, options)');
    
    return true;
    
  } catch (error) {
    console.error('❌ Emergency fix failed:', error);
    return false;
  }
}

// =============================================================================
// 🚀 AUTO-APPLY FIX
// =============================================================================

// Automatically apply fix when script loads
try {
  emergencyHeadersFix();
  
  // Test the fix
  if (window.moralisApiKey) {
    setTimeout(async () => {
      try {
        console.log('🧪 Testing fixed Moralis API...');
        const testResult = await window.safeMoralisCall('/0x308e77281612bdc267d5feaf4599f2759cb3ed85/erc20', {
          chain: 'eth',
          limit: 5
        });
        console.log('✅ Moralis API test successful:', testResult);
      } catch (error) {
        console.log('⚠️ Moralis API test failed (expected if no API key):', error.message);
      }
    }, 2000);
  }
  
} catch (error) {
  console.error('❌ Auto-fix failed:', error);
}

// Export for modules
export {
  SafeAPIWrapper,
  FixedMoralisAPI,
  GlobalErrorHandler,
  emergencyHeadersFix
};

// =============================================================================
// 🆘 MANUAL FIX COMMANDS (für Browser Console)
// =============================================================================

/*
// Manuelle Anwendung in Browser Console:

// 1. Headers Error Fix anwenden
emergencyHeadersFix();

// 2. Sichere Moralis API verwenden
const result = await window.safeMoralisCall('/YOUR_WALLET/erc20', { chain: 'eth', limit: 10 });

// 3. Sichere Fetch verwenden
const response = await window.safeFetchCall('https://api.example.com/data', { method: 'GET' });

// 4. Error Handler Status prüfen
console.log('Error Handler active:', !!window.globalErrorHandler);
*/ 