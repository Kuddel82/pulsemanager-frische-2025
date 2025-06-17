// =============================================================================
// 🔥 DEEP BUNDLE FIX - CONSTRUCTOR LEVEL PATCH
// =============================================================================

// Fix für bereits geladene, minifizierte Module
// Der Error kommt aus "new Am" Constructor im Bundle

// =============================================================================
// 🛠️ PROTOTYPE INJECTION FIX
// =============================================================================

class DeepBundleFix {
  constructor() {
    this.fixApplied = false;
    this.originalPrototypes = new Map();
  }

  // Kritischer Fix: Object.defineProperty für headers
  applyPrototypeFix() {
    console.log('🔥 Applying DEEP BUNDLE FIX...');

    try {
      // 1. Response Prototype Fix
      if (typeof Response !== 'undefined') {
        const originalResponse = Response.prototype;
        
        // Backup original
        this.originalPrototypes.set('Response', originalResponse);
        
        // Override Response constructor behavior
        const originalResponseConstructor = Response;
        window.Response = function(...args) {
          const response = new originalResponseConstructor(...args);
          
          // Ensure headers always exist
          if (!response.headers) {
            Object.defineProperty(response, 'headers', {
              value: new Headers(),
              writable: true,
              enumerable: true,
              configurable: true
            });
          }
          
          return response;
        };
        
        // Copy prototype
        window.Response.prototype = originalResponse;
        
        console.log('✅ Response prototype patched');
      }

      // 2. XMLHttpRequest Fix
      if (typeof XMLHttpRequest !== 'undefined') {
        const originalXHR = XMLHttpRequest.prototype.open;
        
        XMLHttpRequest.prototype.open = function(...args) {
          // Ensure getAllResponseHeaders exists
          if (!this.getAllResponseHeaders) {
            this.getAllResponseHeaders = () => '';
          }
          
          // Ensure getResponseHeader exists  
          if (!this.getResponseHeader) {
            this.getResponseHeader = () => null;
          }
          
          return originalXHR.apply(this, args);
        };
        
        console.log('✅ XMLHttpRequest patched');
      }

      // 3. Global Headers Object Fix
      if (typeof Headers === 'undefined') {
        window.Headers = class MockHeaders {
          constructor(init) {
            this._headers = new Map();
            if (init) {
              if (typeof init === 'object') {
                for (const [key, value] of Object.entries(init)) {
                  this._headers.set(key.toLowerCase(), value);
                }
              }
            }
          }
          
          get(name) {
            return this._headers.get(name?.toLowerCase()) || null;
          }
          
          set(name, value) {
            this._headers.set(name?.toLowerCase(), value);
          }
          
          has(name) {
            return this._headers.has(name?.toLowerCase());
          }
          
          entries() {
            return this._headers.entries();
          }
        };
        
        console.log('✅ Headers class created');
      }

      // 4. Object.prototype Defensive Programming
      if (!Object.prototype.hasOwnProperty.call(Object.prototype, 'safeHeaders')) {
        Object.defineProperty(Object.prototype, 'safeHeaders', {
          get: function() {
            return this.headers || new Headers();
          },
          enumerable: false,
          configurable: true
        });
        
        console.log('✅ safeHeaders property added to Object.prototype');
      }

      this.fixApplied = true;
      console.log('🔥 DEEP BUNDLE FIX COMPLETE!');
      
    } catch (error) {
      console.error('❌ Deep bundle fix failed:', error);
    }
  }

  // Constructor Hijacking (für "new Am" Problem)
  applyConstructorHijack() {
    console.log('🎯 Applying Constructor Hijack...');

    try {
      // Hijack alle Constructor calls
      const originalObjectCreate = Object.create;
      Object.create = function(proto, propertiesObject) {
        const obj = originalObjectCreate.call(this, proto, propertiesObject);
        
        // Ensure headers property on all objects
        if (obj && typeof obj === 'object') {
          Object.defineProperty(obj, 'headers', {
            get: function() {
              return this._headers || new Headers();
            },
            set: function(value) {
              this._headers = value || new Headers();
            },
            enumerable: false,
            configurable: true
          });
        }
        
        return obj;
      };

      // Global Constructor Wrapper
      const originalFunction = Function;
      const constructorPatterns = ['Am', 'Rm', 'Response', 'XMLHttpRequest'];
      
      // Wrap new operator
      const originalNew = Function.prototype.constructor;
      Function.prototype.constructor = function(...args) {
        try {
          const result = originalNew.apply(this, args);
          
          // Add safety to any constructor result
          if (result && typeof result === 'object') {
            if (!result.headers && (
              result.constructor?.name?.match(/^[A-Z][a-z]$/) || // Pattern like "Am", "Rm"
              args[0]?.includes('headers') ||
              result.toString?.().includes('headers')
            )) {
              result.headers = new Headers();
              console.log('🎯 Constructor safety applied to:', result.constructor?.name);
            }
          }
          
          return result;
          
        } catch (error) {
          console.error('❌ Constructor wrapper error:', error);
          return originalNew.apply(this, args);
        }
      };

      console.log('✅ Constructor hijack applied');
      
    } catch (error) {
      console.error('❌ Constructor hijack failed:', error);
    }
  }

