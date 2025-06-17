# 🛡️ PulseManager Security Middleware Suite

## Übersicht

Die PulseManager Security Middleware Suite bietet eine umfassende Sicherheitslösung für das deutsche Krypto-Steuerreport-System. Die Suite umfasst Rate Limiting, Authentication, CORS-Konfiguration, Logging und Monitoring.

## 📋 Features

### 🔐 Authentication System
- **API Key basierte Authentifizierung**
- **Rollenbasierte Berechtigungen** (read, write, admin)
- **JWT Token Generierung** für Sessions
- **API Key Usage Tracking**

### 📊 Rate Limiting
- **Standard Rate Limiter**: 100 Requests/15 Min pro IP
- **Strict Rate Limiter**: 5 Requests/Stunde für sensible Endpoints
- **Custom Memory Store** für bessere Performance
- **Automatische Cleanup** abgelaufener Einträge

### 🌐 CORS & Security Headers
- **Dynamische CORS Konfiguration**
- **Helmet.js Integration** für Security Headers
- **Content Security Policy**
- **HSTS (HTTP Strict Transport Security)**

### 📋 Logging & Monitoring
- **Request/Response Logging**
- **Security Alert System**
- **Performance Monitoring**
- **Detaillierte Security Reports**

## 🚀 Installation & Setup

### 1. Dependencies installieren
```bash
npm install express express-rate-limit helmet cors
```

### 2. Security Middleware integrieren
```javascript
const { setupPulseManagerSecurity } = require('./src/middleware/SecurityMiddleware');

const app = express();
const security = setupPulseManagerSecurity(app);
```

### 3. Server starten
```bash
# Development mit Tests
npm run start:secure

# Production
npm run start:production
```

## 🔑 API Keys

### Verfügbare API Keys

| API Key | Berechtigungen | Beschreibung |
|---------|---------------|--------------|
| `ak_live_abc123def456` | read, write, admin | Production App (Vollzugriff) |
| `ak_test_xyz789uvw123` | read | Test Environment (Nur Lesezugriff) |

### Verwendung
```bash
# Header setzen
curl -H "X-API-Key: ak_live_abc123def456" \
     http://localhost:3001/api/protected/endpoint

# Query Parameter
curl "http://localhost:3001/api/protected/endpoint?api_key=ak_live_abc123def456"
```

## 🌐 API Endpoints

### Public Endpoints (Kein API Key erforderlich)

#### GET `/api/public/status`
Grundlegende Systeminformationen
```json
{
  "message": "PulseManager Public API - Status OK",
  "version": "11.06.25-final-fix",
  "timestamp": "2023-12-07T10:30:00.000Z",
  "features": [
    "German Tax Compliance",
    "WGEP Token Support",
    "FIFO Calculations",
    "Multi-Format Export"
  ]
}
```

#### GET `/api/public/supported-tokens`
Liste unterstützter Tokens
```json
{
  "supportedTokens": ["ETH", "BTC", "USDT", "USDC", "WGEP"],
  "specialTokens": {
    "WGEP": {
      "address": "0x308e77742a0b2D3Ed14a54B97B4c49c7659A1a7e",
      "description": "Green Energy Platform Token",
      "germanTaxClassification": "ROI (§22 EStG)",
      "testWallet": "0x308e77742a0b2D3Ed14a54B97B4c49c7659A1a7e"
    }
  }
}
```

#### GET `/api/health`
Health Check mit Security Metrics
```json
{
  "status": "healthy",
  "timestamp": "2023-12-07T10:30:00.000Z",
  "security": {
    "rateLimiting": "active",
    "authentication": "active",
    "cors": "configured",
    "logging": "active"
  },
  "metrics": {
    "timeframe": "1 Stunde",
    "totalRequests": 150,
    "uniqueIPs": 25,
    "errorRate": 0.02
  }
}
```

### Protected Endpoints (API Key erforderlich)

#### GET `/api/protected/german-tax-report/:walletAddress`
**Berechtigung**: `read`

