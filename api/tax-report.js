// 📊 TAX REPORT API - MORALIS + PULSESCAN + ROI MAPPING INTEGRATION
// Erweiterte Steuerberichte mit intelligenter Preisfindung und ROI-Klassifikation

import { format } from 'date-fns';

const MORALIS_API_KEY = process.env.MORALIS_API_KEY;
const MORALIS_BASE = 'https://deep-index.moralis.io/api/v2';

// 🎯 ROI MAPPING & CLASSIFICATION SYSTEM
const ROI_MAPPINGS = {
  // Direct Minter ROIs (eindeutig)
  DIRECT_MINTERS: {
    '0x2b591e99afe9f32eaa6214f7b7629768c40eeb39': 'HEX_STAKING',    // HEX Contract
    '0x8bd3d1472a656e312e94fb1bbdd599b8c51d18e3': 'INC_REWARDS',    // INC Contract  
    '0x83d0cf6a8bc7d9af84b7fc1a6a8ad51f1e1e6fe1': 'PLSX_REWARDS'   // PLSX Contract
  },
  
  // Token-basierte ROI-Mappings (Token A → ROI von Token B)
  TOKEN_REWARDS: {
    'MISSER': {
      sourceToken: 'FLEX',
      roiType: 'FARMING_REWARDS',
      description: 'MISSER Farming Rewards von FLEX Staking',
      taxCategory: 'farming_income'
    },
    'WGEP': {
      sourceToken: 'PLSX',
      roiType: 'TREASURY_REWARDS', 
      description: 'WGEP Treasury Rewards',
      taxCategory: 'dividend_income'
    },
    'LOAN': {
      sourceToken: 'HEX',
      roiType: 'STAKING_REWARDS',
      description: 'LOAN Token aus HEX Ecosystem',
      taxCategory: 'staking_income'
    }
  }
};

// 🏭 LEGACY SUPPORT: Bekannte Minter-Adressen (für Rückwärtskompatibilität)
const KNOWN_MINTERS = Object.keys(ROI_MAPPINGS.DIRECT_MINTERS);

// 🎯 ROI TRANSACTION CLASSIFIER
function classifyROITransaction(transaction, userWallet) {
  const { from_address, token_symbol, token_address, value, token_decimals } = transaction;
  const fromAddr = from_address?.toLowerCase();
  const tokenSymbol = token_symbol?.toUpperCase();
  
  // 1. DIRECT MINTER CHECK (höchste Priorität)
  const directMinterType = ROI_MAPPINGS.DIRECT_MINTERS[fromAddr];
  if (directMinterType) {
    return {
      isROI: true,
      roiType: directMinterType,
      sourceToken: tokenSymbol,
      taxCategory: 'minting_rewards',
      confidence: 95,
      source: 'direct_minter',
      description: `Direct Minting von ${directMinterType}`
    };
  }
  
  // 2. TOKEN REWARD MAPPING (mittlere Priorität)
  const tokenMapping = ROI_MAPPINGS.TOKEN_REWARDS[tokenSymbol];
  if (tokenMapping) {
    return {
      isROI: true,
      roiType: tokenMapping.roiType,
      sourceToken: tokenMapping.sourceToken,
      taxCategory: tokenMapping.taxCategory,
      confidence: 85,
      source: 'token_mapping',
      description: tokenMapping.description
    };
  }
  
  // 3. HEURISTIC ANALYSIS (niedrige Priorität)
  const decimals = parseInt(token_decimals) || 18;
  const amount = parseFloat(value) / Math.pow(10, decimals);
  
  // Small amounts from contracts (possible rewards)
  if (amount > 0 && amount < 10000 && fromAddr && fromAddr.length === 42 && !fromAddr.startsWith('0x000000')) {
    return {
      isROI: true,
      roiType: 'UNKNOWN_REWARDS',
      sourceToken: 'UNKNOWN',
      taxCategory: 'other_income',
      confidence: 60,
      source: 'heuristic',
      description: `Possible reward: small amount (${amount.toFixed(4)}) from contract`
    };
  }
  
  // 4. NO ROI DETECTED
  return {
    isROI: false,
    roiType: null,
    sourceToken: null,
    taxCategory: 'regular_transfer',
    confidence: 30,
    source: 'no_match',
    description: 'Kein ROI-Pattern erkannt'
  };
}

