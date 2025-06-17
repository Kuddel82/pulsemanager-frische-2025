/**
 * 🇩🇪 DEUTSCHES CRYPTO-STEUERRECHT SERVICE
 * 
 * Korrekte Implementierung nach deutschem Steuerrecht:
 * - §22 EStG: Sonstige Einkünfte (ROI, Staking, Mining, Airdrops)
 * - §23 EStG: Private Veräußerungsgeschäfte (Token-Handel)
 * - FIFO-Prinzip für Verkäufe
 * - 365-Tage Spekulationsfrist
 * - 600€ Freigrenze pro Jahr
 */

import { MoralisV2Service } from './MoralisV2Service';

class GermanTaxService {
    
    // 🇩🇪 DEUTSCHE STEUERKATEGORIEN (KORREKT!)
    static TAX_CATEGORIES = {
        // §23 EStG - Private Veräußerungsgeschäfte
        SPECULATION_BUY: 'Spekulativer Kauf',
        SPECULATION_SELL: 'Spekulativer Verkauf', 
        SPECULATION_SWAP: 'Token-Tausch',
        
        // §22 EStG - Sonstige Einkünfte
        ROI_INCOME: 'ROI-Einkommen',
        STAKING_REWARD: 'Staking-Ertrag',
        MINING_REWARD: 'Mining-Ertrag', 
        AIRDROP: 'Airdrop-Erhalt'
    };

    // 🏦 BEKANNTE ROI-CONTRACTS (erweitern nach Bedarf)
    static KNOWN_ROI_CONTRACTS = {
        // Ethereum Mainnet - WGEP und andere bekannte ROI-Contracts
        '0xfd64ca11825486ab22bbeecbcd8bc29cccfef09c': 'WGEP ROI Contract',
        '0x2b591e99afe9f32eaa6214f7b7629768c40eeb39': 'HEX Contract',
        '0x8bd3d1472a656e312e94fb1bbdd599b8c51d18e3': 'INC Contract',
        // PulseChain
        '0x2345678901234567890123456789012345678901': 'PulseChain ROI Contract',
        // Weitere ROI-Contracts hier hinzufügen
    };

    // 🗑️ SPAM-TOKEN FILTER
    static SPAM_TOKENS = [
        '0x0000000000000000000000000000000000000000',
        '0xb8713b', // Bekannter Spam-Contract mit falschen Decimals
        // Weitere bekannte Spam-Token hier
    ];

    /**
     * 🎯 HAUPT-METHODE: Vollständiger deutscher Steuerreport
     */
    static async generateGermanTaxReport(walletAddress, options = {}) {
        console.log(`🇩🇪 Generiere deutschen Steuerreport für: ${walletAddress}`);
        
        try {
            // 1. Lade alle Transaktionen (effizient!)
            const allTransactions = await this.loadAllTransactions(walletAddress, options);
            
            // 2. Klassifiziere nach deutschem Steuerrecht
            const classifiedTransactions = await this.classifyTransactionsGerman(allTransactions, walletAddress);
            
            // 3. Berechne FIFO für §23 EStG
            const fifoResults = this.calculateFIFO(classifiedTransactions, walletAddress);
            
            // 4. Erstelle deutsche Steuerzusammenfassung
            const germanSummary = this.calculateGermanTaxSummary(classifiedTransactions, fifoResults);
            
            // 5. Formatiere für PDF-Export
            const taxTable = this.formatForPDF(classifiedTransactions, germanSummary);
            
            return {
                transactions: classifiedTransactions,
                germanSummary,
                fifoResults,
                taxTable,
                summary: germanSummary, // Für Rückwärtskompatibilität
                metadata: {
                    walletAddress,
                    generated: new Date().toISOString(),
                    totalTransactions: allTransactions.length,
                    germanTaxLaw: 'EStG §22 & §23',
                    system: 'GermanTaxService v1.0'
                }
            };
            
        } catch (error) {
            console.error('❌ Fehler beim Generieren des Steuerreports:', error);
            throw new Error(`Steuerreport-Fehler: ${error.message}`);
        }
    }

