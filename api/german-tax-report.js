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
import TrialSafeGermanTaxService from '../src/services/TrialSafeGermanTaxService.js';
import ExportService from '../src/services/ExportService.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
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
                
                const trialService = new TrialSafeGermanTaxService(process.env.VITE_MORALIS_API_KEY);
                
                // Lade Transaktionen (trial-safe)
                try {
                    const germanTaxService = new GermanTaxService();
                    const transactions = await germanTaxService.apiService.getAllTransactionsEnterprise(
                        address, 
                        ['0x1', '0x171'], 
                        2024
                    );
                    
                    // Trial-Safe Berechnung mit Bug-Fixes
                    taxReport = await trialService.calculateTaxSafely(transactions);
                } catch (error) {
                    console.warn('⚠️ Transaction loading failed, using demo mode:', error.message);
                    // Fallback zu Demo-Daten
                    taxReport = await trialService.calculateTaxSafely([]);
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

        return res.status(200).json({
            success: true,
            taxReport: {
                ...taxReport,
                pdfBuffer: pdfBuffer
            },
            phase: phase || 'STANDARD',
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error(`❌ German Tax Report API Error:`, error);
        
        return res.status(500).json({
            success: false,
            error: error.message,
            phase: req.body.phase || 'STANDARD'
        });
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