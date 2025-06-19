/**
 * 🇩🇪 TAX REPORT API - AGGRESSIVE PAGINATION (300.000+ Transaktionen)
 * 
 * ✅ Direkte Moralis-API-Calls mit aggressiver Pagination
 * ✅ Bis zu 300.000 Transaktionen pro Wallet
 * ✅ Automatische Cursor-basierte Requests
 * ✅ Deutsche Steuer-Kategorisierung
 */

// 🔥 DIREKTE MORALIS-API-FUNKTION (exakt wie moralis-v2.js)
async function moralisFetch(endpoint, params = {}) {
  const MORALIS_API_KEY = process.env.MORALIS_API_KEY;
  
  if (!MORALIS_API_KEY) {
    console.error('❌ MORALIS_API_KEY nicht gefunden!');
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
    console.log(`🚀 MORALIS API CALL: ${url.toString()}`);
    
    const response = await fetch(url.toString(), {
      headers: {
        'X-API-Key': MORALIS_API_KEY,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      console.error(`❌ MORALIS API ERROR: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    console.log(`✅ MORALIS API SUCCESS: ${endpoint}`);
    return data;
    
  } catch (error) {
    console.error(`💥 MORALIS API FETCH ERROR: ${error.message}`);
    return null;
  }
}

// 🔥 CHUNKED PAGINATION FUNKTION (Serverless-Timeout-Fix)
async function fetchAllTransfers(address, chainName, maxTransactions = 300000) {
  console.log(`🔥 CHUNKED PAGINATION: ${address} auf ${chainName} - Ziel: ${maxTransactions} Transaktionen`);
  
  let allTransfers = [];
  let cursor = null;
  let pageCount = 0;
  const maxPages = Math.ceil(maxTransactions / 100); // 100 pro Seite
  const maxTimeSeconds = 45; // 🔥 DRAMATISCH ERHÖHT: 45 Sekunden für 300.000 Transaktionen!
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
  
  while (allTransfers.length < maxTransactions && pageCount < maxPages) {
    // 🔥 KRITISCH: Timeout-Check
    const timeElapsed = (Date.now() - startTime) / 1000;
    debugInfo.timeElapsed = timeElapsed;
    
    if (timeElapsed >= maxTimeSeconds) {
      console.log(`⏰ TIMEOUT REACHED: ${timeElapsed.toFixed(1)}s - Serverless-Limit erreicht`);
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
      
      console.log(`📄 Seite ${pageCount}: Lade ${allTransfers.length + 100} von ${maxTransactions}... (${timeElapsed.toFixed(1)}s)`);
      
      const result = await moralisFetch(`${address}/erc20/transfers`, params);
      
      if (!result || !result.result) {
        console.log(`⚠️ Keine weiteren Daten für ${chainName} - Seite ${pageCount}`);
        debugInfo.stopReason = 'No result or result.result';
        debugInfo.errors.push(`Page ${pageCount}: No result`);
        break;
      }
      
      const transfers = result.result;
      allTransfers.push(...transfers);
      debugInfo.totalTransfers = allTransfers.length;
      
      console.log(`✅ Seite ${pageCount}: ${transfers.length} Transfers geladen (Total: ${allTransfers.length}) in ${timeElapsed.toFixed(1)}s`);
      
      // Prüfe ob es weitere Seiten gibt
      if (!result.cursor || transfers.length < 100) {
        console.log(`🏁 Keine weiteren Seiten für ${chainName} - Ende erreicht`);
        const reason = !result.cursor ? 'Kein Cursor' : 'Weniger als 100 Transfers';
        debugInfo.stopReason = reason;
        break;
      }
      
      cursor = result.cursor;
      
      // 🔥 AGGRESSIVES RATE LIMITING: Minimale Pausen
      if (pageCount % 5 === 0) { // Pause nach 5 Seiten
        console.log(`⏳ Rate Limiting: Pause nach ${pageCount} Seiten...`);
        await new Promise(resolve => setTimeout(resolve, 100)); // Nur 100ms Pause
      }
      
    } catch (error) {
      console.error(`❌ Fehler bei Seite ${pageCount} für ${chainName}:`, error.message);
      debugInfo.stopReason = 'Error';
      debugInfo.errors.push(`Page ${pageCount}: ${error.message}`);
      break;
    }
  }
  
  const finalTime = (Date.now() - startTime) / 1000;
  console.log(`🎯 ${chainName} CHUNKED PAGINATION COMPLETE: ${allTransfers.length} Transfers in ${pageCount} Seiten in ${finalTime.toFixed(1)}s`);
  console.log(`🔍 DEBUG: Finale Analyse - Max Pages: ${maxPages}, Geladen: ${allTransfers.length}, Ziel: ${maxTransactions}, Zeit: ${finalTime.toFixed(1)}s`);
  
  return { transfers: allTransfers, debugInfo };
}

export default async function handler(req, res) {
  console.log('🔥🔥🔥 TAX REPORT - AGGRESSIVE PAGINATION (300.000+)! 🔥🔥🔥');
  
  try {
    // CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // Extract parameters
    const params = req.method === 'POST' ? { ...req.query, ...req.body } : req.query;
    const { address, limit = 300000 } = params; // 🔥 DEFAULT: 300.000!

    console.log('🇩🇪 TAX PARAMS:', { 
      address: address ? address.slice(0, 8) + '...' : 'MISSING', 
      limit: `${limit.toLocaleString()} Transaktionen`
    });

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

    console.log(`🔍 Processing wallet: ${address.slice(0, 8)}...`);

    // KORREKTE CHAIN IDs - EXAKT WIE MORALIS-V2
    const chains = [
      { id: '0x1', name: 'Ethereum', short: 'ETH', moralisName: 'eth', moralisId: '0x1' },
      { id: '0x171', name: 'PulseChain', short: 'PLS', moralisName: 'pulsechain', moralisId: '0x171' }
    ];

    let allTransactions = [];
    let chainResults = {};
    let allDebugInfo = {};

    // PARALLEL PROCESSING - AGGRESSIVE PAGINATION
    const chainPromises = chains.map(async (chain) => {
      console.log(`🚀 Processing ${chain.name} (${chain.id})...`);
      
      try {
        // 🔥 AGGRESSIVE PAGINATION: Bis zu 300.000 Transfers pro Chain
        // 🔧 FIX: Verwende Chain-ID statt Chain-Name für Moralis API
        const { transfers, debugInfo } = await fetchAllTransfers(address, chain.moralisId, limit);
        
        console.log(`✅ ${chain.name}: ${transfers.length} transfers loaded via AGGRESSIVE PAGINATION`);
        
        chainResults[chain.short] = {
          count: transfers.length,
          transactions: transfers
        };
        
        allDebugInfo[chain.short] = debugInfo;
        
        // Add chain info to transactions
        const processedTransactions = transfers.map(tx => ({
          ...tx,
          sourceChain: chain.name,
          sourceChainShort: chain.short,
          sourceChainId: chain.id,
          // Add direction info
          direction: tx.to_address?.toLowerCase() === address.toLowerCase() ? 'in' : 'out',
          directionIcon: tx.to_address?.toLowerCase() === address.toLowerCase() ? '📥 IN' : '📤 OUT',
          // Add tax category
          taxCategory: tx.to_address?.toLowerCase() === address.toLowerCase() ? 'Token Transfer (In)' : 'Token Transfer (Out)',
          // Add formatted value
          formattedValue: tx.value_decimal || '0',
          tokenSymbol: tx.token_symbol || 'UNKNOWN'
        }));
        
        allTransactions.push(...processedTransactions);
        
        console.log(`✅ ${chain.name}: ${transfers.length} transactions processed`);
        
      } catch (error) {
        console.error(`❌ ${chain.name} processing failed:`, error.message);
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

    console.log(`📊 TOTAL TRANSACTIONS: ${allTransactions.length.toLocaleString()}`);
    console.log(`📊 CHAIN BREAKDOWN:`, chainResults);

    // SORTIERE NACH TIMESTAMP (neueste zuerst)
    allTransactions.sort((a, b) => {
      const timeA = new Date(a.block_timestamp || a.timestamp || 0).getTime();
      const timeB = new Date(b.block_timestamp || b.timestamp || 0).getTime();
      return timeB - timeA;
    });

    // DEUTSCHE STEUER-KATEGORISIERUNG
    const categorizedTransactions = allTransactions.map(tx => {
      let taxCategory = tx.taxCategory || 'Sonstige';
      let direction = tx.direction || 'unknown';
      let directionIcon = tx.directionIcon || '❓';
      let formattedValue = tx.formattedValue || '0';
      let tokenSymbol = tx.tokenSymbol || 'N/A';

      // ROI DETECTION für bekannte Tokens
      if (['WGEP', 'MASKMAN', 'BORK'].includes(tokenSymbol)) {
        if (direction === 'in') {
          taxCategory = 'ROI Einkommen (§22 EStG)';
          directionIcon = '💰 ROI';
        }
      }

      return {
        ...tx,
        taxCategory,
        direction,
        directionIcon,
        formattedValue,
        tokenSymbol,
        timestamp: tx.block_timestamp || tx.timestamp
      };
    });

    // ZUSAMMENFASSUNG
    const summary = {
      totalTransactions: categorizedTransactions.length,
      ethereumCount: chainResults.ETH?.count || 0,
      pulsechainCount: chainResults.PLS?.count || 0,
      roiCount: categorizedTransactions.filter(tx => tx.taxCategory.includes('ROI')).length,
      totalROIValueEUR: 0,
      totalTaxEUR: 0
    };

    const taxReport = {
      walletAddress: address,
      generatedAt: new Date().toISOString(),
      summary,
      transactions: categorizedTransactions,
      chainResults
    };

    console.log(`✅ TAX REPORT GENERATED: ${categorizedTransactions.length.toLocaleString()} transactions`);
    console.log(`📊 SUMMARY:`, summary);

    return res.status(200).json({
      success: true,
      taxReport,
      debug: {
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
      }
    });

  } catch (error) {
    console.error('💥 TAX API ERROR:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}