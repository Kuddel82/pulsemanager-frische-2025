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

export const useStripeSubscription = (user, supabaseClient) => {
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [loadingSubscription, setLoadingSubscription] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  // 📊 Simple subscription check
  const checkSubscriptionStatus = async () => {
    if (!user?.id || !supabaseClient) {
      setLoadingSubscription(false);
      return;
    }

    try {
      const { data, error } = await supabaseClient
        .from('user_profiles')
        .select('subscription_status')
        .eq('id', user.id)
        .single();

      if (error) {
        // Create default trial profile
        const trialEnd = new Date();
        trialEnd.setDate(trialEnd.getDate() + 3);
        
        await supabaseClient
          .from('user_profiles')
          .upsert({
            id: user.id,
            subscription_status: 'trialing',
            trial_ends_at: trialEnd.toISOString(),
          });
        
        setSubscriptionStatus('trialing');
      } else if (data && data.subscription_status) {
        setSubscriptionStatus(data.subscription_status);
      } else {
        // Handle case where user exists but has no subscription_status
        setSubscriptionStatus('trialing');
      }
    } catch (error) {
      console.error('Subscription check error:', error);
      setSubscriptionStatus('trialing'); // Default fallback
      setErrorMessage('Subscription status could not be loaded');
    } finally {
      setLoadingSubscription(false);
    }
  };

  // 💳 Simple Stripe checkout
  const handleStripeSubscriptionCheckout = async () => {
    setErrorMessage('');
    
    if (!user) {
      setErrorMessage('Please log in first');
      return;
    }

    try {
      const stripe = await getStripe();
      if (!stripe) {
        setErrorMessage('Stripe failed to load');
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
        setErrorMessage(`Stripe Error: ${error.message}`);
      }
    } catch (error) {
      setErrorMessage('Could not connect to Stripe');
    }
  };

  // 🚀 Check status on user change
  useEffect(() => {
    if (user?.id) {
      checkSubscriptionStatus();
    }
  }, [user?.id]);

  // ✅ Handle Stripe success
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('stripe_success') && user?.id) {
      setSubscriptionStatus('active');
      setErrorMessage(''); // Clear any previous errors
      window.history.replaceState({}, '', window.location.pathname);
    }
    if (urlParams.get('stripe_cancel')) {
      setErrorMessage('Subscription cancelled');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [user?.id]);

  return {
    subscriptionStatus,
    loadingSubscription,
    handleStripeSubscriptionCheckout,
    checkSubscriptionStatus,
    errorMessage,
    clearError: () => setErrorMessage(''),
  };
};