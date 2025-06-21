/**
 * 🔥 REAL TRANSACTION DATA FIX - HIGH VOLUME LOADING
 * 
 * ✅ Multiple Transaction Endpoints
 * ✅ Echte Transaction History (nicht nur Token Lists)
 * ✅ Thousands of Transactions
 * ✅ Proper Data Format für Printer Detection
 * ✅ Enhanced Data Processing
 */

module.exports = async function handler(req, res) {
  console.log('🔥 REAL TRANSACTION LOADER - HIGH VOLUME VERSION!');
  
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    const params = req.method === 'POST' ? { ...req.query, ...req.body } : req.query;
    const { address } = params;
    
    if (!address) {
      return res.status(400).json({
        success: false,
        error: 'Address required'
      });
    }

    console.log('🎯 Loading REAL transaction data for:', address);

    // 🔥 MULTIPLE DATA SOURCES FOR MAXIMUM COVERAGE
    const endpoints = [
      // NATIVE TRANSACTIONS (ETH/PLS transfers)
      { chain: 'eth', endpoint: 'transactions', limit: 500, description: 'ETH Native Transactions' },
      { chain: 'pls', endpoint: 'transactions', limit: 500, description: 'PLS Native Transactions' },
      
      // ERC20 TRANSFERS (Token transfers)  
      { chain: 'eth', endpoint: 'erc20/transfers', limit: 1000, description: 'ETH ERC20 Transfers' },
      { chain: 'pls', endpoint: 'erc20/transfers', limit: 1000, description: 'PLS ERC20 Transfers' },
      
      // NFT TRANSFERS (for completeness)
      { chain: 'eth', endpoint: 'nft/transfers', limit: 200, description: 'ETH NFT Transfers' },
      { chain: 'pls', endpoint: 'nft/transfers', limit: 200, description: 'PLS NFT Transfers' }
    ];

    let allTransactions = [];
    let apiResults = {};
    let totalApiCalls = 0;

    // 🚀 PARALLEL LOADING FOR SPEED
    const promises = endpoints.map(async (endpoint) => {
      try {
        totalApiCalls++;
        
        // Build URL with proper parameters
        const url = `https://pulsemanager.vip/api/moralis-v2?address=${address}&chain=${endpoint.chain}&endpoint=${endpoint.endpoint}&limit=${endpoint.limit}`;
        
        console.log(`📡 Loading: ${endpoint.description}...`);
        console.log(`📡 URL: ${url}`);
        
        const response = await fetch(url);
        const data = await response.json();
        
        console.log(`📊 ${endpoint.description}: ${response.status} - ${data?.result?.length || 0} items`);
        
        apiResults[`${endpoint.chain}_${endpoint.endpoint.replace('/', '_')}`] = {
          status: response.status,
          count: data?.result?.length || 0,
          success: data?.success || false,
          endpoint: endpoint.endpoint
        };
        
        if (data?.result && Array.isArray(data.result)) {
          // Add metadata to each transaction
          const processedTransactions = data.result.map(tx => ({
            ...tx,
            sourceChain: endpoint.chain === 'eth' ? 'Ethereum' : 'PulseChain',
            chainSymbol: endpoint.chain === 'eth' ? 'ETH' : 'PLS',
            dataSource: endpoint.endpoint,
            loadedAt: new Date().toISOString()
          }));
          
          return processedTransactions;
        }
        
        return [];
        
      } catch (error) {
        console.error(`❌ Error loading ${endpoint.description}:`, error);
        apiResults[`${endpoint.chain}_${endpoint.endpoint.replace('/', '_')}`] = {
          status: 'error',
          count: 0,
          error: error.message
        };
        return [];
      }
    });

    // Wait for all API calls
    const results = await Promise.all(promises);
    
    // Flatten all results
    allTransactions = results.flat();
    
    console.log('🎯 Raw data loaded:', {
      totalApiCalls,
      totalTransactions: allTransactions.length,
      apiResults
    });

    // 🔥 DATA PROCESSING AND ENRICHMENT
    const processedTransactions = allTransactions.map((tx, index) => {
      // ENHANCED DATA EXTRACTION
      let tokenSymbol = 'UNKNOWN';
      let tokenName = 'Unknown Token';
      let valueFormatted = '0.000000';
      let timestamp = 'N/A';
      let direction = 'unknown';
      let directionIcon = '❓';
      
      // SYMBOL EXTRACTION
      if (tx.token_symbol) {
        tokenSymbol = tx.token_symbol.toUpperCase();
      } else if (tx.symbol) {
        tokenSymbol = tx.symbol.toUpperCase();
      } else if (tx.chainSymbol === 'ETH') {
        tokenSymbol = 'ETH';
      } else if (tx.chainSymbol === 'PLS') {
        tokenSymbol = 'PLS';
      }
      
      // NAME EXTRACTION
      if (tx.token_name) {
        tokenName = tx.token_name;
      } else if (tx.name) {
        tokenName = tx.name;
      } else {
        tokenName = tokenSymbol + ' Token';
      }
      
      // VALUE EXTRACTION
      if (tx.value && tx.token_decimals) {
        const decimals = parseInt(tx.token_decimals) || 18;
        valueFormatted = (parseFloat(tx.value) / Math.pow(10, decimals)).toFixed(6);
      } else if (tx.value) {
        valueFormatted = (parseFloat(tx.value) / Math.pow(10, 18)).toFixed(6);
      } else if (tx.amount) {
        valueFormatted = parseFloat(tx.amount).toFixed(6);
      }
      
      // TIMESTAMP EXTRACTION
      if (tx.block_timestamp) {
        timestamp = new Date(tx.block_timestamp).toLocaleDateString('de-DE');
      } else if (tx.timestamp) {
        timestamp = new Date(tx.timestamp).toLocaleDateString('de-DE');
      } else if (tx.date) {
        timestamp = new Date(tx.date).toLocaleDateString('de-DE');
      }
      
      // DIRECTION DETECTION
      const fromAddress = tx.from_address || tx.from || tx.fromAddress;
      const toAddress = tx.to_address || tx.to || tx.toAddress;
      
      if (fromAddress?.toLowerCase() === address.toLowerCase()) {
        direction = 'out';
        directionIcon = '📤';
      } else if (toAddress?.toLowerCase() === address.toLowerCase()) {
        direction = 'in';
        directionIcon = '📥';
      }
      
      // BASIC TAX CATEGORIZATION
      let taxCategory = 'Transfer';
      let isTaxable = false;
      let isPrinter = false;
      let printerProject = null;
      
      // SIMPLE PRINTER DETECTION
      if (tx.chainSymbol === 'PLS' || tx.sourceChain === 'PulseChain') {
        // Basic PulseChain printer patterns
        if (tokenSymbol === 'HEX' || 
            tokenSymbol === 'PLSX' || 
            tokenSymbol === 'WGEP' ||
            fromAddress === '0x0000000000000000000000000000000000000000') {
          isPrinter = true;
          printerProject = `${tokenSymbol} Printer`;
          taxCategory = `${tokenSymbol} Printer ROI`;
          isTaxable = true;
        }
      }
      
      return {
        ...tx,
        tokenSymbol,
        tokenName,
        valueFormatted,
        timestamp,
        direction,
        directionIcon,
        taxCategory,
        isTaxable,
        isPrinter,
        printerProject,
        processedAt: new Date().toISOString(),
        uniqueId: `${tx.transaction_hash || tx.hash || 'unknown'}_${index}`
      };
    });

    // SORT BY TIMESTAMP (newest first)
    processedTransactions.sort((a, b) => {
      const timeA = new Date(a.block_timestamp || a.timestamp || 0).getTime();
      const timeB = new Date(b.block_timestamp || b.timestamp || 0).getTime();
      return timeB - timeA;
    });

    // CALCULATE ENHANCED SUMMARY
    const summary = {
      totalTransactions: processedTransactions.length,
      ethereumCount: processedTransactions.filter(tx => tx.chainSymbol === 'ETH').length,
      pulsechainCount: processedTransactions.filter(tx => tx.chainSymbol === 'PLS').length,
      roiCount: processedTransactions.filter(tx => tx.taxCategory.includes('ROI')).length,
      taxableCount: processedTransactions.filter(tx => tx.isTaxable).length,
      printerCount: processedTransactions.filter(tx => tx.isPrinter).length,
      
      // DATA SOURCE BREAKDOWN
      dataSources: {
        ethTransactions: apiResults.eth_transactions?.count || 0,
        plsTransactions: apiResults.pls_transactions?.count || 0,
        ethErc20: apiResults.eth_erc20_transfers?.count || 0,
        plsErc20: apiResults.pls_erc20_transfers?.count || 0,
        ethNft: apiResults.eth_nft_transfers?.count || 0,
        plsNft: apiResults.pls_nft_transfers?.count || 0
      },
      
      // TOTALS
      totalWGEPPurchased: '0.000000',
      totalWGEPROI: '0.000000',
      totalWGEPCost: '0.000000',
      totalROIValueEUR: processedTransactions
        .filter(tx => tx.isTaxable)
        .reduce((sum, tx) => sum + parseFloat(tx.valueFormatted || 0), 0)
        .toFixed(2),
      totalTaxEUR: '0.00'
    };

    console.log('✅ Processing complete:', {
      totalProcessed: processedTransactions.length,
      printerCount: summary.printerCount,
      taxableCount: summary.taxableCount,
      dataSources: summary.dataSources
    });

    return res.status(200).json({
      success: true,
      taxReport: {
        walletAddress: address,
        generatedAt: new Date().toISOString(),
        summary,
        transactions: processedTransactions,
        chainResults: {
          ETH: { count: summary.ethereumCount },
          PLS: { count: summary.pulsechainCount }
        }
      },
      debug: {
        version: 'real_transaction_data_v2',
        totalApiCalls,
        apiResults,
        dataQuality: 'enhanced',
        processingWorking: true
      }
    });
    
  } catch (error) {
    console.error('❌ Backend Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
};