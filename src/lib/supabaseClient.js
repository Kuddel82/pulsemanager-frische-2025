import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// TEMPORARY DEBUG - Remove after testing
console.log("🔍 SUPABASE DEBUG:");
console.log("URL:", supabaseUrl ? "✅ Found" : "❌ Missing");
console.log("Key:", supabaseAnonKey ? "✅ Found" : "❌ Missing");
console.log("Full URL:", supabaseUrl);

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