import { loadStripe } from '@stripe/stripe-js';
import { useState, useEffect } from 'react';

const STRIPE_PUBLISHABLE_KEY = "pk_test_51RVSOiReZk1QDkJzpBL8DbDgdDNl7SAIWpc458u9AA4MI3chDaT6vLQbJsFOCl87Bd6C2lxxxCoWXLmC1BI50BUM00sOJUzDCI";
const STRIPE_PRICE_ID = "price_1RVTzmDe4UZAo4ngzD0sb17m";

let stripePromiseCache;
const getStripe = () => {
  if (!stripePromiseCache) {
    stripePromiseCache = loadStripe(STRIPE_PUBLISHABLE_KEY);
  }
  return stripePromiseCache;
};

export const useStripeSubscription = (user, supabaseClient, isSupabaseClientReady, TRIAL_DURATION_DAYS = 3) => {
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [daysRemaining, setDaysRemaining] = useState(0);
  const [stripeCustomerId, setStripeCustomerId] = useState(null);
  const [loadingSubscription, setLoadingSubscription] = useState(true);
  const [errorSubscription, setErrorSubscription] = useState(null);

  // 🎯 ENHANCED SUBSCRIPTION CHECK - Mit korrekter Trial Berechnung
  const checkSubscriptionStatus = async () => {
    if (!user?.id || !supabaseClient || !isSupabaseClientReady) {
      console.log('🔍 SUBSCRIPTION CHECK: Missing requirements', {
        userId: !!user?.id,
        supabaseClient: !!supabaseClient,
        isReady: isSupabaseClientReady
      });
      setLoadingSubscription(false);
      return;
    }

    try {
      setLoadingSubscription(true);
      console.log(`🔍 SUBSCRIPTION CHECK: Loading status for user ${user.email}`);

      // 1. Prüfe user_profiles Tabelle
      const { data: profileData, error: profileError } = await supabaseClient
        .from('user_profiles')
        .select('subscription_status, trial_ends_at, created_at')
        .eq('id', user.id)
        .single();

      let finalStatus = 'inactive';
      let finalDaysRemaining = 0;

      if (profileError) {
        console.log('📝 SUBSCRIPTION: No profile found, creating trial profile');
        
        // Erstelle neues Trial Profil
        const trialEnd = new Date();
        trialEnd.setDate(trialEnd.getDate() + TRIAL_DURATION_DAYS);
        
        const { error: insertError } = await supabaseClient
          .from('user_profiles')
          .upsert({
            id: user.id,
            subscription_status: 'trial',
            trial_ends_at: trialEnd.toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        
        if (!insertError) {
          finalStatus = 'trial';
          finalDaysRemaining = TRIAL_DURATION_DAYS;
          console.log(`✅ SUBSCRIPTION: Created new trial profile (${TRIAL_DURATION_DAYS} days)`);
        } else {
          console.error('❌ SUBSCRIPTION: Failed to create profile:', insertError);
          setErrorSubscription('Failed to create user profile');
        }
      } else if (profileData) {
        console.log('📊 SUBSCRIPTION: Profile found:', {
          status: profileData.subscription_status,
          trialEnds: profileData.trial_ends_at,
          created: profileData.created_at
        });

        const currentStatus = profileData.subscription_status;
        
        // 2. Berechne Trial-Status basierend auf trial_ends_at
        if (currentStatus === 'active') {
          finalStatus = 'active';
          finalDaysRemaining = null; // Premium hat keine Trial-Begrenzung
          console.log('👑 SUBSCRIPTION: Premium user detected');
        } else if (currentStatus === 'trial' || currentStatus === 'trialing') {
          if (profileData.trial_ends_at) {
            const trialEnd = new Date(profileData.trial_ends_at);
            const now = new Date();
            const timeDiff = trialEnd.getTime() - now.getTime();
            const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
            
            if (daysDiff > 0) {
              finalStatus = 'trial';
              finalDaysRemaining = daysDiff;
              console.log(`⏰ SUBSCRIPTION: Trial active, ${daysDiff} days remaining`);
            } else {
              finalStatus = 'inactive';
              finalDaysRemaining = 0;
              console.log('⏰ SUBSCRIPTION: Trial expired');
              
              // Update Status in Datenbank
              await supabaseClient
                .from('user_profiles')
                .update({ 
                  subscription_status: 'inactive',
                  updated_at: new Date().toISOString()
                })
                .eq('id', user.id);
            }
          } else {
            // Kein trial_ends_at gesetzt, erstelle neues Trial
            const trialEnd = new Date();
            trialEnd.setDate(trialEnd.getDate() + TRIAL_DURATION_DAYS);
            
            await supabaseClient
              .from('user_profiles')
              .update({
                trial_ends_at: trialEnd.toISOString(),
                updated_at: new Date().toISOString()
              })
              .eq('id', user.id);
            
            finalStatus = 'trial';
            finalDaysRemaining = TRIAL_DURATION_DAYS;
            console.log(`🔧 SUBSCRIPTION: Fixed missing trial_ends_at, set ${TRIAL_DURATION_DAYS} days`);
          }
        } else {
          // inactive oder unbekannter Status
          finalStatus = 'inactive';
          finalDaysRemaining = 0;
          console.log(`❌ SUBSCRIPTION: User has status '${currentStatus}', treating as inactive`);
        }
      }

      // 3. Setze finale Werte
      setSubscriptionStatus(finalStatus);
      setDaysRemaining(finalDaysRemaining);
      setErrorSubscription(null);

      console.log('✅ SUBSCRIPTION CHECK COMPLETE:', {
        email: user.email,
        finalStatus,
        finalDaysRemaining,
        isPremium: finalStatus === 'active',
        hasTrialAccess: finalStatus === 'trial' && finalDaysRemaining > 0
      });

    } catch (error) {
      console.error('💥 SUBSCRIPTION CHECK ERROR:', error);
      setErrorSubscription(`Subscription check failed: ${error.message}`);
      setSubscriptionStatus('inactive');
      setDaysRemaining(0);
    } finally {
      setLoadingSubscription(false);
    }
  };

  // 💳 Enhanced Stripe checkout
  const handleStripeSubscriptionCheckout = async () => {
    setErrorSubscription(null);
    
    if (!user) {
      setErrorSubscription('Please log in first');
      return;
    }

    try {
      console.log('💳 STRIPE: Starting checkout for', user.email);
      
      const stripe = await getStripe();
      if (!stripe) {
        setErrorSubscription('Stripe failed to load');
        return;
      }

      const { error } = await stripe.redirectToCheckout({
        lineItems: [{ price: STRIPE_PRICE_ID, quantity: 1 }],
        mode: 'subscription',
        successUrl: `${window.location.origin}?stripe_success=true`,
        cancelUrl: `${window.location.origin}?stripe_cancel=true`,
        clientReferenceId: user.id,
        customerEmail: user.email,
      });

      if (error) {
        setErrorSubscription(`Stripe Error: ${error.message}`);
        console.error('💥 STRIPE ERROR:', error);
      }
    } catch (error) {
      setErrorSubscription('Could not connect to Stripe');
      console.error('💥 STRIPE CONNECTION ERROR:', error);
    }
  };

  // 🚀 Check status on user change
  useEffect(() => {
    if (user?.id && isSupabaseClientReady) {
      console.log('🔄 SUBSCRIPTION: User changed, checking status...');
      checkSubscriptionStatus();
    } else {
      console.log('⏳ SUBSCRIPTION: Waiting for user and Supabase...');
      setLoadingSubscription(false);
    }
  }, [user?.id, isSupabaseClientReady]);

  // ✅ Handle Stripe success
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('stripe_success') && user?.id) {
      console.log('🎉 STRIPE SUCCESS: Activating premium subscription');
      
      // Setze sofort Premium Status
      setSubscriptionStatus('active');
      setDaysRemaining(null);
      setErrorSubscription(null);
      
      // Update Datenbank
      if (supabaseClient && isSupabaseClientReady) {
        supabaseClient
          .from('user_profiles')
          .upsert({
            id: user.id,
            subscription_status: 'active',
            trial_ends_at: null, // Premium hat kein Trial Ende
            updated_at: new Date().toISOString()
          })
          .then(() => console.log('✅ STRIPE: Database updated to premium'))
          .catch(err => console.error('❌ STRIPE: Database update failed:', err));
      }
      
      // Entferne URL Parameter
      window.history.replaceState({}, '', window.location.pathname);
    }
    
    if (urlParams.get('stripe_cancel')) {
      setErrorSubscription('Subscription cancelled');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [user?.id, supabaseClient, isSupabaseClientReady]);

  // 🔄 Update timer für Trial countdown (jede Minute)
  useEffect(() => {
    if (subscriptionStatus === 'trial' && daysRemaining > 0) {
      const interval = setInterval(() => {
        console.log('⏰ SUBSCRIPTION: Rechecking trial status...');
        checkSubscriptionStatus();
      }, 60000); // Jede Minute

      return () => clearInterval(interval);
    }
  }, [subscriptionStatus, daysRemaining]);

  return {
    subscriptionStatus,
    daysRemaining,
    stripeCustomerId,
    loadingSubscription,
    errorSubscription,
    handleStripeSubscriptionCheckout,
    checkSubscriptionStatus,
    clearError: () => setErrorSubscription(null),
  };
};