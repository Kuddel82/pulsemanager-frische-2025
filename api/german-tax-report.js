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

export default async function handler(req, res) {
    console.log('🇩🇪 Deutsche Steuer-API: Request empfangen');
    
    // CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    // 📋 INPUT-VALIDIERUNG
    const { 
        wallet, 
        walletAddress, 
        chainIds, 
        chain = 'ethereum',
        options = {},
        getAllPages = 'true',
        maxTransactions = 300000
    } = req.method === 'POST' ? req.body : req.query;
    
    // Flexibilität: wallet oder walletAddress
    const targetWallet = wallet || walletAddress;
    
    if (!targetWallet) {
        return res.status(400).json({
            error: 'Wallet-Adresse ist erforderlich',
            usage: 'POST /api/german-tax-report mit {"walletAddress": "0x..."}'
        });
    }
    
    if (!isValidWalletAddress(targetWallet)) {
        return res.status(400).json({
            error: 'Ungültige Wallet-Adresse',
            format: 'Ethereum-Format (0x...) erwartet',
            received: targetWallet
        });
    }

    // 🔧 STANDARD-KONFIGURATION
    const config = {
        chainIds: chainIds || ['0x1'], // Standardmäßig nur Ethereum für WGEP
        maxPages: getAllPages === 'true' ? 50 : 10,
        taxYear: options.taxYear || 2025,
        includeROI: true,
        includeTax: true
    };

    console.log(`🚀 Deutsche Steuerberechnung für: ${targetWallet}`);
    console.log(`📅 Steuerjahr: ${config.taxYear}`);
    console.log(`⛓️  Chains: ${config.chainIds.join(', ')}`);

    try {
        // 🏭 STEUERBERECHNUNG DURCHFÜHREN
        const startTime = Date.now();
        
        console.log('🇩🇪 Starte GermanTaxService...');
        const taxReport = await GermanTaxService.generateGermanTaxReport(targetWallet, config);
        
        const duration = Date.now() - startTime;
        console.log(`✅ Steuerberechnung abgeschlossen in ${duration}ms`);

        // 📊 RESPONSE AUFBAUEN (kompatibel mit Frontend)
        const response = {
            success: true,
            timestamp: new Date().toISOString(),
            duration: `${duration}ms`,
            wallet: targetWallet,
            taxYear: config.taxYear,
            
            // 🇩🇪 DEUTSCHE STEUER-ZUSAMMENFASSUNG
            germanSummary: taxReport.germanSummary,
            
            // 📈 TRANSACTION DATA (für Frontend-Kompatibilität)
            transactions: taxReport.transactions,
            summary: taxReport.summary || taxReport.germanSummary,
            
            // 📊 FIFO-ERGEBNISSE
            fifoResults: taxReport.fifoResults,
            
            // 📄 PDF-TABELLE
            taxTable: taxReport.taxTable,
            
            // 🔍 METADATA
            metadata: taxReport.metadata,
            
            // 📊 KOMPATIBILITÄTS-FELDER (für altes Frontend)
            totalTransactions: taxReport.transactions?.length || 0,
            taxRelevantTransactions: taxReport.transactions?.filter(tx => tx.taxRelevant).length || 0,
            
            // 💰 ROI-ZUSAMMENFASSUNG
            roiIncome: taxReport.germanSummary?.paragraph22?.total || 0,
            speculativeTransactions: taxReport.germanSummary?.speculativeTransactions || {
                withinSpeculationPeriod: { amount: 0, count: 0 },
                afterSpeculationPeriod: { amount: 0, count: 0 }
            },
            
            // 📄 EXPORT-OPTIONEN
            exports: {
                pdf: `Manuelle PDF-Generierung verfügbar`,
                csv: `CSV-Export in Entwicklung`,
                germanTaxReport: `Vollständiger deutscher Steuerreport`
            }
        };

        // 🎯 SUCCESS RESPONSE
        console.log(`✅ API Response bereit: ${response.totalTransactions} Transaktionen`);
        return res.status(200).json(response);

    } catch (error) {
        console.error('🚨 Deutsche Steuerberechnung fehlgeschlagen:', error);
        
        // 🔧 SPEZIFISCHES ERROR HANDLING
        if (error.message?.includes('Moralis')) {
            return res.status(503).json({
                error: 'Blockchain-Daten nicht verfügbar',
                message: 'Moralis API temporär nicht erreichbar',
                suggestion: 'Bitte versuchen Sie es in wenigen Minuten erneut',
                retryAfter: 60
            });
        }
        
        if (error.message?.includes('keine Transaktionen')) {
            return res.status(404).json({
                error: 'Keine Transaktionen gefunden',
                wallet: targetWallet,
                suggestion: 'Überprüfen Sie die Wallet-Adresse und Chain-IDs',
                supportedChains: ['0x1 (Ethereum)', '0x171 (PulseChain)']
            });
        }
        
        // 🚨 GENERAL ERROR
        return res.status(500).json({
            error: 'Interner Serverfehler',
            message: process.env.NODE_ENV === 'development' ? error.message : 'Steuerberechnung fehlgeschlagen',
            timestamp: new Date().toISOString(),
            wallet: targetWallet,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
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