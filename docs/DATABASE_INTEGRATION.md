# PulseManager Database Integration System

## 🎯 Übersicht

Das PulseManager Database Integration System bietet ein vollständiges Enterprise-Security-Framework mit:

- **API-Key Management**: Sichere Erstellung, Validierung und Verwaltung von API-Keys
- **Usage Analytics**: Comprehensive Logging und Reporting für API-Nutzung  
- **Rate Limiting**: Intelligente Begrenzung mit verschiedenen Subscription-Tiers
- **Security Monitoring**: Anomalie-Erkennung und Security-Event-Logging
- **Multi-Database Support**: PostgreSQL und MongoDB Unterstützung

## 📁 Dateistruktur

```
PulseManager/
├── src/
│   ├── database/
│   │   ├── DatabaseManager.js          # Hauptdatenbank-Manager
│   │   ├── ApiKeyRepository.js         # API-Key CRUD Operationen
│   │   ├── UsageAnalyticsRepository.js # Analytics & Logging
│   │   └── EnhancedAuthenticationManager.js # Auth mit DB-Integration
│   ├── middleware/
│   │   └── SecurityMiddleware.js       # Express Security Middleware
│   └── server/
│       └── pulseManagerServer.js       # Integrierter Server
├── database/
│   └── schema.sql                      # PostgreSQL Schema
└── docs/
    └── DATABASE_INTEGRATION.md         # Diese Dokumentation
```

## 🚀 Quick Start

### 1. Installation

```bash
# Dependencies installieren
npm install pg mongoose bcrypt node-cache jsonwebtoken
```

### 2. Umgebungsvariablen

```bash
# .env Datei erstellen
DATABASE_TYPE=postgresql
DATABASE_URL=postgresql://user:password@localhost:5432/pulsemanager
JWT_SECRET=your-super-secure-jwt-secret-change-in-production
MONGODB_URL=mongodb://localhost:27017/pulsemanager
```

### 3. Datenbank Setup

```bash
# PostgreSQL Schema laden
psql -d pulsemanager -f database/schema.sql
```

### 4. Server starten

```javascript
const DatabaseManager = require('./src/database/DatabaseManager');
const EnhancedAuthenticationManager = require('./src/database/EnhancedAuthenticationManager');

// Database Manager initialisieren
const dbManager = new DatabaseManager({
    type: 'postgresql',
    connectionString: process.env.DATABASE_URL
});

// Enhanced Auth Manager erstellen
const authManager = new EnhancedAuthenticationManager(dbManager);

// Mit Express integrieren
app.use('/api', async (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey) {
        return res.status(401).json({ error: 'API-Key fehlt' });
    }

    const authResult = await authManager.authenticateRequest(apiKey, {
        endpoint: req.path,
        method: req.method,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
    });

    if (!authResult.success) {
        return res.status(401).json({ error: authResult.error });
    }

    req.user = authResult.user;
    next();
});
```

## 🔧 API Reference

### DatabaseManager

```javascript
const dbManager = new DatabaseManager(config);

// Verbindung herstellen
await dbManager.connect();

// Verbindungsstatus prüfen
if (dbManager.isConnected()) {
    console.log('✅ Datenbank verbunden');
}

// Query ausführen (PostgreSQL)
const result = await dbManager.query('SELECT * FROM users WHERE email = $1', ['test@example.com']);

// Collection abrufen (MongoDB)
const collection = dbManager.collection('users');
```

### ApiKeyRepository

```javascript
const apiKeyRepo = new ApiKeyRepository(dbManager);

// Neuen API-Key erstellen
const newKey = await apiKeyRepo.createApiKey(
    'user-uuid',
    'My API Key',
    ['read', 'write'],
    100 // Rate Limit
);

// API-Key validieren
const keyRecord = await apiKeyRepo.validateApiKey('ak_live_abc123def456');

// User API-Keys abrufen
const userKeys = await apiKeyRepo.getUserApiKeys('user-uuid');

// API-Key deaktivieren
await apiKeyRepo.revokeApiKey('key-uuid', 'user-uuid');
```

### UsageAnalyticsRepository

```javascript
const analyticsRepo = new UsageAnalyticsRepository(dbManager);

// API-Request loggen
await analyticsRepo.logApiRequest({
    apiKeyId: 'key-uuid',
    endpoint: '/api/portfolio',
    method: 'GET',
    statusCode: 200,
    responseTime: 150,
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0...'
});

// Usage Report generieren
const report = await analyticsRepo.getUsageReport('key-uuid', '24h');

// Anomalien erkennen
const anomalies = await analyticsRepo.detectAnomalies();

// Alte Logs bereinigen
const deletedCount = await analyticsRepo.cleanupOldLogs(90);
```

### EnhancedAuthenticationManager

