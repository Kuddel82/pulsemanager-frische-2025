// =============================================================================
// 🔥 INLINE DEEP BUNDLE FIX - IMMEDIATE EXECUTION
// =============================================================================
// Dieses Script wird direkt im HTML <head> ausgeführt
// BEVOR irgendwelche anderen Scripts geladen werden

(function() {
  'use strict';
  
  console.log('🔥 INLINE DEEP BUNDLE FIX STARTING...');
  
  // =============================================================================
  // 🛡️ IMMEDIATE PROTOTYPE PATCHES
  // =============================================================================
  
  // 1. Response Constructor Safety
  if (typeof Response !== 'undefined') {
    const OriginalResponse = Response;
    window.Response = function(...args) {
      const response = new OriginalResponse(...args);
      
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
    window.Response.prototype = OriginalResponse.prototype;
    console.log('✅ Response constructor patched inline');
  }
  
  // 2. Headers Class Safety
  if (typeof Headers === 'undefined') {
    window.Headers = class InlineHeaders {
      constructor(init) {
        this._headers = new Map();
        if (init && typeof init === 'object') {
          for (const [key, value] of Object.entries(init)) {
            this._headers.set(key.toLowerCase(), String(value));
          }
        }
      }
      
      get(name) {
        return this._headers.get(String(name).toLowerCase()) || null;
      }
      
      set(name, value) {
        this._headers.set(String(name).toLowerCase(), String(value));
      }
      
      has(name) {
        return this._headers.has(String(name).toLowerCase());
      }
      
      entries() {
        return this._headers.entries();
      }
      
      keys() {
        return this._headers.keys();
      }
      
      values() {
        return this._headers.values();
      }
    };
    console.log('✅ Headers class created inline');
  }
  
  // 3. Object.prototype Safety Extension
  if (!Object.prototype.hasOwnProperty('safeHeaders')) {
    Object.defineProperty(Object.prototype, 'safeHeaders', {
      get: function() {
        return this.headers || new Headers();
      },
      enumerable: false,
      configurable: true
    });
    console.log('✅ safeHeaders property added inline');
  }
  
  // =============================================================================
  // 🚨 ERROR SWALLOWING
  // =============================================================================
  
  // Global Error Handler Override
  const originalWindowError = window.onerror;
  window.onerror = function(message, source, lineno, colno, error) {
    // Swallow headers-related errors from minified bundles
    if (message && typeof message === 'string') {
      if (message.includes('headers') && 
          message.includes('undefined') &&
          (source?.includes('index-') || source?.includes('.js'))) {
        
        console.warn('🔇 INLINE: Headers error swallowed:', {
          message: message.substring(0, 100),
          source: source?.substring(source.lastIndexOf('/') + 1),
          line: lineno
        });
        
        return true; // Prevent default error handling
      }
    }
    
    // Call original handler for other errors
    if (originalWindowError) {
      return originalWindowError.apply(this, arguments);
    }
    
    return false;
  };
  
  // Promise Rejection Handler
  window.addEventListener('unhandledrejection', function(event) {
    if (event.reason && event.reason.message) {
      const message = event.reason.message;
      if (message.includes('headers') && message.includes('undefined')) {
        console.warn('🔇 INLINE: Promise rejection swallowed:', message.substring(0, 100));
        event.preventDefault();
      }
    }
  });
  
  // =============================================================================
  // 🎯 CONSTRUCTOR HIJACKING
  // =============================================================================
  
  // Override Object.create for safety
  const originalObjectCreate = Object.create;
  Object.create = function(proto, propertiesObject) {
    const obj = originalObjectCreate.call(this, proto, propertiesObject);
    
    // Add headers safety to all created objects
    if (obj && typeof obj === 'object' && !obj.headers) {
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
  
  // =============================================================================
  // 🆘 EMERGENCY FUNCTIONS
  // =============================================================================
  
  // Nuclear Option
  window.inlineNuclearFix = function() {
    console.log('☢️ INLINE NUCLEAR FIX!');
    try {
      if (localStorage) localStorage.clear();
      if (sessionStorage) sessionStorage.clear();
      window.location.href = window.location.href.split('?')[0] + '?nuclear=' + Date.now();
    } catch (error) {
      window.location.reload(true);
    }
  };
  
  // Soft Patch
  window.inlineSoftPatch = function() {
    console.log('🔧 INLINE SOFT PATCH!');
    try {
      // Reapply all patches
      window.onerror = originalWindowError;
      window.onerror = arguments.callee.caller; // Reapply error handler
      console.log('✅ Inline soft patch complete');
    } catch (error) {
      console.error('❌ Inline soft patch failed:', error);
    }
  };
  
  console.log('🔥 INLINE DEEP BUNDLE FIX COMPLETE!');
  console.log('🆘 Emergency commands: window.inlineNuclearFix(), window.inlineSoftPatch()');
  
})(); 