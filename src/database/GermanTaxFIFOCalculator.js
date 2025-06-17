/**
 * GermanTaxFIFOCalculator.js
 * 
 * Deutsche Steuer-konforme FIFO-Berechnung nach §22 & §23 EStG
 * Features: Spekulationsfrist, 600€ Freigrenze, ROI-Klassifizierung
 * 
 * @author PulseManager Tax Team
 * @version 1.0.0
 * @since 2024-06-14
 */

class GermanTaxFIFOCalculator {
    constructor(options = {}) {
        // Deutsche Steuerregeln
        this.SPECULATION_PERIOD_DAYS = 365; // §23 EStG Spekulationsfrist
        this.SPECULATION_EXEMPTION_EUR = 600; // §23 EStG Freigrenze
        this.INCOME_TAX_MIN_RATE = 14; // Mindest-Einkommensteuersatz %
        this.INCOME_TAX_MAX_RATE = 45; // Höchst-Einkommensteuersatz %
        this.SOLIDARITY_SURCHARGE_RATE = 5.5; // Solidaritätszuschlag %

        // FIFO Queue für verschiedene Token
        this.fifoQueues = new Map();
        
        // Steuer-Berechnungen des aktuellen Jahres
        this.currentYearCalculations = {
            speculativeGains: 0,
            longTermGains: 0,
            roiIncome: 0,
            totalTaxableIncome: 0,
            exemptionUsed: 0,
            transactions: []
        };

        console.log('🧮 German Tax FIFO Calculator initialisiert');
    }

    /**
     * Token-Kauf zur FIFO-Queue hinzufügen
     */
    addPurchase(tokenAddress, amount, priceEUR, timestamp, txHash, metadata = {}) {
        if (!this.fifoQueues.has(tokenAddress)) {
            this.fifoQueues.set(tokenAddress, []);
        }

        const purchase = {
            amount: parseFloat(amount),
            remainingAmount: parseFloat(amount),
            priceEUR: parseFloat(priceEUR),
            timestamp: new Date(timestamp),
            txHash: txHash,
            isFullySold: false,
            metadata: metadata
        };

        this.fifoQueues.get(tokenAddress).push(purchase);

        console.log(`📈 Kauf hinzugefügt: ${amount} ${metadata.symbol || 'Token'} @ €${priceEUR}`);
        
        return purchase;
    }

