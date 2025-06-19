/**
 * 🇩🇪 DEUTSCHE CRYPTO-STEUER API - STABILE VERSION 
 * 
 * ZUERST: Funktionalität + IN/OUT Transaktionen
 * DANN: Historische Preise intelligent hinzufügen
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
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
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
 * 🇩🇪 DEUTSCHE STEUERREPORT API - STABILE VERSION + IN/OUT FIX
 */
export default async function handler(req, res) {
  console.log('🇩🇪 TAX API: Starting STABLE VERSION - IN/OUT TRANSACTIONS FIX');
  
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
      status: 'STABLE_IN_OUT_TRANSACTIONS_FIX'
    });

    if (!address) {
      return res.status(400).json({ 
        error: 'Missing address parameter.',
        usage: 'POST /api/german-tax-report with address, chain, limit',
        received: params
      });
    }

    // 🔥 MULTI-CHAIN: Lade BEIDE Chains mit richtigen Parametern
    const chains = [
      { id: '0x1', name: 'Ethereum', moralisChain: 'eth' },
      { id: '0x171', name: 'PulseChain', moralisChain: 'pulsechain' }
    ];
    
    let allTransactions = [];
    
    for (const chainConfig of chains) {
      console.log(`🔗 TAX: Loading ${chainConfig.name} (${chainConfig.id})...`);
      
      // 🔥 KORRIGIERTE PARAMETER - Moralis erwartet diese Werte
      const moralisParams = { 
        chain: chainConfig.moralisChain, // ✅ 'eth' statt '0x1'
        limit: Math.min(parseInt(limit) || 1000, 1000),
        order: 'DESC' // Neueste zuerst
      };

      // Add optional parameters
      if (cursor) moralisParams.cursor = cursor;
      if (from_date) moralisParams.from_date = from_date;
      if (to_date) moralisParams.to_date = to_date;
      
      console.log(`🔧 TAX PARAMS: Chain ${chainConfig.name}:`, moralisParams);

      // 🔥 LOAD ALL TRANSACTION TYPES FÜR VOLLSTÄNDIGE IN/OUT ABDECKUNG
      let chainTransactions = [];
      let currentCursor = cursor;
      let pageCount = 0;
      const maxPages = 50; // Reduziert für Performance
      
      do {
        if (currentCursor) moralisParams.cursor = currentCursor;
        
        console.log(`🚀 TAX FETCHING PAGE ${pageCount + 1}: ${address} on ${chainConfig.name}`);
        
        let allResults = [];
        
        // 🔥 ENDPOINT 1: ERC20 TRANSFERS (Haupt-Endpoint)
        console.log(`📤 Loading ERC20 transfers for ${chainConfig.name}...`);
        const erc20Result = await moralisFetch(`${address}/erc20/transfers`, moralisParams);
        
        if (erc20Result && erc20Result.result) {
          const erc20Transactions = erc20Result.result.map(tx => ({
            ...tx, 
            type: 'erc20',
            chain: chainConfig.name,
            chainId: chainConfig.id
          }));
          allResults.push(...erc20Transactions);
          console.log(`✅ ERC20: ${erc20Transactions.length} transactions on ${chainConfig.name}`);
        }
        
        // 🔥 ENDPOINT 2: NATIVE TRANSACTIONS (ETH für Ethereum)
        if (chainConfig.id === '0x1') {
          console.log(`💰 Loading Native ETH transactions for ${chainConfig.name}...`);
          const nativeResult = await moralisFetch(`${address}`, moralisParams);
          
          if (nativeResult && nativeResult.result) {
            const nativeTransactions = nativeResult.result.map(tx => ({
              ...tx,
              type: 'native',
              token_symbol: 'ETH',
              token_decimals: 18,
              chain: chainConfig.name,
              chainId: chainConfig.id
            }));
            allResults.push(...nativeTransactions);
            console.log(`✅ NATIVE: ${nativeTransactions.length} ETH transactions on ${chainConfig.name}`);
          }
        }
        
        // 🔥 ENDPOINT 3: NFT TRANSFERS (für komplette Abdeckung)
        console.log(`🎨 Loading NFT transfers for ${chainConfig.name}...`);
        const nftResult = await moralisFetch(`${address}/nft/transfers`, moralisParams);
        
        if (nftResult && nftResult.result) {
          const nftTransactions = nftResult.result.map(tx => ({
            ...tx,
            type: 'nft', 
            value: '1', // NFTs haben value 1
            token_decimals: 0,
            chain: chainConfig.name,
            chainId: chainConfig.id
          }));
          allResults.push(...nftTransactions);
          console.log(`✅ NFT: ${nftTransactions.length} NFT transactions on ${chainConfig.name}`);
        }
        
        if (allResults.length > 0) {
          // ✅ ADD METADATA TO TRANSACTIONS - OHNE LANGSAME PREIS-CALLS
          const transactionsWithMetadata = allResults.map(tx => {
            // 🔥 BERECHNE READABLE AMOUNT
            let readableAmount = 'N/A';
            let numericAmount = 0;
            
            if (tx.value && tx.token_decimals !== undefined) {
              const decimals = parseInt(tx.token_decimals) || 0;
              numericAmount = parseFloat(tx.value) / Math.pow(10, decimals);
              readableAmount = numericAmount.toLocaleString('de-DE', { 
                minimumFractionDigits: 0, 
                maximumFractionDigits: 6 
              });
            }

            // 🔍 DIRECTION DETECTION (IN/OUT)
            const isIncoming = tx.to_address?.toLowerCase() === address.toLowerCase();
            const isOutgoing = tx.from_address?.toLowerCase() === address.toLowerCase();
            
            let direction = 'unknown';
            if (isIncoming && !isOutgoing) direction = 'in';
            else if (isOutgoing && !isIncoming) direction = 'out';
            else if (isIncoming && isOutgoing) direction = 'self';

            return {
              ...tx,
              dataSource: 'moralis_stable_in_out_fix',
              
              // 🔥 READABLE DATA
              readableAmount,
              numericAmount,
              displayAmount: `${readableAmount} ${tx.token_symbol || 'Unknown'}`,
              direction,
              
              // 🏛️ PLATZHALTER FÜR PREISE (später hinzufügen)
              priceEUR: "0.00", // Später: Historische Preise
              valueEUR: "0.00", // Später: Berechnete Werte
              timestamp: tx.block_timestamp
            };
          });
          
          chainTransactions.push(...transactionsWithMetadata);
          
          // Cursor management 
          currentCursor = erc20Result?.cursor || nftResult?.cursor;
          pageCount++;
          
          console.log(`✅ TAX PAGE ${pageCount}: ${allResults.length} total transactions, Chain Total: ${chainTransactions.length} on ${chainConfig.name}`);
          
          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        } else {
          console.log(`📄 TAX: No more data at page ${pageCount + 1} on ${chainConfig.name}`);
          break;
        }
        
      } while (currentCursor && pageCount < maxPages);
      
      console.log(`🔥 TAX CHAIN COMPLETE: ${chainTransactions.length} transactions across ${pageCount} pages on ${chainConfig.name}`);
      
      allTransactions.push(...chainTransactions);
    }
    
    console.log(`🔥 TAX MULTI-CHAIN COMPLETE: ${allTransactions.length} total transactions (ALL CHAINS)`);
    
    if (allTransactions.length === 0) {
      console.warn(`⚠️ TAX NO DATA: Returning empty result for ${address}`);
      return res.status(200).json({
        success: true,
        taxReport: {
          transactions: [],
          summary: {
            totalTransactions: 0,
            inCount: 0,
            outCount: 0,
            roiCount: 0,
            saleCount: 0,
            totalGainsEUR: "0,00"
          },
          metadata: {
            source: 'moralis_stable_in_out_fix_empty',
            message: 'No transaction data available',
            walletAddress: address,
            chainsChecked: chains.map(c => c.name)
          }
        }
      });
    }

    // 📊 TRANSACTION CATEGORIZATION für Tax Report
    const categorizedTransactions = allTransactions.map(tx => {
      const isIncoming = tx.direction === 'in';
      const isOutgoing = tx.direction === 'out';
      
      // ROI Token Detection
      const ROI_TOKENS = ['HEX', 'INC', 'PLSX', 'LOAN', 'FLEX', 'WGEP', 'MISOR', 'FLEXMES', 'PLS'];
      const isROIToken = ROI_TOKENS.includes(tx.token_symbol?.toUpperCase());
      
      // Minter Detection
      const KNOWN_MINTERS = [
        '0x0000000000000000000000000000000000000000',
        '0x2b591e99afe9f32eaa6214f7b7629768c40eeb39',
        '0x8bd3d1472a656e312e94fb1bbdd599b8c51d18e3'
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
      
      return {
        ...tx,
        taxCategory,
        isTaxable,
        isROI: fromMinter || isROIToken,
        fromMinter,
        isROIToken,
        gainsEUR: "0,00" // Später mit historischen Preisen berechnen
      };
    });
    
    console.log(`✅ TAX CATEGORIZATION COMPLETE: ${categorizedTransactions.length} transactions categorized`);

    // Calculate summary
    const inTransactions = categorizedTransactions.filter(tx => tx.direction === 'in');
    const outTransactions = categorizedTransactions.filter(tx => tx.direction === 'out');
    const roiTransactions = categorizedTransactions.filter(tx => tx.taxCategory === 'roi_income');
    const saleTransactions = categorizedTransactions.filter(tx => tx.taxCategory === 'sale_income');
    const purchaseTransactions = categorizedTransactions.filter(tx => tx.taxCategory === 'purchase');

    const summary = {
      totalTransactions: categorizedTransactions.length,
      inCount: inTransactions.length,
      outCount: outTransactions.length,
      roiCount: roiTransactions.length,
      saleCount: saleTransactions.length,
      purchaseCount: purchaseTransactions.length,
      transferCount: categorizedTransactions.filter(tx => tx.taxCategory === 'transfer').length,
      
      // Platzhalter für Preis-basierte Berechnungen
      totalGainsEUR: "0,00", // Später mit historischen Preisen
      totalTaxEUR: "0,00",   // Später mit historischen Preisen
      
      // Zeige Transaktions-Verteilung
      breakdown: {
        ethereum: allTransactions.filter(tx => tx.chain === 'Ethereum').length,
        pulsechain: allTransactions.filter(tx => tx.chain === 'PulseChain').length,
        erc20: allTransactions.filter(tx => tx.type === 'erc20').length,
        native: allTransactions.filter(tx => tx.type === 'native').length,
        nft: allTransactions.filter(tx => tx.type === 'nft').length
      }
    };

    console.log(`🎯 TRANSACTION BREAKDOWN:`, summary.breakdown);

    return res.status(200).json({
      success: true,
      taxReport: {
        transactions: categorizedTransactions,
        summary: summary,
        metadata: {
          source: 'moralis_stable_in_out_fix_success',
          chains: chains.map(c => c.name),
          address: address,
          timestamp: new Date().toISOString(),
          count: categorizedTransactions.length,
          status: 'STABLE_IN_OUT_TRANSACTIONS_LOADED',
          features: [
            'MULTI_CHAIN_SUPPORT',
            'IN_OUT_DETECTION', 
            'ERC20_NATIVE_NFT',
            'TAX_CATEGORIZATION',
            'READABLE_AMOUNTS'
          ],
          note: 'Historische Preise werden in nächstem Update hinzugefügt',
          tax_categorization: {
            total: categorizedTransactions.length,
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
    
    return res.status(200).json({
      success: true,
      taxReport: {
        transactions: [],
        summary: {
          totalTransactions: 0,
          inCount: 0,
          outCount: 0,
          totalGainsEUR: "0,00"
        },
        metadata: {
          source: 'moralis_stable_in_out_fix_error',
          error: error.message,
          timestamp: new Date().toISOString()
        }
      }
    });
  }
} 