/**
 * 🏛️ ELSTER XML EXPORT API
 * 
 * Vercel-Funktion für ELSTER XML Steuer-Reports
 */

import GermanTaxService from '../src/services/GermanTaxService.js';
import ExportService from '../src/services/ExportService.js';

export default async function handler(req, res) {
    console.log('🏛️ ELSTER XML Export API: Request empfangen');
    
    // CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    try {
        const { 
            wallet, 
            walletAddress, 
            year, 
            taxYear,
            taxpayer 
        } = req.method === 'POST' ? req.body : req.query;
        
        const targetWallet = wallet || walletAddress;
        const targetYear = year || taxYear || 2025;
        
        if (!targetWallet) {
            return res.status(400).json({
                success: false,
                error: 'Wallet-Adresse erforderlich'
            });
        }
        
        // Standard-Steuerpflichtige-Daten wenn nicht übergeben
        const taxpayerData = taxpayer || {
            name: 'Max Mustermann',
            street: 'Musterstraße 1',
            zipCode: '12345',
            city: 'Musterstadt',
            taxNumber: '12345678901'
        };
        
        console.log(`🏛️ ELSTER XML Export für: ${targetWallet} (${targetYear})`);
        
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
        
        if (!taxReport || taxReport.totalTaxableGains <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Keine steuerpflichtigen Gewinne für ELSTER-Export vorhanden',
                note: 'ELSTER XML wird nur bei steuerpflichtigen Gewinnen generiert'
            });
        }
        
        // 2. ELSTER XML generieren
        const exportService = new ExportService({
            testMode: process.env.NODE_ENV !== 'production'
        });
        
        const elsterResult = await exportService.generateElsterXML(taxReport, taxpayerData);
        
        console.log(`✅ ELSTER XML Export erfolgreich: ${elsterResult.filename}`);
        
        return res.status(200).json({
            success: true,
            message: 'ELSTER XML erfolgreich erstellt',
            data: {
                filename: elsterResult.filename,
                downloadUrl: elsterResult.downloadUrl,
                content: elsterResult.data,
                testMode: process.env.NODE_ENV !== 'production',
                warning: 'ELSTER XML ist nur für Testzwecke. Konsultieren Sie einen Steuerberater.',
                summary: {
                    totalTaxableGains: taxReport.totalTaxableGains,
                    totalTaxAmount: taxReport.totalTaxAmount,
                    paragraph23Gains: taxReport.paragraph23Gains,
                    paragraph22Gains: taxReport.paragraph22Gains,
                    taxYear: taxReport.taxYear,
                    walletAddress: targetWallet
                },
                taxpayer: {
                    name: taxpayerData.name,
                    city: taxpayerData.city,
                    taxNumber: taxpayerData.taxNumber ? 
                        taxpayerData.taxNumber.substring(0, 3) + '********' : 
                        'nicht angegeben'
                }
            }
        });
        
    } catch (error) {
        console.error('🚨 ELSTER XML Export Error:', error);
        
        return res.status(500).json({
            success: false,
            error: 'ELSTER XML Export fehlgeschlagen',
            details: error.message,
            code: error.code || 'ELSTER_EXPORT_ERROR'
        });
    }
} 