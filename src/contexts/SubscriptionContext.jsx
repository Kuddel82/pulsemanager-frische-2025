import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabaseClient';

const SubscriptionContext = createContext();

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

export const SubscriptionProvider = ({ children }) => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkSubscription = async () => {
      if (!user) {
        setSubscription(null);
        setLoading(false);
        return;
      }

      try {
        console.log('🔍 SUBSCRIPTION CHECK: Loading status for user', user.email);
        
        // Lade das Profil aus der Datenbank
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;

        console.log('📊 SUBSCRIPTION: Profile found:', profile);

        // Setze den Subscription-Status
        const subscriptionStatus = {
          isActive: profile?.subscription_status === 'active',
          isPro: profile?.subscription_tier === 'pro',
          isEnterprise: profile?.subscription_tier === 'enterprise',
          status: profile?.subscription_status || 'inactive',
          tier: profile?.subscription_tier || 'free',
          validUntil: profile?.subscription_valid_until,
          features: {
            portfolio: true, // Portfolio ist immer verfügbar
            taxReport: true, // Tax Report ist immer verfügbar
            defi: false, // DeFi Features sind deaktiviert
            gasPrices: false // Gas Prices sind deaktiviert
          }
        };

        console.log('✅ SUBSCRIPTION CHECK COMPLETE:', subscriptionStatus);
        setSubscription(subscriptionStatus);
      } catch (err) {
        console.error('❌ SUBSCRIPTION ERROR:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    checkSubscription();
  }, [user]);

  const value = {
    subscription,
    loading,
    error,
    isActive: subscription?.isActive || false,
    isPro: subscription?.isPro || false,
    isEnterprise: subscription?.isEnterprise || false,
    features: subscription?.features || {
      portfolio: true,
      taxReport: true,
      defi: false,
      gasPrices: false
    }
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}; 