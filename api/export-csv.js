/**
 * 📊 CSV EXPORT API
 * 
 * Vercel-Funktion für CSV Steuer-Reports
 */

import GermanTaxService from '../src/services/GermanTaxService.js';
import ExportService from '../src/services/ExportService.js';

export default async function handler(req, res) {
    console.log('📊 CSV Export API: Request empfangen');
    
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
        
        console.log(`📊 CSV Export für: ${targetWallet} (${targetYear})`);
        
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
                error: 'Keine Transaktionen für CSV-Export gefunden'
            });
        }
        
        // 2. CSV generieren
        const exportService = new ExportService();
        const csvResult = await exportService.generateCSVReport(taxReport);
        
        console.log(`✅ CSV Export erfolgreich: ${csvResult.filename}`);
        
        return res.status(200).json({
            success: true,
            message: 'CSV Steuer-Report erfolgreich erstellt',
            data: {
                filename: csvResult.filename,
                downloadUrl: csvResult.downloadUrl,
                content: csvResult.data,
                recordCount: taxReport.transactions.length,
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
        console.error('🚨 CSV Export Error:', error);
        
        return res.status(500).json({
            success: false,
            error: 'CSV Export fehlgeschlagen',
            details: error.message,
            code: error.code || 'CSV_EXPORT_ERROR'
        });
    }
} 