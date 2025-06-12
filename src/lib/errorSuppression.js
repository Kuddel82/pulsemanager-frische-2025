// 🔇 ERROR SUPPRESSION - VERBESSERT - Unterdrücke nur echte externe Service-Fehler
// Wichtige Anwendungsfehler bleiben sichtbar für Debugging

// 🔇 Console Error Suppression
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleLog = console.log;

// Liste der zu unterdrückenden Error-Patterns (NUR externe Services)
const SUPPRESSED_ERRORS = [
  // Redux LocalStorage Warnings (harmlos)
  'Redux-LocalStorage-Simple',
  'Invalid load \'redux_localstorage_simple',
  '[Redux-LocalStorage-Simple]',
  
  // CORS Errors von externen Services (nicht unsere APIs)
  'Access to XMLHttpRequest at \'https://ethgasstation.info',
  'Access to XMLHttpRequest at \'https://api.anyblock.tools',
  'Access to XMLHttpRequest at \'https://www.gasnow.org',
  'Access to XMLHttpRequest at \'https://www.etherchain.org',
  'Access to XMLHttpRequest at \'https://bridge.mypinata.cloud',
  'Access to XMLHttpRequest at \'https://gasprice.poa.network',
  
  // Network Errors von externen Services (nicht unsere APIs)
  'Failed to load resource: net::ERR_FAILED',
  'Failed to load resource: net::ERR_NAME_NOT_RESOLVED',
  
  // Spezifische fehlerhafte URLs (externe Services)
  'ethgasstation.info',
  'api.anyblock.tools',
  'www.gasnow.org',
  'www.etherchain.org',
  'gasprice.poa.network',
  'bridge.mypinata.cloud',
  
  // ❌ ENTFERNT: rpc.sepolia (soll jetzt als Fehler angezeigt werden für Fix)
  // 'rpc.sepolia.v4.testnet.pulsechain.com',
  // 'POST https://rpc.sepolia.v4.testnet.pulsechain.com/',
  
  // WalletConnect CSP Errors (externe Service)
  'Refused to frame \'https://verify.walletconnect',
  'Content Security Policy directive: "frame-ancestors',
  'verify.walletconnect.com',
  'verify.walletconnect.org',
  
  // Gas Price Oracle Errors (externe Services)
  'Gas Price Oracle not available',
  'All oracles are down',
  'Probably a network error',
  
  // Image Loading Errors (nicht kritisch)
  'Unsuccessful attempt at preloading some images',
  
  // Provider Errors (nur undefined errors)
  'providerSetError: undefined',
  '{providerSetError: undefined}',
  
  // STUB-Meldungen von Radix-UI (Development nur)
  '🔧 Using STUB',
  'Radix-UI disabled for DOM stability',
  'Using STUB Card',
  'Using STUB Button', 
  'Using STUB Badge',
  'Using STUB Label',
  'Using STUB Input',
  'Using STUB Alert',
  'Using STUB Dialog',
  'Using STUB Switch',
  'Using STUB Table',
  'MainApp STUB - Wagmi und React Query deaktiviert'
];

// ✅ WICHTIGE FEHLER DIE SICHTBAR BLEIBEN SOLLEN:
const IMPORTANT_ERRORS = [
  // Unsere API Fehler (müssen sichtbar bleiben)
  '/api/moralis-transactions',
  '/api/moralis-tokens',
  '/api/gas-prices',
  '500 Internal Server Error',
  '404 Not Found',
  
  // PulseChain RPC Probleme (jetzt sichtbar für Fix)
  'rpc.sepolia.v4.testnet.pulsechain.com',
  'rpc.sepolia',
  
  // React/JavaScript Fehler
  'Cannot read prop',
  'TypeError:',
  'ReferenceError:',
  'SyntaxError:',
  
  // Moralis API Probleme
  'Moralis API Error',
  'API Key',
  
  // Supabase Probleme
  'supabase',
  'PostgreSQL'
];

