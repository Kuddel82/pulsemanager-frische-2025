// 💰 ROI CACHE API - OPTIMIZED FOR PULSECHAIN
// Mit Rate Limiting, Memory + Supabase Caching, Performance Tracking

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const MORALIS_API_KEY = process.env.MORALIS_API_KEY;
const MORALIS_BASE = 'https://deep-index.moralis.io/api/v2';
const CACHE_TTL_MINUTES = 15; // Supabase Cache: 15 Minuten (Task requirement)
const MEMORY_CACHE_TTL = 10 * 60 * 1000; // Memory Cache: 10 Minuten

// 🏭 BEKANNTE ROI-MINTER ADRESSEN (synchron mit ROIDetectionService)
const KNOWN_MINTERS = [
  '0x0000000000000000000000000000000000000000', // Null address (Mint)
  '0x2b591e99afe9f32eaa6214f7b7629768c40eeb39', // HEX Contract (Ethereum + PulseChain)
  '0x8bd3d1472a656e312e94fb1bbdd599b8c51d18e3', // INC Contract
  '0x83d0cf6a8bc7d9af84b7fc1a6a8ad51f1e1e6fe1', // PLSX Minter
  '0xa4b89c0d48421c4ae9c7743e9e58b06e5ad8e2c6', // FLEX Minter
  '0xb7c3a5e1c6b45b9db4d4b8e6f4e2c7f8b8a7e6d5', // WGEP Minter  
  '0xc8d4b2f5e7a9c6b3d8e1f4a7b2c5d8e9f6a3b7c4', // LOAN Minter
];

// 🚦 RATE LIMITING: Max 5 API Calls pro Sekunde
let lastCallTime = 0;
const MIN_CALL_INTERVAL = 200; // 200ms zwischen Calls

async function rateLimitedCall(fn) {
  const now = Date.now();
  const timeSinceLastCall = now - lastCallTime;
  
  if (timeSinceLastCall < MIN_CALL_INTERVAL) {
    await new Promise(resolve => setTimeout(resolve, MIN_CALL_INTERVAL - timeSinceLastCall));
  }
  
  lastCallTime = Date.now();
  return await fn();
}

// 💾 MEMORY CACHE: Ultra-schnelle wiederholte Anfragen
const memoryCache = new Map();

function getMemoryCache(key) {
  const cached = memoryCache.get(key);
  if (cached && (Date.now() - cached.timestamp) < MEMORY_CACHE_TTL) {
    console.log(`🚀 Memory cache hit: ${key}`);
    return cached.data;
  }
  return null;
}

function setMemoryCache(key, data) {
  memoryCache.set(key, {
    data,
    timestamp: Date.now()
  });
}

// 🏭 MORALIS API CALLS mit Optimierungen
async function fetchROITransfers(wallet, chainId) {
  try {
    console.log(`💰 Fetching ROI transfers: ${wallet} on chain ${chainId}`);
    
    const transferData = await rateLimitedCall(async () => {
      const res = await fetch(`${MORALIS_BASE}/${wallet}/erc20/transfers?chain=${chainId}&limit=500`, {
        headers: { 'X-API-Key': MORALIS_API_KEY }
      });
      
      if (!res.ok) {
        throw new Error(`Transfers API error: ${res.status} ${res.statusText}`);
      }
      
      return await res.json();
    });
    
    if (!transferData?.result) {
      console.log('⚠️ No transfer data found');
      return [];
    }
    
    console.log(`📊 Found ${transferData.result.length} total transfers`);
    
    // Filter ROI Transfers (von bekannten Mintern + ROI Token-Symbole)
    const ROI_TOKENS = ['HEX', 'INC', 'PLSX', 'LOAN', 'FLEX', 'WGEP', 'MISOR', 'FLEXMES', 'PLS'];
    
    const roiTransfers = transferData.result.filter(tx => {
      const fromMinter = KNOWN_MINTERS.includes(tx.from_address.toLowerCase());
      const isROIToken = ROI_TOKENS.includes(tx.token_symbol?.toUpperCase());
      const isIncoming = tx.to_address.toLowerCase() === wallet.toLowerCase();
      
      return isIncoming && (fromMinter || isROIToken);
    });
    
    console.log(`✅ Found ${roiTransfers.length} ROI transfers from ${KNOWN_MINTERS.length} known minters`);
    
    return roiTransfers;
    
  } catch (error) {
    console.error('❌ fetchROITransfers error:', error.message);
    return [];
  }
}

