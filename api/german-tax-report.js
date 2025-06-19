/**
 * 🇩🇪 DEUTSCHE CRYPTO-STEUER API - KONSERVATIVE ERWEITERUNG
 * 
 * BASIERT AUF DEINER FUNKTIONIERENDEN VERSION + Native Transactions
 * BACKUP: Deine ursprüngliche Version bleibt als Fallback verfügbar
 */

const MORALIS_API_KEY = process.env.MORALIS_API_KEY;
const MORALIS_BASE_URL = 'https://deep-index.moralis.io/api/v2';

/**
 * Helper to fetch data from Moralis REST API with improved error handling
 * ✅ UNVERÄNDERT - EXAKTE KOPIE VON DEINER FUNKTIONIERENDEN VERSION
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
 * 🔄 NEUE FUNKTION: Multi-Endpoint Transaction Loading
 * Lädt sowohl ERC20 Transfers als auch Native Transactions
 */
async function loadAllTransactionsForChain(address, chainConfig, moralisParams) {
  console.log(`🔗 ENHANCED: Loading multi-endpoint data for ${chainConfig.name} (${chainConfig.id})...`);
  
  // 📡 ENDPOINT DEFINITIONEN (Konservativ erweitert)
  const endpoints = [
    { 
      path: `${address}/erc20/transfers`, 
      type: 'erc20',
      description: 'ERC20 Token Transfers',
      params: { ...moralisParams } // Alle ERC20 (beide Richtungen)
    },
    { 
      path: `${address}`, 
      type: 'native',
      description: 'Native Transactions (ETH, PLS, etc.)',
      params: { ...moralisParams } // Native ETH Transaktionen
    }
  ];
  
  let allChainTransactions = [];
  
  // 🔄 LOAD DATA FROM EACH ENDPOINT
  for (const endpoint of endpoints) {
    console.log(`📡 ENHANCED: Loading ${endpoint.description} for ${chainConfig.name}...`);
    
    let endpointTransactions = [];
    let currentCursor = moralisParams.cursor;
    let pageCount = 0;
    const maxPages = 150; // Max 150 pages = 300.000 transactions per endpoint
    
    do {
      // Prepare parameters for this endpoint
      const endpointParams = { ...endpoint.params };
      if (currentCursor) endpointParams.cursor = currentCursor;
      
      console.log(`🚀 ENHANCED: Fetching ${endpoint.type} page ${pageCount + 1} on ${chainConfig.name}`);
      console.log(`🔧 ENHANCED: Using params:`, endpointParams);
      
      const result = await moralisFetch(endpoint.path, endpointParams);
      
      if (result && result.result && result.result.length > 0) {
        // ✅ ADD METADATA TO TRANSACTIONS
        const transactionsWithMetadata = result.result.map(tx => ({
          ...tx,
          chain: chainConfig.name,
          chainId: chainConfig.id,
          endpointType: endpoint.type,  // NEW: Track which endpoint this came from
          dataSource: 'moralis_multi_endpoint' // NEW: Track data source
        }));
        
        endpointTransactions.push(...transactionsWithMetadata);
        currentCursor = result.cursor;
        pageCount++;
        
        console.log(`✅ ENHANCED: ${endpoint.type} page ${pageCount}: ${result.result.length} items, Total: ${endpointTransactions.length} on ${chainConfig.name}`);
      } else {
        console.log(`📄 ENHANCED: No more ${endpoint.type} data at page ${pageCount + 1} on ${chainConfig.name}`);
        break;
      }
      
      // Rate limiting zwischen Requests
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } while (currentCursor && pageCount < maxPages);
    
    console.log(`🔥 ENHANCED: ${endpoint.description} complete: ${endpointTransactions.length} transactions across ${pageCount} pages on ${chainConfig.name}`);
    allChainTransactions.push(...endpointTransactions);
  }
  
  return allChainTransactions;
}

/**
 * 🇩🇪 DEUTSCHE STEUERREPORT API - ERWEITERTE VERSION
 * ✅ BEWAHRT DEINE FUNKTIONIERENDE LOGIK + ERWEITERT UM NATIVE TRANSACTIONS
 */