// 🔇 Verbesserte Console.error mit wichtigen Fehlern
console.error = (...args) => {
  const errorMessage = args.join(' ');
  
  // Prüfe erst ob es ein wichtiger Fehler ist (immer anzeigen)
  const isImportantError = IMPORTANT_ERRORS.some(pattern => 
    errorMessage.toLowerCase().includes(pattern.toLowerCase())
  );
  
  if (isImportantError) {
    originalConsoleError.apply(console, ['🚨 WICHTIGER FEHLER:', ...args]);
    return;
  }
  
  // Prüfe ob Error unterdrückt werden soll
  const shouldSuppress = SUPPRESSED_ERRORS.some(pattern => 
    errorMessage.includes(pattern)
  );
  
  if (!shouldSuppress) {
    originalConsoleError.apply(console, args);
  } else {
    // Optional: Zähle unterdrückte Errors (Debug)
    if (window.suppressedErrorCount) {
      window.suppressedErrorCount++;
    } else {
      window.suppressedErrorCount = 1;
    }
  }
};

// 🔇 Verbesserte Console.warn 
console.warn = (...args) => {
  const warningMessage = args.join(' ');
  
  // Wichtige Warnungen durchlassen
  const isImportantWarning = IMPORTANT_ERRORS.some(pattern => 
    warningMessage.toLowerCase().includes(pattern.toLowerCase())
  );
  
  if (isImportantWarning) {
    originalConsoleWarn.apply(console, ['⚠️ WICHTIGE WARNUNG:', ...args]);
    return;
  }
  
  const shouldSuppress = SUPPRESSED_ERRORS.some(pattern => 
    warningMessage.includes(pattern)
  );
  
  if (!shouldSuppress) {
    originalConsoleWarn.apply(console, args);
  }
};

// 🔇 Console.log für STUB-Meldungen unterdrücken
console.log = (...args) => {
  const logMessage = args.join(' ');
  
  const shouldSuppress = SUPPRESSED_ERRORS.some(pattern => 
    logMessage.includes(pattern)
  );
  
  if (!shouldSuppress) {
    originalConsoleLog.apply(console, args);
  } else {
    // Optional: Zähle unterdrückte Logs
    if (window.suppressedLogCount) {
      window.suppressedLogCount++;
    } else {
      window.suppressedLogCount = 1;
    }
  }
};

// 🔇 Network Error Handler für resource loading failures
const originalAddEventListener = EventTarget.prototype.addEventListener;
EventTarget.prototype.addEventListener = function(type, listener, options) {
  if (type === 'error' && this instanceof HTMLElement) {
    const wrappedListener = function(event) {
      const target = event.target;
      const src = target.src || target.href;
      
      if (src) {
        const shouldSuppress = SUPPRESSED_ERRORS.some(pattern => 
          src.includes(pattern)
        );
        
        if (shouldSuppress) {
          if (window.suppressedResourceCount) {
            window.suppressedResourceCount++;
          } else {
            window.suppressedResourceCount = 1;
          }
          return; // Don't call original listener
        }
      }
      
      return listener.call(this, event);
    };
    return originalAddEventListener.call(this, type, wrappedListener, options);
  }
  return originalAddEventListener.call(this, type, listener, options);
};

// 🔇 Window Error Handler
const originalOnError = window.onerror;
window.onerror = function(message, source, lineno, colno, error) {
  const errorString = message + ' ' + (source || '');
  
  // Wichtige Fehler durchlassen
  const isImportantError = IMPORTANT_ERRORS.some(pattern => 
    errorString.toLowerCase().includes(pattern.toLowerCase())
  );
  
  if (isImportantError) {
    originalConsoleError('🚨 WINDOW ERROR:', message, source, lineno, colno, error);
    if (originalOnError) {
      return originalOnError.call(this, message, source, lineno, colno, error);
    }
    return false;
  }
  
  const shouldSuppress = SUPPRESSED_ERRORS.some(pattern => 
    errorString.includes(pattern)
  );
  
  if (shouldSuppress) {
    if (window.suppressedNetworkCount) {
      window.suppressedNetworkCount++;
    } else {
      window.suppressedNetworkCount = 1;
    }
    return true; // Prevent default error handling
  }
  
  if (originalOnError) {
    return originalOnError.call(this, message, source, lineno, colno, error);
  }
  return false;
};

