const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

// Test-Verzeichnisse die erstellt werden sollen
const testDirs = [
  '__tests__/api',
  '__tests__/services',
  '__tests__/frontend',
  '__tests__/utils',
  '__tests__/security',
  '__tests__/performance',
  '__tests__/stress',
  '__tests__/compatibility',
  '__tests__/fixtures',
  '__tests__/helpers',
  'cypress/e2e',
  'cypress/fixtures',
  'cypress/support',
  'src/mocks',
  'coverage'
];

// Test-Konfigurationsdateien
const testConfigFiles = [
  'cypress.config.js',
  '.github/workflows/tests.yml'
];

function createTestDirectories() {
  console.log(chalk.blue('🏗️  Erstelle Test-Verzeichnisse...\n'));

  testDirs.forEach(dir => {
    const fullPath = path.join(process.cwd(), dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      console.log(chalk.green(`✅ Erstellt: ${dir}`));
    } else {
      console.log(chalk.yellow(`⚠️  Bereits vorhanden: ${dir}`));
    }
  });
}

function createCypressConfig() {
  const cypressConfig = `const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    setupNodeEvents(on, config) {
      // Event listeners
      on('task', {
        log(message) {
          console.log(message);
          return null;
        }
      });
    },
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/e2e.js'
  },
  component: {
    devServer: {
      framework: 'react',
      bundler: 'vite',
    },
    specPattern: 'src/**/*.cy.{js,jsx,ts,tsx}'
  }
});`;

  const cypressConfigPath = path.join(process.cwd(), 'cypress.config.js');
  if (!fs.existsSync(cypressConfigPath)) {
    fs.writeFileSync(cypressConfigPath, cypressConfig);
    console.log(chalk.green('✅ Erstellt: cypress.config.js'));
  }
}

function createGitHubWorkflow() {
  const workflowDir = path.join(process.cwd(), '.github/workflows');
  if (!fs.existsSync(workflowDir)) {
    fs.mkdirSync(workflowDir, { recursive: true });
  }

  const workflow = `name: 🧪 PulseManager Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    
    steps:
    - name: 📥 Checkout Code
      uses: actions/checkout@v4
    
    - name: 🟢 Setup Node.js $\{{ matrix.node-version }}
      uses: actions/setup-node@v4
      with:
        node-version: $\{{ matrix.node-version }}
        cache: 'npm'
    
    - name: 📦 Install Dependencies
      run: npm ci
    
    - name: 🧪 Run Unit Tests
      run: npm run test:services
    
    - name: 💰 Run Tax System Tests
      run: npm run test:tax
    
    - name: 🔒 Run Security Tests
      run: npm run test:security
    
    - name: ⚡ Run Performance Tests
      run: npm run test:performance
    
    - name: 📊 Generate Coverage Report
      run: npm run test:coverage
    
    - name: 📈 Upload Coverage to Codecov
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info
        flags: unittests
        name: pulsemanager-coverage

  e2e:
    runs-on: ubuntu-latest
    needs: test
    
    steps:
    - name: 📥 Checkout Code
      uses: actions/checkout@v4
    
    - name: 🟢 Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20.x'
        cache: 'npm'
    
    - name: 📦 Install Dependencies
      run: npm ci
    
    - name: 🚀 Start Development Server
      run: npm run dev &
      
    - name: ⏳ Wait for Server
      run: npx wait-on http://localhost:3000
    
    - name: 🤖 Run E2E Tests
      run: npm run test:e2e
    
    - name: 📸 Upload Screenshots
      uses: actions/upload-artifact@v3
      if: failure()
      with:
        name: cypress-screenshots
        path: cypress/screenshots
`;

  const workflowPath = path.join(workflowDir, 'tests.yml');
  if (!fs.existsSync(workflowPath)) {
    fs.writeFileSync(workflowPath, workflow);
    console.log(chalk.green('✅ Erstellt: .github/workflows/tests.yml'));
  }
}

function createCypressSupport() {
  const supportContent = `// Cypress Support Commands für PulseManager

import './commands';

// Global error handling
Cypress.on('uncaught:exception', (err, runnable) => {
  // Ignoriere spezifische Fehler die durch externe Services verursacht werden
  if (err.message.includes('Moralis') || err.message.includes('ResizeObserver')) {
    return false;
  }
  
  return true;
});

// Setup für jeden Test
beforeEach(() => {
  // Mock externe APIs
  cy.intercept('GET', '**/moralis.io/**', { fixture: 'moralis-response.json' });
  cy.intercept('POST', '/api/german-tax-report', { fixture: 'tax-report.json' });
  
  // Setze Viewport
  cy.viewport(1280, 720);
});`;

  const supportPath = path.join(process.cwd(), 'cypress/support/e2e.js');
  if (!fs.existsSync(supportPath)) {
    fs.writeFileSync(supportPath, supportContent);
    console.log(chalk.green('✅ Erstellt: cypress/support/e2e.js'));
  }

  const commandsContent = `// Custom Cypress Commands für PulseManager

// Wallet-Adresse eingeben
Cypress.Commands.add('enterWalletAddress', (address) => {
  cy.get('[data-testid="wallet-input"]').type(address);
});

// Steuerreport generieren
Cypress.Commands.add('generateTaxReport', (walletAddress, year = 2024) => {
  cy.enterWalletAddress(walletAddress);
  cy.get('[data-testid="year-select"]').select(year.toString());
  cy.get('[data-testid="generate-button"]').click();
});

// Auf Ladevorgang warten
Cypress.Commands.add('waitForTaxReport', () => {
  cy.get('[data-testid="loading"]', { timeout: 10000 }).should('not.exist');
  cy.get('[data-testid="tax-report-result"]').should('be.visible');
});

// Mock Moralis API
Cypress.Commands.add('mockMoralis', (walletAddress, response) => {
  cy.intercept('GET', \`**/**/\${walletAddress}/**\`, response);
});

// Validiere deutsche Steuerklassifikation
Cypress.Commands.add('validateGermanTaxClassification', () => {
  cy.get('[data-testid="roi-section"]').should('contain', '§22 EStG');
  cy.get('[data-testid="speculation-section"]').should('contain', '§23 EStG');
});

// Export-Funktionen testen
Cypress.Commands.add('exportReport', (format) => {
  cy.get(\`[data-testid="export-\${format}"]\`).click();
  cy.get('[data-testid="download-started"]').should('be.visible');
});`;

  const commandsPath = path.join(process.cwd(), 'cypress/support/commands.js');
  if (!fs.existsSync(commandsPath)) {
    fs.writeFileSync(commandsPath, commandsContent);
    console.log(chalk.green('✅ Erstellt: cypress/support/commands.js'));
  }
}

