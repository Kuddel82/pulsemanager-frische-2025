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

        const germanTaxService = new GermanTaxService();

        let taxReport;

        // PHASE ROUTING
        switch (phase) {
            case 'PHASE_2_HISTORICAL':
                console.log('🚀 PHASE 2: CoinGecko Historical Processing...');
                
                // Lade Transaktionen
                const transactions = await germanTaxService.apiService.getAllTransactionsEnterprise(
                    address, 
                    ['0x1', '0x171'], 
                    2024
                );
                
                // Phase 2 Berechnung mit historischen Preisen
                taxReport = await germanTaxService.calculateTaxWithHistoricalPrices(transactions);
                break;

            case 'PHASE_3_MORALIS_PRO':
                console.log('🔥 PHASE 3: Moralis Pro Processing...');
                
                // Lade Transaktionen
                const moralisTransactions = await germanTaxService.apiService.getAllTransactionsEnterprise(
                    address, 
                    ['0x1', '0x171'], 
                    2024
                );
                
                // Phase 3 Berechnung mit Moralis Pro
                taxReport = await germanTaxService.calculateTaxWithMoralisPro(moralisTransactions, address);
                break;

            default:
                console.log('📊 STANDARD: Normale Steuerberechnung...');
                taxReport = await germanTaxService.generateGermanTaxReport(address);
                break;
        }

        // PDF Generation
        const pdfBuffer = await germanTaxService.generatePDF(taxReport, address);

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