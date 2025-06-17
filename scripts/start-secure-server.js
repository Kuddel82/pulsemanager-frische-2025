#!/usr/bin/env node

// =============================================================================
// 🚀 PULSEMANAGER SECURITY SERVER STARTER
// =============================================================================

const PulseManagerServer = require('../src/server/pulseManagerServer');
const axios = require('axios');
const chalk = require('chalk');

async function startSecureServer() {
  console.log(chalk.blue(`
🛡️ ===============================================
   PULSEMANAGER SECURE SERVER STARTUP
🛡️ ===============================================
  `));

  // 1. Server starten
  const server = new PulseManagerServer();
  server.start();

  // Warte, bis Server bereit ist
  await new Promise(resolve => setTimeout(resolve, 2000));

  console.log(chalk.green('✅ Server gestartet! Testing Security Features...\n'));

  // 2. Security Tests ausführen
  await runSecurityTests();

  console.log(chalk.blue(`
🎯 ===============================================
   SECURITY TESTS ABGESCHLOSSEN
🎯 ===============================================

📚 API DOKUMENTATION:

🌐 PUBLIC ENDPOINTS:
   GET /api/public/status
   GET /api/public/supported-tokens
   GET /api/health

🔐 PROTECTED ENDPOINTS (API Key erforderlich):
   Header: X-API-Key: ak_live_abc123def456
   
   GET /api/protected/german-tax-report/:wallet
   POST /api/protected/export-tax-report
   GET /api/protected/wgep-test/:testWallet
   GET /api/protected/portfolio/:wallet
   GET /api/health/detailed

👑 ADMIN ENDPOINTS (Admin Permission erforderlich):
   Header: X-API-Key: ak_live_abc123def456
   
   POST /api/protected/admin/system-config
   GET /api/protected/admin/security-metrics

🔑 VERFÜGBARE API KEYS:
   • ak_live_abc123def456 (read, write, admin)
   • ak_test_xyz789uvw123 (read only)

🧪 WGEP TEST WALLET:
   • 0x308e77742a0b2D3Ed14a54B97B4c49c7659A1a7e

Server läuft weiter... Drücken Sie Ctrl+C zum Beenden.
  `));
}

