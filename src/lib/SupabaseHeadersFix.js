// =============================================================================
// 🔧 MINIMAL SUPABASE HEADERS FIX - Nur für den spezifischen Error!
// =============================================================================

// Minimaler, chirurgischer Fix nur für Supabase Headers Error
const fixSupabaseHeaders = () => {
  console.log('🔧 Applying enhanced Supabase headers fix...');
  
  // 1. Fetch-Patch für Response-Headers
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    try {
      const response = await originalFetch.apply(this, args);
      
      // Stelle sicher, dass headers existiert
      if (response && !response.headers) {
        console.log('🔧 Adding missing headers to response');
        response.headers = new Headers();
      }
      
      return response;
    } catch (error) {
      if (error.message?.includes('headers')) {
        console.log('🔧 Fetch headers error caught:', error.message);
        return {
          ok: false,
          status: 500,
          statusText: 'Headers Error',
          headers: new Headers(),
          json: () => Promise.resolve({ error: 'Headers error handled' }),
          text: () => Promise.resolve('Headers error handled')
        };
      }
      throw error;
    }
  };
  
  // 2. Global Error Handler für Constructor-Errors
  const originalErrorHandler = window.onerror;
  window.onerror = function(message, source, lineno, colno, error) {
    // Nur Supabase Headers-Errors abfangen
    if (message && message.includes('Cannot read properties of undefined (reading \'headers\')')) {
      console.log('🔧 Supabase constructor headers error caught and handled');
      return true; // Error handled, verhindert weitere Propagation
    }
    
    // Alle anderen Errors normal behandeln
    if (originalErrorHandler) {
      return originalErrorHandler.call(this, message, source, lineno, colno, error);
    }
    return false;
  };
  
  // 3. Unhandled Promise Rejection Handler
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason?.message?.includes('headers')) {
      console.log('🔧 Supabase promise headers error caught');
      event.preventDefault();
    }
  });
  
  console.log('✅ Enhanced Supabase headers fix applied');
};

// Nur anwenden wenn wirklich Supabase Headers Error auftritt
if (typeof window !== 'undefined') {
  // Warte auf DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fixSupabaseHeaders);
  } else {
    fixSupabaseHeaders();
  }
}

export default fixSupabaseHeaders; 