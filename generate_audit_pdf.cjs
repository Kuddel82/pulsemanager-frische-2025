const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

/**
 * 🎯 PDF-GENERATOR FÜR PULSEMANAGER AUDIT-CHECKLISTE
 * 
 * Konvertiert die HTML-Audit-Checkliste zu einer professionellen PDF-Datei
 * mit optimierter Formatierung für Druck und Präsentation.
 */
async function generateAuditPDF() {
  let browser;
  
  try {
    console.log('🚀 Starte PDF-Generation...');
    
    // Puppeteer Browser starten
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // HTML-Datei laden
    const htmlPath = path.join(__dirname, 'docs', 'AUDIT_CHECKLISTE_PRESENTATION.html');
    
    if (!fs.existsSync(htmlPath)) {
      throw new Error(`HTML-Datei nicht gefunden: ${htmlPath}`);
    }
    
    console.log(`📄 Lade HTML-Datei: ${htmlPath}`);
    
    // HTML-Datei öffnen
    await page.goto(`file://${htmlPath}`, {
      waitUntil: 'networkidle0'
    });
    
    // Viewport für bessere Darstellung setzen
    await page.setViewport({
      width: 1200,
      height: 800,
      deviceScaleFactor: 2
    });
    
    // Warten bis alle Inhalte geladen sind
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // PDF-Optionen
    const pdfOptions = {
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        bottom: '20mm',
        left: '15mm',
        right: '15mm'
      },
      displayHeaderFooter: true,
      headerTemplate: `
        <div style="font-size: 10px; color: #666; width: 100%; text-align: center; margin-top: 10px;">
          <span>PulseManager - Audit-Checkliste Datenabruf-Kontrolle</span>
        </div>
      `,
      footerTemplate: `
        <div style="font-size: 10px; color: #666; width: 100%; text-align: center; margin-bottom: 10px;">
          <span>Seite <span class="pageNumber"></span> von <span class="totalPages"></span> | Generiert am ${new Date().toLocaleDateString('de-DE')}</span>
        </div>
      `
    };
    
    // PDF generieren
    console.log('📋 Generiere PDF...');
    const pdfBuffer = await page.pdf(pdfOptions);
    
    // PDF speichern
    const outputPath = path.join(__dirname, 'PULSEMANAGER_AUDIT_CHECKLISTE.pdf');
    fs.writeFileSync(outputPath, pdfBuffer);
    
    console.log(`✅ PDF erfolgreich generiert: ${outputPath}`);
    console.log(`📊 Dateigröße: ${Math.round(pdfBuffer.length / 1024)} KB`);
    
    return outputPath;
    
  } catch (error) {
    console.error('❌ Fehler bei PDF-Generation:', error.message);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Script direkt ausführen, falls es als Hauptmodul aufgerufen wird
if (require.main === module) {
  generateAuditPDF()
    .then(outputPath => {
      console.log('\n🎯 PDF-GENERATION ABGESCHLOSSEN!');
      console.log(`📁 Gespeichert unter: ${outputPath}`);
      console.log('\n📖 Die PDF-Datei enthält:');
      console.log('  ✅ Vollständige Audit-Checkliste');
      console.log('  ✅ System Health Overview');
      console.log('  ✅ Vergleichstabelle (Vorher/Nachher)');
      console.log('  ✅ Entwickler-Guidelines');
      console.log('  ✅ Professionelle Formatierung');
      console.log('\n🚀 Bereit für Präsentationen und Archivierung!');
    })
    .catch(error => {
      console.error('\n💥 PDF-Generation fehlgeschlagen:', error.message);
      process.exit(1);
    });
}

module.exports = { generateAuditPDF }; 