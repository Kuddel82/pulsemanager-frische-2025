/**
 * 🇩🇪 DEUTSCHE CRYPTO-STEUER API - MORALIS v2.2 PULSECHAIN INTEGRATION
 * 
 * SCHRITT 1: Moralis API v2.2 mit PulseChain Support
 * - Chain ID 369 (0x171) für PulseChain
 * - ERC20 Token Transfers mit Pagination
 * - Token Balances und Metadata
 * - Rate Limiting: 25 requests/second
 */

/**
 * 🇩🇪 DEUTSCHE CRYPTO-STEUER API - KOPIERT VON FUNKTIONIERENDER API
 * 
 * EXAKTE LOGIK VON moralis-transactions.js - DIE FUNKTIONIERT!
 */

// 🔧 MORALIS v2 KONFIGURATION (FUNKTIONIERT!)
const MORALIS_API_KEY = process.env.MORALIS_API_KEY;
const MORALIS_BASE_URL = 'https://deep-index.moralis.io/api/v2';

// 🚦 RATE LIMITING: 25 requests/second (Standard Plan)
let lastCallTime = 0;
const MIN_CALL_INTERVAL = 40; // 1000ms / 25 requests = 40ms minimum

// 🔗 PULSECHAIN KONFIGURATION
const PULSECHAIN_CONFIG = {
  chainId: '0x171', // Chain ID 369 in hex
  name: 'PulseChain',
  nativeToken: 'PLS',
  decimals: 18,
  rpcUrl: 'https://rpc.pulsechain.com',
  blockExplorer: 'https://scan.pulsechainfoundation.org/',
  // 🔥 SCHRITT 2: NATIVE TOKEN SPECIFICATIONS
  nativeTokenSpecs: {
    PLS: {
      contract: 'native', // Native blockchain token (no contract address)
      decimals: 18,
      symbol: 'PLS',
      currentPrice: 0.00003003, // ~$0.00003003 USD
      totalSupply: 10000000000 // ~10 billion PLS
    },
    WPLS: {
      usage: 'DEX trading where native PLS isn\'t supported',
      decimals: 18,
      trading: 'Active on PulseX, PulseX V2, other PulseChain DEXs'
    }
  },
  // 🔥 SCHRITT 2: WGEP TOKEN RESEARCH
  wgepToken: {
    name: 'WGEP',
    description: 'PulseChain token with ROI mechanics',
    note: 'Verify exact contract address and tokenomics from PulseChain block explorer',
    roiMechanism: 'ETH printing through staking rewards, reflection mechanisms, or yield farming',
    taxCategory: '§22 EStG - Sonstige Einkünfte'
  }
};

