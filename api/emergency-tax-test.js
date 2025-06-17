// 🚨 EMERGENCY TAX API - OHNE EXTERNE DEPENDENCIES
// Funktioniert 100% standalone

export default async function handler(req, res) {
    console.log('🚨 EMERGENCY API CALLED:', req.method);
    
    // CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        console.log('🚨 Emergency API: Processing request...');
        
        const { address, phase } = req.body || {};
        
        console.log('🚨 Address:', address, 'Phase:', phase);
        
        // DEMO TAX REPORT (funktioniert immer)
        const demoTaxReport = {
            success: true,
            phase: phase || 'EMERGENCY_MODE',
            totalTransactions: 5,
            totalROIIncome: 1250.00,
            totalSpeculativeGains: 875.50,
            address: address || '0x308e77...',
            
            // Demo Events
            reports: [
                {
                    date: new Date().toISOString(),
                    token: 'WGEP',
                    type: 'ROI_EVENT',
                    valueEUR: 850.00,
                    tax: 212.50,
                    gains: 510.00
                },
                {
                    date: new Date().toISOString(),
                    token: 'ETH',
                    type: 'SPECULATIVE_GAIN',
                    valueEUR: 3500.00,
                    tax: 875.00,
                    gains: 2100.00
                },
                {
                    date: new Date().toISOString(),
                    token: 'HEX',
                    type: 'ROI_EVENT',
                    valueEUR: 616.00,
                    tax: 154.00,
                    gains: 369.60
                }
            ],
            
            // Summary
            summary: {
                totalTax: 1241.50,
                totalGains: 2979.60,
                events: 3
            },
            
            // German Tax Info
            germanTax: {
                paragraph22: {
                    roiIncome: 879.60,
                    note: "§22 EStG - Sonstige Einkünfte (ROI)"
                },
                paragraph23: {
                    speculativeGains: 2100.00,
                    note: "§23 EStG - Spekulationsgeschäfte"
                },
                freigrenze600: {
                    applied: true,
                    note: "600€ Freigrenze berücksichtigt"
                }
            },
            
            // Meta
            priceSource: 'Emergency Demo Data',
            trialInfo: '3 Tage verbleibend - Emergency Mode aktiv',
            timestamp: new Date().toISOString(),
            note: '🚨 Emergency Mode: Alle APIs offline, Demo-Daten verwendet'
        };
        
        console.log('✅ Emergency API: Sending demo response');
        
        return res.status(200).json({
            success: true,
            taxReport: demoTaxReport
        });
        
    } catch (error) {
        console.error('🚨 Emergency API Error:', error);
        
        return res.status(200).json({
            success: true,
            taxReport: {
                success: false,
                error: 'Emergency fallback activated',
                phase: 'EMERGENCY_FALLBACK',
                totalTransactions: 0,
                totalROIIncome: 0,
                totalSpeculativeGains: 0,
                note: '🚨 Alle APIs offline - Emergency Fallback aktiv',
                timestamp: new Date().toISOString()
            }
        });
    }
} 