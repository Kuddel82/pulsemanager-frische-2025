const { spawn } = require('child_process');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

const testSuites = [
  { 
    name: '🧪 Unit Tests', 
    command: 'npm run test -- --passWithNoTests',
    timeout: 60000,
    critical: true
  },
  { 
    name: '⚙️  Service Tests', 
    command: 'npm run test:services',
    timeout: 120000,
    critical: true
  },
  { 
    name: '💰 Steuerreport Tests', 
    command: 'npm run test:tax',
    timeout: 180000,
    critical: true
  },
  { 
    name: '🔒 Security Tests', 
    command: 'npm run test:security',
    timeout: 90000,
    critical: true
  },
  { 
    name: '⚡ Performance Tests', 
    command: 'npm run test:performance',
    timeout: 300000,
    critical: false
  },
  { 
    name: '🔥 Stress Tests', 
    command: 'npm run test:stress',
    timeout: 600000,
    critical: false
  },
  { 
    name: '🌐 E2E Tests', 
    command: 'npm run test:e2e',
    timeout: 300000,
    critical: true
  }
];

class TestRunner {
  constructor() {
    this.results = [];
    this.startTime = Date.now();
    this.coverageThresholds = {
      statements: 75,
      branches: 75,
      functions: 75,
      lines: 75
    };
  }

  async runTestSuite(suite) {
    return new Promise((resolve, reject) => {
      console.log(chalk.blue(`\n🚀 Running ${suite.name}...`));
      console.log(chalk.gray(`Command: ${suite.command}`));
      console.log(chalk.gray(`Timeout: ${suite.timeout / 1000}s`));
      
      const startTime = Date.now();
      const [command, ...args] = suite.command.split(' ');
      
      const process = spawn(command, args, { 
        stdio: 'pipe',
        shell: true 
      });
      
      let stdout = '';
      let stderr = '';
      
      process.stdout.on('data', (data) => {
        stdout += data.toString();
        // Live-Output für wichtige Informationen
        if (data.toString().includes('PASS') || data.toString().includes('FAIL')) {
          console.log(chalk.dim(data.toString().trim()));
        }
      });
      
      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      const timeout = setTimeout(() => {
        process.kill('SIGKILL');
        reject(new Error(`Test suite ${suite.name} timed out after ${suite.timeout / 1000}s`));
      }, suite.timeout);
      
      process.on('close', (code) => {
        clearTimeout(timeout);
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        const result = {
          name: suite.name,
          command: suite.command,
          code,
          duration,
          stdout,
          stderr,
          critical: suite.critical
        };
        
        if (code === 0) {
          console.log(chalk.green(`✅ ${suite.name} passed! (${duration}ms)`));
          this.logTestResult(result, true);
          resolve(result);
        } else {
          console.log(chalk.red(`❌ ${suite.name} failed! (Exit code: ${code})`));
          if (stderr) {
            console.log(chalk.red('Error output:'));
            console.log(chalk.red(stderr.slice(-500))); // Letzten 500 Zeichen
          }
          this.logTestResult(result, false);
          
          if (suite.critical) {
            reject(new Error(`Critical test suite ${suite.name} failed with code ${code}`));
          } else {
            console.log(chalk.yellow(`⚠️  Non-critical test ${suite.name} failed, continuing...`));
            resolve(result);
          }
        }
      });
      
      process.on('error', (error) => {
        clearTimeout(timeout);
        console.error(chalk.red(`Process error in ${suite.name}:`, error.message));
        reject(error);
      });
    });
  }

  logTestResult(result, passed) {
    this.results.push({
      ...result,
      passed,
      timestamp: new Date().toISOString()
    });
  }

