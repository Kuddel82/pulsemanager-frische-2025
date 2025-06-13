import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';

/**
 * 🔐 SUBSCRIPTION HOOK - PREMIUM/TRIAL LOGIC
 * 
 * - dkuddel@web.de = Premium-Mitglied (ohne Ablauf, fix gesetzt)
 * - Trial: 3 Tage Dashboard + Portfolio, danach gesperrt
 * - Premium: alle Views freigeschaltet
 */
export const useSubscription = () => {
  const { user, isAuthenticated } = useAuth();
  const [subscription, setSubscription] = useState({
    tier: 'trial',
    isActive: false,
    isPremium: false,
    daysRemaining: 0,
    loading: true
  });

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setSubscription({
        tier: 'trial',
        isActive: false,
        isPremium: false,
        daysRemaining: 0,
        loading: false
      });
      return;
    }

    loadSubscriptionData();
  }, [user, isAuthenticated]);

  const loadSubscriptionData = async () => {
    try {
      console.log('🔍 Loading subscription for:', user.email);

      // 🎯 PREMIUM USER: dkuddel@web.de
      if (user.email === 'dkuddel@web.de') {
        console.log('✅ Premium user detected:', user.email);
        setSubscription({
          tier: 'premium',
          isActive: true,
          isPremium: true,
          daysRemaining: 999, // Unlimited
          loading: false
        });
        return;
      }

      // Check Supabase for other users
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('subscription_tier, created_at')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Subscription query error:', error);
        // Default to trial on error
        setTrialSubscription();
        return;
      }

      if (profile) {
        const isSubscriptionPremium = profile.subscription_tier === 'premium';
        
        if (isSubscriptionPremium) {
          setSubscription({
            tier: 'premium',
            isActive: true,
            isPremium: true,
            daysRemaining: 999,
            loading: false
          });
        } else {
          calculateTrialStatus(profile.created_at);
        }
      } else {
        // No profile found - create default trial
        await createTrialProfile();
        setTrialSubscription();
      }

    } catch (error) {
      console.error('Subscription loading error:', error);
      setTrialSubscription();
    }
  };

  const calculateTrialStatus = (createdAt) => {
    const trialDays = 3;
    const created = new Date(createdAt);
    const now = new Date();
    const daysSinceCreation = Math.floor((now - created) / (1000 * 60 * 60 * 24));
    const daysRemaining = Math.max(0, trialDays - daysSinceCreation);
    const isActive = daysRemaining > 0;

    console.log(`📅 Trial: ${daysSinceCreation} days used, ${daysRemaining} remaining`);

    setSubscription({
      tier: 'trial',
      isActive: isActive,
      isPremium: false,
      daysRemaining: daysRemaining,
      loading: false
    });
  };

  const setTrialSubscription = () => {
    setSubscription({
      tier: 'trial',
      isActive: true,
      isPremium: false,
      daysRemaining: 3, // Default
      loading: false
    });
  };

  const createTrialProfile = async () => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .insert([
          {
            id: user.id,
            email: user.email,
            subscription_tier: 'trial',
            created_at: new Date().toISOString()
          }
        ]);

      if (error) {
        console.error('Profile creation error:', error);
      } else {
        console.log('✅ Trial profile created for:', user.email);
      }
    } catch (error) {
      console.error('Profile creation failed:', error);
    }
  };

  // Access Control Functions
  const canAccessPortfolio = () => {
    return subscription.isActive || subscription.isPremium;
  };

  const canAccessROI = () => {
    return subscription.isPremium;
  };

  const canAccessTaxReport = () => {
    return subscription.isPremium;
  };

  const canAccessAllFeatures = () => {
    return subscription.isPremium;
  };

  const getAccessMessage = () => {
    if (subscription.loading) return 'Lade Abo-Status...';
    
    if (subscription.isPremium) {
      return '🎯 Premium-Zugang: Alle Features verfügbar';
    }
    
    if (subscription.isActive) {
      return `📅 Trial: ${subscription.daysRemaining} Tage verbleibend`;
    }
    
    return '🔒 Trial abgelaufen - Upgrade auf Premium erforderlich';
  };

  return {
    ...subscription,
    canAccessPortfolio,
    canAccessROI,
    canAccessTaxReport,
    canAccessAllFeatures,
    getAccessMessage,
    refresh: loadSubscriptionData
  };
}; 