    /**
     * Token-Verkauf mit FIFO-Berechnung
     */
    calculateSale(tokenAddress, sellAmount, sellPriceEUR, sellTimestamp, txHash, metadata = {}) {
        const sellAmount_num = parseFloat(sellAmount);
        const sellPriceEUR_num = parseFloat(sellPriceEUR);
        const sellDate = new Date(sellTimestamp);

        if (!this.fifoQueues.has(tokenAddress) || this.fifoQueues.get(tokenAddress).length === 0) {
            console.warn(`⚠️ Keine Kaufdaten für Token ${tokenAddress} vorhanden - Verkauf ignoriert`);
            return {
                success: false,
                error: 'Keine Kaufdaten vorhanden',
                details: null
            };
        }

        const queue = this.fifoQueues.get(tokenAddress);
        let remainingSellAmount = sellAmount_num;
        let totalCostBasis = 0;
        let totalSaleValue = sellAmount_num * sellPriceEUR_num;
        let speculativeGain = 0;
        let longTermGain = 0;
        let usedPurchases = [];
        let totalHoldingDays = 0;
        let holdingCount = 0;

        // FIFO-Verarbeitung: Älteste Käufe zuerst
        for (let i = 0; i < queue.length && remainingSellAmount > 0; i++) {
            const purchase = queue[i];
            
            if (purchase.remainingAmount <= 0 || purchase.isFullySold) {
                continue;
            }

            // Verwendete Menge bestimmen
            const usedAmount = Math.min(remainingSellAmount, purchase.remainingAmount);
            const usedCostBasis = usedAmount * purchase.priceEUR;
            const usedSaleValue = usedAmount * sellPriceEUR_num;
            const gainLoss = usedSaleValue - usedCostBasis;

            // Haltedauer berechnen
            const holdingDays = Math.floor((sellDate - purchase.timestamp) / (1000 * 60 * 60 * 24));
            
            totalCostBasis += usedCostBasis;
            totalHoldingDays += holdingDays;
            holdingCount++;

            // Deutsche Steuer: Spekulationsfrist prüfen
            if (holdingDays < this.SPECULATION_PERIOD_DAYS) {
                // Spekulationsgeschäft nach §23 EStG
                speculativeGain += gainLoss;
            } else {
                // Langfristig gehalten - steuerfrei nach §23 EStG
                longTermGain += gainLoss;
            }

            usedPurchases.push({
                purchaseDate: purchase.timestamp,
                sellDate: sellDate,
                amount: usedAmount,
                costBasis: usedCostBasis,
                saleValue: usedSaleValue,
                gainLoss: gainLoss,
                holdingDays: holdingDays,
                isSpeculative: holdingDays < this.SPECULATION_PERIOD_DAYS,
                txHash: purchase.txHash
            });

            // Purchase-Eintrag aktualisieren
            purchase.remainingAmount -= usedAmount;
            if (purchase.remainingAmount <= 0.0001) { // Floating point precision
                purchase.remainingAmount = 0;
                purchase.isFullySold = true;
            }

            remainingSellAmount -= usedAmount;
        }

        // Durchschnittliche Haltedauer
        const avgHoldingDays = holdingCount > 0 ? Math.floor(totalHoldingDays / holdingCount) : 0;
        const totalGainLoss = totalSaleValue - totalCostBasis;

        // Steuerrelevante Berechnung
        const taxableGain = this.calculateTaxableSpeculativeGain(speculativeGain);

        const saleResult = {
            success: true,
            tokenAddress: tokenAddress,
            tokenSymbol: metadata.symbol || 'Unknown',
            sellAmount: sellAmount_num,
            sellPriceEUR: sellPriceEUR_num,
            sellDate: sellDate,
            txHash: txHash,
            
            // Kostenberechnungen
            totalCostBasis: totalCostBasis,
            totalSaleValue: totalSaleValue,
            totalGainLoss: totalGainLoss,
            
            // Deutsche Steuer-Kategorien
            speculativeGain: speculativeGain,
            longTermGain: longTermGain,
            taxableGain: taxableGain,
            
            // Haltedauer
            avgHoldingDays: avgHoldingDays,
            isSpeculative: avgHoldingDays < this.SPECULATION_PERIOD_DAYS,
            
            // Details
            usedPurchases: usedPurchases,
            remainingAmountNotSold: remainingSellAmount
        };

        // Zu Jahresberechnungen hinzufügen
        this.addToYearlyCalculations(saleResult);

        console.log(`💰 Verkauf berechnet: ${sellAmount_num} ${metadata.symbol} - Gewinn/Verlust: €${totalGainLoss.toFixed(2)}`);
        
        return saleResult;
    }

    /**
     * ROI-Einkommen klassifizieren (§22 EStG)
     */
    addROIIncome(tokenAddress, amount, valueEUR, timestamp, txHash, roiType = 'staking', metadata = {}) {
        const roiIncome = {
            tokenAddress: tokenAddress,
            tokenSymbol: metadata.symbol || 'Unknown',
            amount: parseFloat(amount),
            valueEUR: parseFloat(valueEUR),
            timestamp: new Date(timestamp),
            txHash: txHash,
            roiType: roiType, // 'staking', 'mining', 'dividend', 'airdrop'
            taxParagraph: '§22 EStG',
            taxCategory: 'sonstige_einkuenfte',
            isROI: true
        };

        // ROI-Einkommen ist sofort steuerpflichtig (§22 EStG)
        this.currentYearCalculations.roiIncome += parseFloat(valueEUR);
        this.currentYearCalculations.totalTaxableIncome += parseFloat(valueEUR);
        this.currentYearCalculations.transactions.push(roiIncome);

        console.log(`🎯 ROI-Einkommen erfasst: €${valueEUR} (${roiType})`);
        
        return roiIncome;
    }

    /**
     * Spekulationsgewinn mit 600€ Freigrenze berechnen
     */
    calculateTaxableSpeculativeGain(speculativeGain) {
        if (speculativeGain <= 0) {
            return 0;
        }

        // 600€ Freigrenze für Spekulationsgeschäfte (§23 EStG)
        const remainingExemption = Math.max(0, this.SPECULATION_EXEMPTION_EUR - this.currentYearCalculations.exemptionUsed);
        const exemptionUsed = Math.min(speculativeGain, remainingExemption);
        const taxableGain = Math.max(0, speculativeGain - exemptionUsed);

        // Freigrenze verbrauchen
        this.currentYearCalculations.exemptionUsed += exemptionUsed;
        this.currentYearCalculations.speculativeGains += speculativeGain;
        this.currentYearCalculations.totalTaxableIncome += taxableGain;

        return taxableGain;
    }