```javascript
const authManager = new EnhancedAuthenticationManager(dbManager, jwtSecret);

// Request authentifizieren
const authResult = await authManager.authenticateRequest('ak_live_abc123def456', {
    endpoint: '/api/german-tax-report',
    method: 'POST',
    ipAddress: '192.168.1.1',
    userAgent: 'Chrome/91.0',
    requiredPermission: 'read'
});

if (authResult.success) {
    console.log('User:', authResult.user);
    console.log('JWT Token:', authResult.token);
    console.log('Rate Limit Remaining:', authResult.rateLimitRemaining);
}

// JWT Token validieren
const tokenResult = authManager.validateJwtToken(token);

// User Usage Report
const userReport = await authManager.getUserUsageReport('user-uuid', '7d');

// Security Statistiken
const securityStats = await authManager.getSecurityStats();
```

## 🔐 Security Features

### API-Key Format

```
ak_live_abc123def456789  # Live Key (Produktion)
ak_test_xyz789uvw123456  # Test Key (Development)
```

### Berechtigungen

- `read`: Lesezugriff auf alle Public APIs
- `write`: Schreibzugriff für Datenexport und Reports
- `admin`: Vollzugriff inklusive System-Administration

### Rate Limiting

| Subscription | Standard | Premium | Enterprise |
|-------------|----------|---------|------------|
| Requests/15min | 100 | 1,000 | 5,000 |
| Admin Endpoints | 50 | 50 | 50 |
| Export Endpoints | 20 | 20 | 20 |

### Fallback-Keys (Development)

```javascript
// Hardcodierte Keys für Testing/Development
'ak_live_abc123def456': {
    permissions: ['read', 'write', 'admin'],
    rate_limit: 1000,
    subscription_type: 'premium'
}

'ak_test_xyz789uvw123': {
    permissions: ['read'],
    rate_limit: 100,
    subscription_type: 'free'
}
```

## 📊 Analytics & Monitoring

### Usage Reports

```javascript
// 24h Report für API-Key
const report = await analyticsRepo.getUsageReport('key-uuid', '24h');

console.log(report);
// {
//   summary: {
//     total_requests: 1250,
//     successful_requests: 1180,
//     failed_requests: 70,
//     success_rate: "94.40",
//     avg_response_time: "145.50",
//     total_data_transferred: 2097152
//   },
//   top_endpoints: [
//     { endpoint: "/api/portfolio", request_count: 450 },
//     { endpoint: "/api/german-tax-report", request_count: 300 }
//   ],
//   hourly_distribution: [...],
//   error_analysis: [...]
// }
```

### Anomalie-Erkennung

```javascript
const anomalies = await analyticsRepo.detectAnomalies();

// Beispiel Anomalien:
// [
//   {
//     type: 'HIGH_ERROR_RATE',
//     api_key_id: 'key-uuid',
//     severity: 'WARNING',
//     details: { error_rate: 65.20, total_requests: 100 }
//   },
//   {
//     type: 'HIGH_VOLUME',
//     api_key_id: 'key-uuid',
//     severity: 'CRITICAL',
//     details: { request_count: 15000, period: '24h' }
//   }
// ]
```

### Security Events

```javascript
// Automatisches Logging von:
// - Erfolgreiche Authentifizierung
// - Fehlgeschlagene Auth-Versuche
// - Rate Limit Überschreitungen
// - API-Key Rotationen
// - Anomalien und Verdächtige Aktivitäten

// Security Stats abrufen
const stats = await authManager.getSecurityStats();
console.log(stats);
// {
//   timestamp: "2024-06-14T10:30:00.000Z",
//   database_connected: true,
//   api_keys: { total_keys: 45, active_keys: 42, inactive_keys: 3 },
//   usage_analytics: { queue_size: 23, batch_size: 100 },
//   recent_anomalies: [...]
// }
```

## 🏗️ Production Deployment

### 1. Datenbank Setup

```sql
-- PostgreSQL Production Setup
CREATE DATABASE pulsemanager_production;
CREATE USER pulsemanager_app WITH PASSWORD 'secure-production-password';
GRANT ALL PRIVILEGES ON DATABASE pulsemanager_production TO pulsemanager_app;

-- Schema laden
\c pulsemanager_production
\i database/schema.sql
```

### 2. Environment Variables

```bash
# Production .env
NODE_ENV=production
DATABASE_TYPE=postgresql
DATABASE_URL=postgresql://pulsemanager_app:secure-password@production-db:5432/pulsemanager_production
JWT_SECRET=ultra-secure-jwt-secret-32-chars-minimum
ENABLE_DATABASE_SSL=true
CONNECTION_POOL_SIZE=20
```

### 3. SSL Configuration

```javascript
const dbConfig = {
    type: 'postgresql',
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false
    } : false,
    poolConfig: {
        max: parseInt(process.env.CONNECTION_POOL_SIZE) || 20,
        min: 2,
        acquire: 30000,
        idle: 10000
    }
};
```

### 4. Health Monitoring

