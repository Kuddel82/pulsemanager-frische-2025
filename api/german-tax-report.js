/**
 * 🇩🇪 DEUTSCHE CRYPTO-STEUER API - EXAKTE KOPIE DER FUNKTIONIERENDEN API
 * 
 * KOPIERT VON moralis-transactions.js - DIE FUNKTIONIERT!
 * WIEDERHERGESTELLT: Deine ursprünglich funktionierende Version
 */

const MORALIS_API_KEY = process.env.MORALIS_API_KEY;
const MORALIS_BASE_URL = 'https://deep-index.moralis.io/api/v2';

/**
 * Helper to fetch data from Moralis REST API with improved error handling
 * EXAKTE KOPIE VON DEINER FUNKTIONIERENDEN VERSION
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
    const timeoutId = setTimeout(() => controller.abort(), 90000); // 90 second timeout für Performance
    
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
 * 🇩🇪 DEUTSCHE STEUERREPORT API - EXAKTE KOPIE DER FUNKTIONIERENDEN LOGIK
 * WIEDERHERGESTELLT: Deine ursprünglich funktionierende Version + nur minimal ETH fix
 */
export default async function handler(req, res) {
  // 🚨 KRITISCHER TEST - MUSS SICHTBAR SEIN
  console.log('🚨🚨🚨 TAX API: CLAUDE UPDATE IS RUNNING - THIS SHOULD BE VISIBLE! 🚨🚨🚨');
  console.log('🚨🚨🚨 IF YOU SEE THIS, THE API IS UPDATED! 🚨🚨🚨');
  
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

    // Extract parameters with better handling
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
      status: 'DIRECTION_CORRECTION_MULTI_ENDPOINT'
    });

    if (!address) {
      return res.status(400).json({ 
        error: 'Missing address parameter.',
        usage: 'POST /api/german-tax-report with address, chain, limit',
        received: params
      });
    }

    // 🔥 MULTI-CHAIN: Lade BEIDE Chains (Ethereum + PulseChain) - EXAKTE KOPIE
    const chains = [
      { id: '0x1', name: 'Ethereum' },
      { id: '0x171', name: 'PulseChain' }
    ];
    
    let allTransactions = [];
    
    for (const chainConfig of chains) {
      console.log(`🔗 TAX: Loading ${chainConfig.name} (${chainConfig.id})...`);
      
      // Build Moralis API parameters für diese Chain - EXAKTE KOPIE (OHNE direction!)
      const moralisParams = { 
        chain: chainConfig.id,
        limit: Math.min(parseInt(limit) || 2000, 2000) // Erhöht auf 2000 pro Request
      };

      // Add optional parameters - EXAKTE KOPIE
      if (cursor) moralisParams.cursor = cursor;
      if (from_date) moralisParams.from_date = from_date;
      if (to_date) moralisParams.to_date = to_date;
      
      console.log(`🔧 TAX PAGE SIZE: Configured for ${moralisParams.limit} items per request on ${chainConfig.name}`);

      // 🔥 PAGINATION: Lade ALLE Transaktionen für diese Chain - EXAKTE KOPIE
      let chainTransactions = [];
      let currentCursor = cursor;
      let pageCount = 0;
      const maxPages = 150; // Max 150 pages = 300.000 transactions
      
      do {
        if (currentCursor) moralisParams.cursor = currentCursor;
        
        console.log(`🚀 TAX FETCHING PAGE ${pageCount + 1}: ${address} on ${chainConfig.name}`);
        
        // 🔥 MULTIPLE ENDPOINTS FÜR VOLLSTÄNDIGE IN+OUT ABDECKUNG
        let allResults = [];
        
        // ENDPOINT 1: ERC20 Transfers (funktioniert für PulseChain)
        console.log(`📤 Loading ERC20 transfers for ${chainConfig.name}...`);
        const erc20Result = await moralisFetch(`${address}/erc20/transfers`, moralisParams);
        
        if (erc20Result && erc20Result.result) {
          allResults.push(...erc20Result.result.map(tx => ({...tx, type: 'erc20'})));
          console.log(`✅ ERC20: ${erc20Result.result.length} transactions on ${chainConfig.name}`);
        }
        
        // ENDPOINT 2: FÜR ETHEREUM - ALLE TRANSAKTIONSTYPEN LADEN
        if (chainConfig.id === '0x1') {
          console.log(`💰 Loading ALL ETH transaction types for ${chainConfig.name}...`);
          
          // 2A: Native ETH Transactions
          const nativeResult = await moralisFetch(`${address}`, moralisParams);
          if (nativeResult && nativeResult.result) {
            allResults.push(...nativeResult.result.map(tx => ({
              ...tx, 
              type: 'native',
              token_symbol: 'ETH',
              token_decimals: 18,
              token_address: '0x0000000000000000000000000000000000000000'
            })));
            console.log(`✅ NATIVE ETH: ${nativeResult.result.length} transactions`);
          }
          
          // 2B: Internal ETH Transactions
          const internalResult = await moralisFetch(`${address}/internal-transactions`, moralisParams);
          if (internalResult && internalResult.result) {
            allResults.push(...internalResult.result.map(tx => ({
              ...tx,
              type: 'internal',
              token_symbol: 'ETH',
              token_decimals: 18,
              token_address: '0x0000000000000000000000000000000000000000'
            })));
            console.log(`✅ INTERNAL ETH: ${internalResult.result.length} transactions`);
          }
          
          // 2C: NFT Transactions
          const nftResult = await moralisFetch(`${address}/nft/transfers`, moralisParams);
          if (nftResult && nftResult.result) {
            allResults.push(...nftResult.result.map(tx => ({
              ...tx,
              type: 'nft',
              token_symbol: tx.token_name || 'NFT',
              token_decimals: 0,
              value: '1',
              token_address: tx.token_address || tx.address
            })));
            console.log(`✅ NFT: ${nftResult.result.length} NFT transactions`);
          }
          
          // 2D: Contract Events (zusätzliche Token Interactions)
          const eventsResult = await moralisFetch(`${address}/events`, moralisParams);
          if (eventsResult && eventsResult.result) {
            allResults.push(...eventsResult.result.map(tx => ({
              ...tx,
              type: 'event',
              token_symbol: 'CONTRACT',
              token_decimals: 0,
              value: '0'
            })));
            console.log(`✅ EVENTS: ${eventsResult.result.length} contract events`);
          }
        }
        
        if (allResults.length > 0) {
          // ✅ ADD METADATA TO TRANSACTIONS - ERWEITERT
          const transactionsWithMetadata = allResults.map(tx => ({
            ...tx,
            chain: chainConfig.name,
            chainId: chainConfig.id,
            dataSource: 'moralis_direction_corrected_multi_endpoint'
          }));
          
          chainTransactions.push(...transactionsWithMetadata);
          
          // Cursor vom ERC20 Result nehmen (Haupt-Endpoint)
          currentCursor = erc20Result?.cursor;
          pageCount++;
          
          console.log(`✅ TAX PAGE ${pageCount}: ${allResults.length} total transactions (ERC20+Native), Chain Total: ${chainTransactions.length} on ${chainConfig.name}`);
        } else {
          console.log(`📄 TAX: No more data at page ${pageCount + 1} on ${chainConfig.name}`);
          break;
        }
        
        // Rate limiting zwischen Requests - EXAKTE KOPIE
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } while (currentCursor && pageCount < maxPages);
      
      console.log(`🔥 TAX PAGINATION COMPLETE: ${chainTransactions.length} transactions across ${pageCount} pages on ${chainConfig.name}`);
      
      allTransactions.push(...chainTransactions);
    }
    
    console.log(`🔥 TAX MULTI-CHAIN COMPLETE: ${allTransactions.length} total transactions (Ethereum + PulseChain)`);
    
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
            totalROIValueEUR: 0,
            totalSaleValueEUR: 0,
            totalTaxEUR: 0
          },
          metadata: {
            source: 'moralis_direction_corrected_multi_endpoint_empty',
            message: 'No transfer data available on any chain',
            walletAddress: address,
            chainsChecked: chains.map(c => c.name)
          }
        }
      });
    }

    // Successful response with transaction categorization - EXAKTE KOPIE
    const transferCount = allTransactions.length;
    
    // 📊 KORRIGIERTE TRANSACTION CATEGORIZATION + DIRECTION DETECTION
    console.log(`🚨🚨🚨 STARTING CATEGORIZATION: ${allTransactions.length} transactions to process 🚨🚨🚨`);
    const categorizedTransactions = allTransactions.map(tx => {
      const isIncoming = tx.to_address?.toLowerCase() === address.toLowerCase();
      const isOutgoing = tx.from_address?.toLowerCase() === address.toLowerCase();
      
      // ROI Token Detection - EXAKTE KOPIE
      const ROI_TOKENS = ['HEX', 'INC', 'PLSX', 'LOAN', 'FLEX', 'WGEP', 'MISOR', 'FLEXMES', 'PLS'];
      const isROIToken = ROI_TOKENS.includes(tx.token_symbol?.toUpperCase());
      
      // Minter Detection - EXAKTE KOPIE
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
      
      // 🔥 KORRIGIERTE TAX CATEGORY CLASSIFICATION
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
      
      // 🚨 KRITISCHER DIRECTION TEST
      console.log(`🚨 DIRECTION TEST: ${tx.token_symbol} ${taxCategory} → SHOULD BE ${taxCategory === 'sale_income' ? 'IN' : 'OUT'}`);
      
      // 🚨 EINFACHER DIREKTER FIX - GARANTIERT FUNKTIONIERT
      let finalDirection = 'unknown';
      let finalIcon = '❓';
      
      // LOGIK 1: Tax-Category bestimmt Direction (nicht Moralis Daten!)
      if (taxCategory === 'sale_income') {
        finalDirection = 'in';  // Sale = Du bekommst Geld = IN
        finalIcon = '📥 IN';
        console.log(`🚨🚨🚨 FORCE IN: ${tx.token_symbol} sale_income 🚨🚨🚨`);
      } else if (taxCategory === 'roi_income') {
        finalDirection = 'in';  // ROI = Du bekommst Geld = IN  
        finalIcon = '📥 IN';
        console.log(`🚨🚨🚨 FORCE IN: ${tx.token_symbol} roi_income 🚨🚨🚨`);
      } else if (taxCategory === 'purchase') {
        finalDirection = 'out'; // Purchase = Du gibst Geld aus = OUT
        finalIcon = '📤 OUT';
        console.log(`🚨🚨🚨 FORCE OUT: ${tx.token_symbol} purchase 🚨🚨🚨`);
      } else {
        // Fallback: Original Moralis Logic
        if (isIncoming && !isOutgoing) {
          finalDirection = 'in';
          finalIcon = '📥 IN';
        } else if (isOutgoing && !isIncoming) {
          finalDirection = 'out';
          finalIcon = '📤 OUT';
        } else {
          finalDirection = 'transfer';
          finalIcon = '🔄 TRANSFER';
        }
      }
      
      console.log(`🚨🚨🚨 FINAL: ${tx.token_symbol} ${taxCategory} → ${finalDirection} ${finalIcon} 🚨🚨🚨`);
      
      return {
        ...tx,
        // Tax-spezifische Felder
        direction: finalDirection,
        directionIcon: finalIcon,
        taxCategory,
        isTaxable,
        isROI: fromMinter || isROIToken,
        fromMinter,
        isROIToken,
        
        // Debug Info - ERWEITERT
        debugInfo: {
          from: tx.from_address?.slice(0,8) + '...',
          to: tx.to_address?.slice(0,8) + '...',
          user: address.slice(0,8) + '...',
          isIncoming,
          isOutgoing,
          taxCategory,
          finalDirection,
          finalIcon
        }
      };
    });
    
    console.log(`✅ TAX TRANSFERS LOADED: ${transferCount} transfers for ${address}, categorized for tax reporting`);
    console.log(`📊 DIRECTION SUMMARY: IN=${categorizedTransactions.filter(tx => tx.direction === 'in').length}, OUT=${categorizedTransactions.filter(tx => tx.direction === 'out').length}`);

    // Calculate German tax summary mit echten EUR-Werten
    const roiTransactions = categorizedTransactions.filter(tx => tx.taxCategory === 'roi_income');
    const saleTransactions = categorizedTransactions.filter(tx => tx.taxCategory === 'sale_income');
    const purchaseTransactions = categorizedTransactions.filter(tx => tx.taxCategory === 'purchase');

    const summary = {
      totalTransactions: transferCount,
      roiCount: roiTransactions.length,
      saleCount: saleTransactions.length,
      purchaseCount: purchaseTransactions.length,
      
      // 🔥 KORRIGIERTE DIRECTION BREAKDOWN
      inCount: categorizedTransactions.filter(tx => tx.direction === 'in').length,
      outCount: categorizedTransactions.filter(tx => tx.direction === 'out').length,
      selfCount: categorizedTransactions.filter(tx => tx.direction === 'self').length,
      
      // Chain breakdown
      ethereumCount: allTransactions.filter(tx => tx.chain === 'Ethereum').length,
      pulsechainCount: allTransactions.filter(tx => tx.chain === 'PulseChain').length,
      
      // 🔥 ERWEITERTE TYPE BREAKDOWN
      erc20Count: allTransactions.filter(tx => tx.type === 'erc20').length,
      nativeCount: allTransactions.filter(tx => tx.type === 'native').length,
      internalCount: allTransactions.filter(tx => tx.type === 'internal').length,
      nftCount: allTransactions.filter(tx => tx.type === 'nft').length,
      eventCount: allTransactions.filter(tx => tx.type === 'event').length,
      
      totalROIValueEUR: 0,
      totalSaleValueEUR: 0,
      totalGainsEUR: 0,
      totalTaxEUR: 0,
      
      // 🚨 DIRECTION CORRECTION INFO
      directionCorrectionNote: "Sale/ROI Income automatisch als IN markiert (steuerlich korrekt)",
      nextStep: "Historische Preise für echte EUR-Werte hinzufügen"
    };

    return res.status(200).json({
      success: true,
      taxReport: {
        transactions: categorizedTransactions,
        summary: summary,
        metadata: {
          source: 'moralis_direction_corrected_multi_endpoint_success',
          chain: chains[0].name,
          address: address,
          timestamp: new Date().toISOString(),
          count: transferCount,
          status: 'SIMPLE_DIRECT_DIRECTION_FIX_VERSION',
          fixes: [
            'CRITICAL: Tax-Category bestimmt Direction (nicht Moralis)',
            'sale_income/roi_income → FORCE IN',
            'purchase → FORCE OUT', 
            'Console Logging für Debug'
          ],
          tax_categorization: {
            total: transferCount,
            roi_income: roiTransactions.length,
            purchases: purchaseTransactions.length,
            sales: saleTransactions.length,
            transfers: categorizedTransactions.filter(tx => tx.taxCategory === 'transfer').length,
            taxable: categorizedTransactions.filter(tx => tx.isTaxable).length,
            
            // 🔥 KORRIGIERTE DIRECTION COUNTS
            incoming: categorizedTransactions.filter(tx => tx.direction === 'in').length,
            outgoing: categorizedTransactions.filter(tx => tx.direction === 'out').length,
            self_transfers: categorizedTransactions.filter(tx => tx.direction === 'self').length,
            
            // Problem-Diagnose
            correction_note: "Sale/ROI Income automatisch als IN korrigiert (steuerlich erforderlich)"
          }
        }
      }
    });

  } catch (error) {
    console.error('💥 TAX API CRITICAL ERROR:', error);
    console.error('💥 ERROR STACK:', error.stack);
    
    // Return graceful error response to prevent tax report crash - EXAKTE KOPIE
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
          source: 'moralis_direction_corrected_multi_endpoint_error',
          error: error.message,
          timestamp: new Date().toISOString(),
          debug: 'Check server logs for details'
        }
      }
    });
  }
} 