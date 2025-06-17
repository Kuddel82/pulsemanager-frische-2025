/**
 * TaxReportAPI.js
 * 
 * Vollständige API-Integration für PulseManager Enhanced Tax System
 * Kombiniert: MoralisAPIService + GermanTaxFIFOCalculator + GermanTaxReportGenerator
 * 
 * @author PulseManager Tax Team
 * @version 1.0.0
 * @since 2024-06-14
 */

const MoralisAPIService = require('./MoralisAPIService');
const GermanTaxFIFOCalculator = require('./GermanTaxFIFOCalculator');
const GermanTaxReportGenerator = require('./GermanTaxReportGenerator');
const TaxDatabaseSchemas = require('./TaxDatabaseSchemas');

class TaxReportAPI {
    constructor(options = {}) {
        // Service-Instanzen
        this.moralisService = new MoralisAPIService({
            apiKey: options.moralisApiKey || process.env.MORALIS_API_KEY,
            rateLimitDelay: options.rateLimitDelay || 200,
            maxRetries: options.maxRetries || 3
        });

        this.fifoCalculator = new GermanTaxFIFOCalculator({
            taxYear: options.taxYear || new Date().getFullYear()
        });

        this.reportGenerator = new GermanTaxReportGenerator({
            outputDirectory: options.outputDirectory || './tax-reports',
            taxYear: options.taxYear || new Date().getFullYear()
        });

        // Database Connection (optional)
        this.database = options.database || null;
        
        // Processing Statistics
        this.stats = {
            totalProcessed: 0,
            successfulReports: 0,
            failedReports: 0,
            totalTransactions: 0,
            totalWallets: 0,
            startTime: new Date()
        };

        // Cache für wiederholte Anfragen
        this.cache = new Map();
        this.cacheExpiry = 60 * 60 * 1000; // 1 Stunde

        console.log('🎯 PulseManager Tax Report API initialisiert');
    }

    /**
     * Vollständigen Steuerreport für User generieren
     */
    async generateTaxReport(userInfo, options = {}) {
        const startTime = Date.now();
        console.log(`🚀 Starte Tax Report Generation für User: ${userInfo.email}`);

        try {
            this.stats.totalProcessed++;

            // 1. Wallet-Adressen validieren
            const walletAddresses = this.validateWalletAddresses(userInfo.walletAddresses);
            if (walletAddresses.length === 0) {
                throw new Error('Keine gültigen Wallet-Adressen gefunden');
            }

            // 2. Alle Transaktionen von allen Wallets laden
            console.log(`📡 Lade Transaktionen von ${walletAddresses.length} Wallets...`);
            const allTransactions = await this.loadAllWalletTransactions(walletAddresses, options);

            // 3. Transaktionen klassifizieren und verarbeiten
            console.log(`🔍 Klassifiziere ${allTransactions.length} Transaktionen...`);
            const processedTransactions = await this.classifyTransactions(allTransactions);

            // 4. FIFO-Berechnung durchführen
            console.log(`🧮 Führe FIFO-Berechnung durch...`);
            const fifoResults = await this.performFIFOCalculation(processedTransactions);

            // 5. Steuerreport generieren
            console.log(`📊 Generiere Steuerreport-Dateien...`);
            const reportFiles = await this.generateReportFiles(fifoResults, userInfo, options);

            // 6. Statistiken aktualisieren
            this.updateStatistics(allTransactions, walletAddresses, true);

            const duration = Date.now() - startTime;
            console.log(`✅ Tax Report erfolgreich generiert in ${duration}ms`);

            return {
                success: true,
                reportId: reportFiles.reportId,
                files: reportFiles.files,
                statistics: {
                    totalTransactions: allTransactions.length,
                    roiTransactions: processedTransactions.filter(tx => tx.isROI).length,
                    tradeTransactions: processedTransactions.filter(tx => !tx.isROI && !tx.isSpam).length,
                    spamTransactions: processedTransactions.filter(tx => tx.isSpam).length,
                    totalWallets: walletAddresses.length,
                    processingTime: duration
                },
                taxSummary: {
                    totalTaxableIncome: fifoResults.germanTaxCalculation?.totalTaxableIncomeEUR || 0,
                    roiIncome: fifoResults.germanTaxCalculation?.roiIncomeEUR || 0,
                    speculativeGains: fifoResults.germanTaxCalculation?.speculativeGainsEUR || 0,
                    estimatedTax: fifoResults.germanTaxCalculation?.estimatedTaxEUR || 0
                }
            };

        } catch (error) {
            this.stats.failedReports++;
            console.error('❌ Tax Report Generation fehlgeschlagen:', error);
            
            return {
                success: false,
                error: error.message,
                details: error.stack
            };
        }
    }

