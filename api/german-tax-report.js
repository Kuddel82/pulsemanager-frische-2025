/**
 * 🇩🇪 TAX REPORT API - AGGRESSIVE PAGINATION (300.000+ Transaktionen)
 * 
 * ✅ Direkte Moralis-API-Calls mit aggressiver Pagination
 * ✅ Bis zu 300.000 Transaktionen pro Wallet
 * ✅ Automatische Cursor-basierte Requests
 * ✅ Deutsche Steuer-Kategorisierung
 * 🔥 REQUEST DEDUPLICATION - Verhindert mehrfache identische Requests
 */

// 🔥 REQUEST DEDUPLICATION CACHE
const requestCache = new Map();
const CACHE_DURATION = 10000; // 10 Sekunden

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

// 🔥 CHUNKED PAGINATION FUNKTION (Serverless-Timeout-Fix) - ERWEITERT FÜR NATIVE + ERC20
async function fetchAllTransfers(address, chainName, maxTransactions = 300000) {
  console.log(`🔥 CHUNKED PAGINATION: ${address} auf ${chainName} - Ziel: ${maxTransactions} Transaktionen (Wallet History)`);
  
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
  console.log(`📋 Lade Wallet History für ${chainName}...`);
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
      
      // 🔥 RICHTIGER ENDPUNKT: /wallets/{address}/history
      const result = await moralisFetch(`wallets/${address}/history`, params);
      
      if (!result || !result.result) {
        console.log(`⚠️ Keine weiteren Wallet History Daten für ${chainName} - Seite ${pageCount}`);
        debugInfo.stopReason = 'No result or result.result';
        debugInfo.errors.push(`Page ${pageCount}: No result`);
        break;
      }
      
      const transactions = result.result;
      allTransfers.push(...transactions);
      debugInfo.totalTransfers = allTransfers.length;
      
      console.log(`✅ Seite ${pageCount}: ${transactions.length} Wallet History Transaktionen geladen (Total: ${allTransfers.length}) in ${timeElapsed.toFixed(1)}s`);
      
      // 🔥 VERBESSERTE CURSOR-LOGIK: Prüfe ob es weitere Seiten gibt
      if (!result.cursor || result.cursor === cursor || transactions.length < 100) {
        console.log(`🏁 Keine weiteren Wallet History Seiten für ${chainName} - Ende erreicht`);
        const reason = !result.cursor ? 'Kein Cursor' : result.cursor === cursor ? 'Cursor unverändert' : 'Weniger als 100 Transfers';
        debugInfo.stopReason = reason;
        break;
      }
      
      cursor = result.cursor;
      
      // 🔥 AGGRESSIVES RATE LIMITING: Minimale Pausen
      if (pageCount % 3 === 0) { // Pause nach 3 Seiten
        console.log(`⏳ Rate Limiting: Pause nach ${pageCount} Seiten...`);
        await new Promise(resolve => setTimeout(resolve, 50)); // Nur 50ms Pause
      }
      
    } catch (error) {
      console.error(`❌ Fehler bei Seite ${pageCount} für ${chainName}:`, error.message);
      debugInfo.stopReason = 'Error';
      debugInfo.errors.push(`Page ${pageCount}: ${error.message}`);
      break;
    }
  }
  
  const finalTime = (Date.now() - startTime) / 1000;
  console.log(`🎯 ${chainName} CHUNKED PAGINATION COMPLETE: ${allTransfers.length} Transfers (Wallet History) in ${pageCount} Seiten in ${finalTime.toFixed(1)}s`);
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
    const { address, limit = 300000, requestToken, format = 'json', year, taxpayer } = params; // 🔥 FORMAT PARAMETER

    console.log('🇩🇪 TAX PARAMS:', { 
      address: address ? address.slice(0, 8) + '...' : 'MISSING', 
      limit: `${limit.toLocaleString()} Transaktionen`,
      format: format,
      year: year,
      requestToken: requestToken ? requestToken.toString().slice(-6) : 'NONE'
    });

    // 🔥 REQUEST DEDUPLICATION - Verhindert mehrfache identische Requests
    const requestKey = `${address}-${limit}-${requestToken}`;
    const now = Date.now();
    
    // Prüfe ob identischer Request bereits läuft
    if (requestCache.has(requestKey)) {
      const cached = requestCache.get(requestKey);
      if (now - cached.timestamp < CACHE_DURATION) {
        console.log(`🚫 REQUEST DEDUPLICATION: Identischer Request bereits in Bearbeitung (${requestKey.slice(0, 20)}...)`);
        return res.status(200).json({
          success: true,
          taxReport: cached.data,
          debug: {
            ...cached.debug,
            deduplicated: true,
            originalRequestTime: new Date(cached.timestamp).toISOString()
          }
        });
      } else {
        // Cache abgelaufen, entferne
        requestCache.delete(requestKey);
      }
    }

    // Markiere Request als in Bearbeitung
    requestCache.set(requestKey, {
      timestamp: now,
      data: null,
      debug: null
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
      { id: '0x1', name: 'Ethereum', short: 'ETH', moralisName: '0x1', moralisId: '0x1' },
      { id: '0x171', name: 'PulseChain', short: 'PLS', moralisName: '0x171', moralisId: '0x171' }
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
        const processedTransactions = transfers.map(tx => {
          // 🔥 WALLET HISTORY FORMAT: Extrahiere Token-Info aus verschiedenen Transfer-Typen
          let tokenSymbol = 'UNKNOWN';
          let tokenName = 'Unknown Token';
          let valueDecimal = '0';
          let direction = 'unknown';
          let directionIcon = '❓';
          let taxCategory = 'Sonstige';
          
          // Native Transfers (ETH/PLS) - RICHTIGE EXTRACTION
          if (tx.native_transfers && tx.native_transfers.length > 0) {
            const nativeTransfer = tx.native_transfers[0];
            tokenSymbol = nativeTransfer.token_symbol || (chain.moralisId === '0x1' ? 'ETH' : 'PLS');
            tokenName = nativeTransfer.token_name || (chain.moralisId === '0x1' ? 'Ethereum' : 'PulseChain');
            valueDecimal = (parseFloat(nativeTransfer.value) / Math.pow(10, 18)).toString();
            direction = nativeTransfer.to_address?.toLowerCase() === address.toLowerCase() ? 'in' : 'out';
            directionIcon = direction === 'in' ? '📥 IN' : '📤 OUT';
            taxCategory = direction === 'in' ? 'Token Transfer (In)' : 'Token Transfer (Out)';
          }
          
          // ERC20 Transfers (WGEP, USDC, USDT, etc.) - RICHTIGE EXTRACTION
          if (tx.erc20_transfer && tx.erc20_transfer.length > 0) {
            const erc20Transfer = tx.erc20_transfer[0];
            tokenSymbol = erc20Transfer.token_symbol || 'UNKNOWN';
            tokenName = erc20Transfer.token_name || 'Unknown Token';
            valueDecimal = erc20Transfer.value_decimal || '0';
            direction = erc20Transfer.to_address?.toLowerCase() === address.toLowerCase() ? 'in' : 'out';
            directionIcon = direction === 'in' ? '📥 IN' : '📤 OUT';
            taxCategory = direction === 'in' ? 'Token Transfer (In)' : 'Token Transfer (Out)';
            
            // 🔥 DEBUG: Log Token-Details für WGEP, USDC, USDT
            if (['WGEP', 'USDC', 'USDT'].includes(tokenSymbol)) {
              console.log(`🔍 TOKEN FOUND: ${tokenSymbol} - Value: ${valueDecimal} - Direction: ${direction}`);
            }
          }
          
          // NFT Transfers (falls vorhanden) - RICHTIGE EXTRACTION
          if (tx.nft_transfers && tx.nft_transfers.length > 0) {
            const nftTransfer = tx.nft_transfers[0];
            tokenSymbol = nftTransfer.token_symbol || 'NFT';
            tokenName = nftTransfer.token_name || 'NFT Collection';
            valueDecimal = '1'; // NFTs haben normalerweise Wert 1
            direction = nftTransfer.to_address?.toLowerCase() === address.toLowerCase() ? 'in' : 'out';
            directionIcon = direction === 'in' ? '📥 IN' : '📤 OUT';
            taxCategory = direction === 'in' ? 'NFT Transfer (In)' : 'NFT Transfer (Out)';
          }
          
          // 🔥 ROI DETECTION für bekannte Tokens
          if (['WGEP', 'MASKMAN', 'BORK'].includes(tokenSymbol)) {
            if (direction === 'in') {
              taxCategory = 'ROI Einkommen (§22 EStG)';
              directionIcon = '💰 ROI';
            }
          }
          
          // 🔥 TOKEN SYMBOL MAPPING - KORREKTE ANZEIGE
          if (tokenSymbol === 'WPLS') {
            tokenSymbol = 'PLS'; // Wrapped PLS → PLS
          } else if (tokenSymbol === 'UNKNOWN' && chain.moralisId === '0x1') {
            tokenSymbol = 'ETH'; // UNKNOWN auf ETH → ETH
          } else if (tokenSymbol === 'UNKNOWN' && chain.moralisId === '0x171') {
            tokenSymbol = 'PLS'; // UNKNOWN auf PulseChain → PLS
          }
          
          return {
            ...tx,
            sourceChain: chain.name,
            sourceChainShort: chain.short,
            sourceChainId: chain.id,
            direction,
            directionIcon,
            taxCategory,
            formattedValue: valueDecimal,
            tokenSymbol,
            tokenName,
            timestamp: tx.block_timestamp || tx.timestamp
          };
        });
        
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

    // Update cache mit den finalen Daten
    requestCache.set(requestKey, {
      timestamp: now,
      data: taxReport,
      debug: debugInfo
    });

    // 🔥 FORMAT-BASIERTE RESPONSE
    switch (format.toLowerCase()) {
      case 'pdf':
      case 'csv':
      case 'elster':
        // Für Export-Formate: Standard JSON Response (Frontend generiert HTML/CSV)
        return res.status(200).json({
          success: true,
          taxReport,
          debug: debugInfo
        });

      default:
        // Standard JSON Response
        return res.status(200).json({
          success: true,
          taxReport,
          debug: debugInfo
        });
    }

  } catch (error) {
    console.error('💥 TAX API ERROR:', error);
    
    // 🔥 ENTFERNE FEHLERHAFTE REQUESTS AUS DEM CACHE
    if (requestToken) {
      const requestKey = `${address}-${limit}-${requestToken}`;
      requestCache.delete(requestKey);
    }
    
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

// 🔥 HELPER FUNCTIONS FÜR VERSCHIEDENE EXPORT-FORMATE
function generateHTMLReport(taxReport, year) {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];
  const walletShort = taxReport.walletAddress.slice(0, 8);
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>PulseManager Steuerreport ${year || new Date().getFullYear()}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .section { margin-bottom: 20px; }
        .stats { display: flex; justify-content: space-between; margin-bottom: 20px; }
        .stat { text-align: center; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .legal { margin-top: 30px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🇩🇪 PulseManager Steuerreport ${year || new Date().getFullYear()}</h1>
        <p>Wallet: ${taxReport.walletAddress}</p>
        <p>Generiert am: ${today.toLocaleDateString('de-DE')}</p>
      </div>
      
      <div class="section">
        <h2>📊 Steuer-Übersicht</h2>
        <div class="stats">
          <div class="stat">
            <h3>${taxReport.summary?.totalTransactions || 0}</h3>
            <p>Gesamt Transaktionen</p>
          </div>
          <div class="stat">
            <h3>${taxReport.summary?.pulsechainCount || 0}</h3>
            <p>PulseChain</p>
          </div>
          <div class="stat">
            <h3>${taxReport.summary?.ethereumCount || 0}</h3>
            <p>Ethereum</p>
          </div>
          <div class="stat">
            <h3>${taxReport.summary?.roiCount || 0}</h3>
            <p>Steuer-Events</p>
          </div>
        </div>
      </div>
      
      <div class="section">
        <h2>📋 Transaktionen (${taxReport.transactions.length})</h2>
        <table>
          <thead>
            <tr>
              <th>Datum</th>
              <th>Chain</th>
              <th>Token</th>
              <th>Typ</th>
              <th>Richtung</th>
              <th>Wert</th>
            </tr>
          </thead>
          <tbody>
            ${taxReport.transactions.map((tx, index) => {
              const date = tx.timestamp ? new Date(tx.timestamp).toLocaleDateString('de-DE') : 'N/A';
              const chain = tx.sourceChainShort || (tx.sourceChain === 'Ethereum' ? 'ETH' : tx.sourceChain === 'PulseChain' ? 'PLS' : 'UNK');
              const token = tx.tokenSymbol || 'N/A';
              const direction = tx.directionIcon || (tx.direction === 'in' ? '📥 IN' : '📤 OUT');
              const value = tx.formattedValue || (tx.value ? (parseFloat(tx.value) / Math.pow(10, tx.tokenDecimal || 18)).toFixed(6) : '0');
              return `
                <tr>
                  <td>${date}</td>
                  <td>${chain}</td>
                  <td>${token}</td>
                  <td>${tx.taxCategory || 'N/A'}</td>
                  <td>${direction}</td>
                  <td>${value}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
      
      <div class="legal">
        <h3>⚖️ Rechtlicher Hinweis</h3>
        <p>Dieser Steuerreport dient nur zu Informationszwecken und stellt keine Steuerberatung dar.</p>
        <p>Für Ihre finale Steuererklärung müssen Sie einen qualifizierten Steuerberater konsultieren.</p>
        <p>Wir übernehmen keine Verantwortung für steuerliche Entscheidungen.</p>
        <p><strong>Generiert von PulseManager</strong></p>
      </div>
    </body>
    </html>
  `;
}

function generateCSVReport(taxReport, year) {
  const headers = ['Datum', 'Chain', 'Token', 'Typ', 'Richtung', 'Wert', 'Wallet'];
  const rows = taxReport.transactions.map(tx => {
    const date = tx.timestamp ? new Date(tx.timestamp).toLocaleDateString('de-DE') : 'N/A';
    const chain = tx.sourceChainShort || (tx.sourceChain === 'Ethereum' ? 'ETH' : tx.sourceChain === 'PulseChain' ? 'PLS' : 'UNK');
    const token = tx.tokenSymbol || 'N/A';
    const direction = tx.direction === 'in' ? 'IN' : 'OUT';
    const value = tx.formattedValue || '0';
    return [date, chain, token, tx.taxCategory || 'N/A', direction, value, taxReport.walletAddress];
  });
  
  return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
}

function generateELSTERReport(taxReport, year, taxpayer) {
  // Vereinfachtes ELSTER XML Format
  return `<?xml version="1.0" encoding="UTF-8"?>
<steuerreport>
  <header>
    <jahr>${year || new Date().getFullYear()}</jahr>
    <generiert>${new Date().toISOString()}</generiert>
    <wallet>${taxReport.walletAddress}</wallet>
  </header>
  <steuerpflichtiger>
    <name>${taxpayer?.name || 'Nicht angegeben'}</name>
    <strasse>${taxpayer?.street || 'Nicht angegeben'}</strasse>
    <plz>${taxpayer?.zipCode || 'Nicht angegeben'}</plz>
    <ort>${taxpayer?.city || 'Nicht angegeben'}</ort>
    <steuernummer>${taxpayer?.taxNumber || 'Nicht angegeben'}</steuernummer>
  </steuerpflichtiger>
  <transaktionen>
    ${taxReport.transactions.map(tx => `
    <transaktion>
      <datum>${tx.timestamp ? new Date(tx.timestamp).toISOString().split('T')[0] : 'N/A'}</datum>
      <chain>${tx.sourceChainShort || 'UNK'}</chain>
      <token>${tx.tokenSymbol || 'N/A'}</token>
      <typ>${tx.taxCategory || 'N/A'}</typ>
      <richtung>${tx.direction || 'unknown'}</richtung>
      <wert>${tx.formattedValue || '0'}</wert>
    </transaktion>
    `).join('')}
  </transaktionen>
  <zusammenfassung>
    <gesamt_transaktionen>${taxReport.summary?.totalTransactions || 0}</gesamt_transaktionen>
    <ethereum_count>${taxReport.summary?.ethereumCount || 0}</ethereum_count>
    <pulsechain_count>${taxReport.summary?.pulsechainCount || 0}</pulsechain_count>
    <roi_count>${taxReport.summary?.roiCount || 0}</roi_count>
  </zusammenfassung>
</steuerreport>`;
}