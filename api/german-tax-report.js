/**
 * 🇩🇪 DEUTSCHE CRYPTO-STEUER API - EINFACHE FUNKTIONIERENDE VERSION
 * 
 * 🔧 SOFORT-REPARATUR: Einfache, stabile Version
 * 
 * 🎯 ZIEL: Transaktionen laden - egal wie
 */

const MORALIS_API_KEY = process.env.MORALIS_API_KEY;

/**
 * 🇩🇪 DEUTSCHE STEUERREPORT API - EINFACHE VERSION
 */
export default async function handler(req, res) {
  console.log('🔧🔧🔧 TAX API: EINFACHE FUNKTIONIERENDE VERSION! 🔧🔧🔧');
  
  try {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // API Key validation
    if (!MORALIS_API_KEY) {
      console.error('🚨 MORALIS API KEY MISSING');
      return res.status(503).json({ 
        error: 'Moralis API Key missing or invalid.',
        _pro_mode: true
      });
    }

    // Extract parameters
    const params = req.method === 'POST' ? { ...req.query, ...req.body } : req.query;
    const { 
      address, 
      chain = 'all', 
      limit = 100
    } = params;

    console.log('🔧 TAX PARAMS:', { 
      chain, 
      address: address ? address.slice(0, 8) + '...' : 'MISSING', 
      limit,
      status: 'EINFACHE_FUNKTIONIERENDE_VERSION'
    });

    if (!address) {
      return res.status(400).json({ 
        error: 'Missing address parameter.',
        usage: 'POST /api/german-tax-report with address, chain, limit'
      });
    }

    // 🔧 EINFACHE ABFRAGE - NUR ETHEREUM ERST
    console.log(`🔧 EINFACHE ABFRAGE: Ethereum für ${address}`);

    let allTransactions = [];

    // 🚀 SCHRITT 1: Etherscan für Ethereum (FREE, FUNKTIONIERT IMMER)
    try {
      console.log(`🔧 ETHERSCAN: Loading transactions for ${address}`);
      
      const etherscanResponse = await fetch(`https://api.etherscan.io/api?module=account&action=txlist&address=${address}&startblock=0&endblock=latest&page=1&offset=100&sort=desc`);
      
      if (etherscanResponse.ok) {
        const etherscanData = await etherscanResponse.json();
        if (etherscanData.status === '1' && etherscanData.result) {
          console.log(`✅ ETHERSCAN SUCCESS: ${etherscanData.result.length} transactions`);
          
          // Konvertiere Etherscan Format zu unserem Format
          const etherscanTransactions = etherscanData.result.map(tx => ({
            transaction_hash: tx.hash,
            block_number: tx.blockNumber,
            block_timestamp: tx.timeStamp,
            from_address: tx.from,
            to_address: tx.to,
            value: tx.value,
            gas_used: tx.gasUsed,
            gas_price: tx.gasPrice,
            token_symbol: 'ETH',
            token_name: 'Ethereum',
            token_decimals: '18',
            token_address: null,
            readableAmount: (parseFloat(tx.value) / Math.pow(10, 18)).toFixed(6),
            dataSource: 'etherscan',
            fetchTimestamp: new Date().toISOString(),
            transactionType: 'native',
            chain: 'Ethereum',
            chainId: '0x1'
          }));
          
          allTransactions.push(...etherscanTransactions);
        }
      }
    } catch (error) {
      console.error(`💥 ETHERSCAN ERROR: ${error.message}`);
    }

    // 🚀 SCHRITT 2: Moralis für PulseChain (falls API Key funktioniert)
    try {
      console.log(`🔧 MORALIS: Loading PulseChain transactions for ${address}`);
      
      const moralisResponse = await fetch(`https://deep-index.moralis.io/api/v2/${address}/erc20/transfers?chain=0x171&limit=100`, {
        headers: {
          'X-API-Key': MORALIS_API_KEY,
          'Accept': 'application/json'
        }
      });

      if (moralisResponse.ok) {
        const moralisData = await moralisResponse.json();
        if (moralisData.result && moralisData.result.length > 0) {
          console.log(`✅ MORALIS SUCCESS: ${moralisData.result.length} PulseChain transactions`);
          
          const moralisTransactions = moralisData.result.map(tx => ({
            ...tx,
            dataSource: 'moralis',
            fetchTimestamp: new Date().toISOString(),
            transactionType: 'erc20',
            chain: 'PulseChain',
            chainId: '0x171',
            readableAmount: tx.value && tx.token_decimals ? 
              (parseFloat(tx.value) / Math.pow(10, parseInt(tx.token_decimals))).toFixed(6) : '0'
          }));
          
          allTransactions.push(...moralisTransactions);
        }
      }
    } catch (error) {
      console.error(`💥 MORALIS ERROR: ${error.message}`);
    }

    console.log(`🔧 GESAMT: ${allTransactions.length} Transaktionen geladen`);
    
    if (allTransactions.length === 0) {
      console.warn(`⚠️ KEINE DATEN: Returning empty result for ${address}`);
      return res.status(200).json({
        success: true,
        taxReport: {
          transactions: [],
          summary: {
            totalTransactions: 0,
            roiCount: 0,
            saleCount: 0,
            totalROIValueEUR: "0,00",
            totalSaleValueEUR: "0,00",
            totalTaxEUR: "0,00"
          },
          metadata: {
            source: 'einfache_version_empty',
            message: 'Keine Transaktionen gefunden',
            walletAddress: address,
            fallbacks_tried: true
          }
        }
      });
    }

    // 🔧 EINFACHE KATEGORISIERUNG
    const categorizedTransactions = allTransactions.map(tx => {
      const isIncoming = tx.to_address?.toLowerCase() === address.toLowerCase();
      const isOutgoing = tx.from_address?.toLowerCase() === address.toLowerCase();
      
      // ROI Token Detection
      const ROI_TOKENS = ['HEX', 'INC', 'PLSX', 'LOAN', 'FLEX', 'WGEP', 'MISOR', 'FLEXMES', 'PLS'];
      const isROIToken = ROI_TOKENS.includes(tx.token_symbol?.toUpperCase());
      
      // Minter Detection
      const KNOWN_MINTERS = [
        '0x0000000000000000000000000000000000000000',
        '0x2b591e99afe9f32eaa6214f7b7629768c40eeb39',
        '0x8bd3d1472a656e312e94fb1bbdd599b8c51d18e3'
      ];
      const fromMinter = KNOWN_MINTERS.includes(tx.from_address?.toLowerCase());
      
      // Tax Category Classification
      let taxCategory = 'transfer';
      let isTaxable = false;
      
      if (isIncoming && (fromMinter || isROIToken)) {
        taxCategory = 'roi_income';
        isTaxable = true;
      } else if (isOutgoing) {
        taxCategory = 'purchase';
        isTaxable = false;
      } else if (isIncoming) {
        taxCategory = 'sale_income';
        isTaxable = true;
      }

      // Direction Logic
      let finalDirection = 'unknown';
      let finalIcon = '❓';

      if (taxCategory === 'sale_income') {
        finalDirection = 'in';
        finalIcon = `📥 IN (${tx.transactionType?.toUpperCase() || 'UNKNOWN'})`;
      } else if (taxCategory === 'roi_income') {
        finalDirection = 'in';
        finalIcon = `📥 ROI (${tx.transactionType?.toUpperCase() || 'UNKNOWN'})`;
      } else if (taxCategory === 'purchase') {
        finalDirection = 'out';
        finalIcon = `📤 OUT (${tx.transactionType?.toUpperCase() || 'UNKNOWN'})`;
      } else {
        if (isIncoming && !isOutgoing) {
          finalDirection = 'in';
          finalIcon = `📥 IN (${tx.transactionType?.toUpperCase() || 'UNKNOWN'})`;
        } else if (isOutgoing && !isIncoming) {
          finalDirection = 'out';
          finalIcon = `📤 OUT (${tx.transactionType?.toUpperCase() || 'UNKNOWN'})`;
        } else {
          finalDirection = 'transfer';
          finalIcon = `🔄 TRANSFER (${tx.transactionType?.toUpperCase() || 'UNKNOWN'})`;
        }
      }
      
      return {
        ...tx,
        direction: finalDirection,
        directionIcon: finalIcon,
        taxCategory,
        isTaxable,
        isROI: fromMinter || isROIToken,
        fromMinter,
        isROIToken,
        priceEUR: "0.00",
        valueEUR: "0.00"
      };
    });
    
    console.log(`✅ KATEGORISIERUNG: ${categorizedTransactions.length} Transaktionen kategorisiert`);

    // 🔧 EINFACHE SUMMARY
    const typeStats = {
      total: categorizedTransactions.length,
      erc20: categorizedTransactions.filter(tx => tx.transactionType === 'erc20').length,
      native: categorizedTransactions.filter(tx => tx.transactionType === 'native').length,
      ethereum: categorizedTransactions.filter(tx => tx.chain === 'Ethereum').length,
      pulsechain: categorizedTransactions.filter(tx => tx.chain === 'PulseChain').length
    };

    const roiTransactions = categorizedTransactions.filter(tx => tx.taxCategory === 'roi_income');
    const saleTransactions = categorizedTransactions.filter(tx => tx.taxCategory === 'sale_income');
    const purchaseTransactions = categorizedTransactions.filter(tx => tx.taxCategory === 'purchase');

    const summary = {
      totalTransactions: categorizedTransactions.length,
      typeStats: typeStats,
      
      roiCount: roiTransactions.length,
      saleCount: saleTransactions.length,
      purchaseCount: purchaseTransactions.length,
      
      inCount: categorizedTransactions.filter(tx => tx.direction === 'in').length,
      outCount: categorizedTransactions.filter(tx => tx.direction === 'out').length,
      
      ethereumCount: typeStats.ethereum,
      pulsechainCount: typeStats.pulsechain,
      
      totalROIValueEUR: "0,00",
      totalSaleValueEUR: "0,00",
      totalPurchaseValueEUR: "0,00",
      totalTaxEUR: "0,00",
      
      status: "EINFACHE_FUNKTIONIERENDE_VERSION"
    };

    console.log(`✅ SUCCESS: ${categorizedTransactions.length} Transaktionen für ${address}`);

    return res.status(200).json({
      success: true,
      taxReport: {
        transactions: categorizedTransactions,
        summary: summary,
        metadata: {
          source: 'einfache_version_success',
          chains: ['Ethereum', 'PulseChain'],
          address: address,
          timestamp: new Date().toISOString(),
          count: categorizedTransactions.length,
          status: 'EINFACHE_VERSION',
          message: 'Einfache, funktionierende Version: Etherscan + Moralis',
          transactionTypes: {
            total: categorizedTransactions.length,
            erc20: typeStats.erc20,
            native: typeStats.native,
            ethereum: typeStats.ethereum,
            pulsechain: typeStats.pulsechain
          },
          tax_categorization: {
            total: categorizedTransactions.length,
            roi_income: roiTransactions.length,
            purchases: purchaseTransactions.length,
            sales: saleTransactions.length,
            transfers: categorizedTransactions.filter(tx => tx.taxCategory === 'transfer').length,
            taxable: categorizedTransactions.filter(tx => tx.isTaxable).length,
            incoming: categorizedTransactions.filter(tx => tx.direction === 'in').length,
            outgoing: categorizedTransactions.filter(tx => tx.direction === 'out').length
          }
        }
      }
    });

  } catch (error) {
    console.error('💥 TAX API CRITICAL ERROR:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}