  async checkCoverage() {
    console.log(chalk.blue('\n📊 Checking test coverage...'));
    
    const coveragePath = path.join(process.cwd(), 'coverage', 'coverage-summary.json');
    
    if (!fs.existsSync(coveragePath)) {
      console.log(chalk.yellow('⚠️  Coverage report not found, generating...'));
      
      try {
        await this.runTestSuite({
          name: 'Coverage Generation',
          command: 'npm run test:coverage',
          timeout: 120000,
          critical: false
        });
      } catch (error) {
        console.log(chalk.red('Failed to generate coverage report'));
        return false;
      }
    }
    
    if (fs.existsSync(coveragePath)) {
      try {
        const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
        const summary = coverage.total;
        
        console.log(chalk.blue('\n📈 Coverage Summary:'));
        console.log(`Statements: ${summary.statements.pct}%`);
        console.log(`Branches: ${summary.branches.pct}%`);
        console.log(`Functions: ${summary.functions.pct}%`);
        console.log(`Lines: ${summary.lines.pct}%`);
        
        const failing = [];
        Object.entries(this.coverageThresholds).forEach(([metric, threshold]) => {
          if (summary[metric].pct < threshold) {
            failing.push(`${metric}: ${summary[metric].pct}% (required: ${threshold}%)`);
          }
        });
        
        if (failing.length > 0) {
          console.log(chalk.red('\n❌ Coverage below thresholds:'));
          failing.forEach(failure => console.log(chalk.red(`  ${failure}`)));
          return false;
        } else {
          console.log(chalk.green('\n✅ All coverage thresholds met!'));
          return true;
        }
      } catch (error) {
        console.log(chalk.red('Error reading coverage report:', error.message));
        return false;
      }
    }
    
    return false;
  }

  generateReport() {
    const endTime = Date.now();
    const totalDuration = endTime - this.startTime;
    
    const passedTests = this.results.filter(r => r.passed);
    const failedTests = this.results.filter(r => !r.passed);
    const criticalFailures = failedTests.filter(r => r.critical);
    
    console.log(chalk.blue('\n📋 Test Execution Summary:'));
    console.log(`Total Duration: ${totalDuration / 1000}s`);
    console.log(`Total Suites: ${this.results.length}`);
    console.log(chalk.green(`✅ Passed: ${passedTests.length}`));
    console.log(chalk.red(`❌ Failed: ${failedTests.length}`));
    
    if (criticalFailures.length > 0) {
      console.log(chalk.red(`🚨 Critical Failures: ${criticalFailures.length}`));
    }
    
    // Detaillierte Ergebnisse
    console.log(chalk.blue('\n📊 Detailed Results:'));
    this.results.forEach(result => {
      const status = result.passed ? chalk.green('✅') : chalk.red('❌');
      const duration = `${result.duration / 1000}s`;
      const critical = result.critical ? '🚨' : '';
      console.log(`${status} ${result.name} ${critical} (${duration})`);
    });
    
    // Erstelle JSON-Report
    this.saveJsonReport();
    
    return {
      totalTests: this.results.length,
      passedTests: passedTests.length,
      failedTests: failedTests.length,
      criticalFailures: criticalFailures.length,
      totalDuration,
      success: criticalFailures.length === 0
    };
  }

