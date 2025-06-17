/**
 * 🚀 EXPORT API ROUTES
 * 
 * REST API für Steuer-Report Exports
 * - PDF Download
 * - CSV Export
 * - ELSTER XML
 * - Batch Exports
 * - Download Management
 */

import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import ExportService from '../src/services/ExportService.js';
import GermanTaxService from '../src/services/GermanTaxService.js';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const router = express.Router();

// 📊 Export Service initialisieren
const exportService = new ExportService({
    outputDir: process.env.EXPORT_DIR || './exports',
    testMode: process.env.NODE_ENV !== 'production'
});

// 🔍 Validation Schemas
const walletValidation = [
    param('walletAddress')
        .isLength({ min: 26, max: 62 })
        .matches(/^[a-zA-Z0-9]+$/)
        .withMessage('Ungültige Wallet-Adresse'),
    
    param('taxYear')
        .isInt({ min: 2009, max: new Date().getFullYear() })
        .withMessage('Ungültiges Steuerjahr')
];

const exportOptionsValidation = [
    body('includeTransactions')
        .optional()
        .isBoolean()
        .withMessage('includeTransactions muss boolean sein'),
    
    body('includeLegalNotices')
        .optional()
        .isBoolean()
        .withMessage('includeLegalNotices muss boolean sein'),
    
    body('language')
        .optional()
        .isIn(['de', 'en'])
        .withMessage('Sprache muss "de" oder "en" sein'),
    
    body('format')
        .optional()
        .isIn(['detailed', 'summary'])
        .withMessage('Format muss "detailed" oder "summary" sein')
];

const taxpayerValidation = [
    body('taxpayer.name')
        .notEmpty()
        .isLength({ max: 100 })
        .withMessage('Name ist erforderlich (max. 100 Zeichen)'),
    
    body('taxpayer.taxNumber')
        .optional()
        .matches(/^\d{11}$/)
        .withMessage('Steuernummer muss 11 Ziffern haben'),
    
    body('taxpayer.street')
        .optional()
        .isLength({ max: 100 })
        .withMessage('Straße max. 100 Zeichen'),
    
    body('taxpayer.zipCode')
        .optional()
        .matches(/^\d{5}$/)
        .withMessage('PLZ muss 5 Ziffern haben'),
    
    body('taxpayer.city')
        .optional()
        .isLength({ max: 50 })
        .withMessage('Ort max. 50 Zeichen')
];

/**
 * 📄 PDF REPORT GENERIEREN
 * POST /api/exports/:walletAddress/:taxYear/pdf
 */
router.post('/exports/:walletAddress/:taxYear/pdf',
    ...walletValidation,
    ...exportOptionsValidation,
    async (req, res) => {
        try {
            // Validierung prüfen
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    error: 'Validierungsfehler',
                    details: errors.array()
                });
            }

            const { walletAddress, taxYear } = req.params;
            const options = req.body;

            console.log(`📄 PDF Export angefordert: ${walletAddress} (${taxYear})`);

            // 1. Steuerbericht berechnen
            const taxService = new GermanTaxService({
                moralisApiKey: process.env.MORALIS_API_KEY,
                coinGeckoApiKey: process.env.COINGECKO_API_KEY,
                cmcApiKey: process.env.CMC_API_KEY
            });

            const config = {
                chains: ['0x1'], // Default: Ethereum
                taxYear: parseInt(taxYear),
                includeDeFi: true,
                includeNFTs: false,
                walletAddress: walletAddress
            };

            const taxReport = await taxService.calculateTaxes(walletAddress, config);

            if (!taxReport || !taxReport.transactions?.length) {
                return res.status(404).json({
                    success: false,
                    error: 'Keine steuerpflichtigen Transaktionen gefunden'
                });
            }

            // 2. PDF generieren
            const pdfResult = await exportService.generatePDFReport(taxReport, {
                includeTransactions: options.includeTransactions !== false,
                includeLegalNotices: options.includeLegalNotices !== false,
                language: options.language || 'de',
                format: options.format || 'detailed'
            });

            // 3. Download-Link erstellen
            const downloadToken = generateDownloadToken(pdfResult.filename);
            
            // 4. Erfolgsmeldung
            res.status(201).json({
                success: true,
                message: 'PDF Steuerbericht erfolgreich erstellt',
                data: {
                    filename: pdfResult.filename,
                    downloadUrl: pdfResult.downloadUrl || `/api/exports/download/${downloadToken}`,
                    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
                    summary: {
                        totalTaxableGains: taxReport.totalTaxableGains,
                        totalTaxAmount: taxReport.totalTaxAmount,
                        transactionCount: taxReport.transactions.length,
                        taxYear: taxReport.taxYear
                    }
                }
            });

            console.log(`✅ PDF Export erfolgreich: ${pdfResult.filename}`);

        } catch (error) {
            console.error('🚨 PDF Export Error:', error);
            res.status(500).json({
                success: false,
                error: 'PDF Export fehlgeschlagen',
                details: error.message,
                code: error.code || 'EXPORT_ERROR'
            });
        }
    }
);

