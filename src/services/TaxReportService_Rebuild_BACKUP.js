// 🔄 BACKUP DER ORIGINALEN TRANSACTION PARSING LOGIK
// Erstellt am: 2025-06-16 für Moralis Transaction Labeling Upgrade
// Diese Datei enthält die ursprüngliche Heuristik-basierte Logik als Fallback

export class TaxReportService_Rebuild_BACKUP {
    
    // 🔍 ORIGINALE TRANSACTION TYPE PARSING (Heuristik-basiert)
    static parseTransactionType_ORIGINAL(transaction, walletAddress) {
        const { from_address, to_address, value, input } = transaction;
        
        const isIncoming = to_address?.toLowerCase() === walletAddress?.toLowerCase();
        const isOutgoing = from_address?.toLowerCase() === walletAddress?.toLowerCase();
        
        // 🔍 DEBUG: Zeige ALLE Transaktionen (nicht nur eingehende) - ONLY IN DEBUG MODE
        if (this.debugMode) {
            console.log(`🔍 ALL TX: isIncoming=${isIncoming}, isOutgoing=${isOutgoing}, from=${from_address?.slice(0,8)}, to=${to_address?.slice(0,8)}, wallet=${walletAddress?.slice(0,8)}`);
        }
        
        // 🎯 ERWEITERTE SWAP-ERKENNUNG: USDT→WGEP Transaktionen
        if (this.isSwapTransaction(transaction)) {
            const swapInfo = this.analyzeSwapTransaction(transaction, walletAddress);
            if (swapInfo.isWGEPSwap) {
                console.log(`🔄 WGEP SWAP ERKANNT: ${swapInfo.inputToken} → ${swapInfo.outputToken} (${swapInfo.inputAmount} → ${swapInfo.outputAmount})`);
                return this.TAX_CATEGORIES.SWAP;
            }
        }
        
        // 🔍 DEBUG: Zeige alle eingehenden Transaktionen
        if (isIncoming && from_address !== walletAddress) {
            const ethValue = parseFloat(value || '0') / Math.pow(10, transaction.decimals || 18);
            if (this.debugMode) {
                console.log(`🔍 INCOMING TX: ${ethValue.toFixed(6)} ${transaction.token_symbol || 'ETH'} von ${from_address?.slice(0,8)}... → Prüfe ROI...`);
                console.log(`🔍 TX DETAILS: token_address=${transaction.token_address}, value=${value}, decimals=${transaction.decimals}, symbol=${transaction.token_symbol}`);
            }
        } else if (this.debugMode) {
            console.log(`🔍 NOT INCOMING: isIncoming=${isIncoming}, from_address=${from_address?.slice(0,8)}, walletAddress=${walletAddress?.slice(0,8)}, same=${from_address === walletAddress}`);
        }

        // 🔥 ROI-ERKENNUNG: Eingehende Token von Contracts (UNIVERSELL für alle Chains)
        if (isIncoming && from_address !== walletAddress) {
            // 🎯 UNIVERSELLE ROI-ERKENNUNG: Prüfe ALLE eingehenden Transaktionen
            if (this.isROITransaction(transaction, walletAddress)) {
                const tokenSymbol = transaction.token_symbol || transaction.symbol || 'ETH';
                const amount = this.getTokenAmount(transaction);
                if (this.debugMode) {
                    console.log(`🎯 ROI UNIVERSAL: ${amount} ${tokenSymbol} von ${from_address.slice(0,8)}... (EINKOMMENSTEUERPFLICHTIG §22 EStG)`);
                }
                return this.TAX_CATEGORIES.ROI_INCOME;
            }
            
            // 🔍 FALLBACK: Bekannte ROI-Contracts oder Drucker (für Sicherheit)
            if (this.isKnownROISource(from_address) || this.isDruckerTransaction(transaction)) {
                const tokenSymbol = transaction.token_symbol || transaction.symbol || 'ETH';
                const amount = this.getTokenAmount(transaction);
                if (this.debugMode) {
                    console.log(`🎯 ROI FALLBACK: ${amount} ${tokenSymbol} von ${from_address.slice(0,8)}... (EINKOMMENSTEUERPFLICHTIG §22 EStG)`);
                }
                return this.TAX_CATEGORIES.ROI_INCOME;
            }
        }

        // 🔥 TOKEN-KATEGORISIERUNG: Universell für alle Tokens
        const tokenSymbol = transaction.token_symbol || transaction.symbol;
        const tokenAddress = transaction.token_address;
        
        // WGEP-TOKEN: Spezielle Behandlung für WGEP-Transaktionen
        if (tokenSymbol === 'WGEP' || tokenSymbol === '🖨️' || this.isWGEPContract(tokenAddress)) {
            if (isIncoming) {
                console.log(`🖨️ WGEP KAUF: ${this.getTokenAmount(transaction)} WGEP erhalten (HALTEFRIST BEGINNT)`);
                return this.TAX_CATEGORIES.KAUF;
            } else if (isOutgoing) {
                console.log(`🖨️ WGEP VERKAUF: ${this.getTokenAmount(transaction)} WGEP verkauft (HALTEFRIST-PRÜFUNG)`);
                return this.TAX_CATEGORIES.VERKAUF;
            }
        }
        
        // STABLECOINS: USDC, USDT, DAI, BUSD
        if (this.isStablecoin(tokenSymbol)) {
            if (isIncoming) {
                console.log(`💰 STABLECOIN KAUF: ${this.getTokenAmount(transaction)} ${tokenSymbol} erhalten`);
                return this.TAX_CATEGORIES.STABLECOIN_KAUF;
            } else if (isOutgoing) {
                console.log(`💸 STABLECOIN VERKAUF: ${this.getTokenAmount(transaction)} ${tokenSymbol} gesendet`);
                return this.TAX_CATEGORIES.STABLECOIN_VERKAUF;
            }
        }

        // NATIVE TOKENS: ETH, PLS
        if (this.isNativeToken(tokenSymbol, transaction.sourceChain)) {
            if (isIncoming) {
                console.log(`⚡ ${tokenSymbol} KAUF: ${this.getTokenAmount(transaction)} ${tokenSymbol} erhalten (HALTEFRIST BEGINNT)`);
                return tokenSymbol === 'ETH' ? this.TAX_CATEGORIES.ETH_KAUF : this.TAX_CATEGORIES.PLS_KAUF;
            } else if (isOutgoing) {
                console.log(`⚡ ${tokenSymbol} VERKAUF: ${this.getTokenAmount(transaction)} ${tokenSymbol} verkauft (HALTEFRIST-PRÜFUNG)`);
                return tokenSymbol === 'ETH' ? this.TAX_CATEGORIES.ETH_VERKAUF : this.TAX_CATEGORIES.PLS_VERKAUF;
            }
        }

        // WRAPPED TOKENS: WETH, WPLS (nicht steuerrelevant)
        if (this.isWrappedToken(tokenSymbol)) {
            if (isIncoming) {
                console.log(`🔄 WRAP: ${this.getTokenAmount(transaction)} ${tokenSymbol} erhalten (NICHT STEUERRELEVANT)`);
                return this.TAX_CATEGORIES.WRAP;
            } else if (isOutgoing) {
                console.log(`🔄 UNWRAP: ${this.getTokenAmount(transaction)} ${tokenSymbol} gesendet (NICHT STEUERRELEVANT)`);
                return this.TAX_CATEGORIES.UNWRAP;
            }
        }

        // Swap-Erkennung: Complex transaction mit input data
        if (input && input !== '0x' && input.length > 10) {
            return this.TAX_CATEGORIES.SWAP;
        }

        // Standard-Klassifikation
        if (isIncoming) {
            return this.TAX_CATEGORIES.KAUF;
        } else if (isOutgoing) {
            return this.TAX_CATEGORIES.VERKAUF;
        } else {
            return this.TAX_CATEGORIES.TRANSFER;
        }
    }
} 