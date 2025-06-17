import React, { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext();

// 🔥 DIREKTE API-CALLS - KEIN SDK!
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://lalgwvltirtqknlyuept.supabase.co';  
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // 🔥 DIREKTE API - Checke localStorage für bestehende Session
    const getInitialSession = async () => {
      try {
        console.log('🔍 Checking for existing auth session...');
        
        const token = localStorage.getItem('supabase_token');
        const userData = localStorage.getItem('user_data');
        
        if (token && userData) {
          const user = JSON.parse(userData);
          const session = { user, access_token: token };
          
          console.log('✅ Found existing session for:', user.email);
          setSession(session);
          setUser(user);
          setIsAuthenticated(true);
        } else {
          console.log('❌ No valid session found');
          setSession(null);
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('❌ Auth initialization error:', error);
        setSession(null);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // 🔥 KEIN SDK AUTH LISTENER - Direkte LocalStorage Events
    const handleStorageChange = (e) => {
      if (e.key === 'supabase_token' || e.key === 'user_data') {
        console.log('🔄 Auth storage changed, refreshing...');
        getInitialSession();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const signUp = async (email, password, options = {}) => {
    try {
      setLoading(true);
      console.log('🔍 Registering user with email:', email);
      
      const normalizedEmail = email.toLowerCase().trim();
      
      // 🔥 DIREKTE API - KEIN SDK!
      const response = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY
        },
        body: JSON.stringify({
          email: normalizedEmail,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            ...options
          }
        })
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Registration error details:', error);
        
        // 🚨 COMPREHENSIVE ERROR HANDLING FOR DUPLICATES
        if (error.message?.includes('User already registered') ||
            error.message?.includes('already exists') ||
            error.message?.includes('Email already taken') ||
            error.message?.includes('duplicate key value') ||
            error.message?.includes('already been taken') ||
            error.message?.includes('email address is already') ||
            error.code === 'user_already_exists') {
          throw new Error('🚫 Ein Benutzer mit dieser E-Mail-Adresse existiert bereits. Bitte verwende eine andere E-Mail oder melde dich an.');
        }
        throw new Error(error.error_description || error.message || 'Registration failed');
      }

      const data = await response.json();
      console.log('✅ User registration successful:', data.user?.email);
      
      return { data, error: null };
    } catch (error) {
      console.error('❌ Sign up error:', error);
      return { data: null, error: { message: error.message } };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email, password) => {
    try {
      setLoading(true);
      console.log('🔐 Signing in:', email);
      
      // 🔥 DIREKTE API - KEIN SDK!
      const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY
        },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error_description || 'Login failed');
      }

      const data = await response.json();
      
      // Speichere Session in localStorage
      localStorage.setItem('supabase_token', data.access_token);
      localStorage.setItem('user_data', JSON.stringify(data.user));
      
      // Update State direkt
      const session = { user: data.user, access_token: data.access_token };
      setSession(session);
      setUser(data.user);
      setIsAuthenticated(true);
      
      console.log('✅ Login successful for:', data.user.email);

      return { data: { user: data.user, session }, error: null };
    } catch (error) {
      console.error('❌ Sign in error:', error);
      return { data: null, error: { message: error.message } };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      console.log('🚪 Signing out...');
      
      // 🔥 DIREKTE API - KEIN SDK!
      const token = localStorage.getItem('supabase_token');
      if (token) {
        await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${token}`, 
            'apikey': SUPABASE_ANON_KEY 
          }
        });
      }
      
      // Clear localStorage
      localStorage.removeItem('supabase_token');
      localStorage.removeItem('user_data');
      
      // Update State
      setSession(null);
      setUser(null);
      setIsAuthenticated(false);
      
      console.log('✅ Signed out successfully');

      return { error: null };
    } catch (error) {
      console.error('❌ Sign out error:', error);
      return { error: { message: error.message } };
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email) => {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      });

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Reset password error:', error);
      return { data: null, error };
    }
  };

  const updatePassword = async (password) => {
    try {
      const { data, error } = await supabase.auth.updateUser({
        password
      });

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Update password error:', error);
      return { data: null, error };
    }
  };

  const value = {
    user,
    session,
    loading,
    isAuthenticated,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};