    /**
     * Geschätzten Steuerbetrag berechnen
     */
    calculateEstimatedTax(taxableIncomeEUR, userTaxRate = null) {
        if (taxableIncomeEUR <= 0) {
            return 0;
        }

        // Steuersatz bestimmen (vereinfacht)
        let taxRate;
        if (userTaxRate) {
            taxRate = parseFloat(userTaxRate);
        } else {
            // Progressionsvorbehalt - vereinfachte Berechnung
            if (taxableIncomeEUR <= 10000) {
                taxRate = this.INCOME_TAX_MIN_RATE;
            } else if (taxableIncomeEUR <= 50000) {
                taxRate = 25; // Mittlerer Steuersatz
            } else {
                taxRate = 35; // Höherer Steuersatz
            }
        }

        const incomeTax = taxableIncomeEUR * (taxRate / 100);
        const solidarityTax = incomeTax * (this.SOLIDARITY_SURCHARGE_RATE / 100);
        
        return incomeTax + solidarityTax;
    }

    /**
     * Transaktion zu Jahresberechnungen hinzufügen
     */
    addToYearlyCalculations(saleResult) {
        this.currentYearCalculations.speculativeGains += saleResult.speculativeGain;
        this.currentYearCalculations.longTermGains += saleResult.longTermGain;
        this.currentYearCalculations.transactions.push({
            type: 'sale',
            ...saleResult
        });
    }

    /**
     * Vollständigen Jahresbericht generieren
     */
    generateYearlyReport(year = new Date().getFullYear(), options = {}) {
        const userTaxRate = options.userTaxRate || null;
        const includeDetails = options.includeDetails !== false;

        // Gesamte steuerbare Einkommen
        const totalTaxableIncome = this.currentYearCalculations.totalTaxableIncome;
        const estimatedTax = this.calculateEstimatedTax(totalTaxableIncome, userTaxRate);

        const report = {
            year: year,
            generatedAt: new Date(),
            
            // Zusammenfassung
            summary: {
                totalTransactions: this.currentYearCalculations.transactions.length,
                roiTransactions: this.currentYearCalculations.transactions.filter(t => t.isROI).length,
                saleTransactions: this.currentYearCalculations.transactions.filter(t => t.type === 'sale').length,
            },

            // Deutsche Steuer-Kategorien (in EUR)
            germanTaxCalculation: {
                // §22 EStG - Sonstige Einkünfte (ROI)
                roiIncomeEUR: this.currentYearCalculations.roiIncome,
                
                // §23 EStG - Spekulationsgeschäfte
                speculativeGainsEUR: this.currentYearCalculations.speculativeGains,
                longTermGainsEUR: this.currentYearCalculations.longTermGains, // steuerfrei
                
                // Freigrenze
                speculationExemptionEUR: this.SPECULATION_EXEMPTION_EUR,
                exemptionUsedEUR: this.currentYearCalculations.exemptionUsed,
                exemptionRemainingEUR: Math.max(0, this.SPECULATION_EXEMPTION_EUR - this.currentYearCalculations.exemptionUsed),
                
                // Gesamt
                totalTaxableIncomeEUR: totalTaxableIncome,
                estimatedTaxEUR: estimatedTax,
                
                // Steuerliche Hinweise
                notes: [
                    'ROI-Einkommen (WGEP, MASKMAN, etc.) sind nach §22 EStG als sonstige Einkünfte steuerpflichtig',
                    'Spekulationsgeschäfte unter 1 Jahr Haltedauer sind nach §23 EStG steuerpflichtig',
                    'Spekulationsgeschäfte über 1 Jahr Haltedauer sind nach §23 EStG steuerfrei',
                    `600€ Freigrenze für Spekulationsgeschäfte pro Jahr (${this.currentYearCalculations.exemptionUsed.toFixed(2)}€ bereits verwendet)`,
                    'FIFO-Methode wird für Kostenbasisbererechnung verwendet'
                ]
            },

            // Portfolio-Status
            portfolioStatus: this.getPortfolioStatus(),

            // Details (falls gewünscht)
            ...(includeDetails && {
                detailedTransactions: this.currentYearCalculations.transactions,
                fifoQueueStatus: this.getFIFOQueueStatus()
            })
        };

        console.log(`📋 Jahresbericht ${year} generiert: €${totalTaxableIncome.toFixed(2)} steuerpflichtig`);
        
        return report;
    }

    /**
     * Aktueller Portfolio-Status
     */
    getPortfolioStatus() {
        const status = [];

        for (const [tokenAddress, queue] of this.fifoQueues.entries()) {
            const totalRemaining = queue.reduce((sum, purchase) => sum + purchase.remainingAmount, 0);
            const avgCostBasis = queue.reduce((sum, purchase) => {
                return sum + (purchase.priceEUR * purchase.remainingAmount);
            }, 0) / Math.max(totalRemaining, 1);

            if (totalRemaining > 0.001) { // Ignore dust
                status.push({
                    tokenAddress: tokenAddress,
                    totalAmount: totalRemaining,
                    avgCostBasisEUR: avgCostBasis,
                    purchaseCount: queue.filter(p => !p.isFullySold).length,
                    oldestPurchase: Math.min(...queue.filter(p => !p.isFullySold).map(p => p.timestamp)),
                    unrealizedValue: 'Requires current market price'
                });
            }
        }

        return status;
    }

