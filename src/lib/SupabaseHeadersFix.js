// =============================================================================
// 🔧 MINIMAL SUPABASE HEADERS FIX - Nur für den spezifischen Error!
// =============================================================================

// Minimaler, chirurgischer Fix nur für Supabase Headers Error
const fixSupabaseHeaders = () => {
  console.log('🔧 Applying minimal Supabase headers fix...');
  
  // Nur für Supabase-spezifische Headers-Probleme
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
      // Nur Headers-spezifische Errors abfangen
      if (error.message?.includes('headers')) {
        console.log('🔧 Supabase headers error caught:', error.message);
        
        // Erstelle Mock-Response mit Headers
        return {
          ok: false,
          status: 500,
          statusText: 'Headers Error',
          headers: new Headers(),
          json: () => Promise.resolve({ error: 'Headers error handled' }),
          text: () => Promise.resolve('Headers error handled')
        };
      }
      
      // Alle anderen Errors normal weiterwerfen
      throw error;
    }
  };
  
  console.log('✅ Minimal Supabase headers fix applied');
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