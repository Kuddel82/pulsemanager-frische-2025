import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// TEMP DEBUG: Direct URL test
console.log("🔍 DIRECT URL TEST:");
console.log("Testing URL:", supabaseUrl);
fetch(supabaseUrl + '/rest/v1/')
  .then(response => {
    console.log("✅ DIRECT FETCH SUCCESS:", response.status);
  })
  .catch(error => {
    console.log("❌ DIRECT FETCH ERROR:", error.message);
  });

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Supabase URL and Anonymous Key are required. Please check your environment variables."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Export für Kompatibilität mit bestehenden Imports
export default supabase; 