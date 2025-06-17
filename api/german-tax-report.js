/**
 * 🇩🇪 DEUTSCHE CRYPTO-STEUER API
 * 
 * Saubere API für deutsches Steuerrecht
 * - Korrekte Paragraphen (§22 & §23 EStG)
 * - Effiziente Moralis-Integration
 * - FIFO-Berechnung
 * - PDF-Export ready
 */

// Import des neuen GermanTaxService
import GermanTaxService from '../src/services/GermanTaxService.js';
// import TrialSafeGermanTaxService from '../src/services/TrialSafeGermanTaxService.js';
import ExportService from '../src/services/ExportService.js';

// 🚨 TRIAL-SAFE BUG-FIX FUNKTION (inline)
function safeTaxCalculation(reports) {
    console.log(`🔧 Safe Tax Calculation für:`, reports);
    
    if (!reports || !Array.isArray(reports) || reports.length === 0) {
        return { totalTax: 0, totalGains: 0, events: 0 };
    }

    try {
        const totalTax = reports.reduce((sum, report) => {
            const tax = report?.tax || report?.totalTax || report?.taxAmount || 0;
            const numericTax = parseFloat(tax);
            return sum + (isNaN(numericTax) ? 0 : numericTax);
        }, 0);

        const totalGains = reports.reduce((sum, report) => {
            const gains = report?.gains || report?.totalGains || report?.profit || 0;
            const numericGains = parseFloat(gains);
            return sum + (isNaN(numericGains) ? 0 : numericGains);
        }, 0);

        return {
            totalTax: Number(totalTax.toFixed(2)),
            totalGains: Number(totalGains.toFixed(2)),
            events: reports.length
        };

    } catch (error) {
        console.error(`🚨 Safe Tax Calculation Error:`, error);
        return { totalTax: 0, totalGains: 0, events: 0 };
    }
}

export default async function handler(req, res) {
    console.log('🚨 API CALLED:', req.method, req.url);
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        console.log('🔍 Request body:', req.body);
        
        const { address, phase } = req.body;

        if (!address) {
            return res.status(400).json({ error: 'Wallet address is required' });
        }

        console.log(`🔥 German Tax Report API: ${phase || 'STANDARD'} für ${address}`);

        let taxReport;

        // PHASE ROUTING
        switch (phase) {
            case 'TRIAL_SAFE_MODE':
                console.log('🚨 TRIAL-SAFE: Bug-Fix Mode Processing...');
                
                try {
                    // EINFACHER TRIAL-SAFE MODUS (ohne externe Services)
                    const demoEvents = [
                        {
                            date: new Date().toISOString(),
                            token: 'WGEP',
                            type: 'ROI_EVENT',
                            valueEUR: 850,
                            tax: 212.50,
                            gains: 510
                        },
                        {
                            date: new Date().toISOString(),
                            token: 'ETH',
                            type: 'DEMO_EVENT',
                            valueEUR: 3500,
                            tax: 875,
                            gains: 2100
                        }
                    ];

                    console.log('🚨 Demo events created:', demoEvents);

                    const summary = safeTaxCalculation(demoEvents);
                    console.log('🚨 Summary calculated:', summary);

                    taxReport = {
                        reports: demoEvents,
                        summary: summary,
                        transactionsProcessed: 2,
                        totalTransactions: 2,
                        totalROIIncome: summary.totalGains,
                        totalSpeculativeGains: summary.totalTax,
                        phase: 'TRIAL_SAFE_MODE',
                        priceSource: 'Demo Data (Trial Mode)',
                        trialInfo: '3 Tage verbleibend - Bug-Fix aktiv'
                    };
                    
                    console.log('🚨 Tax report created:', taxReport);
                    
                } catch (trialError) {
                    console.error('🚨 TRIAL-SAFE Error:', trialError);
                    throw trialError;
                }
                break;

            case 'PHASE_2_HISTORICAL':
                console.log('🚀 PHASE 2: CoinGecko Historical Processing...');
                
                const germanTaxService2 = new GermanTaxService();
                
                // Lade Transaktionen
                const transactions2 = await germanTaxService2.apiService.getAllTransactionsEnterprise(
                    address, 
                    ['0x1', '0x171'], 
                    2024
                );
                
                // Phase 2 Berechnung mit historischen Preisen
                taxReport = await germanTaxService2.calculateTaxWithHistoricalPrices(transactions2);
                break;

            case 'PHASE_3_MORALIS_PRO':
                console.log('🔥 PHASE 3: Moralis Pro Processing...');
                
                const germanTaxService3 = new GermanTaxService();
                
                // Lade Transaktionen
                const moralisTransactions = await germanTaxService3.apiService.getAllTransactionsEnterprise(
                    address, 
                    ['0x1', '0x171'], 
                    2024
                );
                
                // Phase 3 Berechnung mit Moralis Pro
                taxReport = await germanTaxService3.calculateTaxWithMoralisPro(moralisTransactions, address);
                break;

            default:
                console.log('📊 STANDARD: Normale Steuerberechnung...');
                const germanTaxService = new GermanTaxService();
                taxReport = await germanTaxService.generateGermanTaxReport(address);
                break;
        }

        console.log('🔍 Tax report ready, preparing response...');

        // PDF Generation (optional - nur wenn verfügbar)
        let pdfBuffer = null;
        try {
            if (phase !== 'TRIAL_SAFE_MODE') {
                const germanTaxService = new GermanTaxService();
                pdfBuffer = await germanTaxService.generatePDF(taxReport, address);
            }
        } catch (pdfError) {
            console.warn('⚠️ PDF Generation failed:', pdfError.message);
            // PDF-Fehler nicht kritisch - weiter ohne PDF
        }

        const response = {
            success: true,
            taxReport: {
                ...taxReport,
                pdfBuffer: pdfBuffer
            },
            phase: phase || 'STANDARD',
            timestamp: new Date().toISOString()
        };

        console.log('✅ Sending successful response');
        return res.status(200).json(response);

    } catch (error) {
        console.error(`❌ German Tax Report API Error:`, error);
        console.error(`❌ Error stack:`, error.stack);
        
        const errorResponse = {
            success: false,
            error: error.message,
            phase: req.body?.phase || 'STANDARD',
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
            timestamp: new Date().toISOString()
        };

        console.log('❌ Sending error response:', errorResponse);
        return res.status(500).json(errorResponse);
    }
}

// 🔍 HILFSFUNKTIONEN
function isValidWalletAddress(address) {
    if (!address || typeof address !== 'string') return false;
    
    // Ethereum-Format: 0x + 40 Hex-Zeichen
    const ethRegex = /^0x[a-fA-F0-9]{40}$/;
    return ethRegex.test(address);
}

// 📋 API-DOKUMENTATION
/*
POST /api/german-tax-report

REQUEST BODY:
{
    "walletAddress": "0x742d35Cc6634C0532925a3b8D85E2C5b0b6c6F98",
    "chainIds": ["0x1"],
    "options": {
        "taxYear": 2025,
        "includeROI": true
    }
}

RESPONSE:
{
    "success": true,
    "wallet": "0x742d35Cc6634C0532925a3b8D85E2C5b0b6c6F98",
    "germanSummary": {
        "paragraph22": {
            "roiIncome": 1234.56,
            "total": 1234.56,
            "note": "§22 EStG - Sonstige Einkünfte"
        },
        "paragraph23": {
            "taxableGains": 567.89,
            "taxFreeGains": 123.45,
            "freigrenze600": {...}
        }
    },
    "transactions": [...],
    "fifoResults": [...],
    "taxTable": [...]
}
*/ 