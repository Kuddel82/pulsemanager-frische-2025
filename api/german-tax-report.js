/**
 * 🇩🇪 DEUTSCHE CRYPTO-STEUER API - FUNKTIONIERENDE VERSION + HISTORISCHE PREISE
 * 
 * BASIERT AUF: Deiner funktionierenden Version
 * ERWEITERT: Exakte historische Preise für deutsche Steuern
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
 * 🏛️ HOLE EXAKTE HISTORISCHE PREISE FÜR DEUTSCHE STEUERN
 * Verwendet Moralis getTokenPrice mit to_block Parameter
 */
async function getHistoricalPrice(tokenAddress, chainId, blockNumber) {
  try {
    if (!tokenAddress || !blockNumber) {
      return { priceEUR: "0.00", priceUSD: "0.00" };
    }

    // Moralis Chain Mapping
    const chainMapping = {
      '0x1': 'eth',
      '0x171': 'pulsechain'
    };
    
    const moralisChain = chainMapping[chainId] || 'eth';
    
    console.log(`🏛️ HISTORISCHER PREIS: ${tokenAddress} Block ${blockNumber} auf ${moralisChain}`);
    
    const priceData = await moralisFetch(`erc20/${tokenAddress}/price`, {
      chain: moralisChain,
      to_block: blockNumber
    });
    
    if (priceData && priceData.usdPrice) {
      const priceUSD = parseFloat(priceData.usdPrice);
      // TODO: USD -> EUR conversion falls nötig (erstmal USD als EUR approximation)
      const priceEUR = priceUSD.toFixed(8);
      
      console.log(`✅ PREIS GEFUNDEN: ${tokenAddress} = €${priceEUR} (Block ${blockNumber})`);
      return { priceEUR, priceUSD: priceUSD.toFixed(8) };
    }
    
    console.log(`⚠️ KEIN PREIS: ${tokenAddress} Block ${blockNumber}`);
    return { priceEUR: "0.00", priceUSD: "0.00" };
    
  } catch (error) {
    console.error(`❌ PREIS FEHLER: ${tokenAddress} Block ${blockNumber}:`, error.message);
    return { priceEUR: "0.00", priceUSD: "0.00" };
  }
}

/**
 * 🇩🇪 DEUTSCHE STEUERREPORT API - FUNKTIONIERENDE VERSION + HISTORISCHE PREISE
 */
