/**
 * 🇩🇪 GERMAN TAX SERVICE
 * 
 * Kern-Service für deutsche Krypto-Steuerberechnung
 * - FIFO-Methode nach deutschem Steuerrecht
 * - §22 & §23 EStG konforme Berechnung
 * - Moralis Web3 API Integration
 * - Optimiert für Performance
 */

import Moralis from 'moralis';
import PriceService from './PriceService.js';
import ExportService from './ExportService.js';

export default class GermanTaxService {
    constructor(options = {}) {
        this.moralisApiKey = options.moralisApiKey;
        this.testMode = options.testMode || false;
        this.initialized = false;
        
        // 💰 Price Service initialisieren
        this.priceService = new PriceService({
            coinGeckoApiKey: options.coinGeckoApiKey,
            cmcApiKey: options.cmcApiKey,
            testMode: this.testMode
        });
        
        // 📄 Export Service initialisieren
        this.exportService = new ExportService({
            testMode: this.testMode,
            outputDir: options.outputDir || './exports'
        });
        
        // 🇩🇪 Deutsche Steuer-Konstanten
        this.TAX_CONSTANTS = {
            SPECULATION_EXEMPTION: 600, // §23 EStG Freigrenze
            LONG_TERM_MONTHS: 12, // 1 Jahr Haltedauer
            INCOME_TAX_RATE: 0.42, // Spitzensteuersatz
            SOLIDARITY_TAX: 0.055 // Solidaritätszuschlag
        };
        
        // ⛓️ Unterstützte Chains
        this.SUPPORTED_CHAINS = {
            '0x1': 'Ethereum',
            '0x89': 'Polygon', 
            '0x38': 'BSC',
            '0xa': 'Optimism',
            '0xa4b1': 'Arbitrum'
        };
    }

    /**
     * 🚀 HAUPT-STEUERBERECHNUNG
     */
    async calculateTaxes(walletAddress, config) {
        try {
            // Moralis initialisieren
            await this.initializeMoralis();
            
            console.log(`📊 Lade Transaktionen für ${walletAddress}...`);
            
            // 1️⃣ Alle Transaktionen laden
            const rawTransactions = await this.fetchAllTransactions(walletAddress, config);
            
            // 2️⃣ Transaktionen normalisieren und sortieren
            const normalizedTxs = await this.normalizeTransactions(rawTransactions, config);
            
            // 3️⃣ FIFO-Berechnung durchführen
            const fifoResults = this.calculateFIFO(normalizedTxs);
            
            // 4️⃣ Deutsche Steuer berechnen
            const taxCalculation = this.calculateGermanTax(fifoResults, config.taxYear);
            
            // 5️⃣ Report zusammenstellen
            return this.buildTaxReport({
                transactions: normalizedTxs,
                fifoResults,
                taxCalculation,
                config
            });
            
        } catch (error) {
            console.error('🚨 Fehler bei Steuerberechnung:', error);
            throw this.handleError(error);
        }
    }

    /**
     * 🔌 MORALIS INITIALISIERUNG
     */
    async initializeMoralis() {
        if (this.initialized) return;
        
        try {
            await Moralis.start({
                apiKey: this.moralisApiKey
            });
            this.initialized = true;
            console.log('✅ Moralis initialisiert');
        } catch (error) {
            throw {
                code: 'MORALIS_INIT_ERROR',
                message: 'Moralis konnte nicht initialisiert werden',
                original: error
            };
        }
    }

    /**
     * 📥 ALLE TRANSAKTIONEN LADEN
     */
    async fetchAllTransactions(walletAddress, config) {
        const allTransactions = [];
        
        for (const chainId of config.chains) {
            try {
                console.log(`⛓️ Lade ${this.SUPPORTED_CHAINS[chainId]} Transaktionen...`);
                
                // ERC20 Transfers
                const erc20Transfers = await this.fetchERC20Transfers(walletAddress, chainId, config.taxYear);
                
                // Native Token Transfers
                const nativeTransfers = await this.fetchNativeTransfers(walletAddress, chainId, config.taxYear);
                
                // DeFi Transactions (wenn aktiviert)
                let defiTxs = [];
                if (config.includeDeFi) {
                    defiTxs = await this.fetchDeFiTransactions(walletAddress, chainId, config.taxYear);
                }
                
                // NFT Transfers (wenn aktiviert)
                let nftTxs = [];
                if (config.includeNFTs) {
                    nftTxs = await this.fetchNFTTransfers(walletAddress, chainId, config.taxYear);
                }
                
                allTransactions.push(...erc20Transfers, ...nativeTransfers, ...defiTxs, ...nftTxs);
                
            } catch (error) {
                console.warn(`⚠️ Fehler beim Laden von ${this.SUPPORTED_CHAINS[chainId]}:`, error.message);
                // Weiter mit anderen Chains
            }
        }
        
        console.log(`📊 ${allTransactions.length} Transaktionen geladen`);
        return allTransactions;
    }

