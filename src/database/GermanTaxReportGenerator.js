/**
 * GermanTaxReportGenerator.js
 * 
 * Professioneller deutscher Steuerreport-Generator für PulseManager
 * Features: PDF Export, CSV Export, ELSTER XML, Compliance nach §22 & §23 EStG
 * 
 * @author PulseManager Tax Team
 * @version 1.0.0
 * @since 2024-06-14
 */

const fs = require('fs').promises;
const path = require('path');
const PDFDocument = require('pdfkit');

class GermanTaxReportGenerator {
    constructor(options = {}) {
        this.outputDirectory = options.outputDirectory || './tax-reports';
        this.templateDirectory = options.templateDirectory || './templates';
        this.logoPath = options.logoPath || null;
        
        // Deutsche Steuerregeln
        this.TAX_YEAR = options.taxYear || new Date().getFullYear();
        this.CURRENCY = 'EUR';
        this.LOCALE = 'de-DE';

        // Report-Konfiguration
        this.reportConfig = {
            includeTransactionDetails: true,
            includeFIFODetails: true,
            includePortfolioStatus: true,
            includeGermanTaxNotes: true,
            generatePDF: true,
            generateCSV: true,
            generateELSTER: false, // Experimental
            autoDownload: false
        };

        console.log('📊 German Tax Report Generator initialisiert');
    }

    /**
     * Vollständigen Steuerreport generieren
     */
    async generateFullReport(taxCalculations, userInfo, options = {}) {
        const config = { ...this.reportConfig, ...options };
        const reportId = this.generateReportId();
        
        console.log(`📋 Generiere Steuerreport ${reportId} für ${this.TAX_YEAR}...`);

        // Output-Verzeichnis erstellen
        await this.ensureOutputDirectory();

        const reportData = {
            reportId: reportId,
            generatedAt: new Date(),
            taxYear: this.TAX_YEAR,
            userInfo: userInfo,
            taxCalculations: taxCalculations,
            config: config
        };

        const results = {
            reportId: reportId,
            files: [],
            errors: []
        };

        try {
            // PDF-Report generieren
            if (config.generatePDF) {
                const pdfPath = await this.generatePDFReport(reportData);
                results.files.push({ type: 'PDF', path: pdfPath });
                console.log(`✅ PDF generiert: ${pdfPath}`);
            }

            // CSV-Export generieren
            if (config.generateCSV) {
                const csvPath = await this.generateCSVReport(reportData);
                results.files.push({ type: 'CSV', path: csvPath });
                console.log(`✅ CSV generiert: ${csvPath}`);
            }

            // ELSTER XML generieren (experimentell)
            if (config.generateELSTER) {
                try {
                    const xmlPath = await this.generateELSTERXML(reportData);
                    results.files.push({ type: 'ELSTER', path: xmlPath });
                    console.log(`✅ ELSTER XML generiert: ${xmlPath}`);
                } catch (error) {
                    console.warn('⚠️ ELSTER XML Generation fehlgeschlagen:', error.message);
                    results.errors.push({ type: 'ELSTER', error: error.message });
                }
            }

            // JSON-Summary für API
            const summaryPath = await this.generateJSONSummary(reportData);
            results.files.push({ type: 'JSON', path: summaryPath });

            console.log(`🎉 Steuerreport ${reportId} erfolgreich generiert!`);
            
            return results;

        } catch (error) {
            console.error('❌ Fehler bei Report-Generierung:', error);
            results.errors.push({ type: 'GENERAL', error: error.message });
            return results;
        }
    }

