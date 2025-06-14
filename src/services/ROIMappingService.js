// 🎯 ROI MAPPING SERVICE - Intelligente ROI-Erkennung & Manuelle Overrides
// Löst das Problem: "ROI kommt teils über Dritt-Coins (z.B. FLEX → MISSER)"

export class ROIMappingService {
  
  // 🏭 BEKANNTE ROI-QUELLEN & MAPPINGS
  static ROI_MAPPINGS = {
    // Direct Minter ROIs (eindeutig)
    DIRECT_MINTERS: {
      '0x2b591e99afe9f32eaa6214f7b7629768c40eeb39': 'HEX_STAKING',    // HEX Contract
      '0x8bd3d1472a656e312e94fb1bbdd599b8c51d18e3': 'INC_REWARDS',    // INC Contract  
      '0x83d0cf6a8bc7d9af84b7fc1a6a8ad51f1e1e6fe1': 'PLSX_REWARDS'   // PLSX Contract
    },
    
    // Bekannte ROI-Token-Mappings (Token A → ROI von Token B)
    TOKEN_REWARDS: {
      'MISSER': {
        sourceToken: 'FLEX',
        roiType: 'FARMING_REWARDS',
        description: 'MISSER Farming Rewards von FLEX Staking',
        taxCategory: 'farming_income'
      },
      'WGEP': {
        sourceToken: 'PLSX',
        roiType: 'TREASURY_REWARDS', 
        description: 'WGEP Treasury Rewards',
        taxCategory: 'dividend_income'
      },
      'LOAN': {
        sourceToken: 'HEX',
        roiType: 'STAKING_REWARDS',
        description: 'LOAN Token aus HEX Ecosystem',
        taxCategory: 'staking_income'
      }
    },
    
    // Contract-basierte ROI-Erkennung (bei unbekannten Token)
    CONTRACT_PATTERNS: {
      // Farming Contracts
      'FARMING': [
        '0x1234567890123456789012345678901234567890', // Beispiel Farming Contract
      ],
      // Treasury Contracts  
      'TREASURY': [
        '0x2345678901234567890123456789012345678901', // Beispiel Treasury Contract
      ],
      // Staking Contracts
      'STAKING': [
        '0x3456789012345678901234567890123456789012', // Beispiel Staking Contract
      ]
    }
  };

  // 💾 USER OVERRIDES (Supabase Storage)
  static userOverrides = new Map(); // userId -> overrides

  /**
   * 🎯 MAIN: ROI-Klassifikation für Transaktion
   * @param {object} transaction - Transaction object
   * @param {string} userId - User ID für Overrides
   * @returns {object} ROI classification result
   */
  static async classifyROI(transaction, userId = null) {
    try {
      const {
        from_address,
        to_address,
        token_symbol,
        token_address,
        value,
        block_timestamp
      } = transaction;

      console.log(`🎯 ROI CLASSIFY: ${token_symbol} from ${from_address?.slice(0, 8)}... to ${to_address?.slice(0, 8)}...`);

      // 1. CHECK USER OVERRIDES FIRST
      if (userId) {
        const userOverride = await this.getUserOverride(userId, transaction.transaction_hash);
        if (userOverride) {
          console.log(`✅ USER OVERRIDE: ${token_symbol} → ${userOverride.roiType}`);
          return {
            isROI: userOverride.isROI,
            roiType: userOverride.roiType,
            sourceToken: userOverride.sourceToken,
            taxCategory: userOverride.taxCategory,
            confidence: 100, // User override = 100% confidence
            source: 'user_override',
            description: userOverride.description || 'User Manual Override'
          };
        }
      }

      // 2. DIRECT MINTER CHECK (highest confidence)
      const directMinterType = this.ROI_MAPPINGS.DIRECT_MINTERS[from_address?.toLowerCase()];
      if (directMinterType) {
        return {
          isROI: true,
          roiType: directMinterType,
          sourceToken: token_symbol,
          taxCategory: 'minting_rewards',
          confidence: 95,
          source: 'direct_minter',
          description: `Direct Minting von ${directMinterType}`
        };
      }

      // 3. TOKEN REWARD MAPPING (medium-high confidence)
      const tokenMapping = this.ROI_MAPPINGS.TOKEN_REWARDS[token_symbol?.toUpperCase()];
      if (tokenMapping) {
        return {
          isROI: true,
          roiType: tokenMapping.roiType,
          sourceToken: tokenMapping.sourceToken,
          taxCategory: tokenMapping.taxCategory,
          confidence: 85,
          source: 'token_mapping',
          description: tokenMapping.description
        };
      }

      // 4. CONTRACT PATTERN RECOGNITION (medium confidence)
      const contractPattern = this.checkContractPatterns(from_address);
      if (contractPattern) {
        return {
          isROI: true,
          roiType: contractPattern.type,
          sourceToken: 'UNKNOWN',
          taxCategory: contractPattern.taxCategory,
          confidence: 70,
          source: 'contract_pattern',
          description: `${contractPattern.type} Contract erkannt`
        };
      }

      // 5. HEURISTIC ANALYSIS (low-medium confidence)
      const heuristicResult = this.analyzeTransactionHeuristics(transaction);
      if (heuristicResult.isLikelyROI) {
        return {
          isROI: true,
          roiType: heuristicResult.roiType,
          sourceToken: 'INFERRED',
          taxCategory: heuristicResult.taxCategory,
          confidence: heuristicResult.confidence,
          source: 'heuristic',
          description: heuristicResult.description
        };
      }

      // 6. NO ROI DETECTED
      return {
        isROI: false,
        roiType: null,
        sourceToken: null,
        taxCategory: 'regular_transfer',
        confidence: 30,
        source: 'no_match',
        description: 'Kein ROI-Pattern erkannt'
      };

    } catch (error) {
      console.error('💥 ROI Classification Error:', error);
      return {
        isROI: false,
        roiType: 'ERROR',
        confidence: 0,
        source: 'error',
        description: `Klassifikationsfehler: ${error.message}`
      };
    }
  }