    /**
     * 🪙 ERC20 TRANSFERS LADEN
     */
    async fetchERC20Transfers(address, chain, taxYear) {
        try {
            const fromDate = new Date(taxYear, 0, 1);
            const toDate = new Date(taxYear, 11, 31);
            
            const response = await Moralis.EvmApi.token.getWalletTokenTransfers({
                address,
                chain,
                fromDate: fromDate.toISOString(),
                toDate: toDate.toISOString(),
                limit: 100
            });
            
            return response.result.map(tx => ({
                hash: tx.transactionHash,
                blockTimestamp: tx.blockTimestamp,
                from: tx.fromAddress,
                to: tx.toAddress,
                value: tx.value,
                tokenAddress: tx.address,
                tokenSymbol: tx.tokenSymbol,
                tokenName: tx.tokenName,
                tokenDecimals: tx.tokenDecimals,
                gasPrice: tx.gasPrice,
                gasUsed: tx.gasUsed,
                chain,
                type: 'erc20_transfer'
            }));
        } catch (error) {
            console.error('ERC20 Transfer Error:', error);
            return [];
        }
    }

    /**
     * ⚡ NATIVE TRANSFERS LADEN
     */
    async fetchNativeTransfers(address, chain, taxYear) {
        try {
            const fromDate = new Date(taxYear, 0, 1);
            const toDate = new Date(taxYear, 11, 31);
            
            const response = await Moralis.EvmApi.transaction.getWalletTransactions({
                address,
                chain,
                fromDate: fromDate.toISOString(),
                toDate: toDate.toISOString(),
                limit: 100
            });
            
            return response.result
                .filter(tx => tx.value !== '0')
                .map(tx => ({
                    hash: tx.hash,
                    blockTimestamp: tx.blockTimestamp,
                    from: tx.fromAddress,
                    to: tx.toAddress,
                    value: tx.value,
                    tokenSymbol: this.getNativeTokenSymbol(chain),
                    tokenName: this.getNativeTokenName(chain),
                    tokenDecimals: 18,
                    gasPrice: tx.gasPrice,
                    gasUsed: tx.gasUsed,
                    chain,
                    type: 'native_transfer'
                }));
        } catch (error) {
            console.error('Native Transfer Error:', error);
            return [];
        }
    }

    /**
     * 🏦 DEFI TRANSAKTIONEN LADEN
     */
    async fetchDeFiTransactions(address, chain, taxYear) {
        // Vereinfachte DeFi-Erkennung - kann erweitert werden
        try {
            // Uniswap, SushiSwap, etc. Interaktionen
            const defiContracts = this.getDeFiContracts(chain);
            const defiTxs = [];
            
            // Hier würde man spezifische DeFi-Protokoll Calls machen
            // Für jetzt: Placeholder
            
            return defiTxs;
        } catch (error) {
            console.error('DeFi Transactions Error:', error);
            return [];
        }
    }

    /**
     * 🖼️ NFT TRANSFERS LADEN
     */
    async fetchNFTTransfers(address, chain, taxYear) {
        try {
            const fromDate = new Date(taxYear, 0, 1);
            const toDate = new Date(taxYear, 11, 31);
            
            const response = await Moralis.EvmApi.nft.getWalletNFTTransfers({
                address,
                chain,
                fromDate: fromDate.toISOString(),
                toDate: toDate.toISOString(),
                limit: 100
            });
            
            return response.result.map(tx => ({
                hash: tx.transactionHash,
                blockTimestamp: tx.blockTimestamp,
                from: tx.fromAddress,
                to: tx.toAddress,
                tokenId: tx.tokenId,
                tokenAddress: tx.address,
                tokenSymbol: tx.tokenSymbol || 'NFT',
                tokenName: tx.tokenName,
                chain,
                type: 'nft_transfer'
            }));
        } catch (error) {
            console.error('NFT Transfer Error:', error);
            return [];
        }
    }

