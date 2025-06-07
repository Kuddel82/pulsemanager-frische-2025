import { createClient } from '@supabase/supabase-js';
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://goyzczavomorzrustzgg.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdveXp6Y2F2b21vcnpydXN0emdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ2MjE0NDUsImV4cCI6MjA1MDE5NzQ0NX0.r8s4GS1WkHgv6QuFx_oKcOJzlW3HVfPTjBRb2X8k3ok';
// ✅ Create Supabase client using environment variables
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : null,
    storageKey: 'pulsemanager-auth-token',
  },
});

console.log('🔧 Supabase client initialized successfully');
console.log('Supabase client initialized');
