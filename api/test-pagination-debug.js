/**
 * 🔍 PAGINATION DEBUG TEST API
 * 
 * Testet nur die Pagination für eine Wallet und gibt detaillierte Debug-Info zurück
 */

// 🔥 DIREKTE MORALIS-API-FUNKTION
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

export default async function handler(req, res) {
  console.log('🔍 PAGINATION DEBUG TEST API');
  
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
    const { address, chain = '0x171' } = params; // Default: PulseChain

    console.log('🔍 DEBUG PARAMS:', { 
      address: address ? address.slice(0, 8) + '...' : 'MISSING', 
      chain
    });

    // Validate address
    if (!address) {
      return res.status(400).json({
        success: false,
        error: 'Wallet address is required'
      });
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid wallet address format'
      });
    }

    console.log(`🔍 Testing pagination for: ${address.slice(0, 8)}... on chain ${chain}`);

    let allTransfers = [];
    let cursor = null;
    let pageCount = 0;
    const maxPages = 50; // Test bis zu 50 Seiten
    const maxTimeSeconds = 8;
    const startTime = Date.now();
    
    let debugInfo = {
      address: address.slice(0, 8) + '...',
      chain,
      maxPages,
      pagesProcessed: 0,
      totalTransfers: 0,
      stopReason: null,
      cursorHistory: [],
      errors: [],
      timeElapsed: 0,
      timeLimit: maxTimeSeconds,
      pageDetails: []
    };
    
    while (pageCount < maxPages) {
      // Timeout-Check
      const timeElapsed = (Date.now() - startTime) / 1000;
      debugInfo.timeElapsed = timeElapsed;
      
      if (timeElapsed >= maxTimeSeconds) {
        console.log(`⏰ TIMEOUT REACHED: ${timeElapsed.toFixed(1)}s`);
        debugInfo.stopReason = `Timeout nach ${timeElapsed.toFixed(1)}s`;
        break;
      }
      
      pageCount++;
      debugInfo.pagesProcessed = pageCount;
      
      try {
        const params = {
          chain: chain,
          limit: 100
        };
        
        if (cursor) {
          params.cursor = cursor;
          debugInfo.cursorHistory.push(cursor.slice(0, 20) + '...');
        }
        
        console.log(`📄 Seite ${pageCount}: Lade... (${timeElapsed.toFixed(1)}s)`);
        
        const result = await moralisFetch(`${address}/erc20/transfers`, params);
        
        if (!result || !result.result) {
          console.log(`⚠️ Keine weiteren Daten - Seite ${pageCount}`);
          debugInfo.stopReason = 'No result or result.result';
          debugInfo.errors.push(`Page ${pageCount}: No result`);
          break;
        }
        
        const transfers = result.result;
        allTransfers.push(...transfers);
        debugInfo.totalTransfers = allTransfers.length;
        
        // Detaillierte Seiten-Info
        const pageInfo = {
          page: pageCount,
          transfersLoaded: transfers.length,
          totalSoFar: allTransfers.length,
          timeElapsed: timeElapsed.toFixed(1),
          hasCursor: !!result.cursor,
          cursorPreview: result.cursor ? result.cursor.slice(0, 20) + '...' : null
        };
        debugInfo.pageDetails.push(pageInfo);
        
        console.log(`✅ Seite ${pageCount}: ${transfers.length} Transfers (Total: ${allTransfers.length}) in ${timeElapsed.toFixed(1)}s`);
        
        // Prüfe ob es weitere Seiten gibt
        if (!result.cursor || transfers.length < 100) {
          console.log(`🏁 Keine weiteren Seiten - Ende erreicht`);
          const reason = !result.cursor ? 'Kein Cursor' : 'Weniger als 100 Transfers';
          debugInfo.stopReason = reason;
          break;
        }
        
        cursor = result.cursor;
        
        // Minimale Pause
        if (pageCount % 3 === 0) {
          console.log(`⏳ Rate Limiting: Pause nach ${pageCount} Seiten...`);
          await new Promise(resolve => setTimeout(resolve, 200));
        }
        
      } catch (error) {
        console.error(`❌ Fehler bei Seite ${pageCount}:`, error.message);
        debugInfo.stopReason = 'Error';
        debugInfo.errors.push(`Page ${pageCount}: ${error.message}`);
        break;
      }
    }
    
    const finalTime = (Date.now() - startTime) / 1000;
    console.log(`🎯 PAGINATION TEST COMPLETE: ${allTransfers.length} Transfers in ${pageCount} Seiten in ${finalTime.toFixed(1)}s`);
    
    return res.status(200).json({
      success: true,
      debugInfo,
      summary: {
        totalTransfers: allTransfers.length,
        pagesProcessed: pageCount,
        timeElapsed: finalTime.toFixed(1),
        stopReason: debugInfo.stopReason
      }
    });

  } catch (error) {
    console.error('💥 DEBUG API ERROR:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
} 