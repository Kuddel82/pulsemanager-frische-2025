// 📊 TAX REPORT API - MORALIS + DEXSCREENER INTEGRATION
// Erweiterte Steuerberichte mit intelligenter Preisfindung

import { format } from 'date-fns';

const MORALIS_API_KEY = process.env.MORALIS_API_KEY;
const MORALIS_BASE = 'https://deep-index.moralis.io/api/v2';

// 🏭 BEKANNTE MINTER-ADRESSEN (für ROI-Klassifikation)
const KNOWN_MINTERS = [
  '0x2b591e99afe9f32eaa6214f7b7629768c40eeb39', // HEX
  '0x8bd3d1472a656e312e94fb1bbdd599b8c51d18e3', // INC  
  '0x83d0cf6a8bc7d9af84b7fc1a6a8ad51f1e1e6fe1'  // PLSX
];

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

// 🔄 DEXSCREENER FALLBACK
async function getPriceDEXScreener(tokenAddress, chain) {
  try {
    console.log(`🔍 DEXScreener lookup: ${tokenAddress}`);
    
    const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`);
    const data = await res.json();
    
    // Finde PulseChain-spezifische Pairs wenn möglich
    const pulsePairs = data.pairs?.filter(p => p.chainId === 'pulsechain') || [];
    const pair = pulsePairs[0] || data.pairs?.[0];
    
    const price = pair?.priceUsd ? parseFloat(pair.priceUsd) : null;
    
    if (price) {
      console.log(`✅ DEXScreener price found: $${price}`);
    } else {
      console.log(`⚠️ DEXScreener: No price found`);
    }
    
    return price;
  } catch (error) {
    console.error(`❌ DEXScreener error for ${tokenAddress}:`, error.message);
    return null;
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

  const { wallet, chain = 'pulsechain', limit = 100 } = req.query;

  // Validation
  if (!wallet) {
    return res.status(400).json({ 
      error: 'Wallet-Adresse fehlt',
      usage: '/api/tax-report?wallet=0x...&chain=pulsechain'
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

  console.log(`🔍 Loading transfers for ${wallet} on chain ${chainId}`);

  try {
    // 1. LADE ALLE TOKEN-TRANSFERS
    const txData = await moralisFetch(`/${wallet}/erc20/transfers?chain=${chainId}&limit=${limit}`);
    
    if (!txData?.result) {
      return res.status(404).json({ 
        error: 'Keine Token-Transfers gefunden',
        wallet,
        chain: chainId
      });
    }

    console.log(`📊 Found ${txData.result.length} token transfers`);

    // 2. SAMMLE ALLE UNIQUE TOKEN-ADRESSEN für Batch-Loading
    const uniqueTokens = [...new Set(txData.result.map(tx => tx.token_address.toLowerCase()))];
    console.log(`📊 Found ${uniqueTokens.length} unique tokens for batch price loading`);

    // 3. 🚀 BATCH PRICE LOADING (nur auf Mainnet Chains!)
    let batchPrices = null;
    let moralisCallsUsed = 0;
    let dexscreenerCallsUsed = 0;

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

    for (const tx of txData.result) {
      const token = tx.token_symbol || 'Unknown';
      const tokenAddr = tx.token_address.toLowerCase();
      const decimals = parseInt(tx.token_decimal) || 18;
      const amount = parseFloat(tx.value) / Math.pow(10, decimals);
      const datum = new Date(tx.block_timestamp);
      const dateFormatted = format(datum, 'yyyy-MM-dd HH:mm:ss');
      
      // Transaktionstyp bestimmen
      const isFromWallet = tx.from_address.toLowerCase() === wallet.toLowerCase();
      const isFromMinter = KNOWN_MINTERS.includes(tx.from_address.toLowerCase());
      
      const type = isFromWallet ? 'Verkauf' : 
                   isFromMinter ? 'ROI' : 'Kauf';

      // Kaufhistorie für Haltefrist-Berechnung
      if (type === 'Kauf') {
        kaufHistorie[tokenAddr] = datum;
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

      // 5c. FALLBACK: DEXScreener für ungepaarte Tokens
      if (usdPrice === null) {
        console.log(`⚠️ Token ${token} nicht in Moralis - versuche DEXScreener...`);
        
        usdPrice = await getPriceDEXScreener(tokenAddr, chainId);
        dexscreenerCallsUsed++;
        priceSource = 'dexscreener';
        hasReliablePrice = !!usdPrice;
        
        // Wenn auch DEXScreener fehlschlägt -> ungepaarte Liste
        if (usdPrice === null) {
          ungepaarteTokens.push({
            token,
            symbol: token,
            amount,
            tokenAddress: tokenAddr,
            date: dateFormatted,
            type,
            moralisPrice: null,
            dexscreenerPrice: null,
            manualPrice: null,
            valueEUR: 0,
            source: 'manual_required',
            note: 'Preis manuell eingeben erforderlich',
            steuerpflichtig: type === 'ROI' || (type === 'Verkauf'),
            hash: tx.transaction_hash
          });
          continue;
        }
      }

      // 6. STEUERPFLICHTIGKEIT BERECHNEN
      const haltefristTage = kaufHistorie[tokenAddr] ? 
        (datum - kaufHistorie[tokenAddr]) / (1000 * 60 * 60 * 24) : 0;
      
      const isSteuerpflichtig = type === 'ROI' || 
        (type === 'Verkauf' && haltefristTage < 365);

      // 7. TRANSAKTION SPEICHERN (mit erweiterten Preis-Infos)
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
        steuerpflichtig: isSteuerpflichtig,
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

    // 7. STATISTIKEN BERECHNEN
    const steuerpflichtigeTransaktionen = transactions.filter(t => t.steuerpflichtig);
    const gesamtwertSteuerpflichtig = steuerpflichtigeTransaktionen.reduce((sum, t) => sum + t.valueEUR, 0);
    
    const roiTransaktionen = transactions.filter(t => t.type === 'ROI');
    const roiWert = roiTransaktionen.reduce((sum, t) => sum + t.valueEUR, 0);

    // 🚀 BATCH-OPTIMIERUNG STATISTIKEN
    const estimatedCUsUsed = moralisCallsUsed * 25; // ~25 CUs pro Call
    const oldSystemCUs = uniqueTokens.length * 25; // Was das alte System gekostet hätte
    const cuSavings = Math.max(0, oldSystemCUs - estimatedCUsUsed);
    const efficiencyPercent = oldSystemCUs > 0 ? Math.round((cuSavings / oldSystemCUs) * 100) : 0;

    console.log(`✅ TAX REPORT: ${transactions.length} transactions, ${ungepaarteTokens.length} ungepaart`);
    console.log(`📊 API Calls: ${moralisCallsUsed} Moralis (${estimatedCUsUsed} CUs), ${dexscreenerCallsUsed} DEXScreener`);
    
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
      
      // Statistiken
      statistics: {
        gesamtTransaktionen: transactions.length + ungepaarteTokens.length,
        steuerpflichtigeTransaktionen: steuerpflichtigeTransaktionen.length,
        gesamtwertSteuerpflichtig: gesamtwertSteuerpflichtig,
        roiTransaktionen: roiTransaktionen.length,
        roiWert: roiWert,
        ungepaarteTokens: ungepaarteTokens.length
      },
      
      // API Usage & Batch-Optimierung
      apiUsage: {
        moralisCallsUsed,
        dexscreenerCallsUsed,
        totalCalls: moralisCallsUsed + dexscreenerCallsUsed,
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