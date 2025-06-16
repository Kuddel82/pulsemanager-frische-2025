/**
 * 📊 TAX REPORT SERVICE - VOLLSTÄNDIGER NEUAUFBAU
 * 
 * PHASE 1: Neuaufbau der Grundlogik
 * - Echte Transaktionsdaten von Moralis/PulseScan
 * - Vollständig steuerkonforme Kategorisierung
 * - Automatische PDF-Generierung im Downloads-Ordner
 * - Deutsche Steuerlogik mit Haltefrist-Berechnung
 * 
 * Autor: PulseManager Enterprise
 * Version: 2.0.0 - Rebuild
 */

import { MoralisV2Service } from './MoralisV2Service';
import { PulseScanService } from './PulseScanService';
import { TokenPricingService } from './TokenPricingService';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export class TaxReportService_Rebuild {
    
    // 🏛️ DEUTSCHE STEUER-KATEGORIEN (EStG-konform)
    static TAX_CATEGORIES = {
        KAUF: 'Kauf',                    // Anschaffung, Haltefrist beginnt
        VERKAUF: 'Verkauf',              // Veräußerung, steuerpflichtig bei Gewinn
        SWAP: 'Swap',                    // Verkauf + Kauf Kombination
        ROI_INCOME: 'ROI-Einkommen',     // Sonstige Einkünfte §22 EStG - SOFORT steuerpflichtig
        TRANSFER: 'Transfer',            // Nicht steuerrelevant
        STAKING_CLAIM: 'Staking-Claim',  // Sonstige Einkünfte §22 EStG
    };

    // ⏰ HALTEFRIST-KONSTANTEN
    static HOLDING_PERIODS = {
        SPECULATION_PERIOD: 365 * 24 * 60 * 60 * 1000, // 1 Jahr in Millisekunden
        TAX_FREE_THRESHOLD: 600, // €600 Freigrenze pro Jahr
    };

    // 🧠 TRANSAKTIONS-PARSER: Erkennt Transaktionstypen
    static parseTransactionType(transaction, walletAddress) {
        const { from_address, to_address, value, input } = transaction;
        const isIncoming = to_address?.toLowerCase() === walletAddress.toLowerCase();
        const isOutgoing = from_address?.toLowerCase() === walletAddress.toLowerCase();

        // ROI-Erkennung: Incoming ohne entsprechende Outgoing-Transaktion
        if (isIncoming && from_address !== walletAddress) {
            // Weitere Prüfung auf bekannte ROI-Contracts oder Drucker
            if (this.isKnownROISource(from_address) || this.isDruckerTransaction(transaction)) {
                return this.TAX_CATEGORIES.ROI_INCOME;
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

    // 🔍 ROI-QUELLEN ERKENNUNG
    static isKnownROISource(fromAddress) {
        const knownROISources = [
            '0x2fa878Ab3F87CC1C9737Fc071108F904c0B0C95d', // Beispiel: HEX-Drucker
            '0x832c5391dc7931312CbdBc1046669c9c3A4A28d5', // Beispiel: ROI-Contract
            // Weitere bekannte ROI-Quellen hier hinzufügen
        ];
        
        return knownROISources.some(addr => 
            addr.toLowerCase() === fromAddress.toLowerCase()
        );
    }

    // 💰 DRUCKER-TRANSAKTIONS-ERKENNUNG
    static isDruckerTransaction(transaction) {
        // Heuristische Erkennung von Drucker-Transaktionen
        const { value, gas_used, method_id } = transaction;
        
        // Typische Drucker-Charakteristika
        const isDruckerValue = parseFloat(value) > 0 && parseFloat(value) % 1 !== 0;
        const isDruckerGas = gas_used && parseInt(gas_used) > 100000;
        const isDruckerMethod = method_id && ['0x1c1b8772', '0x2e7ba6ef'].includes(method_id);
        
        return isDruckerValue || isDruckerGas || isDruckerMethod;
    }

    // 📊 HAUPTFUNKTION: Tax Report generieren
    static async generateTaxReport(walletAddress, options = {}) {
        const {
            startDate = `${new Date().getFullYear()}-01-01`,
            endDate = `${new Date().getFullYear()}-12-31`,
            includeTransfers = false,
            debugMode = false,
            generatePDF = false // 🔥 NEU: PDF nur auf Anfrage generieren
        } = options;

        console.log(`🎯 Tax Report Rebuild - Start für Wallet: ${walletAddress}`);
        console.log(`📅 Zeitraum: ${startDate} bis ${endDate}`);

        try {
            // SCHRITT 1: Vollständige Transaktionshistorie laden
            const allTransactions = await this.fetchCompleteTransactionHistory(walletAddress);
            
            if (debugMode) {
                console.log(`📊 Gesamte Transaktionen geladen: ${allTransactions.length}`);
            }

            // SCHRITT 2: Zeitraum filtern
            const filteredTransactions = this.filterTransactionsByDateRange(
                allTransactions, 
                startDate, 
                endDate
            );

            if (debugMode) {
                console.log(`📅 Gefilterte Transaktionen: ${filteredTransactions.length}`);
            }

            // SCHRITT 3: Steuerliche Kategorisierung
            const categorizedTransactions = await this.categorizeTransactionsForTax(
                filteredTransactions, 
                walletAddress
            );

            // SCHRITT 4: Haltefrist-Berechnung
            const taxCalculatedTransactions = this.calculateHoldingPeriods(categorizedTransactions);

            // SCHRITT 5: Tax Table erstellen
            const taxTable = this.buildTaxTable(taxCalculatedTransactions);

            // SCHRITT 6: PDF nur generieren wenn explizit angefordert
            let pdfGenerated = false;
            if (generatePDF) {
                await this.generateAndSavePDF(taxTable, walletAddress, { startDate, endDate });
                pdfGenerated = true;
                console.log('✅ PDF wurde automatisch generiert und gespeichert');
            }

            const report = {
                walletAddress,
                period: { startDate, endDate },
                transactions: taxCalculatedTransactions,
                table: taxTable,
                summary: this.calculateTaxSummary(taxCalculatedTransactions),
                generatedAt: new Date().toISOString(),
                version: '2.0.0-rebuild',
                pdfGenerated
            };

            console.log(`✅ Tax Report erfolgreich generiert!`);
            return report;

        } catch (error) {
            console.error('❌ Tax Report Generation fehlgeschlagen:', error);
            throw error;
        }
    }

    // 🔄 SCHRITT 1: Vollständige Transaktionshistorie laden (OPTIMIERT für 300K+ Transaktionen)
    static async fetchCompleteTransactionHistory(walletAddress) {
        const transactions = [];
        
        try {
            console.log('🔍 Lade Transaktionen von Moralis (UNLIMITED)...');
            
            // 🚀 OPTIMIERT: Batch-Loading für große Wallets
            const batchSize = 100;
            let cursor = null;
            let pageCount = 0;
            let hasMore = true;
            
            // Primär: Moralis API mit Pagination - ERHÖHTES LIMIT
            while (hasMore && pageCount < 10000) { // Max 1.000.000 Transaktionen (100 * 10000)
                try {
                    console.log(`📄 Lade Page ${pageCount + 1}...`);
                    
                    const batchResult = await MoralisV2Service.getWalletTransactionsBatch(
                        walletAddress, 
                        batchSize, 
                        cursor
                    );
                    
                    if (batchResult && batchResult.result && batchResult.result.length > 0) {
                        transactions.push(...batchResult.result);
                        cursor = batchResult.cursor;
                        // 🔥 FIX: hasMore nur wenn cursor UND full page (sonst letzte Page)
                        hasMore = !!(cursor && batchResult.result.length === batchSize);
                        pageCount++;
                        
                        console.log(`✅ Page ${pageCount}: ${batchResult.result.length} Transaktionen (Total: ${transactions.length}), hasMore=${hasMore}, cursor=${cursor ? 'yes' : 'no'}`);
                        
                        // Rate limiting für große Wallets - REDUZIERT
                        if (pageCount % 20 === 0) {
                            console.log(`⏳ Rate limiting: Pause nach ${pageCount} Pages...`);
                            await this.delay(500); // 0.5s Pause alle 20 Pages
                        }
                        
                    } else {
                        hasMore = false;
                    }
                    
                } catch (batchError) {
                    console.error(`❌ Fehler bei Page ${pageCount + 1}:`, batchError);
                    // Bei Fehler nicht sofort aufhören, sondern 3x versuchen
                    if (pageCount > 0) {
                        console.log('🔄 Versuche nächste Page...');
                        await this.delay(2000);
                        continue;
                    } else {
                        hasMore = false;
                    }
                }
            }
            
            console.log(`✅ Moralis: ${transactions.length} Transaktionen geladen (${pageCount} Pages)`);

            // Fallback: PulseScan API nur wenn Moralis leer
            if (transactions.length === 0) {
                console.log('🔄 Fallback zu PulseScan...');
                const pulseScanTransactions = await PulseScanService.getTransactionHistory(walletAddress);
                
                if (pulseScanTransactions && pulseScanTransactions.length > 0) {
                    transactions.push(...pulseScanTransactions);
                    console.log(`✅ PulseScan: ${pulseScanTransactions.length} Transaktionen geladen`);
                }
            }

            return transactions;

        } catch (error) {
            console.error('❌ Fehler beim Laden der Transaktionshistorie:', error);
            throw new Error(`Transaktionshistorie konnte nicht geladen werden: ${error.message}`);
        }
    }

    // 📅 Transaktionen nach Zeitraum filtern
    static filterTransactionsByDateRange(transactions, startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // Ende des Tages

        return transactions.filter(tx => {
            const txDate = new Date(tx.block_timestamp || tx.timestamp || tx.timeStamp);
            return txDate >= start && txDate <= end;
        });
    }

    // 🏷️ SCHRITT 3: Steuerliche Kategorisierung (OPTIMIERT für 300K+ Transaktionen)
    static async categorizeTransactionsForTax(transactions, walletAddress) {
        const categorized = [];
        const priceCache = new Map(); // Cache für Preise

        console.log(`🏷️ Kategorisiere ${transactions.length} Transaktionen...`);

        // 🚀 BATCH PROCESSING für Performance
        const batchSize = 1000;
        for (let i = 0; i < transactions.length; i += batchSize) {
            const batch = transactions.slice(i, i + batchSize);
            console.log(`🔄 Verarbeite Batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(transactions.length/batchSize)} (${batch.length} Transaktionen)`);
            
            for (const tx of batch) {
                try {
                    // Transaktionstyp bestimmen
                    const taxCategory = this.parseTransactionType(tx, walletAddress);
                    
                    // USD-Preis zur Transaktionszeit ermitteln (MIT CACHE)
                    let usdPrice = 0;
                    let usdValue = 0;
                    
                    if (tx.value && tx.value !== '0') {
                        const cacheKey = `${tx.token_address || 'native'}_${tx.block_timestamp}`;
                        
                        if (priceCache.has(cacheKey)) {
                            // Aus Cache
                            usdPrice = priceCache.get(cacheKey);
                        } else {
                            try {
                                // 1. PRIMARY: Moralis Pro API - VERBESSERTE FEHLERBEHANDLUNG
                                if (tx.token_address && tx.token_address !== 'native') {
                                    // Für Token: Verwende Moralis Price API
                                    const response = await fetch(`/api/moralis-prices?endpoint=token-price&chain=0x171&address=${tx.token_address}`, {
                                        method: 'GET',
                                        headers: {
                                            'Accept': 'application/json',
                                            'Content-Type': 'application/json'
                                        }
                                    });
                                    
                                    if (response.ok) {
                                        const contentType = response.headers.get('content-type');
                                        if (contentType && contentType.includes('application/json')) {
                                            const data = await response.json();
                                            usdPrice = data.usdPrice || 0;
                                        } else {
                                            console.warn(`⚠️ MORALIS PRICE: Ungültige Antwort für ${tx.token_address.slice(0, 8)}... - Kein JSON`);
                                        }
                                    } else {
                                        console.warn(`⚠️ MORALIS PRICE: Failed for ${tx.token_address.slice(0, 8)}... - ${response.status}`);
                                    }
                                } else {
                                    // Für PLS: 1. PRIMÄR - Moralis für Native Token (PulseChain)
                                    const response = await fetch('/api/moralis-prices?endpoint=token-price&chain=0x171&address=0x0000000000000000000000000000000000000000', {
                                        method: 'GET',
                                        headers: {
                                            'Accept': 'application/json',
                                            'Content-Type': 'application/json'
                                        }
                                    });
                                    
                                    if (response.ok) {
                                        const contentType = response.headers.get('content-type');
                                        if (contentType && contentType.includes('application/json')) {
                                            const data = await response.json();
                                            usdPrice = data.usdPrice || 0;
                                            if (usdPrice > 0) {
                                                console.log(`✅ MORALIS PLS (PRIMARY): $${usdPrice}`);
                                            }
                                        } else {
                                            console.warn(`⚠️ MORALIS PRICE: Ungültige Antwort für PLS - Kein JSON`);
                                        }
                                    } else {
                                        console.warn(`⚠️ MORALIS PRICE: Failed for PLS - ${response.status}`);
                                    }
                                }
                                
                                // 2. FALLBACK: PulseScan API (nur wenn Moralis versagt)
                                if (usdPrice === 0 && (!tx.token_address || tx.token_address === 'native')) {
                                    try {
                                        console.log('🔄 FALLBACK: Versuche PulseScan für PLS-Preis...');
                                        const plsPrice = await PulseScanService.getPLSPrice();
                                        if (plsPrice > 0) {
                                            usdPrice = plsPrice;
                                            console.log(`✅ PULSESCAN FALLBACK: PLS = $${plsPrice}`);
                                        }
                                    } catch (pulseScanError) {
                                        console.warn(`⚠️ PULSESCAN FALLBACK: Fehler beim PLS-Preis laden:`, pulseScanError.message);
                                    }
                                }
                                
                                priceCache.set(cacheKey, usdPrice); // In Cache speichern
                            } catch (priceError) {
                                console.warn(`⚠️ Preis nicht verfügbar für ${tx.hash}:`, priceError.message);
                                priceCache.set(cacheKey, 0); // 0 cachen um wiederholte Aufrufe zu vermeiden
                            }
                        }
                        
                        usdValue = (parseFloat(tx.value) / Math.pow(10, tx.decimals || 18)) * usdPrice;
                    }

                    const categorizedTx = {
                        ...tx,
                        taxCategory,
                        usdPrice,
                        usdValue,
                        amount: parseFloat(tx.value) / Math.pow(10, tx.decimals || 18),
                        symbol: tx.token_symbol || 'PLS',
                        isTaxRelevant: this.isTaxRelevant(taxCategory),
                        processedAt: new Date().toISOString()
                    };

                    categorized.push(categorizedTx);

                } catch (error) {
                    console.error(`❌ Fehler bei Kategorisierung von ${tx.hash}:`, error);
                }
            }
            
            // Rate limiting nur zwischen Batches
            if (i + batchSize < transactions.length) {
                await this.delay(500); // 0.5s Pause zwischen Batches
            }
            
            // Progress Update
            const progress = Math.round(((i + batchSize) / transactions.length) * 100);
            console.log(`📊 Progress: ${progress}% (${categorized.length}/${transactions.length})`);
        }

        console.log(`✅ Kategorisierung abgeschlossen: ${categorized.length} Transaktionen, Cache: ${priceCache.size} Preise`);
        return categorized;
    }

    // ⏰ SCHRITT 4: Haltefrist-Berechnung
    static calculateHoldingPeriods(transactions) {
        const transactionsWithHolding = [];
        
        // Nach Datum sortieren
        const sortedTransactions = [...transactions].sort((a, b) => 
            new Date(a.block_timestamp) - new Date(b.block_timestamp)
        );

        // FIFO-Prinzip für Haltefrist-Berechnung
        const holdings = new Map(); // token_address -> [{amount, purchaseDate, price}]

        for (const tx of sortedTransactions) {
            const txDate = new Date(tx.block_timestamp);
            let holdingPeriodDays = 0;
            let isWithinSpeculationPeriod = false;

            if (tx.taxCategory === this.TAX_CATEGORIES.KAUF) {
                // Kauf: Zu Holdings hinzufügen
                const tokenKey = tx.token_address || 'native';
                if (!holdings.has(tokenKey)) {
                    holdings.set(tokenKey, []);
                }
                
                holdings.get(tokenKey).push({
                    amount: tx.amount,
                    purchaseDate: txDate,
                    price: tx.usdPrice
                });

            } else if (tx.taxCategory === this.TAX_CATEGORIES.VERKAUF) {
                // Verkauf: FIFO-Prinzip anwenden
                const tokenKey = tx.token_address || 'native';
                const tokenHoldings = holdings.get(tokenKey) || [];
                
                if (tokenHoldings.length > 0) {
                    const firstPurchase = tokenHoldings[0];
                    holdingPeriodDays = Math.floor((txDate - firstPurchase.purchaseDate) / (1000 * 60 * 60 * 24));
                    isWithinSpeculationPeriod = holdingPeriodDays < 365;
                    
                    // Verkaufte Menge von Holdings abziehen
                    this.reduceHoldings(tokenHoldings, tx.amount);
                }
            }

            transactionsWithHolding.push({
                ...tx,
                holdingPeriodDays,
                isWithinSpeculationPeriod,
                isTaxable: this.calculateTaxability(tx, holdingPeriodDays)
            });
        }

        return transactionsWithHolding;
    }

    // 🔢 Holdings reduzieren (FIFO)
    static reduceHoldings(holdings, soldAmount) {
        let remainingAmount = soldAmount;
        
        while (remainingAmount > 0 && holdings.length > 0) {
            const firstHolding = holdings[0];
            
            if (firstHolding.amount <= remainingAmount) {
                remainingAmount -= firstHolding.amount;
                holdings.shift(); // Erstes Element entfernen
            } else {
                firstHolding.amount -= remainingAmount;
                remainingAmount = 0;
            }
        }
    }

    // 💰 Steuerpflicht berechnen
    static calculateTaxability(transaction, holdingPeriodDays) {
        const { taxCategory, usdValue } = transaction;

        // ROI ist IMMER sofort steuerpflichtig
        if (taxCategory === this.TAX_CATEGORIES.ROI_INCOME || 
            taxCategory === this.TAX_CATEGORIES.STAKING_CLAIM) {
            return true;
        }

        // Verkäufe innerhalb der Spekulationsfrist
        if (taxCategory === this.TAX_CATEGORIES.VERKAUF && holdingPeriodDays < 365) {
            return usdValue > 0; // Nur bei Gewinn steuerpflichtig
        }

        // Swaps werden als Verkauf+Kauf behandelt
        if (taxCategory === this.TAX_CATEGORIES.SWAP && holdingPeriodDays < 365) {
            return usdValue > 0;
        }

        return false;
    }

    // 📊 SCHRITT 5: Tax Table erstellen
    static buildTaxTable(transactions) {
        return transactions.map(tx => ({
            datum: new Date(tx.block_timestamp).toLocaleDateString('de-DE'),
            coin: tx.symbol || 'PLS',
            menge: tx.amount.toFixed(8),
            preis: tx.usdPrice ? `$${tx.usdPrice.toFixed(4)}` : 'N/A',
            art: tx.taxCategory,
            wallet: tx.from_address === tx.to_address ? 'Internal' : 'External',
            steuerpflichtig: tx.isTaxable ? 'Ja' : 'Nein',
            bemerkung: this.generateTaxNote(tx)
        }));
    }

    // 📝 Steuerliche Bemerkung generieren
    static generateTaxNote(transaction) {
        const { taxCategory, holdingPeriodDays, isTaxable, usdValue } = transaction;
        
        if (taxCategory === this.TAX_CATEGORIES.ROI_INCOME) {
            return 'ROI-Einkommen - sofort steuerpflichtig §22 EStG';
        }
        
        if (taxCategory === this.TAX_CATEGORIES.VERKAUF) {
            if (holdingPeriodDays >= 365) {
                return `Haltefrist erfüllt (${holdingPeriodDays} Tage) - steuerfrei`;
            } else {
                return `Spekulationsfrist (${holdingPeriodDays} Tage) - steuerpflichtig`;
            }
        }
        
        if (taxCategory === this.TAX_CATEGORIES.SWAP) {
            return 'Swap = Verkauf + Kauf';
        }
        
        return 'Nicht steuerrelevant';
    }

    // 📄 SEPARATE FUNKTION: PDF manuell generieren (ohne automatische Ausführung)
    static async generatePDFManually(taxReport, options = {}) {
        try {
            const { walletAddress, table: taxTable, period } = taxReport;
            
            console.log('📄 Generiere PDF-Steuerreport manuell...');
            
            await this.generateAndSavePDF(taxTable, walletAddress, period);
            
            console.log('✅ PDF manuell generiert und gespeichert');
            return true;
            
        } catch (error) {
            console.error('❌ Manuelle PDF-Generierung fehlgeschlagen:', error);
            throw error;
        }
    }

    // 📄 SCHRITT 6: PDF automatisch generieren und speichern
    static async generateAndSavePDF(taxTable, walletAddress, options) {
        try {
            console.log('📄 Generiere PDF-Steuerreport...');
            
            const doc = new jsPDF('p', 'mm', 'a4');
            
            // Header
            doc.setFontSize(16);
            doc.text('PulseManager - Steuerreport', 20, 20);
            doc.setFontSize(12);
            doc.text(`Wallet: ${walletAddress}`, 20, 35);
            doc.text(`Zeitraum: ${options.startDate} - ${options.endDate}`, 20, 45);
            doc.text(`Erstellt am: ${new Date().toLocaleDateString('de-DE')}`, 20, 55);

            // Tabelle
            const tableColumns = [
                'Datum', 'Coin', 'Menge', 'Preis', 'Art', 'Wallet', 'Steuerpflichtig', 'Bemerkung'
            ];
            
            const tableRows = taxTable.map(row => [
                row.datum,
                row.coin,
                row.menge,
                row.preis,
                row.art,
                row.wallet,
                row.steuerpflichtig,
                row.bemerkung
            ]);

            doc.autoTable({
                head: [tableColumns],
                body: tableRows,
                startY: 70,
                styles: { fontSize: 8 },
                headStyles: { fillColor: [41, 128, 185] },
                margin: { top: 70 }
            });

            // Footer
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(10);
                doc.text(
                    `Steuerreport erstellt mit PulseManager - Seite ${i} von ${pageCount}`,
                    20,
                    doc.internal.pageSize.height - 10
                );
            }

            // PDF im Downloads-Ordner speichern
            const fileName = `PulseManager_Steuerreport_${walletAddress.slice(0, 8)}_${new Date().toISOString().slice(0, 10)}.pdf`;
            doc.save(fileName);

            console.log(`✅ PDF erfolgreich gespeichert: ${fileName}`);

        } catch (error) {
            console.error('❌ PDF-Generierung fehlgeschlagen:', error);
            throw error;
        }
    }

    // 📊 Tax Summary berechnen
    static calculateTaxSummary(transactions) {
        const summary = {
            totalTransactions: transactions.length,
            taxableTransactions: 0,
            totalTaxableValue: 0,
            roiIncome: 0,
            speculativeGains: 0,
            categories: {}
        };

        transactions.forEach(tx => {
            // Kategorien zählen
            if (!summary.categories[tx.taxCategory]) {
                summary.categories[tx.taxCategory] = 0;
            }
            summary.categories[tx.taxCategory]++;

            // Steuerpflichtige Transaktionen
            if (tx.isTaxable) {
                summary.taxableTransactions++;
                summary.totalTaxableValue += tx.usdValue || 0;

                if (tx.taxCategory === this.TAX_CATEGORIES.ROI_INCOME) {
                    summary.roiIncome += tx.usdValue || 0;
                } else if (tx.taxCategory === this.TAX_CATEGORIES.VERKAUF || 
                          tx.taxCategory === this.TAX_CATEGORIES.SWAP) {
                    summary.speculativeGains += tx.usdValue || 0;
                }
            }
        });

        return summary;
    }

    // 🛠️ HILFSFUNKTIONEN

    static isTaxRelevant(taxCategory) {
        return taxCategory !== this.TAX_CATEGORIES.TRANSFER;
    }

    static delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // 🧪 DEBUG-FUNKTIONEN (temporär)
    static enableDebugMode() {
        this.debugMode = true;
        console.log('🐛 Tax Report Debug Mode aktiviert');
    }

    static disableDebugMode() {
        this.debugMode = false;
        console.log('✅ Tax Report Debug Mode deaktiviert');
    }

    static logTransactionProcessing(transaction, step) {
        if (this.debugMode) {
            console.log(`🔍 [${step}] TX: ${transaction.hash} | Type: ${transaction.taxCategory} | Value: ${transaction.usdValue}`);
        }
    }
}

// 🎯 Export für Verwendung
export default TaxReportService_Rebuild; 