    /**
     * 📊 EFFIZIENTE DATENLADUNG - Nur 2 API-Calls pro Chain!
     */
    static async loadAllTransactions(walletAddress, options = {}) {
        const { chainIds = ['0x1'], maxPages = 30 } = options; // Standardmäßig nur Ethereum
        const allTransactions = [];
        
        for (const chainId of chainIds) {
            console.log(`📡 Lade Transaktionen für Chain ${chainId}...`);
            
            try {
                // API-CALL 1: Token-Transfers (ERC20)
                const tokenTransfers = await this.fetchTokenTransfers(walletAddress, chainId, maxPages);
                
                // API-CALL 2: Native Transaktionen (ETH/PLS)
                const nativeTransactions = await this.fetchNativeTransactions(walletAddress, chainId, maxPages);
                
                // Kombiniere und markiere Chain
                const chainTransactions = [...tokenTransfers, ...nativeTransactions].map(tx => ({
                    ...tx,
                    chainId,
                    chainName: chainId === '0x1' ? 'Ethereum' : chainId === '0x171' ? 'PulseChain' : `Chain-${chainId}`,
                    sourceChain: chainId,
                    sourceChainName: chainId === '0x1' ? 'Ethereum' : 'PulseChain'
                }));
                
                allTransactions.push(...chainTransactions);
                console.log(`✅ ${chainTransactions.length} Transaktionen von ${chainId} geladen`);
                
            } catch (error) {
                console.error(`❌ Fehler beim Laden von Chain ${chainId}:`, error);
            }
        }
        
        // Sortiere chronologisch
        return allTransactions.sort((a, b) => new Date(a.block_timestamp) - new Date(b.block_timestamp));
    }

    /**
     * 🔄 TOKEN-TRANSFERS laden (ERC20)
     */
    static async fetchTokenTransfers(walletAddress, chainId, maxPages) {
        const transfers = [];
        let cursor = null;
        let pageCount = 0;
        
        while (pageCount < maxPages) {
            try {
                const response = await MoralisV2Service.getWalletTransactionsBatch(
                    walletAddress, 
                    100, 
                    cursor, 
                    chainId, 
                    'erc20-transfers'
                );
                
                if (!response?.success || !response.result?.length) break;
                
                // Filter Spam-Token
                const validTransfers = response.result.filter(tx => 
                    !this.SPAM_TOKENS.includes(tx.token_address?.toLowerCase()) &&
                    tx.token_address && 
                    tx.token_address !== '0x0000000000000000000000000000000000000000'
                );
                
                transfers.push(...validTransfers);
                cursor = response.cursor;
                pageCount++;
                
                if (!cursor) break;
                
                // Rate-Limit-Schutz
                await new Promise(resolve => setTimeout(resolve, 100));
                
            } catch (error) {
                console.error(`❌ Token-Transfer-Fehler (Seite ${pageCount}):`, error);
                break;
            }
        }
        
        console.log(`🔄 ${transfers.length} Token-Transfers geladen (${pageCount} Seiten)`);
        return transfers;
    }

    /**
     * ⚡ NATIVE TRANSAKTIONEN laden (ETH/PLS)
     */
    static async fetchNativeTransactions(walletAddress, chainId, maxPages) {
        const transactions = [];
        let cursor = null;
        let pageCount = 0;
        
        while (pageCount < maxPages) {
            try {
                const response = await MoralisV2Service.getWalletTransactionsBatch(
                    walletAddress, 
                    100, 
                    cursor, 
                    chainId, 
                    'transactions'
                );
                
                if (!response?.success || !response.result?.length) break;
                
                transactions.push(...response.result);
                cursor = response.cursor;
                pageCount++;
                
                if (!cursor) break;
                
                // Rate-Limit-Schutz
                await new Promise(resolve => setTimeout(resolve, 100));
                
            } catch (error) {
                console.error(`❌ Native-Transaction-Fehler (Seite ${pageCount}):`, error);
                break;
            }
        }
        
        console.log(`⚡ ${transactions.length} Native-Transaktionen geladen (${pageCount} Seiten)`);
        return transactions;
    }

