import { createPublicClient, http } from 'viem';
import { pulsechain } from 'viem/chains';
import { logger } from './logger';

// PulseChain RPC Client
const publicClient = createPublicClient({
  chain: pulsechain,
  transport: http()
});

// ERC20 Token ABI
const tokenABI = [
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', type: 'string' }],
    type: 'function'
  }
];

// Bekannte PulseChain Token-Adressen
const KNOWN_TOKENS = {
  '0x95B303987A60C71504D99Aa1b13B4DA07b0790ab': { // PLSX
    symbol: 'PLSX',
    decimals: 18,
    name: 'PulseX'
  },
  '0xefD766cCb38EaF1dfd701853BFCe31359239F305': { // PLS
    symbol: 'PLS',
    decimals: 18,
    name: 'Pulse'
  }
  // Weitere Token können hier hinzugefügt werden
};

export const walletService = {
  // PLS Balance abrufen
  async getPlsBalance(address) {
    try {
      const balance = await publicClient.getBalance({ address });
      return balance;
    } catch (error) {
      logger.error('Error fetching PLS balance:', error);
      throw error;
    }
  },

  // Token Balance abrufen
  async getTokenBalance(tokenAddress, walletAddress) {
    try {
      const balance = await publicClient.readContract({
        address: tokenAddress,
        abi: tokenABI,
        functionName: 'balanceOf',
        args: [walletAddress]
      });
      return balance;
    } catch (error) {
      logger.error('Error fetching token balance:', error);
      throw error;
    }
  },

  // Token Metadaten abrufen
  async getTokenMetadata(tokenAddress) {
    try {
      if (KNOWN_TOKENS[tokenAddress]) {
        return KNOWN_TOKENS[tokenAddress];
      }

      const [decimals, symbol] = await Promise.all([
        publicClient.readContract({
          address: tokenAddress,
          abi: tokenABI,
          functionName: 'decimals'
        }),
        publicClient.readContract({
          address: tokenAddress,
          abi: tokenABI,
          functionName: 'symbol'
        })
      ]);

      return { decimals, symbol };
    } catch (error) {
      logger.error('Error fetching token metadata:', error);
      throw error;
    }
  },

  // Alle Token Balances abrufen
  async getAllTokenBalances(walletAddress) {
    try {
      const balances = [];
      
      // PLS Balance
      const plsBalance = await this.getPlsBalance(walletAddress);
      balances.push({
        symbol: 'PLS',
        balance: plsBalance,
        decimals: 18,
        usdValue: 0 // TODO: Implementiere PLS/USD Preis
      });

      // Token Balances
      for (const [address, token] of Object.entries(KNOWN_TOKENS)) {
        const balance = await this.getTokenBalance(address, walletAddress);
        if (balance > 0n) {
          balances.push({
            symbol: token.symbol,
            balance,
            decimals: token.decimals,
            usdValue: 0 // TODO: Implementiere Token/USD Preise
          });
        }
      }

      return balances;
    } catch (error) {
      logger.error('Error fetching all token balances:', error);
      throw error;
    }
  },

  // Wallet Transaktionen abrufen
  async getWalletTransactions(walletAddress) {
    try {
      // TODO: Implementiere Transaktionsabruf von PulseChain Explorer
      // Momentan nur Dummy-Daten
      return [];
    } catch (error) {
      logger.error('Error fetching wallet transactions:', error);
      throw error;
    }
  },

  // Token Transfers abrufen
  async getTokenTransfers(tokenAddress, walletAddress) {
    try {
      // TODO: Implementiere Token Transfer Abruf von PulseChain Explorer
      // Momentan nur Dummy-Daten
      return [];
    } catch (error) {
      logger.error('Error fetching token transfers:', error);
      throw error;
    }
  }
}; 

// Separate export for ROI Tracker compatibility
export const getAllPulsechainTokensFromBlockscout = async (walletAddress) => {
  try {
    // Reuse the existing function from walletService
    return await walletService.getAllTokenBalances(walletAddress);
  } catch (error) {
    logger.error('Error in getAllPulsechainTokensFromBlockscout:', error);
    return [];
  }
};