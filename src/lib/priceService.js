// Cache invalidation - 2024-03-19
import { logger } from '@/lib/logger';
import { retryOperation, retryStrategies, RetryError } from '@/lib/retryService';

const DEXSCREENER_API_URL = 'https://api.dexscreener.com/latest/dex';
const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3';

const CHAIN_ID_TO_COINGECKO_PLATFORM = {
  '369': 'pulsechain', 
  '1': 'ethereum' 
};

const CHAIN_ID_TO_DEXSCREENER_CHAINNAME = {
  '369': 'pulsechain',
  '1': 'ethereum'
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
let priceCache = {};
let lastFetchTime = {};

class PriceApiError extends Error {
  constructor(message, type, status) {
    super(message);
    this.name = 'PriceApiError';
    this.type = type; 
    this.status = status;
  }
}

export const fetchTokenPrices = async (symbols) => {
  const now = Date.now();
  const prices = {};

  // Filter symbols that need to be fetched
  const symbolsToFetch = symbols.filter(symbol => {
    const lastFetch = lastFetchTime[symbol] || 0;
    return !priceCache[symbol] || (now - lastFetch) > CACHE_DURATION;
  });

  if (symbolsToFetch.length > 0) {
    try {
      // Fetch prices from CoinGecko API
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${symbolsToFetch.join(',')}&vs_currencies=usd`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Update cache with new prices
      symbolsToFetch.forEach(symbol => {
        const price = data[symbol]?.usd;
        if (price) {
          priceCache[symbol] = price;
          lastFetchTime[symbol] = now;
        }
      });
    } catch (error) {
      logger.error('Error fetching token prices:', error);
      // If API fails, use cached prices if available
      symbolsToFetch.forEach(symbol => {
        if (priceCache[symbol]) {
          prices[symbol] = priceCache[symbol];
        }
      });
    }
  }

  // Combine cached and newly fetched prices
  symbols.forEach(symbol => {
    prices[symbol] = priceCache[symbol] || 0;
  });

  return prices;
};

export const fetchHistoricalPrices = async (symbol, date) => {
  try {
    const timestamp = Math.floor(new Date(date).getTime() / 1000);
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/${symbol}/history?date=${date}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.market_data?.current_price?.usd || 0;
  } catch (error) {
    logger.error('Error fetching historical price:', error);
    return 0;
  }
};

export const fetchMultipleHistoricalPrices = async (symbols, date) => {
  const prices = {};
  const promises = symbols.map(async symbol => {
    prices[symbol] = await fetchHistoricalPrices(symbol, date);
  });

  await Promise.all(promises);
  return prices;
};

export const clearPriceCache = () => {
  priceCache = {};
  lastFetchTime = {};
};

export const getCachedPrice = (symbol) => {
  return priceCache[symbol] || 0;
};

export const isPriceCacheValid = (symbol) => {
  const lastFetch = lastFetchTime[symbol] || 0;
  return priceCache[symbol] && (Date.now() - lastFetch) <= CACHE_DURATION;
};

export const updatePriceCache = (symbol, price) => {
  priceCache[symbol] = price;
  lastFetchTime[symbol] = Date.now();
};

export const getPriceCacheStatus = () => {
  return {
    cacheSize: Object.keys(priceCache).length,
    lastUpdate: new Date(Math.max(...Object.values(lastFetchTime))),
    symbols: Object.keys(priceCache)
  };
};

export const getTokenPrice = async (tokenAddress, chainId = '369', tokenSymbol = 'UNKNOWN') => {
  try {
    
    const addressMapKey = tokenSymbol !== 'UNKNOWN' ? tokenSymbol : tokenAddress;
    const prices = await fetchTokenPrices({ [addressMapKey]: tokenAddress }, chainId);
    return prices?.[addressMapKey] || 0;
  } catch (error) {
    logger.error(`PriceService: Error fetching single token price for ${tokenAddress} (Symbol: ${tokenSymbol}) after retries:`, error.originalError?.message || error.message);
    return 0;
  }
};

export const NATIVE_TOKEN_SYMBOLS = {
  PULSECHAIN: 'PLS',
  ETHEREUM: 'ETH'
};

export const NATIVE_TOKEN_ADDRESS_PLACEHOLDER = '0x0000000000000000000000000000000000000000';

export const getNativeTokenWrapperAddress = (chainId = '369') => {
  if (String(chainId) === '369') { 
    return '0xA1077a294dC1f4cFB0b86530fc3D182038FD36D8'; 
  }
  if (String(chainId) === '1') { 
    return '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'; 
  }
  logger.warn(`PriceService: No native token wrapper address defined for chainId: ${chainId}`);
  return null;
};
