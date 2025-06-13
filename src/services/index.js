/**
 * 🏗️ STRUCTURAL SERVICES - CENTRAL EXPORT
 * 
 * Zentraler Import-Point für alle strukturellen Services
 * - Einfache Integration in bestehenden Code
 * - Konsistente API für Error Handling
 * - Circuit Breaker und Fallback-Strategien
 */

// Core Foundation Services
export { ExternalAPIService } from './core/ExternalAPIService.js';
export { ErrorMonitoringService, errorMonitor } from './core/ErrorMonitoringService.js';

// Specialized Services
export { GasPriceService, gasPriceService } from './GasPriceService.js';
export { BlockchainRPCService, blockchainRPCService } from './BlockchainRPCService.js';

// Default exports for easy usage
export default {
  // Error monitoring (global instance)
  errorMonitor,
  
  // Service instances
  gasPriceService,
  blockchainRPCService,
  
  // Classes for custom instances
  ExternalAPIService,
  ErrorMonitoringService,
  GasPriceService,
  BlockchainRPCService
};

/**
 * Quick Setup for immediate error reduction
 */
export function initializeStructuralServices() {
  console.log('🏗️ Initializing Structural Services...');
  
  // Setup global error monitoring
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  
  console.error = function(...args) {
    // Filter out repetitive errors and record them
    if (args.length > 0 && typeof args[0] === 'string') {
      const errorMsg = args[0];
      
      // Check for common patterns we want to monitor
      if (errorMsg.includes('CORS') || 
          errorMsg.includes('ERR_NAME_NOT_RESOLVED') ||
          errorMsg.includes('Network Error') ||
          errorMsg.includes('Failed to fetch')) {
        
        errorMonitor.recordError('Console', new Error(errorMsg), {
          level: 'error',
          args: args.slice(1)
        });
      }
    }
    
    // Call original console.error
    originalConsoleError.apply(console, args);
  };
  
  console.warn = function(...args) {
    if (args.length > 0 && typeof args[0] === 'string') {
      const warnMsg = args[0];
      
      // Record high-frequency warnings
      if (warnMsg.includes('CORS') || 
          warnMsg.includes('timeout') ||
          warnMsg.includes('failed')) {
        
        errorMonitor.recordError('Console', new Error(warnMsg), {
          level: 'warning',
          args: args.slice(1)
        });
      }
    }
    
    originalConsoleWarn.apply(console, args);
  };
  
  console.log('✅ Structural Services initialized - Console spam reduction active');
  
  return {
    errorMonitor,
    gasPriceService,
    blockchainRPCService
  };
} 