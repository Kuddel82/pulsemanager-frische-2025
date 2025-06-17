// =============================================================================
// 🧹 MINIMAL SAFE MODE - NUR DAS NÖTIGSTE!
// =============================================================================
// Verwende diesen Code NUR NACH dem Clean Start und NUR wenn nötig!

// Warte bis Seite vollständig geladen ist
window.addEventListener('load', () => {
  console.log('🧹 Minimal Safe Mode aktiviert');
  
  // Einfacher Error Catcher - NUR für kritische Errors
  window.addEventListener('error', (e) => {
    // NUR Headers-Errors abfangen - sonst nichts!
    if (e.message?.includes('headers')) {
      console.log('🔧 Headers error caught and ignored');
      return true; // Error handled
    }
    
    // Alle anderen Errors normal behandeln
    return false;
  });
  
  // Minimaler Unhandled Promise Rejection Handler
  window.addEventListener('unhandledrejection', (e) => {
    if (e.reason?.message?.includes('headers')) {
      console.log('🔧 Headers promise rejection caught and ignored');
      e.preventDefault();
    }
  });
  
  console.log('✅ Minimal Safe Mode bereit - NUR Headers-Errors werden abgefangen');
});

// =============================================================================
// 🎯 USAGE INSTRUCTIONS:
// =============================================================================
// 1. Erst Browser Cache leeren + Hard Refresh
// 2. Seite normal laden lassen
// 3. NUR wenn Headers-Errors auftreten, diesen Code in Console einfügen
// 4. KEINE anderen Fixes laden!
// ============================================================================= 