```javascript
// Health Check Endpoint
app.get('/health/database', async (req, res) => {
    try {
        const isConnected = dbManager.isConnected();
        const stats = await authManager.getSecurityStats();
        
        res.json({
            status: 'healthy',
            database_connected: isConnected,
            timestamp: new Date().toISOString(),
            stats: stats
        });
    } catch (error) {
        res.status(500).json({
            status: 'unhealthy',
            error: error.message
        });
    }
});
```

### 5. Backup Strategy

```bash
#!/bin/bash
# backup.sh - Tägliches Backup Script

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/pulsemanager"

# PostgreSQL Backup
pg_dump $DATABASE_URL > "$BACKUP_DIR/pulsemanager_$DATE.sql"

# Komprimieren
gzip "$BACKUP_DIR/pulsemanager_$DATE.sql"

# Alte Backups löschen (älter als 30 Tage)
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "✅ Backup erstellt: pulsemanager_$DATE.sql.gz"
```

## 🧪 Testing

### Unit Tests

```javascript
// __tests__/database/DatabaseManager.test.js
const DatabaseManager = require('../../src/database/DatabaseManager');

describe('DatabaseManager', () => {
    let dbManager;

    beforeEach(() => {
        dbManager = new DatabaseManager({
            type: 'postgresql',
            connectionString: 'postgresql://test:test@localhost:5432/test_db'
        });
    });

    test('should connect to database', async () => {
        await dbManager.connect();
        expect(dbManager.isConnected()).toBe(true);
    });

    test('should execute queries', async () => {
        const result = await dbManager.query('SELECT 1 as test');
        expect(result.rows[0].test).toBe(1);
    });
});
```

### Integration Tests

```javascript
// Vollständige API Tests mit echten Datenbankoperationen
describe('API Key Integration', () => {
    test('should create and validate API key', async () => {
        const newKey = await apiKeyRepo.createApiKey('test-user', 'test-key', ['read']);
        expect(newKey.api_key).toMatch(/^ak_live_[a-f0-9]{32}$/);
        
        const validation = await apiKeyRepo.validateApiKey(newKey.api_key);
        expect(validation.user_id).toBe('test-user');
    });
});
```

## 🚨 Error Handling

### Graceful Degradation

```javascript
// Das System funktioniert auch ohne Datenbank-Verbindung
if (!dbManager.isConnected()) {
    console.warn('⚠️ Datenbank nicht verfügbar, verwende Fallback-Keys');
    // Fallback zu hardcodierten API-Keys
    // Memory-basiertes Rate Limiting
    // Reduzierte Analytics
}
```

### Retry Logic

```javascript
const dbManager = new DatabaseManager(config, {
    retryAttempts: 3,
    retryDelay: 1000,
    enableAutoReconnect: true
});
```

### Error Monitoring

```javascript
// Alle Datenbankfehler werden automatisch geloggt
// Integration mit externen Monitoring-Services möglich
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Database Rejection:', reason);
    // Sentry, DataDog, etc. Integration hier
});
```

## 📈 Performance Optimierung

### Connection Pooling

```javascript
const poolConfig = {
    max: 20,           // Maximum Connections
    min: 2,            // Minimum Connections  
    acquire: 30000,    // Max time to acquire connection
    idle: 10000,       // Max time connection can be idle
    evict: 1000        // Eviction check interval
};
```

### Caching Strategy

```javascript
// API-Key Caching (1 Stunde TTL)
const cache = new NodeCache({ 
    stdTTL: 3600,      // 1 Stunde Standard TTL
    checkperiod: 120,  // Check alle 2 Minuten
    useClones: false   // Performance Optimierung
});
```

### Batch Processing

```javascript
// Usage Analytics werden in Batches verarbeitet
const batchConfig = {
    batchSize: 100,           // 100 Logs pro Batch
    flushInterval: 30000,     // Flush alle 30 Sekunden
    maxBatchAge: 300000       // Max 5 Minuten im Batch
};
```

## 🔍 Troubleshooting

### Häufige Probleme

**Problem**: Connection Timeout
```bash
# Lösung: Connection Pool erhöhen
CONNECTION_POOL_SIZE=30
```

**Problem**: Rate Limit funktioniert nicht
```javascript
// Debug: Rate Limit Status prüfen
const rateLimitCheck = await apiKeyRepo.checkRateLimit('key-id');
console.log('Rate Limit Check:', rateLimitCheck);
```

**Problem**: Analytics Batch läuft voll
```javascript
// Lösung: Batch manuell flushen
await analyticsRepo.forceFlush();
```

### Debug Logging

```javascript
// Debug Mode aktivieren
process.env.DEBUG_DATABASE = 'true';

// Zeigt alle SQL Queries und Performance Metrics
```

## 📞 Support

- **GitHub**: [PulseManager Repository](https://github.com/pulsemanager/pulsemanager)
- **Documentation**: [docs.pulsemanager.vip](https://docs.pulsemanager.vip)
- **Email**: support@pulsemanager.vip

---

**Version**: 1.0.0  
**Letzte Aktualisierung**: 14. Juni 2024  
**Autor**: PulseManager Security Team 