    /**
     * Alle Wallet-Transaktionen laden
     */
    async loadAllWalletTransactions(walletAddresses, options = {}) {
        const allTransactions = [];
        const chain = options.chain || 'eth';
        const maxPages = options.maxPages || 50;

        for (const walletAddress of walletAddresses) {
            try {
                // Standard-Transaktionen laden
                const transactions = await this.moralisService.getAllWalletTransactions(
                    walletAddress, 
                    chain, 
                    { maxPages, batchSize: 100 }
                );

                // DEX-Transaktionen laden
                const dexTransactions = await this.moralisService.getWalletDEXTransactions(
                    walletAddress, 
                    chain
                );

                // Transaktionen kombinieren
                const combinedTransactions = [...transactions, ...dexTransactions];
                
                // Wallet-Adresse zu jeder Transaktion hinzufügen
                for (const tx of combinedTransactions) {
                    tx.sourceWallet = walletAddress;
                    tx.chain = chain;
                }

                allTransactions.push(...combinedTransactions);
                
                console.log(`📈 ${combinedTransactions.length} Transaktionen von ${walletAddress} geladen`);

            } catch (error) {
                console.warn(`⚠️ Fehler beim Laden von Wallet ${walletAddress}:`, error.message);
            }
        }

        // Duplikate entfernen und nach Zeitstempel sortieren
        const uniqueTransactions = this.removeDuplicateTransactions(allTransactions);
        uniqueTransactions.sort((a, b) => new Date(a.block_timestamp) - new Date(b.block_timestamp));

        console.log(`📊 Insgesamt ${uniqueTransactions.length} einzigartige Transaktionen geladen`);
        return uniqueTransactions;
    }

    /**
     * Transaktionen klassifizieren (ROI, Spam, Handel)
     */
    async classifyTransactions(transactions) {
        const processedTransactions = [];

        for (const tx of transactions) {
            try {
                // ROI-Erkennung
                const roiAnalysis = this.moralisService.isROITransaction(tx);
                
                // Spam-Erkennung
                const isSpam = this.moralisService.isSpamToken(tx);

                // Historischen Preis ermitteln
                let priceUSD = tx.usd_price || 0;
                if (priceUSD === 0 && tx.token_address) {
                    priceUSD = await this.moralisService.getHistoricalPrice(
                        tx.token_address,
                        tx.block_timestamp,
                        tx.chain || 'eth'
                    );
                }

                // EUR-Preis berechnen (vereinfacht: USD * 0.85)
                const priceEUR = priceUSD * 0.85;
                const amountEUR = (parseFloat(tx.value) || 0) * priceEUR;

                // Transaktion klassifizieren
                const processedTx = {
                    // Original-Daten
                    ...tx,
                    
                    // Klassifizierung
                    isROI: roiAnalysis.isROI,
                    roiConfidence: roiAnalysis.confidence,
                    roiCategory: roiAnalysis.category,
                    roiReason: roiAnalysis.reason,
                    isSpam: isSpam,
                    
                    // Preis-Daten
                    priceUSD: priceUSD,
                    priceEUR: priceEUR,
                    amountEUR: amountEUR,
                    
                    // Steuer-Klassifizierung
                    taxCategory: this.determineTaxCategory(roiAnalysis, isSpam),
                    taxParagraph: roiAnalysis.isROI ? '§22 EStG' : '§23 EStG',
                    isTaxRelevant: !isSpam && (roiAnalysis.isROI || this.isTradingTransaction(tx)),
                    
                    // Meta-Daten
                    processedAt: new Date(),
                    sourceAPI: 'moralis'
                };

                processedTransactions.push(processedTx);

            } catch (error) {
                console.warn(`⚠️ Fehler bei Transaktions-Klassifizierung:`, error.message);
                
                // Fallback: Basis-Transaktion ohne Klassifizierung
                processedTransactions.push({
                    ...tx,
                    isROI: false,
                    isSpam: false,
                    isTaxRelevant: false,
                    error: error.message
                });
            }
        }

        console.log(`🔍 ${processedTransactions.length} Transaktionen klassifiziert`);
        return processedTransactions;
    }