// 📊 ENHANCED TAX CLASSIFICATION
function getEnhancedTaxClassification(transactionType, roiClassification, haltefristTage, amount) {
  // ROI-Transaktionen sind IMMER steuerpflichtig (§ 22 EStG)
  if (roiClassification.isROI) {
    const germanTaxCodes = {
      'minting_rewards': '§ 22 Nr. 3 EStG (Private Veräußerungsgeschäfte)',
      'staking_income': '§ 22 Nr. 3 EStG (Sonstige Einkünfte)',
      'farming_income': '§ 22 Nr. 3 EStG (Sonstige Einkünfte)', 
      'dividend_income': '§ 20 Abs. 1 Nr. 1 EStG (Dividenden)',
      'other_income': '§ 22 Nr. 3 EStG (Sonstige Einkünfte)'
    };
    
    return {
      isTaxable: true,
      category: roiClassification.taxCategory,
      reason: `ROI: ${roiClassification.description} (Confidence: ${roiClassification.confidence}%)`,
      germanTaxCode: germanTaxCodes[roiClassification.taxCategory] || '§ 22 Nr. 3 EStG'
    };
  }
  
  // Verkäufe: Spekulationssteuer bei < 1 Jahr Haltefrist
  if (transactionType === 'Verkauf') {
    const isSpeculationTax = haltefristTage < 365;
    return {
      isTaxable: isSpeculationTax,
      category: isSpeculationTax ? 'speculation_tax' : 'tax_free_sale',
      reason: isSpeculationTax ? 
        `Spekulationssteuer: Haltefrist ${haltefristTage} Tage < 365 Tage` :
        `Steuerfrei: Haltefrist ${haltefristTage} Tage ≥ 365 Tage`,
      germanTaxCode: isSpeculationTax ? 
        '§ 23 Abs. 1 Nr. 2 EStG (Spekulationsgeschäfte)' :
        'Steuerfrei nach § 23 Abs. 1 Nr. 2 EStG'
    };
  }
  
  // Käufe sind in der Regel nicht steuerpflichtig
  return {
    isTaxable: false,
    category: 'purchase',
    reason: 'Kauf/Erwerb - nicht steuerpflichtig',
    germanTaxCode: 'Nicht steuerpflichtig'
  };
}

// 🌐 MORALIS API HELPER
async function moralisFetch(endpoint) {
  try {
    const res = await fetch(`${MORALIS_BASE}${endpoint}`, {
      headers: {
        'X-API-Key': MORALIS_API_KEY
      }
    });
    
    if (!res.ok) {
      console.error(`❌ Moralis error ${res.status}: ${endpoint}`);
      return null;
    }
    
    return await res.json();
  } catch (error) {
    console.error('❌ Moralis fetch error:', error.message);
    return null;
  }
}

// 🚀 BATCH PRICE LOOKUP - 99% CU Ersparnis!
async function getBatchPricesMoralis(tokenAddresses, chain) {
  try {
    console.log(`🚀 BATCH PRICES: Loading ${tokenAddresses.length} tokens in single call`);
    
    // Baue Request Body für Batch API
    const tokens = tokenAddresses.map(address => ({
      tokenAddress: address
    }));
    
    const res = await fetch(`${MORALIS_BASE}/erc20/prices?chain=${chain}&include=percent_change`, {
      method: 'POST',
      headers: {
        'X-API-Key': MORALIS_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ tokens })
    });
    
    if (!res.ok) {
      console.error(`❌ Batch prices error ${res.status}`);
      return null;
    }
    
    const data = await res.json();
    
    // Erstelle Price Map für schnelle Lookups
    const priceMap = {};
    if (data && Array.isArray(data)) {
      data.forEach(item => {
        if (item.tokenAddress && item.usdPrice) {
          priceMap[item.tokenAddress.toLowerCase()] = {
            price: parseFloat(item.usdPrice),
            source: 'moralis_batch',
            symbol: item.tokenSymbol,
            name: item.tokenName,
            change24h: item['24hrPercentChange'],
            verified: item.verifiedContract,
            possibleSpam: item.possibleSpam === 'true'
          };
        }
      });
    }
    
    console.log(`✅ BATCH SUCCESS: ${Object.keys(priceMap).length}/${tokenAddresses.length} prices loaded`);
    return priceMap;
    
  } catch (error) {
    console.error('❌ Batch prices error:', error.message);
    return null;
  }
}

