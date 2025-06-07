import { createClient } from '@supabase/supabase-js';
import { logger } from './logger';

let supabaseInstance = null;

// 🚧 DEVELOPMENT: Mock Supabase Client für Demo-Modus
const createMockSupabaseClient = () => {
  const mockUser = {
    id: 'demo-user-123',
    email: 'demo@pulsemanager.vip',
    user_metadata: {},
    app_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString()
  };

  return {
    auth: {
      getSession: async () => ({
        data: { session: { user: mockUser, access_token: 'mock-token' } },
        error: null
      }),
      getUser: async () => ({
        data: { user: mockUser },
        error: null
      }),
      signInWithPassword: async ({ email, password }) => {
        logger.info('🚧 MOCK: Sign in attempt', { email });
        return {
          data: { user: mockUser, session: { user: mockUser, access_token: 'mock-token' } },
          error: null
        };
      },
      signUp: async ({ email, password }) => {
        logger.info('🚧 MOCK: Sign up attempt', { email });
        return {
          data: { user: mockUser, session: null },
          error: null
        };
      },
      signOut: async () => {
        logger.info('🚧 MOCK: Sign out');
        return { error: null };
      },
      resetPasswordForEmail: async (email) => {
        logger.info('🚧 MOCK: Password reset for', email);
        return { data: {}, error: null };
      },
      onAuthStateChange: (callback) => {
        // Simuliere Login nach 1 Sekunde
        setTimeout(() => {
          callback('SIGNED_IN', { user: mockUser, access_token: 'mock-token' });
        }, 1000);
        
        return {
          data: {
            subscription: {
              unsubscribe: () => logger.info('🚧 MOCK: Auth state subscription cancelled')
            }
          }
        };
      }
    },
    from: (table) => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: null, error: null }),
          limit: () => ({ data: [], error: null })
        }),
        limit: () => ({ data: [], error: null })
      }),
      insert: () => ({
        select: () => ({
          single: async () => ({ data: { id: 'mock-id' }, error: null })
        })
      }),
      update: () => ({
        eq: () => ({ data: null, error: null })
      }),
      delete: () => ({
        eq: () => ({ data: null, error: null })
      })
    })
  };
};

export const initializeSupabase = () => {
  try {
    // 🔥 PRODUCTION FIX: Real Supabase credentials from environment
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    logger.info('🔍 Environment check:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseAnonKey,
      url: supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'MISSING'
    });

    // 🚨 CRITICAL FIX: Use real Supabase if credentials exist
    if (supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('https://') && !supabaseUrl.includes('demo')) {
      logger.info('✅ Using REAL Supabase client with production credentials');
      supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
        },
      });
    } else {
      // 🚧 FALLBACK: Mock client only if no real credentials
      logger.warn('🚧 FALLBACK: Using MOCK Supabase client (no valid production credentials found)');
      logger.warn('URL:', supabaseUrl, 'KEY present:', !!supabaseAnonKey);
      supabaseInstance = createMockSupabaseClient();
    }

    logger.info('Supabase client initialized successfully');
    return supabaseInstance;
  } catch (error) {
    logger.error('Failed to initialize Supabase client:', error);
    throw error;
  }
};

export const getSupabase = () => {
  if (!supabaseInstance) {
    return initializeSupabase();
  }
  return supabaseInstance;
};

// Initialisiere Supabase beim ersten Import
export const supabase = getSupabase();