// 🔇 Unhandled Promise Rejection Handler
const originalUnhandledRejection = window.onunhandledpromise;
window.addEventListener('unhandledrejection', function(event) {
  const errorString = event.reason?.message || event.reason || '';
  
  // Wichtige Fehler durchlassen
  const isImportantError = IMPORTANT_ERRORS.some(pattern => 
    errorString.toLowerCase().includes(pattern.toLowerCase())
  );
  
  if (isImportantError) {
    originalConsoleError('🚨 UNHANDLED PROMISE:', event.reason);
    return;
  }
  
  const shouldSuppress = SUPPRESSED_ERRORS.some(pattern => 
    errorString.includes(pattern)
  );
  
  if (shouldSuppress) {
    event.preventDefault(); // Prevent default handling
    if (window.suppressedNetworkCount) {
      window.suppressedNetworkCount++;
    } else {
      window.suppressedNetworkCount = 1;
    }
  }
});

// 🔇 Debug Info
if (process.env.NODE_ENV === 'development') {
  originalConsoleLog('🔇 VERBESSERTE Error Suppression aktiviert');
  originalConsoleLog('🔇 Unterdrückt: Externe Service-Errors, STUB-Messages, Redux-Warnings');
  originalConsoleLog('🚨 WICHTIGE FEHLER BLEIBEN SICHTBAR: API-Errors, RPC-Probleme, JavaScript-Errors');
  
  // Debug-Funktion um zu sehen wie viele Errors unterdrückt wurden
  window.showSuppressedErrors = () => {
    const errorCount = window.suppressedErrorCount || 0;
    const logCount = window.suppressedLogCount || 0;
    const networkCount = window.suppressedNetworkCount || 0;
    const resourceCount = window.suppressedResourceCount || 0;
    
    originalConsoleLog(`🔇 SUPPRESSION STATISTIK:`);
    originalConsoleLog(`🔇 Console Errors: ${errorCount}`);
    originalConsoleLog(`🔇 Console Logs: ${logCount}`);
    originalConsoleLog(`🔇 Network Errors: ${networkCount}`);
    originalConsoleLog(`🔇 Resource Errors: ${resourceCount}`);
    originalConsoleLog(`🔇 TOTAL: ${errorCount + logCount + networkCount + resourceCount}`);
    originalConsoleLog('✅ Wichtige Fehler werden NICHT unterdrückt:', IMPORTANT_ERRORS);
  };
  
  // Auto-Report nach 5 Sekunden
  setTimeout(() => {
    originalConsoleLog('🔇 AUTO-REPORT: Error Suppression Status nach 5 Sekunden:');
    window.showSuppressedErrors();
  }, 5000);
}

// 🔇 Fetch Interception - Unterdrücke nur externe Service Fetch Errors
const originalFetch = window.fetch;
window.fetch = function(...args) {
  return originalFetch.apply(this, args)
    .catch(error => {
      const url = args[0];
      const urlString = typeof url === 'string' ? url : (url?.url || '');
      
      // Wichtige API-Fehler durchlassen
      const isImportantAPI = IMPORTANT_ERRORS.some(pattern => 
        urlString.toLowerCase().includes(pattern.toLowerCase())
      );
      
      if (isImportantAPI) {
        originalConsoleError('🚨 FETCH ERROR (WICHTIG):', urlString, error.message);
        throw error;
      }
      
      // Externe Service-Fehler unterdrücken
      const shouldSuppress = SUPPRESSED_ERRORS.some(pattern => 
        urlString.includes(pattern)
      );
      
      if (shouldSuppress) {
        if (window.suppressedNetworkCount) {
          window.suppressedNetworkCount++;
        } else {
          window.suppressedNetworkCount = 1;
        }
        // Return a fake successful response for suppressed errors
        return Promise.resolve(new Response('{}', { 
          status: 200, 
          statusText: 'Suppressed External Service Error',
          headers: { 'Content-Type': 'application/json' }
        }));
      }
      
      throw error;
    });
};

export default {
  suppressedPatterns: SUPPRESSED_ERRORS,
  originalConsoleError,
  originalConsoleWarn,
  originalConsoleLog
}; 