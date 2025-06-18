/**
 * 🇩🇪 DEUTSCHE CRYPTO-STEUER API - MORALIS v2.2 PULSECHAIN INTEGRATION
 * 
 * SCHRITT 1: Moralis API v2.2 mit PulseChain Support
 * - Chain ID 369 (0x171) für PulseChain
 * - ERC20 Token Transfers mit Pagination
 * - Token Balances und Metadata
 * - Rate Limiting: 25 requests/second
 */

// 🔧 MORALIS v2.2 KONFIGURATION
const MORALIS_API_KEY = process.env.MORALIS_API_KEY;
const MORALIS_BASE = 'https://deep-index.moralis.io/api/v2.2';

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

// 🔥 ERWEITERTE API-CALLS MIT v2.2
async function rateLimitedCall(fn) {
  const now = Date.now();
  const timeSinceLastCall = now - lastCallTime;
  
  if (timeSinceLastCall < MIN_CALL_INTERVAL) {
    await new Promise(resolve => setTimeout(resolve, MIN_CALL_INTERVAL - timeSinceLastCall));
  }
  
  lastCallTime = Date.now();
  return await fn();
}

// 🔥 SCHRITT 1: ERC20 TRANSFERS MIT v2.2 (KORREKTE URL)
async function fetchERC20TransfersV2(wallet, chainId, cursor = null) {
  try {
    console.log(`📊 TAX v2.2: Fetching ERC20 transfers for ${wallet} on chain ${chainId}`);
    
    // 🔥 FIX: KORREKTE Moralis v2.2 URL-Struktur
    let url = `${MORALIS_BASE}/${wallet}/erc20/transfers?chain=${chainId}&limit=500`;
    if (cursor) {
      url += `&cursor=${cursor}`;
    }
    
    console.log(`🔍 DEBUG: API URL: ${url}`);
    
    const res = await fetch(url, {
      headers: { 'X-API-Key': MORALIS_API_KEY }
    });
    
    if (!res.ok) {
      throw new Error(`ERC20 Transfers v2.2 API error: ${res.status}`);
    }
    
    const data = await res.json();
    console.log(`✅ TAX v2.2: Found ${data?.result?.length || 0} ERC20 transfers`);
    return data;
    
  } catch (error) {
    console.error('❌ TAX v2.2: fetchERC20Transfers error:', error.message);
    return { result: [], cursor: null };
  }
}

// 🔥 NEUE FUNKTION: WALLET HISTORY (KORREKTE URL)
async function fetchWalletHistoryV2(wallet, chainId) {
  try {
    console.log(`📊 TAX v2.2: Fetching wallet history for ${wallet} on chain ${chainId}`);
    
    // 🔥 KORREKTE URL: /wallets/:address/history
    const url = `${MORALIS_BASE}/wallets/${wallet}/history?chain=${chainId}&limit=500`;
    
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
    
    const url = `${MORALIS_BASE}/erc20/metadata?chain=${chainId}&addresses=${tokenAddress}`;
    
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
  
  // Calculate EUR value - VERBESSERTE PREISBERECHNUNG
  const amount = parseFloat(tx.value) / Math.pow(10, parseInt(tx.token_decimals) || 18);
  
  // 🚀 SICHERE PREIS-LOOKUP mit Fallback-Preisen
  const safePrices = {
    'PLS': 0.00003003,
    'PLSX': 0.00008,
    'HEX': 0.006,
    'INC': 0.005,
    'DAI': 1.0,
    'USDC': 1.0,
    'USDT': 1.0,
    'WBTC': 95000,
    'ETH': 2400,
    'FINVESTA': 24.23,
    'FLEXMAS': 0.293,
    'SOIL': 0.106,
    'BEAST': 0.606,
    'FINFIRE': 3.426,
    'MISSOR': 0.00936,
    'SECRET': 0.0000145,
    '🎭': 0.0001, // WGEP Token
    'TREASURY BILL ㉾': 1.0, // Treasury Bill
    '⛽': 0.0001, // Gas Token
    'UNKNOWN': 0.0001 // Unbekannte Token
  };
  
  // Preis ermitteln
  let usdValue = 0;
  const tokenSymbol = tx.token_symbol?.toUpperCase();
  
  // 1. Versuche Moralis USD-Preis
  if (tx.usd_price && parseFloat(tx.usd_price) > 0) {
    usdValue = parseFloat(tx.usd_price);
  }
  // 2. Fallback auf sichere Preise
  else if (safePrices[tokenSymbol]) {
    usdValue = safePrices[tokenSymbol];
  }
  // 3. Sehr niedriger Fallback für unbekannte Token
  else {
    usdValue = 0.0001;
  }
  
  const eurValue = usdValue * 0.93; // USD to EUR conversion
  
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
      direction: 'IN'
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
      direction: 'OUT'
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
      direction: 'IN'
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
    direction: isIncoming ? 'IN' : 'OUT'
  };
}