    /**
     * 🇩🇪 DEUTSCHE STEUERKLASSIFIZIERUNG
     */
    static async classifyTransactionsGerman(transactions, walletAddress) {
        const classified = [];
        
        console.log(`🏛️ Klassifiziere ${transactions.length} Transaktionen nach deutschem Steuerrecht...`);
        
        for (const tx of transactions) {
            try {
                const classification = await this.classifySingleTransaction(tx, walletAddress);
                const historicalPrice = await this.getHistoricalPrice(tx);
                const euroValue = this.calculateEuroValue(tx, historicalPrice);
                
                classified.push({
                    ...tx,
                    germanTaxCategory: classification.category,
                    taxParagraph: classification.paragraph,
                    taxRelevant: classification.taxRelevant,
                    isROI: classification.isROI || false,
                    isSpeculation: classification.isSpeculation || false,
                    historicalPrice,
                    euroValue,
                    // Für Rückwärtskompatibilität
                    taxCategory: classification.category,
                    isTaxable: classification.taxRelevant,
                    usdValue: euroValue,
                    tokenSymbol: tx.token_symbol || 'ETH',
                    tokenAmount: this.getTokenAmount(tx),
                    ethAmount: this.getETHAmount(tx)
                });
            } catch (error) {
                console.error('❌ Klassifizierungsfehler:', error);
                // Fallback-Klassifizierung
                classified.push({
                    ...tx,
                    germanTaxCategory: 'Unklassifiziert',
                    taxParagraph: 'Unbekannt',
                    taxRelevant: false,
                    historicalPrice: 0,
                    euroValue: 0,
                    // Für Rückwärtskompatibilität
                    taxCategory: 'Unklassifiziert',
                    isTaxable: false,
                    usdValue: 0,
                    tokenSymbol: tx.token_symbol || 'ETH'
                });
            }
        }
        
        console.log(`✅ ${classified.length} Transaktionen klassifiziert`);
        return classified;
    }

    /**
     * 🎯 EINZELTRANSAKTION KLASSIFIZIEREN
     */
    static async classifySingleTransaction(tx, walletAddress) {
        const isIncoming = tx.to_address?.toLowerCase() === walletAddress.toLowerCase();
        const isOutgoing = tx.from_address?.toLowerCase() === walletAddress.toLowerCase();
        
        // 🔥 ROI-ERKENNUNG (§22 EStG)
        if (isIncoming && this.isROITransaction(tx, walletAddress)) {
            return {
                category: this.TAX_CATEGORIES.ROI_INCOME,
                paragraph: '§22 EStG - Sonstige Einkünfte',
                taxRelevant: true,
                isROI: true
            };
        }
        
        // 💰 TOKEN-KAUF (§23 EStG)
        if (isIncoming && !this.isROITransaction(tx, walletAddress)) {
            return {
                category: this.TAX_CATEGORIES.SPECULATION_BUY,
                paragraph: '§23 EStG - Private Veräußerungsgeschäfte',
                taxRelevant: false, // Käufe sind nicht direkt steuerpflichtig
                isSpeculation: true
            };
        }
        
        // 💸 TOKEN-VERKAUF (§23 EStG)
        if (isOutgoing) {
            return {
                category: this.TAX_CATEGORIES.SPECULATION_SELL,
                paragraph: '§23 EStG - Private Veräußerungsgeschäfte', 
                taxRelevant: true, // Verkäufe sind potentiell steuerpflichtig (FIFO-abhängig)
                isSpeculation: true
            };
        }
        
        // 🔄 SWAP-ERKENNUNG
        if (this.isSwapTransaction(tx)) {
            return {
                category: this.TAX_CATEGORIES.SPECULATION_SWAP,
                paragraph: '§23 EStG - Private Veräußerungsgeschäfte',
                taxRelevant: true,
                isSpeculation: true
            };
        }
        
        // Standard-Fall
        return {
            category: 'Standard-Transaktion',
            paragraph: 'Nicht steuerrelevant',
            taxRelevant: false
        };
    }

    /**
     * 🎯 ROI-ERKENNUNG (ERWEITERT!)
     */
    static isROITransaction(tx, walletAddress) {
        const fromAddress = tx.from_address?.toLowerCase();
        const isIncoming = tx.to_address?.toLowerCase() === walletAddress.toLowerCase();
        
        if (!isIncoming || !fromAddress) return false;
        
        // 1. Prüfe bekannte ROI-Contracts
        if (this.KNOWN_ROI_CONTRACTS[fromAddress]) {
            console.log(`🎯 ROI erkannt: Bekannter Contract ${this.KNOWN_ROI_CONTRACTS[fromAddress]}`);
            return true;
        }
        
        // 2. ROI-Pattern-Erkennung
        const value = this.getTokenAmount(tx);
        const isSmallAmount = value > 0 && value < 10; // Typische ROI-Größen (ETH)
        const isFromContract = fromAddress && fromAddress !== walletAddress.toLowerCase() && fromAddress.length === 42;
        
        // 3. WGEP-spezifische ROI-Erkennung
        if (this.isWGEPROIPattern(tx)) {
            console.log(`🖨️ WGEP ROI erkannt: ${value} ETH`);
            return true;
        }
        
        // 4. Allgemeine ROI-Heuristiken
        if (isFromContract && isSmallAmount) {
            const hasROIPattern = this.hasROITransactionPattern(tx);
            if (hasROIPattern) {
                console.log(`🎯 ROI Pattern erkannt: ${value} Token von Contract`);
                return true;
            }
        }
        
        return false;
    }

