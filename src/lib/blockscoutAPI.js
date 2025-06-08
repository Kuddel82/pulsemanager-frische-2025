/**
 * BlockScout API Client für PulseChain & Ethereum
 * Read-Only Zugriff für Portfolio-Tracking (DSGVO-konform)
 * Erstellt: PulseManager.vip Manual Wallet System
 */

// API Endpoints für verschiedene Chains (CORS-freundlich)
const BLOCKSCOUT_ENDPOINTS = {
  369: 'https://api.scan.pulsechain.com/api/v2', // PulseChain Mainnet (CORS-friendly)
  1: 'https://api.etherscan.io/api',              // Ethereum Mainnet (fallback)
  943: 'https://api.scan.pulsechain.com/api/v2', // PulseChain Testnet
  11155111: 'https://api.etherscan.io/api'       // Ethereum Sepolia
};

// Native Token Symbole
const NATIVE_SYMBOLS = {
  369: 'PLS',
  1: 'ETH',
  943: 'tPLS',
  11155111: 'ETH'
};

/**
 * Formatiert wei zu human-readable format
 * @param {string} weiValue - Wei value as string
 * @param {number} decimals - Decimal places (default 18)
 * @returns {string} Formatted value
 */
const formatFromWei = (weiValue, decimals = 18) => {
  if (!weiValue || weiValue === '0') return '0';
  const divisor = Math.pow(10, decimals);
  return (parseInt(weiValue) / divisor).toFixed(8);
};

/**
 * Validiert Wallet-Adresse
 * @param {string} address - Wallet address
 * @returns {boolean} True if valid
 */
