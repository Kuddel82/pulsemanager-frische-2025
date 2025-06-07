import { loadStripe } from '@stripe/stripe-js';
import { useToast } from "@/components/ui/use-toast";
import { APP_TRANSLATIONS, TRIAL_DURATION_DAYS } from '@/config/appConfig';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { logger } from '@/lib/logger';

const STRIPE_PUBLISHABLE_KEY = "pk_test_51RVSOiReZk1QDkJzpBL8DbDgdDNl7SAIWpc458u9AA4MI3chDaT6vLQbJsFOCl87Bd6C2lxxxCoWXLmC1BI50BUM00sOJUzDCI";
const STRIPE_PRICE_ID = "price_1RVTzmDe4UZAo4ngzD0sb17m";

let stripePromiseCache;
const getStripe = () => {
  if (!stripePromiseCache) {
    stripePromiseCache = loadStripe(STRIPE_PUBLISHABLE_KEY);
  }
  return stripePromiseCache;
};

export const useStripeSubscription = (user, supabaseClient, isSupabaseClientReady, trialDuration = TRIAL_DURATION_DAYS) => {
  const { toast } = useToast();
  const [language] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('appLanguage') || 'de';
    }
    return 'de';
  });
  const t = APP_TRANSLATIONS[language] || APP_TRANSLATIONS['de'];
  const navigate = useNavigate();
  const location = useLocation();

  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [daysRemaining, setDaysRemaining] = useState(null);
  const [loadingSubscription, setLoadingSubscription] = useState(true);
  const [stripeCustomerId, setStripeCustomerId] = useState(null);

  // FIXED: Use refs to store latest values without causing re-renders
  const latestValues = useRef({ 
    user, 
    supabaseClient, 
    toast, 
    t, 
    isSupabaseClientReady, 
    trialDuration,
    navigate,
    location,
    stripeCustomerId
  });
  latestValues.current = { 
    user, 
    supabaseClient, 
    toast, 
    t, 
    isSupabaseClientReady, 
    trialDuration,
    navigate,
    location,
    stripeCustomerId
  };

  // FIXED: Stable ensureUserProfileExists without problematic dependencies
  const ensureUserProfileExists = useCallback(async (userId) => {
    const { supabaseClient: currentSupabase, toast: currentToast, t: currentT, isSupabaseClientReady: currentReady, trialDuration: currentTrialDuration } = latestValues.current;
    
    if (!currentSupabase || !userId || !currentReady) {
      logger.warn("ensureUserProfileExists: Supabase client not ready or userId missing.");
      return null;
    }
    
    const operation = async () => {
      const trialEndsDate = new Date();
      trialEndsDate.setDate(trialEndsDate.getDate() + currentTrialDuration);
      const profileToUpsert = {
        id: userId,
        subscription_status: 'trialing',
        trial_ends_at: trialEndsDate.toISOString(),
      };

      logger.debug("ensureUserProfileExists: Upserting profile:", profileToUpsert);
      const { error: upsertError } = await currentSupabase
        .from('user_profiles')
        .upsert(profileToUpsert, { onConflict: 'id' });

      if (upsertError) {
        logger.error("Error upserting user profile:", upsertError);
        throw upsertError; 
      }
      
      logger.info("User profile upsert successful or already existed for user_id:", userId);

      const { data: refetchedProfile, error: refetchError } = await currentSupabase
        .from('user_profiles')
        .select('subscription_status, trial_ends_at, stripe_customer_id')
        .eq('id', userId)
        .single();

      if (refetchError) {
        logger.error("Error refetching profile after upsert:", refetchError);
        throw refetchError;
      }
      return refetchedProfile;
    };

    try {
      return await operation();
    } catch (e) {
      logger.error("Exception in ensureUserProfileExists:", e);
      currentToast({ title: currentT.profileErrorTitle || "Profile Error", description: currentT.profileErrorUnexpected || "An unexpected error occurred while managing your profile.", variant: "destructive" });
      return null;
    }
  }, []); // Empty dependencies - stable reference

  // FIXED: Stable checkSubscriptionStatus without problematic dependencies
  const checkSubscriptionStatus = useCallback(async () => {
    const { user: currentUser, supabaseClient: currentSupabase, toast: currentToast, t: currentT, isSupabaseClientReady: currentReady, trialDuration: currentTrialDuration } = latestValues.current;
    
    if (!currentUser || !currentSupabase || !currentReady) {
      logger.warn("checkSubscriptionStatus: User, Supabase client not ready, or not logged in.");
      setLoadingSubscription(false);
      return;
    }
    setLoadingSubscription(true);
    let profileDataToUse = null;

    const operation = async () => {
      logger.debug("checkSubscriptionStatus: Fetching profile for user:", currentUser.id);
      const { data: existingProfile, error: fetchError } = await currentSupabase
        .from('user_profiles')
        .select('subscription_status, trial_ends_at, stripe_customer_id')
        .eq('id', currentUser.id)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') { 
          logger.warn("User profile not found (PGRST116). Attempting to ensure/create one via upsert.");
          const ensuredProfile = await ensureUserProfileExists(currentUser.id);
          if (ensuredProfile) {
            return ensuredProfile;
          } else {
            logger.error("Failed to ensure/create profile, setting default trial state as fallback.");
            const defaultTrialEnds = new Date();
            defaultTrialEnds.setDate(defaultTrialEnds.getDate() + currentTrialDuration);
            return { 
              subscription_status: 'trialing', 
              trial_ends_at: defaultTrialEnds.toISOString(), 
              stripe_customer_id: null 
            };
          }
        } else {
          throw fetchError; 
        }
      }
      return existingProfile;
    };

    try {
      profileDataToUse = await operation();

      if (profileDataToUse) {
        logger.info("checkSubscriptionStatus: Profile data found/created:", profileDataToUse);
        setSubscriptionStatus(profileDataToUse.subscription_status);
        setStripeCustomerId(profileDataToUse.stripe_customer_id);
        if (profileDataToUse.subscription_status === 'trialing' && profileDataToUse.trial_ends_at) {
          const trialEnds = new Date(profileDataToUse.trial_ends_at);
          const now = new Date();
          const diffTime = Math.max(0, trialEnds - now);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          setDaysRemaining(diffDays);
        } else if (profileDataToUse.subscription_status === 'active') {
          setDaysRemaining(999); 
        } else {
          setDaysRemaining(0);
        }
      } else { 
        logger.warn("Profile data still null after check/creation attempt. Setting default trial as final fallback.");
        const defaultTrialEnds = new Date();
        defaultTrialEnds.setDate(defaultTrialEnds.getDate() + currentTrialDuration);
        setSubscriptionStatus('trialing');
        setDaysRemaining(currentTrialDuration);
        setStripeCustomerId(null);
      }
    } catch (error) {
      logger.error("Error checking subscription status:", error);
      currentToast({ title: currentT.subscriptionErrorTitle || "Subscription Error", description: `${currentT.subscriptionErrorCheck || "Failed to check subscription status."} ${error.message}`, variant: "destructive" });
      setSubscriptionStatus('error');
      setDaysRemaining(0);
    } finally {
      setLoadingSubscription(false);
    }
  }, [ensureUserProfileExists]); // Only depend on stable ensureUserProfileExists
  
  // FIXED: Stable updateUserSubscriptionData without circular dependency
  const updateUserSubscriptionData = useCallback(async (status, days, customerId = null) => {
    const { user: currentUser, supabaseClient: currentSupabase, toast: currentToast, t: currentT, isSupabaseClientReady: currentReady } = latestValues.current;
    
    setSubscriptionStatus(status);
    setDaysRemaining(days);
    if (customerId) setStripeCustomerId(customerId);
    
    if (currentUser && currentSupabase && currentReady) {
        const operation = async () => {
            const updateData = {
                subscription_status: status,
                updated_at: new Date().toISOString()
            };
            if (status === 'trialing' && days > 0) {
                const trialEnd = new Date();
                trialEnd.setDate(trialEnd.getDate() + days);
                updateData.trial_ends_at = trialEnd.toISOString();
            } else if (status === 'active') {
                updateData.trial_ends_at = null; 
            }
            
            if (customerId !== undefined) { 
                updateData.stripe_customer_id = customerId;
            }

            logger.debug("updateUserSubscriptionData: Updating profile in DB:", updateData);
            const { error: updateError } = await currentSupabase
                .from('user_profiles')
                .update(updateData)
                .eq('id', currentUser.id);

            if (updateError) {
                logger.error("Error updating user profile in DB:", updateError);
                throw updateError;
            }
            
            logger.debug("updateUserSubscriptionData: Updating user metadata in auth.users");
            const { error: metaError } = await currentSupabase.auth.updateUser({
                data: { 
                    subscription_status: status, 
                    trial_ends_at: updateData.trial_ends_at,
                    stripe_customer_id: customerId 
                } 
            });
            if (metaError) {
                logger.error("Error updating user metadata in auth.users:", metaError);
            }
        };
        try {
            await operation();
        } catch (updateError) {
             currentToast({ title: currentT.profileErrorTitle || "Profile Update Error", description: `${currentT.profileErrorUpdate || "Failed to save subscription changes."} ${updateError.message}`, variant: "destructive" });
        }
    }
    // REMOVED: await checkSubscriptionStatus(); - this was causing circular dependency!
  }, []); // Empty dependencies - stable reference

  // FIXED: Simplified useEffect without problematic dependencies
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    if (query.get("stripe_success") && user && supabaseClient && isSupabaseClientReady) {
      (async () => {
        setLoadingSubscription(true);
        logger.info("Stripe success detected. Session ID:", query.get('session_id'));
        
        const currentStripeCustomerId = latestValues.current.stripeCustomerId;
        
        logger.info("Updating subscription to active. Current Stripe Customer ID:", currentStripeCustomerId);
        await updateUserSubscriptionData('active', 999, currentStripeCustomerId);
        
        const { toast: currentToast, t: currentT, navigate: currentNavigate, location: currentLocation } = latestValues.current;
        currentToast({ title: currentT.subscriptionSuccessTitle, description: currentT.subscriptionSuccessMessage, variant: "success" });
        currentNavigate(currentLocation.pathname, { replace: true }); 
        setLoadingSubscription(false);
      })();
    }
    if (query.get("stripe_cancel")) {
      logger.info("Stripe cancellation detected.");
      const { toast: currentToast, t: currentT, navigate: currentNavigate, location: currentLocation } = latestValues.current;
      currentToast({ title: currentT.subscriptionCancelledTitle, description: currentT.subscriptionCancelledMessage, variant: "destructive" });
      currentNavigate(currentLocation.pathname, { replace: true }); 
    }
  }, [user?.id, isSupabaseClientReady]); // SIMPLIFIED dependencies - removed all function dependencies

  const handleStripeSubscriptionCheckout = async () => {
    const { toast: currentToast, t: currentT, user: currentUser, location: currentLocation, stripeCustomerId: currentStripeCustomerId } = latestValues.current;
    
    if (!STRIPE_PUBLISHABLE_KEY || !STRIPE_PRICE_ID) {
      currentToast({ title: currentT.stripeErrorTitle, description: currentT.stripeKeysNotConfigured || "Stripe keys are not configured.", variant: "destructive"}); return;
    }
    if (!currentUser) {
      currentToast({ title: currentT.stripeErrorTitle, description: currentT.stripeUserNotLoggedIn || "User not logged in for subscription.", variant: "destructive"}); return;
    }

    try {
      const stripe = await getStripe();
      if (!stripe) { 
        currentToast({ title: currentT.stripeErrorTitle, description: currentT.stripeFailedToLoad || "Stripe.js failed to load. Check your internet connection and ad blockers.", variant: "destructive"}); return; 
      }
      
      const success_url = `${window.location.origin}${currentLocation.pathname}?stripe_success=true&session_id={CHECKOUT_SESSION_ID}`;
      const cancel_url = `${window.location.origin}${currentLocation.pathname}?stripe_cancel=true`;

      const checkoutOptions = {
        lineItems: [{ price: STRIPE_PRICE_ID, quantity: 1 }], 
        mode: 'subscription',
        successUrl: success_url,
        cancelUrl: cancel_url,
        clientReferenceId: currentUser.id,
        customerEmail: currentUser.email,
      };

      if (currentStripeCustomerId) {
        checkoutOptions.customer = currentStripeCustomerId;
        logger.debug("Using existing Stripe Customer ID for checkout:", currentStripeCustomerId);
      } else {
         checkoutOptions.customerCreation = 'always'; 
         logger.debug("No existing Stripe Customer ID, customer_creation set to 'always'.");
      }

      logger.info("Redirecting to Stripe Checkout with options:", checkoutOptions);
      const { error } = await stripe.redirectToCheckout(checkoutOptions);

      if (error) {
        logger.error("Stripe redirectToCheckout error:", error);
        currentToast({ title: currentT.stripeErrorTitle, description: error.message || currentT.stripeErrorMessage, variant: "destructive" });
      }
    } catch (error) {
       logger.error("Stripe handleSubscription catch error:", error);
       currentToast({ title: currentT.stripeErrorTitle, description: currentT.stripeCouldNotConnect || "Could not connect to Stripe. Please try again.", variant: "destructive"});
    }
  };
  
  const redirectToCustomerPortal = async () => {
    const { user: currentUser, supabaseClient: currentSupabase, toast: currentToast, t: currentT, isSupabaseClientReady: currentReady, stripeCustomerId: currentStripeCustomerId } = latestValues.current;
    
    if (!currentUser || !currentSupabase || !currentReady) {
      currentToast({ title: currentT.errorTitle || "Error", description: currentT.userNotLoggedIn || "User not logged in.", variant: "destructive" });
      return;
    }
     if (!currentStripeCustomerId) {
      currentToast({ title: currentT.errorTitle || "Error", description: currentT.stripeCustomerIdMissing || "Stripe customer ID not found. Please subscribe first or contact support.", variant: "destructive" });
      return;
    }

    const operation = async () => {
      logger.info("Invoking Stripe portal function for customer:", currentStripeCustomerId);
      const { data, error } = await currentSupabase.functions.invoke('stripe-portal', {
        body: { return_url: window.location.href, customer_id: currentStripeCustomerId }
      });
      if (error) throw error;
      if (data && data.url) {
        logger.info("Redirecting to Stripe Customer Portal:", data.url);
        window.location.href = data.url;
      } else {
        throw new Error(currentT.stripePortalUrlError || "Could not retrieve customer portal URL.");
      }
    };

    try {
      await operation();
    } catch (error) {
      logger.error("Error redirecting to customer portal:", error);
      currentToast({ title: currentT.errorTitle || "Error", description: `${currentT.stripePortalGenericError || "Could not open customer portal. Please try again."} ${error.message}`, variant: "destructive" });
    }
  };

  return { 
    handleStripeSubscriptionCheckout, 
    subscriptionStatus, 
    setSubscriptionStatusDirectly: setSubscriptionStatus, 
    daysRemaining, 
    setDaysRemainingDirectly: setDaysRemaining, 
    loadingSubscription, 
    checkSubscriptionStatus,
    redirectToCustomerPortal,
    updateUserSubscriptionData, 
    stripeCustomerId
  };
};