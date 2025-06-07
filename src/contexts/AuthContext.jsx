import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { logger } from '@/lib/logger';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active sessions and sets the user
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        setUser(session?.user ?? null);
      } catch (error) {
        logger.error('Error getting session:', error);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    // Listen for changes on auth state (sign in, sign out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      logger.debug('Auth state change:', event, session?.user?.id);
      
      // ✅ Only set user on successful sign in or valid session
      if (event === 'SIGNED_IN' && session?.user) {
        logger.info('User successfully signed in via auth state change');
        setUser(session.user);
      } else if (event === 'SIGNED_OUT') {
        logger.info('User signed out via auth state change');
        setUser(null);
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        logger.info('Token refreshed, maintaining user session');
        setUser(session.user);
      } else {
        // For any other events or invalid sessions, clear user
        setUser(null);
      }
      
      setLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const value = {
    user,
    loading,
    signIn: async (email, password) => {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        
        if (error) {
          logger.error('Sign in error:', error);
          throw error;
        }
        
        // ✅ Ensure we have a valid user before returning success
        if (!data.user) {
          throw new Error('Anmeldung fehlgeschlagen - Kein Benutzer erhalten');
        }
        
        logger.info('User signed in successfully:', data.user.id);
        return data;
      } catch (error) {
        logger.error('SignIn failed:', error);
        throw error;
      }
    },
    signUp: async (email, password) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });
      if (error) throw error;
      return data;
    },
    signOut: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    },
    resetPassword: async (email) => {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      });
      if (error) throw error;
      return data;
    }
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};