Deutsche Steuerreport-Generierung
```bash
curl -H "X-API-Key: ak_live_abc123def456" \
     "http://localhost:3001/api/protected/german-tax-report/0x308e77742a0b2D3Ed14a54B97B4c49c7659A1a7e?year=2023"
```

Response:
```json
{
  "success": true,
  "walletAddress": "0x308e77742a0b2D3Ed14a54B97B4c49c7659A1a7e",
  "year": 2023,
  "reportData": {
    "roiTransactions": [...],
    "speculationTransactions": [...],
    "summary": {
      "totalROI": 5420.50,
      "totalSpeculationGain": 1200.00
    }
  },
  "user": "user_001",
  "germanTaxCompliance": "§22 & §23 EStG konform"
}
```

#### POST `/api/protected/export-tax-report`
**Berechtigung**: `write`

Steuerreport Export
```bash
curl -X POST \
     -H "X-API-Key: ak_live_abc123def456" \
     -H "Content-Type: application/json" \
     -d '{
       "walletAddress": "0x308e77742a0b2D3Ed14a54B97B4c49c7659A1a7e",
       "format": "PDF",
       "year": 2023
     }' \
     http://localhost:3001/api/protected/export-tax-report
```

#### GET `/api/protected/wgep-test/:testWallet`
**Berechtigung**: `read`

WGEP Token Test (spezielle Test-Wallet)
```bash
curl -H "X-API-Key: ak_live_abc123def456" \
     http://localhost:3001/api/protected/wgep-test/0x308e77742a0b2D3Ed14a54B97B4c49c7659A1a7e
```

#### GET `/api/protected/portfolio/:walletAddress`
**Berechtigung**: `read`

Portfolio-Übersicht mit deutscher Steuerklassifizierung

### Admin Endpoints (Admin-Berechtigung erforderlich)

#### POST `/api/protected/admin/system-config`
**Berechtigung**: `admin`

System-Konfiguration aktualisieren
```bash
curl -X POST \
     -H "X-API-Key: ak_live_abc123def456" \
     -H "Content-Type: application/json" \
     -d '{
       "germanTaxSettings": {
         "fifoMethod": true,
         "roiThreshold": 600,
         "speculationPeriod": 365
       }
     }' \
     http://localhost:3001/api/protected/admin/system-config
```

#### GET `/api/protected/admin/security-metrics`
**Berechtigung**: `admin`

Detaillierte Security-Metriken

## 🔒 Sicherheitsfeatures

### Rate Limiting
- **Standard API**: 100 Requests/15 Min
- **Auth Endpoints**: 5 Requests/Stunde
- **IP-basierte Überwachung**
- **Automatic cleanup** alter Einträge

### Authentication
```javascript
// API Key Validierung
app.use('/api/protected/', auth.validateApiKey());

// Permission Check
app.use('/api/admin/', auth.requirePermission('admin'));
```

### CORS Konfiguration
```javascript
// Erlaubte Origins
const allowedOrigins = [
  'https://yourdomain.com',
  'https://app.yourdomain.com',
  'http://localhost:3000',
  'http://localhost:3001'
];
```

### Security Headers
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Strict-Transport-Security: max-age=31536000`
- `Content-Security-Policy`

## 📊 Monitoring & Logging

### Security Alerts
Das System generiert automatisch Alerts bei:
- **Wiederholte Auth-Fehler** (>5 von derselben IP)
- **Langsame Requests** (>5 Sekunden)
- **Verdächtige Aktivitäten**

### Log-Rotation
- **Maximum**: 1000 Log-Einträge
- **Automatic cleanup** bei Überschreitung
- **Performance-optimiert**

### Security Report
```javascript
const report = logger.generateSecurityReport();
console.log(report);
// {
//   timeframe: '1 Stunde',
//   totalRequests: 150,
//   uniqueIPs: 25,
//   errorRate: 0.02,
//   averageResponseTime: 125,
//   topEndpoints: [...],
//   securityAlerts: [...]
// }
```

## 🧪 Testing

### Security Tests ausführen
```bash
# Alle Security Tests
npm run test:security

