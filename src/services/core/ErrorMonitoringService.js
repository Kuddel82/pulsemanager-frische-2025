/**
 * 🚨 ERROR MONITORING SERVICE - CONSOLE SPAM PREVENTION
 * 
 * Zentraler Service für:
 * - Error-Deduplication (verhindert Console-Spam)
 * - Error-Kategorisierung nach Schweregrad
 * - User-Notifications für kritische Fehler
 * - Error-Metrics und -Reporting
 * - Graceful Error Presentation
 */

class ErrorMonitoringService {
  constructor() {
    // Error Tracking
    this.errorCounts = new Map();
    this.errorFirstSeen = new Map();
    this.errorLastSeen = new Map();
    this.errorCategories = new Map();
    
    // Console Spam Prevention
    this.loggedErrors = new Set();
    this.suppressedErrors = new Set();
    this.maxLogCount = 3; // Max times to log same error
    
    // User Notifications
    this.userNotifications = new Set();
    this.notificationCallbacks = [];
    
    // Error Thresholds
    this.criticalThreshold = 10;  // >10 errors = critical
    this.warningThreshold = 5;    // >5 errors = warning
    
    // Error Categories
    this.initializeErrorCategories();
    
    // Performance Metrics
    this.metrics = {
      totalErrors: 0,
      criticalErrors: 0,
      suppressedLogs: 0,
      userNotifications: 0,
      startTime: Date.now()
    };
  }

  /**
   * Main Error Recording Method
   */
  recordError(source, error, context = {}) {
    const errorKey = this.generateErrorKey(source, error);
    const severity = this.categorizeError(source, error, context);
    const now = Date.now();
    
    // Update error counts and timestamps
    const count = this.errorCounts.get(errorKey) || 0;
    this.errorCounts.set(errorKey, count + 1);
    this.errorLastSeen.set(errorKey, now);
    
    if (!this.errorFirstSeen.has(errorKey)) {
      this.errorFirstSeen.set(errorKey, now);
    }
    
    // Update metrics
    this.metrics.totalErrors++;
    if (severity === 'critical') {
      this.metrics.criticalErrors++;
    }
    
    // Handle logging with spam prevention
    this.handleLogging(errorKey, source, error, count, severity, context);
    
    // Handle user notifications for critical errors
    this.handleUserNotification(errorKey, source, error, severity, context);
    
    // Return structured error info
    return {
      errorKey,
      count,
      severity,
      suppressed: this.suppressedErrors.has(errorKey),
      firstSeen: this.errorFirstSeen.get(errorKey),
      lastSeen: now
    };
  }

  /**
   * Console Spam Prevention Logic
   */
  handleLogging(errorKey, source, error, count, severity, context) {
    // Always log first occurrence
    if (count === 1) {
      this.logError(source, error, severity, context, count);
      return;
    }
    
    // Log second and third occurrence with warning
    if (count <= this.maxLogCount) {
      this.logError(source, error, severity, context, count, true);
      return;
    }
    
    // Suppress after maxLogCount, but log suppression notice
    if (count === this.maxLogCount + 1) {
      console.warn(`[${source}] Error repeated ${this.maxLogCount}+ times, suppressing future logs: ${error.message}`);
      this.suppressedErrors.add(errorKey);
      this.metrics.suppressedLogs++;
    }
    
    // For critical errors, still log every 10th occurrence
    if (severity === 'critical' && count % 10 === 0) {
      console.error(`[${source}] CRITICAL ERROR still occurring (${count} times): ${error.message}`);
    }
  }

  /**
   * Structured Error Logging
   */
  logError(source, error, severity, context, count, isRepeat = false) {
    const prefix = isRepeat ? `[${source}] REPEAT (${count}x)` : `[${source}]`;
    const contextStr = Object.keys(context).length > 0 ? ` | Context: ${JSON.stringify(context)}` : '';
    
    switch (severity) {
      case 'critical':
        console.error(`${prefix} CRITICAL: ${error.message}${contextStr}`, error.stack);
        break;
      case 'high':
        console.error(`${prefix} ERROR: ${error.message}${contextStr}`);
        break;
      case 'medium':
        console.warn(`${prefix} WARNING: ${error.message}${contextStr}`);
        break;
      case 'low':
        console.log(`${prefix} INFO: ${error.message}${contextStr}`);
        break;
      default:
        console.warn(`${prefix} ${error.message}${contextStr}`);
    }
  }

