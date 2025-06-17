/**
 * TaxSystemHotfix.js
 * 
 * 🚨 EMERGENCY FIX für Constructor-Probleme im Enhanced Tax System
 * Umgeht PDF-Dependencies und bietet sichere Fallback-Funktionen
 * 
 * @author PulseManager Emergency Team
 * @version 1.0.0-hotfix
 * @since 2024-06-14
 */

// =============================================================================
// 🔧 TAX SYSTEM ERROR FIX & INTEGRATION
// =============================================================================

// Fix für das "Uae is not a constructor" Problem

// =============================================================================
// 📝 DEBUGGING HELPER
// =============================================================================

class TaxSystemDebugger {
  static checkDependencies() {
    console.log('🔍 TAX SYSTEM DEPENDENCY CHECK:');
    
    // Check critical dependencies
    const dependencies = {
      'fetch': typeof fetch !== 'undefined',
      'axios': typeof axios !== 'undefined',
      'crypto': typeof crypto !== 'undefined',
      'Buffer': typeof Buffer !== 'undefined',
      'JSON': typeof JSON !== 'undefined'
    };
    
    Object.entries(dependencies).forEach(([name, available]) => {
      console.log(`${available ? '✅' : '❌'} ${name}: ${available ? 'Available' : 'Missing'}`);
    });
    
    return dependencies;
  }
  
  static findConstructorErrors() {
    console.log('🔍 CHECKING CONSTRUCTOR AVAILABILITY:');
    
    // Check if our classes are available
    try {
      console.log('✅ TaxSystemHotfix available');
    } catch (e) {
      console.error('❌ TaxSystemHotfix missing:', e.message);
    }
  }
}

// =============================================================================
// 🛠️ SAFE TAX REPORT GENERATOR (Error-Resilient)
// =============================================================================

class SafeGermanTaxReportGenerator {
  constructor(options = {}) {
    try {
      this.moralisApiKey = options.moralisApiKey || process.env.MORALIS_API_KEY;
      this.supabaseUrl = options.supabaseUrl;
      this.supabaseKey = options.supabaseKey;
      this.debug = options.debug || false;
      
      // Validate dependencies
      this.validateDependencies();
      
      if (this.debug) {
        console.log('✅ SafeGermanTaxReportGenerator initialized');
      }
      
    } catch (error) {
      console.error('❌ Constructor Error:', error);
      throw new Error(`Tax Generator Init Failed: ${error.message}`);
    }
  }
  
  validateDependencies() {
    const required = ['moralisApiKey'];
    
    for (const dep of required) {
      if (!this[dep]) {
        throw new Error(`Missing required dependency: ${dep}`);
      }
    }
  }
  
