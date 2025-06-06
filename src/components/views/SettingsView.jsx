
import React from 'react';
import { motion } from 'framer-motion';
import { Settings, CreditCard, Bell } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAppContext } from '@/contexts/AppContext';

const SettingsView = () => {
  const { 
    language, 
    translations, 
    subscriptionStatus, 
    daysRemaining, 
    setShowSubscriptionModal, 
    handleSubscription 
  } = useAppContext();
  const t = translations[language];

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