# Spezifische Middleware Tests
jest __tests__/middleware/SecurityMiddleware.test.js

# Integration Tests mit Live Server
npm run start:secure
```

### Test-Szenarien
- ✅ **Rate Limiting** funktional
- ✅ **Authentication** schützt Endpoints
- ✅ **Permission System** funktional
- ✅ **CORS** konfiguriert
- ✅ **Security Headers** gesetzt
- ✅ **Logging** aktiv
- ✅ **Performance** unter Last

## 🇩🇪 Deutsche Steuer-Compliance

### Unterstützte Steuerklassen
- **§22 EStG (ROI)**: WGEP und ähnliche Tokens
- **§23 EStG (Spekulation)**: ETH, BTC, andere Kryptos

### WGEP Token Special Features
- **Test-Wallet**: `0x308e77742a0b2D3Ed14a54B97B4c49c7659A1a7e`
- **Steuerklasse**: ROI (§22 EStG)
- **Progressive Besteuerung**: Ja
- **Haltefrist**: Nicht relevant

### FIFO-Berechnungen
```javascript
// FIFO wird automatisch angewendet
const germanTaxService = new GermanTaxService();
const report = await germanTaxService.generateGermanTaxReport(wallet, year);
```

## 🔧 Konfiguration

### Environment Variables
```bash
# JWT Secret für Token-Generierung
JWT_SECRET=your-secret-key

# Node Environment
NODE_ENV=production

# Server Port
PORT=3001

# Rate Limiting
RATE_LIMIT_WINDOW=900000  # 15 Minuten
RATE_LIMIT_MAX=100        # Max Requests
```

### Produktions-Setup
```javascript
// Produktions-optimierte Konfiguration
const securityConfig = {
  rateLimiting: {
    standard: { windowMs: 15 * 60 * 1000, max: 100 },
    strict: { windowMs: 60 * 60 * 1000, max: 5 }
  },
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['https://yourdomain.com'],
    credentials: true
  },
  helmet: {
    contentSecurityPolicy: true,
    hsts: { maxAge: 31536000, includeSubDomains: true }
  }
};
```

## 🚀 Deployment

### Docker Setup
```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
EXPOSE 3001

CMD ["npm", "run", "start:production"]
```

### PM2 Setup
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'pulsemanager-secure',
    script: 'src/server/pulseManagerServer.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    }
  }]
};
```

## 🔍 Troubleshooting

### Häufige Probleme

#### Rate Limit Exceeded
```bash
# Problem: Zu viele Requests
# Lösung: Warten oder verschiedene IPs verwenden
curl -H "X-Forwarded-For: 192.168.1.100" http://localhost:3001/api/public/status
```

#### Authentication Failed
```bash
# Problem: Ungültiger API Key
# Lösung: Korrekten API Key verwenden
curl -H "X-API-Key: ak_live_abc123def456" http://localhost:3001/api/protected/data
```

#### Permission Denied
```bash
# Problem: Insufficient Permissions
# Lösung: Admin API Key für Admin-Endpoints verwenden
curl -H "X-API-Key: ak_live_abc123def456" http://localhost:3001/api/protected/admin/config
```

### Debug-Modus
```bash
# Debug-Logging aktivieren
DEBUG=security:* npm run start:secure
```

## 📚 Weitere Ressourcen

- [Express.js Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Helmet.js Documentation](https://helmetjs.github.io/)
- [Express Rate Limit](https://express-rate-limit.mintlify.app/)
- [Deutsche Steuergesetze](https://www.gesetze-im-internet.de/estg/)

## 🆘 Support

Bei Problemen oder Fragen:
1. **Issues**: GitHub Issues erstellen
2. **Documentation**: Diese README durchlesen
3. **Tests**: `npm run test:security` ausführen
4. **Logs**: Security-Logs überprüfen

---

**⚡ PulseManager Security Middleware Suite - Sichere deutsche Krypto-Steuerreports! 🇩🇪** 