import React from 'react';
import { motion } from 'framer-motion';
import { Settings, CreditCard } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAppContext } from '@/contexts/AppContext';

const SettingsView = () => {
  const { 
    user, 
    subscriptionStatus, 
    daysRemaining,
    checkSubscriptionStatus,
    setShowSubscriptionModal
  } = useAppContext();

  // TEMPORARY DEBUG: Manual subscription refresh for owner
  const handleRefreshSubscription = async () => {
    if (checkSubscriptionStatus) {
      try {
        await checkSubscriptionStatus();
        console.log("✅ Subscription status refreshed!");
        window.location.reload();
      } catch (error) {
        console.error("❌ Error refreshing subscription:", error);
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-4xl mx-auto p-6 space-y-8"
    >
      <div className="flex items-center mb-8">
        <Settings className="h-8 w-8 text-primary mr-3" />
        <h1 className="text-3xl font-bold pulse-title">
          Einstellungen
        </h1>
      </div>

      {/* TEMPORARY DEBUG SECTION FOR OWNER */}
      {user?.email === 'dkuddel@web.de' && (
        <div className="bg-yellow-100 dark:bg-yellow-900 p-4 rounded-lg border-2 border-yellow-400">
          <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
            🔧 Owner Debug Tools
          </h3>
          <p className="text-yellow-700 dark:text-yellow-300 mb-3">
            Current Status: <strong>{subscriptionStatus || 'loading...'}</strong>
          </p>
          <button 
            onClick={handleRefreshSubscription}
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded font-medium"
          >
            🔄 Refresh Premium Status
          </button>
        </div>
      )}

      {/* ONLY SUBSCRIPTION SETTINGS */}
      <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-gray-200">
        <CardHeader>
          <CardTitle className="text-xl text-gray-800 flex items-center">
            <CreditCard className="mr-2 h-5 w-5" />
            Premium Zugang
          </CardTitle>
          <CardDescription>
            Verwalten Sie Ihr PulseManager Premium Abonnement
          </CardDescription>
        </CardHeader>
        <CardContent>
          {subscriptionStatus === 'active' ? (
            <div>
              <p className="text-green-600 mb-2 font-semibold">✅ Premium aktiv</p>
              <p className="text-gray-600 text-sm">Sie haben Zugriff auf alle Premium-Features.</p>
            </div>
          ) : (
            <div>
              <p className="text-orange-600 mb-2 font-semibold">
                {subscriptionStatus === 'trial' ? `🔄 Trial aktiv - ${daysRemaining} Tage verbleibend` : '⚠️ Kein Premium Zugang'}
              </p>
              <Button 
                onClick={() => setShowSubscriptionModal(true)}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                Premium freischalten
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default SettingsView;