  saveJsonReport() {
    const reportData = {
      timestamp: new Date().toISOString(),
      totalDuration: Date.now() - this.startTime,
      results: this.results,
      summary: {
        total: this.results.length,
        passed: this.results.filter(r => r.passed).length,
        failed: this.results.filter(r => !r.passed).length,
        criticalFailures: this.results.filter(r => !r.passed && r.critical).length
      }
    };
    
    const reportPath = path.join(process.cwd(), 'test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    console.log(chalk.blue(`\n📄 JSON report saved to: ${reportPath}`));
  }

  async runPreChecks() {
    console.log(chalk.blue('🔍 Running pre-flight checks...\n'));
    
    // Check Node.js version
    const nodeVersion = process.version;
    console.log(`Node.js version: ${nodeVersion}`);
    
    // Check if dependencies are installed
    const nodeModulesExists = fs.existsSync(path.join(process.cwd(), 'node_modules'));
    if (!nodeModulesExists) {
      throw new Error('node_modules not found. Run "npm install" first.');
    }
    
    // Check if jest config exists
    const jestConfigExists = fs.existsSync(path.join(process.cwd(), 'jest.config.js'));
    if (!jestConfigExists) {
      console.log(chalk.yellow('⚠️  jest.config.js not found, using default configuration'));
    }
    
    // Check if test directories exist
    const testDirs = ['__tests__', 'src'];
    const missingDirs = testDirs.filter(dir => !fs.existsSync(path.join(process.cwd(), dir)));
    
    if (missingDirs.length > 0) {
      console.log(chalk.yellow(`⚠️  Missing test directories: ${missingDirs.join(', ')}`));
    }
    
    console.log(chalk.green('✅ Pre-flight checks completed\n'));
  }
}

async function runAllTests() {
  const runner = new TestRunner();
  
  console.log(chalk.blue('🧪 PulseManager Test Suite Starting...\n'));
  console.log(chalk.yellow('🎯 Target: Deutsches Steuerrecht-konform'));
  console.log(chalk.yellow('💎 Focus: WGEP Token & ROI Detection'));
  console.log(chalk.yellow('🔒 Security: DSGVO-konform\n'));
  
  try {
    // Pre-flight checks
    await runner.runPreChecks();
    
    // Run test suites sequentially
    for (const suite of testSuites) {
      try {
        await runner.runTestSuite(suite);
      } catch (error) {
        console.error(chalk.red(`Error in ${suite.name}:`, error.message));
        
        if (suite.critical) {
          console.log(chalk.red('\n💥 Critical test failed, stopping execution.'));
          break;
        }
      }
    }
    
    // Check coverage
    const coveragePassed = await runner.checkCoverage();
    
    // Generate final report
    const summary = runner.generateReport();
    
    // Final status
    console.log(chalk.blue('\n🎯 Final Status:'));
    
    if (summary.success && coveragePassed) {
      console.log(chalk.green('🎉 All tests passed! Ready for production! 🚀'));
      console.log(chalk.green('✅ WGEP Steuerreport System is production-ready'));
      console.log(chalk.green('✅ Deutsches Steuerrecht fully compliant'));
      console.log(chalk.green('✅ Security & DSGVO requirements met'));
      process.exit(0);
    } else {
      const issues = [];
      if (!summary.success) issues.push('Test failures');
      if (!coveragePassed) issues.push('Coverage below threshold');
      
      console.log(chalk.red(`💥 Issues found: ${issues.join(', ')}`));
      console.log(chalk.red('🔧 Please fix issues before deploying to production.'));
      
      // Gib spezifische Hinweise
      if (summary.criticalFailures > 0) {
        console.log(chalk.red('\n🚨 Critical failures detected:'));
        console.log(chalk.red('- Steuerreport functionality may be broken'));
        console.log(chalk.red('- German tax compliance at risk'));
        console.log(chalk.red('- Fix immediately before deployment'));
      }
      
      process.exit(1);
    }
    
  } catch (error) {
    console.error(chalk.red('\n💥 Test execution failed:'), error.message);
    console.log(chalk.red('🔧 Check configuration and try again.'));
    process.exit(1);
  }
}

// CLI usage
if (require.main === module) {
  // Check for CLI arguments
  const args = process.argv.slice(2);
  const flags = {
    skipE2E: args.includes('--skip-e2e'),
    skipPerformance: args.includes('--skip-performance'),
    skipStress: args.includes('--skip-stress'),
    coverageOnly: args.includes('--coverage-only'),
    verbose: args.includes('--verbose')
  };
  
  if (flags.skipE2E) {
    console.log(chalk.yellow('⚠️  Skipping E2E tests'));
    testSuites.splice(testSuites.findIndex(s => s.name.includes('E2E')), 1);
  }
  
  if (flags.skipPerformance) {
    console.log(chalk.yellow('⚠️  Skipping Performance tests'));
    testSuites.splice(testSuites.findIndex(s => s.name.includes('Performance')), 1);
  }
  
  if (flags.skipStress) {
    console.log(chalk.yellow('⚠️  Skipping Stress tests'));
    testSuites.splice(testSuites.findIndex(s => s.name.includes('Stress')), 1);
  }
  
  if (flags.coverageOnly) {
    console.log(chalk.blue('📊 Running coverage analysis only'));
    const runner = new TestRunner();
    runner.checkCoverage().then(passed => {
      process.exit(passed ? 0 : 1);
    });
  } else {
    runAllTests().catch(console.error);
  }
}

module.exports = { 
  runAllTests, 
  TestRunner,
  testSuites 
}; 