/**
 * 📊 CSV REPORT GENERIEREN
 * POST /api/exports/:walletAddress/:taxYear/csv
 */
router.post('/exports/:walletAddress/:taxYear/csv',
    ...walletValidation,
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    error: 'Validierungsfehler',
                    details: errors.array()
                });
            }

            const { walletAddress, taxYear } = req.params;

            console.log(`📊 CSV Export angefordert: ${walletAddress} (${taxYear})`);

            // Steuerbericht berechnen
            const taxService = new GermanTaxService({
                moralisApiKey: process.env.MORALIS_API_KEY,
                coinGeckoApiKey: process.env.COINGECKO_API_KEY,
                cmcApiKey: process.env.CMC_API_KEY
            });

            const config = {
                chains: ['0x1'],
                taxYear: parseInt(taxYear),
                includeDeFi: true,
                includeNFTs: false,
                walletAddress: walletAddress
            };

            const taxReport = await taxService.calculateTaxes(walletAddress, config);

            if (!taxReport || !taxReport.transactions?.length) {
                return res.status(404).json({
                    success: false,
                    error: 'Keine Transaktionen für CSV-Export gefunden'
                });
            }

            // CSV generieren
            const csvResult = await exportService.generateCSVReport(taxReport);
            const downloadToken = generateDownloadToken(csvResult.filename);

            res.status(201).json({
                success: true,
                message: 'CSV Steuerbericht erfolgreich erstellt',
                data: {
                    filename: csvResult.filename,
                    downloadUrl: csvResult.downloadUrl || `/api/exports/download/${downloadToken}`,
                    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    recordCount: taxReport.transactions.length
                }
            });

            console.log(`✅ CSV Export erfolgreich: ${csvResult.filename}`);

        } catch (error) {
            console.error('🚨 CSV Export Error:', error);
            res.status(500).json({
                success: false,
                error: 'CSV Export fehlgeschlagen',
                details: error.message,
                code: error.code || 'EXPORT_ERROR'
            });
        }
    }
);

/**
 * 🏛️ ELSTER XML GENERIEREN
 * POST /api/exports/:walletAddress/:taxYear/elster
 */
