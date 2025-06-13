/**
 * ⛽ GAS PRICES API - VERCEL FUNCTION (CORS-FIX)
 * 
 * ❌ DEPRECATED - 2025-06-12
 * Das System ist VOLLSTÄNDIG READ-ONLY und benötigt keine Gas-Preise!
 * 
 * Dieser API Endpunkt wird nicht mehr verwendet und sollte entfernt werden.
 * Bewahrt nur zu Dokumentationszwecken.
 */

export default async function handler(req, res) {
  // CORS Headers - FIX für alle Browser
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // DEPRECATED INFO
  console.warn('❌ DEPRECATED: Gas-Prices API ist veraltet und sollte nicht verwendet werden!');
  console.warn('Das System ist READ-ONLY und benötigt keine Gas-Preise.');
  
  // Return deprecated notice
  res.status(200).json({
    success: false,
    deprecated: true,
    message: "Diese API ist veraltet. Das PulseManager-System ist READ-ONLY und benötigt keine Gas-Preise.",
    notice: "Bitte entferne alle Aufrufe zu diesem Endpunkt aus deinem Code."
  });
} 