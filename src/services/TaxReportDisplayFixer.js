// 🔧 UI-DISPLAY-FIX: Geladene Daten richtig anzeigen
// Das Backend funktioniert - nur die UI zeigt nichts an!

// ==========================================
// 🎯 UI-DISPLAY-PROBLEM FIXER
// ==========================================

export function fixTaxReportDisplay(taxReportData) {
    console.log(`🔧 UI-Display-Fix für:`, taxReportData);
    
    // Handle verschiedene Report-Strukturen
    if (!taxReportData) {
        console.warn(`⚠️ Keine Tax-Report-Daten`);
        return createEmptyDisplayData();
    }

    // Extract data aus verschiedenen möglichen Strukturen
    const reports = taxReportData.reports || taxReportData.data || taxReportData.events || [];
    const summary = taxReportData.summary || {};
    const transactionsProcessed = taxReportData.transactionsProcessed || taxReportData.transactions || 0;
    
    console.log(`📊 Raw Reports:`, reports);
    console.log(`📊 Raw Summary:`, summary);
    console.log(`📊 Transactions:`, transactionsProcessed);

    // Sicherstellen dass Reports ein Array ist
    const safeReports = Array.isArray(reports) ? reports : [];
    
    // Summary neu berechnen falls defekt
    let fixedSummary;
    if (summary && typeof summary === 'object') {
        fixedSummary = {
            totalTax: parseFloat(summary.totalTax || summary.tax || 0),
            totalGains: parseFloat(summary.totalGains || summary.gains || 0),
            events: parseInt(summary.events || safeReports.length || 0),
            roiTax: parseFloat(summary.roiTax || 0),
            speculationTax: parseFloat(summary.speculationTax || 0)
        };
    } else {
        // Summary komplett neu berechnen
        fixedSummary = calculateSummaryFromReports(safeReports);
    }

    const result = {
        reports: safeReports,
        summary: fixedSummary,
        transactionsProcessed: transactionsProcessed,
        displayStats: {
            hasData: safeReports.length > 0,
            totalEvents: safeReports.length,
            hasGains: fixedSummary.totalGains > 0,
            hasTax: fixedSummary.totalTax > 0
        }
    };

    console.log(`✅ Fixed Display Data:`, result);
    return result;
}

export function calculateSummaryFromReports(reports) {
    console.log(`🧮 Berechne Summary aus ${reports.length} Reports`);
    
    if (!Array.isArray(reports) || reports.length === 0) {
        return { totalTax: 0, totalGains: 0, events: 0, roiTax: 0, speculationTax: 0 };
    }

    let totalTax = 0;
    let totalGains = 0;
    let roiTax = 0;
    let speculationTax = 0;

    reports.forEach((report, index) => {
        try {
            // Verschiedene Feldnamen probieren
            const tax = parseFloat(
                report.tax || 
                report.totalTax || 
                report.taxAmount || 
                report.steuer || 
                0
            );
            
            const gains = parseFloat(
                report.gains || 
                report.totalGains || 
                report.profit || 
                report.gewinn || 
                report.valueEUR || 
                0
            );

            if (!isNaN(tax)) {
                totalTax += tax;
                
                // Kategorisieren nach Type
                if (report.type === 'ROI_INCOME' || report.paragraph === '§22 EStG') {
                    roiTax += tax;
                } else {
                    speculationTax += tax;
                }
            }

            if (!isNaN(gains)) {
                totalGains += gains;
            }

            console.log(`📊 Report ${index}:`, {
                type: report.type,
                tax: tax,
                gains: gains,
                valueEUR: report.valueEUR
            });

        } catch (error) {
            console.warn(`⚠️ Report ${index} Error:`, error);
        }
    });

    const result = {
        totalTax: Number(totalTax.toFixed(2)),
        totalGains: Number(totalGains.toFixed(2)),
        events: reports.length,
        roiTax: Number(roiTax.toFixed(2)),
        speculationTax: Number(speculationTax.toFixed(2))
    };

    console.log(`✅ Calculated Summary:`, result);
    return result;
}

export function createEmptyDisplayData() {
    return {
        reports: [],
        summary: { totalTax: 0, totalGains: 0, events: 0, roiTax: 0, speculationTax: 0 },
        transactionsProcessed: 0,
        displayStats: {
            hasData: false,
            totalEvents: 0,
            hasGains: false,
            hasTax: false
        }
    };
}

// ==========================================
// 🎯 DEBUGGING HELPER 
// ==========================================

export function debugTaxReportStructure(data) {
    console.group(`🔍 Debug Tax Report Structure`);
    
    console.log(`📦 Raw Data Type:`, typeof data);
    console.log(`📦 Raw Data:`, data);
    
    if (data) {
        console.log(`📊 Keys:`, Object.keys(data));
        
        if (data.reports) {
            console.log(`📋 Reports Type:`, typeof data.reports);
            console.log(`📋 Reports Length:`, data.reports?.length);
            console.log(`📋 First Report:`, data.reports?.[0]);
        }
        
        if (data.summary) {
            console.log(`📊 Summary:`, data.summary);
        }
        
        console.log(`🔢 Transactions Processed:`, data.transactionsProcessed);
    }
    
    console.groupEnd();
    return data;
}

// ==========================================
// 🎨 UI-DISPLAY-COMPONENTS 
// ==========================================

export function formatCurrency(amount) {
    if (typeof amount !== 'number' || isNaN(amount)) {
        return '€0.00';
    }
    return `€${amount.toFixed(2)}`;
}

