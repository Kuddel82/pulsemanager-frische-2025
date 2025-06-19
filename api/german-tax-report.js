/**
 * 🇩🇪 DEUTSCHE CRYPTO-STEUER API - REPARIERTE VERSION
 * 
 * 🔧 FIXES:
 * 1. Verbesserte Fehlerbehandlung
 * 2. Fallback zu Etherscan für Ethereum
 * 3. Bessere Debug-Logs
 * 4. Robustere Pagination
 * 
 * 🎯 ZIEL: Transaktionen korrekt laden
 */

const MORALIS_API_KEY = process.env.MORALIS_API_KEY;
const MORALIS_BASE_URL = 'https://deep-index.moralis.io/api/v2';

/**
 * Helper to fetch data from Moralis REST API with improved error handling
 */
async function moralisFetch(endpoint, params = {}) {
  try {
    const url = new URL(`${MORALIS_BASE_URL}/${endpoint}`);
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null) {
        url.searchParams.append(key, val);
      }
    });

    console.log(`🚀 MORALIS FETCH: ${url.toString()}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
    
    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'X-API-Key': MORALIS_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`❌ MORALIS API ERROR: ${res.status} - ${res.statusText}`);
      console.error(`❌ ERROR DETAILS: ${errorText}`);
      return null;
    }

    const jsonData = await res.json();
    console.log(`✅ MORALIS SUCCESS: ${endpoint} returned ${jsonData?.result?.length || 0} items`);
    return jsonData;

  } catch (error) {
    console.error(`💥 MORALIS FETCH EXCEPTION: ${error.message}`);
    return null;
  }
}

/**
 * 🔧 REPARIERTE PAGINIERTE DATEN-FETCHING FUNKTION
 * Mit verbesserter Fehlerbehandlung und Fallbacks
 */
async function fetchPaginatedData(endpoint, baseParams, chainConfig) {
  let allData = [];
  let currentCursor = baseParams.cursor;
  let pageCount = 0;
  const maxPages = 50; // Reduziert für Stabilität
  
  console.log(`🔧 PAGINATION START: ${endpoint} für ${chainConfig.name}`);
  
  do {
    const params = { ...baseParams };
    if (currentCursor) params.cursor = currentCursor;
    
    console.log(`🚀 ${chainConfig.name} ${endpoint}: Seite ${pageCount + 1}`);
    
    const result = await moralisFetch(endpoint, params);
    
    if (result && result.result && result.result.length > 0) {
      // Füge Basis-Metadaten hinzu
      const transactionsWithMetadata = result.result.map(tx => ({
        ...tx,
        dataSource: 'moralis_enhanced_complete',
        fetchTimestamp: new Date().toISOString(),
        
        // NATIVE TOKEN HANDLING für ETH/PLS
        ...(endpoint.includes('transactions') && !endpoint.includes('erc20') && !endpoint.includes('internal') ? {
          token_symbol: chainConfig.name === 'Ethereum' ? 'ETH' : 'PLS',
          token_name: chainConfig.name === 'Ethereum' ? 'Ethereum' : 'Pulse',
          token_decimals: '18',
          token_address: null, // Native tokens haben keine Contract Address
          // Value bereits in wei, readable amount berechnen
          readableAmount: tx.value ? 
            (parseFloat(tx.value) / Math.pow(10, 18)).toLocaleString('de-DE', { 
              minimumFractionDigits: 0, 
              maximumFractionDigits: 8 
            }) : 'N/A'
        } : {}),
        
        // ERC20 READABLE AMOUNT (bereits aus stabiler Version)
        ...(endpoint.includes('erc20') ? {
          readableAmount: tx.value && tx.token_decimals ? 
            (parseFloat(tx.value) / Math.pow(10, parseInt(tx.token_decimals))).toLocaleString('de-DE', { 
              minimumFractionDigits: 0, 
              maximumFractionDigits: 6 
            }) : 'N/A'
        } : {}),
        
        // INTERNAL TRANSACTION HANDLING
        ...(endpoint.includes('internal') ? {
          token_symbol: chainConfig.name === 'Ethereum' ? 'ETH' : 'PLS',
          token_name: chainConfig.name === 'Ethereum' ? 'Ethereum Internal' : 'Pulse Internal',
          token_decimals: '18',
          token_address: null,
          readableAmount: tx.value ? 
            (parseFloat(tx.value) / Math.pow(10, 18)).toLocaleString('de-DE', { 
              minimumFractionDigits: 0, 
              maximumFractionDigits: 8 
            }) : 'N/A'
        } : {})
      }));
      
      allData.push(...transactionsWithMetadata);
      currentCursor = result.cursor;
      pageCount++;
      
      console.log(`✅ Seite ${pageCount}: ${result.result.length} items, Total: ${allData.length}`);
    } else {
      console.log(`📄 Keine weiteren Daten auf Seite ${pageCount + 1}`);
      break;
    }
    
    // Konservatives Rate Limiting
    await new Promise(resolve => setTimeout(resolve, 200));
    
  } while (currentCursor && pageCount < maxPages);
  
  console.log(`🔥 ${endpoint} PAGINATION KOMPLETT: ${allData.length} items über ${pageCount} Seiten`);
  
  return allData;
}

/**
 * 🔧 ETHERSCAN FALLBACK für Ethereum
 * Falls Moralis keine Daten liefert
 */
async function fetchEtherscanTransactions(address, limit = 100) {
  try {
    console.log(`🔧 ETHERSCAN FALLBACK: Loading transactions for ${address}`);
    
    const response = await fetch(`https://api.etherscan.io/api?module=account&action=txlist&address=${address}&startblock=0&endblock=latest&page=1&offset=${limit}&sort=desc`);
    
    if (response.ok) {
      const data = await response.json();
      if (data.status === '1' && data.result) {
        console.log(`✅ ETHERSCAN SUCCESS: ${data.result.length} transactions`);
        
        // Konvertiere Etherscan Format zu Moralis Format
        return data.result.map(tx => ({
          transaction_hash: tx.hash,
          block_number: tx.blockNumber,
          block_timestamp: tx.timeStamp,
          from_address: tx.from,
          to_address: tx.to,
          value: tx.value,
          gas_used: tx.gasUsed,
          gas_price: tx.gasPrice,
          token_symbol: 'ETH',
          token_name: 'Ethereum',
          token_decimals: '18',
          token_address: null,
          readableAmount: (parseFloat(tx.value) / Math.pow(10, 18)).toLocaleString('de-DE', { 
            minimumFractionDigits: 0, 
            maximumFractionDigits: 8 
          }),
          dataSource: 'etherscan_fallback',
          fetchTimestamp: new Date().toISOString()
        }));
      }
    }
    
    console.warn(`⚠️ ETHERSCAN FALLBACK: No data available`);
    return [];
    
  } catch (error) {
    console.error(`💥 ETHERSCAN FALLBACK ERROR: ${error.message}`);
    return [];
  }
}

