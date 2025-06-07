import React from 'react';
import { motion } from 'framer-motion';
import { Settings, CreditCard, Bell } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAppContext } from '@/contexts/AppContext';

const SettingsView = () => {
  const { 
    user, 
    t, 
    theme, 
    toggleTheme, 
    language, 
    setLanguage, 
    subscriptionStatus, 
    daysRemaining,
    checkSubscriptionStatus,
    translations, 
    setShowSubscriptionModal, 
    handleSubscription 
  } = useAppContext();

  // TEMPORARY DEBUG: Manual subscription refresh for owner
  const handleRefreshSubscription = async () => {
    if (checkSubscriptionStatus) {
      try {
        await checkSubscriptionStatus();
        console.log("✅ Subscription status refreshed!");
        // Force page reload to update UI
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
    >
      <div className="flex items-center mb-8">
        <Settings className="h-8 w-8 text-primary mr-3" />
        <h1 className="text-3xl font-bold gradient-text">{t.settingsViewTitle}</h1>
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

      <div className="space-y-8">
        <Card className="bg-background/70 dark:bg-slate-800/70 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl text-primary flex items-center">
              <CreditCard className="mr-2 h-5 w-5" />
              {t.settingsSubscriptionBilling}
            </CardTitle>
            <CardDescription>
              {t.settingsManageSubscription}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {subscriptionStatus === 'active' ? (
              <div>
                <p className="text-green-500 mb-2">{t.subscriptionActiveText}</p>
                <Button onClick={() => alert(t.manageSubscription + ' - ' + t.kommtBald)}>
                  {t.manageSubscription}
                </Button>
              </div>
            ) : (
              <div>
                <p className="text-yellow-500 mb-2">
                  {subscriptionStatus === 'trial' ? `${t.trialActiveText}${daysRemaining} ${daysRemaining === 1 ? t.days.slice(0,-1) : t.days}` : t.subscriptionModalText1}
                </p>
                <Button onClick={() => setShowSubscriptionModal(true)}>
                  {t.subscribeButton}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-background/70 dark:bg-slate-800/70 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl text-primary flex items-center">
              <Bell className="mr-2 h-5 w-5" />
              {t.settingsNotifications}
            </CardTitle>
            <CardDescription>
              {t.settingsCustomizeNotifications}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{t.kommtBald}</p>
          </CardContent>
        </Card>
        
      </div>
    </motion.div>
  );
};

export default SettingsView;