  /**
   * Error Categorization by Source and Pattern
   */
  categorizeError(source, error, context) {
    const message = error.message.toLowerCase();
    
    // Critical Errors (System-breaking)
    if (this.isCriticalError(source, message, context)) {
      return 'critical';
    }
    
    // High Priority Errors (Feature-breaking)
    if (this.isHighPriorityError(source, message, context)) {
      return 'high';
    }
    
    // Medium Priority (UX-affecting)
    if (this.isMediumPriorityError(source, message, context)) {
      return 'medium';
    }
    
    // Low Priority (Cosmetic)
    return 'low';
  }

  isCriticalError(source, message, context) {
    const criticalPatterns = [
      'authentication failed',
      'database connection',
      'payment failed',
      'security violation',
      'out of memory',
      'network timeout critical'
    ];
    
    return criticalPatterns.some(pattern => message.includes(pattern)) ||
           context.isCritical === true;
  }

  isHighPriorityError(source, message, context) {
    const highPatterns = [
      'api key invalid',
      'rate limit exceeded',
      'cors',
      'unauthorized',
      'service unavailable',
      'blockchain connection failed'
    ];
    
    return highPatterns.some(pattern => message.includes(pattern)) ||
           source.includes('blockchain') ||
           source.includes('wallet');
  }

  isMediumPriorityError(source, message, context) {
    const mediumPatterns = [
      'timeout',
      'network error',
      'fetch failed',
      'parsing error',
      'validation failed'
    ];
    
    return mediumPatterns.some(pattern => message.includes(pattern));
  }

  /**
   * User Notification Handling
   */
  handleUserNotification(errorKey, source, error, severity, context) {
    // Only notify for critical errors or high-frequency errors
    const shouldNotify = severity === 'critical' || 
                        (this.errorCounts.get(errorKey) >= this.criticalThreshold);
    
    if (shouldNotify && !this.userNotifications.has(errorKey)) {
      this.userNotifications.add(errorKey);
      this.metrics.userNotifications++;
      
      const notification = {
        id: errorKey,
        source,
        message: this.createUserFriendlyMessage(source, error, severity),
        severity,
        timestamp: Date.now(),
        count: this.errorCounts.get(errorKey),
        canRetry: this.canRetry(source, error),
        context
      };
      
      // Notify all registered callbacks
      this.notificationCallbacks.forEach(callback => {
        try {
          callback(notification);
        } catch (callbackError) {
          console.warn('Error notification callback failed:', callbackError);
        }
      });
    }
  }

  /**
   * Create user-friendly error messages
   */
  createUserFriendlyMessage(source, error, severity) {
    const message = error.message.toLowerCase();
    
    // Network-related errors
    if (message.includes('cors') || message.includes('network')) {
      return 'Connection problem detected. Some features may be temporarily unavailable.';
    }
    
    // API-related errors
    if (message.includes('api') || message.includes('rate limit')) {
      return 'Service temporarily overloaded. Please wait a moment and try again.';
    }
    
    // Blockchain-related errors
    if (source.includes('blockchain') || source.includes('rpc')) {
      return 'Blockchain connection issue. Retrying with backup providers...';
    }
    
    // Wallet-related errors
    if (source.includes('wallet')) {
      return 'Wallet connection issue. Please check your wallet and network settings.';
    }
    
    // Generic fallback
    if (severity === 'critical') {
      return 'Critical system error detected. Our team has been notified.';
    }
    
    return 'A technical issue occurred. The system is attempting to recover automatically.';
  }

