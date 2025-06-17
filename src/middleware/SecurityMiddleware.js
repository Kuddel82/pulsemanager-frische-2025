// =============================================================================
// 🔧 PRODUCTION SECURITY MIDDLEWARE SUITE
// =============================================================================

const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

// =============================================================================
// 📊 RATE LIMITING MIDDLEWARE
// =============================================================================

class RateLimiter {
  constructor() {
    this.store = new Map();
    this.cleanup();
  }

  // Standard API Rate Limiter
  createStandardLimiter() {
    return rateLimit({
      windowMs: 15 * 60 * 1000, // 15 Minuten
      max: 100, // Max 100 Requests pro IP
      message: {
        error: 'Zu viele Requests',
        retryAfter: '15 Minuten',
        limit: 100
      },
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req, res) => {
        res.status(429).json({
          error: 'Rate limit exceeded',
          message: 'Zu viele Requests von dieser IP',
          retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
        });
      }
    });
  }

  // Strict Limiter für sensible Endpoints
  createStrictLimiter() {
    return rateLimit({
      windowMs: 60 * 60 * 1000, // 1 Stunde
      max: 5, // Nur 5 Versuche pro Stunde
      message: {
        error: 'Strict rate limit exceeded',
        retryAfter: '1 Stunde'
      },
      skipSuccessfulRequests: true
    });
  }

  // Custom Memory Store für bessere Performance
  createCustomStore() {
    return {
      incr: (key, cb) => {
        const now = Date.now();
        const record = this.store.get(key) || { count: 0, resetTime: now + 15 * 60 * 1000 };
        
        if (now > record.resetTime) {
          record.count = 1;
          record.resetTime = now + 15 * 60 * 1000;
        } else {
          record.count++;
        }
        
        this.store.set(key, record);
        cb(null, record.count, record.resetTime);
      },
      
      decrement: (key) => {
        const record = this.store.get(key);
        if (record && record.count > 0) {
          record.count--;
          this.store.set(key, record);
        }
      },
      
      resetKey: (key) => {
        this.store.delete(key);
      }
    };
  }

  // Cleanup alte Einträge
  cleanup() {
    setInterval(() => {
      const now = Date.now();
      for (const [key, record] of this.store.entries()) {
        if (now > record.resetTime) {
          this.store.delete(key);
        }
      }
    }, 5 * 60 * 1000); // Cleanup alle 5 Minuten
  }
}

// =============================================================================
// 🔐 AUTHENTICATION MIDDLEWARE
// =============================================================================

class AuthenticationManager {
  constructor() {
    this.apiKeys = new Map();
    this.sessions = new Map();
    this.loadApiKeys();
  }

  // API Keys laden (normalerweise aus Datenbank)
  loadApiKeys() {
    // Beispiel API Keys - in Production aus DB laden
    this.apiKeys.set('ak_live_abc123def456', {
      id: 'user_001',
      name: 'Production App',
      permissions: ['read', 'write', 'admin'],
      rateLimit: 1000,
      lastUsed: null
    });

    this.apiKeys.set('ak_test_xyz789uvw123', {
      id: 'user_002', 
      name: 'Test Environment',
      permissions: ['read'],
      rateLimit: 100,
      lastUsed: null
    });
  }

  // API Key Validierung
  validateApiKey() {
    return async (req, res, next) => {
      try {
        const apiKey = req.headers['x-api-key'] || req.query.api_key;
        
        if (!apiKey) {
          return res.status(401).json({
            error: 'API Key erforderlich',
            message: 'Bitte geben Sie einen gültigen API Key an'
          });
        }

        const keyData = this.apiKeys.get(apiKey);
        if (!keyData) {
          return res.status(401).json({
            error: 'Ungültiger API Key',
            message: 'Der angegebene API Key ist nicht gültig'
          });
        }

        // Key Usage tracken
        keyData.lastUsed = new Date();
        this.apiKeys.set(apiKey, keyData);

        // User Daten an Request anhängen
        req.user = {
          id: keyData.id,
          permissions: keyData.permissions,
          rateLimit: keyData.rateLimit
        };

        next();
      } catch (error) {
        res.status(500).json({
          error: 'Authentication Error',
          message: 'Fehler bei der Authentifizierung'
        });
      }
    };
  }

