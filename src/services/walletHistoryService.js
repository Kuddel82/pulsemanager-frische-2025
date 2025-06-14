// 🚀 WALLET HISTORY SERVICE - Moralis Wallet History API
// Verwendet die neue Moralis Wallet History API für vollständige Transaktionshistorie
// Perfekt für PulseChain Token-Preise und Transaktionsdaten

const MORALIS_BASE_URL = 'https://deep-index.moralis.io/api/v2.2';

export class WalletHistoryService {
  
  static API_TIMEOUT = 30000; // 30 Sekunden

  /**
   * 🚀 MORALIS WALLET HISTORY API - Vollständige Wallet-Historie in 1 Call
   * @param {string} walletAddress - Wallet-Adresse
   * @param {Object} options - Optionen für die Abfrage
   * @returns {Promise<Object>} Vollständige Wallet-Historie
   */
  static async getWalletHistory(walletAddress, options = {}) {
    const {
      chain = '0x171', // PulseChain Standard
      fromDate = null,
      toDate = null,
      includeInternalTransactions = true,
      includeNftMetadata = true,
      order = 'DESC',
      limit = 100
    } = options;

    // 🔑 CHECK MORALIS ACCESS
    const apiKey = import.meta.env.VITE_MORALIS_API_KEY;
    if (!apiKey) {
      throw new Error('Moralis API Key required for Wallet History');
    }

    console.log(`🚀 WALLET HISTORY: Loading complete history for ${walletAddress.slice(0, 8)}... on chain ${chain}`);

    try {
      // 🌐 Build API URL
      const url = `${MORALIS_BASE_URL}/wallets/${walletAddress}/history`;
      
      // 📋 Build query parameters
      const params = new URLSearchParams({
        chain: chain,
        order: order,
        limit: limit.toString()
      });

      // 📅 Add date filters if provided
      if (fromDate) {
        params.append('from_date', fromDate);
      }
      if (toDate) {
        params.append('to_date', toDate);
      }

      // 🔧 Add optional parameters
      if (includeInternalTransactions) {
        params.append('include_internal_transactions', 'true');
      }
      if (includeNftMetadata) {
        params.append('nft_metadata', 'true');
      }

      const fullUrl = `${url}?${params.toString()}`;
      console.log(`🔍 WALLET HISTORY URL: ${fullUrl.replace(apiKey, 'API_KEY_HIDDEN')}`);

      // 📡 Make API request
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'X-API-Key': apiKey,
          'Accept': 'application/json'
        },
        timeout: this.API_TIMEOUT
      });

      if (!response.ok) {
        throw new Error(`Moralis Wallet History API Error: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      
      console.log(`✅ WALLET HISTORY: Loaded ${data.result?.length || 0} transactions`);
      console.log(`📊 WALLET HISTORY: Page ${data.page || 1}, Total pages available: ${data.cursor ? 'More available' : 'Last page'}`);

      return {
        success: true,
        transactions: data.result || [],
        pagination: {
          page: data.page,
          pageSize: data.page_size,
          cursor: data.cursor,
          hasMore: !!data.cursor
        },
        source: 'moralis_wallet_history',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error(`❌ WALLET HISTORY ERROR:`, error);
      return {
        success: false,
        transactions: [],
        error: error.message,
        source: 'moralis_wallet_history_error'
      };
    }
  }

  /**
   * 🔍 EXTRACT TOKEN PRICES from Wallet History
   * Extrahiert Token-Preise aus Transaktionshistorie für bessere PulseChain-Abdeckung
   * @param {Array} transactions - Transaktionen aus Wallet History
   * @returns {Object} Token-Preise Map
   */
  static extractTokenPricesFromHistory(transactions) {
    const tokenPrices = {};
    const tokenInfo = {};

    console.log(`🔍 EXTRACTING PRICES: Analyzing ${transactions.length} transactions for price data`);

    transactions.forEach(tx => {
      try {
        // 💰 Native Token Transfers (ETH, PLS)
        if (tx.category === 'send' || tx.category === 'receive') {
          const nativeSymbol = tx.chain === '0x171' ? 'PLS' : 'ETH';
          if (tx.value && tx.value !== '0') {
            // Hier könnten wir historische Preise ableiten
            tokenInfo[nativeSymbol] = {
              symbol: nativeSymbol,
              name: tx.chain === '0x171' ? 'PulseChain' : 'Ethereum',
              address: 'native',
              decimals: 18
            };
          }
        }

        // 🪙 ERC20 Token Transfers
        if (tx.category === 'erc20' && tx.erc20_transfers) {
          tx.erc20_transfers.forEach(transfer => {
            const tokenAddress = transfer.token_address?.toLowerCase();
            const tokenSymbol = transfer.token_symbol;
            const tokenName = transfer.token_name;
            const decimals = transfer.token_decimals;

            if (tokenAddress && tokenSymbol) {
              tokenInfo[tokenAddress] = {
                symbol: tokenSymbol,
                name: tokenName || tokenSymbol,
                address: tokenAddress,
                decimals: parseInt(decimals) || 18
              };

              // 💡 Hier könnten wir aus großen Transfers Preise ableiten
              // Zum Beispiel: Wenn jemand 1000 USDT für 1000 USD transferiert
              // Aber das ist komplex und nicht immer zuverlässig
            }
          });
        }

        // 🎨 NFT Transfers
        if (tx.category === 'nft' && tx.nft_transfers) {
          tx.nft_transfers.forEach(nft => {
            const tokenAddress = nft.token_address?.toLowerCase();
            if (tokenAddress) {
              tokenInfo[tokenAddress] = {
                symbol: nft.token_symbol || 'NFT',
                name: nft.token_name || 'NFT Collection',
                address: tokenAddress,
                type: 'nft',
                decimals: 0
              };
            }
          });
        }

      } catch (error) {
        console.warn(`⚠️ Error processing transaction ${tx.hash}:`, error.message);
      }
    });

    console.log(`✅ PRICE EXTRACTION: Found ${Object.keys(tokenInfo).length} unique tokens in transaction history`);

    return {
      tokenPrices,
      tokenInfo,
      totalTransactions: transactions.length,
      uniqueTokens: Object.keys(tokenInfo).length
    };
  }

  /**
   * 🔄 GET ALL WALLET HISTORY (with pagination)
   * Lädt die komplette Wallet-Historie mit automatischer Paginierung
   * @param {string} walletAddress - Wallet-Adresse
   * @param {Object} options - Optionen
   * @returns {Promise<Object>} Komplette Wallet-Historie
   */
  static async getAllWalletHistory(walletAddress, options = {}) {
    const {
      maxPages = 10,
      maxTransactions = 1000,
      ...otherOptions
    } = options;

    let allTransactions = [];
    let currentPage = 1;
    let cursor = null;
    let hasMore = true;

    console.log(`🔄 LOADING COMPLETE HISTORY: Max ${maxPages} pages, ${maxTransactions} transactions`);

    while (hasMore && currentPage <= maxPages && allTransactions.length < maxTransactions) {
      const pageOptions = {
        ...otherOptions,
        cursor: cursor
      };

      const result = await this.getWalletHistory(walletAddress, pageOptions);
      
      if (!result.success) {
        console.error(`❌ Failed to load page ${currentPage}:`, result.error);
        break;
      }

      allTransactions.push(...result.transactions);
      
      hasMore = result.pagination.hasMore;
      cursor = result.pagination.cursor;
      currentPage++;

      console.log(`📄 LOADED PAGE ${currentPage - 1}: ${result.transactions.length} transactions, Total: ${allTransactions.length}`);

      // Rate limiting zwischen Seiten
      if (hasMore) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    console.log(`✅ COMPLETE HISTORY LOADED: ${allTransactions.length} transactions across ${currentPage - 1} pages`);

    return {
      success: true,
      transactions: allTransactions,
      totalTransactions: allTransactions.length,
      pagesLoaded: currentPage - 1,
      source: 'moralis_wallet_history_complete'
    };
  }
} 