    /**
     * 🔄 TRANSAKTIONEN NORMALISIEREN
     */
    async normalizeTransactions(rawTransactions, config) {
        console.log('🔄 Normalisiere Transaktionen...');
        
        const normalized = [];
        const walletAddress = config.walletAddress?.toLowerCase();
        
        for (const tx of rawTransactions) {
            try {
                const isIncoming = tx.to?.toLowerCase() === walletAddress;
                const isOutgoing = tx.from?.toLowerCase() === walletAddress;
                
                // Preise für Steuerjahr laden
                const price = await this.priceService.getHistoricalPrice(
                    tx.tokenSymbol || 'ETH',
                    tx.blockTimestamp,
                    'eur'
                );
                
                const normalizedTx = {
                    hash: tx.hash,
                    timestamp: new Date(tx.blockTimestamp),
                    type: isIncoming ? 'buy' : 'sell',
                    tokenSymbol: tx.tokenSymbol,
                    tokenAddress: tx.tokenAddress,
                    amount: this.formatAmount(tx.value, tx.tokenDecimals),
                    priceEUR: price,
                    valueEUR: this.formatAmount(tx.value, tx.tokenDecimals) * price,
                    gasFeesEUR: this.calculateGasFees(tx, price),
                    chain: tx.chain,
                    category: this.categorizeTransaction(tx)
                };
                
                normalized.push(normalizedTx);
                
            } catch (error) {
                console.warn('⚠️ Fehler beim Normalisieren von TX:', tx.hash, error.message);
            }
        }
        
        // Nach Timestamp sortieren
        return normalized.sort((a, b) => a.timestamp - b.timestamp);
    }

    /**
     * 📊 FIFO-BERECHNUNG
     */
    calculateFIFO(transactions) {
        console.log('💰 FIFO-Berechnung gestartet...');
        
        const holdings = {}; // Token => [{ amount, price, timestamp }]
        const fifoResults = [];
        
        for (const tx of transactions) {
            const token = tx.tokenSymbol;
            
            if (!holdings[token]) {
                holdings[token] = [];
            }
            
            if (tx.type === 'buy') {
                // Kauftransaktion - zu Holdings hinzufügen
                holdings[token].push({
                    amount: tx.amount,
                    priceEUR: tx.priceEUR,
                    timestamp: tx.timestamp,
                    txHash: tx.hash
                });
                
            } else if (tx.type === 'sell') {
                // Verkaufstransaktion - FIFO abarbeiten
                let remainingToSell = tx.amount;
                let totalCost = 0;
                let totalProceeds = tx.valueEUR;
                
                while (remainingToSell > 0 && holdings[token].length > 0) {
                    const oldestHolding = holdings[token][0];
                    
                    if (oldestHolding.amount <= remainingToSell) {
                        // Gesamte Position verkaufen
                        totalCost += oldestHolding.amount * oldestHolding.priceEUR;
                        remainingToSell -= oldestHolding.amount;
                        holdings[token].shift();
                    } else {
                        // Teilverkauf
                        totalCost += remainingToSell * oldestHolding.priceEUR;
                        oldestHolding.amount -= remainingToSell;
                        remainingToSell = 0;
                    }
                }
                
                const gain = totalProceeds - totalCost - tx.gasFeesEUR;
                const holdingPeriod = this.calculateHoldingPeriod(
                    holdings[token][0]?.timestamp || tx.timestamp,
                    tx.timestamp
                );
                
                fifoResults.push({
                    txHash: tx.hash,
                    timestamp: tx.timestamp,
                    token,
                    amount: tx.amount,
                    proceeds: totalProceeds,
                    cost: totalCost,
                    gasFees: tx.gasFeesEUR,
                    gain,
                    holdingPeriod,
                    category: holdingPeriod >= 12 ? 'long_term' : 'short_term'
                });
            }
        }
        
        console.log(`✅ FIFO-Berechnung abgeschlossen: ${fifoResults.length} Verkäufe`);
        return fifoResults;
    }

    /**
     * 🇩🇪 DEUTSCHE STEUER BERECHNUNG
     */
    calculateGermanTax(fifoResults, taxYear) {
        console.log('🇩🇪 Deutsche Steuerberechnung...');
        
        let paragraph22Gains = 0; // Langfristige Gewinne
        let paragraph23Gains = 0; // Spekulative Gewinne
        
        for (const result of fifoResults) {
            if (result.gain > 0) {
                if (result.holdingPeriod >= 12) {
                    // §22 Nr. 2 EStG - Langfristige Veräußerungsgeschäfte (steuerfrei!)
                    // paragraph22Gains += result.gain; // Eigentlich steuerfrei in Deutschland
                } else {
                    // §23 EStG - Spekulationsgeschäfte
                    paragraph23Gains += result.gain;
                }
            }
        }
        
        // §23 EStG: Freigrenze von 600€
        const paragraph23Tax = paragraph23Gains > this.TAX_CONSTANTS.SPECULATION_EXEMPTION 
            ? paragraph23Gains * this.TAX_CONSTANTS.INCOME_TAX_RATE
            : 0;
        
        const paragraph22Tax = 0; // Langfristige Gewinne sind in Deutschland steuerfrei
        
        return {
            paragraph22Gains,
            paragraph22Tax,
            paragraph23Gains,
            paragraph23Tax,
            totalTaxableGains: paragraph23Gains,
            totalTaxAmount: paragraph23Tax,
            exemptionUsed: Math.min(paragraph23Gains, this.TAX_CONSTANTS.SPECULATION_EXEMPTION)
        };
    }

