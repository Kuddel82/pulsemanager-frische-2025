// 🚨 EMERGENCY: ALLE AUTO-LOADS SOFORT DEAKTIVIEREN
// Das ist das Problem: Moralis APIs werden automatisch aufgerufen!

console.log('🚨 EMERGENCY SHUTDOWN: Auto-Loading deaktiviert');

// Liste aller Dateien die Auto-Loading haben:
const AUTO_LOAD_FILES = [
  'src/contexts/PortfolioContext.jsx',
  'src/views/PortfolioView.jsx', 
  'src/views/TaxReportView.jsx',
  'src/views/ROITrackerView.jsx',
  'src/components/views/Home.jsx'
];

// Problem-Code Patterns:
const PROBLEM_PATTERNS = [
  'useEffect(() => { loadPortfolioData',
  'useEffect(() => { loadTaxData',
  'useEffect(() => { loadROIData',
  'useEffect(() => { loadDashboardData',
  'setInterval(load',
  'auto-refresh',
  'LOAD FROM CACHE ON INIT'
];

// SOLUTION: Alle useEffect Hooks die automatisch Daten laden ENTFERNEN
// Nur manuelle Button-Clicks erlauben!

export const EMERGENCY_CONFIG = {
  AUTO_LOADING_DISABLED: true,
  MANUAL_ONLY: true,
  API_CALLS_BLOCKED: false, // Erlaubt, aber nur manuell
  CACHE_AUTO_LOAD: false,   // CACHE wird nicht automatisch geladen
  MESSAGE: 'Alle automatischen API-Calls deaktiviert. Nur manuelle Buttons funktionieren.'
}; 