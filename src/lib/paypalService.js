import { supabase } from './supabaseClient';
import { logger } from './logger';

const PAYPAL_API_URL = 'https://api-m.paypal.com';
const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = import.meta.env.VITE_PAYPAL_CLIENT_SECRET;

export const paypalService = {
  // PayPal Access Token abrufen
  async getAccessToken() {
    try {
      const response = await fetch(`${PAYPAL_API_URL}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${btoa(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`)}`
        },
        body: 'grant_type=client_credentials'
      });

      const data = await response.json();
      return data.access_token;
    } catch (error) {
      logger.error('Error getting PayPal access token:', error);
      throw error;
    }
  },

  // Abonnement erstellen
  async createSubscription(userId) {
    try {
      const accessToken = await this.getAccessToken();

      const response = await fetch(`${PAYPAL_API_URL}/v1/billing/subscriptions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          plan_id: 'P-5ML4271244454362XMQIZHI', // Ihre PayPal Plan ID
          application_context: {
            brand_name: 'PulseManager',
            locale: 'de-DE',
            shipping_preference: 'NO_SHIPPING',
            user_action: 'SUBSCRIBE_NOW',
            return_url: `${window.location.origin}/subscription/success`,
            cancel_url: `${window.location.origin}/subscription/cancel`
          }
        })
      });

      const data = await response.json();

      // Speichere die Subscription ID in Supabase
      await supabase
        .from('subscriptions')
        .upsert({
          user_id: userId,
          status: 'trial',
          start_date: new Date().toISOString(),
          end_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 Tage Trial
          paypal_subscription_id: data.id
        });

      return data;
    } catch (error) {
      logger.error('Error creating PayPal subscription:', error);
      throw error;
    }
  },

  // Abonnement aktivieren
  async activateSubscription(subscriptionId) {
    try {
      const accessToken = await this.getAccessToken();

      await fetch(`${PAYPAL_API_URL}/v1/billing/subscriptions/${subscriptionId}/activate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      });

      // Aktualisiere den Status in Supabase
      await supabase
        .from('subscriptions')
        .update({
          status: 'active',
          end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 Tage
        })
        .eq('paypal_subscription_id', subscriptionId);

    } catch (error) {
      logger.error('Error activating PayPal subscription:', error);
      throw error;
    }
  },

  // Abonnement kündigen
  async cancelSubscription(subscriptionId) {
    try {
      const accessToken = await this.getAccessToken();

      await fetch(`${PAYPAL_API_URL}/v1/billing/subscriptions/${subscriptionId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      });

      // Aktualisiere den Status in Supabase
      await supabase
        .from('subscriptions')
        .update({
          status: 'cancelled'
        })
        .eq('paypal_subscription_id', subscriptionId);

    } catch (error) {
      logger.error('Error cancelling PayPal subscription:', error);
      throw error;
    }
  },

  // Webhook für PayPal-Events
  async handleWebhook(event) {
    try {
      const { event_type, resource } = event;

      switch (event_type) {
        case 'BILLING.SUBSCRIPTION.ACTIVATED':
          await this.activateSubscription(resource.id);
          break;
        case 'BILLING.SUBSCRIPTION.CANCELLED':
          await this.cancelSubscription(resource.id);
          break;
        case 'PAYMENT.SALE.COMPLETED':
          // Verlängere das Abonnement um 30 Tage
          await supabase
            .from('subscriptions')
            .update({
              end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            })
            .eq('paypal_subscription_id', resource.billing_agreement_id);
          break;
      }
    } catch (error) {
      logger.error('Error handling PayPal webhook:', error);
      throw error;
    }
  }
}; 