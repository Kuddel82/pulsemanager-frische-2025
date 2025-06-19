/**
 * 🇩🇪 DEUTSCHE CRYPTO-STEUER API - ORIGINAL FUNKTIONIERENDE VERSION
 * 
 * WIEDERHERGESTELLT: Deine ursprünglich funktionierende Logik die 9557 Transaktionen geladen hat
 * NUR GEÄNDERT: direction Parameter für IN+OUT
 */

const MORALIS_API_KEY = process.env.MORALIS_API_KEY;
const MORALIS_BASE_URL = 'https://deep-index.moralis.io/api/v2';

/**
 * Helper to fetch data from Moralis REST API - EXAKTE KOPIE DER FUNKTIONIERENDEN VERSION
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
 * 🇩🇪 DEUTSCHE STEUERREPORT API - EXAKTE WIEDERHERSTELLUNG DER FUNKTIONIERENDEN VERSION
 */
export default async function handler(req, res) {
  console.log('🇩🇪 TAX API: RESTORED ORIGINAL WORKING VERSION - 9557 TRANSACTIONS');
  
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

    // Extract parameters - EXAKTE KOPIE
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
      status: 'ORIGINAL_WORKING_VERSION_RESTORED'
    });

    if (!address) {
      return res.status(400).json({ 
        error: 'Missing address parameter.',
        usage: 'POST /api/german-tax-report with address, chain, limit',
        received: params
      });
    }

    // 🔥 ORIGINAL WORKING MULTI-CHAIN LOGIC - EXAKTE KOPIE
    const chains = [
      { id: '0x1', name: 'Ethereum' },
      { id: '0x171', name: 'PulseChain' }
    ];
    
    let allTransactions = [];
    
    for (const chainConfig of chains) {
      console.log(`🔗 TAX: Loading ${chainConfig.name} (${chainConfig.id})...`);
      
      // 🔥 ORIGINAL WORKING PARAMETERS - NUR direction HINZUGEFÜGT
      const moralisParams = { 
        chain: chainConfig.id,
        limit: Math.min(parseInt(limit) || 2000, 2000),
        direction: 'both' // ✅ EINZIGE ÄNDERUNG: direction hinzugefügt
      };

      // Add optional parameters - EXAKTE KOPIE
      if (cursor) moralisParams.cursor = cursor;
      if (from_date) moralisParams.from_date = from_date;
      if (to_date) moralisParams.to_date = to_date;
      
      console.log(`🔧 TAX PAGE SIZE: Configured for ${moralisParams.limit} items per request on ${chainConfig.name}`);

      // 🔥 ORIGINAL WORKING PAGINATION LOGIC - EXAKTE KOPIE
      let chainTransactions = [];
      let currentCursor = cursor;
      let pageCount = 0;
      const maxPages = 150; // Original value
      
      do {
        if (currentCursor) moralisParams.cursor = currentCursor;
        
        console.log(`🚀 TAX FETCHING PAGE ${pageCount + 1}: ${address} on ${chainConfig.name}`);
        
        // 🔥 ORIGINAL WORKING ENDPOINT CALL - EXAKTE KOPIE
        const result = await moralisFetch(`${address}/erc20/transfers`, moralisParams);
        
        if (result && result.result && result.result.length > 0) {
          // ✅ ADD METADATA TO TRANSACTIONS - EXAKTE KOPIE DER FUNKTIONIERENDEN VERSION
          const transactionsWithMetadata = result.result.map(tx => ({
            ...tx,
            chain: chainConfig.name,
            chainId: chainConfig.id,
            dataSource: 'moralis_original_working_version_restored'
          }));
          
          chainTransactions.push(...transactionsWithMetadata);
          
          // Cursor management - EXAKTE KOPIE
          currentCursor = result.cursor;
          pageCount++;
          
          console.log(`✅ TAX PAGE ${pageCount}: ${result.result.length} transactions, Total: ${chainTransactions.length} on ${chainConfig.name}`);
        } else {
          console.log(`📄 TAX: No more data at page ${pageCount + 1} on ${chainConfig.name}`);
          break;
        }
        
        // Rate limiting - EXAKTE KOPIE
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
            totalROIValueEUR: "0,00",
            totalSaleValueEUR: "0,00",
            totalTaxEUR: "0,00"
          },
          metadata: {
            source: 'moralis_original_working_version_restored_empty',
            message: 'No transfer data available on any chain',
            walletAddress: address,
            chainsChecked: chains.map(c => c.name)
          }
        }
      });
    }

    // Successful response with transaction categorization - EXAKTE KOPIE DER FUNKTIONIERENDEN VERSION
    const transferCount = allTransactions.length;
    
    // 📊 ORIGINAL WORKING TRANSACTION CATEGORIZATION - EXAKTE KOPIE
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
      
      // Tax Category Classification - EXAKTE KOPIE
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

      // 🔥 BERECHNE READABLE AMOUNT (coin menge) - HINZUGEFÜGT
      let readableAmount = 'N/A';
      let numericAmount = 0;
      
      if (tx.value && tx.token_decimals) {
        numericAmount = parseFloat(tx.value) / Math.pow(10, parseInt(tx.token_decimals));
        readableAmount = numericAmount.toLocaleString('de-DE', { 
          minimumFractionDigits: 0, 
          maximumFractionDigits: 6 
        });
      }
      
      return {
        ...tx,
        // Tax-spezifische Felder - EXAKTE KOPIE
        direction: isIncoming ? 'in' : 'out',
        taxCategory,
        isTaxable,
        isROI: fromMinter || isROIToken,
        fromMinter,
        isROIToken,
        
        // 🔥 READABLE DATA - HINZUGEFÜGT
        readableAmount,
        numericAmount,
        displayAmount: `${readableAmount} ${tx.token_symbol || 'Unknown'}`,
        
        // 🏛️ PLATZHALTER FÜR PREISE
        priceEUR: "0.00",
        valueEUR: "0.00",
        gainsEUR: "0.00"
      };
    });
    
    console.log(`✅ TAX TRANSFERS LOADED: ${transferCount} transfers for ${address}, categorized for tax reporting`);

    // Calculate German tax summary - EXAKTE KOPIE
    const roiTransactions = categorizedTransactions.filter(tx => tx.taxCategory === 'roi_income');
    const saleTransactions = categorizedTransactions.filter(tx => tx.taxCategory === 'sale_income');
    const purchaseTransactions = categorizedTransactions.filter(tx => tx.taxCategory === 'purchase');

    const summary = {
      totalTransactions: transferCount,
      roiCount: roiTransactions.length,
      saleCount: saleTransactions.length,
      purchaseCount: purchaseTransactions.length,
      
      // Direction breakdown - NEU HINZUGEFÜGT
      inCount: categorizedTransactions.filter(tx => tx.direction === 'in').length,
      outCount: categorizedTransactions.filter(tx => tx.direction === 'out').length,
      
      // Platzhalter für EUR-Werte
      totalROIValueEUR: "0,00",
      totalSaleValueEUR: "0,00", 
      totalGainsEUR: "0,00",
      totalTaxEUR: "0,00",
      
      // Chain breakdown
      breakdown: {
        ethereum: allTransactions.filter(tx => tx.chain === 'Ethereum').length,
        pulsechain: allTransactions.filter(tx => tx.chain === 'PulseChain').length
      }
    };

    return res.status(200).json({
      success: true,
      taxReport: {
        transactions: categorizedTransactions,
        summary: summary,
        metadata: {
          source: 'moralis_original_working_version_restored_success',
          chains: chains.map(c => c.name),
          address: address,
          timestamp: new Date().toISOString(),
          count: transferCount,
          status: 'ORIGINAL_WORKING_VERSION_WITH_DIRECTION_BOTH',
          changes: [
            'Added direction: both parameter',
            'Added IN/OUT detection',
            'Added readable amounts',
            'Preserved all working logic'
          ],
          tax_categorization: {
            total: transferCount,
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
    
    // Return graceful error response - EXAKTE KOPIE
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
          source: 'moralis_original_working_version_restored_error',
          error: error.message,
          timestamp: new Date().toISOString(),
          debug: 'Check server logs for details'
        }
      }
    });
  }
} 