    /**
     * 📋 TAX REPORT ERSTELLEN
     */
    buildTaxReport({ transactions, fifoResults, taxCalculation, config }) {
        console.log('📋 Erstelle Steuer-Report...');
        
        const tokenBreakdown = this.calculateTokenBreakdown(fifoResults);
        const totalGasFees = transactions.reduce((sum, tx) => sum + tx.gasFeesEUR, 0);
        
        return {
            timestamp: new Date().toISOString(),
            taxYear: config.taxYear,
            walletAddress: config.walletAddress,
            
            // Kern-Steuer-Daten
            ...taxCalculation,
            
            // Transaction Summary
            transactions,
            fifoResults,
            totalVolume: transactions.reduce((sum, tx) => sum + tx.valueEUR, 0),
            totalGasFees,
            
            // Kategorisierung
            shortTermTrades: fifoResults.filter(r => r.holdingPeriod < 12).length,
            longTermTrades: fifoResults.filter(r => r.holdingPeriod >= 12).length,
            
            // Token-Aufschlüsselung
            tokenBreakdown
        };
    }

    /**
     * 🔧 HILFSFUNKTIONEN
     */
    
    formatAmount(value, decimals) {
        return parseFloat(value) / Math.pow(10, decimals || 18);
    }
    
    calculateHoldingPeriod(buyDate, sellDate) {
        const diffTime = Math.abs(sellDate - buyDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return Math.floor(diffDays / 30); // Monate
    }
    
    calculateGasFees(tx, ethPrice) {
        if (!tx.gasPrice || !tx.gasUsed) return 0;
        const gasEth = (parseFloat(tx.gasPrice) * parseFloat(tx.gasUsed)) / Math.pow(10, 18);
        return gasEth * ethPrice;
    }
    
    categorizeTransaction(tx) {
        if (tx.type === 'nft_transfer') return 'NFT';
        if (tx.tokenSymbol === 'ETH' || tx.tokenSymbol === 'MATIC') return 'Native';
        return 'ERC20';
    }
    
    getNativeTokenSymbol(chain) {
        const symbols = {
            '0x1': 'ETH',
            '0x89': 'MATIC',
            '0x38': 'BNB',
            '0xa': 'ETH',
            '0xa4b1': 'ETH'
        };
        return symbols[chain] || 'ETH';
    }
    
    getNativeTokenName(chain) {
        const names = {
            '0x1': 'Ethereum',
            '0x89': 'Polygon',
            '0x38': 'Binance Coin',
            '0xa': 'Ethereum',
            '0xa4b1': 'Ethereum'
        };
        return names[chain] || 'Ethereum';
    }
    
    calculateTokenBreakdown(fifoResults) {
        const breakdown = {};
        
        for (const result of fifoResults) {
            if (!breakdown[result.token]) {
                breakdown[result.token] = {
                    totalGains: 0,
                    totalTax: 0,
                    transactions: 0
                };
            }
            
            breakdown[result.token].totalGains += result.gain;
            breakdown[result.token].transactions++;
        }
        
        return breakdown;
    }
    
    async getHistoricalPrice(symbol, timestamp) {
        // Diese Funktion ist jetzt deprecated - verwende priceService direkt
        return await this.priceService.getHistoricalPrice(symbol, timestamp, 'eur');
    }
    
    getDeFiContracts(chain) {
        // Bekannte DeFi-Protokoll-Adressen
        const contracts = {
            '0x1': [
                '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', // Uniswap V2
                '0xE592427A0AEce92De3Edee1F18E0157C05861564', // Uniswap V3
                '0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F'  // SushiSwap
            ]
        };
        
        return contracts[chain] || [];
    }
    
    handleError(error) {
        if (error.code) return error;
        
        if (error.message?.includes('API key')) {
            return {
                code: 'MORALIS_API_ERROR',
                message: 'Ungültiger API-Key'
            };
        }
        
        if (error.message?.includes('rate limit')) {
            return {
                code: 'RATE_LIMIT_ERROR',
                message: 'API-Rate-Limit erreicht'
            };
        }
        
        return {
            code: 'UNKNOWN_ERROR',
            message: error.message || 'Unbekannter Fehler'
        };
    }

    // 🎯 KOMPATIBILITÄTS-METHODEN für Frontend
    static async generateGermanTaxReport(walletAddress, options = {}) {
        const service = new GermanTaxService({
            moralisApiKey: process.env.MORALIS_API_KEY || process.env.VITE_MORALIS_API_KEY
        });
        
        const config = {
            walletAddress,
            chains: options.chainIds || ['0x1'],
            taxYear: 2025,
            includeDeFi: true,
            includeNFTs: false
        };
        
        const report = await service.calculateTaxes(walletAddress, config);
        
        // Frontend-kompatible Struktur
        return {
            transactions: report.transactions || [],
            germanSummary: {
                paragraph22: {
                    total: report.paragraph22Gains || 0,
                    roiIncome: report.paragraph22Gains || 0,
                    note: '§22 EStG - Langfristige Gewinne (steuerfrei)'
                },
                paragraph23: {
                    taxableGains: report.paragraph23Gains || 0,
                    taxFreeGains: 0,
                    freigrenze600: {
                        exceeded: report.paragraph23Gains > 600,
                        amount: report.paragraph23Gains || 0
                    },
                    note: '§23 EStG - Spekulative Gewinne'
                },
                totalTransactions: report.transactions?.length || 0,
                taxableTransactions: report.fifoResults?.length || 0
            },
            fifoResults: report.fifoResults || [],
            taxTable: this.formatForPDF(report.transactions || []),
            summary: {
                roiIncome: report.paragraph22Gains || 0,
                speculativeTransactions: {
                    withinSpeculationPeriod: {
                        amount: report.paragraph23Gains || 0,
                        count: report.shortTermTrades || 0
                    },
                    afterSpeculationPeriod: {
                        amount: report.paragraph22Gains || 0,
                        count: report.longTermTrades || 0
                    }
                }
            },
            metadata: {
                walletAddress,
                generated: new Date().toISOString(),
                totalTransactions: report.transactions?.length || 0,
                germanTaxLaw: 'EStG §22 & §23',
                system: 'GermanTaxService v2.0'
            }
        };
    }
    
    static async generateWGEPTestReport(walletAddress) {
        return await this.generateGermanTaxReport(walletAddress, {
            chainIds: ['0x1']
        });
    }
    
    static async generatePDFManually(taxReport, options = {}) {
        console.log('📄 PDF-Generierung wird vorbereitet...');
        return {
            success: true,
            message: 'PDF-Generierung vorbereitet',
            fileName: `steuerreport_${new Date().toISOString().split('T')[0]}.pdf`
        };
    }
    
    static formatForPDF(transactions) {
        return transactions
            .slice(0, 100) // Limitiere für PDF
            .map(tx => ({
                datum: tx.timestamp?.toLocaleDateString('de-DE') || 'N/A',
                coin: tx.tokenSymbol || 'ETH',
                menge: tx.amount?.toFixed(6) || '0',
                preis: `€${(tx.priceEUR || 0).toFixed(2)}`,
                art: tx.type === 'buy' ? 'Kauf' : 'Verkauf',
                steuerpflichtig: tx.type === 'sell' ? 'Ja' : 'Nein',
                bemerkung: `${tx.category || 'Standard'} - Chain: ${tx.chain || 'ETH'}`
            }));
    }

    /**
     * 📄 EXPORT-METHODEN
     */
    
    async exportToPDF(taxReport, options = {}) {
        return await this.exportService.generatePDFReport(taxReport, options);
    }
    
    async exportToCSV(taxReport, options = {}) {
        return await this.exportService.generateCSVReport(taxReport, options);
    }
    
    async exportToElsterXML(taxReport, taxpayerData, options = {}) {
        return await this.exportService.generateElsterXML(taxReport, taxpayerData, options);
    }
    
    async exportAll(taxReport, taxpayerData, options = {}) {
        const results = {
            pdf: await this.exportToPDF(taxReport, options),
            csv: await this.exportToCSV(taxReport, options),
            xml: await this.exportToElsterXML(taxReport, taxpayerData, options)
        };
        
        console.log('✅ Alle Export-Formate erstellt');
        return results;
    }

} 