-- 🚨 EMERGENCY: MORALIS AUTO-LOADING PROBLEM IDENTIFIED

/*
PROBLEM: 
User beschwert sich dass Moralis APIs automatisch beim Homepage-Load aufgerufen werden.
Das kostet Geld und passiert ohne User-Interaktion!

URSACHE GEFUNDEN:
1. src/contexts/PortfolioContext.jsx - useEffect lädt automatisch Cache
2. Wenn Cache abgelaufen ist = automatische API-Calls
3. Homepage/Dashboard ruft loadPortfolioData automatisch auf
4. User sieht keine neuen Daten obwohl APIs laufen

LÖSUNG:
1. PortfolioContext: useEffect KOMPLETT entfernen
2. Alle Views: Nur manuelle Load-Buttons
3. UI State: Richtig handhaben damit Daten angezeigt werden
4. Cache: Nur bei manueller Anfrage prüfen

FILES TO FIX:
- src/contexts/PortfolioContext.jsx ❌ AUTO useEffect
- src/views/PortfolioView.jsx ✅ Already manual
- src/views/TaxReportView.jsx ✅ Already manual  
- src/views/ROITrackerView.jsx ✅ Already manual
- src/components/views/Home.jsx ❌ Possible auto-load

USER IST BERECHTIGT FRUSTRIERT!
*/

SELECT 'EMERGENCY FIX NEEDED' as status; 