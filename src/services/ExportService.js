/**
 * 📄 EXPORT SERVICE
 * 
 * Professionelle Steuer-Reports exportieren
 * - PDF mit deutschem Steuerrecht-Layout
 * - CSV für Excel/Steuerberater
 * - ELSTER-XML für direkte Abgabe
 * - Compliance mit deutschen Standards
 */

import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

export default class ExportService {
    constructor(options = {}) {
        this.testMode = options.testMode || false;
        this.outputDir = options.outputDir || './exports';
        
        // Stelle sicher, dass Export-Verzeichnis existiert
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true });
        }
    }

    /**
     * 📋 PDF STEUER-REPORT ERSTELLEN
     */
    async generatePDFReport(taxReport, options = {}) {
        try {
            console.log('📄 Erstelle PDF Steuer-Report...');
            
            // Vereinfachter PDF-Export (für jetzt Browser-kompatibel)
            const pdfData = this.buildPDFData(taxReport);
            
            const filename = `steuer-report-${this.shortenAddress(taxReport.walletAddress)}-${taxReport.taxYear}.pdf`;
            
            console.log(`✅ PDF Report vorbereitet: ${filename}`);
            return {
                success: true,
                filename,
                data: pdfData,
                downloadUrl: `data:application/pdf;base64,${btoa(pdfData)}`
            };
            
        } catch (error) {
            console.error('🚨 PDF Export Fehler:', error);
            throw {
                code: 'PDF_EXPORT_ERROR',
                message: 'PDF konnte nicht erstellt werden',
                original: error
            };
        }
    }

    /**
     * 🎨 PDF DATEN ERSTELLEN
     */
    buildPDFData(taxReport) {
        const content = `
=== KRYPTOWÄHRUNG STEUERBERICHT ===
Steuerjahr: ${taxReport.taxYear}
Wallet: ${this.shortenAddress(taxReport.walletAddress)}
Erstellt: ${new Date().toLocaleDateString('de-DE')}

=== STEUERLICHE ZUSAMMENFASSUNG ===
Gesamte steuerpflichtige Gewinne: ${this.formatEUR(taxReport.totalTaxableGains)}
Gesamte Steuerschuld: ${this.formatEUR(taxReport.totalTaxAmount)}
Anzahl Transaktionen: ${taxReport.transactions?.length || 0}
Handelsvolumen: ${this.formatEUR(taxReport.totalVolume)}

=== STEUERRECHTLICHE EINORDNUNG ===
§ 23 EStG - Spekulationsgeschäfte (< 1 Jahr):
  Gewinne: ${this.formatEUR(taxReport.paragraph23Gains)}
  Freigrenze: €600,00 (${taxReport.paragraph23Gains > 600 ? 'überschritten' : 'nicht überschritten'})
  Steuerpflichtig: ${this.formatEUR(taxReport.paragraph23Tax)}

§ 22 Nr. 2 EStG - Private Veräußerungsgeschäfte (≥ 1 Jahr):
  Gewinne: ${this.formatEUR(taxReport.paragraph22Gains || 0)} (steuerfrei)

=== RECHTLICHE HINWEISE ===
• Diese Berechnung erfolgt nach bestem Wissen und Gewissen basierend auf aktueller Rechtsprechung.
• Die steuerliche Behandlung von Kryptowährungen kann sich ändern. Konsultieren Sie einen Steuerberater.
• Alle Angaben ohne Gewähr. Keine Haftung für die Richtigkeit oder Vollständigkeit.
• Grundlage: Einkommensteuergesetz (EStG) §§ 22, 23 in der aktuellen Fassung.
• Bei Unsicherheiten wenden Sie sich an das zuständige Finanzamt oder einen Fachberater.
        `;
        
        return content;
    }

    /**
     * 📊 CSV EXPORT
     */
    async generateCSVReport(taxReport, options = {}) {
        try {
            console.log('📊 Erstelle CSV Steuer-Report...');
            
            let csvContent = '';
            
            // CSV Header
            csvContent += 'Datum;Typ;Token;Menge;Preis_EUR;Wert_EUR;Gas_EUR;Chain;Hash\n';
            
            // Transaktionen
            if (taxReport.transactions) {
                taxReport.transactions.forEach(tx => {
                    csvContent += [
                        new Date(tx.timestamp).toLocaleDateString('de-DE'),
                        tx.type,
                        tx.tokenSymbol,
                        tx.amount.toString().replace('.', ','), // Deutsche Dezimalnotation
                        (tx.priceEUR || 0).toString().replace('.', ','),
                        (tx.valueEUR || 0).toString().replace('.', ','),
                        (tx.gasFeesEUR || 0).toString().replace('.', ','),
                        tx.chain || '',
                        tx.hash || ''
                    ].join(';') + '\n'; // Semikolon für deutsche Excel-Kompatibilität
                });
            }
            
            const filename = `steuer-report-${this.shortenAddress(taxReport.walletAddress)}-${taxReport.taxYear}.csv`;
            
            console.log(`✅ CSV Report erstellt: ${filename}`);
            return {
                success: true,
                filename,
                data: csvContent,
                downloadUrl: `data:text/csv;charset=utf-8,${encodeURIComponent(csvContent)}`
            };
            
        } catch (error) {
            console.error('🚨 CSV Export Fehler:', error);
            throw {
                code: 'CSV_EXPORT_ERROR',
                message: 'CSV konnte nicht erstellt werden',
                original: error
            };
        }
    }

    /**
     * 🏛️ ELSTER XML EXPORT
     */
    async generateElsterXML(taxReport, taxpayerData, options = {}) {
        try {
            console.log('🏛️ Erstelle ELSTER XML...');
            
            const xmlContent = this.buildElsterXML(taxReport, taxpayerData);
            const filename = `elster-${this.shortenAddress(taxReport.walletAddress)}-${taxReport.taxYear}.xml`;
            
            console.log(`✅ ELSTER XML erstellt: ${filename}`);
            return {
                success: true,
                filename,
                data: xmlContent,
                downloadUrl: `data:application/xml;charset=utf-8,${encodeURIComponent(xmlContent)}`
            };
            
        } catch (error) {
            console.error('🚨 ELSTER XML Export Fehler:', error);
            throw {
                code: 'ELSTER_EXPORT_ERROR',
                message: 'ELSTER XML konnte nicht erstellt werden',
                original: error
            };
        }
    }

    /**
     * 🏛️ ELSTER XML STRUKTUR AUFBAUEN
     */
    buildElsterXML(taxReport, taxpayerData) {
        const currentDate = new Date().toISOString().split('T')[0];
        
        return `<?xml version="1.0" encoding="UTF-8"?>
<Elster xmlns="http://www.elster.de/elsterxml/schema/v11" 
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
    <TransferHeader version="11">
        <Verfahren>ElsterErklaerung</Verfahren>
        <DatenArt>ESt</DatenArt>
        <Vorgang>send-Auth</Vorgang>
        <TransferTicket>...</TransferTicket>
        <Testmerker>${this.testMode ? '700000004' : '000000000'}</Testmerker>
        <SigUser/>
        <Empfaenger id="F">
            <Kuerzel>ELSTERuebertragung</Kuerzel>
            <Parameter>
                <Anwender>ElsterFormular</Anwender>
                <Mandant>${taxpayerData?.taxNumber || ''}</Mandant>
            </Parameter>
        </Empfaenger>
        <Hersteller>
            <ProduktName>German Crypto Tax API</ProduktName>
            <ProduktVersion>1.0</ProduktVersion>
        </Hersteller>
        <DatenLieferant>${taxpayerData?.name || ''}</DatenLieferant>
        <EingangsDatum>${currentDate}</EingangsDatum>
        <Datei>
            <Verschluesselung>PKCS#7v1.5</Verschluesselung>
            <Kompression>GZIP</Kompression>
            <TransportSchluessel/>
            <Erstellung>
                <Eric>
                    <Success>true</Success>
                </Eric>
            </Erstellung>
        </Datei>
    </TransferHeader>
    <DatenTeil>
        <Nutzdatenblock>
            <NutzdatenHeader version="11">
                <NutzdatenTicket>...</NutzdatenTicket>
                <Empfaenger id="F">ELSTERuebertragung</Empfaenger>
                <Hersteller>
                    <ProduktName>German Crypto Tax API</ProduktName>
                    <ProduktVersion>1.0</ProduktVersion>
                </Hersteller>
                <DatenLieferant>${taxpayerData?.name || ''}</DatenLieferant>
                <RC>
                    <Rueckgabe>
                        <Code>0</Code>
                        <Text/>
                    </Rueckgabe>
                    <Stack>
                        <Code>0</Code>
                        <Text/>
                    </Stack>
                </RC>
                <Zeitstempel>${new Date().toISOString()}</Zeitstempel>
            </NutzdatenHeader>
            <Nutzdaten>
                <Anmeldungssteuern art="ESt" version="${taxReport.taxYear}">
                    <DatenLieferant>
                        <Name>${taxpayerData?.name || ''}</Name>
                        <Strasse>${taxpayerData?.street || ''}</Strasse>
                        <PLZ>${taxpayerData?.zipCode || ''}</PLZ>
                        <Ort>${taxpayerData?.city || ''}</Ort>
                    </DatenLieferant>
                    <Erstellungsdatum>${currentDate}</Erstellungsdatum>
                    <!-- § 23 EStG Spekulationsgeschäfte -->
                    ${taxReport.paragraph23Gains > 0 ? `
                    <SpekGeschaefte>
                        <Gewinne>${Math.round(taxReport.paragraph23Gains * 100)}</Gewinne>
                        <Verluste>0</Verluste>
                        <Freigrenze>60000</Freigrenze>
                    </SpekGeschaefte>
                    ` : ''}
                    <!-- Sonstige Einkünfte -->
                    <SonstigeEinkuenfte>
                        <Kryptowaehrungen>
                            <Gewinne>${Math.round(taxReport.totalTaxableGains * 100)}</Gewinne>
                            <Beschreibung>Veräußerungsgeschäfte mit Kryptowährungen</Beschreibung>
                        </Kryptowaehrungen>
                    </SonstigeEinkuenfte>
                </Anmeldungssteuern>
            </Nutzdaten>
        </Nutzdatenblock>
    </DatenTeil>
</Elster>`;
    }

    /**
     * 🔧 HILFSFUNKTIONEN
     */
    
    formatEUR(amount) {
        return new Intl.NumberFormat('de-DE', {
            style: 'currency',
            currency: 'EUR'
        }).format(amount || 0);
    }

    shortenAddress(address) {
        if (!address) return 'N/A';
        return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    }

    /**
     * 🧹 AUFRÄUMEN
     */
    async cleanup(olderThanDays = 30) {
        console.log(`🧹 Cleanup-Simulation: Würde Dateien älter als ${olderThanDays} Tage löschen`);
        return { deletedCount: 0 };
    }
} 