/**
 * 📄 PDF EXPORT API
 * 
 * Vercel-Funktion für PDF Steuer-Reports
 */

import GermanTaxService from '../src/services/GermanTaxService.js';
import ExportService from '../src/services/ExportService.js';

export default async function handler(req, res) {
    console.log('📄 PDF Export API: Request empfangen');
    
    // CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    try {
        const { wallet, walletAddress, year, taxYear } = req.method === 'POST' ? req.body : req.query;
        const targetWallet = wallet || walletAddress;
        const targetYear = year || taxYear || 2025;
        
        if (!targetWallet) {
            return res.status(400).json({
                success: false,
                error: 'Wallet-Adresse erforderlich'
            });
        }
        
        console.log(`📄 PDF Export für: ${targetWallet} (${targetYear})`);
        
        // 1. Steuerbericht berechnen
        const taxService = new GermanTaxService({
            moralisApiKey: process.env.MORALIS_API_KEY,
            coinGeckoApiKey: process.env.COINGECKO_API_KEY,
            cmcApiKey: process.env.CMC_API_KEY
        });
        
        const config = {
            chains: ['0x1'],
            taxYear: parseInt(targetYear),
            includeDeFi: true,
            includeNFTs: false,
            walletAddress: targetWallet
        };
        
        const taxReport = await taxService.calculateTaxes(targetWallet, config);
        
        if (!taxReport || !taxReport.transactions?.length) {
            return res.status(404).json({
                success: false,
                error: 'Keine steuerpflichtigen Transaktionen gefunden'
            });
        }
        
        // 2. PDF generieren
        const exportService = new ExportService();
        const pdfResult = await exportService.generatePDFReport(taxReport);
        
        console.log(`✅ PDF Export erfolgreich: ${pdfResult.filename}`);
        
        return res.status(200).json({
            success: true,
            message: 'PDF Steuer-Report erfolgreich erstellt',
            data: {
                filename: pdfResult.filename,
                downloadUrl: pdfResult.downloadUrl,
                content: pdfResult.data,
                summary: {
                    totalTaxableGains: taxReport.totalTaxableGains,
                    totalTaxAmount: taxReport.totalTaxAmount,
                    transactionCount: taxReport.transactions.length,
                    taxYear: taxReport.taxYear,
                    walletAddress: targetWallet
                }
            }
        });
        
    } catch (error) {
        console.error('🚨 PDF Export Error:', error);
        
        return res.status(500).json({
            success: false,
            error: 'PDF Export fehlgeschlagen',
            details: error.message,
            code: error.code || 'PDF_EXPORT_ERROR'
        });
    }
} 