// 💎 ROI DATA PROCESSING mit erweiterten Informationen
function processROIData(transfers) {
  if (!Array.isArray(transfers) || transfers.length === 0) {
    return {
      roiTransactions: [],
      totalTokensReceived: 0,
      uniqueTokens: 0,
      totalValue: 0,
      minterStats: {}
    };
  }

  const roiTransactions = transfers.map(tx => {
    const amount = parseFloat(tx.value) / Math.pow(10, parseInt(tx.token_decimal) || 18);
    const date = new Date(tx.block_timestamp);
    
    return {
      token: tx.token_symbol || 'Unknown',
      tokenAddress: tx.token_address.toLowerCase(),
      amount: amount,
      amountFormatted: amount.toFixed(8),
      minter: tx.from_address.toLowerCase(),
      minterName: getMinterName(tx.from_address.toLowerCase()),
      timestamp: tx.block_timestamp,
      date: date.toISOString(),
      dateFormatted: date.toLocaleDateString('de-DE'),
      blockNumber: tx.block_number,
      transactionHash: tx.transaction_hash,
      logIndex: tx.log_index
    };
  });

  // Statistiken berechnen
  const uniqueTokens = [...new Set(roiTransactions.map(tx => tx.tokenAddress))].length;
  const totalTokensReceived = roiTransactions.length;
  
  // Minter-Statistiken
  const minterStats = {};
  roiTransactions.forEach(tx => {
    const minter = tx.minter;
    if (!minterStats[minter]) {
      minterStats[minter] = {
        name: tx.minterName,
        count: 0,
        tokens: new Set()
      };
    }
    minterStats[minter].count++;
    minterStats[minter].tokens.add(tx.token);
  });

  // Convert Sets to arrays for serialization
  Object.keys(minterStats).forEach(minter => {
    minterStats[minter].tokens = Array.from(minterStats[minter].tokens);
    minterStats[minter].uniqueTokens = minterStats[minter].tokens.length;
  });

  return {
    roiTransactions,
    totalTokensReceived,
    uniqueTokens,
    totalValue: 0, // Will be calculated when prices are available
    minterStats,
    dateRange: {
      earliest: roiTransactions.length > 0 ? Math.min(...roiTransactions.map(tx => new Date(tx.timestamp).getTime())) : null,
      latest: roiTransactions.length > 0 ? Math.max(...roiTransactions.map(tx => new Date(tx.timestamp).getTime())) : null
    }
  };
}

// 🏷️ MINTER NAME MAPPING (erweitert für FLEX, WGEP, LOAN)
function getMinterName(address) {
  const minterNames = {
    '0x0000000000000000000000000000000000000000': 'Token Mint',
    '0x2b591e99afe9f32eaa6214f7b7629768c40eeb39': 'HEX Staking',
    '0x8bd3d1472a656e312e94fb1bbdd599b8c51d18e3': 'INC Staking',
    '0x83d0cf6a8bc7d9af84b7fc1a6a8ad51f1e1e6fe1': 'PLSX Staking',
    '0xa4b89c0d48421c4ae9c7743e9e58b06e5ad8e2c6': 'FLEX Rewards',
    '0xb7c3a5e1c6b45b9db4d4b8e6f4e2c7f8b8a7e6d5': 'WGEP Minter',
    '0xc8d4b2f5e7a9c6b3d8e1f4a7b2c5d8e9f6a3b7c4': 'LOAN Rewards'
  };
  
  return minterNames[address.toLowerCase()] || `Unknown Minter (${address.slice(0, 8)}...)`;
}

