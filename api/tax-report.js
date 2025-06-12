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

// 💰 MORALIS PRICE LOOKUP
async function getPriceMoralis(tokenAddress, chain) {
  try {
    const res = await moralisFetch(`/erc20/${tokenAddress}/price?chain=${chain}`);
    return res?.usdPrice ?? null;
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

  // Chain mapping
  const chainMap = {
    ethereum: '0x1',
    pulsechain: '0x171',
    eth: '0x1',
    pls: '0x171'
  };
  const chainId = chainMap[chain.toLowerCase()] || chain;

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

    // 2. VERARBEITE TRANSAKTIONEN
    const transactions = [];
    const ungepaarteTokens = [];
    const kaufHistorie = {};
    let moralisCallsUsed = 0;
    let dexscreenerCallsUsed = 0;

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

      // 3. PREISFINDUNG: Moralis First
      let usdPrice = await getPriceMoralis(tokenAddr, chainId);
      moralisCallsUsed++;
      
      let priceSource = 'moralis';
      let hasReliablePrice = !!usdPrice;

      // 4. FALLBACK: DEXScreener für ungepaarte Tokens
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

      // 5. STEUERPFLICHTIGKEIT BERECHNEN
      const haltefristTage = kaufHistorie[tokenAddr] ? 
        (datum - kaufHistorie[tokenAddr]) / (1000 * 60 * 60 * 24) : 0;
      
      const isSteuerpflichtig = type === 'ROI' || 
        (type === 'Verkauf' && haltefristTage < 365);

      // 6. TRANSAKTION SPEICHERN
      transactions.push({
        type,
        token,
        symbol: token,
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
        tokenAddress: tokenAddr
      });
    }

    // 7. STATISTIKEN BERECHNEN
    const steuerpflichtigeTransaktionen = transactions.filter(t => t.steuerpflichtig);
    const gesamtwertSteuerpflichtig = steuerpflichtigeTransaktionen.reduce((sum, t) => sum + t.valueEUR, 0);
    
    const roiTransaktionen = transactions.filter(t => t.type === 'ROI');
    const roiWert = roiTransaktionen.reduce((sum, t) => sum + t.valueEUR, 0);

    console.log(`✅ TAX REPORT: ${transactions.length} transactions, ${ungepaarteTokens.length} ungepaart`);
    console.log(`📊 API Calls: ${moralisCallsUsed} Moralis, ${dexscreenerCallsUsed} DEXScreener`);

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
      
      // API Usage
      apiUsage: {
        moralisCallsUsed,
        dexscreenerCallsUsed,
        totalCalls: moralisCallsUsed + dexscreenerCallsUsed
      },
      
      // Metadata
      generatedAt: new Date().toISOString(),
      hinweise: [
        `${ungepaarteTokens.length} Tokens ohne Preis gefunden - bitte manuell vervollständigen`,
        'Steuerpflichtigkeit basiert auf deutschen Steuergesetzen (1-Jahr Haltefrist)',
        'ROI-Transaktionen sind immer steuerpflichtig',
        'Preise in EUR sind Näherungswerte - für exakte Steuererklärung Tageskurs verwenden'
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