  /**
   * 🔍 CONTRACT PATTERN CHECK
   */
  static checkContractPatterns(contractAddress) {
    if (!contractAddress) return null;
    
    const addr = contractAddress.toLowerCase();
    
    for (const [patternType, addresses] of Object.entries(this.ROI_MAPPINGS.CONTRACT_PATTERNS)) {
      if (addresses.includes(addr)) {
        return {
          type: patternType,
          taxCategory: this.getDefaultTaxCategory(patternType)
        };
      }
    }
    
    return null;
  }

  /**
   * 🧠 HEURISTIC ANALYSIS
   */
  static analyzeTransactionHeuristics(transaction) {
    const {
      token_symbol,
      value,
      token_decimals,
      block_timestamp,
      from_address
    } = transaction;

    let confidence = 0;
    let roiType = 'UNKNOWN_REWARDS';
    let reasons = [];

    // Amount-based heuristics
    const decimals = parseInt(token_decimals) || 18;
    const amount = parseFloat(value) / Math.pow(10, decimals);
    
    // Small regular amounts (typical for rewards)
    if (amount > 0 && amount < 10000) {
      confidence += 20;
      reasons.push('Small reward-like amount');
    }
    
    // Token symbol patterns
    if (token_symbol?.includes('REWARD') || token_symbol?.includes('YIELD')) {
      confidence += 30;
      roiType = 'YIELD_FARMING';
      reasons.push('Reward token symbol');
    }
    
    // Contract address patterns (not user addresses)
    if (from_address && from_address.length === 42 && !from_address.startsWith('0x000000')) {
      confidence += 15;
      reasons.push('From contract address');
    }
    
    // Time-based patterns (regular intervals)
    // TODO: Implement time pattern analysis for regular rewards
    
    return {
      isLikelyROI: confidence >= 40,
      roiType,
      taxCategory: this.getDefaultTaxCategory(roiType),
      confidence,
      description: `Heuristic: ${reasons.join(', ')} (${confidence}% confidence)`
    };
  }

  /**
   * 🏷️ DEFAULT TAX CATEGORIES
   */
  static getDefaultTaxCategory(roiType) {
    const taxMap = {
      'HEX_STAKING': 'staking_income',
      'INC_REWARDS': 'staking_income', 
      'PLSX_REWARDS': 'dividend_income',
      'FARMING': 'farming_income',
      'TREASURY': 'dividend_income',
      'STAKING': 'staking_income',
      'YIELD_FARMING': 'farming_income',
      'UNKNOWN_REWARDS': 'other_income'
    };
    
    return taxMap[roiType] || 'other_income';
  }

  /**
   * 👤 USER OVERRIDE MANAGEMENT
   */
  static async getUserOverride(userId, transactionHash) {
    try {
      // Check memory cache first
      const userCache = this.userOverrides.get(userId);
      if (userCache && userCache[transactionHash]) {
        return userCache[transactionHash];
      }

      // TODO: Load from Supabase
      // const { data } = await supabase.from('roi_overrides')...
      
      return null;
    } catch (error) {
      console.error('💥 Get User Override Error:', error);
      return null;
    }
  }

  /**
   * ✏️ SET USER OVERRIDE
   */
  static async setUserOverride(userId, transactionHash, override) {
    try {
      console.log(`✏️ USER OVERRIDE: Setting ${transactionHash} → ${override.roiType}`);
      
      // Update memory cache
      if (!this.userOverrides.has(userId)) {
        this.userOverrides.set(userId, {});
      }
      this.userOverrides.get(userId)[transactionHash] = {
        ...override,
        setAt: new Date().toISOString(),
        setBy: userId
      };

      // TODO: Save to Supabase
      // await supabase.from('roi_overrides').upsert({...})
      
      console.log(`✅ USER OVERRIDE: Saved for user ${userId}`);
      return true;
      
    } catch (error) {
      console.error('💥 Set User Override Error:', error);
      return false;
    }
  }

  /**
   * 📊 BULK CLASSIFICATION
   */
  static async classifyTransactionsBulk(transactions, userId = null) {
    console.log(`📊 BULK ROI CLASSIFY: Processing ${transactions.length} transactions`);
    
    const results = [];
    let roiCount = 0;
    
    for (const transaction of transactions) {
      const classification = await this.classifyROI(transaction, userId);
      
      if (classification.isROI) {
        roiCount++;
      }
      
      results.push({
        ...transaction,
        roiClassification: classification
      });
    }
    
    console.log(`✅ BULK CLASSIFY: ${roiCount}/${transactions.length} identified as ROI`);
    
    return {
      transactions: results,
      summary: {
        total: transactions.length,
        roiTransactions: roiCount,
        regularTransactions: transactions.length - roiCount,
        roiPercentage: Math.round((roiCount / transactions.length) * 100)
      }
    };
  }

  /**
   * 🔄 RECALCULATE WITH OVERRIDES
   */
  static async recalculateWithOverrides(transactions, userId) {
    console.log(`🔄 RECALCULATE: Applying user overrides for ${transactions.length} transactions`);
    
    return await this.classifyTransactionsBulk(transactions, userId);
  }
}

export default ROIMappingService; 