    /**
     * FIFO-Berechnung durchführen
     */
    async performFIFOCalculation(transactions) {
        console.log('🧮 Starte FIFO-Berechnung...');

        // FIFO-Calculator zurücksetzen
        this.fifoCalculator.clearAllQueues();

        // Transaktionen chronologisch sortieren
        const sortedTransactions = transactions.sort((a, b) => 
            new Date(a.block_timestamp) - new Date(b.block_timestamp)
        );

        // Transaktionen in FIFO-Calculator importieren
        const importedCount = this.fifoCalculator.importTransactions(
            sortedTransactions.map(tx => ({
                tx_hash: tx.transaction_hash,
                timestamp: tx.block_timestamp,
                token_address: tx.token_address,
                token_symbol: tx.token_symbol,
                token_name: tx.token_name,
                amount: tx.value,
                amount_eur: tx.amountEUR,
                tx_type: this.determineTxType(tx),
                is_roi: tx.isROI,
                is_spam: tx.isSpam,
                is_tax_relevant: tx.isTaxRelevant
            }))
        );

        console.log(`📊 ${importedCount} Transaktionen in FIFO-Calculator importiert`);

        // Jahresbericht generieren
        const yearlyReport = this.fifoCalculator.generateYearlyReport(
            new Date().getFullYear(),
            { includeDetails: true }
        );

        return yearlyReport;
    }

    /**
     * Report-Dateien generieren
     */
    async generateReportFiles(fifoResults, userInfo, options = {}) {
        const reportOptions = {
            generatePDF: options.generatePDF !== false,
            generateCSV: options.generateCSV !== false,
            generateELSTER: options.generateELSTER || false,
            includeTransactionDetails: options.includeDetails !== false
        };

        const reportFiles = await this.reportGenerator.generateFullReport(
            fifoResults,
            userInfo,
            reportOptions
        );

        return reportFiles;
    }

