// 🔧 TOKEN PARSING SERVICE - SAUBER
// Nur für Balance-Parsing, KEINE Preislogik mehr!

export class TokenParsingService {
  
  // 🔧 BEKANNTE TOKEN-KONTRAKTE - NUR DECIMALS (Preise werden von TokenPricingService verwaltet)
  static KNOWN_TOKENS = {
    // Stablecoins
    '0x6b175474e89094c44da98b954eedeac495271d0f': { symbol: 'DAI', decimals: 18 },
    '0xa0b86a33e6c5e8aac52c8fd9bc99f87eff44b2e9': { symbol: 'USDC', decimals: 6 },
    '0xdac17f958d2ee523a2206206994597c13d831ec7': { symbol: 'USDT', decimals: 6 },
    
    // ETH
    '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2': { symbol: 'WETH', decimals: 18 },
    
    // PulseChain Tokens
    '0x2b591e99afe9f32eaa6214f7b7629768c40eeb39': { symbol: 'HEX', decimals: 8 },
    '0x8bd3d1472a656e312e94fb1bbdd599b8c51d18e3': { symbol: 'INC', decimals: 18 },
    '0x83d0cf6a8bc7d9af84b7fc1a6a8ad51f1e1e6fe1': { symbol: 'PLSX', decimals: 18 }
  };
  
