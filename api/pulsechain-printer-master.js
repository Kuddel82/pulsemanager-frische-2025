/**
 * 🎯 PULSECHAIN PRINTER MASTER SYSTEM
 * 
 * Vollständiges System zur Erkennung von PulseChain Printer ROI
 * - Automatische Kategorisierung von Printer-Transaktionen
 * - Bridge/Swap Detection
 * - Deutsche Steuerkonformität
 * - Confidence Scoring
 */

// 🎯 PRINTER PROJECT DATABASE
const PRINTER_PROJECTS = {
  // PulseX DEX Contracts
  '0x165cd37b4c644c2921454429e7f9358d18a45e14': {
    name: 'PulseX V1',
    type: 'DEX',
    confidence: 0.95,
    taxCategory: 'PulseX Trading ROI',
    isTaxable: true,
    germanTaxNote: 'PulseX DEX Trading - §23 EStG (Spekulationsgeschäft)'
  },
  '0x95b303987a60c71504d99aa1b13b4da07b0790ab': {
    name: 'PulseX V2',
    type: 'DEX', 
    confidence: 0.95,
    taxCategory: 'PulseX Trading ROI',
    isTaxable: true,
    germanTaxNote: 'PulseX V2 DEX Trading - §23 EStG (Spekulationsgeschäft)'
  },
  
  // PulseChain Bridge
  '0x0000000000000000000000000000000000000000': {
    name: 'PulseChain Bridge',
    type: 'Bridge',
    confidence: 0.90,
    taxCategory: 'Cross-Chain Transfer',
    isTaxable: false,
    germanTaxNote: 'Bridge Transfer - Keine Steuerpflicht'
  },
  
  // WGEP Printer (ECHTE ADRESSE!)
  '0xfca88920ca5639ad5e954ea776e73dec54fdc065': {
    name: 'WGEP Printer',
    type: 'Printer',
    confidence: 0.98,
    taxCategory: 'WGEP Printer ROI',
    isTaxable: true,
    germanTaxNote: 'WGEP Printer ROI - §22 EStG (Sonstige Einkünfte)'
  },
  
  // HEX Printer
  '0x2b591e99afe9f32eaa6214f7b7629768c40eeb39': {
    name: 'HEX Printer',
    type: 'Printer',
    confidence: 0.95,
    taxCategory: 'HEX Printer ROI',
    isTaxable: true,
    germanTaxNote: 'HEX Printer ROI - §22 EStG (Sonstige Einkünfte)'
  },
  
  // PLS Native Transfers
  '0x0000000000000000000000000000000000000000': {
    name: 'PLS Native',
    type: 'Native',
    confidence: 0.90,
    taxCategory: 'PLS Transfer',
    isTaxable: true,
    germanTaxNote: 'PLS Native Transfer - §23 EStG'
  }
};

// 🌉 BRIDGE/SWAP PATTERNS
const BRIDGE_PATTERNS = [
  {
    name: 'Ethereum Bridge',
    fromChain: 'ETH',
    toChain: 'PLS',
    confidence: 0.90,
    taxCategory: 'Cross-Chain Transfer',
    isTaxable: false,
    germanTaxNote: 'Bridge von Ethereum zu PulseChain - Keine Steuerpflicht'
  },
  {
    name: 'BSC Bridge',
    fromChain: 'BSC',
    toChain: 'PLS',
    confidence: 0.90,
    taxCategory: 'Cross-Chain Transfer',
    isTaxable: false,
    germanTaxNote: 'Bridge von BSC zu PulseChain - Keine Steuerpflicht'
  }
];

// 🎯 MAIN DETECTION FUNCTION
export const categorizePulseChainTransactionComplete = async ({
  direction,
  chainSymbol,
  tokenSymbol,
  from_address,
  contractAddress,
  valueFormatted,
  transactionType
}) => {
  console.log('🔍 PulseChain Printer Detection started:', {
    direction,
    chainSymbol,
    tokenSymbol,
    from_address,
    contractAddress,
    valueFormatted
  });

  // 🎯 PRINTER DETECTION
  if (contractAddress && PRINTER_PROJECTS[contractAddress.toLowerCase()]) {
    const printer = PRINTER_PROJECTS[contractAddress.toLowerCase()];
    
    console.log(`🎯 PRINTER DETECTED: ${printer.name}`);
    
    return {
      isPrinter: true,
      isBridgeSwap: false,
      printerProject: printer.name,
      printerType: printer.type,
      confidence: printer.confidence,
      taxCategory: printer.taxCategory,
      isTaxable: printer.isTaxable,
      germanTaxNote: printer.germanTaxNote,
      type: 'printer'
    };
  }

  // 🌉 BRIDGE/SWAP DETECTION
  if (direction === 'in' && chainSymbol === 'PLS') {
    // Bridge Detection Logic
    const isBridge = BRIDGE_PATTERNS.some(pattern => 
      pattern.toChain === 'PLS'
    );
    
    if (isBridge) {
      console.log('🌉 BRIDGE DETECTED');
      
      return {
        isPrinter: false,
        isBridgeSwap: true,
        type: 'bridge',
        confidence: 0.90,
        taxCategory: 'Cross-Chain Transfer',
        isTaxable: false,
        germanTaxNote: 'Cross-Chain Bridge Transfer - Keine Steuerpflicht'
      };
    }
  }

  // 🔄 SWAP DETECTION
  if (transactionType === 'swap' || tokenSymbol?.includes('SWAP')) {
    console.log('🔄 SWAP DETECTED');
    
    return {
      isPrinter: false,
      isBridgeSwap: true,
      type: 'swap',
      confidence: 0.85,
      taxCategory: 'Token Swap',
      isTaxable: true,
      germanTaxNote: 'Token Swap - §23 EStG'
    };
  }

  // ❌ NO PRINTER/BRIDGE DETECTED
  console.log('❌ No printer/bridge detected - using fallback categorization');
  
  return {
    isPrinter: false,
    isBridgeSwap: false,
    confidence: 0.0,
    taxCategory: 'Unknown',
    isTaxable: false,
    germanTaxNote: 'Unbekannte Transaktion'
  };
};

// 🧪 TEST FUNCTION
export const testPulseChainDetection = () => {
  console.log('🧪 Testing PulseChain Printer Detection...');
  
  const testCases = [
    {
      contractAddress: '0x165cd37b4c644c2921454429e7f9358d18a45e14',
      expected: 'PulseX V1'
    },
    {
      contractAddress: '0x95b303987a60c71504d99aa1b13b4da07b0790ab',
      expected: 'PulseX V2'
    },
    {
      contractAddress: '0xfca88920ca5639ad5e954ea776e73dec54fdc065',
      expected: 'WGEP Printer'
    }
  ];

  testCases.forEach((testCase, index) => {
    const result = categorizePulseChainTransactionComplete({
      direction: 'in',
      chainSymbol: 'PLS',
      tokenSymbol: 'TEST',
      from_address: '0x123...',
      contractAddress: testCase.contractAddress,
      valueFormatted: '1000',
      transactionType: 'transfer'
    });
    
    console.log(`Test ${index + 1}: ${result.isPrinter ? '✅' : '❌'} ${testCase.expected}`);
  });
};

// 🎯 EXPORT ALL FUNCTIONS
export default {
  categorizePulseChainTransactionComplete,
  testPulseChainDetection,
  PRINTER_PROJECTS,
  BRIDGE_PATTERNS
}; 