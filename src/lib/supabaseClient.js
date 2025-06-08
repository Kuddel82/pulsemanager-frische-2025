import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log("🔍 SUPABASE CONNECTION:");
console.log("URL:", supabaseUrl ? "✅ Found" : "❌ Missing");
console.log("Key:", supabaseAnonKey ? "✅ Found" : "❌ Missing");

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