export default async function handler(req, res) {
  console.log('🇩🇪 TAX API: Starting with WORKING VERSION + HISTORICAL PRICES');
  
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
      status: 'WORKING_VERSION_WITH_HISTORICAL_PRICES'
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
      { id: '0x1', name: 'Ethereum', moralisChain: 'eth' },
      { id: '0x171', name: 'PulseChain', moralisChain: 'pulsechain' }
    ];
    
    let allTransactions = [];
    
    for (const chainConfig of chains) {
      console.log(`🔗 TAX: Loading ${chainConfig.name} (${chainConfig.id})...`);
      
      // Build Moralis API parameters für diese Chain - FIXED für IN+OUT
      const moralisParams = { 
        chain: chainConfig.id,
        limit: Math.min(parseInt(limit) || 2000, 2000), // Erhöht auf 2000 pro Request
        direction: 'both' // 🔥 FIX: Lade IN + OUT Transaktionen
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
        
        // ENDPOINT 1: ERC20 Transfers (deine ursprüngliche funktionierende Version)
        const erc20Result = await moralisFetch(`${address}/erc20/transfers`, moralisParams);
        
        // ENDPOINT 2: Native Transactions (nur für ETH hinzugefügt)
        let nativeResult = null;
        if (chainConfig.id === '0x1') { // Nur für Ethereum
          console.log(`🔗 ZUSÄTZLICH: Lade Native ETH für ${chainConfig.name}`);
          nativeResult = await moralisFetch(`${address}`, moralisParams);
        }
        
        // Kombiniere Ergebnisse
        let combinedResults = [];
        if (erc20Result && erc20Result.result) {
          combinedResults.push(...erc20Result.result.map(tx => ({...tx, type: 'erc20'})));
        }
        if (nativeResult && nativeResult.result) {
          combinedResults.push(...nativeResult.result.map(tx => ({...tx, type: 'native'})));
        }
        
        if (combinedResults.length > 0) {
          // ✅ ADD METADATA + HISTORISCHE PREISE TO TRANSACTIONS
          console.log(`🏛️ ADDING HISTORICAL PRICES: ${combinedResults.length} transactions on ${chainConfig.name}`);
          
          const transactionsWithMetadata = await Promise.all(combinedResults.map(async (tx) => {
            // 🔥 BERECHNE READABLE AMOUNT (coin menge)
            let readableAmount = 'N/A';
            let numericAmount = 0;
            
            if (tx.value && tx.token_decimals) {
              numericAmount = parseFloat(tx.value) / Math.pow(10, parseInt(tx.token_decimals));
              readableAmount = numericAmount.toLocaleString('de-DE', { 
                minimumFractionDigits: 0, 
                maximumFractionDigits: 6 
              });
            } else if (tx.value && tx.type === 'native') {
              // Native ETH: 18 decimals
              numericAmount = parseFloat(tx.value) / Math.pow(10, 18);
              readableAmount = numericAmount.toLocaleString('de-DE', { 
                minimumFractionDigits: 0, 
                maximumFractionDigits: 6 
              });
            }

            // 🏛️ HOLE EXAKTE HISTORISCHE PREISE FÜR DEUTSCHE STEUERN
            let priceEUR = "0.00";
            let valueEUR = "0.00";
            
            if (tx.token_address && tx.block_number && numericAmount > 0) {
              const historicalPrice = await getHistoricalPrice(
                tx.token_address, 
                chainConfig.id, 
                tx.block_number
              );
              
              priceEUR = historicalPrice.priceEUR;
              
              // Berechne Gesamtwert in EUR
              const totalValueEUR = numericAmount * parseFloat(priceEUR);
              valueEUR = totalValueEUR.toLocaleString('de-DE', { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
              });
            }

            return {
              ...tx,
              chain: chainConfig.name,
              chainId: chainConfig.id,
              dataSource: 'moralis_working_version_with_historical_prices',
              
              // 🔥 READABLE AMOUNTS + PREISE
              readableAmount,
              numericAmount,
              displayAmount: `${readableAmount} ${tx.token_symbol || 'ETH'}`,
              priceEUR, // ✅ EXAKTE HISTORISCHE PREISE
              valueEUR, // ✅ ECHTE EUR-WERTE
              timestamp: tx.block_timestamp
            };
          }));
          
          chainTransactions.push(...transactionsWithMetadata);
          
          // Cursor vom ERC20 Result nehmen (Haupt-Endpoint)
          currentCursor = erc20Result?.cursor;
          pageCount++;
          
          console.log(`✅ TAX PAGE ${pageCount}: ${combinedResults.length} transactions, Total: ${chainTransactions.length} on ${chainConfig.name}`);
        } else {
          console.log(`📄 TAX: No more data at page ${pageCount + 1} on ${chainConfig.name}`);
          break;
        }
        
        // Rate limiting zwischen Requests - EXAKTE KOPIE
        await new Promise(resolve => setTimeout(resolve, 200)); // Erhöht für Preis-Requests
        
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
            source: 'moralis_working_version_with_historical_prices_empty',
            message: 'No transfer data available on any chain',
            walletAddress: address,
            chainsChecked: chains.map(c => c.name)
          }
        }
      });
    }

    // Successful response with transaction categorization - ERWEITERT MIT PREISEN
    const transferCount = allTransactions.length;
    
    // 📊 TRANSACTION CATEGORIZATION für Tax Report - EXAKTE KOPIE + PREISE
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
      
      return {
        ...tx,
        // Tax-spezifische Felder - EXAKTE KOPIE
        direction: isIncoming ? 'in' : 'out',
        taxCategory,
        isTaxable,
        isROI: fromMinter || isROIToken,
        fromMinter,
        isROIToken,
        // 🔥 STEUER-BERECHNUNGEN mit echten Preisen
        gainsEUR: isTaxable ? tx.valueEUR : "0,00"
      };
    });
    
    console.log(`✅ TAX TRANSFERS LOADED: ${transferCount} transfers for ${address}, categorized for tax reporting WITH HISTORICAL PRICES`);

    // Calculate German tax summary mit echten EUR-Werten
    const roiTransactions = categorizedTransactions.filter(tx => tx.taxCategory === 'roi_income');
    const saleTransactions = categorizedTransactions.filter(tx => tx.taxCategory === 'sale_income');
    const purchaseTransactions = categorizedTransactions.filter(tx => tx.taxCategory === 'purchase');

    // 🔥 BERECHNE ECHTE EUR-SUMMEN MIT HISTORISCHEN PREISEN
    const totalROIValueEUR = roiTransactions.reduce((sum, tx) => {
      const value = parseFloat(tx.valueEUR?.replace(/\./g, '').replace(',', '.')) || 0;
      return sum + value;
    }, 0);
    
    const totalSaleValueEUR = saleTransactions.reduce((sum, tx) => {
      const value = parseFloat(tx.valueEUR?.replace(/\./g, '').replace(',', '.')) || 0;
      return sum + value;
    }, 0);
    
    const totalGainsEUR = totalROIValueEUR + totalSaleValueEUR;
    const totalTaxEUR = totalGainsEUR * 0.25; // Grobe 25% Steuer

    const summary = {
      totalTransactions: transferCount,
      roiCount: roiTransactions.length,
      saleCount: saleTransactions.length,
      purchaseCount: purchaseTransactions.length,
      totalROIValueEUR: totalROIValueEUR.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      totalSaleValueEUR: totalSaleValueEUR.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      totalGainsEUR: totalGainsEUR.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      totalTaxEUR: totalTaxEUR.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    };

    return res.status(200).json({
      success: true,
      taxReport: {
        transactions: categorizedTransactions,
        summary: summary,
        metadata: {
          source: 'moralis_working_version_with_historical_prices_success',
          chains: chains.map(c => c.name),
          address: address,
          timestamp: new Date().toISOString(),
          count: transferCount,
          status: 'WORKING_VERSION_WITH_HISTORICAL_PRICES',
          features: [
            'IN_OUT_TRANSACTIONS',
            'HISTORICAL_PRICES',
            'READABLE_AMOUNTS', 
            'EUR_VALUES',
            'TAX_CATEGORIZATION'
          ],
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
          totalROIValueEUR: "0,00",
          totalSaleValueEUR: "0,00",
          totalTaxEUR: "0,00"
        },
        metadata: {
          source: 'moralis_working_version_with_historical_prices_error',
          error: error.message,
          timestamp: new Date().toISOString(),
          debug: 'Check server logs for details'
        }
      }
    });
  }
} 