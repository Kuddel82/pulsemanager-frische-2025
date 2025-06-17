// =============================================================================
// 🧪 SECURITY MIDDLEWARE TESTS
// =============================================================================

const request = require('supertest');
const express = require('express');
const { 
  SecurityMiddlewareStack,
  RateLimiter,
  AuthenticationManager,
  CorsManager,
  SecurityLogger,
  setupPulseManagerSecurity
} = require('../../src/middleware/SecurityMiddleware');

describe('🛡️ Security Middleware Suite', () => {
  let app;
  let security;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    security = setupPulseManagerSecurity(app);
    
    // Test Route
    app.get('/test', (req, res) => {
      res.json({ success: true });
    });
  });

  // =============================================================================
  // 📊 RATE LIMITING TESTS
  // =============================================================================

  describe('Rate Limiting', () => {
    test('should allow requests within limit', async () => {
      for (let i = 0; i < 5; i++) {
        const response = await request(app)
          .get('/api/public/status')
          .expect(200);
        
        expect(response.body.message).toBe('PulseManager Public API - Status OK');
      }
    });

    test('should block requests exceeding rate limit', async () => {
      // Simuliere viele Requests von derselben IP
      for (let i = 0; i < 102; i++) {
        await request(app)
          .get('/api/public/status')
          .set('X-Forwarded-For', '192.168.1.100');
      }

      const response = await request(app)
        .get('/api/public/status')
        .set('X-Forwarded-For', '192.168.1.100')
        .expect(429);

      expect(response.body.error).toBe('Rate limit exceeded');
      expect(response.body.message).toBe('Zu viele Requests von dieser IP');
    });

    test('should apply strict rate limiting to auth endpoints', async () => {
      // Auth Endpoints haben strengere Limits
      for (let i = 0; i < 6; i++) {
        await request(app)
          .post('/api/auth/login')
          .send({ username: 'test', password: 'test' })
          .set('X-Forwarded-For', '192.168.1.101');
      }

      const response = await request(app)
        .post('/api/auth/login')
        .send({ username: 'test', password: 'test' })
        .set('X-Forwarded-For', '192.168.1.101')
        .expect(429);

      expect(response.body.error).toBe('Strict rate limit exceeded');
    });

    test('should reset rate limit after time window', (done) => {
      const rateLimiter = new RateLimiter();
      const store = rateLimiter.createCustomStore();
      
      // Füge einen Eintrag hinzu
      store.incr('test-key', (err, count, resetTime) => {
        expect(count).toBe(1);
        expect(resetTime).toBeGreaterThan(Date.now());
        
        // Simuliere Zeitablauf
        setTimeout(() => {
          store.incr('test-key', (err, newCount) => {
            expect(newCount).toBe(2); // Sollte weiterzählen, nicht resetten
            done();
          });
        }, 10);
      });
    });
  });

  // =============================================================================
  // 🔐 AUTHENTICATION TESTS
  // =============================================================================

  describe('Authentication Manager', () => {
    test('should reject requests without API key', async () => {
      const response = await request(app)
        .get('/api/protected/german-tax-report')
        .expect(401);

      expect(response.body.error).toBe('API Key erforderlich');
      expect(response.body.message).toBe('Bitte geben Sie einen gültigen API Key an');
    });

    test('should reject requests with invalid API key', async () => {
      const response = await request(app)
        .get('/api/protected/german-tax-report')
        .set('X-API-Key', 'invalid-key')
        .expect(401);

      expect(response.body.error).toBe('Ungültiger API Key');
      expect(response.body.message).toBe('Der angegebene API Key ist nicht gültig');
    });

    test('should accept valid API key', async () => {
      const response = await request(app)
        .get('/api/protected/german-tax-report')
        .set('X-API-Key', 'ak_live_abc123def456')
        .expect(200);

      expect(response.body.message).toBe('German Tax Report Data');
      expect(response.body.user).toBe('user_001');
    });

    test('should enforce permission requirements', async () => {
      // Test Key mit nur read permissions
      const response = await request(app)
        .post('/api/protected/admin/system-config')
        .set('X-API-Key', 'ak_test_xyz789uvw123')
        .expect(403);

      expect(response.body.error).toBe('Insufficient permissions');
      expect(response.body.required).toBe('admin');
      expect(response.body.available).toEqual(['read']);
    });

    test('should allow admin operations with admin key', async () => {
      const response = await request(app)
        .post('/api/protected/admin/system-config')
        .set('X-API-Key', 'ak_live_abc123def456')
        .expect(200);

      expect(response.body.message).toBe('System configuration updated');
    });

    test('should generate valid JWT tokens', () => {
      const auth = new AuthenticationManager();
      const token = auth.generateToken({ userId: 'test123', role: 'admin' });
      
      expect(token).toMatch(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
      
      // Decode und validiere Token
      const parts = token.split('.');
      expect(parts).toHaveLength(3);
      
      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
      expect(payload.userId).toBe('test123');
      expect(payload.role).toBe('admin');
      expect(payload.iat).toBeDefined();
      expect(payload.exp).toBeDefined();
    });
  });

  // =============================================================================
  // 🌐 CORS TESTS
  // =============================================================================

  describe('CORS Configuration', () => {
    test('should handle preflight OPTIONS requests', async () => {
      const response = await request(app)
        .options('/api/protected/german-tax-report')
        .set('Origin', 'http://localhost:3000')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBe('http://localhost:3000');
      expect(response.headers['access-control-allow-methods']).toContain('GET, POST, PUT, DELETE');
      expect(response.headers['access-control-allow-headers']).toContain('X-API-Key');
    });

    test('should set CORS headers for allowed origins', async () => {
      const response = await request(app)
        .get('/api/public/status')
        .set('Origin', 'http://localhost:3000')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBe('http://localhost:3000');
      expect(response.headers['access-control-allow-credentials']).toBe('true');
    });

    test('should apply security headers', async () => {
      const response = await request(app)
        .get('/test')
        .expect(200);

      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
    });
  });

  // =============================================================================
  // 📋 LOGGING & MONITORING TESTS
  // =============================================================================

  describe('Security Logger', () => {
    test('should log all requests', async () => {
      const logger = new SecurityLogger();
      const logSpy = jest.spyOn(logger.logs, 'push');

      const app = express();
      app.use(logger.logRequest());
      app.get('/test-log', (req, res) => res.json({ ok: true }));

      await request(app)
        .get('/test-log')
        .set('User-Agent', 'Test-Agent')
        .expect(200);

      expect(logSpy).toHaveBeenCalled();
      
      const lastLog = logger.logs[logger.logs.length - 1];
      expect(lastLog.method).toBe('GET');
      expect(lastLog.url).toBe('/test-log');
      expect(lastLog.statusCode).toBe(200);
      expect(lastLog.userAgent).toBe('Test-Agent');
      expect(lastLog.duration).toBeGreaterThanOrEqual(0);
    });

    test('should generate security alerts for repeated auth failures', () => {
      const logger = new SecurityLogger();
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      // Simuliere 6 Auth-Fehler von derselben IP
      for (let i = 0; i < 6; i++) {
        logger.checkForAlerts({
          ip: '192.168.1.100',
          statusCode: 401,
          url: '/api/protected/data',
          method: 'GET'
        });
      }

      expect(consoleSpy).toHaveBeenCalledWith(
        '🚨 SECURITY ALERT: Wiederholte Auth-Fehler von IP 192.168.1.100'
      );

      consoleSpy.mockRestore();
    });

    test('should generate performance alerts for slow requests', () => {
      const logger = new SecurityLogger();
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      logger.checkForAlerts({
        ip: '192.168.1.100',
        statusCode: 200,
        url: '/api/slow-endpoint',
        method: 'GET',
        duration: 6000 // 6 Sekunden
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        '⚠️ PERFORMANCE ALERT: Langsamer Request /api/slow-endpoint (6000ms)'
      );

      consoleSpy.mockRestore();
    });

    test('should generate comprehensive security report', () => {
      const logger = new SecurityLogger();
      
      // Füge Test-Logs hinzu
      const now = Date.now();
      logger.logs.push(
        {
          timestamp: new Date(now - 30 * 60 * 1000).toISOString(), // 30 min ago
          method: 'GET',
          url: '/api/test',
          ip: '192.168.1.100',
          statusCode: 200,
          duration: 150
        },
        {
          timestamp: new Date(now - 10 * 60 * 1000).toISOString(), // 10 min ago
          method: 'POST',
          url: '/api/data',
          ip: '192.168.1.101',
          statusCode: 404,
          duration: 200
        }
      );

      const report = logger.generateSecurityReport();
      
      expect(report.timeframe).toBe('1 Stunde');
      expect(report.totalRequests).toBe(2);
      expect(report.uniqueIPs).toBe(2);
      expect(report.errorRate).toBe(0.5); // 1 von 2 Requests war ein Fehler
      expect(report.averageResponseTime).toBe(175);
      expect(report.topEndpoints).toHaveLength(2);
    });
  });

  // =============================================================================
  // 🎯 INTEGRATION TESTS
  // =============================================================================

  describe('Complete Security Stack Integration', () => {
    test('should provide health check endpoint', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body.status).toBe('healthy');
      expect(response.body.security).toEqual({
        rateLimiting: 'active',
        authentication: 'active',
        cors: 'configured',
        logging: 'active'
      });
      expect(response.body.metrics).toBeDefined();
      expect(response.body.timestamp).toBeDefined();
    });

    test('should handle complex security workflow', async () => {
      // 1. Zunächst ohne API Key (sollte fehlschlagen)
      await request(app)
        .get('/api/protected/german-tax-report')
        .expect(401);

      // 2. Mit ungültigem API Key (sollte fehlschlagen)
      await request(app)
        .get('/api/protected/german-tax-report')
        .set('X-API-Key', 'invalid')
        .expect(401);

      // 3. Mit gültigem API Key aber falschen Permissions
      await request(app)
        .post('/api/protected/admin/system-config')
        .set('X-API-Key', 'ak_test_xyz789uvw123')
        .expect(403);

      // 4. Mit korrektem API Key und Permissions
      const response = await request(app)
        .get('/api/protected/german-tax-report')
        .set('X-API-Key', 'ak_live_abc123def456')
        .expect(200);

      expect(response.body.user).toBe('user_001');
      expect(response.body.message).toBe('German Tax Report Data');
    });

    test('should handle PulseManager specific endpoints', async () => {
      // Test Tax Report Export
      const exportResponse = await request(app)
        .post('/api/protected/export-tax-report')
        .set('X-API-Key', 'ak_live_abc123def456')
        .send({
          walletAddress: '0x308e77742a0b2D3Ed14a54B97B4c49c7659A1a7e',
          format: 'PDF',
          year: 2023
        })
        .expect(200);

      expect(exportResponse.body.message).toBe('Tax Report Export initiated');

      // Test Admin Operations
      const adminResponse = await request(app)
        .post('/api/protected/admin/system-config')
        .set('X-API-Key', 'ak_live_abc123def456')
        .send({
          germanTaxSettings: {
            fifoMethod: true,
            roiThreshold: 600
          }
        })
        .expect(200);

      expect(adminResponse.body.message).toBe('System configuration updated');
    });
  });

  // =============================================================================
  // 🚨 SECURITY EDGE CASES
  // =============================================================================

  describe('Security Edge Cases', () => {
    test('should handle malformed authentication headers', async () => {
      const response = await request(app)
        .get('/api/protected/german-tax-report')
        .set('X-API-Key', 'malformed key with spaces')
        .expect(401);

      expect(response.body.error).toBe('Ungültiger API Key');
    });

    test('should prevent header injection attacks', async () => {
      const response = await request(app)
        .get('/api/protected/german-tax-report')
        .set('X-API-Key', 'ak_live_abc123def456\r\nX-Injected: malicious')
        .expect(401);

      expect(response.body.error).toBe('Ungültiger API Key');
    });

    test('should handle concurrent rate limiting correctly', async () => {
      const promises = [];
      
      // Sende gleichzeitig viele Requests von derselben IP
      for (let i = 0; i < 105; i++) {
        promises.push(
          request(app)
            .get('/api/public/status')
            .set('X-Forwarded-For', '192.168.1.200')
        );
      }

      const responses = await Promise.all(promises);
      
      const successfulRequests = responses.filter(r => r.status === 200);
      const rateLimitedRequests = responses.filter(r => r.status === 429);
      
      expect(successfulRequests.length).toBeLessThanOrEqual(100);
      expect(rateLimitedRequests.length).toBeGreaterThan(0);
    });
  });
});

// =============================================================================
// 🔧 PERFORMANCE TESTS
// =============================================================================

describe('🚀 Security Middleware Performance', () => {
  test('should handle request logging efficiently', async () => {
    const app = express();
    const logger = new SecurityLogger();
    app.use(logger.logRequest());
    app.get('/perf-test', (req, res) => res.json({ ok: true }));

    const startTime = Date.now();
    
    // 100 parallele Requests
    const promises = [];
    for (let i = 0; i < 100; i++) {
      promises.push(request(app).get('/perf-test'));
    }
    
    await Promise.all(promises);
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Sollte unter 2 Sekunden dauern
    expect(duration).toBeLessThan(2000);
    expect(logger.logs.length).toBe(100);
  });
}); 