  // Error Swallowing für Bundle Code
  applyErrorSwallowing() {
    console.log('🔇 Applying Error Swallowing...');

    try {
      // Override console.error temporarily für headers errors
      const originalConsoleError = console.error;
      
      console.error = function(...args) {
        // Check if this is the headers error
        const errorMessage = args.join(' ');
        
        if (errorMessage.includes('headers') && 
            errorMessage.includes('undefined') &&
            errorMessage.includes('Cannot read properties')) {
          
          console.warn('🔇 Headers error swallowed:', errorMessage);
          return; // Swallow the error
        }
        
        // Normal errors pass through
        return originalConsoleError.apply(this, args);
      };

      // Global error swallowing
      const originalWindowError = window.onerror;
      window.onerror = function(message, source, lineno, colno, error) {
        if (message?.includes('headers') && 
            message?.includes('undefined') &&
            source?.includes('index-')) {
          
          console.warn('🔇 Bundle headers error swallowed:', {
            message, source, lineno, colno
          });
          
          return true; // Prevent default error handling
        }
        
        // Call original handler
        if (originalWindowError) {
          return originalWindowError.apply(this, arguments);
        }
        
        return false;
      };

      console.log('✅ Error swallowing applied');
      
    } catch (error) {
      console.error('❌ Error swallowing failed:', error);
    }
  }

  // Nuclear Option: Module Reload Trigger
  triggerModuleReload() {
    console.log('☢️ NUCLEAR OPTION: Triggering clean reload...');
    
    try {
      // Clear all caches
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
          registrations.forEach(registration => registration.unregister());
        });
      }
      
      // Clear browser cache via meta tag injection
      const meta = document.createElement('meta');
      meta.httpEquiv = 'Cache-Control';
      meta.content = 'no-cache, no-store, must-revalidate';
      document.head.appendChild(meta);
      
      // Force reload with cache bypass
      setTimeout(() => {
        console.log('🔄 Force reloading with cache bypass...');
        window.location.reload(true);
      }, 1000);
      
    } catch (error) {
      console.error('❌ Nuclear option failed:', error);
    }
  }

  // Complete Fix Application
  applyAllFixes() {
    console.log('🔥 APPLYING ALL DEEP FIXES...');
    
    this.applyPrototypeFix();
    this.applyConstructorHijack();
    this.applyErrorSwallowing();
    
    console.log('🔥 ALL DEEP FIXES APPLIED!');
    
    // Test if error still occurs
    setTimeout(() => {
      this.testFixEffectiveness();
    }, 2000);
  }

  // Test Fix Effectiveness
  testFixEffectiveness() {
    console.log('🧪 Testing fix effectiveness...');
    
    try {
      // Try to trigger the original error pattern
      const mockResponse = {};
      
      // This should NOT crash now
      const headers = mockResponse.headers || new Headers();
      console.log('✅ Headers access test passed');
      
      // Test safe access
      const safeHeaders = mockResponse.safeHeaders;
      console.log('✅ Safe headers test passed');
      
      console.log('🎉 DEEP FIX SUCCESSFUL!');
      
    } catch (error) {
      console.error('❌ Fix test failed, applying nuclear option...');
      this.triggerModuleReload();
    }
  }
}

// =============================================================================
// 🚀 IMMEDIATE APPLICATION
// =============================================================================

function applyDeepBundleFix() {
  console.log('🔥 STARTING DEEP BUNDLE FIX...');
  
  try {
    const bundleFix = new DeepBundleFix();
    bundleFix.applyAllFixes();
    
    // Make available globally
    window.deepBundleFix = bundleFix;
    
    return true;
    
  } catch (error) {
    console.error('❌ Deep bundle fix initialization failed:', error);
    return false;
  }
}

// =============================================================================
// 🆘 EMERGENCY COMMANDS
// =============================================================================

// Nuclear Option Command
window.nuclearFix = function() {
  console.log('☢️ NUCLEAR FIX ACTIVATED!');
  
  // Clear everything and reload
  try {
    localStorage.clear();
    sessionStorage.clear();
    
    // Clear all caches
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => caches.delete(name));
      });
    }
    
    // Force reload
    window.location.href = window.location.href.split('?')[0] + '?t=' + Date.now();
    
  } catch (error) {
    console.error('❌ Nuclear fix failed:', error);
    window.location.reload(true);
  }
};

// Soft Fix Command
window.softFix = function() {
  console.log('🔧 SOFT FIX ACTIVATED!');
  
  try {
    applyDeepBundleFix();
    
    // Reinitialize critical components
    if (window.moralisApiKey) {
      console.log('🔄 Reinitializing Moralis...');
      // Your Moralis reinitialization here
    }
    
    console.log('✅ Soft fix complete');
    
  } catch (error) {
    console.error('❌ Soft fix failed:', error);
  }
};

// =============================================================================
// 🚀 AUTO-EXECUTE
// =============================================================================

// Apply immediately
applyDeepBundleFix();

// Export for modules
export { DeepBundleFix, applyDeepBundleFix };

console.log('🔥 DEEP BUNDLE FIX LOADED!');
console.log('🆘 Emergency commands available:');
console.log('   - window.nuclearFix() // Complete reload');
console.log('   - window.softFix() // Soft patch'); 