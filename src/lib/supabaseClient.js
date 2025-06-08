import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log("🔍 SUPABASE URL CHECK:");
console.log("URL:", supabaseUrl);

// TEMPORARY MOCK - Replace with real Supabase when ready
const createMockSupabase = () => {
  return {
    auth: {
      signInWithPassword: async ({ email, password }) => {
        console.log("🔧 MOCK LOGIN:", email);
        return {
          data: {
            user: {
              id: "mock-user-123",
              email: email,
              email_confirmed_at: new Date().toISOString()
            },
            session: {
              access_token: "mock-token-123",
              refresh_token: "mock-refresh-123"
            }
          },
          error: null
        };
      },
      signUp: async ({ email, password }) => {
        console.log("🔧 MOCK REGISTER:", email);
        return {
          data: {
            user: {
              id: "mock-user-456",
              email: email,
              email_confirmed_at: null
            }
          },
          error: null
        };
      },
      signOut: async () => {
        console.log("🔧 MOCK LOGOUT");
        return { error: null };
      },
      getSession: async () => {
        return { data: { session: null }, error: null };
      },
      onAuthStateChange: (callback) => {
        console.log("🔧 MOCK AUTH STATE CHANGE");
        callback('INITIAL_SESSION', null);
        return { data: { subscription: { unsubscribe: () => {} } } };
      }
    }
  };
};

// Check if URL is reachable, otherwise use mock
let supabase;

if (!supabaseUrl || !supabaseAnonKey) {
  console.log("🔧 USING MOCK SUPABASE - No environment variables");
  supabase = createMockSupabase();
} else {
  try {
    // Test if URL is reachable
    fetch(supabaseUrl + '/rest/v1/')
      .then(response => {
        console.log("✅ REAL SUPABASE REACHABLE");
      })
      .catch(error => {
        console.log("❌ SUPABASE URL NOT REACHABLE - Using mock");
      });
    
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    });
  } catch (error) {
    console.log("🔧 FALLBACK TO MOCK SUPABASE");
    supabase = createMockSupabase();
  }
}

export { supabase };
export default supabase; 