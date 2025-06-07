import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
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
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // SIMPLIFIED: Only check if there's an existing valid session on startup
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          logger.error('Session error:', error);
          setUser(null);
          setIsAuthenticated(false);
        } else if (session?.user && session.access_token) {
          // Only restore session if it has a valid access token
          logger.info('Valid session found, restoring user');
          setUser(session.user);
          setIsAuthenticated(true);
        } else {
          logger.info('No valid session found');
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        logger.error('Auth initialization error:', error);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // STRICT: Only listen for explicit sign out events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      logger.debug('Auth event:', event);
      
      if (event === 'SIGNED_OUT') {
        logger.info('User signed out');
        setUser(null);
        setIsAuthenticated(false);
      }
      // DO NOT automatically set user on other events
      
      setLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const value = {
    user,
    loading,
    isAuthenticated,
    signIn: async (email, password) => {
      try {
        logger.info('Attempting sign in for:', email);
        
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        
        if (error) {
          logger.error('Sign in error:', error);
          // CRITICAL: Ensure no user is set on error
          setUser(null);
          setIsAuthenticated(false);
          throw error;
        }
        
        // ✅ STRICT validation before setting user
        if (!data.user || !data.session || !data.session.access_token) {
          logger.error('Invalid sign in response - missing user or session');
          setUser(null);
          setIsAuthenticated(false);
          throw new Error('Anmeldung fehlgeschlagen - Ungültige Antwort vom Server');
        }
        
        // ✅ ONLY set user if everything is valid
        logger.info('Sign in successful, setting user:', data.user.id);
        setUser(data.user);
        setIsAuthenticated(true);
        
        return data;
      } catch (error) {
        logger.error('SignIn failed:', error);
        // CRITICAL: Always clear user state on any error
        setUser(null);
        setIsAuthenticated(false);
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
      try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        
        // Immediately clear user state
        setUser(null);
        setIsAuthenticated(false);
        logger.info('User signed out successfully');
      } catch (error) {
        logger.error('Sign out error:', error);
        // Even on error, clear the user state locally
        setUser(null);
        setIsAuthenticated(false);
        throw error;
      }
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