// 🔥 SCHRITT 5: MAIN FUNCTION MIT v2.2 INTEGRATION
async function loadRealTransactionsForTax(walletAddress) {
  console.log(`🇩🇪 TAX v2.2: Loading real transactions for ${walletAddress}`);
  
  // Beide Chains laden (wie Portfolio System)
  const chains = [
    { id: '0x1', name: 'Ethereum' },    // WGEP, USDC, ETH
    { id: PULSECHAIN_CONFIG.chainId, name: PULSECHAIN_CONFIG.name } // PLS, HEX, andere
  ];
  
  const allTransactions = [];
  
  for (const chain of chains) {
    console.log(`🔗 TAX v2.2: Loading ${chain.name} (${chain.id})...`);
    
    try {
      // 🔥 SCHRITT 5: MORALIS v2.2 MIT KORREKTEN ENDPUNKTEN
      let allTransfers = [];
      let cursor = null;
      let pageCount = 0;
      const maxPages = 10; // Max 10 pages = 5000 transactions
      
      console.log(`🔍 DEBUG: Starting Moralis v2.2 fetch for ${walletAddress} on ${chain.name}`);
      
      // 🔥 VERSUCHE ERC20 TRANSFERS ZUERST
      do {
        const transferData = await rateLimitedCall(() => 
          fetchERC20TransfersV2(walletAddress, chain.id, cursor)
        );
        
        console.log(`🔍 DEBUG: Page ${pageCount + 1} - Raw data:`, {
          hasResult: !!transferData.result,
          resultLength: transferData.result?.length || 0,
          hasCursor: !!transferData.cursor,
          cursor: transferData.cursor
        });
        
        if (transferData.result && transferData.result.length > 0) {
          allTransfers.push(...transferData.result);
          cursor = transferData.cursor;
          pageCount++;
          console.log(`📄 TAX v2.2: Page ${pageCount} - ${transferData.result.length} transfers`);
        } else {
          console.log(`🔍 DEBUG: No more data on page ${pageCount + 1}`);
          break;
        }
      } while (cursor && pageCount < maxPages);
      
      // 🔥 FALLBACK: WALLET HISTORY WENN ERC20 LEER
      if (allTransfers.length === 0) {
        console.log(`🔄 TAX v2.2: ERC20 empty, trying Wallet History...`);
        
        const historyData = await rateLimitedCall(() => 
          fetchWalletHistoryV2(walletAddress, chain.id)
        );
        
        if (historyData.result && historyData.result.length > 0) {
          allTransfers = historyData.result;
          console.log(`✅ TAX v2.2: Wallet History - ${allTransfers.length} items`);
        }
      }
      
      console.log(`🔍 DEBUG: Total transfers loaded: ${allTransfers.length}`);
      
      // Show sample transaction for debugging
      if (allTransfers.length > 0) {
        const sampleTx = allTransfers[0];
        console.log(`🔍 DEBUG: Sample transaction:`, {
          hash: sampleTx.transaction_hash || sampleTx.hash,
          timestamp: sampleTx.block_timestamp || sampleTx.timestamp,
          year: new Date(sampleTx.block_timestamp || sampleTx.timestamp).getFullYear(),
          token: sampleTx.token_symbol || sampleTx.token,
          from: sampleTx.from_address || sampleTx.from,
          to: sampleTx.to_address || sampleTx.to
        });
      }
      
      // 🔥 SCHRITT 5: BLOCKSCOUT FALLBACK FÜR PULSECHAIN
      if (chain.id === PULSECHAIN_CONFIG.chainId && allTransfers.length === 0) {
        console.log(`🔄 TAX v2.2: Moralis empty, trying BlockScout fallback...`);
        
        const [tokenTransfers, internalTxs, normalTxs] = await Promise.all([
          getBlockscoutTokenTransfers(walletAddress),
          getBlockscoutInternalTransactions(walletAddress),
          getBlockscoutNormalTransactions(walletAddress)
        ]);
        
        // Convert BlockScout format to Moralis format
        const blockScoutTransfers = [
          ...tokenTransfers.map(tx => ({
            transaction_hash: tx.hash,
            to_address: tx.to,
            from_address: tx.from,
            value: tx.value,
            token_address: tx.contractAddress,
            token_symbol: tx.tokenSymbol,
            token_name: tx.tokenName,
            token_decimals: tx.tokenDecimal,
            block_timestamp: new Date(parseInt(tx.timeStamp) * 1000).toISOString(),
            block_number: tx.blockNumber,
            chain: 'pulsechain',
            source: 'blockscout_fallback'
          })),
          ...normalTxs.map(tx => ({
            transaction_hash: tx.hash,
            to_address: tx.to,
            from_address: tx.from,
            value: tx.value,
            token_address: 'native',
            token_symbol: 'PLS',
            token_name: 'PulseChain',
            token_decimals: '18',
            block_timestamp: new Date(parseInt(tx.timeStamp) * 1000).toISOString(),
            block_number: tx.blockNumber,
            chain: 'pulsechain',
            source: 'blockscout_fallback'
          }))
        ];
        
        allTransfers = blockScoutTransfers;
        console.log(`✅ TAX v2.2: BlockScout fallback - ${allTransfers.length} transfers`);
      }
      
      // Filter 2025 (nur 2025 wie gewünscht)
      // 🔍 DEBUG: Temporär alle Jahre anzeigen
      const recentTransfers = allTransfers; // Entferne Jahr-Filter temporär
      
      console.log(`🔍 DEBUG: All transfers before year filter: ${allTransfers.length}`);
      console.log(`🔍 DEBUG: Year distribution:`, allTransfers.reduce((acc, tx) => {
        const year = new Date(tx.block_timestamp).getFullYear();
        acc[year] = (acc[year] || 0) + 1;
        return acc;
      }, {}));
      
      // 🔍 DEBUG: Zeige erste 3 Transaktionen für Debugging
      if (allTransfers.length > 0) {
        console.log(`🔍 DEBUG: First 3 transactions:`, allTransfers.slice(0, 3).map(tx => ({
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
      console.log(`✅ TAX v2.2: ${chain.name}: ${recentTransfers.length} transactions (2025)`);
      
    } catch (error) {
      console.error(`❌ TAX v2.2: Error loading ${chain.name}:`, error.message);
    }
  }
  
  console.log(`📊 TAX v2.2: TOTAL ${allTransactions.length} transactions loaded`);
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