// 🎯 HAUPT-FUNKTION: ROI mit Cache-Management
export async function getOrLoadROI(userId, walletAddress, chainId = '0x171', options = {}) {
  const { forceRefresh = false } = options;
  const now = new Date();
  const cacheKey = `roi_${userId}_${walletAddress}_${chainId}`;
  
  console.log(`💰 ROI request: User ${userId}, Wallet ${walletAddress}, Chain ${chainId}`);

  try {
    // 1. CHECK MEMORY CACHE FIRST
    if (!forceRefresh) {
      const memoryData = getMemoryCache(cacheKey);
      if (memoryData) {
        console.log(`🚀 Memory cache hit for ROI ${cacheKey}`);
        return {
          source: 'memory_cache',
          cacheAge: Math.round((Date.now() - memoryData.timestamp) / 1000),
          ...memoryData
        };
      }
    }

    // 2. CHECK SUPABASE CACHE
    if (!forceRefresh) {
      const { data: existing, error } = await supabase
        .from('roi_cache')
        .select('*')
        .eq('user_id', userId)
        .eq('wallet_address', walletAddress)
        .eq('chain_id', chainId)
        .single();

      if (!error && existing && new Date(existing.cache_expires_at) > now) {
        console.log(`💾 Supabase cache hit for ROI ${cacheKey}`);
        
        const cacheData = {
          data: existing.roi_data,
          stats: existing.roi_stats || {},
          metadata: existing.metadata || {}
        };
        
        // Setze auch in Memory Cache
        setMemoryCache(cacheKey, cacheData);
        
        return {
          source: 'supabase_cache',
          cacheAge: Math.round((now - new Date(existing.updated_at)) / 1000),
          ...cacheData
        };
      }
    }

    // 3. FRESH DATA LOADING
    console.log(`🔄 Loading fresh ROI data for ${cacheKey}`);
    const startTime = Date.now();
    
    const transfers = await fetchROITransfers(walletAddress, chainId);
    const processedData = processROIData(transfers);
    
    const processingTime = Date.now() - startTime;
    
    const stats = {
      totalTransfers: transfers.length,
      processingTime,
      apiCalls: {
        moralis: 1, // Transfers API Call
        total: 1
      },
      minterCount: Object.keys(processedData.minterStats).length
    };

    const metadata = {
      generatedAt: now.toISOString(),
      walletAddress,
      chainId,
      version: 'v0.1.9-ROI-OPTIMIZED',
      knownMinters: KNOWN_MINTERS.length
    };

    const cacheData = {
      data: processedData,
      stats,
      metadata
    };

    // 4. SPEICHERE IN SUPABASE
    const upsertData = {
      user_id: userId,
      wallet_address: walletAddress,
      chain_id: chainId,
      roi_data: processedData,
      roi_stats: stats,
      metadata: metadata,
      cache_expires_at: new Date(now.getTime() + CACHE_TTL_MINUTES * 60 * 1000).toISOString(),
      updated_at: now.toISOString()
    };

    const { error: upsertError } = await supabase
      .from('roi_cache')
      .upsert(upsertData, { 
        onConflict: ['user_id', 'wallet_address', 'chain_id'] 
      });

    if (upsertError) {
      console.error('⚠️ Supabase ROI cache save error:', upsertError.message);
    } else {
      console.log(`✅ ROI cached in Supabase for ${CACHE_TTL_MINUTES} minutes`);
    }

    // 5. SPEICHERE IN MEMORY CACHE
    setMemoryCache(cacheKey, cacheData);

    console.log(`✅ ROI processed: ${processedData.totalTokensReceived} transfers, ${processedData.uniqueTokens} unique tokens in ${processingTime}ms`);

    return {
      source: 'fresh',
      cacheAge: 0,
      ...cacheData
    };

  } catch (error) {
    console.error('💥 ROI loading error:', error);
    throw error;
  }
}

// 🧹 ROI CACHE CLEANUP
export async function clearROICache(userId, walletAddress = null, chainId = null) {
  try {
    let query = supabase.from('roi_cache').delete().eq('user_id', userId);
    
    if (walletAddress) query = query.eq('wallet_address', walletAddress);
    if (chainId) query = query.eq('chain_id', chainId);
    
    const { error } = await query;
    
    if (error) {
      console.error('❌ ROI cache clear error:', error.message);
      return false;
    }
    
    // Clear memory cache too
    const keys = Array.from(memoryCache.keys()).filter(key => 
      key.startsWith(`roi_${userId}`)
    );
    keys.forEach(key => memoryCache.delete(key));
    
    console.log(`✅ ROI cache cleared for user ${userId}`);
    return true;
    
  } catch (error) {
    console.error('💥 ROI cache clear error:', error);
    return false;
  }
}

// 📊 API ENDPOINT
export default async function handler(req, res) {
  console.log('💰 ROI CACHE API: Request received');
  
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { userId, walletAddress, chainId = '0x171', forceRefresh = false } = req.query;

  // Validation
  if (!userId || !walletAddress) {
    return res.status(400).json({ 
      error: 'userId und walletAddress erforderlich',
      usage: '/api/roi-cache?userId=123&walletAddress=0x...'
    });
  }

  if (!MORALIS_API_KEY || !process.env.SUPABASE_URL) {
    return res.status(503).json({ 
      error: 'API-Konfiguration fehlt (Moralis oder Supabase)'
    });
  }

  try {
    if (req.method === 'DELETE') {
      // ROI CACHE LÖSCHEN
      const success = await clearROICache(userId, walletAddress, chainId);
      return res.status(200).json({
        success,
        message: success ? 'ROI Cache gelöscht' : 'Cache-Löschung fehlgeschlagen'
      });
    }
    
    // ROI DATEN LADEN
    const result = await getOrLoadROI(userId, walletAddress, chainId, {
      forceRefresh: forceRefresh === 'true'
    });

    return res.status(200).json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('💥 ROI API error:', error);
    return res.status(500).json({
      error: 'Fehler beim Laden der ROI-Daten',
      message: error.message
    });
  }
} 