  canRetry(source, error) {
    const retryablePatterns = [
      'network',
      'timeout',
      'temporary',
      'rate limit',
      'service unavailable'
    ];
    
    return retryablePatterns.some(pattern => 
      error.message.toLowerCase().includes(pattern)
    );
  }

  /**
   * Notification Management
   */
  addNotificationCallback(callback) {
    this.notificationCallbacks.push(callback);
  }

  removeNotificationCallback(callback) {
    const index = this.notificationCallbacks.indexOf(callback);
    if (index > -1) {
      this.notificationCallbacks.splice(index, 1);
    }
  }

  /**
   * Error Analysis and Reporting
   */
  getErrorSummary() {
    const summary = {
      overview: this.metrics,
      topErrors: this.getTopErrors(10),
      errorsBySource: this.getErrorsBySource(),
      errorsBySeverity: this.getErrorsBySeverity(),
      recentErrors: this.getRecentErrors(20),
      suppressedCount: this.suppressedErrors.size
    };
    
    return summary;
  }

  getTopErrors(limit = 10) {
    return Array.from(this.errorCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([errorKey, count]) => ({
        errorKey,
        count,
        firstSeen: this.errorFirstSeen.get(errorKey),
        lastSeen: this.errorLastSeen.get(errorKey)
      }));
  }

  getErrorsBySource() {
    const bySource = new Map();
    
    for (const [errorKey, count] of this.errorCounts) {
      const source = errorKey.split(':')[0];
      const current = bySource.get(source) || 0;
      bySource.set(source, current + count);
    }
    
    return Object.fromEntries(bySource);
  }

  getErrorsBySeverity() {
    const bySeverity = { critical: 0, high: 0, medium: 0, low: 0 };
    
    for (const [errorKey, count] of this.errorCounts) {
      const severity = this.errorCategories.get(errorKey) || 'medium';
      bySeverity[severity] += count;
    }
    
    return bySeverity;
  }

  getRecentErrors(limit = 20) {
    return Array.from(this.errorLastSeen.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([errorKey, timestamp]) => ({
        errorKey,
        timestamp,
        count: this.errorCounts.get(errorKey)
      }));
  }

  /**
   * Utility Methods
   */
  generateErrorKey(source, error) {
    // Create a unique but stable key for this error type
    const errorType = error.constructor.name || 'Error';
    const message = error.message.substring(0, 100); // Truncate long messages
    return `${source}:${errorType}:${message}`;
  }

  initializeErrorCategories() {
    // This will be populated as errors are categorized
    this.errorCategories = new Map();
  }

  /**
   * Manual Error Management
   */
  suppressError(errorKey) {
    this.suppressedErrors.add(errorKey);
  }

  unsuppressError(errorKey) {
    this.suppressedErrors.delete(errorKey);
  }

  resetErrorCount(errorKey) {
    this.errorCounts.delete(errorKey);
    this.errorFirstSeen.delete(errorKey);
    this.errorLastSeen.delete(errorKey);
    this.suppressedErrors.delete(errorKey);
    this.userNotifications.delete(errorKey);
  }

  /**
   * Health Check
   */
  getHealthStatus() {
    const totalErrors = this.metrics.totalErrors;
    const criticalErrors = this.metrics.criticalErrors;
    const timeRunning = Date.now() - this.metrics.startTime;
    const errorRate = totalErrors / (timeRunning / 60000); // errors per minute
    
    let status = 'healthy';
    if (criticalErrors > 0) {
      status = 'critical';
    } else if (errorRate > 5) {
      status = 'degraded';
    } else if (errorRate > 1) {
      status = 'warning';
    }
    
    return {
      status,
      totalErrors,
      criticalErrors,
      errorRate: Math.round(errorRate * 100) / 100,
      suppressedCount: this.suppressedErrors.size,
      timeRunning
    };
  }
}

// Create singleton instance
const errorMonitor = new ErrorMonitoringService();

// Export both class and singleton
export { ErrorMonitoringService, errorMonitor };
export default errorMonitor; 