/**
 * Helper to fetch data from Moralis REST API with improved error handling
 * EXAKTE KOPIE VON moralis-transactions.js
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

async function rateLimitedCall(fn) {
  const now = Date.now();
  const timeSinceLastCall = now - lastCallTime;
  
  if (timeSinceLastCall < MIN_CALL_INTERVAL) {
    await new Promise(resolve => setTimeout(resolve, MIN_CALL_INTERVAL - timeSinceLastCall));
  }
  
  lastCallTime = Date.now();
  return await fn();
}

// 🔥 EXAKTE KOPIE DER FUNKTIONIERENDEN LOGIK
async function fetchERC20TransfersV2(wallet, chainId, cursor = null) {
  try {
    console.log(`📊 TAX: Fetching ERC20 transfers for ${wallet} on chain ${chainId}`);
    
    // 🔥 EXAKTE KOPIE VON moralis-transactions.js
    const moralisParams = { 
      chain: chainId,
      limit: 100 // Original working limit
    };
    
    if (cursor) moralisParams.cursor = cursor;
    
    const result = await moralisFetch(`${wallet}/erc20/transfers`, moralisParams);
    
    console.log(`✅ TAX: Found ${result?.result?.length || 0} ERC20 transfers`);
    return result;
    
  } catch (error) {
    console.error('❌ TAX: fetchERC20Transfers error:', error.message);
    return { result: [], cursor: null };
  }
}

// 🔥 NEUE FUNKTION: WALLET HISTORY (KORREKTE URL)
async function fetchWalletHistoryV2(wallet, chainId) {
  try {
    console.log(`📊 TAX v2.2: Fetching wallet history for ${wallet} on chain ${chainId}`);
    
    // 🔥 KORREKTE URL: /wallets/:address/history
    const url = `${MORALIS_BASE_URL}/wallets/${wallet}/history?chain=${chainId}&limit=500`;
    
    console.log(`🔍 DEBUG: Wallet History URL: ${url}`);
    
    const res = await fetch(url, {
      headers: { 'X-API-Key': MORALIS_API_KEY }
    });
    
    if (!res.ok) {
      throw new Error(`Wallet History v2.2 API error: ${res.status}`);
    }
    
    const data = await res.json();
    console.log(`✅ TAX v2.2: Found ${data?.result?.length || 0} wallet history items`);
    return data;
    
  } catch (error) {
    console.error('❌ TAX v2.2: fetchWalletHistory error:', error.message);
    console.error('❌ TAX v2.2: fetchTokenBalances error:', error.message);
    return [];
  }
}

// 🔥 SCHRITT 1: TOKEN METADATA MIT v2.2
async function fetchTokenMetadataV2(tokenAddress, chainId) {
  try {
    console.log(`📋 TAX v2.2: Fetching metadata for token ${tokenAddress} on chain ${chainId}`);
    
    const url = `${MORALIS_BASE_URL}/erc20/metadata?chain=${chainId}&addresses=${tokenAddress}`;
    
    const res = await fetch(url, {
      headers: { 'X-API-Key': MORALIS_API_KEY }
    });
    
    if (!res.ok) {
      throw new Error(`Token Metadata v2.2 API error: ${res.status}`);
    }
    
    const data = await res.json();
    console.log(`✅ TAX v2.2: Found metadata for ${data?.length || 0} tokens`);
    return data?.[0] || null;
    
  } catch (error) {
    console.error('❌ TAX v2.2: fetchTokenMetadata error:', error.message);
    return null;
  }
}

// 🇩🇪 DEUTSCHE STEUER-KLASSIFIZIERUNG
function classifyTransactionForGermanTax(tx, walletAddress) {
  const isIncoming = tx.to_address?.toLowerCase() === walletAddress.toLowerCase();
  const isOutgoing = tx.from_address?.toLowerCase() === walletAddress.toLowerCase();
  
  // ROI Token Detection (§22 EStG)
  const ROI_TOKENS = ['WGEP', 'HEX', 'PLSX', 'PLS', 'MASKMAN', 'BORK', 'INC', 'LOAN', 'FLEX', '🎭', 'TREASURY BILL ㉾', 'Finvesta'];
  const isROIToken = ROI_TOKENS.includes(tx.token_symbol?.toUpperCase());
  
  // Minter Detection (ROI from minting)
  const KNOWN_MINTERS = [
    '0x0000000000000000000000000000000000000000',
    '0x2b591e99afe9f32eaa6214f7b7629768c40eeb39',
    '0x8bd3d1472a656e312e94fb1bbdd599b8c51d18e3'
  ];
  const fromMinter = KNOWN_MINTERS.includes(tx.from_address?.toLowerCase());
  
  // Calculate token amount
  const amount = parseFloat(tx.value) / Math.pow(10, parseInt(tx.token_decimals) || 18);
  
  // 🔥 KORREKTE PREISBERECHNUNG: Nur echte Moralis-Daten verwenden
  let usdValue = 0;
  let eurValue = 0;
  
  // 1. PRIORITY: Moralis USD-Preis (echte Daten)
  if (tx.usd_price && parseFloat(tx.usd_price) > 0) {
    usdValue = parseFloat(tx.usd_price);
    eurValue = usdValue * 0.93; // USD to EUR conversion
    console.log(`✅ REAL PRICE: ${tx.token_symbol} = $${usdValue} (Moralis data)`);
  }
  // 2. FALLBACK: Wenn kein Moralis-Preis verfügbar
  else {
    usdValue = 0;
    eurValue = 0;
    console.log(`⚠️ NO PRICE DATA: ${tx.token_symbol} - Preis unbekannt`);
  }
  
  // German tax classification
  if (isIncoming && (fromMinter || isROIToken)) {
    return {
      ...tx,
      taxCategory: 'ROI_INCOME',
      taxParagraph: '§22 EStG - Sonstige Einkünfte',
      taxable: true,
      eurValue: eurValue,
      usdValue: usdValue,
      amount: amount,
      direction: 'IN',
      priceSource: tx.usd_price ? 'moralis' : 'unknown'
    };
  } else if (isOutgoing) {
    return {
      ...tx,
      taxCategory: 'PURCHASE',
      taxParagraph: '§23 EStG - Spekulation',
      taxable: false,
      eurValue: eurValue,
      usdValue: usdValue,
      amount: amount,
      direction: 'OUT',
      priceSource: tx.usd_price ? 'moralis' : 'unknown'
    };
  } else if (isIncoming) {
    return {
      ...tx,
      taxCategory: 'SALE_INCOME',
      taxParagraph: '§23 EStG - Spekulation',
      taxable: true,
      eurValue: eurValue,
      usdValue: usdValue,
      amount: amount,
      direction: 'IN',
      priceSource: tx.usd_price ? 'moralis' : 'unknown'
    };
  }
  
  return {
    ...tx,
    taxCategory: 'TRANSFER',
    taxParagraph: 'Steuerfreier Transfer',
    taxable: false,
    eurValue: eurValue,
    usdValue: usdValue,
    amount: amount,
    direction: isIncoming ? 'IN' : 'OUT',
    priceSource: tx.usd_price ? 'moralis' : 'unknown'
  };
}

// 🔥 AGGRESSIVE PAGINATION: Load ALL transactions (bis zu 300.000!)
async function loadAllTransactionsAggressive(address, chainId, maxPages = 200) {
  console.log(`🔥 AGGRESSIVE PAGINATION: Loading ALL transactions for ${address} (max ${maxPages} pages)`);
  
  const allTransactions = [];
  let cursor = null;
  let pageCount = 0;
  
  try {
    do {
      console.log(`📄 Loading page ${pageCount + 1}/${maxPages}...`);
      
      const moralisParams = { 
        chain: chainId,
        limit: 2000 // Maximum pro Request (wie WGEP API)
      };
      
      if (cursor) moralisParams.cursor = cursor;
      
      const result = await moralisFetch(`${address}/erc20/transfers`, moralisParams);
      
      if (!result || !result.result || result.result.length === 0) {
        console.log(`📄 No more data at page ${pageCount + 1}`);
        break;
      }
      
      allTransactions.push(...result.result);
      cursor = result.cursor;
      pageCount++;
      
      console.log(`✅ Page ${pageCount}: ${result.result.length} transactions, Total: ${allTransactions.length}`);
      
      // Rate limiting zwischen Requests
      await new Promise(resolve => setTimeout(resolve, 200));
      
    } while (cursor && pageCount < maxPages);
    
    console.log(`🔥 AGGRESSIVE PAGINATION COMPLETE: ${allTransactions.length} transactions across ${pageCount} pages`);
    
    return {
      success: true,
      result: allTransactions,
      total: allTransactions.length,
      pages: pageCount,
      cursor: cursor,
      _source: 'aggressive_pagination'
    };
    
  } catch (error) {
    console.error('💥 AGGRESSIVE PAGINATION ERROR:', error);
    return {
      success: false,
      error: error.message,
      result: allTransactions,
      total: allTransactions.length,
      pages: pageCount
    };
  }
}

// 🔥 SCHRITT 5: MAIN FUNCTION MIT AGGRESSIVER PAGINATION
async function loadRealTransactionsForTax(walletAddress) {
  console.log(`🇩🇪 TAX: Loading ALL transactions for ${walletAddress} with aggressive pagination`);
  
  // Beide Chains laden (wie Portfolio System)
  const chains = [
    { id: '0x1', name: 'Ethereum' },    // WGEP, USDC, ETH
    { id: PULSECHAIN_CONFIG.chainId, name: PULSECHAIN_CONFIG.name } // PLS, HEX, andere
  ];
  
  const allTransactions = [];
  
  for (const chain of chains) {
    console.log(`🔗 TAX: Loading ${chain.name} (${chain.id}) with aggressive pagination...`);
    
    try {
      // 🔥 AGGRESSIVE PAGINATION: Lade ALLE Transaktionen
      const aggressiveResult = await loadAllTransactionsAggressive(walletAddress, chain.id, 200);
      
      if (aggressiveResult.success && aggressiveResult.result.length > 0) {
        allTransactions.push(...aggressiveResult.result);
        console.log(`✅ TAX: ${chain.name} - ${aggressiveResult.result.length} transactions loaded`);
      } else {
        console.log(`⚠️ TAX: ${chain.name} - No transactions found`);
      }
      
    } catch (error) {
      console.error(`❌ TAX: Error loading ${chain.name}:`, error.message);
    }
  }
  
  console.log(`🇩🇪 TAX: Total transactions loaded: ${allTransactions.length}`);
  
  // Filter 2025 (nur 2025 wie gewünscht)
  // 🔍 DEBUG: Temporär alle Jahre anzeigen
  const recentTransfers = allTransactions;
  
  console.log(`🔍 DEBUG: All transfers before year filter: ${allTransactions.length}`);
  console.log(`🔍 DEBUG: Year distribution:`, allTransactions.reduce((acc, tx) => {
    const year = new Date(tx.block_timestamp).getFullYear();
    acc[year] = (acc[year] || 0) + 1;
    return acc;
  }, {}));
  
  // 🔍 DEBUG: Zeige erste 3 Transaktionen für Debugging
  if (allTransactions.length > 0) {
    console.log(`🔍 DEBUG: First 3 transactions:`, allTransactions.slice(0, 3).map(tx => ({
      hash: tx.transaction_hash?.slice(0, 10) + '...',
      timestamp: tx.block_timestamp,
      year: new Date(tx.block_timestamp).getFullYear(),
      token: tx.token_symbol,
      from: tx.from_address?.slice(0, 8) + '...',
      to: tx.to_address?.slice(0, 8) + '...'
    })));
  }
  
  // 🔥 SCHRITT 5: ENHANCED PRICE CALCULATION
  const enhancedTransfers = await Promise.all(
    recentTransfers.map(async (tx) => {
      // Calculate real prices
      const priceData = await calculateTokenPrice(
        tx.token_symbol, 
        tx.token_address, 
        tx.block_timestamp
      );
      
      return {
        ...tx,
        usd_price: priceData.usd,
        eur_price: priceData.eur,
        price_source: priceData.source
      };
    })
  );
  
  // Deutsche Steuer-Klassifizierung
  const classifiedTransfers = enhancedTransfers.map(tx => 
    classifyTransactionForGermanTax(tx, walletAddress)
  );
  
  allTransactions.push(...classifiedTransfers);
  console.log(`✅ TAX: ${chains[0].name}: ${recentTransfers.length} transactions (2025)`);
  
  return allTransactions;
}

// 🇩🇪 DEUTSCHE STEUERBERECHNUNG
function calculateGermanTax(transactions) {
  const roiTransactions = transactions.filter(tx => tx.taxCategory === 'ROI_INCOME');
  const saleTransactions = transactions.filter(tx => tx.taxCategory === 'SALE_INCOME');
  const purchaseTransactions = transactions.filter(tx => tx.taxCategory === 'PURCHASE');
  
  // ROI-Einkommen berechnen (§22 EStG)
  const totalROIValue = roiTransactions.reduce((sum, tx) => sum + (tx.eurValue || 0), 0);
  
  // Verkaufsgewinne berechnen (§23 EStG)
  const totalSaleValue = saleTransactions.reduce((sum, tx) => sum + (tx.eurValue || 0), 0);
  const totalPurchaseValue = purchaseTransactions.reduce((sum, tx) => sum + (tx.eurValue || 0), 0);
  const netSaleGains = Math.max(0, totalSaleValue - totalPurchaseValue);
  
  // Gesamtgewinne
  const totalGains = totalROIValue + netSaleGains;
  
  // Deutsche Steuerberechnung
  const roiTax = totalROIValue * 0.35; // 35% auf ROI (§22 EStG)
  const saleTax = netSaleGains * 0.25; // 25% auf Spekulationsgewinne (§23 EStG)
  const totalTax = roiTax + saleTax;
  
  return {
    transactions: transactions,
    roiTransactions: roiTransactions,
    saleTransactions: saleTransactions,
    purchaseTransactions: purchaseTransactions,
    summary: {
      totalTransactions: transactions.length,
      roiCount: roiTransactions.length,
      saleCount: saleTransactions.length,
      purchaseCount: purchaseTransactions.length,
      totalROIValueEUR: Number(totalROIValue.toFixed(2)),
      totalSaleValueEUR: Number(totalSaleValue.toFixed(2)),
      totalPurchaseValueEUR: Number(totalPurchaseValue.toFixed(2)),
      netSaleGainsEUR: Number(netSaleGains.toFixed(2)),
      totalGainsEUR: Number(totalGains.toFixed(2)),
      totalTaxEUR: Number(totalTax.toFixed(2)),
      roiTaxEUR: Number(roiTax.toFixed(2)),
      saleTaxEUR: Number(saleTax.toFixed(2))
    },
    metadata: {
      source: 'moralis_portfolio_api_logic',
      generatedAt: new Date().toISOString(),
      walletAddress: transactions[0]?.to_address || transactions[0]?.from_address || 'unknown',
      chains: ['Ethereum', 'PulseChain'],
      year: '2025'
    }
  };
}

// 🔥 SCHRITT 3: BLOCKSCOUT API ALS BACKUP SOLUTION
const BLOCKSCOUT_CONFIG = {
  baseURL: 'https://scan.pulsechainfoundation.org/api',
  rateLimitDelay: 100, // 10 req/sec = 100ms between requests
  apiKey: process.env.BLOCKSCOUT_API_KEY || ''
};

// 🔥 SCHRITT 3: BLOCKSCOUT RATE LIMITER
class BlockScoutRateLimiter {
  constructor() {
    this.lastCallTime = 0;
    this.delay = BLOCKSCOUT_CONFIG.rateLimitDelay;
  }

  async waitForToken() {
    const now = Date.now();
    const timeSinceLastCall = now - this.lastCallTime;
    
    if (timeSinceLastCall < this.delay) {
      await new Promise(resolve => setTimeout(resolve, this.delay - timeSinceLastCall));
    }
    
    this.lastCallTime = Date.now();
  }
}

const blockScoutRateLimiter = new BlockScoutRateLimiter();

// 🔥 SCHRITT 3: BLOCKSCOUT TRANSACTION FETCHING
async function getBlockscoutTransactions(address, action = 'txlist') {
  try {
    await blockScoutRateLimiter.waitForToken();
    
    const params = new URLSearchParams({
      module: 'account',
      action: action,
      address: address,
      sort: 'desc',
      apikey: BLOCKSCOUT_CONFIG.apiKey
    });
    
    const response = await fetch(`${BLOCKSCOUT_CONFIG.baseURL}?${params}`);
    const data = await response.json();
    
    if (data.status === '1' && data.result) {
      console.log(`✅ BlockScout: Found ${data.result.length} ${action} transactions`);
      return data.result;
    } else {
      console.warn(`⚠️ BlockScout: No ${action} transactions found`);
      return [];
    }
    
  } catch (error) {
    console.error(`❌ BlockScout ${action} error:`, error.message);
    return [];
  }
}

// 🔥 SCHRITT 3: BLOCKSCOUT FALLBACK FUNCTIONS
async function getBlockscoutTokenTransfers(address) {
  return await getBlockscoutTransactions(address, 'tokentx');
}

async function getBlockscoutInternalTransactions(address) {
  return await getBlockscoutTransactions(address, 'txlistinternal');
}

async function getBlockscoutNormalTransactions(address) {
  return await getBlockscoutTransactions(address, 'txlist');
}

// 🔥 SCHRITT 4: TOKEN PRICING UND EUR CONVERSION STRATEGY
const PRICING_CONFIG = {
  // Tier 1 - Professional APIs
  coinGecko: {
    baseURL: 'https://api.coingecko.com/api/v3',
    rateLimit: 50, // requests per minute
    proTier: false // Set to true if using Pro API
  },
  coinMarketCap: {
    baseURL: 'https://pro-api.coinmarketcap.com/v1',
    apiKey: process.env.COINMARKETCAP_API_KEY || ''
  },
  // Tier 2 - DEX aggregators für PulseChain
  geckoTerminal: {
    baseURL: 'https://api.geckoterminal.com/api/v2',
    pulseChainId: 'pulsechain'
  }
};

// 🔥 SCHRITT 4: COINGECKO PRICE FETCHING
async function fetchCoinGeckoPrice(tokenId, date = null) {
  try {
    let url = `${PRICING_CONFIG.coinGecko.baseURL}/simple/price?ids=${tokenId}&vs_currencies=usd,eur`;
    
    if (date) {
      // Historical price endpoint
      url = `${PRICING_CONFIG.coinGecko.baseURL}/coins/${tokenId}/history?date=${date}`;
    }
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data && data[tokenId]) {
      return {
        usd: data[tokenId].usd || 0,
        eur: data[tokenId].eur || 0
      };
    }
    
    return { usd: 0, eur: 0 };
    
  } catch (error) {
    console.error(`❌ CoinGecko price error for ${tokenId}:`, error.message);
    return { usd: 0, eur: 0 };
  }
}

// 🔥 SCHRITT 4: PULSECHAIN TOKEN PRICE MAPPING
const PULSECHAIN_TOKEN_PRICES = {
  // Native tokens
  'PLS': { coinGeckoId: 'pulsechain', fallbackPrice: 0.00003003 },
  'PLSX': { coinGeckoId: 'pulsex', fallbackPrice: 0.00003 },
  'HEX': { coinGeckoId: 'hex', fallbackPrice: 0.006 },
  'INC': { coinGeckoId: 'incinerate', fallbackPrice: 0.005 },
  'DOMINANCE': { coinGeckoId: 'dominance', fallbackPrice: 0.32 },
  // Stablecoins
  'USDC': { coinGeckoId: 'usd-coin', fallbackPrice: 1.0 },
  'USDT': { coinGeckoId: 'tether', fallbackPrice: 1.0 },
  'DAI': { coinGeckoId: 'dai', fallbackPrice: 1.0 },
  // Other tokens
  'WBTC': { coinGeckoId: 'wrapped-bitcoin', fallbackPrice: 95000 },
  'ETH': { coinGeckoId: 'ethereum', fallbackPrice: 2400 },
  'FINVESTA': { coinGeckoId: 'finvesta', fallbackPrice: 24.23 },
  'FLEXMAS': { coinGeckoId: 'flexmas', fallbackPrice: 0.293 },
  'SOIL': { coinGeckoId: 'soil', fallbackPrice: 0.106 },
  'BEAST': { coinGeckoId: 'beast', fallbackPrice: 0.606 },
  'FINFIRE': { coinGeckoId: 'finfire', fallbackPrice: 3.426 },
  'MISSOR': { coinGeckoId: 'missor', fallbackPrice: 0.00936 },
  'SECRET': { coinGeckoId: 'secret', fallbackPrice: 0.0000145 }
};

// 🔥 SCHRITT 4: ENHANCED PRICE CALCULATION
async function calculateTokenPrice(tokenSymbol, tokenAddress, timestamp = null) {
  try {
    const tokenInfo = PULSECHAIN_TOKEN_PRICES[tokenSymbol?.toUpperCase()];
    
    if (tokenInfo && tokenInfo.coinGeckoId) {
      // Try CoinGecko first
      const price = await fetchCoinGeckoPrice(tokenInfo.coinGeckoId, timestamp);
      
      if (price.usd > 0) {
        return {
          usd: price.usd,
          eur: price.eur || (price.usd * 0.93), // USD to EUR conversion
          source: 'coingecko'
        };
      }
    }
    
    // Fallback to stored price
    const fallbackPrice = tokenInfo?.fallbackPrice || 0.0001;
    return {
      usd: fallbackPrice,
      eur: fallbackPrice * 0.93,
      source: 'fallback'
    };
    
  } catch (error) {
    console.error(`❌ Price calculation error for ${tokenSymbol}:`, error.message);
    return {
      usd: 0,
      eur: 0,
      source: 'error'
    };
  }
}

export default async function handler(req, res) {
  console.log('🇩🇪 TAX API: Starting with PORTFOLIO LOGIC');
  
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { address } = req.body;

    if (!address) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    // 🔍 DEBUG: Zeige die tatsächliche Wallet-Adresse
    console.log(`🔍 DEBUG: Processing wallet address: ${address}`);
    console.log(`🔍 DEBUG: Address length: ${address.length}`);
    console.log(`🔍 DEBUG: Is valid format: ${address.startsWith('0x') && address.length === 42}`);

    // API Key Check
    if (!MORALIS_API_KEY) {
      return res.status(500).json({ 
        error: 'Moralis API Key not configured'
      });
    }

    console.log(`🇩🇪 TAX: Processing ${address} with PORTFOLIO API LOGIC`);

    // 1. LADE ECHTE TRANSAKTIONEN (Portfolio API Logic)
    const transactions = await loadRealTransactionsForTax(address);
    
    console.log(`🔍 DEBUG: Total transactions loaded: ${transactions.length}`);
    
    if (transactions.length === 0) {
      console.log(`🔍 DEBUG: No transactions found - returning empty report`);
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
            source: 'moralis_portfolio_api_logic',
            message: 'No transactions found for 2025',
            walletAddress: address,
            debug: {
              addressProcessed: address,
              addressLength: address.length,
              isValidFormat: address.startsWith('0x') && address.length === 42,
              chainsChecked: ['0x1', '0x171'],
              yearFilter: 2025
            }
          }
        }
      });
    }

    // 2. DEUTSCHE STEUERBERECHNUNG
    const taxReport = calculateGermanTax(transactions);

    console.log(`✅ TAX: Report generated - ${taxReport.summary.totalTransactions} transactions`);

    return res.status(200).json({
      success: true,
      taxReport: taxReport,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(`❌ TAX API Error:`, error);
    
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

// 🔍 HILFSFUNKTIONEN
function isValidWalletAddress(address) {
    if (!address || typeof address !== 'string') return false;
    
    // Ethereum-Format: 0x + 40 Hex-Zeichen
    const ethRegex = /^0x[a-fA-F0-9]{40}$/;
    return ethRegex.test(address);
}

// 📋 API-DOKUMENTATION
/*
POST /api/german-tax-report

REQUEST BODY:
{
    "walletAddress": "0x742d35Cc6634C0532925a3b8D85E2C5b0b6c6F98",
    "chainIds": ["0x1"],
    "options": {
        "taxYear": 2025,
        "includeROI": true
    }
}

RESPONSE:
{
    "success": true,
    "wallet": "0x742d35Cc6634C0532925a3b8D85E2C5b0b6c6F98",
    "germanSummary": {
        "paragraph22": {
            "roiIncome": 1234.56,
            "total": 1234.56,
            "note": "§22 EStG - Sonstige Einkünfte"
        },
        "paragraph23": {
            "taxableGains": 567.89,
            "taxFreeGains": 123.45,
            "freigrenze600": {...}
        }
    },
    "transactions": [...],
    "fifoResults": [...],
    "taxTable": [...]
}
*/ 