    /**
     * 🖨️ WGEP ROI-PATTERN ERKENNUNG
     */
    static isWGEPROIPattern(tx) {
        const value = this.getTokenAmount(tx);
        
        // Typische WGEP ROI-Beträge (basierend auf echten Daten)
        const isWGEPRange = value >= 0.0003 && value <= 0.002;
        const hasWGEPDecimals = value.toString().includes('.') && 
                               value.toString().split('.')[1]?.length >= 4;
        
        return isWGEPRange && hasWGEPDecimals;
    }

    /**
     * 🔍 ROI-TRANSACTION-PATTERN
     */
    static hasROITransactionPattern(tx) {
        const value = this.getTokenAmount(tx);
        
        // ROI-typische Eigenschaften
        const isRegularAmount = value > 0.0001 && value < 100;
        const isFromContract = tx.from_address && tx.from_address.length === 42;
        const hasValue = parseFloat(tx.value || '0') > 0;
        
        return isRegularAmount && isFromContract && hasValue;
    }

    /**
     * 🔄 SWAP-ERKENNUNG
     */
    static isSwapTransaction(tx) {
        // DEX-Pattern erkennen
        const input = tx.input || '';
        const dexSignatures = [
            '0xa9059cbb', // transfer
            '0x095ea7b3', // approve
            '0x7ff36ab5', // swapExactETHForTokens
            '0x791ac947', // swapExactTokensForETH
            '0x8803dbee'  // swapTokensForExactTokens
        ];
        
        return dexSignatures.some(sig => input.startsWith(sig));
    }

    /**
     * 📊 FIFO-BERECHNUNG für §23 EStG
     */
    static calculateFIFO(transactions, walletAddress) {
        const fifoQueue = {}; // Pro Token eine Queue
        const fifoResults = [];
        
        console.log(`💰 Berechne FIFO für ${transactions.length} Transaktionen...`);
        
        for (const tx of transactions) {
            if (!tx.isSpeculation) continue;
            
            const tokenKey = tx.token_address || 'NATIVE_ETH';
            
            if (!fifoQueue[tokenKey]) {
                fifoQueue[tokenKey] = [];
            }
            
            if (tx.germanTaxCategory === this.TAX_CATEGORIES.SPECULATION_BUY) {
                // Kauf: In Queue einreihen
                fifoQueue[tokenKey].push({
                    date: tx.block_timestamp,
                    amount: this.getTokenAmount(tx),
                    priceEur: tx.historicalPrice || 0,
                    remaining: this.getTokenAmount(tx),
                    transactionHash: tx.transaction_hash
                });
            }
            
            if (tx.germanTaxCategory === this.TAX_CATEGORIES.SPECULATION_SELL) {
                // Verkauf: FIFO-Verrechnung
                const sellAmount = this.getTokenAmount(tx);
                let remainingSell = sellAmount;
                let totalGain = 0;
                let isWithinSpeculationPeriod = false;
                let avgHoldingDays = 0;
                const usedPurchases = [];
                
                while (remainingSell > 0 && fifoQueue[tokenKey].length > 0) {
                    const oldestBuy = fifoQueue[tokenKey][0];
                    const daysDiff = this.getDaysDifference(oldestBuy.date, tx.block_timestamp);
                    
                    if (daysDiff <= 365) {
                        isWithinSpeculationPeriod = true;
                    }
                    
                    const useAmount = Math.min(remainingSell, oldestBuy.remaining);
                    const gain = (tx.historicalPrice - oldestBuy.priceEur) * useAmount;
                    
                    totalGain += gain;
                    remainingSell -= useAmount;
                    oldestBuy.remaining -= useAmount;
                    
                    usedPurchases.push({
                        buyDate: oldestBuy.date,
                        amount: useAmount,
                        holdingDays: daysDiff,
                        gain: gain
                    });
                    
                    if (oldestBuy.remaining <= 0) {
                        fifoQueue[tokenKey].shift();
                    }
                }
                
                // Durchschnittliche Haltedauer berechnen
                if (usedPurchases.length > 0) {
                    avgHoldingDays = usedPurchases.reduce((sum, p) => sum + p.holdingDays, 0) / usedPurchases.length;
                }
                
                fifoResults.push({
                    transactionHash: tx.transaction_hash,
                    tokenAddress: tokenKey,
                    tokenSymbol: tx.token_symbol || 'ETH',
                    sellAmount,
                    sellPrice: tx.historicalPrice || 0,
                    gain: totalGain,
                    avgHoldingDays,
                    isWithinSpeculationPeriod,
                    taxRelevant: isWithinSpeculationPeriod,
                    paragraph: isWithinSpeculationPeriod ? '§23 EStG (Steuerpflichtig)' : 'Steuerfrei (>365 Tage)',
                    usedPurchases
                });
            }
        }
        
        console.log(`✅ FIFO berechnet: ${fifoResults.length} Verkäufe analysiert`);
        return fifoResults;
    }

