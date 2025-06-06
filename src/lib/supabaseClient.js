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
    // 🔧 DEVELOPMENT: Fallback zu Demo-Werten wenn .env fehlt
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://demo-project.supabase.co';
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'demo-anon-key';

    if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('demo')) {
      logger.warn('🚧 DEVELOPMENT MODE: Using demo Supabase config. Create .env file for production!');
    }

    // 🚧 DEVELOPMENT: Mock für Demo-Modus
    if (supabaseUrl.includes('demo')) {
      logger.info('🔧 Using MOCK Supabase client for development');
      supabaseInstance = createMockSupabaseClient();
    } else {
      supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
        },
      });
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