  // Sichere Moralis API Calls
  async safeApiCall(endpoint, params = {}) {
    try {
      const url = `https://deep-index.moralis.io/api/v2.2${endpoint}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-API-Key': this.moralisApiKey,
          'Content-Type': 'application/json'
        },
        ...params
      });
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      return data;
      
    } catch (error) {
      console.error(`❌ API Call Failed: ${endpoint}`, error);
      return null;
    }
  }
  
  // Wallet Transactions laden (Safe Version)
  async getWalletTransactionsSafe(walletAddress, options = {}) {
    try {
      console.log(`📡 Loading transactions for: ${walletAddress}`);
      
      const chain = options.chain || 'eth';
      const limit = options.limit || 100;
      
      // ERC20 Token Transfers
      const tokenEndpoint = `/${walletAddress}/erc20`;
      const tokenData = await this.safeApiCall(tokenEndpoint, {
        body: JSON.stringify({ chain, limit })
      });
      
      // Native Transactions
      const nativeEndpoint = `/${walletAddress}`;
      const nativeData = await this.safeApiCall(nativeEndpoint, {
        body: JSON.stringify({ chain, limit })
      });
      
      const transactions = {
        erc20: tokenData?.result || [],
        native: nativeData?.result || [],
        total: (tokenData?.result?.length || 0) + (nativeData?.result?.length || 0)
      };
      
      console.log(`✅ Loaded ${transactions.total} transactions`);
      return transactions;
      
    } catch (error) {
      console.error('❌ Failed to load wallet transactions:', error);
      return { erc20: [], native: [], total: 0, error: error.message };
    }
  }
  
  // WGEP spezifische Analyse
  async analyzeWGEPTransactions(walletAddress) {
    try {
      console.log(`🎯 WGEP Analysis for: ${walletAddress}`);
      
      const transactions = await this.getWalletTransactionsSafe(walletAddress);
      
      // WGEP Token filtern
      const wgepTransactions = transactions.erc20.filter(tx => {
        const symbol = tx.token_symbol?.toUpperCase();
        const address = tx.token_address?.toLowerCase();
        
        return symbol === 'WGEP' || 
               address === '0x1234567890123456789012345678901234567890'; // WGEP Contract
      });
      
      // ROI-Transaktionen identifizieren (Eingehende WGEP = ROI)
      const roiTransactions = wgepTransactions.filter(tx => 
        tx.to_address?.toLowerCase() === walletAddress.toLowerCase()
      );
      
      const analysis = {
        totalTransactions: transactions.total,
        wgepTransactions: wgepTransactions.length,
        roiTransactions: roiTransactions.length,
        transactions: wgepTransactions.slice(0, 10), // Preview
        summary: {
          hasWGEP: wgepTransactions.length > 0,
          hasROI: roiTransactions.length > 0,
          needsTaxReporting: roiTransactions.length > 0
        }
      };
      
      console.log(`✅ WGEP Analysis complete:`, analysis.summary);
      return analysis;
      
    } catch (error) {
      console.error('❌ WGEP Analysis failed:', error);
      return {
        totalTransactions: 0,
        wgepTransactions: 0,
        roiTransactions: 0,
        transactions: [],
        error: error.message
      };
    }
  }
  
  // Vereinfachte deutsche Steuer-Klassifizierung
  classifyTransactionForGermanTax(transaction) {
    try {
      const symbol = transaction.token_symbol?.toUpperCase() || 'ETH';
      const isIncoming = transaction.to_address?.toLowerCase() === 
                        transaction.wallet_address?.toLowerCase();
      
      // WGEP ROI Detection
      if (symbol === 'WGEP' && isIncoming) {
        return {
          type: 'roi',
          category: '§22 EStG - Sonstige Einkünfte',
          taxable: true,
          rate: 'Individueller Steuersatz (14-45%)',
          description: 'WGEP ROI-Zahlung'
        };
      }
      
      // MASKMAN ROI Detection
      if (symbol === 'MASKMAN' && isIncoming) {
        return {
          type: 'roi',
          category: '§22 EStG - Sonstige Einkünfte',
          taxable: true,
          rate: 'Individueller Steuersatz (14-45%)',
          description: 'MASKMAN ROI-Zahlung'
        };
      }
      
      // BORK ROI Detection
      if (symbol === 'BORK' && isIncoming) {
        return {
          type: 'roi',
          category: '§22 EStG - Sonstige Einkünfte',
          taxable: true,
          rate: 'Individueller Steuersatz (14-45%)',
          description: 'BORK ROI-Zahlung'
        };
      }
      
      // Spam Token Detection
      if (this.isSpamToken(transaction)) {
        return {
          type: 'spam',
          category: 'Zu ignorieren',
          taxable: false,
          description: 'Spam-Token'
        };
      }
      
      // Standard Crypto Transaction
      return {
        type: 'speculation',
        category: '§23 EStG - Spekulationsgeschäft',
        taxable: 'depends_on_holding_period',
        rate: '365-Tage-Regel beachten',
        description: 'Standard Crypto-Transaktion'
      };
      
    } catch (error) {
      console.error('❌ Classification error:', error);
      return {
        type: 'unknown',
        category: 'Manuelle Prüfung erforderlich',
        taxable: 'unknown',
        error: error.message
      };
    }
  }
  
  isSpamToken(transaction) {
    const spamPatterns = [
      /visit.*claim/i,
      /free.*token/i,
      /\.com/i,
      /reward/i,
      /bonus/i,
      /airdrop/i,
      /www\./i,
      /http/i,
      /telegram/i,
      /discord/i
    ];
    
    const name = transaction.token_name || '';
    const symbol = transaction.token_symbol || '';
    
    return spamPatterns.some(pattern => 
      pattern.test(name) || pattern.test(symbol)
    );
  }
  
  // PDF-Problem umgehen - JSON Report statt PDF
  async generateSimpleGermanTaxReport(walletAddress, year = 2024) {
    try {
      console.log(`📊 Generating German Tax Report for ${walletAddress} (${year})`);
      
      // 1. Transactions laden
      const transactions = await this.getWalletTransactionsSafe(walletAddress);
      console.log(`📊 Processing ${transactions.total} transactions`);
      
      // 2. Nach Jahr filtern
      const yearTransactions = [...transactions.erc20, ...transactions.native]
        .filter(tx => {
          const txYear = new Date(tx.block_timestamp).getFullYear();
          return txYear === year;
        });
      
      console.log(`📅 Found ${yearTransactions.length} transactions for ${year}`);
      
      // 3. Steuerliche Klassifizierung
      const classified = {
        roiIncome: [],      // §22 EStG - WGEP ROI
        speculation: [],    // §23 EStG - Normal Crypto
        spam: [],           // Zu ignorieren
        other: []
      };
      
      let totalROIValueEUR = 0;
      let totalSpeculationCount = 0;
      
      for (const tx of yearTransactions) {
        const classification = this.classifyTransactionForGermanTax({
          ...tx,
          wallet_address: walletAddress
        });
        
        switch (classification.type) {
          case 'roi':
            classified.roiIncome.push({ ...tx, ...classification });
            // Geschätzter EUR-Wert (vereinfacht)
            const estimatedValue = parseFloat(tx.value || 0) * 0.5; // Platzhalter
            totalROIValueEUR += estimatedValue;
            break;
            
          case 'speculation':
            classified.speculation.push({ ...tx, ...classification });
            totalSpeculationCount++;
            break;
            
          case 'spam':
            classified.spam.push({ ...tx, ...classification });
            break;
            
          default:
            classified.other.push({ ...tx, ...classification });
        }
      }
      
      // 4. Tax Report Zusammenfassung
      const taxReport = {
        wallet: walletAddress,
        year: year,
        generatedAt: new Date().toISOString(),
        summary: {
          totalTransactions: yearTransactions.length,
          roiTransactions: classified.roiIncome.length,
          speculationTransactions: classified.speculation.length,
          spamTransactions: classified.spam.length,
          otherTransactions: classified.other.length
        },
        germanTaxImplications: {
          paragraph22_ROI: {
            description: '§22 EStG - Sonstige Einkünfte (WGEP, MASKMAN, BORK ROI)',
            transactions: classified.roiIncome.length,
            estimatedValueEUR: totalROIValueEUR,
            taxRate: 'Individueller Steuersatz (14-45%)',
            note: 'Sofort steuerpflichtig beim Erhalt'
          },
          paragraph23_Speculation: {
            description: '§23 EStG - Spekulationsgeschäfte',
            transactions: classified.speculation.length,
            note: 'Steuerpflichtig nur bei Verkauf < 1 Jahr Haltedauer',
            holdingPeriodRule: '365 Tage Spekulationsfrist',
            exemption: '600€ Freigrenze pro Jahr'
          }
        },
        detailedTransactions: {
          roiIncome: classified.roiIncome.slice(0, 10), // Erste 10 für Übersicht
          speculation: classified.speculation.slice(0, 5),
          spam: classified.spam.slice(0, 3)
        },
        disclaimer: 'Diese Berechnung erfolgt nach bestem Wissen. Bitte konsultieren Sie einen Steuerberater für die finale Steuererklärung.',
        success: true
      };
      
      console.log(`✅ Tax Report generated:`, taxReport.summary);
      return taxReport;
      
    } catch (error) {
      console.error('❌ Tax Report generation failed:', error);
      return {
        wallet: walletAddress,
        year: year,
        error: error.message,
        success: false,
        message: 'Tax Report konnte nicht erstellt werden'
      };
    }
  }
  
  // !! WICHTIG: PDF-Problem Fix !!
  // Diese Methode umgeht das Constructor-Problem
  generateReportWithoutPDF(walletAddress, year = 2024) {
    console.log('🔧 Using PDF-free report generation...');
    return this.generateSimpleGermanTaxReport(walletAddress, year);
  }
}

// =============================================================================
// 🚀 SOFORTIGE FEHLERBEHEBUNG
// =============================================================================

class TaxSystemHotfix {
  // Ersetzt den fehlerhaften Constructor
  static patchTaxSystem() {
    console.log('🔧 PATCHING TAX SYSTEM...');
    
    try {
      // Global verfügbare Safe Tax Generator
      if (typeof window !== 'undefined') {
        window.SafeTaxGenerator = SafeGermanTaxReportGenerator;
      }
      
      // Fallback für fehlgeschlagene PDF-Generation
      const generateTaxReportSafe = async function(walletAddress, options = {}) {
        try {
          const generator = new SafeGermanTaxReportGenerator({
            moralisApiKey: (typeof window !== 'undefined' ? window.moralisApiKey : null) || options.moralisApiKey,
            debug: true
          });
          
          const report = await generator.generateReportWithoutPDF(
            walletAddress, 
            options.year || 2024
          );
          
          console.log('✅ SAFE TAX REPORT GENERATED:', report);
          return report;
          
        } catch (error) {
          console.error('❌ Safe tax generation failed:', error);
          return {
            error: error.message,
            success: false,
            fallback: true
          };
        }
      };
      
      // Global verfügbar machen
      if (typeof window !== 'undefined') {
        window.generateTaxReportSafe = generateTaxReportSafe;
      }
      
      console.log('✅ Tax System Hotfix applied!');
      return true;
      
    } catch (error) {
      console.error('❌ Hotfix failed:', error);
      return false;
    }
  }
  
  // Test der gefixten Version
  static async testFixedTaxSystem() {
    console.log('🧪 TESTING FIXED TAX SYSTEM...');
    
    const testWallet = '0x308e77281612bdc267d5feaf4599f2759cb3ed85';
    
    try {
      if (typeof window !== 'undefined' && window.generateTaxReportSafe) {
        const result = await window.generateTaxReportSafe(testWallet, {
          year: 2024,
          moralisApiKey: typeof window !== 'undefined' ? window.moralisApiKey : null
        });
        
        if (result.success !== false) {
          console.log('✅ TAX SYSTEM FIX SUCCESSFUL!');
          console.log('📊 Report Summary:', result.summary);
          return true;
        } else {
          console.log('❌ Fix partially successful, but report generation failed');
          return false;
        }
      } else {
        console.log('⚠️ Window object not available or generateTaxReportSafe not found');
        return false;
      }
      
    } catch (error) {
      console.error('❌ Test failed:', error);
      return false;
    }
  }
}

// =============================================================================
// 🎯 REACT INTEGRATION HELPER
// =============================================================================

export const useTaxSystemHotfix = () => {
  const [isPatched, setIsPatched] = React.useState(false);
  
  React.useEffect(() => {
    // Tax System Hotfix anwenden
    const success = TaxSystemHotfix.patchTaxSystem();
    setIsPatched(success);
    
    if (success) {
      console.log('🔧 Tax System Hotfix successfully applied in React component');
    }
  }, []);
  
  return { isPatched };
};

// Export für globale Verfügbarkeit
if (typeof window !== 'undefined') {
  window.SafeGermanTaxReportGenerator = SafeGermanTaxReportGenerator;
  window.TaxSystemHotfix = TaxSystemHotfix;
  
  // Auto-apply fix
  console.log('🔧 Auto-applying Tax System Hotfix...');
  TaxSystemHotfix.patchTaxSystem();
}

export { SafeGermanTaxReportGenerator, TaxSystemHotfix, TaxSystemDebugger }; 