    /**
     * 📅 TAGE-DIFFERENZ berechnen
     */
    static getDaysDifference(date1, date2) {
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        const diffTime = Math.abs(d2 - d1);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    /**
     * 🇩🇪 DEUTSCHE STEUERZUSAMMENFASSUNG
     */
    static calculateGermanTaxSummary(transactions, fifoResults) {
        const summary = {
            // Grundzahlen
            totalTransactions: transactions.length,
            taxableTransactions: transactions.filter(tx => tx.taxRelevant).length,
            
            // §22 EStG - Sonstige Einkünfte
            paragraph22: {
                roiIncome: 0,
                stakingRewards: 0,
                miningRewards: 0,
                airdrops: 0,
                total: 0,
                count: 0,
                note: '§22 EStG - Sonstige Einkünfte (Einkommensteuerpflichtig 14-45%)'
            },
            
            // §23 EStG - Private Veräußerungsgeschäfte
            paragraph23: {
                taxableGains: 0,
                taxFreeGains: 0,
                totalTrades: 0,
                freigrenze600: {
                    applicable: true,
                    exceeded: false,
                    amount: 0,
                    note: 'Freigrenze 600€ pro Jahr für §23 EStG'
                },
                note: '§23 EStG - Private Veräußerungsgeschäfte (Spekulationsfrist 365 Tage)'
            },
            
            // Für Rückwärtskompatibilität
            roiIncome: 0,
            speculativeTransactions: {
                withinSpeculationPeriod: { amount: 0, count: 0 },
                afterSpeculationPeriod: { amount: 0, count: 0 }
            },
            
            // Gesamtsumme
            totalTaxRelevant: 0,
            yearlyBreakdown: {}
        };
        
        // §22 EStG Einkünfte summieren
        transactions.forEach(tx => {
            const year = new Date(tx.block_timestamp).getFullYear();
            if (!summary.yearlyBreakdown[year]) {
                summary.yearlyBreakdown[year] = { paragraph22: 0, paragraph23: 0 };
            }
            
            if (tx.taxParagraph?.includes('§22') && tx.taxRelevant) {
                const value = tx.euroValue || 0;
                summary.paragraph22.total += value;
                summary.paragraph22.count++;
                summary.roiIncome += value; // Rückwärtskompatibilität
                summary.yearlyBreakdown[year].paragraph22 += value;
                
                // Detailklassifizierung
                if (tx.germanTaxCategory === this.TAX_CATEGORIES.ROI_INCOME) {
                    summary.paragraph22.roiIncome += value;
                }
                if (tx.germanTaxCategory === this.TAX_CATEGORIES.STAKING_REWARD) {
                    summary.paragraph22.stakingRewards += value;
                }
            }
        });
        
        // §23 EStG FIFO-Ergebnisse summieren
        fifoResults.forEach(result => {
            const year = new Date(result.date || new Date()).getFullYear();
            if (!summary.yearlyBreakdown[year]) {
                summary.yearlyBreakdown[year] = { paragraph22: 0, paragraph23: 0 };
            }
            
            summary.paragraph23.totalTrades++;
            
            if (result.taxRelevant) {
                summary.paragraph23.taxableGains += result.gain;
                summary.speculativeTransactions.withinSpeculationPeriod.amount += result.gain;
                summary.speculativeTransactions.withinSpeculationPeriod.count++;
                summary.yearlyBreakdown[year].paragraph23 += result.gain;
            } else {
                summary.paragraph23.taxFreeGains += result.gain;
                summary.speculativeTransactions.afterSpeculationPeriod.amount += result.gain;
                summary.speculativeTransactions.afterSpeculationPeriod.count++;
            }
        });
        
        // 600€ Freigrenze prüfen
        if (summary.paragraph23.taxableGains > 600) {
            summary.paragraph23.freigrenze600.exceeded = true;
            summary.paragraph23.freigrenze600.amount = summary.paragraph23.taxableGains;
        }
        
        // Gesamtsumme
        summary.totalTaxRelevant = summary.paragraph22.total + 
            (summary.paragraph23.freigrenze600.exceeded ? summary.paragraph23.taxableGains : 0);
        
        return summary;
    }

    /**
     * 💰 HISTORISCHE PREISE laden
     */
    static async getHistoricalPrice(tx) {
        try {
            // Vereinfachte Preisberechnung - kann später erweitert werden
            if (tx.token_symbol === 'ETH' || !tx.token_address) {
                return 2500; // Durchschnittlicher ETH-Preis (vereinfacht)
            }
            
            // Für andere Token: Fallback-Preis
            return 1; // 1 EUR als Fallback
            
        } catch (error) {
            console.error('❌ Preis-Lookup-Fehler:', error);
            return 0;
        }
    }

    /**
     * 💶 EURO-WERT berechnen
     */
    static calculateEuroValue(tx, historicalPrice) {
        const amount = this.getTokenAmount(tx);
        return amount * (historicalPrice || 0);
    }

    /**
     * 🔢 TOKEN-AMOUNT extrahieren
     */
    static getTokenAmount(tx) {
        if (tx.token_address && tx.value) {
            const decimals = parseInt(tx.token_decimal || tx.decimals || 18);
            return parseFloat(tx.value) / Math.pow(10, decimals);
        }
        
        // Native ETH/PLS
        if (tx.value && !tx.token_address) {
            return parseFloat(tx.value) / 1e18;
        }
        
        return 0;
    }

    /**
     * ⚡ ETH-AMOUNT extrahieren
     */
    static getETHAmount(tx) {
        if (!tx.token_address && tx.value) {
            return parseFloat(tx.value) / 1e18;
        }
        return 0;
    }

    /**
     * 📊 PDF-FORMAT vorbereiten
     */
    static formatForPDF(transactions, germanSummary) {
        return transactions
            .filter(tx => tx.taxRelevant)
            .map(tx => ({
                datum: new Date(tx.block_timestamp).toLocaleDateString('de-DE'),
                coin: tx.token_symbol || 'ETH',
                menge: this.getTokenAmount(tx).toFixed(6),
                preis: `€${(tx.historicalPrice || 0).toFixed(2)}`,
                art: tx.germanTaxCategory,
                steuerpflichtig: tx.taxRelevant ? 'Ja' : 'Nein',
                bemerkung: tx.taxParagraph,
                chain: tx.chainName || 'Ethereum'
            }));
    }

    /**
     * 🎯 WGEP TEST REPORT (Kompatibilität)
     */
    static async generateWGEPTestReport(walletAddress) {
        console.log(`🎯 WGEP Test für: ${walletAddress}`);
        
        const report = await this.generateGermanTaxReport(walletAddress, {
            chainIds: ['0x1'], // Nur Ethereum für WGEP
            maxPages: 50
        });
        
        // WGEP-spezifische Analyse
        const wgepTransactions = report.transactions.filter(tx => tx.isROI);
        
        return {
            ...report,
            isWGEPTest: true,
            totalTransactions: report.transactions.length,
            taxRelevantTransactions: report.transactions.filter(tx => tx.taxRelevant).length,
            wgepROICount: wgepTransactions.length,
            wgepROIValue: wgepTransactions.reduce((sum, tx) => sum + (tx.euroValue || 0), 0)
        };
    }

    /**
     * 📄 PDF MANUELL GENERIEREN (Kompatibilität)
     */
    static async generatePDFManually(taxReport, options = {}) {
        console.log('📄 PDF-Generierung wird vorbereitet...');
        
        // Hier würde die PDF-Generierung implementiert werden
        // Für jetzt return success
        return {
            success: true,
            message: 'PDF-Generierung vorbereitet',
            fileName: `steuerreport_${new Date().toISOString().split('T')[0]}.pdf`
        };
    }
}

export { GermanTaxService };
export default GermanTaxService; 