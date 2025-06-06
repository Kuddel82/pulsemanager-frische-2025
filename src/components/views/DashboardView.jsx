import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, ShieldCheck, BarChart3, HelpCircle, BookOpen, Settings, Unplug } from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';

const DashboardView = () => {
  const { 
    t, 
    setActiveView, 
    handleWalletConnect, 
    handleWalletDisconnect,
    connectedWalletAddress,
    subscriptionStatus,
    daysRemaining,
    protectedViewsConfig,
    setShowSubscriptionModal,
    isWalletConnectInitializing,
    wcConnectWallet,
    wcIsConnecting,
    wcDisconnectWallet
  } = useAppContext();

  const features = [
    { id: 'pulseChainInfo', title: t.pulseChainInfo || "PulseChain Info", icon: HelpCircle, descriptionKey: "dashboardFeaturePulseChainInfoDesc" },
    { id: 'wallets', title: t.wallets || "Wallets", icon: Zap, descriptionKey: "dashboardFeatureWalletsDesc" },
    { id: 'roiTracker', title: t.roiTracker || "ROI Tracker", icon: BarChart3, descriptionKey: "dashboardFeatureRoiTrackerDesc" },
  ];

  const handleFeatureClick = (viewId) => {
    const isProtected = protectedViewsConfig.some(pv => pv.id === viewId);
    const isLocked = isProtected && subscriptionStatus !== 'active' && daysRemaining <= 0;
    
    if (isLocked) {
      setShowSubscriptionModal(true);
    } else {
      setActiveView(viewId);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="mb-8 text-center">
        <h1 className="text-4xl md:text-5xl font-bold gradient-text mb-3">{t.welcome || "Welcome to PulseManager"}</h1>
        <p className="text-lg md:text-xl text-foreground/80">{t.subtitle || "Your All-in-One Crypto Dashboard"}</p>
      </div>

      <Card className="mb-8 bg-primary/5 dark:bg-primary/10 border-primary/20 shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center">
            <ShieldCheck className="h-7 w-7 mr-3 text-primary" />
            {t.walletConnections || "Wallet Connections"}
          </CardTitle>
          <CardDescription>{t.dashboardWalletConnectDescription || "Connect your preferred wallet to get started or manage your assets."}</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <Button 
            size="lg" 
            className="w-full py-6 text-lg bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white"
            onClick={() => wcConnectWallet('metamask')}
            disabled={wcIsConnecting}
          >
            <img src="https://images.unsplash.com/photo-1681005110009-840417933060" alt={t.metamaskAlt || "MetaMask Logo"} className="h-6 w-6 mr-2 filter brightness-0 invert" />
            {t.connectMetaMask || "Connect MetaMask"}
          </Button>
          <Button 
            size="lg" 
            className="w-full py-6 text-lg bg-gradient-to-r from-blue-500 to-sky-500 hover:from-blue-600 hover:to-sky-600 text-white"
            onClick={() => wcConnectWallet('rabby')}
            disabled={wcIsConnecting}
          >
            <img src="https://images.unsplash.com/photo-1700320509043-c158f739016f" alt={t.rabbyAlt || "Rabby Wallet Logo"} className="h-6 w-6 mr-2 filter brightness-0 invert" />
            {t.connectRabby || "Connect Rabby"}
          </Button>
          {!connectedWalletAddress ? (
            <Button 
              size="lg" 
              className="w-full py-6 text-lg bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white"
              onClick={() => wcConnectWallet('walletconnect')}
              disabled={wcIsConnecting}
            >
              <img src="https://images.unsplash.com/photo-1711500829926-8ecc107055d2" alt={t.walletConnectAlt || "WalletConnect Logo"} className="h-6 w-6 mr-2 filter brightness-0 invert" />
              {wcIsConnecting ? (t.connectingWallet || "Connecting...") : (t.connectWalletConnect || "Use WalletConnect")}
            </Button>
          ) : (
            <div className="sm:col-span-1 md:col-span-1 flex flex-col items-center justify-center p-4 bg-green-100 dark:bg-green-900/50 rounded-lg">
              <p className="text-sm text-green-700 dark:text-green-300 text-center">
                {t.walletConnected || "WalletConnect:"} <span className="font-mono block break-all">{connectedWalletAddress.substring(0, 6)}...{connectedWalletAddress.substring(connectedWalletAddress.length - 4)}</span>
              </p>
              <Button 
                size="sm"
                variant="outline"
                className="mt-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                onClick={wcDisconnectWallet}
              >
                <Unplug className="h-4 w-4 mr-2" />
                {t.disconnectWallet || "Disconnect"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {features.map((feature) => {
          const Icon = feature.icon;
          const isProtected = protectedViewsConfig.some(pv => pv.id === feature.id);
          const isLocked = isProtected && subscriptionStatus !== 'active' && daysRemaining <= 0;

          return (
            <motion.div
              key={feature.id}
              whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
            >
              <Card 
                className="h-full flex flex-col cursor-pointer hover:shadow-primary/30 shadow-lg transition-shadow duration-300 bg-background/70 dark:bg-slate-800/70"
                onClick={() => handleFeatureClick(feature.id)}
              >
                <CardHeader className="flex-row items-center space-x-4 pb-3">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Icon className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl gradient-text">{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-muted-foreground">
                    {t[feature.descriptionKey] || "Explore this feature to enhance your PulseChain experience."}
                  </p>
                </CardContent>
                <div className="p-4 pt-0 flex justify-end">
                   <Button variant="link" className="text-primary hover:text-accent">
                    {isLocked ? (t.unlockFeature || "Unlock Feature").replace('{featureName}', '') : (t.viewFeature || "View Feature")} 
                    <Settings className={`ml-2 h-4 w-4 ${isLocked ? 'text-destructive animate-pulse' : ''}`} />
                  </Button>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default DashboardView;