function createTestFixtures() {
  const fixtures = {
    'moralis-response.json': {
      result: [
        {
          token_address: '0x1234567890abcdef',
          symbol: 'WGEP',
          name: 'WGEP Token',
          balance: '1000000000000000000',
          decimals: 18
        }
      ]
    },
    'tax-report.json': {
      success: true,
      data: {
        walletAddress: '0x308e77f4c2ebdaf7c8e5c8a5e5b5a7c2f8e9a1b2',
        period: { year: 2024 },
        transactions: [
          {
            hash: '0x123abc',
            date: '2024-01-15',
            type: 'ROI',
            tokenSymbol: 'WGEP',
            amount: '1000',
            valueEUR: 50.00,
            taxType: '§22 EStG'
          }
        ],
        summary: {
          totalROIIncome: 50.00,
          totalCapitalGains: 0,
          totalTaxableAmount: 50.00,
          estimatedTax: 12.50
        }
      }
    },
    'empty-wallet.json': {
      success: true,
      data: {
        transactions: [],
        summary: {
          totalROIIncome: 0,
          totalCapitalGains: 0,
          totalTaxableAmount: 0,
          estimatedTax: 0
        }
      }
    }
  };

  Object.entries(fixtures).forEach(([filename, content]) => {
    const fixturePath = path.join(process.cwd(), 'cypress/fixtures', filename);
    if (!fs.existsSync(fixturePath)) {
      fs.writeFileSync(fixturePath, JSON.stringify(content, null, 2));
      console.log(chalk.green(`✅ Erstellt: cypress/fixtures/${filename}`));
    }
  });
}

function displayTestInstructions() {
  console.log(chalk.blue('\n🎯 Test-Setup abgeschlossen!\n'));
  
  console.log(chalk.yellow('📋 Verfügbare Test-Commands:'));
  console.log(chalk.white('  npm run test              - Alle Unit Tests'));
  console.log(chalk.white('  npm run test:watch        - Tests im Watch-Mode'));
  console.log(chalk.white('  npm run test:coverage     - Tests mit Coverage'));
  console.log(chalk.white('  npm run test:services     - Service-Tests'));
  console.log(chalk.white('  npm run test:tax          - Steuerreport-Tests'));
  console.log(chalk.white('  npm run test:security     - Security-Tests'));
  console.log(chalk.white('  npm run test:performance  - Performance-Tests'));
  console.log(chalk.white('  npm run test:e2e          - E2E Tests'));
  console.log(chalk.white('  npm run test:e2e:open     - Cypress UI'));
  console.log(chalk.white('  npm run test:all          - Alle Tests'));
  
  console.log(chalk.yellow('\n🚀 Nächste Schritte:'));
  console.log(chalk.white('  1. npm install            - Dependencies installieren'));
  console.log(chalk.white('  2. npm run test:setup     - Test-Setup ausführen (bereits gemacht)'));
  console.log(chalk.white('  3. npm run test           - Tests starten'));
  console.log(chalk.white('  4. npm run test:e2e:open  - Cypress öffnen'));
  
  console.log(chalk.yellow('\n💡 Tipps:'));
  console.log(chalk.white('  - Tests sind für deutsches Steuerrecht optimiert'));
  console.log(chalk.white('  - WGEP-Token Tests sind speziell implementiert'));
  console.log(chalk.white('  - Security Tests prüfen DSGVO-Konformität'));
  console.log(chalk.white('  - Performance Tests für große Wallets'));
}

function main() {
  console.log(chalk.blue('🧪 PulseManager Test-Setup wird gestartet...\n'));

  try {
    createTestDirectories();
    createCypressConfig();
    createGitHubWorkflow();
    createCypressSupport();
    createTestFixtures();
    displayTestInstructions();
    
    console.log(chalk.green('\n✅ Test-Setup erfolgreich abgeschlossen! 🎉'));
    
  } catch (error) {
    console.error(chalk.red('❌ Fehler beim Test-Setup:'), error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { 
  createTestDirectories, 
  createCypressConfig, 
  createGitHubWorkflow 
}; 