    /**
     * Spezielle WGEP-Wallet-Analyse
     */
    async analyzeWGEPWallet(walletAddress = '0x308e77', options = {}) {
        console.log(`🎯 Spezielle WGEP-Analyse für Wallet: ${walletAddress}`);

        try {
            // Wallet-Transaktionen laden
            const transactions = await this.moralisService.getAllWalletTransactions(
                walletAddress,
                'eth',
                { maxPages: 20 }
            );

            // Nach WGEP-Token filtern
            const wgepTransactions = transactions.filter(tx => 
                (tx.token_symbol || '').toUpperCase().includes('WGEP')
            );

            // WGEP-spezifische Analyse
            const wgepAnalysis = {
                totalWGEPTransactions: wgepTransactions.length,
                totalWGEPAmount: wgepTransactions.reduce((sum, tx) => 
                    sum + (parseFloat(tx.value) || 0), 0
                ),
                roiTransactions: wgepTransactions.filter(tx => 
                    this.moralisService.isROITransaction(tx).isROI
                ),
                swapTransactions: wgepTransactions.filter(tx => 
                    tx.dex_name || tx.classification === 'swap'
                ),
                timeRange: {
                    earliest: Math.min(...wgepTransactions.map(tx => 
                        new Date(tx.block_timestamp).getTime()
                    )),
                    latest: Math.max(...wgepTransactions.map(tx => 
                        new Date(tx.block_timestamp).getTime()
                    ))
                }
            };

            console.log(`🎯 WGEP-Analyse abgeschlossen: ${wgepAnalysis.totalWGEPTransactions} Transaktionen`);
            
            return {
                success: true,
                walletAddress: walletAddress,
                analysis: wgepAnalysis,
                transactions: wgepTransactions
            };

        } catch (error) {
            console.error('❌ WGEP-Analyse fehlgeschlagen:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Express.js API-Endpunkte
     */
    setupExpressRoutes(app) {
        // Hauptendpunkt für Tax Reports
        app.post('/api/tax-report', async (req, res) => {
            try {
                const { userInfo, options } = req.body;
                
                if (!userInfo || !userInfo.walletAddresses) {
                    return res.status(400).json({
                        success: false,
                        error: 'Wallet-Adressen sind erforderlich'
                    });
                }

                const result = await this.generateTaxReport(userInfo, options);
                res.json(result);

            } catch (error) {
                console.error('❌ API Error:', error);
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // WGEP-spezifische Analyse
        app.post('/api/analyze-wgep', async (req, res) => {
            try {
                const { walletAddress, options } = req.body;
                const result = await this.analyzeWGEPWallet(walletAddress, options);
                res.json(result);
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // Service-Statistiken
        app.get('/api/tax-stats', (req, res) => {
            res.json({
                success: true,
                stats: this.getServiceStats()
            });
        });

        // Verfügbare Reports
        app.get('/api/tax-reports', async (req, res) => {
            try {
                const reports = await this.reportGenerator.listReports();
                res.json({
                    success: true,
                    reports: reports
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        console.log('🔗 Tax Report API-Endpunkte registriert');
    }

    /**
     * Utility-Funktionen
     */
    validateWalletAddresses(addresses) {
        if (!Array.isArray(addresses)) {
            addresses = [addresses];
        }

        return addresses.filter(addr => 
            addr && typeof addr === 'string' && addr.match(/^0x[a-fA-F0-9]{40}$/)
        );
    }

    removeDuplicateTransactions(transactions) {
        const seen = new Set();
        return transactions.filter(tx => {
            const key = `${tx.transaction_hash}_${tx.token_address}_${tx.value}`;
            if (seen.has(key)) {
                return false;
            }
            seen.add(key);
            return true;
        });
    }

    determineTaxCategory(roiAnalysis, isSpam) {
        if (isSpam) return 'spam';
        if (roiAnalysis.isROI) return 'paragraph_22';
        return 'paragraph_23';
    }

    determineTxType(tx) {
        if (tx.isROI) return 'roi';
        if (tx.isSpam) return 'spam';
        if (tx.dex_name) return 'swap';
        if (tx.to_address === tx.sourceWallet) return 'buy';
        if (tx.from_address === tx.sourceWallet) return 'sell';
        return 'transfer';
    }

    isTradingTransaction(tx) {
        return tx.dex_name || tx.classification === 'swap' || 
               (tx.to_address && tx.from_address);
    }

    updateStatistics(transactions, wallets, success) {
        this.stats.totalTransactions += transactions.length;
        this.stats.totalWallets += wallets.length;
        
        if (success) {
            this.stats.successfulReports++;
        } else {
            this.stats.failedReports++;
        }
    }

    getServiceStats() {
        return {
            ...this.stats,
            uptime: Date.now() - this.stats.startTime,
            moralisStats: this.moralisService.getStats(),
            fifoStats: this.fifoCalculator.getStatistics(),
            cacheSize: this.cache.size
        };
    }

    /**
     * Cache-Management
     */
    clearCache() {
        this.cache.clear();
        this.moralisService.clearCache();
        console.log('🗑️ Tax Report API Cache geleert');
    }

    /**
     * Graceful Shutdown
     */
    async shutdown() {
        console.log('🔄 Tax Report API wird heruntergefahren...');
        
        await this.moralisService.shutdown();
        await this.reportGenerator.cleanupOldReports();
        this.clearCache();
        
        console.log('✅ Tax Report API shutdown abgeschlossen');
    }
}

module.exports = TaxReportAPI; 