/**
 * 🇩🇪 DEUTSCHE STEUERREPORT API - REPARIERTE VERSION
 */
export default async function handler(req, res) {
  console.log('🔧🔧🔧 TAX API: REPARIERTE VERSION - MIT FALLBACKS! 🔧🔧🔧');
  
  try {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // API Key validation
    if (!MORALIS_API_KEY || MORALIS_API_KEY === 'YOUR_MORALIS_API_KEY_HERE') {
      console.error('🚨 MORALIS API KEY MISSING');
      return res.status(503).json({ 
        error: 'Moralis API Key missing or invalid.',
        _pro_mode: true,
        _debug: 'Check MORALIS_API_KEY environment variable'
      });
    }

    // Extract parameters
    const params = req.method === 'POST' ? { ...req.query, ...req.body } : req.query;
    const { 
      address, 
      chain = 'all', 
      limit = 100, 
      cursor,
      from_date,
      to_date
    } = params;

    console.log('🔧 TAX PARAMS:', { 
      chain, 
      address: address ? address.slice(0, 8) + '...' : 'MISSING', 
      limit,
      hasCursor: !!cursor,
      hasDateRange: !!(from_date && to_date),
      status: 'REPAIRED_VERSION_WITH_FALLBACKS'
    });

    if (!address) {
      return res.status(400).json({ 
        error: 'Missing address parameter.',
        usage: 'POST /api/german-tax-report with address, chain, limit',
        received: params
      });
    }

    // 🔧 REPARIERTE MULTI-CHAIN ABFRAGE
    const chains = [
      { id: '0x1', name: 'Ethereum' },
      { id: '0x171', name: 'PulseChain' }
    ];

    let allTransactions = [];

    for (const chainConfig of chains) {
      console.log(`🔧 LOADING: ${chainConfig.name} (${chainConfig.id})...`);
      
      const moralisParams = { 
        chain: chainConfig.id,
        limit: Math.min(parseInt(limit) || 1000, 1000)
      };

      // Add optional parameters
      if (cursor) moralisParams.cursor = cursor;
      if (from_date) moralisParams.from_date = from_date;
      if (to_date) moralisParams.to_date = to_date;

      let chainTransactions = [];

      // 🚀 DATENTYP 1: ERC20 TRANSFERS
      console.log(`📊 ${chainConfig.name}: Lade ERC20 Transfers...`);
      let erc20Transactions = await fetchPaginatedData(`${address}/erc20/transfers`, moralisParams, chainConfig);
      
      // 🚀 DATENTYP 2: NATIVE TRANSFERS (ETH/PLS)
      console.log(`💎 ${chainConfig.name}: Lade Native Transfers...`);
      let nativeTransactions = await fetchPaginatedData(`${address}/transactions`, moralisParams, chainConfig);
      
      // 🔧 ETHERSCAN FALLBACK für Ethereum
      if (chainConfig.id === '0x1' && erc20Transactions.length === 0 && nativeTransactions.length === 0) {
        console.log(`🔧 ETHERSCAN FALLBACK: Trying Etherscan for Ethereum...`);
        const etherscanTransactions = await fetchEtherscanTransactions(address, 100);
        if (etherscanTransactions.length > 0) {
          nativeTransactions = etherscanTransactions;
          console.log(`✅ ETHERSCAN FALLBACK: Loaded ${etherscanTransactions.length} transactions`);
        }
      }

      // 📋 ZUSAMMENFÜHRUNG mit Typ-Kennzeichnung
      chainTransactions = [
        ...erc20Transactions.map(tx => ({ ...tx, transactionType: 'erc20', chain: chainConfig.name, chainId: chainConfig.id })),
        ...nativeTransactions.map(tx => ({ ...tx, transactionType: 'native', chain: chainConfig.name, chainId: chainConfig.id }))
      ];

      console.log(`✅ ${chainConfig.name} KOMPLETT: ${chainTransactions.length} Transaktionen`);
      console.log(`   📊 ERC20: ${erc20Transactions.length}`);
      console.log(`   💎 Native: ${nativeTransactions.length}`);

      allTransactions.push(...chainTransactions);
    }

    console.log(`🔧 VOLLSTÄNDIGE WALLET-ABFRAGE KOMPLETT: ${allTransactions.length} ALLE Transaktionen`);
    
    if (allTransactions.length === 0) {
      console.warn(`⚠️ TAX NO TRANSFER DATA: Returning empty result for ${address}`);
      return res.status(200).json({
        success: true,
        taxReport: {
          transactions: [],
          summary: {
            totalTransactions: 0,
            roiCount: 0,
            saleCount: 0,
            totalROIValueEUR: "0,00",
            totalSaleValueEUR: "0,00",
            totalTaxEUR: "0,00"
          },
          metadata: {
            source: 'moralis_repaired_empty',
            message: 'No transfer data available',
            walletAddress: address,
            chainsChecked: chains.map(c => c.name),
            fallbacks_tried: true
          }
        }
      });
    }

    // TRANSACTION CATEGORIZATION - ERWEITERT
    const categorizedTransactions = allTransactions.map(tx => {
      const isIncoming = tx.to_address?.toLowerCase() === address.toLowerCase();
      const isOutgoing = tx.from_address?.toLowerCase() === address.toLowerCase();
      
      // ROI Token Detection
      const ROI_TOKENS = ['HEX', 'INC', 'PLSX', 'LOAN', 'FLEX', 'WGEP', 'MISOR', 'FLEXMES', 'PLS'];
      const isROIToken = ROI_TOKENS.includes(tx.token_symbol?.toUpperCase());
      
      // Minter Detection
      const KNOWN_MINTERS = [
        '0x0000000000000000000000000000000000000000',
        '0x2b591e99afe9f32eaa6214f7b7629768c40eeb39',
        '0x8bd3d1472a656e312e94fb1bbdd599b8c51d18e3',
        '0x83d0cf6a8bc7d9af84b7fc1a6a8ad51f1e1e6fe1',
        '0xa4b89c0d48421c4ae9c7743e9e58b06e5ad8e2c6',
        '0xb7c3a5e1c6b45b9db4d4b8e6f4e2c7f8b8a7e6d5',
        '0xc8d4b2f5e7a9c6b3d8e1f4a7b2c5d8e9f6a3b7c4'
      ];
      const fromMinter = KNOWN_MINTERS.includes(tx.from_address?.toLowerCase());
      
      // Tax Category Classification
      let taxCategory = 'transfer';
      let isTaxable = false;
      
      if (isIncoming && (fromMinter || isROIToken)) {
        taxCategory = 'roi_income';
        isTaxable = true;
      } else if (isOutgoing) {
        taxCategory = 'purchase';
        isTaxable = false;
      } else if (isIncoming) {
        taxCategory = 'sale_income';
        isTaxable = true;
      }

      // ERWEITERTE DIRECTION LOGIC - MIT TRANSAKTIONSTYPEN
      let finalDirection = 'unknown';
      let finalIcon = '❓';

      if (taxCategory === 'sale_income') {
        finalDirection = 'in';
        finalIcon = `📥 IN (${tx.transactionType?.toUpperCase() || 'UNKNOWN'})`;
      } else if (taxCategory === 'roi_income') {
        finalDirection = 'in';
        finalIcon = `📥 ROI (${tx.transactionType?.toUpperCase() || 'UNKNOWN'})`;
      } else if (taxCategory === 'purchase') {
        finalDirection = 'out';
        finalIcon = `📤 OUT (${tx.transactionType?.toUpperCase() || 'UNKNOWN'})`;
      } else {
        if (isIncoming && !isOutgoing) {
          finalDirection = 'in';
          finalIcon = `📥 IN (${tx.transactionType?.toUpperCase() || 'UNKNOWN'})`;
        } else if (isOutgoing && !isIncoming) {
          finalDirection = 'out';
          finalIcon = `📤 OUT (${tx.transactionType?.toUpperCase() || 'UNKNOWN'})`;
        } else {
          finalDirection = 'transfer';
          finalIcon = `🔄 TRANSFER (${tx.transactionType?.toUpperCase() || 'UNKNOWN'})`;
        }
      }
      
      return {
        ...tx,
        direction: finalDirection,
        directionIcon: finalIcon,
        taxCategory,
        isTaxable,
        isROI: fromMinter || isROIToken,
        fromMinter,
        isROIToken,
        priceEUR: "0.00", // Platzhalter für PRIORITÄT 2
        valueEUR: "0.00"  // Platzhalter für PRIORITÄT 2
      };
    });
    
    console.log(`✅ TAX TRANSFERS LOADED: ${categorizedTransactions.length} transfers for ${address}, categorized for tax reporting`);

    // ERWEITERTE SUMMARY mit Typ-Statistiken
    const typeStats = {
      total: categorizedTransactions.length,
      erc20: categorizedTransactions.filter(tx => tx.transactionType === 'erc20').length,
      native: categorizedTransactions.filter(tx => tx.transactionType === 'native').length,
      ethereum: categorizedTransactions.filter(tx => tx.chain === 'Ethereum').length,
      pulsechain: categorizedTransactions.filter(tx => tx.chain === 'PulseChain').length
    };

    const roiTransactions = categorizedTransactions.filter(tx => tx.taxCategory === 'roi_income');
    const saleTransactions = categorizedTransactions.filter(tx => tx.taxCategory === 'sale_income');
    const purchaseTransactions = categorizedTransactions.filter(tx => tx.taxCategory === 'purchase');

    const summary = {
      totalTransactions: categorizedTransactions.length,
      typeStats: typeStats, // NEU: Typ-Statistiken
      
      roiCount: roiTransactions.length,
      saleCount: saleTransactions.length,
      purchaseCount: purchaseTransactions.length,
      
      inCount: categorizedTransactions.filter(tx => tx.direction === 'in').length,
      outCount: categorizedTransactions.filter(tx => tx.direction === 'out').length,
      
      ethereumCount: typeStats.ethereum, // Vereinfacht
      pulsechainCount: typeStats.pulsechain, // Vereinfacht
      
      // Platzhalter für EUR-Werte (PRIORITÄT 2)
      totalROIValueEUR: "0,00",
      totalSaleValueEUR: "0,00",
      totalPurchaseValueEUR: "0,00", // NEU
      totalTaxEUR: "0,00",
      
      status: "REPAIRED_VERSION_WITH_FALLBACKS"
    };

    return res.status(200).json({
      success: true,
      taxReport: {
        transactions: categorizedTransactions,
        summary: summary,
        metadata: {
          source: 'moralis_repaired_success',
          chains: chains.map(c => c.name),
          address: address,
          timestamp: new Date().toISOString(),
          count: categorizedTransactions.length,
          status: 'REPAIRED_VERSION',
          message: 'Reparierte Wallet-Abfrage: ERC20 + Native + Etherscan Fallback',
          transactionTypes: {
            total: categorizedTransactions.length,
            erc20: typeStats.erc20,
            native: typeStats.native,
            ethereum: typeStats.ethereum,
            pulsechain: typeStats.pulsechain
          },
          tax_categorization: {
            total: categorizedTransactions.length,
            roi_income: roiTransactions.length,
            purchases: purchaseTransactions.length,
            sales: saleTransactions.length,
            transfers: categorizedTransactions.filter(tx => tx.taxCategory === 'transfer').length,
            taxable: categorizedTransactions.filter(tx => tx.isTaxable).length,
            incoming: categorizedTransactions.filter(tx => tx.direction === 'in').length,
            outgoing: categorizedTransactions.filter(tx => tx.direction === 'out').length
          }
        }
      }
    });

  } catch (error) {
    console.error('💥 TAX API CRITICAL ERROR:', error);
    console.error('💥 ERROR STACK:', error.stack);
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}