    /**
     * FIFO-Queue Status für Debugging
     */
    getFIFOQueueStatus() {
        const status = {};

        for (const [tokenAddress, queue] of this.fifoQueues.entries()) {
            status[tokenAddress] = {
                totalPurchases: queue.length,
                activePurchases: queue.filter(p => !p.isFullySold).length,
                totalRemaining: queue.reduce((sum, p) => sum + p.remainingAmount, 0),
                queue: queue.map(p => ({
                    amount: p.amount,
                    remainingAmount: p.remainingAmount,
                    priceEUR: p.priceEUR,
                    timestamp: p.timestamp,
                    isFullySold: p.isFullySold
                }))
            };
        }

        return status;
    }

    /**
     * Berechnungen für neues Jahr zurücksetzen
     */
    resetYearlyCalculations() {
        this.currentYearCalculations = {
            speculativeGains: 0,
            longTermGains: 0,
            roiIncome: 0,
            totalTaxableIncome: 0,
            exemptionUsed: 0,
            transactions: []
        };

        console.log('🔄 Jahresberechnungen zurückgesetzt');
    }

    /**
     * FIFO-Queue komplett leeren
     */
    clearAllQueues() {
        this.fifoQueues.clear();
        this.resetYearlyCalculations();
        console.log('🗑️ Alle FIFO-Queues geleert');
    }

    /**
     * Import von vorhandenen Transaktionen
     */
    importTransactions(transactions) {
        console.log(`📥 Importiere ${transactions.length} Transaktionen...`);
        
        let importedCount = 0;
        
        // Zuerst alle Käufe importieren
        const purchases = transactions.filter(tx => 
            ['buy', 'airdrop'].includes(tx.tx_type) && !tx.is_spam
        ).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        for (const tx of purchases) {
            try {
                this.addPurchase(
                    tx.token_address,
                    tx.amount,
                    tx.amount_eur / tx.amount,
                    tx.timestamp,
                    tx.tx_hash,
                    { symbol: tx.token_symbol, name: tx.token_name }
                );
                importedCount++;
            } catch (error) {
                console.warn(`⚠️ Fehler beim Import von Kauf ${tx.tx_hash}:`, error);
            }
        }

        // Dann alle Verkäufe/Swaps verarbeiten
        const sales = transactions.filter(tx => 
            ['sell', 'swap'].includes(tx.tx_type) && !tx.is_spam
        ).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        for (const tx of sales) {
            try {
                this.calculateSale(
                    tx.token_address,
                    tx.amount,
                    tx.amount_eur / tx.amount,
                    tx.timestamp,
                    tx.tx_hash,
                    { symbol: tx.token_symbol, name: tx.token_name }
                );
                importedCount++;
            } catch (error) {
                console.warn(`⚠️ Fehler beim Import von Verkauf ${tx.tx_hash}:`, error);
            }
        }

        // ROI-Transaktionen verarbeiten
        const roiTransactions = transactions.filter(tx => tx.is_roi && !tx.is_spam);

        for (const tx of roiTransactions) {
            try {
                this.addROIIncome(
                    tx.token_address,
                    tx.amount,
                    tx.amount_eur,
                    tx.timestamp,
                    tx.tx_hash,
                    'staking',
                    { symbol: tx.token_symbol, name: tx.token_name }
                );
                importedCount++;
            } catch (error) {
                console.warn(`⚠️ Fehler beim Import von ROI ${tx.tx_hash}:`, error);
            }
        }

        console.log(`✅ ${importedCount}/${transactions.length} Transaktionen erfolgreich importiert`);
        
        return importedCount;
    }

    /**
     * Statistiken
     */
    getStatistics() {
        return {
            totalTokenTypes: this.fifoQueues.size,
            totalPurchases: Array.from(this.fifoQueues.values()).reduce((sum, queue) => sum + queue.length, 0),
            activePurchases: Array.from(this.fifoQueues.values()).reduce((sum, queue) => 
                sum + queue.filter(p => !p.isFullySold).length, 0
            ),
            currentYearCalculations: this.currentYearCalculations,
            memoryUsage: `${this.fifoQueues.size} Token-Queues`
        };
    }
}

module.exports = GermanTaxFIFOCalculator; 