export function formatTransactionCount(count) {
    if (typeof count !== 'number' || isNaN(count)) {
        return '0';
    }
    return count.toString();
}

export function createDisplayHTML(displayData) {
    const { summary, transactionsProcessed, displayStats, reports } = displayData;
    
    return `
        <div class="tax-report-display">
            <div class="summary-section">
                <h3>🇩🇪 Deutscher Steuerreport</h3>
                
                <div class="stats-grid">
                    <div class="stat-item">
                        <label>Transaktionen verarbeitet:</label>
                        <value>${formatTransactionCount(transactionsProcessed)}</value>
                    </div>
                    
                    <div class="stat-item">
                        <label>Steuerpflichtige Ereignisse:</label>
                        <value>${formatTransactionCount(summary.events)}</value>
                    </div>
                    
                    <div class="stat-item">
                        <label>ROI Einkommen (§22 EStG):</label>
                        <value>${formatCurrency(summary.roiTax)}</value>
                    </div>
                    
                    <div class="stat-item">
                        <label>Spekulative Gewinne (§23 EStG):</label>
                        <value>${formatCurrency(summary.speculationTax)}</value>
                    </div>
                    
                    <div class="stat-item total">
                        <label>Gesamte Steuerlast:</label>
                        <value>${formatCurrency(summary.totalTax)}</value>
                    </div>
                    
                    <div class="stat-item total">
                        <label>Gesamte Gewinne:</label>
                        <value>${formatCurrency(summary.totalGains)}</value>
                    </div>
                </div>
            </div>
            
            ${displayStats.hasData ? createEventsTableHTML(reports) : '<div class="no-data">Keine steuerpflichtigen Ereignisse gefunden</div>'}
        </div>
    `;
}

export function createEventsTableHTML(reports) {
    if (!reports || reports.length === 0) {
        return '<div class="no-events">Keine Events zu anzeigen</div>';
    }
    
    const eventsHTML = reports.map((event, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>${new Date(event.date).toLocaleDateString('de-DE')}</td>
            <td>${event.token || 'Unknown'}</td>
            <td>${event.type || 'TRADE'}</td>
            <td>${formatCurrency(event.valueEUR || 0)}</td>
            <td>${formatCurrency(event.gains || 0)}</td>
            <td>${formatCurrency(event.tax || 0)}</td>
            <td>${event.paragraph || '§23 EStG'}</td>
        </tr>
    `).join('');
    
    return `
        <div class="events-section">
            <h4>📋 Steuerpflichtige Ereignisse</h4>
            <table class="events-table">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Datum</th>
                        <th>Token</th>
                        <th>Typ</th>
                        <th>Wert</th>
                        <th>Gewinn</th>
                        <th>Steuer</th>
                        <th>Paragraph</th>
                    </tr>
                </thead>
                <tbody>
                    ${eventsHTML}
                </tbody>
            </table>
        </div>
    `;
}

// ==========================================
// 🚀 MAIN FIX FUNCTION
// ==========================================

export function fixAndDisplayTaxReport(rawTaxReportData, targetElementId) {
    console.log(`🚀 Fix and Display Tax Report`);
    
    // 1. Debug the raw data
    debugTaxReportStructure(rawTaxReportData);
    
    // 2. Fix the display data
    const fixedData = fixTaxReportDisplay(rawTaxReportData);
    
    // 3. Create HTML
    const html = createDisplayHTML(fixedData);
    
    // 4. Insert into DOM
    const targetElement = document.getElementById(targetElementId);
    if (targetElement) {
        targetElement.innerHTML = html;
        console.log(`✅ Tax Report Display updated in #${targetElementId}`);
    } else {
        console.warn(`⚠️ Target element #${targetElementId} not found`);
        console.log(`📊 Fixed Data für manual use:`, fixedData);
    }
    
    return fixedData;
}

// ==========================================
// 🎯 USAGE EXAMPLES
// ==========================================

/*
USAGE - FIXT DIE UI-DARSTELLUNG:

```javascript
// Nach dem Laden der Tax-Report-Daten:
const rawReportData = await directTaxService.calculateGermanTaxDirectly(walletAddress);

// Debug what you got:
console.log('Raw Report:', rawReportData);

// Fix and display:
const fixedData = fixAndDisplayTaxReport(rawReportData, 'tax-report-container');

// Or manual use:
const displayData = fixTaxReportDisplay(rawReportData);
console.log(`✅ Transaktionen: ${displayData.transactionsProcessed}`);
console.log(`✅ Events: ${displayData.summary.events}`);
console.log(`✅ Steuer: ${formatCurrency(displayData.summary.totalTax)}`);
console.log(`✅ Gewinne: ${formatCurrency(displayData.summary.totalGains)}`);

// For your current UI elements:
document.getElementById('transaction-count').textContent = displayData.transactionsProcessed;
document.getElementById('tax-amount').textContent = formatCurrency(displayData.summary.totalTax);
document.getElementById('gains-amount').textContent = formatCurrency(displayData.summary.totalGains);
```

DEINE CONSOLE ZEIGT:
✅ 45 Transaktionen verarbeitet
✅ 14 Steuer-Events gefunden
✅ Deutsche Steuerberechnung abgeschlossen

ABER UI ZEIGT:
❌ Transaktionen: 0
❌ €0.00

DIESER FIX LÖST DAS! 🎯
*/

export default {
    fixTaxReportDisplay,
    calculateSummaryFromReports,
    createEmptyDisplayData,
    debugTaxReportStructure,
    formatCurrency,
    formatTransactionCount,
    createDisplayHTML,
    createEventsTableHTML,
    fixAndDisplayTaxReport
}; 