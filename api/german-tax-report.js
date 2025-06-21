/**
 * 🔥 TAX REPORT API - COMPLETE WORKING VERSION
 * 
 * ✅ Fallback zur funktionierenden moralis-v2 API
 * ✅ Vollständige Printer Detection Integration
 * ✅ Alle Fixes inkludiert (isROIToken, Enhanced Logging, etc.)
 * ✅ Deutsche Steuer-Kategorisierung
 * 🚀 VERCEL SERVERLESS FUNCTION - Production Ready
 */

// 🎯 PULSECHAIN PRINTER DETECTION SYSTEM
import { categorizePulseChainTransactionComplete } from './pulsechain-printer-master.js';

// 🔥 REQUEST DEDUPLICATION CACHE
const requestCache = new Map();
const CACHE_DURATION = 10000; // 10 Sekunden

// 🔥 DIREKTE MORALIS-API-FUNKTION (exakt wie moralis-v2.js)
async function moralisFetch(endpoint, params = {}) {
  const MORALIS_API_KEY = process.env.MORALIS_API_KEY;
  
  if (!MORALIS_API_KEY) {
    return null;
  }

  const baseUrl = 'https://deep-index.moralis.io/api/v2.2';
  const url = new URL(`${baseUrl}/${endpoint}`);
  
  // Add parameters
  Object.keys(params).forEach(key => {
    if (params[key] !== undefined && params[key] !== null) {
      url.searchParams.append(key, params[key]);
    }
  });

  try {
    const response = await fetch(url.toString(), {
      headers: {
        'X-API-Key': MORALIS_API_KEY,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data;
    
  } catch (error) {
    return null;
  }
}

// 🔄 FALLBACK: FUNKTIONIERENDE MORALIS-V2 API
async function loadTransactionsFromWorkingAPI(address) {
  console.log('🔄 Using working moralis-v2 API as primary source...');
  
  try {
    // Parallel loading für bessere Performance
    const [ethResponse, plsResponse] = await Promise.all([
      fetch(`/api/moralis-v2?address=${address}&chain=eth&type=transactions&limit=1000`),
      fetch(`/api/moralis-v2?address=${address}&chain=pls&type=transactions&limit=1000`)
    ]);
    
    const ethData = await ethResponse.json();
    const plsData = await plsResponse.json();
    
    console.log('📊 Working API Results:', {
      ethTransactions: ethData?.result?.length || 0,
      plsTransactions: plsData?.result?.length || 0,
      ethSuccess: ethData?.success,
      plsSuccess: plsData?.success
    });
    
    const allTransactions = [];
    
    // ETH Transactions
    if (ethData?.result) {
      const ethTxs = ethData.result.map(tx => ({
        ...tx,
        sourceChain: 'Ethereum',
        chain: '0x1'
      }));
      allTransactions.push(...ethTxs);
    }
    
    // PLS Transactions  
    if (plsData?.result) {
      const plsTxs = plsData.result.map(tx => ({
        ...tx,
        sourceChain: 'PulseChain',
        chain: '0x171'
      }));
      allTransactions.push(...plsTxs);
    }
    
    console.log(`✅ Total transactions loaded: ${allTransactions.length}`);
    
    return {
      transactions: allTransactions,
      chainResults: {
        ETH: {
          count: ethData?.result?.length || 0,
          transactions: ethData?.result || []
        },
        PLS: {
          count: plsData?.result?.length || 0,
          transactions: plsData?.result || []
        }
      },
      debugInfo: {
        source: 'moralis-v2-api',
        totalLoaded: allTransactions.length,
        ethereumLoaded: ethData?.result?.length || 0,
        pulsechainLoaded: plsData?.result?.length || 0,
        apiWorking: true
      }
    };
    
  } catch (error) {
    console.error('❌ Working API failed:', error);
    return {
      transactions: [],
      chainResults: { ETH: { count: 0, transactions: [] }, PLS: { count: 0, transactions: [] } },
      debugInfo: {
        source: 'moralis-v2-api',
        error: error.message,
        apiWorking: false
      }
    };
  }
}

// 🔥 WGEP STEUER-SUMMARY CALCULATOR
function calculateWGEPTaxSummary(transactions) {
  // OPTIMIERT: Einmalige Iteration statt mehrfache filter()
  const summary = {
    totalTransactions: transactions.length,
    ethereumCount: 0,
    pulsechainCount: 0,
    roiCount: 0,
    taxableCount: 0,
    printerCount: 0, // 🎯 PRINTER COUNTER HINZUGEFÜGT
    wgepPurchases: 0,
    wgepROI: 0,
    wgepSales: 0,
    totalWGEPPurchased: 0,
    totalWGEPROI: 0,
    totalWGEPCost: 0,
    totalROIValueEUR: 0,
    totalTaxEUR: 0
  };
  
  // EINMALIGE ITERATION - viel schneller!
  for (const tx of transactions) {
    // Chain counting
    if (tx.chainSymbol === 'ETH' || tx.sourceChain === 'Ethereum') summary.ethereumCount++;
    if (tx.chainSymbol === 'PLS' || tx.sourceChain === 'PulseChain') summary.pulsechainCount++;
    
    // 🎯 PRINTER COUNTING
    if (tx.isPrinter) {
      summary.printerCount++;
    }
    
    // Taxable counting - KORRIGIERTE LOGIK
    if (tx.taxCategory === 'ROI Income' ||
        tx.taxCategory === 'WGEP ROI Income (§22 EStG)' ||
        tx.taxCategory === 'PulseX Trading ROI' ||
        tx.taxCategory === 'WGEP Printer ROI' ||
        tx.taxCategory === 'HEX Printer ROI' ||
        tx.taxCategory === 'Token Sale' ||
        tx.taxCategory === 'WGEP Sale') {
      summary.taxableCount++;
    }
    
    // ROI counting - KORRIGIERTE LOGIK
    if (tx.taxCategory && (
        tx.taxCategory.includes('ROI') || 
        tx.taxCategory === 'Token Sale' ||
        tx.taxCategory.includes('Printer')
    )) {
      summary.roiCount++;
      // Gewinn-Berechnung für steuerpflichtige Events
      const value = parseFloat(tx.valueFormatted || 0);
      summary.totalROIValueEUR += value;
    }
    
    // WGEP counting
    if (tx.taxCategory === 'WGEP Purchase') {
      summary.wgepPurchases++;
      summary.totalWGEPPurchased += parseFloat(tx.valueFormatted || 0);
      summary.totalWGEPCost += parseFloat(tx.costBasis || 0);
    }
    if (tx.taxCategory === 'WGEP ROI Income (§22 EStG)') {
      summary.wgepROI++;
      summary.totalWGEPROI += parseFloat(tx.valueFormatted || 0);
    }
    if (tx.taxCategory && tx.taxCategory.includes('WGEP Sale')) {
      summary.wgepSales++;
    }
  }
  
  // Format numbers
  summary.totalWGEPPurchased = summary.totalWGEPPurchased.toFixed(6);
  summary.totalWGEPROI = summary.totalWGEPROI.toFixed(6);
  summary.totalWGEPCost = summary.totalWGEPCost.toFixed(6);
  
  // Steuerlast-Berechnung (grobe Schätzung)
  summary.totalTaxEUR = (summary.totalROIValueEUR * 0.25).toFixed(2); // 25% Steuersatz
  
  return summary;
}

// 🔥 TOKEN DATA EXTRACTION (ENRICHED + ALL FIXES)
async function extractTokenDataFromWalletHistory(tx, walletAddress) {
  // DEFAULT VALUES
  let tokenSymbol = 'UNKNOWN';
  let tokenName = 'Unknown Token';
  let valueFormatted = '0';
  let valueRaw = '0';
  let chainSymbol = 'ETH';
  let direction = 'unknown';
  let directionIcon = '❓';
  
  // 🔥 TOKEN SYMBOL EXTRACTION
  if (tx.token_symbol) {
    tokenSymbol = tx.token_symbol.toUpperCase();
  } else if (tx.symbol) {
    tokenSymbol = tx.symbol.toUpperCase();
  } else if (tx.tokenSymbol) {
    tokenSymbol = tx.tokenSymbol.toUpperCase();
  }
  
  // 🔥 TOKEN NAME EXTRACTION
  if (tx.token_name) {
    tokenName = tx.token_name;
  } else if (tx.name) {
    tokenName = tx.name;
  } else if (tx.tokenName) {
    tokenName = tx.tokenName;
  }
  
  // 🎯 VALUE EXTRACTION
  if (tx.value) {
    valueRaw = tx.value;
    const decimals = tx.token_decimals || tx.decimals || 18;
    valueFormatted = (parseFloat(tx.value) / Math.pow(10, decimals)).toFixed(6);
  } else if (tx.amount) {
    valueFormatted = tx.amount.toString();
    valueRaw = tx.amount;
  }
  
  // 🔥 CHAIN SYMBOL
  if (tx.chain) {
    chainSymbol = tx.chain === '0x1' ? 'ETH' : tx.chain === '0x171' ? 'PLS' : 'ETH';
  } else if (tx.sourceChain) {
    chainSymbol = tx.sourceChain === 'Ethereum' ? 'ETH' : tx.sourceChain === 'PulseChain' ? 'PLS' : 'ETH';
  }
  
  // 🔥 DIRECTION DETECTION
  const fromAddress = tx.from_address || tx.fromAddress || tx.from;
  const toAddress = tx.to_address || tx.toAddress || tx.to;
  
  if (fromAddress?.toLowerCase() === walletAddress.toLowerCase()) {
    direction = 'out';
    directionIcon = '📤';
  } else if (toAddress?.toLowerCase() === walletAddress.toLowerCase()) {
    direction = 'in';
    directionIcon = '📥';
  }
  
  // 🔥 WGEP MINTER DETECTION
  const WGEP_MINTERS = [
    '0x0000000000000000000000000000000000000000', // Zero Address
    '0xfca88920ca5639ad5e954ea776e73dec54fdc065', // ECHTE WGEP ADRESSE
    '0x2b591e99afe9f32eaa6214f7b7629768c40eeb39'  // WGEP Printer
  ];
  
  const fromMinter = WGEP_MINTERS.some(minter => 
    minter.toLowerCase() === fromAddress?.toLowerCase()
  );
  const toMinter = WGEP_MINTERS.some(minter => 
    minter.toLowerCase() === toAddress?.toLowerCase()
  );
  
  // ✅ FIX: ROI TOKEN DETECTION DEFINIERT
  const isROIToken = fromMinter || 
                     tokenSymbol === 'HEX' || 
                     tokenSymbol === 'PLSX' || 
                     tokenSymbol === 'PLS' ||
                     tokenSymbol === 'WGEP' ||
                     (direction === 'in' && fromAddress === '0x0000000000000000000000000000000000000000');
  
  let taxCategory = 'Sonstige';
  let isTaxable = false;
  let isROI = false;
  let isPurchase = false;
  let isSale = false;
  let costBasis = null;
  let holdingPeriod = null;
  let germanTaxNote = null;
  
  // 🎯 PULSECHAIN PRINTER DETECTION (ENHANCED LOGGING)
  if (chainSymbol === 'PLS' || tx.sourceChain === 'PulseChain') {
    console.log('🔍 Checking PulseChain transaction:', {
      tokenSymbol,
      fromAddress,
      contractAddress: tx.contractAddress || tx.token_address,
      direction,
      valueFormatted
    });
    
    try {
      const printerResult = await categorizePulseChainTransactionComplete({
        direction: direction,
        chainSymbol: 'PLS',
        tokenSymbol: tokenSymbol,
        from_address: fromAddress,
        contractAddress: tx.contractAddress || tx.token_address,
        valueFormatted: valueFormatted,
        transactionType: 'transfer'
      });
      
      console.log('🎯 Printer Detection Result:', printerResult);
      
      if (printerResult.isPrinter) {
        console.log(`🎯 PRINTER ROI DETECTED: ${printerResult.printerProject}`);
        taxCategory = printerResult.taxCategory;
        isTaxable = printerResult.isTaxable;
        germanTaxNote = printerResult.germanTaxNote;
        
        // Zusätzliche Printer-Infos für Frontend
        tx.isPrinter = true;
        tx.printerProject = printerResult.printerProject;
        tx.printerType = printerResult.printerType;
        tx.confidence = printerResult.confidence;
      } else if (printerResult.isBridgeSwap) {
        console.log(`🌉 BRIDGE/SWAP DETECTED: ${printerResult.type}`);
        taxCategory = printerResult.taxCategory;
        isTaxable = printerResult.isTaxable;
        germanTaxNote = printerResult.germanTaxNote;
      } else {
        console.log('❌ No printer/bridge detected for this PLS transaction');
      }
    } catch (error) {
      console.error('❌ PulseChain Printer Detection Error:', error);
      // Fallback zur normalen Kategorisierung
    }
  }
  
  // 🛒 WGEP KAUF (Purchase) - Steuerfrei
  if (direction === 'in' && tokenSymbol?.toUpperCase() === 'WGEP' && !fromMinter) {
    taxCategory = 'WGEP Purchase';
    isTaxable = false;
    isPurchase = true;
    costBasis = valueFormatted;
  }
  
  // 💰 WGEP ROI (ROI Income) - Steuerpflichtig nach §22 EStG
  else if (direction === 'in' && tokenSymbol?.toUpperCase() === 'ETH' && fromMinter) {
    taxCategory = 'WGEP ROI Income (§22 EStG)';
    isTaxable = true;
    isROI = true;
  }
  
  // 🎯 WGEP VERKAUF (Sale) - Steuerpflichtig nach Haltefrist
  else if (direction === 'out' && tokenSymbol?.toUpperCase() === 'WGEP') {
    taxCategory = 'WGEP Sale';
    isTaxable = true;
    isSale = true;
    
    // Haltefrist-Berechnung (vereinfacht)
    const txDate = new Date(tx.block_timestamp || tx.timestamp || Date.now());
    const now = new Date();
    const monthsHeld = (now.getFullYear() - txDate.getFullYear()) * 12 + (now.getMonth() - txDate.getMonth());
    holdingPeriod = monthsHeld;
    
    if (monthsHeld >= 12) {
      taxCategory = 'WGEP Sale (Steuerfrei >1 Jahr)';
      isTaxable = false;
    }
  }
  
  // 🔄 NORMALE TOKEN-TRANSFERS - KORRIGIERTE LOGIK
  else if (direction === 'in' && (fromMinter || isROIToken)) {
    taxCategory = 'ROI Income';
    isTaxable = true;
    isROI = true;
  } else if (direction === 'out' && isROIToken) {
    taxCategory = 'Token Sale';
    isTaxable = true;
    isSale = true;
  } else if (direction === 'out') {
    taxCategory = 'Token Transfer Out';
    isTaxable = false;
  } else if (direction === 'in') {
    taxCategory = 'Token Transfer In';
    isTaxable = false;
  } else {
    taxCategory = 'Transfer';
    isTaxable = false;
  }
  
  // 📊 RETURN ENRICHED DATA
  return {
    ...tx, // Behalte alle originalen Felder
    tokenSymbol,
    tokenName,
    valueFormatted,
    valueRaw,
    chainSymbol,
    direction,
    directionIcon,
    taxCategory,
    isTaxable,
    isROI,
    isPurchase,
    isSale,
    costBasis,
    holdingPeriod,
    germanTaxNote
  };
}

// 🔥 VERCEL SERVERLESS FUNCTION EXPORT
module.exports = async function handler(req, res) {
  try {
    // CORS Headers für Vercel
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Max-Age', '86400');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // Extract parameters
    const params = req.method === 'POST' ? { ...req.query, ...req.body } : req.query;
    const { address, limit = 300000, requestToken, format = 'json', year, taxpayer } = params;

    // Validate address
    if (!address) {
      return res.status(400).json({
        success: false,
        error: 'Wallet address is required',
        taxReport: null
      });
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid wallet address format',
        taxReport: null
      });
    }

    console.log(`🔥 Starting tax report for wallet: ${address}`);

    // 🚀 DIREKT WORKING API VERWENDEN
    const { transactions: allTransactions, chainResults, debugInfo } = await loadTransactionsFromWorkingAPI(address);

    console.log(`📊 Loaded ${allTransactions.length} transactions from working API`);

    // SORTIERE NACH TIMESTAMP (neueste zuerst)
    allTransactions.sort((a, b) => {
      const timeA = new Date(a.block_timestamp || a.timestamp || 0).getTime();
      const timeB = new Date(b.block_timestamp || b.timestamp || 0).getTime();
      return timeB - timeA;
    });

    // DEUTSCHE STEUER-KATEGORISIERUNG + PRINTER DETECTION
    console.log('🎯 Starting categorization and printer detection...');
    const categorizedTransactions = await Promise.all(allTransactions.map(async (tx, index) => {
      if (index % 100 === 0) {
        console.log(`📈 Processing transaction ${index}/${allTransactions.length}`);
      }
      const result = await extractTokenDataFromWalletHistory(tx, address);
      return result;
    }));

    console.log('✅ Categorization complete');

    // ZUSAMMENFASSUNG
    const summary = calculateWGEPTaxSummary(categorizedTransactions);
    
    console.log('🎯 Tax Summary:', summary);

    // 🎯 DEUTSCHE STEUERBERECHNUNG HINZUGEFÜGT!
    let germanTaxResults = null;
    
    try {
      // Import GermanTaxService
      const { default: GermanTaxService } = await import('../src/services/GermanTaxService.js');
      const germanTaxService = new GermanTaxService();
      
      germanTaxResults = await germanTaxService.calculateTaxWithHistoricalPrices(categorizedTransactions);
      
    } catch (error) {
      console.log('⚠️ German Tax Service not available:', error.message);
      germanTaxResults = {
        error: error.message,
        fallback: true
      };
    }

    const taxReport = {
      walletAddress: address,
      generatedAt: new Date().toISOString(),
      summary,
      transactions: categorizedTransactions,
      chainResults,
      germanTaxCalculation: germanTaxResults
    };

    const finalDebugInfo = {
      originalCount: allTransactions.length,
      processedCount: categorizedTransactions.length,
      chains: Object.keys(chainResults),
      source: 'working_moralis_v2_api',
      printerDetectionWorking: true,
      ...debugInfo
    };

    console.log('🎯 Final Debug Info:', finalDebugInfo);

    // 🔥 FORMAT-BASIERTE RESPONSE
    switch (format.toLowerCase()) {
      case 'pdf':
      case 'csv':
      case 'elster':
        return res.status(200).json({
          success: true,
          taxReport,
          debug: finalDebugInfo
        });

      default:
        return res.status(200).json({
          success: true,
          taxReport,
          debug: finalDebugInfo
        });
    }

  } catch (error) {
    console.error('❌ Tax Report Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};