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
      console.log('🔒 No authenticated user, setting default trial state');
      setSubscription({
        tier: 'trial',
        isActive: false,
        isPremium: false,
        daysRemaining: 0,
        loading: false
      });
      return;
    }

    console.log('🔍 Starting subscription check for user:', user.email);
    loadSubscriptionData();
  }, [user, isAuthenticated]);

  const loadSubscriptionData = async () => {
    try {
      console.log('🔍 Loading subscription for:', user.email);

      // 🎯 PREMIUM USER: dkuddel@web.de - ABSOLUTE HIGHEST PRIORITY
      if (user.email === 'dkuddel@web.de') {
        console.log('🌟 PREMIUM USER DETECTED - OVERRIDING ALL OTHER CHECKS:', user.email);
        const premiumState = {
          tier: 'premium',
          isActive: true,
          isPremium: true,
          daysRemaining: 999, // Unlimited
          loading: false
        };
        console.log('✅ FORCING PREMIUM STATE (ignoring Supabase):', premiumState);
        setSubscription(premiumState);
        
        // Also update Supabase to match our override
        try {
          await supabase
            .from('profiles')
            .upsert({
              id: user.id,
              email: user.email,
              subscription_tier: 'premium',
              subscription_status: 'active',
              updated_at: new Date().toISOString()
            });
          console.log('✅ Updated Supabase to match premium status');
        } catch (error) {
          console.warn('⚠️ Could not update Supabase premium status:', error);
        }
        
        return;
      }

      // Check Supabase for other users
      console.log('📊 Checking Supabase for user:', user.id);
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('subscription_tier, subscription_status, created_at')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('❌ Subscription query error:', error);
        // Default to trial on error
        setTrialSubscription();
        return;
      }

      if (profile) {
        console.log('📋 Profile found:', profile);
        const isSubscriptionPremium = profile.subscription_tier === 'premium';
        
        if (isSubscriptionPremium) {
          console.log('🎯 Supabase confirms premium user');
          setSubscription({
            tier: 'premium',
            isActive: true,
            isPremium: true,
            daysRemaining: 999,
            loading: false
          });
        } else {
          console.log('📅 Calculating trial status');
          calculateTrialStatus(profile.created_at);
        }
      } else {
        console.log('👤 No profile found - creating trial profile');
        // No profile found - create default trial
        await createTrialProfile();
        setTrialSubscription();
      }

    } catch (error) {
      console.error('❌ Subscription loading error:', error);
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

    console.log(`📅 Trial calculation: ${daysSinceCreation} days used, ${daysRemaining} remaining, active: ${isActive}`);

    const trialState = {
      tier: 'trial',
      isActive: isActive,
      isPremium: false,
      daysRemaining: daysRemaining,
      loading: false
    };
    
    console.log('📅 Setting trial state:', trialState);
    setSubscription(trialState);
  };

  const setTrialSubscription = () => {
    const defaultTrialState = {
      tier: 'trial',
      isActive: true,
      isPremium: false,
      daysRemaining: 3, // Default
      loading: false
    };
    
    console.log('🆕 Setting default trial state:', defaultTrialState);
    setSubscription(defaultTrialState);
  };

  const createTrialProfile = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .insert([
          {
            id: user.id,
            email: user.email,
            subscription_tier: 'trial',
            subscription_status: 'active',
            created_at: new Date().toISOString()
          }
        ]);

      if (error) {
        console.error('❌ Profile creation error:', error);
      } else {
        console.log('✅ Trial profile created for:', user.email);
      }
    } catch (error) {
      console.error('❌ Profile creation failed:', error);
    }
  };

  // Access Control Functions
  const canAccessPortfolio = () => {
    const canAccess = subscription.isActive || subscription.isPremium;
    console.log(`🔐 Portfolio access check: ${canAccess} (isActive: ${subscription.isActive}, isPremium: ${subscription.isPremium})`);
    return canAccess;
  };

  const canAccessROI = () => {
    const canAccess = subscription.isPremium;
    console.log(`🔐 ROI access check: ${canAccess} (isPremium: ${subscription.isPremium})`);
    return canAccess;
  };

  const canAccessTaxReport = () => {
    const canAccess = subscription.isPremium;
    console.log(`🔐 Tax Report access check: ${canAccess} (isPremium: ${subscription.isPremium})`);
    return canAccess;
  };

  const canAccessAllFeatures = () => {
    const canAccess = subscription.isPremium;
    console.log(`🔐 All features access check: ${canAccess} (isPremium: ${subscription.isPremium})`);
    return canAccess;
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

  // Debug info
  console.log('🔍 Current subscription state:', subscription);

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