router.post('/exports/:walletAddress/:taxYear/elster',
    ...walletValidation,
    ...taxpayerValidation,
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    error: 'Validierungsfehler',
                    details: errors.array()
                });
            }

            const { walletAddress, taxYear } = req.params;
            const { taxpayer } = req.body;

            console.log(`🏛️ ELSTER XML Export angefordert: ${walletAddress} (${taxYear})`);

            // Steuerbericht berechnen
            const taxService = new GermanTaxService({
                moralisApiKey: process.env.MORALIS_API_KEY,
                coinGeckoApiKey: process.env.COINGECKO_API_KEY,
                cmcApiKey: process.env.CMC_API_KEY
            });

            const config = {
                chains: ['0x1'],
                taxYear: parseInt(taxYear),
                includeDeFi: true,
                includeNFTs: false,
                walletAddress: walletAddress
            };

            const taxReport = await taxService.calculateTaxes(walletAddress, config);

            if (!taxReport || taxReport.totalTaxableGains <= 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Keine steuerpflichtigen Gewinne für ELSTER-Export vorhanden'
                });
            }

            // ELSTER XML generieren
            const elsterResult = await exportService.generateElsterXML(
                taxReport, 
                taxpayer,
                { testMode: process.env.NODE_ENV !== 'production' }
            );

            const downloadToken = generateDownloadToken(elsterResult.filename);

            res.status(201).json({
                success: true,
                message: 'ELSTER XML erfolgreich erstellt',
                data: {
                    filename: elsterResult.filename,
                    downloadUrl: elsterResult.downloadUrl || `/api/exports/download/${downloadToken}`,
                    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    warning: 'ELSTER XML ist nur für Testzwecke. Konsultieren Sie einen Steuerberater.'
                }
            });

            console.log(`✅ ELSTER XML Export erfolgreich: ${elsterResult.filename}`);

        } catch (error) {
            console.error('🚨 ELSTER Export Error:', error);
            res.status(500).json({
                success: false,
                error: 'ELSTER Export fehlgeschlagen',
                details: error.message,
                code: error.code || 'EXPORT_ERROR'
            });
        }
    }
);

/**
 * 📦 BATCH EXPORT (Alle Formate)
 * POST /api/exports/:walletAddress/:taxYear/batch
 */
router.post('/exports/:walletAddress/:taxYear/batch',
    ...walletValidation,
    ...exportOptionsValidation,
    ...taxpayerValidation,
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    error: 'Validierungsfehler',
                    details: errors.array()
                });
            }

            const { walletAddress, taxYear } = req.params;
            const { taxpayer, ...options } = req.body;

            console.log(`📦 Batch Export angefordert: ${walletAddress} (${taxYear})`);

            // Steuerbericht berechnen
            const taxService = new GermanTaxService({
                moralisApiKey: process.env.MORALIS_API_KEY,
                coinGeckoApiKey: process.env.COINGECKO_API_KEY,
                cmcApiKey: process.env.CMC_API_KEY
            });

            const config = {
                chains: ['0x1'],
                taxYear: parseInt(taxYear),
                includeDeFi: true,
                includeNFTs: false,
                walletAddress: walletAddress
            };

            const taxReport = await taxService.calculateTaxes(walletAddress, config);

            if (!taxReport || !taxReport.transactions?.length) {
                return res.status(404).json({
                    success: false,
                    error: 'Keine Transaktionen für Batch-Export gefunden'
                });
            }

            // Parallel alle Formate generieren
            const results = await Promise.allSettled([
                exportService.generatePDFReport(taxReport, options),
                exportService.generateCSVReport(taxReport),
                taxpayer ? exportService.generateElsterXML(taxReport, taxpayer) : null
            ].filter(Boolean));

            const exports = [];
            const errors = [];

            // Ergebnisse verarbeiten
            results.forEach((result, index) => {
                const formats = ['PDF', 'CSV', 'ELSTER'];
                
                if (result.status === 'fulfilled' && result.value) {
                    exports.push({
                        format: formats[index],
                        filename: result.value.filename,
                        downloadUrl: result.value.downloadUrl || `/api/exports/download/${generateDownloadToken(result.value.filename)}`
                    });
                } else if (result.status === 'rejected') {
                    errors.push({
                        format: formats[index],
                        error: result.reason.message
                    });
                }
            });

            res.status(201).json({
                success: true,
                message: `Batch Export abgeschlossen: ${exports.length} Dateien erstellt`,
                data: {
                    exports,
                    errors: errors.length > 0 ? errors : undefined,
                    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    summary: {
                        totalTaxableGains: taxReport.totalTaxableGains,
                        totalTaxAmount: taxReport.totalTaxAmount,
                        transactionCount: taxReport.transactions.length
                    }
                }
            });

            console.log(`✅ Batch Export abgeschlossen: ${exports.length} Dateien`);

        } catch (error) {
            console.error('🚨 Batch Export Error:', error);
            res.status(500).json({
                success: false,
                error: 'Batch Export fehlgeschlagen',
                details: error.message,
                code: error.code || 'EXPORT_ERROR'
            });
        }
    }
);