const isValidAddress = (address) => {
  if (!address || typeof address !== 'string') return false;
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

/**
 * Erstelle API URL mit Parametern
 * @param {number} chainId - Chain ID
 * @param {string} endpoint - API endpoint
 * @param {object} params - Query parameters
 * @returns {string} Complete API URL
 */
const buildApiUrl = (chainId, endpoint, params = {}) => {
  const baseUrl = BLOCKSCOUT_ENDPOINTS[chainId];
  if (!baseUrl) {
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }

  const url = new URL(`${baseUrl}${endpoint}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      url.searchParams.append(key, value);
    }
  });

  return url.toString();
};

/**
 * API Request mit CORS Error Handling
 * @param {string} url - API URL
 * @param {object} options - Fetch options
 * @returns {Promise<object>} API response
 */
const apiRequest = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      method: 'GET',
      mode: 'cors', // Explicit CORS mode
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('BlockScout API Error:', error);
    
    // Spezifisches CORS Error Handling
    if (error.message.includes('CORS') || error.message.includes('Failed to fetch')) {
      throw new Error('CORS_ERROR: Blockchain API blockiert Cross-Origin Requests. Verwenden Sie den manuellen Refresh-Button.');
    }
    
    throw new Error(`API Request failed: ${error.message}`);
  }
};

/**
 * Hole Wallet-Balance (Native Token)
 * @param {string} address - Wallet address
 * @param {number} chainId - Chain ID
 * @returns {Promise<object>} Balance data
 */
export const getWalletBalance = async (address, chainId = 369) => {
  if (!isValidAddress(address)) {
    throw new Error('Invalid wallet address');
  }

  try {
    const url = buildApiUrl(chainId, `/addresses/${address.toLowerCase()}`);
    const data = await apiRequest(url);

    const balanceWei = data.coin_balance || '0';
    const balanceFormatted = formatFromWei(balanceWei);

    return {
      address: address.toLowerCase(),
      chainId,
      symbol: NATIVE_SYMBOLS[chainId] || 'UNKNOWN',
      balance: {
        wei: balanceWei,
        formatted: balanceFormatted,
        display: `${parseFloat(balanceFormatted).toFixed(4)} ${NATIVE_SYMBOLS[chainId]}`
      },
      usdValue: null, // Würde externe Price API benötigen
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error(`Error fetching balance for ${address} on chain ${chainId}:`, error);
    throw error;
  }
};

/**
 * Hole Token-Balances (ERC-20)
 * @param {string} address - Wallet address
 * @param {number} chainId - Chain ID
 * @returns {Promise<array>} Token balances
 */
export const getTokenBalances = async (address, chainId = 369) => {
  if (!isValidAddress(address)) {
    throw new Error('Invalid wallet address');
  }

  try {
    const url = buildApiUrl(chainId, `/addresses/${address.toLowerCase()}/tokens`, {
      type: 'ERC-20'
    });
    const data = await apiRequest(url);

    if (!data.items || !Array.isArray(data.items)) {
      return [];
    }

    return data.items.map(token => ({
      contractAddress: token.token?.address || '',
      symbol: token.token?.symbol || 'UNKNOWN',
      name: token.token?.name || 'Unknown Token',
      decimals: parseInt(token.token?.decimals || '18'),
      balance: {
        raw: token.value || '0',
        formatted: formatFromWei(token.value || '0', parseInt(token.token?.decimals || '18')),
        display: `${formatFromWei(token.value || '0', parseInt(token.token?.decimals || '18'))} ${token.token?.symbol || ''}`
      },
      usdValue: null // Würde externe Price API benötigen
    }));
  } catch (error) {
    console.error(`Error fetching token balances for ${address} on chain ${chainId}:`, error);
    return []; // Return empty array on error, nicht throw
  }
};

/**
 * Hole Transaction History (vereinfacht)
 * @param {string} address - Wallet address
 * @param {number} chainId - Chain ID
 * @param {number} limit - Number of transactions to fetch
 * @returns {Promise<array>} Transaction history
 */
export const getTransactionHistory = async (address, chainId = 369, limit = 10) => {
  if (!isValidAddress(address)) {
    throw new Error('Invalid wallet address');
  }

  try {
    const url = buildApiUrl(chainId, `/addresses/${address.toLowerCase()}/transactions`, {
      limit: Math.min(limit, 50) // Max 50 transactions
    });
    const data = await apiRequest(url);

    if (!data.items || !Array.isArray(data.items)) {
      return [];
    }

    return data.items.map(tx => ({
      hash: tx.hash || '',
      blockNumber: tx.block || 0,
      timestamp: tx.timestamp || null,
      from: tx.from?.hash || '',
      to: tx.to?.hash || '',
      value: {
        wei: tx.value || '0',
        formatted: formatFromWei(tx.value || '0'),
        display: `${formatFromWei(tx.value || '0')} ${NATIVE_SYMBOLS[chainId]}`
      },
      gasUsed: tx.gas_used || 0,
      status: tx.status || 'unknown',
      method: tx.method || null
    }));
  } catch (error) {
    console.error(`Error fetching transactions for ${address} on chain ${chainId}:`, error);
    return []; // Return empty array on error
  }
};

/**
 * Hole vollständige Wallet-Daten
 * @param {string} address - Wallet address
 * @param {number} chainId - Chain ID
 * @returns {Promise<object>} Complete wallet data
 */
export const getWalletData = async (address, chainId = 369) => {
  if (!isValidAddress(address)) {
    throw new Error('Invalid wallet address');
  }

  try {
    const [balance, tokens, transactions] = await Promise.allSettled([
      getWalletBalance(address, chainId),
      getTokenBalances(address, chainId),
      getTransactionHistory(address, chainId, 5)
    ]);

    return {
      address: address.toLowerCase(),
      chainId,
      chainName: getChainName(chainId),
      balance: balance.status === 'fulfilled' ? balance.value : null,
      tokens: tokens.status === 'fulfilled' ? tokens.value : [],
      transactions: transactions.status === 'fulfilled' ? transactions.value : [],
      lastSync: new Date().toISOString(),
      errors: [
        balance.status === 'rejected' ? `Balance: ${balance.reason.message}` : null,
        tokens.status === 'rejected' ? `Tokens: ${tokens.reason.message}` : null,
        transactions.status === 'rejected' ? `Transactions: ${transactions.reason.message}` : null
      ].filter(Boolean)
    };
  } catch (error) {
    console.error(`Error fetching wallet data for ${address}:`, error);
    throw error;
  }
};

/**
 * Chain Name Helper
 * @param {number} chainId - Chain ID
 * @returns {string} Chain name
 */
export const getChainName = (chainId) => {
  const names = {
    369: 'PulseChain Mainnet',
    1: 'Ethereum Mainnet',
    943: 'PulseChain Testnet',
    11155111: 'Ethereum Sepolia'
  };
  return names[chainId] || `Chain ${chainId}`;
};

/**
 * Teste API-Verbindung
 * @param {number} chainId - Chain ID
 * @returns {Promise<boolean>} True if API is reachable
 */
export const testApiConnection = async (chainId = 369) => {
  try {
    const url = buildApiUrl(chainId, '/stats');
    await apiRequest(url);
    return true;
  } catch (error) {
    console.error(`API connection test failed for chain ${chainId}:`, error);
    return false;
  }
};

// Export utilities
export {
  BLOCKSCOUT_ENDPOINTS,
  NATIVE_SYMBOLS,
  formatFromWei,
  isValidAddress
}; 