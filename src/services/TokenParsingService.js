// 🔧 TOKEN PARSING SERVICE
// Behebt die falschen Token-Werte (32k DAI Bug)

export class TokenParsingService {
  
  // 💰 BEKANNTE TOKEN-KONTRAKTE mit korrekten Decimals
  static KNOWN_TOKENS = {
    // Stablecoins (sollten ~$1 sein)
    '0x6b175474e89094c44da98b954eedeac495271d0f': { symbol: 'DAI', decimals: 18, expectedPrice: 1.0 },
    '0xa0b86a33e6c5e8aac52c8fd9bc99f87eff44b2e9': { symbol: 'USDC', decimals: 6, expectedPrice: 1.0 },
    '0xdac17f958d2ee523a2206206994597c13d831ec7': { symbol: 'USDT', decimals: 6, expectedPrice: 1.0 },
    
    // ETH
    '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2': { symbol: 'WETH', decimals: 18, expectedPrice: 2400 },
    
    // PulseChain Tokens
    '0x2b591e99afe9f32eaa6214f7b7629768c40eeb39': { symbol: 'HEX', decimals: 8, expectedPrice: 0.003 },
    '0x8bd3d1472a656e312e94fb1bbdd599b8c51d18e3': { symbol: 'INC', decimals: 18, expectedPrice: 0.01 },
    '0x83d0cf6a8bc7d9af84b7fc1a6a8ad51f1e1e6fe1': { symbol: 'PLSX', decimals: 18, expectedPrice: 0.00001 }
  };
  
  /**
   * 🔧 Parse Token-Balance korrekt (FIXED für 32k DAI Bug)
   */
  static parseTokenBalance(token) {
    try {
      const contractAddress = token.contractAddress?.toLowerCase();
      const symbol = token.symbol?.toUpperCase();
      
      // Raw Balance von Moralis (immer BigInt String)
      const rawBalance = token.balance || '0';
      
      // Decimals ermitteln
      let decimals = token.decimals || 18;
      
      // 🔧 OVERRIDE für bekannte Tokens
      const knownToken = this.KNOWN_TOKENS[contractAddress];
      if (knownToken) {
        decimals = knownToken.decimals;
        console.log(`🔧 KNOWN TOKEN: ${symbol} using ${decimals} decimals`);
      }
      
      // 🔧 SICHERE Balance-Berechnung
      const balanceBigInt = BigInt(rawBalance);
      const divisor = BigInt(10 ** decimals);
      const formattedBalance = Number(balanceBigInt) / Number(divisor);
      
      // 🚨 SANITY CHECK: Extreme Werte abfangen (32k DAI Bug)
      if (formattedBalance > 1000000000) { // 1 Milliarde+
        console.warn(`⚠️ SUSPICIOUS BALANCE: ${symbol} has ${formattedBalance.toLocaleString()} tokens - likely parsing error`);
        
        // Versuche alternative Decimals
        const altDecimals = decimals + 6; // +6 Decimals versuchen
        const altDivisor = BigInt(10 ** altDecimals);
        const altBalance = Number(balanceBigInt) / Number(altDivisor);
        
        if (altBalance < 1000000) {
          console.log(`🔧 FIXED DECIMALS: ${symbol} corrected from ${formattedBalance} to ${altBalance} (${altDecimals} decimals)`);
          return {
            ...token,
            balance: altBalance,
            decimals: altDecimals,
            _corrected: true,
            _originalBalance: formattedBalance
          };
        }
      }
      
      // ✅ NORMALE Verarbeitung
      return {
        ...token,
        balance: formattedBalance,
        decimals: decimals,
        _parsed: true
      };
      
    } catch (error) {
      console.error(`💥 Token Parsing Error for ${token.symbol}:`, error);
             return {
         ...token,
         balance: 0,
         _parseError: error.message
       };
     }
   }

   /**
    * 🎯 Batch-Processing für alle Portfolio-Tokens
    */
   static processPortfolioTokens(tokens) {
     const processedTokens = [];
     let corrections = 0;
     
     for (const token of tokens) {
       try {
         // Parse Balance korrekt
         const parsedToken = this.parseTokenBalance(token);
         
         processedTokens.push(parsedToken);
         
         if (parsedToken._corrected) {
           corrections++;
           console.log(`🔧 CORRECTED: ${token.symbol} balance fixed from ${parsedToken._originalBalance} to ${parsedToken.balance}`);
         }
         
       } catch (error) {
         console.error(`💥 Token Processing Error for ${token.symbol}:`, error);
         
         // Fallback Token
         processedTokens.push({
           ...token,
           balance: 0,
           value: 0,
           _processingError: error.message
         });
       }
     }
     
     console.log(`🔧 TOKEN PROCESSING COMPLETE: ${processedTokens.length} tokens, ${corrections} corrections applied`);
     
     return {
       tokens: processedTokens,
       corrections: corrections,
       stats: {
         processed: processedTokens.length,
         corrected: corrections
       }
     };
   }
 } 