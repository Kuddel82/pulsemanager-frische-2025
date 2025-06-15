/**
 * 🔇 PRODUCTION LOGGER SYSTEM
 * 
 * Ersetzt alle console.log in Production durch kontrollierte Logs
 * Max. 1-2 Log-Einträge pro API-Call in Production
 */

const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;

// 📊 LOG LEVELS
const LOG_LEVELS = {
  ERROR: 0,   // Immer loggen
  WARN: 1,    // In Production: Nur kritische Warnungen
  INFO: 2,    // In Production: Nur wichtige Info (1-2 pro Request)
  DEBUG: 3    // Nur in Development
};

class Logger {
  constructor(context = 'SYSTEM') {
    this.context = context;
    this.currentLevel = isProduction ? LOG_LEVELS.WARN : LOG_LEVELS.DEBUG;
  }

  // ❌ ERROR: Immer loggen (kritische Fehler)
  error(message, ...args) {
    if (this.currentLevel >= LOG_LEVELS.ERROR) {
      console.error(`❌ [${this.context}] ${message}`, ...args);
    }
  }

  // ⚠️ WARN: In Production nur kritische Warnungen
  warn(message, ...args) {
    if (this.currentLevel >= LOG_LEVELS.WARN) {
      console.warn(`⚠️ [${this.context}] ${message}`, ...args);
    }
  }

  // ℹ️ INFO: In Production max. 1-2 wichtige Logs pro Request
  info(message, ...args) {
    if (this.currentLevel >= LOG_LEVELS.INFO) {
      console.log(`ℹ️ [${this.context}] ${message}`, ...args);
    }
  }

  // 🔧 DEBUG: Nur in Development (verbose logging)
  debug(message, ...args) {
    if (this.currentLevel >= LOG_LEVELS.DEBUG) {
      console.log(`🔧 [${this.context}] ${message}`, ...args);
    }
  }

  // ✅ SUCCESS: Nur wichtige Erfolgs-Meldungen in Production
  success(message, ...args) {
    if (isProduction) {
      // In Production: Nur finale Resultate
      if (message.includes('completed') || message.includes('SUCCESS') || message.includes('generated')) {
        console.log(`✅ [${this.context}] ${message}`, ...args);
      }
    } else {
      console.log(`✅ [${this.context}] ${message}`, ...args);
    }
  }

  // 🚀 API: Spezielle API-Logs (1 Log pro Request in Production)
  api(endpoint, result, duration = null) {
    if (isProduction) {
      const durationText = duration ? ` (${duration}ms)` : '';
      console.log(`🚀 [${this.context}] ${endpoint} completed${durationText}`);
    } else {
      console.log(`🚀 [${this.context}] ${endpoint}`, result);
    }
  }
}

// 📦 EXPORT FACTORY
export function createLogger(context) {
  return new Logger(context);
}

// 🌐 DEFAULT LOGGER
export const logger = new Logger('APP');

// 🔄 BACKWARD COMPATIBILITY WRAPPER
export function wrapConsole() {
  if (isProduction) {
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;

    // In Production: Filtere console.log aber behalte Error/Warn
    console.log = function(message, ...args) {
      // Nur wichtige Logs durchlassen
      if (
        message?.includes('✅') || 
        message?.includes('❌') || 
        message?.includes('completed') ||
        message?.includes('SUCCESS') ||
        message?.includes('generated')
      ) {
        originalLog(message, ...args);
      }
      // Alle anderen console.log werden unterdrückt
    };

    console.warn = originalWarn; // Warnungen bleiben
    console.error = originalError; // Fehler bleiben
  }
}

export default Logger; 