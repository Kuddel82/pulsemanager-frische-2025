import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * 🎯 STEUERREPORT PDF EXPORT API
 * 
 * Generiert professionelle PDF-Steuerreports aus tax_cache & roi_cache Daten
 * mit vollständiger Formatierung und steuerlicher Auswertung.
 */
export default async function handler(req, res) {
  const { userId, wallet, year } = req.query;

  // Parameter-Validierung
  if (!userId || !wallet || !year) {
    return res.status(400).json({ 
      error: 'Fehlende Parameter',
      required: 'userId, wallet, year'
    });
  }

  const jahr = parseInt(year);
  
  // Ungültiges Jahr prüfen
  if (isNaN(jahr) || jahr < 2020 || jahr > new Date().getFullYear()) {
    return res.status(400).json({ 
      error: 'Ungültiges Jahr',
      validRange: '2020 - ' + new Date().getFullYear()
    });
  }

  try {
    console.log(`📋 Generiere Steuerreport für ${wallet} (${jahr})`);

    // Daten aus Supabase abrufen
    const [taxResult, roiResult] = await Promise.all([
      supabase
        .from('tax_cache')
        .select('*')
        .eq('user_id', userId)
        .eq('wallet_address', wallet)
        .maybeSingle(),
      
      supabase
        .from('roi_cache')
        .select('*')
        .eq('user_id', userId)
        .eq('wallet_address', wallet)
        .maybeSingle()
    ]);

    // Fehler-Handling für Supabase
    if (taxResult.error && taxResult.error.code !== 'PGRST116') {
      throw new Error(`Tax Cache Fehler: ${taxResult.error.message}`);
    }
    
    if (roiResult.error && roiResult.error.code !== 'PGRST116') {
      throw new Error(`ROI Cache Fehler: ${roiResult.error.message}`);
    }

    // Daten extrahieren und filtern
    const allTaxData = taxResult.data?.data?.transactions || [];
    const allRoiData = roiResult.data?.data || [];

    // Nach Jahr filtern
    const verkaeufe = allTaxData.filter(t => 
      t.date && t.date.startsWith(jahr.toString())
    );
    
    const roiEinnahmen = allRoiData.filter(r => 
      r.timestamp && r.timestamp.startsWith(jahr.toString())
    );

    // Steuerliche Auswertung
    const steuerpflichtigeVerkaeufe = verkaeufe.filter(v => v.steuerpflichtig);
    const gesamtGewinn = steuerpflichtigeVerkaeufe.reduce((sum, v) => sum + (v.gewinn || 0), 0);
    const geschaetzteSteuer = gesamtGewinn * 0.26; // 26% Kapitalertragssteuer (vereinfacht)
    
    const steuerpflichtigeROI = roiEinnahmen.filter(r => r.steuerpflichtig);
    const gesamtROI = steuerpflichtigeROI.reduce((sum, r) => sum + (r.usdValue || 0), 0);

    // HTML Content generieren
    const htmlContent = generateTaxReportHTML({
      jahr,
      wallet,
      verkaeufe,
      roiEinnahmen,
      steuerpflichtigeVerkaeufe,
      gesamtGewinn,
      geschaetzteSteuer,
      steuerpflichtigeROI,
      gesamtROI,
      generatedAt: new Date().toLocaleString('de-DE')
    });

    // HTML Response (statt PDF)
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="Steuerreport_${jahr}_${wallet.substring(0, 8)}.html"`);
    res.send(htmlContent);

    console.log(`✅ Steuerreport HTML erfolgreich generiert (${Math.round(htmlContent.length / 1024)} KB)`);

  } catch (error) {
    console.error('❌ Fehler bei Steuerreport-Generierung:', error);
    res.status(500).json({
      error: 'HTML-Generierung fehlgeschlagen',
      details: error.message
    });
  }
}

/**
 * 📄 HTML-Template für Steuerreport
 */
function generateTaxReportHTML(data) {
  const {
    jahr, wallet, verkaeufe, roiEinnahmen, steuerpflichtigeVerkaeufe,
    gesamtGewinn, geschaetzteSteuer, steuerpflichtigeROI, gesamtROI, generatedAt
  } = data;

  return `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.4;
          color: #333;
          margin: 0;
          padding: 0;
        }
        
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          text-align: center;
          margin-bottom: 30px;
        }
        
        .header h1 {
          margin: 0;
          font-size: 28px;
        }
        
        .header p {
          margin: 10px 0 0 0;
          opacity: 0.9;
        }
        
        .summary {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 30px;
        }
        
        .summary h2 {
          color: #1a202c;
          margin-top: 0;
        }
        
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
          margin: 15px 0;
        }
        
        .stat-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 15px;
          text-align: center;
        }
        
        .stat-value {
          font-size: 24px;
          font-weight: bold;
          color: #667eea;
        }
        
        .stat-label {
          color: #718096;
          font-size: 14px;
          margin-top: 5px;
        }
        
        .section {
          margin-bottom: 30px;
        }
        
        .section h2 {
          color: #1a202c;
          border-bottom: 2px solid #667eea;
          padding-bottom: 10px;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 15px 0;
          font-size: 12px;
        }
        
        th, td {
          border: 1px solid #e2e8f0;
          padding: 8px;
          text-align: left;
        }
        
        th {
          background: #f7fafc;
          font-weight: bold;
        }
        
        tr:nth-child(even) {
          background: #f8fafc;
        }
        
        .steuerpflichtig {
          background: #fed7d7 !important;
          color: #c53030;
        }
        
        .steuer-hinweis {
          background: #fffbeb;
          border: 1px solid #f6ad55;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
        }
        
        .steuer-hinweis h3 {
          color: #c05621;
          margin-top: 0;
        }
        
        .footer {
          margin-top: 40px;
          padding: 20px;
          background: #f7fafc;
          border-radius: 8px;
          font-size: 12px;
          color: #718096;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>📊 Steuerreport ${jahr}</h1>
        <p>Wallet: ${wallet}</p>
        <p>Erstellt: ${generatedAt}</p>
      </div>

      <div class="summary">
        <h2>🎯 Zusammenfassung</h2>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">${verkaeufe.length}</div>
            <div class="stat-label">Gesamt Verkäufe</div>
          </div>
                     <div class="stat-card">
             <div class="stat-value">${steuerpflichtigeVerkaeufe.length}</div>
             <div class="stat-label">Steuerpflichtig</div>
           </div>
           <div class="stat-card">
             <div class="stat-value">${gesamtGewinn.toFixed(2)} EUR</div>
             <div class="stat-label">Gesamt Gewinn</div>
           </div>
          <div class="stat-card">
            <div class="stat-value">${geschaetzteSteuer.toFixed(2)} EUR</div>
            <div class="stat-label">Geschätzte Steuer</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${roiEinnahmen.length}</div>
            <div class="stat-label">ROI Einnahmen</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${gesamtROI.toFixed(2)} EUR</div>
            <div class="stat-label">ROI Gesamt</div>
          </div>
        </div>
      </div>

      <div class="section">
        <h2>💰 Verkäufe ${jahr}</h2>
        <table>
          <thead>
            <tr>
              <th>Datum</th>
              <th>Token</th>
              <th>Menge</th>
              <th>Preis (EUR)</th>
              <th>Haltedauer</th>
              <th>Gewinn (EUR)</th>
              <th>Steuer</th>
            </tr>
          </thead>
          <tbody>
            ${verkaeufe.map(t => `
              <tr class="${t.steuerpflichtig ? 'steuerpflichtig' : ''}">
                <td>${t.date || '-'}</td>
                <td>${t.token || '-'}</td>
                <td>${t.amount || '-'}</td>
                <td>${t.priceEUR ? t.priceEUR.toFixed(2) : '-'}</td>
                <td>${t.haltefrist || '-'}</td>
                <td>${t.gewinn ? t.gewinn.toFixed(2) : '-'}</td>
                <td>${t.steuerpflichtig ? '🚨 Ja' : '✅ Nein'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div class="section">
        <h2>📈 ROI-Einnahmen ${jahr}</h2>
        <table>
          <thead>
            <tr>
              <th>Datum</th>
              <th>Token</th>
              <th>Menge</th>
              <th>Wert (EUR)</th>
              <th>Quelle</th>
              <th>Steuer</th>
            </tr>
          </thead>
          <tbody>
            ${roiEinnahmen.map(r => `
              <tr class="${r.steuerpflichtig ? 'steuerpflichtig' : ''}">
                <td>${r.timestamp ? r.timestamp.substring(0, 10) : '-'}</td>
                <td>${r.token || '-'}</td>
                <td>${r.amount || '-'}</td>
                <td>${r.usdValue ? r.usdValue.toFixed(2) : '-'}</td>
                <td>${r.source || '-'}</td>
                <td>${r.steuerpflichtig ? '🚨 Ja' : '✅ Nein'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div class="steuer-hinweis">
        <h3>⚠️ Steuerlicher Hinweis</h3>
        <p><strong>Geschätzte Gesamtsteuer:</strong> ${geschaetzteSteuer.toFixed(2)} EUR</p>
        <p>Berechnung basiert auf vereinfachter Kapitalertragssteuer (26%). 
        Konsultieren Sie einen Steuerberater für genaue Berechnungen.</p>
        <p><strong>Haltedauer-Regel:</strong> Verkäufe nach mehr als 1 Jahr Haltedauer sind in Deutschland steuerfrei.</p>
      </div>

      <div class="footer">
        <p><strong>Generiert von PulseManager v0.1.9-MANUAL-CONTROL-ONLY</strong></p>
        <p>Dieser Report dient nur zu Informationszwecken. Keine Steuerberatung.</p>
        <p>Alle Angaben ohne Gewähr. Bei steuerlichen Fragen wenden Sie sich an einen Fachberater.</p>
      </div>
    </body>
    </html>
  `;
} 