  // Permission Check
  requirePermission(permission) {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required'
        });
      }

      if (!req.user.permissions.includes(permission)) {
        return res.status(403).json({
          error: 'Insufficient permissions',
          required: permission,
          available: req.user.permissions
        });
      }

      next();
    };
  }

  // JWT Token Generierung (für Sessions)
  generateToken(payload) {
    const header = {
      alg: 'HS256',
      typ: 'JWT'
    };

    const now = Math.floor(Date.now() / 1000);
    const tokenPayload = {
      ...payload,
      iat: now,
      exp: now + (24 * 60 * 60) // 24 Stunden
    };

    const secret = process.env.JWT_SECRET || 'your-secret-key';
    
    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
    const encodedPayload = Buffer.from(JSON.stringify(tokenPayload)).toString('base64url');
    
    const signature = crypto
      .createHmac('sha256', secret)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64url');

    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }
}

// =============================================================================
// 🌐 CORS CONFIGURATION
// =============================================================================

class CorsManager {
  constructor() {
    this.allowedOrigins = new Set([
      'https://yourdomain.com',
      'https://app.yourdomain.com',
      'http://localhost:3000',
      'http://localhost:3001'
    ]);
  }

  // Dynamische CORS Konfiguration
  configureCors() {
    return (req, res, next) => {
      const origin = req.headers.origin;
      
      // Origin Check
      if (this.allowedOrigins.has(origin) || !origin) {
        res.setHeader('Access-Control-Allow-Origin', origin || '*');
      }

      // Allowed Methods
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
      
      // Allowed Headers
      res.setHeader('Access-Control-Allow-Headers', [
        'Content-Type',
        'Authorization',
        'X-API-Key',
        'X-Requested-With',
        'Accept',
        'Origin'
      ].join(', '));

      // Credentials
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      
      // Max Age
      res.setHeader('Access-Control-Max-Age', '86400'); // 24 Stunden

      // Preflight Requests
      if (req.method === 'OPTIONS') {
        return res.status(200).end();
      }

      next();
    };
  }

  // Sicherheits-Headers
  securityHeaders() {
    return helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      }
    });
  }
}

// =============================================================================
// 📋 LOGGING & MONITORING
// =============================================================================

class SecurityLogger {
  constructor() {
    this.logs = [];
    this.alerts = new Map();
  }

  // Request Logging
  logRequest() {
    return (req, res, next) => {
      const start = Date.now();
      
      res.on('finish', () => {
        const duration = Date.now() - start;
        const logEntry = {
          timestamp: new Date().toISOString(),
          method: req.method,
          url: req.url,
          ip: req.ip || req.connection.remoteAddress,
          userAgent: req.headers['user-agent'],
          statusCode: res.statusCode,
          duration: duration,
          apiKey: req.headers['x-api-key'] ? '***masked***' : null,
          user: req.user?.id || null
        };

        this.logs.push(logEntry);
        
        // Alert bei verdächtigen Aktivitäten
        this.checkForAlerts(logEntry);
        
        // Log Rotation (behalte nur letzte 1000 Einträge)
        if (this.logs.length > 1000) {
          this.logs = this.logs.slice(-1000);
        }
      });

      next();
    };
  }

  // Alert System
  checkForAlerts(logEntry) {
    // Zu viele 401 Errors
    if (logEntry.statusCode === 401) {
      const key = `auth_fail_${logEntry.ip}`;
      const count = (this.alerts.get(key) || 0) + 1;
      this.alerts.set(key, count);
      
      if (count > 5) {
        console.warn(`🚨 SECURITY ALERT: Wiederholte Auth-Fehler von IP ${logEntry.ip}`);
      }
    }

    // Langsame Requests
    if (logEntry.duration > 5000) {
      console.warn(`⚠️ PERFORMANCE ALERT: Langsamer Request ${logEntry.url} (${logEntry.duration}ms)`);
    }
  }

