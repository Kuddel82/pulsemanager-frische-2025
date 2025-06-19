/**
 * 🇩🇪 TAX REPORT API - EXAKT WIE DAS PORTFOLIO
 * 
 * ✅ Verwendet /api/moralis-v2 (funktioniert im Portfolio!)
 * ✅ EXAKT die gleiche Logik wie das Portfolio
 * ✅ KORREKTE Chain IDs: 0x1 (ETH) + 0x171 (PulseChain)
 * ✅ Deutsche Steuer-Kategorisierung
 */

export default async function handler(req, res) {
  console.log('🔥🔥🔥 TAX REPORT - EXAKT WIE PORTFOLIO! 🔥🔥🔥');
  
  try {
    // CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // Extract parameters
    const params = req.method === 'POST' ? { ...req.query, ...req.body } : req.query;
    const { address, limit = 500 } = params;

    console.log('🇩🇪 TAX PARAMS:', { 
      address: address ? address.slice(0, 8) + '...' : 'MISSING', 
      limit
    });

    // Validate address
    if (!address) {
      return res.status(400).json({
        success: false,
        error: 'Wallet address is required',
        taxReport: null
      });
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid wallet address format',
        taxReport: null
      });
    }

    console.log(`🔍 Processing wallet: ${address.slice(0, 8)}...`);

    // KORREKTE CHAIN IDs - EXAKT WIE PORTFOLIO
    const chains = [
      { id: '0x1', name: 'Ethereum', short: 'ETH', moralisName: 'eth' },
      { id: '0x171', name: 'PulseChain', short: 'PLS', moralisName: 'pulsechain' }
    ];

    let allTransactions = [];
    let chainResults = {};

    // PARALLEL PROCESSING - EXAKT WIE PORTFOLIO
    const chainPromises = chains.map(async (chain) => {
      console.log(`🚀 Processing ${chain.name} (${chain.id})...`);
      
      try {
        // 🔥 EXAKT WIE PORTFOLIO: Verwende /api/moralis-v2 mit erc20_transfers
        const response = await fetch(`/api/moralis-v2?address=${address}&chain=${chain.moralisName}&endpoint=erc20_transfers&limit=${limit}`);
        
        if (!response.ok) {
          console.error(`❌ ${chain.name} API Error: ${response.status}`);
          chainResults[chain.short] = {
            count: 0,
            transactions: [],
            error: `API Error: ${response.status}`
          };
          return;
        }
        
        const data = await response.json();
        const transfers = data.transfers || [];
        
        console.log(`✅ ${chain.name}: ${transfers.length} transfers loaded via /api/moralis-v2`);
        
        chainResults[chain.short] = {
          count: transfers.length,
          transactions: transfers
        };
        
        // Add chain info to transactions
        const processedTransactions = transfers.map(tx => ({
          ...tx,
          sourceChain: chain.name,
          sourceChainShort: chain.short,
          sourceChainId: chain.id,
          // Add direction info
          direction: tx.to_address?.toLowerCase() === address.toLowerCase() ? 'in' : 'out',
          directionIcon: tx.to_address?.toLowerCase() === address.toLowerCase() ? '📥 IN' : '📤 OUT',
          // Add tax category
          taxCategory: tx.to_address?.toLowerCase() === address.toLowerCase() ? 'Token Transfer (In)' : 'Token Transfer (Out)',
          // Add formatted value
          formattedValue: tx.value_decimal || '0',
          tokenSymbol: tx.token_symbol || 'UNKNOWN'
        }));
        
        allTransactions.push(...processedTransactions);
        
        console.log(`✅ ${chain.name}: ${transfers.length} transactions processed`);
        
      } catch (error) {
        console.error(`❌ ${chain.name} processing failed:`, error.message);
        chainResults[chain.short] = {
          count: 0,
          transactions: [],
          error: error.message
        };
      }
    });

    // WARTE AUF ALLE CHAINS
    await Promise.all(chainPromises);

    console.log(`📊 TOTAL TRANSACTIONS: ${allTransactions.length}`);
    console.log(`📊 CHAIN BREAKDOWN:`, chainResults);

    // SORTIERE NACH TIMESTAMP (neueste zuerst)
    allTransactions.sort((a, b) => {
      const timeA = new Date(a.block_timestamp || a.timestamp || 0).getTime();
      const timeB = new Date(b.block_timestamp || b.timestamp || 0).getTime();
      return timeB - timeA;
    });

    // DEUTSCHE STEUER-KATEGORISIERUNG
    const categorizedTransactions = allTransactions.map(tx => {
      let taxCategory = tx.taxCategory || 'Sonstige';
      let direction = tx.direction || 'unknown';
      let directionIcon = tx.directionIcon || '❓';
      let formattedValue = tx.formattedValue || '0';
      let tokenSymbol = tx.tokenSymbol || 'N/A';

      // ROI DETECTION für bekannte Tokens
      if (['WGEP', 'MASKMAN', 'BORK'].includes(tokenSymbol)) {
        if (direction === 'in') {
          taxCategory = 'ROI Einkommen (§22 EStG)';
          directionIcon = '💰 ROI';
        }
      }

      return {
        ...tx,
        taxCategory,
        direction,
        directionIcon,
        formattedValue,
        tokenSymbol,
        timestamp: tx.block_timestamp || tx.timestamp
      };
    });

    // ZUSAMMENFASSUNG
    const summary = {
      totalTransactions: categorizedTransactions.length,
      ethereumCount: chainResults.ETH?.count || 0,
      pulsechainCount: chainResults.PLS?.count || 0,
      roiCount: categorizedTransactions.filter(tx => tx.taxCategory.includes('ROI')).length,
      totalROIValueEUR: 0,
      totalTaxEUR: 0
    };

    const taxReport = {
      walletAddress: address,
      generatedAt: new Date().toISOString(),
      summary,
      transactions: categorizedTransactions,
      chainResults
    };

    console.log(`✅ TAX REPORT GENERATED: ${categorizedTransactions.length} transactions`);
    console.log(`📊 SUMMARY:`, summary);

    return res.status(200).json({
      success: true,
      taxReport,
      debug: {
        originalCount: allTransactions.length,
        processedCount: categorizedTransactions.length,
        chains: Object.keys(chainResults),
        source: 'portfolio_compatible_api'
      }
    });

  } catch (error) {
    console.error('💥 TAX API ERROR:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}