  /**
   * 🔧 Parse Token-Balance korrekt (FIXED für 32k DAI Bug)
   */
  static parseTokenBalance(token) {
    try {
      const contractAddress = token.contractAddress?.toLowerCase();
      const symbol = token.symbol?.toUpperCase();
      
      // Raw Balance von Moralis (kann BigInt String oder bereits formatiert sein)
      const rawBalance = token.balance || token.calculatedBalance || '0';
      
      // Decimals ermitteln
      let decimals = token.decimals || 18;
      
      // 🔧 OVERRIDE für bekannte Tokens
      const knownToken = this.KNOWN_TOKENS[contractAddress];
      if (knownToken) {
        decimals = knownToken.decimals;
        console.log(`🔧 KNOWN TOKEN: ${symbol} using ${decimals} decimals`);
      }
      
      // 🔧 SICHERE Balance-Berechnung - unterscheide zwischen BigInt String und bereits formatiert
      let formattedBalance;
      
      if (typeof rawBalance === 'string' && rawBalance.includes('.')) {
        // Bereits formatierte Dezimalzahl - direkt verwenden
        formattedBalance = parseFloat(rawBalance);
        console.log(`🔧 DECIMAL INPUT: ${symbol} using pre-formatted balance ${formattedBalance}`);
      } else if (typeof rawBalance === 'number') {
        // Bereits als Number - direkt verwenden
        formattedBalance = rawBalance;
        console.log(`🔧 NUMBER INPUT: ${symbol} using numeric balance ${formattedBalance}`);
      } else {
        // BigInt String - mit Decimals konvertieren
        try {
          const balanceBigInt = BigInt(rawBalance);
          const divisor = BigInt(10 ** decimals);
          formattedBalance = Number(balanceBigInt) / Number(divisor);
          console.log(`🔧 BIGINT CONVERSION: ${symbol} converted from BigInt ${rawBalance} to ${formattedBalance}`);
        } catch (bigIntError) {
          // Fallback: Als Number parsen
          formattedBalance = parseFloat(rawBalance) || 0;
          console.warn(`⚠️ BIGINT FALLBACK: ${symbol} parsed as float: ${formattedBalance}`);
        }
      }
      
      // 🚨 EXTREME VALUE PROTECTION: Schützt vor echten Parsing-Fehlern aber erlaubt hohe Supply Tokens
      if (formattedBalance > 10000000000000) { // 10 Billionen+ (erlaubt mehr legitime high-supply Tokens)
        console.warn(`⚠️ SUSPICIOUS BALANCE: ${symbol} has ${formattedBalance.toLocaleString()} tokens - likely parsing error`);
        
        // Versuche alternative Decimals nur bei BigInt Conversion
        if (typeof rawBalance === 'string' && !rawBalance.includes('.')) {
          let fixedBalance = null;
          
          // Versuche verschiedene Decimal-Korrekturen
          for (let extraDecimals = 6; extraDecimals <= 18; extraDecimals += 6) {
            try {
              const altDecimals = decimals + extraDecimals;
              const balanceBigInt = BigInt(rawBalance);
              const altDivisor = BigInt(10 ** altDecimals);
              const altBalance = Number(balanceBigInt) / Number(altDivisor);
              
              // Akzeptiere wenn Wert unter 10 Million ist
              if (altBalance < 10000000) {
                fixedBalance = altBalance;
                console.log(`🔧 FIXED DECIMALS: ${symbol} corrected from ${formattedBalance.toLocaleString()} to ${altBalance.toLocaleString()} (+${extraDecimals} decimals)`);
                
                return {
                  ...token,
                  balance: fixedBalance,
                  decimals: altDecimals,
                  _corrected: true,
                  _originalBalance: formattedBalance,
                  _correction: `+${extraDecimals}_decimals`
                };
              }
            } catch (altError) {
              continue; // Versuche nächste Decimal-Korrektur
            }
          }
          
          // Wenn keine Decimal-Korrektur funktioniert, auf 0 setzen
          if (!fixedBalance) {
            console.warn(`🚨 EXTREME VALUE ZEROED: ${symbol} set to 0 (was ${formattedBalance.toLocaleString()})`);
            return {
              ...token,
              balance: 0,
              decimals: decimals,
              _corrected: true,
              _originalBalance: formattedBalance,
              _correction: 'zeroed_extreme_value'
            };
          }
        } else {
          // Für bereits formatierte extreme Werte: auf 0 setzen
          console.warn(`🚨 EXTREME FORMATTED VALUE ZEROED: ${symbol} set to 0 (was ${formattedBalance.toLocaleString()})`);
          return {
            ...token,
            balance: 0,
            decimals: decimals,
            _corrected: true,
            _originalBalance: formattedBalance,
            _correction: 'zeroed_formatted_extreme'
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
     let extremeValueZeroed = 0;
     let totalOriginalValue = 0;
     let totalProcessedValue = 0;
     
     console.log(`🔧 TOKEN PROCESSING START: Processing ${tokens.length} tokens`);
     
     for (const token of tokens) {
       try {
         // Parse Balance korrekt
         const parsedToken = this.parseTokenBalance(token);
         
         // Track values for debugging
         const originalBalance = token.balance || 0;
         const processedBalance = parsedToken.balance || 0;
         
         totalOriginalValue += parseFloat(originalBalance) || 0;
         totalProcessedValue += parseFloat(processedBalance) || 0;
         
         processedTokens.push(parsedToken);
         
         if (parsedToken._corrected) {
           corrections++;
           if (parsedToken._correction?.includes('zeroed')) {
             extremeValueZeroed++;
             console.warn(`🚨 ZEROED TOKEN: ${token.symbol} was zeroed (${parsedToken._correction}), original: ${parsedToken._originalBalance}`);
           } else {
             console.log(`🔧 CORRECTED: ${token.symbol} balance fixed from ${parsedToken._originalBalance} to ${parsedToken.balance}`);
           }
         }
         
         // Log tokens with 0 balance for debugging
         if (parsedToken.balance === 0 && originalBalance > 0) {
           console.warn(`⚠️ ZERO BALANCE: ${token.symbol} went from ${originalBalance} to 0`);
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
     
     console.log(`🔧 TOKEN PROCESSING COMPLETE:`, {
       processed: processedTokens.length,
       corrections: corrections,
       extremeValueZeroed: extremeValueZeroed,
       totalOriginalValue: totalOriginalValue.toLocaleString(),
       totalProcessedValue: totalProcessedValue.toLocaleString(),
       valueRetained: totalOriginalValue > 0 ? 
         ((totalProcessedValue / totalOriginalValue) * 100).toFixed(1) + '%' : '0%',
       tokensWithBalance: processedTokens.filter(t => t.balance > 0).length,
       tokensZeroed: processedTokens.filter(t => t.balance === 0).length
     });
     
     // 🚨 ALERT if too many tokens were zeroed
     if (extremeValueZeroed > processedTokens.length * 0.5) {
       console.error(`🚨 ALERT: ${extremeValueZeroed}/${processedTokens.length} tokens were zeroed! Token parsing might be too aggressive!`);
     }
     
     return {
       tokens: processedTokens,
       corrections: corrections,
       stats: {
         processed: processedTokens.length,
         corrected: corrections,
         zeroed: extremeValueZeroed,
         valueRetained: totalOriginalValue > 0 ? 
           ((totalProcessedValue / totalOriginalValue) * 100).toFixed(1) + '%' : '0%'
       }
     };
   }
 } 