  // Security Report generieren
  generateSecurityReport() {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    const recentLogs = this.logs.filter(log => 
      new Date(log.timestamp).getTime() > (now - oneHour)
    );

    return {
      timeframe: '1 Stunde',
      totalRequests: recentLogs.length,
      uniqueIPs: new Set(recentLogs.map(log => log.ip)).size,
      errorRate: recentLogs.filter(log => log.statusCode >= 400).length / recentLogs.length,
      averageResponseTime: recentLogs.reduce((sum, log) => sum + log.duration, 0) / recentLogs.length,
      topEndpoints: this.getTopEndpoints(recentLogs),
      securityAlerts: Array.from(this.alerts.entries())
    };
  }

  getTopEndpoints(logs) {
    const endpoints = {};
    logs.forEach(log => {
      const endpoint = `${log.method} ${log.url.split('?')[0]}`;
      endpoints[endpoint] = (endpoints[endpoint] || 0) + 1;
    });
    
    return Object.entries(endpoints)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);
  }
}

// =============================================================================
// 🎯 COMPLETE MIDDLEWARE SETUP
// =============================================================================

class SecurityMiddlewareStack {
  constructor() {
    this.rateLimiter = new RateLimiter();
    this.auth = new AuthenticationManager();
    this.cors = new CorsManager();
    this.logger = new SecurityLogger();
  }

  // Alle Middleware für Express App
  setupExpress(app) {
    // 1. Basis Sicherheit
    app.use(this.cors.securityHeaders());
    app.use(this.cors.configureCors());
    
    // 2. Logging
    app.use(this.logger.logRequest());
    
    // 3. Rate Limiting
    app.use('/api/', this.rateLimiter.createStandardLimiter());
    app.use('/api/auth/', this.rateLimiter.createStrictLimiter());
    
    // 4. Authentication für geschützte Routen
    app.use('/api/protected/', this.auth.validateApiKey());
    
    console.log('🛡️ Security Middleware Stack aktiviert!');
  }

  // Health Check Endpoint
  healthCheck() {
    return (req, res) => {
      const report = this.logger.generateSecurityReport();
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        security: {
          rateLimiting: 'active',
          authentication: 'active',
          cors: 'configured',
          logging: 'active'
        },
        metrics: report
      });
    };
  }
}

// =============================================================================
// 🚀 EXAMPLE USAGE
// =============================================================================

// Express App Setup
const express = require('express');

// Security Setup für PulseManager
function setupPulseManagerSecurity(app) {
  const security = new SecurityMiddlewareStack();
  security.setupExpress(app);

  // PulseManager spezifische Routen
  app.get('/api/health', security.healthCheck());

  app.get('/api/public/status', (req, res) => {
    res.json({ message: 'PulseManager Public API - Status OK' });
  });

  // Deutsche Steuerreport Endpoints (geschützt)
  app.get('/api/protected/german-tax-report', 
    security.auth.requirePermission('read'),
    (req, res) => {
      res.json({ 
        message: 'German Tax Report Data',
        user: req.user.id,
        timestamp: new Date().toISOString()
      });
    }
  );

  app.post('/api/protected/export-tax-report', 
    security.auth.requirePermission('write'),
    (req, res) => {
      res.json({ message: 'Tax Report Export initiated' });
    }
  );

  app.post('/api/protected/admin/system-config', 
    security.auth.requirePermission('admin'),
    (req, res) => {
      res.json({ message: 'System configuration updated' });
    }
  );

  return security;
}

module.exports = {
  SecurityMiddlewareStack,
  RateLimiter,
  AuthenticationManager,
  CorsManager,
  SecurityLogger,
  setupPulseManagerSecurity
}; 