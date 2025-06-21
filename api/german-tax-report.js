/**
 * 🇩🇪 TAX REPORT API - AGGRESSIVE PAGINATION (300.000+ Transaktionen)
 * 
 * ✅ Direkte Moralis-API-Calls mit aggressiver Pagination
 * ✅ Bis zu 300.000 Transaktionen pro Wallet
 * ✅ Automatische Cursor-basierte Requests
 * ✅ Deutsche Steuer-Kategorisierung
 * 🚀 VERCEL SERVERLESS FUNCTION - Kompatibel mit Vercel Deployment
 */

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

// 🔥 CHUNKED PAGINATION FUNKTION (Serverless-Timeout-Fix) - ERWEITERT FÜR NATIVE + ERC20
async function fetchAllTransfers(address, chainName, maxTransactions = 300000) {
  let allTransfers = [];
  let cursor = null;
  let pageCount = 0;
  const maxPages = Math.ceil(maxTransactions / 100); // 100 pro Seite
  const maxTimeSeconds = 60; // 🔥 ERHÖHT: 60 Sekunden für 300.000 Transaktionen!
  const startTime = Date.now();
  
  let debugInfo = {
    chainName,
    maxTransactions,
    maxPages,
    pagesProcessed: 0,
    totalTransfers: 0,
    stopReason: null,
    cursorHistory: [],
    errors: [],
    timeElapsed: 0,
    timeLimit: maxTimeSeconds
  };
  
  // 🔥 LADE WALLET HISTORY (RICHTIGER ENDPUNKT)
  while (allTransfers.length < maxTransactions && pageCount < maxPages) {
    // 🔥 KRITISCH: Timeout-Check
    const timeElapsed = (Date.now() - startTime) / 1000;
    debugInfo.timeElapsed = timeElapsed;
    
    if (timeElapsed >= maxTimeSeconds) {
      debugInfo.stopReason = `Timeout nach ${timeElapsed.toFixed(1)}s`;
      break;
    }
    
    pageCount++;
    debugInfo.pagesProcessed = pageCount;
    
    try {
      const params = {
        chain: chainName,
        limit: 100 // Maximum pro Request
      };
      
      if (cursor) {
        params.cursor = cursor;
        debugInfo.cursorHistory.push(cursor.slice(0, 20) + '...');
      }
        
      // 🔥 RICHTIGER ENDPUNKT: /wallets/{address}/history
      const result = await moralisFetch(`wallets/${address}/history`, params);
      
      if (!result || !result.result) {
        debugInfo.stopReason = 'No result or result.result';
        debugInfo.errors.push(`Page ${pageCount}: No result`);
        break;
      }
      
      const transactions = result.result;
      allTransfers.push(...transactions);
      debugInfo.totalTransfers = allTransfers.length;
      
      // 🔥 VERBESSERTE CURSOR-LOGIK: Prüfe ob es weitere Seiten gibt
      if (!result.cursor || result.cursor === cursor || transactions.length < 100) {
        const reason = !result.cursor ? 'Kein Cursor' : result.cursor === cursor ? 'Cursor unverändert' : 'Weniger als 100 Transfers';
        debugInfo.stopReason = reason;
        break;
      }
      
      cursor = result.cursor;
      
      // 🔥 AGGRESSIVES RATE LIMITING: Minimale Pausen
      if (pageCount % 3 === 0) { // Pause nach 3 Seiten
        await new Promise(resolve => setTimeout(resolve, 50)); // Nur 50ms Pause
      }
      
    } catch (error) {
      debugInfo.stopReason = 'Error';
      debugInfo.errors.push(`Page ${pageCount}: ${error.message}`);
      break;
    }
  }
  
  const finalTime = (Date.now() - startTime) / 1000;
  
  return { transfers: allTransfers, debugInfo };
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
    if (tx.chainSymbol === 'ETH') summary.ethereumCount++;
    if (tx.chainSymbol === 'PLS') summary.pulsechainCount++;
    
    // Taxable counting - KORRIGIERTE LOGIK
    if (tx.taxCategory === 'ROI Income' ||
        tx.taxCategory === 'WGEP ROI Income (§22 EStG)' ||
        tx.taxCategory === 'Token Sale' ||
        tx.taxCategory === 'WGEP Sale') {
      summary.taxableCount++;
    }
    
    // ROI counting - KORRIGIERTE LOGIK
    if (tx.taxCategory && (tx.taxCategory.includes('ROI') || tx.taxCategory === 'Token Sale')) {
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
  summary.totalROIValueEUR = summary.totalROIValueEUR.toFixed(2);
  summary.totalTaxEUR = (summary.totalROIValueEUR * 0.30).toFixed(2); // 30% grobe Schätzung
  
  return summary;
}

/**
 * 🔧 KORREKTE TOKEN-EXTRAKTION für Moralis Wallet History API
 */
function extractTokenDataFromWalletHistory(tx, walletAddress) {
  // DEFAULT VALUES
  let tokenSymbol = 'UNKNOWN';
  let tokenName = 'Unknown Token';
  let valueFormatted = '0';
  let valueRaw = '0';
  let direction = 'unknown';
  let directionIcon = '❓';
  let chainSymbol = 'UNK';
  
  // CHAIN DETECTION basierend auf tx oder chain parameter
  if (tx.sourceChain === 'Ethereum' || tx.chain === '0x1' || !tx.sourceChain) {
    chainSymbol = 'ETH'; // ← Falls sourceChain undefined ist
  } else if (tx.sourceChain === 'PulseChain' || tx.chain === '0x171') {
    chainSymbol = 'PLS';
  }
  
  const walletLower = walletAddress.toLowerCase();
  
  // 🪙 ERC20 TRANSFERS (WICHTIGSTER TEIL)
  if (tx.erc20_transfers && tx.erc20_transfers.length > 0) {
    // Nimm den ersten/hauptsächlichen ERC20 Transfer
    const transfer = tx.erc20_transfers[0];
    
    // KORREKTE FELDNAMEN (aus der Moralis API Dokumentation)
    tokenSymbol = transfer.token_symbol || 'UNKNOWN';
    tokenName = transfer.token_name || 'Unknown Token';
    
    // ✅ RICHTIG - Moralis vertrauen (liefert bereits korrekte Werte!)
    valueFormatted = transfer.value_formatted || '0';
    
    valueRaw = transfer.value || '0';
    
    // DIRECTION basierend auf from/to addresses
    const fromAddress = transfer.from_address?.toLowerCase();
    const toAddress = transfer.to_address?.toLowerCase();
    
    if (toAddress === walletLower && fromAddress !== walletLower) {
      direction = 'in';
      directionIcon = '📥';
    } else if (fromAddress === walletLower && toAddress !== walletLower) {
      direction = 'out';
      directionIcon = '📤';
    } else {
      direction = 'transfer';
      directionIcon = '🔄';
    }
  }
  
  // ⛽ NATIVE TRANSFERS (ETH, PLS)
  else if (tx.native_transfers && tx.native_transfers.length > 0) {
    const transfer = tx.native_transfers[0];
    
    // Native Token Symbole
    tokenSymbol = transfer.token_symbol || chainSymbol || 'NATIVE';
    tokenName = transfer.token_name || (chainSymbol === 'ETH' ? 'Ethereum' : 'PulseChain');
    
    // ✅ RICHTIG - Moralis vertrauen (liefert bereits korrekte Werte!)
    valueFormatted = transfer.value_formatted || '0';
    
    valueRaw = transfer.value || '0';
    
    // DIRECTION für Native Transfers
    const fromAddress = transfer.from_address?.toLowerCase();
    const toAddress = transfer.to_address?.toLowerCase();
    
    if (toAddress === walletLower && fromAddress !== walletLower) {
      direction = 'in';
      directionIcon = '📥';
    } else if (fromAddress === walletLower && toAddress !== walletLower) {
      direction = 'out';
      directionIcon = '📤';
    } else {
      direction = 'transfer';
      directionIcon = '🔄';
    }
  }
  
  // 📄 FALLBACK für Transaktionen ohne Transfers
  else {
    // Transaction-level direction detection
    const fromAddress = tx.from_address?.toLowerCase();
    const toAddress = tx.to_address?.toLowerCase();
    
    if (toAddress === walletLower && fromAddress !== walletLower) {
      direction = 'in';
      directionIcon = '📥';
    } else if (fromAddress === walletLower && toAddress !== walletLower) {
      direction = 'out';
      directionIcon = '📤';
    } else {
      direction = 'unknown';
      directionIcon = '❓';
    }
    
    // Für Contract Interactions oder andere Transaktionen
    tokenSymbol = chainSymbol;
    tokenName = chainSymbol === 'ETH' ? 'Ethereum' : 'PulseChain';
    valueFormatted = tx.value_formatted || '0';
    valueRaw = tx.value || '0';
  }
  
  // 🏷️ DEUTSCHE STEUER-KATEGORISIERUNG MIT WGEP-SPEZIFIK
  const ROI_TOKENS = ['HEX', 'INC', 'PLSX', 'LOAN', 'FLEX', 'WGEP', 'MISOR', 'PLS'];
  const isROIToken = ROI_TOKENS.includes(tokenSymbol?.toUpperCase());
  
  // WGEP-spezifische Minter-Adressen
  const WGEP_MINTERS = [
    '0x0000000000000000000000000000000000000000', // Zero Address
    '0xfca88920ca5639ad5e954ea776e73dec54fdc065', // ECHTE WGEP ADRESSE
    '0x2b591e99afe9f32eaa6214f7b7629768c40eeb39'  // WGEP Printer
  ];
  
  const fromMinter = WGEP_MINTERS.includes(tx.from_address?.toLowerCase());
  const toMinter = WGEP_MINTERS.includes(tx.to_address?.toLowerCase());
  
  let taxCategory = 'Sonstige';
  let isTaxable = false;
  let isROI = false;
  let isPurchase = false;
  let isSale = false;
  let costBasis = null;
  let holdingPeriod = null;
  
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
  
  // 📤 WGEP VERKAUF (Sale) - Steuerpflichtig nach Haltefrist
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
    holdingPeriod
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

    // KORREKTE CHAIN IDs - EXAKT WIE MORALIS-V2
    const chains = [
      { id: '0x1', name: 'Ethereum', short: 'ETH', moralisName: '0x1', moralisId: '0x1' },
      { id: '0x171', name: 'PulseChain', short: 'PLS', moralisName: '0x171', moralisId: '0x171' }
    ];

    let allTransactions = [];
    let chainResults = {};
    let allDebugInfo = {};

    // PARALLEL PROCESSING - AGGRESSIVE PAGINATION
    const chainPromises = chains.map(async (chain) => {
      try {
        // 🔥 AGGRESSIVE PAGINATION: Bis zu 300.000 Transfers pro Chain
        const { transfers, debugInfo } = await fetchAllTransfers(address, chain.moralisId, limit);
        
        chainResults[chain.short] = {
          count: transfers.length,
          transactions: transfers
        };
        
        allDebugInfo[chain.short] = debugInfo;
        
        // Add chain info to transactions
        const processedTransactions = transfers.map(tx => {
          tx.sourceChain = chain.name;
          tx.chain = chain.id;
          return extractTokenDataFromWalletHistory(tx, address);
        });
        
        allTransactions.push(...processedTransactions);
        
      } catch (error) {
        chainResults[chain.short] = {
          count: 0,
          transactions: [],
          error: error.message
        };
        allDebugInfo[chain.short] = {
          chainName: chain.moralisId,
          error: error.message
        };
      }
    });

    // WARTE AUF ALLE CHAINS
    await Promise.all(chainPromises);

    // SORTIERE NACH TIMESTAMP (neueste zuerst)
    allTransactions.sort((a, b) => {
      const timeA = new Date(a.block_timestamp || a.timestamp || 0).getTime();
      const timeB = new Date(b.block_timestamp || b.timestamp || 0).getTime();
      return timeB - timeA;
    });

    // DEUTSCHE STEUER-KATEGORISIERUNG
    const categorizedTransactions = allTransactions.map((tx, index) => {
      const result = extractTokenDataFromWalletHistory(tx, address);
      return result;
    });

    // ZUSAMMENFASSUNG
    const summary = calculateWGEPTaxSummary(categorizedTransactions);

    // 🔥 DEUTSCHE STEUERBERECHNUNG HINZUGEFÜGT!
    let germanTaxResults = null;
    
    try {
      // Import GermanTaxService
      const { default: GermanTaxService } = await import('../src/services/GermanTaxService.js');
      const germanTaxService = new GermanTaxService();
      
      germanTaxResults = await germanTaxService.calculateTaxWithHistoricalPrices(categorizedTransactions);
      
    } catch (error) {
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

    // 🔥 CACHE DIE ERGEBNISSE FÜR DEDUPLICATION
    const debugInfo = {
      originalCount: allTransactions.length,
      processedCount: categorizedTransactions.length,
      chains: Object.keys(chainResults),
      source: 'aggressive_pagination_300k',
      paginationInfo: {
        maxTransactions: limit,
        totalLoaded: allTransactions.length,
        ethereumLoaded: chainResults.ETH?.count || 0,
        pulsechainLoaded: chainResults.PLS?.count || 0
      },
      debugInfo: allDebugInfo
    };

    // 🔥 FORMAT-BASIERTE RESPONSE
    switch (format.toLowerCase()) {
      case 'pdf':
      case 'csv':
      case 'elster':
        return res.status(200).json({
          success: true,
          taxReport,
          debug: debugInfo
        });

      default:
        return res.status(200).json({
          success: true,
          taxReport,
          debug: debugInfo
        });
    }

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};