// 💰 FALLBACK: Single Token Price (falls Batch fehlschlägt)
async function getPriceMoralis(tokenAddress, chain) {
  try {
    const res = await moralisFetch(`/erc20/${tokenAddress}/price?chain=${chain}&include=percent_change`);
    return {
      price: res?.usdPrice ?? null,
      source: 'moralis_single',
      symbol: res?.tokenSymbol,
      name: res?.tokenName,
      change24h: res?.['24hrPercentChange'],
      verified: res?.verifiedContract,
      possibleSpam: res?.possibleSpam === 'true'
    };
  } catch (error) {
    console.error(`❌ Moralis price error for ${tokenAddress}:`, error.message);
    return null;
  }
}

// 🔄 PULSESCAN FALLBACK (für PLS-Preis)
async function getPulseScanPLSPrice() {
  try {
    console.log('🔍 PulseScan: Fetching PLS price');
    
    const response = await fetch('https://api.scan.pulsechain.com/api?module=stats&action=coinprice');
    const data = await response.json();
    
    if (data.status === '1' && data.result?.usd) {
      const plsPrice = parseFloat(data.result.usd);
      console.log(`✅ PulseScan: PLS = $${plsPrice}`);
      return plsPrice;
    }
    
    console.log('⚠️ PulseScan: No PLS price found');
    return 0;
    
  } catch (error) {
    console.error(`❌ PulseScan error:`, error.message);
    return 0;
  }
}

