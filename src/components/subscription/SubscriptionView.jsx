import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '../ui/use-toast';
import { paypalService } from '../../lib/paypalService';
import { supabase } from '../../lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { logger } from '../../lib/logger';

export function SubscriptionView() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [subscription, setSubscription] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSubscription();
  }, [user]);

  const loadSubscription = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setSubscription(data);
    } catch (error) {
      logger.error('Error loading subscription:', error);
      showToast('Fehler beim Laden des Abonnements', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscribe = async () => {
    try {
      setIsLoading(true);
      const data = await paypalService.createSubscription(user.id);
      window.location.href = data.links.find(link => link.rel === 'approve').href;
    } catch (error) {
      logger.error('Error creating subscription:', error);
      showToast('Fehler beim Erstellen des Abonnements', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    try {
      setIsLoading(true);
      await paypalService.cancelSubscription(subscription.paypal_subscription_id);
      await loadSubscription();
      showToast('Abonnement erfolgreich gekündigt', 'success');
    } catch (error) {
      logger.error('Error cancelling subscription:', error);
      showToast('Fehler beim Kündigen des Abonnements', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-lg text-muted-foreground">Lade Abonnement-Informationen...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Abonnement</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ihr Abonnement</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!subscription ? (
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">
                Sie haben noch kein Abonnement. Starten Sie mit einer 3-tägigen Testphase!
              </p>
              <Button onClick={handleSubscribe} disabled={isLoading}>
                Jetzt testen
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Status:</span>
                  <span className="font-medium">
                    {subscription.status === 'trial' && 'Testphase'}
                    {subscription.status === 'active' && 'Aktiv'}
                    {subscription.status === 'cancelled' && 'Gekündigt'}
                    {subscription.status === 'expired' && 'Abgelaufen'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Startdatum:</span>
                  <span>{new Date(subscription.start_date).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Enddatum:</span>
                  <span>{new Date(subscription.end_date).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Preis:</span>
                  <span>9,90 € / Monat</span>
                </div>
              </div>

              {subscription.status === 'active' && (
                <Button
                  variant="destructive"
                  onClick={handleCancel}
                  disabled={isLoading}
                >
                  Abonnement kündigen
                </Button>
              )}

              {subscription.status === 'cancelled' && (
                <p className="text-sm text-muted-foreground">
                  Ihr Abonnement läuft am {new Date(subscription.end_date).toLocaleDateString()} aus.
                </p>
              )}

              {subscription.status === 'expired' && (
                <div className="text-center space-y-4">
                  <p className="text-muted-foreground">
                    Ihr Abonnement ist abgelaufen. Abonnieren Sie erneut, um alle Funktionen zu nutzen.
                  </p>
                  <Button onClick={handleSubscribe} disabled={isLoading}>
                    Erneut abonnieren
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default SubscriptionView; 