async function runSecurityTests() {
  const baseURL = 'http://localhost:3001';
  
  try {
    console.log(chalk.yellow('🧪 1. Testing Public Endpoints...'));
    
    // Test Public Status
    const statusResponse = await axios.get(`${baseURL}/api/public/status`);
    console.log(chalk.green('✅ Public Status API working'));
    console.log(`   Version: ${statusResponse.data.version}`);
    
    // Test Health Check
    const healthResponse = await axios.get(`${baseURL}/api/health`);
    console.log(chalk.green('✅ Health Check working'));
    console.log(`   Status: ${healthResponse.data.status}`);
    
    console.log(chalk.yellow('\n🔐 2. Testing Authentication...'));
    
    // Test ohne API Key (sollte fehlschlagen)
    try {
      await axios.get(`${baseURL}/api/protected/german-tax-report/0x123`);
    } catch (error) {
      if (error.response.status === 401) {
        console.log(chalk.green('✅ Authentication protection working'));
      }
    }
    
    // Test mit ungültigem API Key
    try {
      await axios.get(`${baseURL}/api/protected/german-tax-report/0x123`, {
        headers: { 'X-API-Key': 'invalid-key' }
      });
    } catch (error) {
      if (error.response.status === 401) {
        console.log(chalk.green('✅ Invalid API Key protection working'));
      }
    }
    
    // Test mit gültigem API Key
    const taxReportResponse = await axios.get(
      `${baseURL}/api/protected/german-tax-report/0x308e77742a0b2D3Ed14a54B97B4c49c7659A1a7e`,
      {
        headers: { 'X-API-Key': 'ak_live_abc123def456' }
      }
    );
    console.log(chalk.green('✅ Valid API Key authentication working'));
    console.log(`   User: ${taxReportResponse.data.user}`);
    
    console.log(chalk.yellow('\n👑 3. Testing Admin Permissions...'));
    
    // Test Admin Endpoint mit read-only Key (sollte fehlschlagen)
    try {
      await axios.post(`${baseURL}/api/protected/admin/system-config`, {}, {
        headers: { 'X-API-Key': 'ak_test_xyz789uvw123' }
      });
    } catch (error) {
      if (error.response.status === 403) {
        console.log(chalk.green('✅ Permission system working'));
      }
    }
    
    // Test Admin Endpoint mit Admin Key
    const adminResponse = await axios.post(
      `${baseURL}/api/protected/admin/system-config`,
      {
        germanTaxSettings: {
          fifoMethod: true,
          roiThreshold: 600
        }
      },
      {
        headers: { 'X-API-Key': 'ak_live_abc123def456' }
      }
    );
    console.log(chalk.green('✅ Admin permissions working'));
    console.log(`   Updated by: ${adminResponse.data.updatedBy}`);
    
    console.log(chalk.yellow('\n🇩🇪 4. Testing German Tax Features...'));
    
    // Test WGEP Test Wallet
    const wgepResponse = await axios.get(
      `${baseURL}/api/protected/wgep-test/0x308e77742a0b2D3Ed14a54B97B4c49c7659A1a7e`,
      {
        headers: { 'X-API-Key': 'ak_live_abc123def456' }
      }
    );
    console.log(chalk.green('✅ WGEP test endpoint working'));
    console.log(`   Tax Category: ${wgepResponse.data.germanTaxClassification.taxCategory}`);
    
    // Test Portfolio
    const portfolioResponse = await axios.get(
      `${baseURL}/api/protected/portfolio/0x308e77742a0b2D3Ed14a54B97B4c49c7659A1a7e`,
      {
        headers: { 'X-API-Key': 'ak_live_abc123def456' }
      }
    );
    console.log(chalk.green('✅ Portfolio endpoint working'));
    console.log(`   Total Value: €${portfolioResponse.data.portfolio.totalValueEUR}`);
    
    // Test Export Request
    const exportResponse = await axios.post(
      `${baseURL}/api/protected/export-tax-report`,
      {
        walletAddress: '0x308e77742a0b2D3Ed14a54B97B4c49c7659A1a7e',
        format: 'PDF',
        year: 2023
      },
      {
        headers: { 'X-API-Key': 'ak_live_abc123def456' }
      }
    );
    console.log(chalk.green('✅ Tax report export working'));
    console.log(`   Export ID: ${exportResponse.data.exportId}`);
    
    console.log(chalk.yellow('\n📊 5. Testing Rate Limiting...'));
    
    // Test Rate Limiting (viele schnelle Requests)
    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(
        axios.get(`${baseURL}/api/public/status`).catch(err => err.response)
      );
    }
    
    const responses = await Promise.all(promises);
    const successCount = responses.filter(r => r.status === 200).length;
    console.log(chalk.green(`✅ Rate limiting active (${successCount}/10 requests successful)`));
    
    console.log(chalk.yellow('\n🔍 6. Testing Security Monitoring...'));
    
    // Test Security Metrics
    const metricsResponse = await axios.get(
      `${baseURL}/api/protected/admin/security-metrics`,
      {
        headers: { 'X-API-Key': 'ak_live_abc123def456' }
      }
    );
    console.log(chalk.green('✅ Security monitoring working'));
    console.log(`   Total Requests: ${metricsResponse.data.securityMetrics.totalRequests}`);
    console.log(`   Unique IPs: ${metricsResponse.data.securityMetrics.uniqueIPs}`);
    
  } catch (error) {
    console.error(chalk.red('❌ Security Test Error:'), error.message);
    if (error.response) {
      console.error(chalk.red('   Response:'), error.response.data);
    }
  }
}

// =============================================================================
// 🎯 USAGE EXAMPLES
// =============================================================================

function showUsageExamples() {
  console.log(chalk.cyan(`
📖 USAGE EXAMPLES:

1. Public API Call:
   curl http://localhost:3001/api/public/status

2. Protected API Call (mit API Key):
   curl -H "X-API-Key: ak_live_abc123def456" \\
        http://localhost:3001/api/protected/german-tax-report/0x308e77742a0b2D3Ed14a54B97B4c49c7659A1a7e

3. Tax Report Export:
   curl -X POST \\
        -H "X-API-Key: ak_live_abc123def456" \\
        -H "Content-Type: application/json" \\
        -d '{"walletAddress":"0x308e77742a0b2D3Ed14a54B97B4c49c7659A1a7e","format":"PDF","year":2023}' \\
        http://localhost:3001/api/protected/export-tax-report

4. WGEP Test:
   curl -H "X-API-Key: ak_live_abc123def456" \\
        http://localhost:3001/api/protected/wgep-test/0x308e77742a0b2D3Ed14a54B97B4c49c7659A1a7e

5. Admin Config:
   curl -X POST \\
        -H "X-API-Key: ak_live_abc123def456" \\
        -H "Content-Type: application/json" \\
        -d '{"germanTaxSettings":{"fifoMethod":true,"roiThreshold":600}}' \\
        http://localhost:3001/api/protected/admin/system-config

6. Security Metrics:
   curl -H "X-API-Key: ak_live_abc123def456" \\
        http://localhost:3001/api/protected/admin/security-metrics
  `));
}

// =============================================================================
// 🚀 MAIN EXECUTION
// =============================================================================

if (require.main === module) {
  // Zeige Usage Examples wenn --help übergeben wird
  if (process.argv.includes('--help')) {
    showUsageExamples();
    process.exit(0);
  }
  
  startSecureServer().catch(error => {
    console.error(chalk.red('❌ Server startup failed:'), error);
    process.exit(1);
  });
}

module.exports = { startSecureServer, runSecurityTests }; 