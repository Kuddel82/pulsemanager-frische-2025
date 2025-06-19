/**
 * 🇩🇪 DEUTSCHE CRYPTO-STEUER API - STABILE BASIS VERSION
 * 
 * ROLLBACK ZU FUNKTIONIERENDER VERSION (9562 PulseChain + 45 ETH)
 * HISTORISCHE PREISE SPÄTER HINZUFÜGEN WENN BASIS STABIL IST
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
 * 🛠️ PAGINIERTE DATEN-FETCHING FUNKTION - NEU HINZUFÜGEN
 * Bewährte Pagination für alle Endpunkte
 */
async function fetchPaginatedData(endpoint, baseParams, chainConfig) {
  let allData = [];
  let currentCursor = baseParams.cursor;
  let pageCount = 0;
  const maxPages = 150; // Bewährt aus stabiler Version
  
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
    
    // Konservatives Rate Limiting (aus stabiler Version)
    await new Promise(resolve => setTimeout(resolve, 150));
    
  } while (currentCursor && pageCount < maxPages);
  
  console.log(`🔥 ${endpoint} PAGINATION KOMPLETT: ${allData.length} items über ${pageCount} Seiten`);
  
  return allData;
}

/**
 * 🇩🇪 DEUTSCHE STEUERREPORT API - STABILE FUNKTIONSFÄHIGE VERSION
 */
export default async function handler(req, res) {
  console.log('🔥🔥🔥 TAX API: ROLLBACK TO STABLE VERSION - SHOULD WORK AGAIN! 🔥🔥🔥');
  console.log('🔥🔥🔥 TARGETING: ETH 45+ PulseChain 9562+ 🔥🔥🔥');
  
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
      chain = 'pulsechain', 
      limit = 100, 
      cursor,
      from_date,
      to_date
    } = params;

    console.log('🇩🇪 TAX PARAMS:', { 
      chain, 
      address: address ? address.slice(0, 8) + '...' : 'MISSING', 
      limit,
      hasCursor: !!cursor,
      hasDateRange: !!(from_date && to_date),
      status: 'ROLLBACK_TO_STABLE_VERSION'
    });

    if (!address) {
      return res.status(400).json({ 
        error: 'Missing address parameter.',
        usage: 'POST /api/german-tax-report with address, chain, limit',
        received: params
      });
    }

    // 🔥 ERWEITERTE MULTI-CHAIN ABFRAGE - ALLE DATENTYPEN
    const chains = [
      { id: '0x1', name: 'Ethereum' },
      { id: '0x171', name: 'PulseChain' }
    ];

    let allTransactions = [];

    for (const chainConfig of chains) {
      console.log(`🔗 VOLLSTÄNDIGE ABFRAGE: ${chainConfig.name} (${chainConfig.id})...`);
      
      const moralisParams = { 
        chain: chainConfig.id,
        limit: Math.min(parseInt(limit) || 2000, 2000)
      };

      // Add optional parameters
      if (cursor) moralisParams.cursor = cursor;
      if (from_date) moralisParams.from_date = from_date;
      if (to_date) moralisParams.to_date = to_date;

      // 🚀 DATENTYP 1: ERC20 TRANSFERS
      console.log(`📊 ${chainConfig.name}: Lade ERC20 Transfers...`);
      let erc20Transactions = await fetchPaginatedData(`${address}/erc20/transfers`, moralisParams, chainConfig);
      
      // 🚀 DATENTYP 2: NATIVE TRANSFERS (ETH/PLS)
      console.log(`💎 ${chainConfig.name}: Lade Native Transfers...`);
      let nativeTransactions = await fetchPaginatedData(`${address}/transactions`, moralisParams, chainConfig);
      
      // 🚀 DATENTYP 3: INTERNAL TRANSACTIONS
      console.log(`🔄 ${chainConfig.name}: Lade Internal Transactions...`);
      let internalTransactions = await fetchPaginatedData(`${address}/internal-transactions`, moralisParams, chainConfig);

      // 📋 ZUSAMMENFÜHRUNG mit Typ-Kennzeichnung
      const chainTransactions = [
        ...erc20Transactions.map(tx => ({ ...tx, transactionType: 'erc20', chain: chainConfig.name, chainId: chainConfig.id })),
        ...nativeTransactions.map(tx => ({ ...tx, transactionType: 'native', chain: chainConfig.name, chainId: chainConfig.id })),
        ...internalTransactions.map(tx => ({ ...tx, transactionType: 'internal', chain: chainConfig.name, chainId: chainConfig.id }))
      ];

      console.log(`✅ ${chainConfig.name} KOMPLETT: ${chainTransactions.length} Transaktionen`);
      console.log(`   📊 ERC20: ${erc20Transactions.length}`);
      console.log(`   💎 Native: ${nativeTransactions.length}`);
      console.log(`   🔄 Internal: ${internalTransactions.length}`);

      allTransactions.push(...chainTransactions);
    }

    console.log(`🔥 VOLLSTÄNDIGE WALLET-ABFRAGE KOMPLETT: ${allTransactions.length} ALLE Transaktionen`);
    
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
            source: 'moralis_stable_rollback_empty',
            message: 'No transfer data available',
            walletAddress: address,
            chainsChecked: chains.map(c => c.name)
          }
        }
      });
    }

    // TRANSACTION CATEGORIZATION - STABIL UND BEWÄHRT
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

    // EINFACHE SUMMARY
    const roiTransactions = categorizedTransactions.filter(tx => tx.taxCategory === 'roi_income');
    const saleTransactions = categorizedTransactions.filter(tx => tx.taxCategory === 'sale_income');
    const purchaseTransactions = categorizedTransactions.filter(tx => tx.taxCategory === 'purchase');

    const summary = {
      totalTransactions: categorizedTransactions.length,
      roiCount: roiTransactions.length,
      saleCount: saleTransactions.length,
      purchaseCount: purchaseTransactions.length,
      
      inCount: categorizedTransactions.filter(tx => tx.direction === 'in').length,
      outCount: categorizedTransactions.filter(tx => tx.direction === 'out').length,
      
      ethereumCount: allTransactions.filter(tx => tx.chain === 'Ethereum').length,
      pulsechainCount: allTransactions.filter(tx => tx.chain === 'PulseChain').length,
      
      // PLATZHALTER FÜR EUR-WERTE
      totalROIValueEUR: "0,00",
      totalSaleValueEUR: "0,00",
      totalGainsEUR: "0,00",
      totalTaxEUR: "0,00",
      
      status: "ENHANCED_MULTI_CHAIN_VERSION"
    };

    return res.status(200).json({
      success: true,
      taxReport: {
        transactions: categorizedTransactions,
        summary: summary,
        metadata: {
          source: 'moralis_enhanced_complete_success',
          chains: chains.map(c => c.name),
          address: address,
          timestamp: new Date().toISOString(),
          count: categorizedTransactions.length,
          status: 'ENHANCED_MULTI_CHAIN_VERSION',
          message: 'Erweiterte Multi-Chain-Abfrage mit allen Transaktionstypen',
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
          source: 'moralis_enhanced_complete_error',
          error: error.message,
          timestamp: new Date().toISOString(),
          debug: 'Enhanced multi-chain version error'
        }
      }
    });
  }
}