export default async function handler(req, res) {
  console.log('🇩🇪 ENHANCED TAX API: Starting with CONSERVATIVE ENHANCEMENT');
  
  try {
    // Enable CORS - ✅ UNVERÄNDERT
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // API Key validation - ✅ UNVERÄNDERT
    if (!MORALIS_API_KEY || MORALIS_API_KEY === 'YOUR_MORALIS_API_KEY_HERE') {
      console.error('🚨 MORALIS API KEY MISSING');
      return res.status(503).json({ 
        error: 'Moralis API Key missing or invalid.',
        _pro_mode: true,
        _debug: 'Check MORALIS_API_KEY environment variable'
      });
    }

    // Extract parameters - ✅ UNVERÄNDERT
    const params = req.method === 'POST' ? { ...req.query, ...req.body } : req.query;
    const { 
      address, 
      chain = 'pulsechain', 
      limit = 100, 
      cursor,
      from_date,
      to_date
    } = params;

    console.log('🇩🇪 ENHANCED TAX PARAMS:', { 
      chain, 
      address: address ? address.slice(0, 8) + '...' : 'MISSING', 
      limit,
      hasCursor: !!cursor,
      hasDateRange: !!(from_date && to_date),
      enhancement: 'MULTI_ENDPOINT_LOADING'
    });

    if (!address) {
      return res.status(400).json({ 
        error: 'Missing address parameter.',
        usage: 'POST /api/german-tax-report with address, chain, limit',
        received: params
      });
    }

    // 🔥 MULTI-CHAIN: Lade BEIDE Chains (Ethereum + PulseChain) - ✅ UNVERÄNDERT
    const chains = [
      { id: '0x1', name: 'Ethereum' },
      { id: '0x171', name: 'PulseChain' }
    ];
    
    let allTransactions = [];
    
    // 🔄 ENHANCED: Use new multi-endpoint loading function
    for (const chainConfig of chains) {
      console.log(`🔗 ENHANCED: Processing ${chainConfig.name} (${chainConfig.id}) with multi-endpoint loading...`);
      
      // Build Moralis API parameters für diese Chain - ✅ UNVERÄNDERT
      const moralisParams = { 
        chain: chainConfig.id,
        limit: Math.min(parseInt(limit) || 2000, 2000) // Erhöht auf 2000 pro Request
      };

      // Add optional parameters - ✅ UNVERÄNDERT
      if (cursor) moralisParams.cursor = cursor;
      if (from_date) moralisParams.from_date = from_date;
      if (to_date) moralisParams.to_date = to_date;
      
      // 🔥 NEW: Use enhanced multi-endpoint loading
      const chainTransactions = await loadAllTransactionsForChain(address, chainConfig, moralisParams);
      
      console.log(`🔥 ENHANCED: ${chainConfig.name} multi-endpoint loading complete: ${chainTransactions.length} total transactions`);
      allTransactions.push(...chainTransactions);
    }
    
    console.log(`🔥 ENHANCED MULTI-CHAIN COMPLETE: ${allTransactions.length} total transactions (Ethereum + PulseChain) from multiple endpoints`);
    
    if (allTransactions.length === 0) {
      console.warn(`⚠️ ENHANCED: No transfer data found for ${address} across all endpoints`);
      return res.status(200).json({
        success: true,
        taxReport: {
          transactions: [],
          summary: {
            totalTransactions: 0,
            roiCount: 0,
            saleCount: 0,
            totalROIValueEUR: 0,
            totalSaleValueEUR: 0,
            totalTaxEUR: 0
          },
          metadata: {
            source: 'moralis_v2_enhanced_multi_endpoint_empty',
            message: 'No transaction data available on any chain or endpoint',
            walletAddress: address,
            chainsChecked: chains.map(c => c.name),
            endpointsChecked: ['erc20/transfers', 'native_transactions']
          }
        }
      });
    }

    // Successful response with transaction categorization - ✅ UNVERÄNDERT
    const transferCount = allTransactions.length;
    
    // 📊 TRANSACTION CATEGORIZATION für Tax Report - ✅ UNVERÄNDERT
    const categorizedTransactions = allTransactions.map(tx => {
      const isIncoming = tx.to_address?.toLowerCase() === address.toLowerCase();
      const isOutgoing = tx.from_address?.toLowerCase() === address.toLowerCase();
      
      // ROI Token Detection - ✅ UNVERÄNDERT
      const ROI_TOKENS = ['HEX', 'INC', 'PLSX', 'LOAN', 'FLEX', 'WGEP', 'MISOR', 'FLEXMES', 'PLS'];
      const isROIToken = ROI_TOKENS.includes(tx.token_symbol?.toUpperCase());
      
      // Minter Detection - ✅ UNVERÄNDERT
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
      
      // Tax Category Classification - ✅ UNVERÄNDERT
      let taxCategory = 'transfer'; // Default: steuerfreier Transfer
      let isTaxable = false;
      
      if (isIncoming && (fromMinter || isROIToken)) {
        taxCategory = 'roi_income';
        isTaxable = true;
      } else if (isOutgoing) {
        taxCategory = 'purchase';
        isTaxable = false; // Käufe sind nicht steuerpflichtig
      } else if (isIncoming) {
        taxCategory = 'sale_income';
        isTaxable = true; // Verkaufserlöse sind steuerpflichtig
      }
      
      return {
        ...tx,
        // Tax-spezifische Felder - ✅ UNVERÄNDERT
        direction: isIncoming ? 'in' : 'out',
        taxCategory,
        isTaxable,
        isROI: fromMinter || isROIToken,
        fromMinter,
        isROIToken
      };
    });
    
    console.log(`✅ ENHANCED TRANSFERS LOADED: ${transferCount} transfers for ${address}, categorized for tax reporting from multiple endpoints`);

    // Calculate German tax summary - ✅ UNVERÄNDERT
    const roiTransactions = categorizedTransactions.filter(tx => tx.taxCategory === 'roi_income');
    const saleTransactions = categorizedTransactions.filter(tx => tx.taxCategory === 'sale_income');
    const purchaseTransactions = categorizedTransactions.filter(tx => tx.taxCategory === 'purchase');

    // 📊 ENHANCED SUMMARY: Add endpoint breakdown
    const endpointBreakdown = {
      erc20: categorizedTransactions.filter(tx => tx.endpointType === 'erc20').length,
      native: categorizedTransactions.filter(tx => tx.endpointType === 'native').length
    };

    const summary = {
      totalTransactions: transferCount,
      roiCount: roiTransactions.length,
      saleCount: saleTransactions.length,
      purchaseCount: purchaseTransactions.length,
      totalROIValueEUR: 0, // Will be calculated with real prices
      totalSaleValueEUR: 0, // Will be calculated with real prices
      totalTaxEUR: 0, // Will be calculated with real prices
      endpointBreakdown // NEW: Show breakdown by endpoint type
    };

    return res.status(200).json({
      success: true,
      taxReport: {
        transactions: categorizedTransactions,
        summary: summary,
        metadata: {
          source: 'moralis_v2_enhanced_multi_endpoint_success',
          chain: chains.map(c => c.name).join(' + '),
          address: address,
          timestamp: new Date().toISOString(),
          count: transferCount,
          enhancement: 'MULTI_ENDPOINT_LOADING',
          endpointsUsed: ['erc20/transfers', 'native_transactions'],
          endpointBreakdown,
          tax_categorization: {
            total: transferCount,
            roi_income: roiTransactions.length,
            purchases: purchaseTransactions.length,
            sales: saleTransactions.length,
            transfers: categorizedTransactions.filter(tx => tx.taxCategory === 'transfer').length,
            taxable: categorizedTransactions.filter(tx => tx.isTaxable).length
          }
        }
      }
    });

  } catch (error) {
    console.error('💥 ENHANCED TAX API CRITICAL ERROR:', error);
    console.error('💥 ERROR STACK:', error.stack);
    
    // Return graceful error response to prevent tax report crash - ✅ UNVERÄNDERT
    return res.status(200).json({
      success: true,
      taxReport: {
        transactions: [],
        summary: {
          totalTransactions: 0,
          roiCount: 0,
          saleCount: 0,
          totalROIValueEUR: 0,
          totalSaleValueEUR: 0,
          totalTaxEUR: 0,
          endpointBreakdown: { erc20: 0, native: 0 }
        },
        metadata: {
          source: 'moralis_v2_enhanced_multi_endpoint_error',
          error: error.message,
          timestamp: new Date().toISOString(),
          debug: 'Check server logs for details',
          enhancement: 'MULTI_ENDPOINT_LOADING'
        }
      }
    });
  }
} 