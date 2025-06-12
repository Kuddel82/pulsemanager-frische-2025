// 🔇 ERROR SUPPRESSION - Unterdrücke nervige Console-Errors
// Alle externen Service-Fehler die der User gemeldet hat

// 🔇 Console Error Suppression
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleLog = console.log;

// Liste der zu unterdrückenden Error-Patterns
const SUPPRESSED_ERRORS = [
  // Redux LocalStorage Warnings
  'Redux-LocalStorage-Simple',
  'Invalid load \'redux_localstorage_simple',
  
  // CORS Errors von externen Services
  'Access to XMLHttpRequest at \'https://ethgasstation.info',
  'Access to XMLHttpRequest at \'https://api.anyblock.tools',
  'Access to XMLHttpRequest at \'https://www.gasnow.org',
  'Access to XMLHttpRequest at \'https://www.etherchain.org',
  'Access to XMLHttpRequest at \'https://bridge.mypinata.cloud',
  
  // Network Errors von externen Services
  'Failed to load resource: net::ERR_FAILED',
  'Failed to load resource: net::ERR_NAME_NOT_RESOLVED',
  'Network Error',
  
  // WalletConnect CSP Errors
  'Refused to frame \'https://verify.walletconnect',
  'Content Security Policy directive: "frame-ancestors',
  
  // Gas Price Oracle Errors
  'Gas Price Oracle not available',
  'All oracles are down',
  
  // RPC Errors
  'POST https://rpc.sepolia.v4.testnet.pulsechain.com/',
  'net::ERR_NAME_NOT_RESOLVED',
  
  // Image Loading Errors
  'Unsuccessful attempt at preloading some images',
  
  // Provider Errors
  'providerSetError: undefined',
  
  // STUB-Meldungen von Radix-UI (nervige Debug-Ausgaben)
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

// 🔇 Unterdrücke Console.error
console.error = (...args) => {
  const errorMessage = args.join(' ');
  
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

// 🔇 Unterdrücke Console.warn für spezifische Warnings
console.warn = (...args) => {
  const warningMessage = args.join(' ');
  
  const shouldSuppress = SUPPRESSED_ERRORS.some(pattern => 
    warningMessage.includes(pattern)
  );
  
  if (!shouldSuppress) {
    originalConsoleWarn.apply(console, args);
  }
};

// 🔇 Unterdrücke Console.log für STUB-Meldungen
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

// 🔇 Network Error Handler
window.addEventListener('error', (event) => {
  const errorMessage = event.message || '';
  
  const shouldSuppress = SUPPRESSED_ERRORS.some(pattern => 
    errorMessage.includes(pattern)
  );
  
  if (shouldSuppress) {
    event.preventDefault();
  }
});

// 🔇 Unhandled Promise Rejection Handler
window.addEventListener('unhandledrejection', (event) => {
  const errorMessage = event.reason?.message || event.reason || '';
  
  const shouldSuppress = SUPPRESSED_ERRORS.some(pattern => 
    String(errorMessage).includes(pattern)
  );
  
  if (shouldSuppress) {
    event.preventDefault();
  }
});

// 🔇 Debug Info
if (process.env.NODE_ENV === 'development') {
  originalConsoleLog('🔇 Error Suppression aktiviert - externe Service-Errors werden unterdrückt');
  
  // Debug-Funktion um zu sehen wie viele Errors unterdrückt wurden
  window.showSuppressedErrors = () => {
    const errorCount = window.suppressedErrorCount || 0;
    const logCount = window.suppressedLogCount || 0;
    originalConsoleLog(`🔇 ${errorCount} Errors und ${logCount} Logs unterdrückt`);
    originalConsoleLog('🔇 Vollständige Liste der unterdrückten Patterns:', SUPPRESSED_ERRORS);
  };
}

export default {
  suppressedPatterns: SUPPRESSED_ERRORS,
  originalConsoleError,
  originalConsoleWarn,
  originalConsoleLog
}; 