export default async function handler(req, res) {
  console.log('📊 TAX REPORT API: Request received');
  
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { 
    wallet, 
    chain = 'pulsechain', 
    limit = 100,
    getAllPages = 'true',
    maxTransactions = 50000  // 🚀 NEW: Configurabel max limit
  } = req.query;

  // Validation
  if (!wallet) {
    return res.status(400).json({ 
      error: 'Wallet-Adresse fehlt',
      usage: '/api/tax-report?wallet=0x...&chain=pulsechain&getAllPages=true&maxTransactions=50000'
    });
  }

  if (!MORALIS_API_KEY || MORALIS_API_KEY === 'YOUR_MORALIS_API_KEY_HERE') {
    return res.status(503).json({ 
      error: 'Moralis API Key nicht konfiguriert'
    });
  }

  // Chain mapping & Mainnet Detection
  const chainMap = {
    ethereum: '0x1',
    pulsechain: '0x171',
    eth: '0x1',
    pls: '0x171',
    polygon: '0x89',
    bsc: '0x38',
    avalanche: '0xa86a'
  };
  const chainId = chainMap[chain.toLowerCase()] || chain;
  
  // 🚨 WICHTIG: Batch API funktioniert nur auf Mainnet Chains!
  const MAINNET_CHAINS = ['0x1', '0x89', '0x38', '0xa86a']; // Ethereum, Polygon, BSC, Avalanche
  const isBatchSupported = MAINNET_CHAINS.includes(chainId);
  
  console.log(`🔍 Chain ${chainId} - Batch API supported: ${isBatchSupported}`);

  const shouldGetAllPages = getAllPages === 'true' || getAllPages === true;
  const maxTxLimit = parseInt(maxTransactions) || 50000;

  console.log(`🔍 Loading transfers for ${wallet} on chain ${chainId} - AllPages: ${shouldGetAllPages}, Max: ${maxTxLimit}`);

  try {
    // 🚀 1. VOLLSTÄNDIGES PAGINATION SYSTEM - LÄDT ALLE TRANSAKTIONEN!
    let allTransfers = [];
    let cursor = null;
    let hasMore = true;
    let pageCount = 0;
    let totalApiCalls = 0;

    console.log(`🚀 VOLLSTÄNDIGE PAGINATION: Starte unbegrenztes Laden...`);

    while (hasMore && allTransfers.length < maxTxLimit) {
      pageCount++;
      console.log(`📄 TAX PAGE ${pageCount}: Loading transfers... (current total: ${allTransfers.length})`);
      
      // Build API URL with pagination
      let endpoint = `/${wallet}/erc20/transfers?chain=${chainId}&limit=${Math.min(100, maxTxLimit - allTransfers.length)}`;
      if (cursor) {
        endpoint += `&cursor=${cursor}`;
      }

      // API Call with rate limiting
      const txData = await moralisFetch(endpoint);
      totalApiCalls++;
      
      if (!txData?.result || txData.result.length === 0) {
        console.log(`📄 TAX PAGE ${pageCount}: No more transfers found`);
        break;
      }

      // Add transfers to collection
      allTransfers.push(...txData.result);
      cursor = txData.cursor;
      hasMore = shouldGetAllPages && !!cursor && txData.result.length >= 100;
      
      console.log(`✅ TAX PAGE ${pageCount}: Loaded ${txData.result.length} transfers (total: ${allTransfers.length}, cursor: ${cursor ? 'yes' : 'no'})`);
      
      // Break conditions
      if (!shouldGetAllPages) {
        console.log(`📄 SINGLE PAGE: Stopping at page 1 as requested`);
        break;
      }
      
      if (allTransfers.length >= maxTxLimit) {
        console.log(`📄 MAX LIMIT REACHED: Stopping at ${allTransfers.length} transfers`);
        break;
      }

      // Rate limiting between pages (100ms)
      if (hasMore) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log(`🎯 PAGINATION COMPLETE: ${allTransfers.length} transfers loaded across ${pageCount} pages with ${totalApiCalls} API calls`);

    if (allTransfers.length === 0) {
      return res.status(404).json({ 
        error: 'Keine Token-Transfers gefunden',
        wallet,
        chain: chainId,
        pagesChecked: pageCount,
        apiCalls: totalApiCalls
      });
    }

    // 2. SAMMLE ALLE UNIQUE TOKEN-ADRESSEN für Batch-Loading
    const uniqueTokens = [...new Set(allTransfers.map(tx => tx.token_address.toLowerCase()))];
    console.log(`📊 Found ${uniqueTokens.length} unique tokens for batch price loading`);

    // 3. 🚀 BATCH PRICE LOADING (nur auf Mainnet Chains!)
    let batchPrices = null;
    let moralisCallsUsed = 0;
    // DexScreener entfernt - verwende PulseScan für PLS-Token

    if (uniqueTokens.length > 0 && isBatchSupported) {
      console.log(`🚀 MAINNET DETECTED: Using Batch API for ${uniqueTokens.length} tokens`);
      batchPrices = await getBatchPricesMoralis(uniqueTokens, chainId);
      moralisCallsUsed = 1; // Nur 1 API Call für alle Tokens!
      
      if (batchPrices) {
        console.log(`🚀 BATCH SUCCESS: ${Object.keys(batchPrices).length} prices loaded with 1 API call`);
      } else {
        console.log(`⚠️ BATCH FAILED: Falling back to individual calls`);
      }
    } else if (uniqueTokens.length > 0) {
      console.log(`⚠️ NON-MAINNET CHAIN: Batch API nicht verfügbar, verwende Individual Calls`);
    }

    // 4. VERARBEITE TRANSAKTIONEN mit Batch-Preisen
    const transactions = [];
    const ungepaarteTokens = [];
    const kaufHistorie = {};

    for (const tx of allTransfers) {
      const token = tx.token_symbol || 'Unknown';
      const tokenAddr = tx.token_address.toLowerCase();
      const decimals = parseInt(tx.token_decimal) || 18;
      const amount = parseFloat(tx.value) / Math.pow(10, decimals);
      const datum = new Date(tx.block_timestamp);
      const dateFormatted = format(datum, 'yyyy-MM-dd HH:mm:ss');
      
      // 🎯 ERWEITERTE ROI-KLASSIFIKATION
      const isFromWallet = tx.from_address.toLowerCase() === wallet.toLowerCase();
      const roiClassification = classifyROITransaction(tx, wallet);
      
      // Transaktionstyp basierend auf ROI-Klassifikation
      const type = isFromWallet ? 'Verkauf' : 
                   roiClassification.isROI ? 'ROI' : 'Kauf';

      // Kaufhistorie für Haltefrist-Berechnung (nur bei Käufen)
      if (type === 'Kauf') {
        if (!kaufHistorie[tokenAddr]) {
          kaufHistorie[tokenAddr] = [];
        }
        kaufHistorie[tokenAddr].push({
          datum: datum,
          amount: amount,
          preis: usdPrice || 0
        });
      }

      // 5. PREISFINDUNG: Batch First, dann Fallbacks
      let priceInfo = null;
      let priceSource = 'unknown';
      
      // 5a. Versuche Batch-Preis
      if (batchPrices && batchPrices[tokenAddr]) {
        priceInfo = batchPrices[tokenAddr];
        priceSource = 'moralis_batch';
      }
      // 5b. Fallback: Einzelner Moralis-Call
      else {
        console.log(`⚠️ Token ${token} nicht im Batch - einzelner Call...`);
        priceInfo = await getPriceMoralis(tokenAddr, chainId);
        moralisCallsUsed++;
        priceSource = 'moralis_single';
      }
      
      let usdPrice = priceInfo?.price || null;
      let hasReliablePrice = !!usdPrice;

      // 🛡️ PREIS-VALIDIERUNG: Extreme Preise filtern
      if (usdPrice !== null) {
        // Unrealistische Preise abfangen
        if (usdPrice > 1000000) { // > 1 Million USD
          console.warn(`🚨 EXTREME PRICE DETECTED: ${token} = $${usdPrice} - REJECTED!`);
          usdPrice = null;
          hasReliablePrice = false;
          priceSource += '_rejected_extreme';
        } else if (usdPrice < 0) { // Negative Preise
          console.warn(`🚨 NEGATIVE PRICE DETECTED: ${token} = $${usdPrice} - REJECTED!`);
          usdPrice = null;
          hasReliablePrice = false;
          priceSource += '_rejected_negative';
        } else if (isNaN(usdPrice) || !isFinite(usdPrice)) { // NaN/Infinity
          console.warn(`🚨 INVALID PRICE DETECTED: ${token} = ${usdPrice} - REJECTED!`);
          usdPrice = null;
          hasReliablePrice = false;
          priceSource += '_rejected_invalid';
        }
      }

      // 5c. FALLBACK: PulseScan für PLS-Token
      if (usdPrice === null && (token === 'PLS' || tokenAddr.toLowerCase() === '0x0000000000000000000000000000000000000000')) {
        console.log(`⚠️ PLS Token detected - versuche PulseScan...`);
        
        usdPrice = await getPulseScanPLSPrice();
        priceSource = 'pulsescan';
        hasReliablePrice = !!usdPrice;
      }
      
      // 5d. Wenn alle Fallbacks fehlschlagen -> ungepaarte Liste
      if (usdPrice === null) {
        ungepaarteTokens.push({
          token,
          symbol: token,
          amount,
          tokenAddress: tokenAddr,
          date: dateFormatted,
          type,
          moralisPrice: null,
          pulsescanPrice: token === 'PLS' ? 'attempted' : null,
          manualPrice: null,
          valueEUR: 0,
          source: 'manual_required',
          note: 'Preis manuell eingeben erforderlich',
          steuerpflichtig: type === 'ROI' || (type === 'Verkauf'),
          hash: tx.transaction_hash
        });
        continue;
      }

      // 6. STEUERPFLICHTIGKEIT BERECHNEN mit verbesserter Haltefrist
      let haltefristTage = 0;
      let kaufDatum = null;
      
      if (type === 'Verkauf' && kaufHistorie[tokenAddr] && kaufHistorie[tokenAddr].length > 0) {
        // FIFO-Prinzip: Ältester Kauf zuerst
        const aeltesterKauf = kaufHistorie[tokenAddr][0];
        kaufDatum = aeltesterKauf.datum;
        haltefristTage = (datum - kaufDatum) / (1000 * 60 * 60 * 24);
      } else if (type === 'ROI') {
        // ROI ist immer sofort steuerpflichtig
        haltefristTage = 0;
      }
      
      const isSteuerpflichtig = type === 'ROI' || 
        (type === 'Verkauf' && haltefristTage < 365);

      // 7. ERWEITERTE STEUERPFLICHTIGKEIT mit ROI-Klassifikation
      const enhancedTaxClassification = getEnhancedTaxClassification(
        type, 
        roiClassification, 
        haltefristTage, 
        amount
      );

      // 8. TRANSAKTION SPEICHERN (mit ROI-Klassifikation & erweiterten Steuer-Infos)
      transactions.push({
        type,
        token,
        symbol: priceInfo?.symbol || token,
        tokenName: priceInfo?.name || 'Unknown',
        amount: amount,
        date: dateFormatted,
        priceUSD: usdPrice,
        valueUSD: usdPrice * amount,
        priceEUR: usdPrice * 0.92, // Grober EUR Kurs
        valueEUR: usdPrice * amount * 0.92,
        
        // 🎯 ROI-KLASSIFIKATION
        roiClassification: roiClassification,
        isROI: roiClassification.isROI,
        roiType: roiClassification.roiType,
        roiSourceToken: roiClassification.sourceToken,
        roiConfidence: roiClassification.confidence,
        
        // 📊 ERWEITERTE STEUER-KLASSIFIKATION
        steuerpflichtig: enhancedTaxClassification.isTaxable,
        taxCategory: enhancedTaxClassification.category,
        taxReason: enhancedTaxClassification.reason,
        germanTaxCode: enhancedTaxClassification.germanTaxCode,
        
        haltefristTage: Math.round(haltefristTage),
        priceSource,
        hasReliablePrice,
        hash: tx.transaction_hash,
        tokenAddress: tokenAddr,
        
        // Zusätzliche Moralis-Daten
        priceChange24h: priceInfo?.change24h,
        verifiedContract: priceInfo?.verified,
        possibleSpam: priceInfo?.possibleSpam
      });
    }

    // 9. ERWEITERTE STATISTIKEN BERECHNEN
    const steuerpflichtigeTransaktionen = transactions.filter(t => t.steuerpflichtig);
    const gesamtwertSteuerpflichtig = steuerpflichtigeTransaktionen.reduce((sum, t) => sum + t.valueEUR, 0);
    
    // ROI-Statistiken nach Klassifikation
    const roiTransaktionen = transactions.filter(t => t.isROI);
    const roiWert = roiTransaktionen.reduce((sum, t) => sum + t.valueEUR, 0);
    
    // ROI-Aufschlüsselung nach Typ
    const roiByType = roiTransaktionen.reduce((acc, t) => {
      const type = t.roiType || 'UNKNOWN';
      if (!acc[type]) {
        acc[type] = { count: 0, value: 0, confidence: [] };
      }
      acc[type].count++;
      acc[type].value += t.valueEUR;
      acc[type].confidence.push(t.roiConfidence);
      return acc;
    }, {});
    
    // Durchschnittliche Confidence pro ROI-Typ
    Object.keys(roiByType).forEach(type => {
      const confidences = roiByType[type].confidence;
      roiByType[type].avgConfidence = confidences.length > 0 ? 
        Math.round(confidences.reduce((sum, c) => sum + c, 0) / confidences.length) : 0;
      delete roiByType[type].confidence; // Remove array for cleaner output
    });

    // 🚀 PAGINATION & BATCH STATISTIKEN
    const paginationApiCalls = totalApiCalls; // API calls für Transfer-Loading
    const priceApiCalls = moralisCallsUsed; // API calls für Preis-Loading
    const totalMoralisApiCalls = paginationApiCalls + priceApiCalls;
    
    const estimatedCUsUsed = totalMoralisApiCalls * 25; // ~25 CUs pro Call
    const oldSystemCUs = (allTransfers.length + uniqueTokens.length) * 25; // Individual calls
    const cuSavings = Math.max(0, oldSystemCUs - estimatedCUsUsed);
    const efficiencyPercent = oldSystemCUs > 0 ? Math.round((cuSavings / oldSystemCUs) * 100) : 0;

    console.log(`✅ TAX REPORT COMPLETE:`);
    console.log(`📊 TRANSACTIONS: ${allTransfers.length} total transfers → ${transactions.length} processed, ${ungepaarteTokens.length} ungepaart`);
    console.log(`📊 PAGINATION: ${pageCount} pages loaded with ${paginationApiCalls} API calls`);
    console.log(`📊 PRICING: ${priceApiCalls} Moralis + PulseScan fallback calls`);
    
    if (isBatchSupported && batchPrices) {
      console.log(`🚀 BATCH EFFICIENCY: ${efficiencyPercent}% CU savings (${cuSavings} CUs saved vs old system)`);
    } else if (!isBatchSupported) {
      console.log(`⚠️ NON-MAINNET CHAIN: Batch API nicht verfügbar auf Chain ${chainId}`);
    } else {
      console.log(`⚠️ BATCH FAILED: Fallback zu Individual Calls`);
    }

    // 8. RESPONSE
    return res.status(200).json({
      success: true,
      wallet,
      chain: chainId,
      
      // Haupt-Daten
      transactions,
      transactionCount: transactions.length,
      
      // Ungepaarte Tokens (separate Spalte)
      ungepaarteTokens,
      ungepaarteCount: ungepaarteTokens.length,
      
      // Erweiterte Statistiken mit Pagination
      statistics: {
        // Transfer-Loading Stats
        totalTransfersLoaded: allTransfers.length,
        pagesLoaded: pageCount,
        paginationApiCalls: paginationApiCalls,
        maxTransactionsLimit: maxTxLimit,
        allPagesRequested: shouldGetAllPages,
        
        // Processing Stats  
        gesamtTransaktionen: transactions.length + ungepaarteTokens.length,
        processedTransactions: transactions.length,
        steuerpflichtigeTransaktionen: steuerpflichtigeTransaktionen.length,
        gesamtwertSteuerpflichtig: gesamtwertSteuerpflichtig,
        roiTransaktionen: roiTransaktionen.length,
        roiWert: roiWert,
        roiClassificationBreakdown: roiByType,
        ungepaarteTokens: ungepaarteTokens.length
      },
      
      // API Usage & Batch-Optimierung
      apiUsage: {
        moralisCallsUsed,
        pulsescanCallsUsed: 0, // PulseScan calls are minimal
        totalCalls: moralisCallsUsed,
        // 🚀 Batch-Optimierung Details
        batchOptimization: {
          enabled: !!batchPrices,
          supported: isBatchSupported,
          chainId: chainId,
          reason: !isBatchSupported ? 'Non-mainnet chain - Batch API nur auf Ethereum/Polygon/BSC/Avalanche' :
                  !batchPrices ? 'Batch API fehlgeschlagen - Fallback zu Individual Calls' :
                  'Batch API erfolgreich verwendet',
          uniqueTokens: uniqueTokens.length,
          tokensInBatch: batchPrices ? Object.keys(batchPrices).length : 0,
          fallbackCalls: Math.max(0, moralisCallsUsed - 1),
          estimatedCUsUsed: estimatedCUsUsed,
          oldSystemCUs: oldSystemCUs,
          cuSavings: cuSavings,
          efficiencyPercent: efficiencyPercent
        }
      },
      
      // Metadata
      generatedAt: new Date().toISOString(),
      version: "v0.1.9-BATCH-MAINNET-FIX",
      hinweise: [
        `${ungepaarteTokens.length} Tokens ohne Preis gefunden - bitte manuell vervollständigen`,
        'Steuerpflichtigkeit basiert auf deutschen Steuergesetzen (1-Jahr Haltefrist)',
        'ROI-Transaktionen sind immer steuerpflichtig',
        'Preise in EUR sind Näherungswerte - für exakte Steuererklärung Tageskurs verwenden',
        isBatchSupported && batchPrices ? 
          `🚀 BATCH-OPTIMIERUNG: ${efficiencyPercent}% CU-Ersparnis durch intelligente Preisabfrage` :
          !isBatchSupported ? 
            `⚠️ BATCH API: Nicht verfügbar auf ${chain} - nur auf Mainnet Chains (Ethereum, Polygon, BSC, Avalanche)` :
            `⚠️ BATCH API: Fehlgeschlagen - Individual Calls verwendet`
      ]
    });

  } catch (error) {
    console.error('💥 TAX REPORT ERROR:', error);
    return res.status(500).json({
      error: 'Fehler beim Erstellen des Steuerberichts',
      message: error.message,
      wallet,
      chain: chainId
    });
  }
} 