/**
 * 📥 DATEI DOWNLOAD
 * GET /api/exports/download/:token
 */
router.get('/download/:token',
    param('token').isLength({ min: 32, max: 256 }).withMessage('Ungültiger Download-Token'),
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    error: 'Ungültiger Download-Token'
                });
            }

            const { token } = req.params;
            
            // Token validieren und Dateiname extrahieren
            const filename = validateDownloadToken(token);
            if (!filename) {
                return res.status(401).json({
                    success: false,
                    error: 'Download-Token ist ungültig oder abgelaufen'
                });
            }

            // In Browser-Umgebung: Weiterleitung zur Download-URL
            if (filename.includes('data:')) {
                return res.redirect(filename);
            }

            // MIME-Type bestimmen
            const ext = path.extname(filename).toLowerCase();
            const mimeTypes = {
                '.pdf': 'application/pdf',
                '.csv': 'text/csv',
                '.xml': 'application/xml'
            };
            
            const mimeType = mimeTypes[ext] || 'application/octet-stream';

            // Headers setzen
            res.setHeader('Content-Type', mimeType);
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            
            // Download loggen
            console.log(`📥 Datei heruntergeladen: ${filename}`);

            // Dummy-Inhalt für Browser-Kompatibilität
            res.send(`Download bereit: ${filename}`);

        } catch (error) {
            console.error('🚨 Download Error:', error);
            res.status(500).json({
                success: false,
                error: 'Download fehlgeschlagen',
                details: error.message
            });
        }
    }
);

/**
 * 🧹 CLEANUP ALTE EXPORTS
 * POST /api/exports/cleanup
 */
router.post('/cleanup',
    body('olderThanDays').optional().isInt({ min: 1, max: 365 }).withMessage('olderThanDays zwischen 1-365'),
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    error: 'Validierungsfehler',
                    details: errors.array()
                });
            }

            const olderThanDays = req.body.olderThanDays || 30;

            const result = await exportService.cleanup(olderThanDays);

            res.json({
                success: true,
                message: `Cleanup abgeschlossen: ${result.deletedCount} Dateien gelöscht`,
                data: {
                    deletedCount: result.deletedCount,
                    olderThanDays
                }
            });

            console.log(`🧹 Export Cleanup: ${result.deletedCount} Dateien gelöscht`);

        } catch (error) {
            console.error('🚨 Cleanup Error:', error);
            res.status(500).json({
                success: false,
                error: 'Cleanup fehlgeschlagen',
                details: error.message
            });
        }
    }
);

/**
 * 🔧 HILFSFUNKTIONEN
 */

// Download-Token generieren (24h gültig)
function generateDownloadToken(filename) {
    try {
        const payload = {
            filename,
            expires: Date.now() + 24 * 60 * 60 * 1000 // 24h
        };
        
        const secret = process.env.JWT_SECRET || 'fallback-secret';
        const token = crypto.createHash('sha256')
            .update(JSON.stringify(payload) + secret)
            .digest('hex');
            
        // Token mit Payload base64 encodieren
        return Buffer.from(JSON.stringify({ token, ...payload })).toString('base64');
    } catch (error) {
        console.error('Token Generation Error:', error);
        return crypto.randomBytes(32).toString('hex');
    }
}

// Download-Token validieren
function validateDownloadToken(encodedToken) {
    try {
        const payload = JSON.parse(Buffer.from(encodedToken, 'base64').toString());
        
        // Expiry prüfen
        if (Date.now() > payload.expires) {
            return null;
        }
        
        // Token-Integrität prüfen
        const secret = process.env.JWT_SECRET || 'fallback-secret';
        const expectedToken = crypto.createHash('sha256')
            .update(JSON.stringify({ 
                filename: payload.filename, 
                expires: payload.expires 
            }) + secret)
            .digest('hex');
            
        if (expectedToken !== payload.token) {
            return null;
        }
        
        return payload.filename;
        
    } catch (error) {
        console.error('Token Validation Error:', error);
        return null;
    }
}

export default router; 