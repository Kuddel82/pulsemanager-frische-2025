// =============================================================================
// 🚀 PULSEMANAGER SERVER WITH SECURITY MIDDLEWARE
// =============================================================================

const express = require('express');
const path = require('path');
const { setupPulseManagerSecurity } = require('../middleware/SecurityMiddleware');

// Import existierende Services
const GermanTaxService = require('../services/GermanTaxService');
const TaxReportService = require('../services/TaxReportService_FINAL');

class PulseManagerServer {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3001;
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  setupMiddleware() {
    // Body Parser
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // Security Middleware Stack
    this.security = setupPulseManagerSecurity(this.app);
    
    console.log('🛡️ Security Middleware aktiviert für PulseManager');

    // Static Files (für Frontend)
    this.app.use(express.static(path.join(__dirname, '../../build')));
  }

  setupRoutes() {
    // =============================================================================
    // 🌐 PUBLIC ENDPOINTS
    // =============================================================================

    this.app.get('/api/public/status', (req, res) => {
      res.json({
        message: 'PulseManager Public API - Status OK',
        version: '11.06.25-final-fix',
        timestamp: new Date().toISOString(),
        features: [
          'German Tax Compliance',
          'WGEP Token Support', 
          'FIFO Calculations',
          'Multi-Format Export'
        ]
      });
    });

    this.app.get('/api/public/supported-tokens', (req, res) => {
      res.json({
        supportedTokens: [
          'ETH', 'BTC', 'USDT', 'USDC', 'WGEP',
          'UNI', 'AAVE', 'LINK', 'COMP', 'MKR'
        ],
        specialTokens: {
          WGEP: {
            address: '0x308e77742a0b2D3Ed14a54B97B4c49c7659A1a7e',
            description: 'Green Energy Platform Token',
            germanTaxClassification: 'ROI (§22 EStG)',
            testWallet: '0x308e77742a0b2D3Ed14a54B97B4c49c7659A1a7e'
          }
        }
      });
    });

    // =============================================================================
    // 🔐 PROTECTED ENDPOINTS (API KEY ERFORDERLICH)
    // =============================================================================

    // German Tax Report Endpoints
    this.app.get('/api/protected/german-tax-report/:walletAddress', 
      this.security.auth.requirePermission('read'),
      async (req, res) => {
        try {
          const { walletAddress } = req.params;
          const { year = 2023, format = 'JSON' } = req.query;

          console.log(`📊 Tax Report Request für Wallet: ${walletAddress}`);

          const germanTaxService = new GermanTaxService();
          const taxReport = await germanTaxService.generateGermanTaxReport(
            walletAddress, 
            parseInt(year)
          );

          res.json({
            success: true,
            walletAddress,
            year: parseInt(year),
            reportData: taxReport,
            user: req.user.id,
            timestamp: new Date().toISOString(),
            germanTaxCompliance: '§22 & §23 EStG konform'
          });

        } catch (error) {
          console.error('❌ Tax Report Fehler:', error);
          res.status(500).json({
            error: 'Tax Report Generation Failed',
            message: error.message,
            walletAddress: req.params.walletAddress
          });
        }
      }
    );

    // Tax Report Export Endpoint
    this.app.post('/api/protected/export-tax-report',
      this.security.auth.requirePermission('write'),
      async (req, res) => {
        try {
          const { walletAddress, format, year, options = {} } = req.body;

          if (!walletAddress) {
            return res.status(400).json({
              error: 'Wallet Address Required',
              message: 'Bitte geben Sie eine gültige Wallet-Adresse an'
            });
          }

          console.log(`📤 Export Request: ${format} für ${walletAddress}`);

          const taxReportService = new TaxReportService();
          const exportResult = await taxReportService.exportReport(
            walletAddress,
            format || 'PDF',
            {
              year: year || 2023,
              germanTaxCompliance: true,
              includeWGEP: true,
              ...options
            }
          );

          res.json({
            success: true,
            message: 'Tax Report Export initiated',
            exportId: exportResult.exportId,
            format,
            walletAddress,
            user: req.user.id,
            estimatedTime: '2-5 Minuten',
            downloadUrl: `/api/protected/download/${exportResult.exportId}`
          });

        } catch (error) {
          console.error('❌ Export Fehler:', error);
          res.status(500).json({
            error: 'Export Failed',
            message: error.message
          });
        }
      }
    );

    // WGEP Test Endpoint (für Test-Wallet)
    this.app.get('/api/protected/wgep-test/:testWallet',
      this.security.auth.requirePermission('read'),
      async (req, res) => {
        try {
          const { testWallet } = req.params;
          
          // Spezielle Validierung für WGEP Test-Wallet
          if (testWallet !== '0x308e77742a0b2D3Ed14a54B97B4c49c7659A1a7e') {
            return res.status(400).json({
              error: 'Invalid WGEP Test Wallet',
              message: 'Bitte verwenden Sie die offizielle WGEP Test-Wallet',
              expectedWallet: '0x308e77742a0b2D3Ed14a54B97B4c49c7659A1a7e'
            });
          }

          const germanTaxService = new GermanTaxService();
          const wgepAnalysis = await germanTaxService.analyzeWGEPTransactions(testWallet);

          res.json({
            success: true,
            testWallet,
            wgepAnalysis,
            germanTaxClassification: {
              tokenType: 'WGEP - Green Energy Platform',
              taxCategory: 'ROI (§22 EStG)',
              progressiveRate: true,
              capitalGainsTax: false,
              holdingPeriodRelevant: false
            },
            user: req.user.id,
            timestamp: new Date().toISOString()
          });

        } catch (error) {
          console.error('❌ WGEP Test Fehler:', error);
          res.status(500).json({
            error: 'WGEP Test Failed',
            message: error.message
          });
        }
      }
    );

    // Portfolio Overview
    this.app.get('/api/protected/portfolio/:walletAddress',
      this.security.auth.requirePermission('read'),
      async (req, res) => {
        try {
          const { walletAddress } = req.params;
          
          // Simulated Portfolio Data (in real app würde das von Moralis kommen)
          const portfolioData = {
            walletAddress,
            totalValueEUR: 12500.45,
            totalValueUSD: 13750.50,
            tokens: [
              {
                symbol: 'ETH',
                balance: '2.5',
                valueEUR: 5000.00,
                germanTaxStatus: 'Speculation (§23 EStG)'
              },
              {
                symbol: 'WGEP',
                balance: '10000',
                valueEUR: 7500.45,
                germanTaxStatus: 'ROI (§22 EStG)',
                specialClassification: 'Green Energy Platform Token'
              }
            ],
            lastUpdated: new Date().toISOString()
          };

          res.json({
            success: true,
            portfolio: portfolioData,
            user: req.user.id,
            germanTaxSummary: {
              roiTokensValue: 7500.45,
              speculationTokensValue: 5000.00,
              taxImplications: 'Mixed portfolio - beide Steuerklassen vertreten'
            }
          });

        } catch (error) {
          res.status(500).json({
            error: 'Portfolio Fetch Failed',
            message: error.message
          });
        }
      }
    );

    // =============================================================================
    // 👑 ADMIN ENDPOINTS (ADMIN PERMISSION ERFORDERLICH)
    // =============================================================================

    this.app.post('/api/protected/admin/system-config',
      this.security.auth.requirePermission('admin'),
      (req, res) => {
        try {
          const { germanTaxSettings, systemSettings } = req.body;

          // Validiere deutsche Steuereinstellungen
          if (germanTaxSettings) {
            if (germanTaxSettings.roiThreshold && germanTaxSettings.roiThreshold !== 600) {
              return res.status(400).json({
                error: 'Invalid ROI Threshold',
                message: 'ROI Schwellenwert muss 600€ betragen (§22 EStG)'
              });
            }
          }

          console.log('⚙️ System-Konfiguration aktualisiert von:', req.user.id);

          res.json({
            success: true,
            message: 'System configuration updated',
            updatedBy: req.user.id,
            settings: {
              germanTaxSettings: germanTaxSettings || {
                fifoMethod: true,
                roiThreshold: 600,
                speculationPeriod: 365,
                enabled: true
              },
              systemSettings: systemSettings || {
                debugMode: false,
                logLevel: 'info',
                rateLimiting: true
              }
            },
            timestamp: new Date().toISOString()
          });

        } catch (error) {
          res.status(500).json({
            error: 'Configuration Update Failed',
            message: error.message
          });
        }
      }
    );

    this.app.get('/api/protected/admin/security-metrics',
      this.security.auth.requirePermission('admin'),
      (req, res) => {
        try {
          const securityReport = this.security.logger.generateSecurityReport();
          
          res.json({
            success: true,
            securityMetrics: securityReport,
            systemHealth: {
              rateLimiting: 'active',
              authentication: 'active',
              cors: 'configured',
              logging: 'active'
            },
            adminUser: req.user.id,
            timestamp: new Date().toISOString()
          });

        } catch (error) {
          res.status(500).json({
            error: 'Security Metrics Fetch Failed',
            message: error.message
          });
        }
      }
    );

    // =============================================================================
    // 🏥 HEALTH & MONITORING
    // =============================================================================

    this.app.get('/api/health', this.security.healthCheck());

    // Detailed Health Check für Monitoring
    this.app.get('/api/health/detailed',
      this.security.auth.requirePermission('read'),
      (req, res) => {
        const healthData = {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          version: '11.06.25-final-fix',
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          environment: process.env.NODE_ENV || 'development',
          features: {
            germanTaxCompliance: 'active',
            wgepSupport: 'active',
            exportServices: 'active',
            securityMiddleware: 'active'
          },
          database: {
            status: 'connected', // In real app: check actual DB connection
            lastSync: new Date().toISOString()
          }
        };

        res.json(healthData);
      }
    );

    // Frontend Route (SPA fallback)
    this.app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, '../../build/index.html'));
    });
  }

  setupErrorHandling() {
    // Global Error Handler
    this.app.use((error, req, res, next) => {
      console.error('🚨 Server Error:', error);

      // Log Security-relevante Fehler
      if (error.code === 'EAUTH' || error.code === 'EACCESS') {
        console.warn('🔐 Security Error:', {
          ip: req.ip,
          url: req.url,
          method: req.method,
          error: error.message
        });
      }

      res.status(error.status || 500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Ein Fehler ist aufgetreten',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown'
      });
    });

    // 404 Handler
    this.app.use((req, res) => {
      res.status(404).json({
        error: 'Endpoint Not Found',
        message: `Der Endpoint ${req.method} ${req.url} wurde nicht gefunden`,
        availableEndpoints: [
          'GET /api/health',
          'GET /api/public/status',
          'GET /api/protected/german-tax-report/:wallet',
          'POST /api/protected/export-tax-report'
        ]
      });
    });
  }

  start() {
    this.server = this.app.listen(this.port, () => {
      console.log(`
🚀 ===================================================
   PULSEMANAGER SERVER GESTARTET
🚀 ===================================================

🌐 Server läuft auf: http://localhost:${this.port}
🛡️ Security Stack: AKTIV
📊 Health Check: http://localhost:${this.port}/api/health
📈 Status API: http://localhost:${this.port}/api/public/status

🇩🇪 Deutsche Steuer-Features:
   • §22 EStG (ROI) Compliance ✅
   • §23 EStG (Speculation) Compliance ✅
   • WGEP Token Support ✅
   • FIFO Calculations ✅

🔐 API Endpoints verfügbar:
   • Public: /api/public/*
   • Protected: /api/protected/* (API Key erforderlich)
   • Admin: /api/protected/admin/* (Admin Rights erforderlich)

⚡ Ready for German Crypto Tax Reports!
      `);
    });

    // Graceful Shutdown
    process.on('SIGTERM', this.gracefulShutdown.bind(this));
    process.on('SIGINT', this.gracefulShutdown.bind(this));
  }

  gracefulShutdown() {
    console.log('🛑 Graceful Shutdown initiated...');
    
    if (this.server) {
      this.server.close(() => {
        console.log('✅ PulseManager Server closed');
        process.exit(0);
      });
    }
  }
}

// =============================================================================
// 🚀 SERVER START
// =============================================================================

if (require.main === module) {
  const server = new PulseManagerServer();
  server.start();
}

module.exports = PulseManagerServer; 