    /**
     * PDF-Report generieren
     */
    async generatePDFReport(reportData) {
        const fileName = `PulseManager_Steuerreport_${reportData.taxYear}_${reportData.reportId}.pdf`;
        const filePath = path.join(this.outputDirectory, fileName);

        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ margin: 50, size: 'A4' });
            
            // PDF-Stream in Datei schreiben
            const stream = doc.pipe(require('fs').createWriteStream(filePath));

            // Seiten-Header
            this.addPDFHeader(doc, reportData);

            // Inhaltsverzeichnis
            this.addPDFTableOfContents(doc);

            // Executive Summary
            this.addPDFExecutiveSummary(doc, reportData);

            // Deutsche Steuer-Zusammenfassung
            this.addPDFGermanTaxSummary(doc, reportData);

            // ROI-Einkommen Details (§22 EStG)
            this.addPDFROIDetails(doc, reportData);

            // Spekulationsgeschäfte Details (§23 EStG)
            this.addPDFSpeculationDetails(doc, reportData);

            // Transaktions-Details
            if (reportData.config.includeTransactionDetails) {
                this.addPDFTransactionDetails(doc, reportData);
            }

            // Portfolio-Status
            if (reportData.config.includePortfolioStatus) {
                this.addPDFPortfolioStatus(doc, reportData);
            }

            // FIFO-Details
            if (reportData.config.includeFIFODetails) {
                this.addPDFFIFODetails(doc, reportData);
            }

            // Rechtliche Hinweise
            if (reportData.config.includeGermanTaxNotes) {
                this.addPDFLegalNotes(doc, reportData);
            }

            // Footer
            this.addPDFFooter(doc, reportData);

            // PDF finalisieren
            doc.end();

            stream.on('finish', () => resolve(filePath));
            stream.on('error', reject);
        });
    }

    /**
     * CSV-Report generieren
     */
    async generateCSVReport(reportData) {
        const fileName = `PulseManager_Transaktionen_${reportData.taxYear}_${reportData.reportId}.csv`;
        const filePath = path.join(this.outputDirectory, fileName);

        const csvHeader = [
            'Datum',
            'Uhrzeit',
            'Typ',
            'Token',
            'Menge',
            'Preis EUR',
            'Wert EUR',
            'Steuer-Kategorie',
            'Paragraph',
            'Haltedauer (Tage)',
            'Gewinn/Verlust EUR',
            'Steuerrelevant',
            'TX Hash',
            'Notizen'
        ].join(',');

        const csvRows = [csvHeader];

        // Transaktionen zu CSV hinzufügen
        if (reportData.taxCalculations.transactions) {
            for (const tx of reportData.taxCalculations.transactions) {
                const row = [
                    this.formatDate(tx.timestamp || tx.sellDate),
                    this.formatTime(tx.timestamp || tx.sellDate),
                    tx.type || 'N/A',
                    tx.tokenSymbol || 'N/A',
                    this.formatNumber(tx.amount || tx.sellAmount),
                    this.formatNumber(tx.priceEUR || tx.sellPriceEUR),
                    this.formatNumber(tx.valueEUR || tx.totalSaleValue),
                    tx.isROI ? 'ROI-Einkommen' : 'Handel',
                    tx.isROI ? '§22 EStG' : (tx.isSpeculative ? '§23 EStG' : 'Steuerfrei'),
                    tx.avgHoldingDays || 'N/A',
                    this.formatNumber(tx.totalGainLoss || tx.valueEUR),
                    tx.isROI || tx.isSpeculative ? 'Ja' : 'Nein',
                    tx.txHash || 'N/A',
                    tx.notes || ''
                ].map(field => `"${field}"`).join(',');
                
                csvRows.push(row);
            }
        }

        await fs.writeFile(filePath, csvRows.join('\n'), 'utf8');
        return filePath;
    }

    /**
     * ELSTER XML generieren (experimentell)
     */
    async generateELSTERXML(reportData) {
        const fileName = `PulseManager_ELSTER_${reportData.taxYear}_${reportData.reportId}.xml`;
        const filePath = path.join(this.outputDirectory, fileName);

        const xmlContent = this.generateELSTERXMLContent(reportData);
        await fs.writeFile(filePath, xmlContent, 'utf8');
        
        return filePath;
    }

    /**
     * JSON-Summary generieren
     */
    async generateJSONSummary(reportData) {
        const fileName = `PulseManager_Summary_${reportData.taxYear}_${reportData.reportId}.json`;
        const filePath = path.join(this.outputDirectory, fileName);

        const summary = {
            reportId: reportData.reportId,
            generatedAt: reportData.generatedAt,
            taxYear: reportData.taxYear,
            userInfo: {
                email: reportData.userInfo.email,
                walletCount: reportData.userInfo.walletCount || 0
            },
            taxSummary: {
                totalTaxableIncome: reportData.taxCalculations.germanTaxCalculation?.totalTaxableIncomeEUR || 0,
                roiIncome: reportData.taxCalculations.germanTaxCalculation?.roiIncomeEUR || 0,
                speculativeGains: reportData.taxCalculations.germanTaxCalculation?.speculativeGainsEUR || 0,
                longTermGains: reportData.taxCalculations.germanTaxCalculation?.longTermGainsEUR || 0,
                estimatedTax: reportData.taxCalculations.germanTaxCalculation?.estimatedTaxEUR || 0,
                exemptionUsed: reportData.taxCalculations.germanTaxCalculation?.exemptionUsedEUR || 0
            },
            transactionSummary: {
                totalTransactions: reportData.taxCalculations.summary?.totalTransactions || 0,
                roiTransactions: reportData.taxCalculations.summary?.roiTransactions || 0,
                saleTransactions: reportData.taxCalculations.summary?.saleTransactions || 0
            },
            compliance: {
                germanTaxLaw: true,
                fifoMethod: true,
                paragraphs: ['§22 EStG', '§23 EStG'],
                speculationPeriod: '365 Tage',
                exemptionLimit: '600 EUR'
            }
        };

        await fs.writeFile(filePath, JSON.stringify(summary, null, 2), 'utf8');
        return filePath;
    }

    /**
     * PDF-Header hinzufügen
     */
    addPDFHeader(doc, reportData) {
        // Logo (falls vorhanden)
        if (this.logoPath && require('fs').existsSync(this.logoPath)) {
            doc.image(this.logoPath, 50, 50, { width: 100 });
        }

        // Titel
        doc.fontSize(24)
           .font('Helvetica-Bold')
           .text('PulseManager - Deutscher Steuerreport', 200, 50);

        // Steuerjahr
        doc.fontSize(18)
           .font('Helvetica')
           .text(`Steuerjahr: ${reportData.taxYear}`, 200, 80);

        // Generierungs-Info
        doc.fontSize(12)
           .text(`Generiert am: ${this.formatDateTime(reportData.generatedAt)}`, 200, 105);
        
        doc.fontSize(10)
           .text(`Report-ID: ${reportData.reportId}`, 200, 120);

        // Linie
        doc.moveTo(50, 150)
           .lineTo(550, 150)
           .stroke();

        // Y-Position für nachfolgenden Content
        doc.y = 170;
    }

    /**
     * Executive Summary hinzufügen
     */
    addPDFExecutiveSummary(doc, reportData) {
        const calc = reportData.taxCalculations.germanTaxCalculation;
        
        doc.addPage();
        doc.fontSize(18)
           .font('Helvetica-Bold')
           .text('Executive Summary', 50, 50);

        doc.fontSize(12)
           .font('Helvetica')
           .text(`Gesamtes steuerpflichtiges Einkommen: €${this.formatNumber(calc?.totalTaxableIncomeEUR || 0)}`, 50, 90)
           .text(`Geschätzte Steuerlast: €${this.formatNumber(calc?.estimatedTaxEUR || 0)}`, 50, 110)
           .text(`ROI-Einkommen (§22 EStG): €${this.formatNumber(calc?.roiIncomeEUR || 0)}`, 50, 130)
           .text(`Spekulationsgewinne (§23 EStG): €${this.formatNumber(calc?.speculativeGainsEUR || 0)}`, 50, 150)
           .text(`Langfristige Gewinne (steuerfrei): €${this.formatNumber(calc?.longTermGainsEUR || 0)}`, 50, 170)
           .text(`Verwendete Freigrenze: €${this.formatNumber(calc?.exemptionUsedEUR || 0)} / €600`, 50, 190);

        doc.fontSize(10)
           .text('Hinweis: Dies ist eine automatisch generierte Steuerberechnung. Bitte konsultieren Sie einen Steuerberater.', 50, 220);
    }

    /**
     * Deutsche Steuer-Zusammenfassung hinzufügen
     */
    addPDFGermanTaxSummary(doc, reportData) {
        doc.addPage();
        doc.fontSize(18)
           .font('Helvetica-Bold')
           .text('Deutsche Steuer-Zusammenfassung', 50, 50);

        // §22 EStG Bereich
        doc.fontSize(14)
           .font('Helvetica-Bold')
           .text('§22 EStG - Sonstige Einkünfte (ROI)', 50, 90);

        doc.fontSize(12)
           .font('Helvetica')
           .text('ROI-Token wie WGEP, MASKMAN, BORK werden als sonstige Einkünfte besteuert.', 50, 115)
           .text('Steuersatz: 14% - 45% (Einkommensteuersatz)', 50, 135);

        // §23 EStG Bereich
        doc.fontSize(14)
           .font('Helvetica-Bold')
           .text('§23 EStG - Spekulationsgeschäfte', 50, 170);

        doc.fontSize(12)
           .font('Helvetica')
           .text('Krypto-Handel unter 1 Jahr Haltedauer ist steuerpflichtig.', 50, 195)
           .text('Über 1 Jahr Haltedauer: steuerfrei', 50, 215)
           .text('Freigrenze: 600€ pro Jahr', 50, 235);
    }

    /**
     * Transaktions-Details hinzufügen
     */
    addPDFTransactionDetails(doc, reportData) {
        doc.addPage();
        doc.fontSize(18)
           .font('Helvetica-Bold')
           .text('Transaktions-Details', 50, 50);

        let yPos = 80;
        const transactions = reportData.taxCalculations.transactions || [];

        for (const tx of transactions.slice(0, 1000)) { // 🔥 ERHÖHT: 1000 Transaktionen für PDF!
            if (yPos > 700) {
                doc.addPage();
                yPos = 50;
            }

            doc.fontSize(10)
               .font('Helvetica')
               .text(`${this.formatDate(tx.timestamp || tx.sellDate)} - ${tx.tokenSymbol} - €${this.formatNumber(tx.valueEUR || tx.totalSaleValue)}`, 50, yPos);

            yPos += 15;
        }

        if (transactions.length > 1000) {
            doc.text(`... und ${transactions.length - 1000} weitere Transaktionen`, 50, yPos + 20);
        }
    }

    /**
     * Rechtliche Hinweise hinzufügen
     */
    addPDFLegalNotes(doc, reportData) {
        doc.addPage();
        doc.fontSize(18)
           .font('Helvetica-Bold')
           .text('Rechtliche Hinweise', 50, 50);

        const legalNotes = [
            'Dieser Report wurde automatisch generiert und basiert auf den verfügbaren Blockchain-Daten.',
            'Die Steuerberechnung erfolgt nach deutschem Steuerrecht (EStG) in der aktuellen Fassung.',
            'FIFO-Methode wird für die Kostenbasisbere chnung verwendet.',
            'ROI-Einkommen wird als sonstige Einkünfte nach §22 EStG klassifiziert.',
            'Spekulationsgeschäfte unterliegen §23 EStG mit 365-Tage-Spekulationsfrist.',
            'Bitte konsultieren Sie einen qualifizierten Steuerberater für individuelle Beratung.',
            'PulseManager übernimmt keine Haftung für die Richtigkeit der Steuerberechnung.',
            'Alle Angaben ohne Gewähr.'
        ];

        let yPos = 90;
        for (const note of legalNotes) {
            doc.fontSize(12)
               .font('Helvetica')
               .text(`• ${note}`, 50, yPos, { width: 500, align: 'left' });
            yPos += 30;
        }
    }

    /**
     * PDF-Footer hinzufügen
     */
    addPDFFooter(doc, reportData) {
        doc.fontSize(8)
           .text(`PulseManager Tax Report - ${reportData.taxYear} - Seite ${doc.page.count}`, 50, 750, { align: 'center' });
    }

    /**
     * ELSTER XML-Content generieren
     */
    generateELSTERXMLContent(reportData) {
        const calc = reportData.taxCalculations.germanTaxCalculation;
        
        return `<?xml version="1.0" encoding="UTF-8"?>
<ElsterDocument>
    <Header>
        <Version>1.0</Version>
        <Software>PulseManager</Software>
        <GeneratedAt>${reportData.generatedAt.toISOString()}</GeneratedAt>
        <TaxYear>${reportData.taxYear}</TaxYear>
    </Header>
    
    <TaxData>
        <SonstigeEinkuenfte>
            <ROI_Einkommen>${calc?.roiIncomeEUR || 0}</ROI_Einkommen>
            <Paragraph>22</Paragraph>
        </SonstigeEinkuenfte>
        
        <Spekulationsgeschaefte>
            <Gewinne>${calc?.speculativeGainsEUR || 0}</Gewinne>
            <Freigrenze_Verwendet>${calc?.exemptionUsedEUR || 0}</Freigrenze_Verwendet>
            <Paragraph>23</Paragraph>
        </Spekulationsgeschaefte>
        
        <Gesamt>
            <Steuerpflichtiges_Einkommen>${calc?.totalTaxableIncomeEUR || 0}</Steuerpflichtiges_Einkommen>
            <Geschaetzte_Steuer>${calc?.estimatedTaxEUR || 0}</Geschaetzte_Steuer>
        </Gesamt>
    </TaxData>
</ElsterDocument>`;
    }

    /**
     * Utility-Funktionen
     */
    generateReportId() {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 5);
        return `${timestamp}_${random}`.toUpperCase();
    }

    formatNumber(num) {
        return new Intl.NumberFormat(this.LOCALE, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(num || 0);
    }

    formatDate(date) {
        return new Date(date).toLocaleDateString(this.LOCALE);
    }

    formatTime(date) {
        return new Date(date).toLocaleTimeString(this.LOCALE);
    }

    formatDateTime(date) {
        return new Date(date).toLocaleString(this.LOCALE);
    }

    async ensureOutputDirectory() {
        try {
            await fs.mkdir(this.outputDirectory, { recursive: true });
        } catch (error) {
            if (error.code !== 'EEXIST') {
                throw error;
            }
        }
    }

    /**
     * Report-Dateien bereinigen
     */
    async cleanupOldReports(maxAge = 30) {
        try {
            const files = await fs.readdir(this.outputDirectory);
            const cutoffDate = new Date(Date.now() - maxAge * 24 * 60 * 60 * 1000);

            for (const file of files) {
                const filePath = path.join(this.outputDirectory, file);
                const stats = await fs.stat(filePath);
                
                if (stats.mtime < cutoffDate) {
                    await fs.unlink(filePath);
                    console.log(`🗑️ Alte Report-Datei gelöscht: ${file}`);
                }
            }
        } catch (error) {
            console.warn('⚠️ Fehler beim Bereinigen alter Reports:', error.message);
        }
    }

    /**
     * Verfügbare Reports auflisten
     */
    async listReports() {
        try {
            const files = await fs.readdir(this.outputDirectory);
            const reports = [];

            for (const file of files) {
                const filePath = path.join(this.outputDirectory, file);
                const stats = await fs.stat(filePath);
                
                reports.push({
                    filename: file,
                    path: filePath,
                    size: stats.size,
                    created: stats.mtime,
                    type: path.extname(file).toLowerCase()
                });
            }

            return reports.sort((a, b) => b.created - a.created);
        } catch (error) {
            console.warn('⚠️ Fehler beim Auflisten der Reports:', error.message);
            return [];
        }
    }
}

module.exports = GermanTaxReportGenerator; 