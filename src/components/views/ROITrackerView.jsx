import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAppContext } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TrendingUp, PlusCircle, Wallet, Loader2, Info } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import InvestmentTable from '@/components/roi/InvestmentTable';
import InvestmentForm from '@/components/roi/InvestmentForm';
import { dbService } from '@/lib/dbService';
import { logger } from '@/lib/logger';
import { getAllPulsechainTokensFromBlockscout } from '@/lib/walletService';
import { fetchTokenPrices } from '@/lib/priceService';

const ROITrackerView = () => {
  const { 
    t, 
    wcIsConnected, 
    wcConnectWallet: globalHandleWalletConnect, 
    user, 
    appDataVersion, 
    incrementAppDataVersion,
    connectedWalletAddress: globalConnectedWalletAddress 
  } = useAppContext();
  
  const { toast } = useToast();
  const [investments, setInvestments] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentInvestment, setCurrentInvestment] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showWalletConnectPrompt, setShowWalletConnectPrompt] = useState(false);

  const latestValues = useRef({ user, toast, t, appDataVersion });
  latestValues.current = { user, toast, t, appDataVersion };

  const fetchInvestments = useCallback(async () => {
    const { user: currentUser, toast: currentToast, t: currentT } = latestValues.current;
    
    if (!currentUser?.id) {
      setInvestments([]);
      return;
    }
    setIsLoading(true);
    logger.info("ROITrackerView: Fetching investments");
    try {
      const { data, error } = await dbService.getRoiEntries(currentUser.id);

      if (error) {
        throw error;
      }
      setInvestments(data || []);
    } catch (error) {
      currentToast({
        title: currentT.errorFetchingInvestments || "Error Fetching Investments",
        description: error.message || (currentT.couldNotFetchInvestments || "Could not fetch investments from the database."),
        variant: "destructive",
      });
      logger.error("Error fetching investments via dbService:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.id) {
      fetchInvestments();
    } else {
      setInvestments([]); 
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id && appDataVersion > 0) {
      fetchInvestments();
    }
  }, [appDataVersion]);

  const handleSyncWalletAssets = async () => {
    if (!wcIsConnected || !globalConnectedWalletAddress) {
      toast({
        title: t.walletConnectErrorTitle || "WalletConnect Error",
        description: t.walletConnectErrorUnknown || "Please connect your wallet first.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const tokens = await getAllPulsechainTokensFromBlockscout(globalConnectedWalletAddress);
      const prices = await fetchTokenPrices(tokens.map(t => t.symbol));

      const newInvestments = tokens.map(token => ({
        name: token.name,
        symbol: token.symbol,
        quantity: token.balance,
        purchase_date: new Date().toISOString().split('T')[0],
        purchase_price: prices[token.symbol] || 0,
        current_value: (prices[token.symbol] || 0) * token.balance,
        wallet_address: globalConnectedWalletAddress,
        source: 'wallet'
      }));

      for (const investment of newInvestments) {
        await dbService.addRoiEntry(user.id, investment);
      }

      toast({
        title: t.success || "Success",
        description: t.walletAssetsSynced || "Wallet assets synced successfully.",
        variant: "success",
      });

      incrementAppDataVersion();
    } catch (error) {
      toast({
        title: t.errorSyncingWalletAssets || "Error Syncing Wallet Assets",
        description: error.message || (t.couldNotSyncWalletAssets || "Could not sync wallet assets with the database."),
        variant: "destructive",
      });
      logger.error("Error syncing wallet assets:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const openModal = (investment = null) => {
    setCurrentInvestment(investment);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentInvestment(null);
  };

  const onInvestmentSavedOrDeleted = () => {
    incrementAppDataVersion();
    closeModal();
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } }
  };

  if (!user) {
    const dummyInvestments = [
      { name: 'PulseX', symbol: 'PLSX', quantity: 10000, purchase_date: '2023-01-01', purchase_price: 100, current_value: 120, wallet_address: '0x123...', source: 'demo' },
      { name: 'HEX', symbol: 'HEX', quantity: 5000, purchase_date: '2023-02-01', purchase_price: 50, current_value: 80, wallet_address: '0x123...', source: 'demo' },
    ];
    return (
      <motion.div className="flex flex-col items-center justify-center h-full text-center p-8">
        <h2 className="text-2xl font-semibold mb-3">Demo: ROI Tracker</h2>
        <p className="text-muted-foreground mb-6 max-w-md">Melde dich an und verbinde deine Wallet, um deine echten Investments zu sehen.</p>
        <InvestmentTable investments={dummyInvestments} />
      </motion.div>
    );
  }

  if (showWalletConnectPrompt && !wcIsConnected) {
    return (
      <motion.div
        className="flex flex-col items-center justify-center h-full text-center p-8"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Wallet className="h-16 w-16 text-primary mb-6" />
        <h2 className="text-2xl font-semibold mb-3">{t.connectWalletToView || "Connect Wallet to View"}</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          {t.roiTrackerWalletMessagePulseX || "Please connect your wallet to access the ROI Tracker. Wallet data will be automatically synced. Initial purchase data reflects current values; edit entries with your PulseX purchase details for accurate historical ROI."}
        </p>
        <Button
          onClick={globalHandleWalletConnect}
          className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105"
        >
          <Wallet className="mr-2 h-5 w-5" />
          {t.connectWallet}
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold gradient-text mb-2">{t.roiTrackerTitle || "ROI Tracker"}</h1>
          <p className="text-muted-foreground text-lg">{t.roiTrackerSubtitle || "Track the performance of your investments."}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 mt-4 sm:mt-0">
          <Button onClick={() => openModal()} className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105">
            <PlusCircle className="mr-2 h-5 w-5" />
            {t.addManualInvestment || "Add Manual Investment"}
          </Button>
          {wcIsConnected && globalConnectedWalletAddress && (
            <Button onClick={handleSyncWalletAssets} className="bg-gradient-to-r from-green-500 to-cyan-600 hover:from-green-600 hover:to-cyan-700 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Wallet className="mr-2 h-5 w-5" />}
              {t.syncWalletAssetsButton || 'Wallet-Assets übernehmen'}
            </Button>
          )}
        </div>
      </motion.div>

      {isLoading && (
        <motion.div variants={itemVariants} className="flex justify-center items-center py-12">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </motion.div>
      )}

      {!isLoading && investments.length === 0 && (
        <motion.div variants={itemVariants}>
          <Card className="shadow-xl hover:shadow-2xl transition-shadow duration-300 border-border/20 bg-background/70 dark:bg-slate-800/70 backdrop-blur-sm text-center py-12">
            <CardHeader>
              <TrendingUp className="h-12 w-12 mx-auto text-primary mb-4" />
              <CardTitle className="text-xl">{t.noInvestmentsTrackedTitle || "No Investments Yet"}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{t.noInvestmentsTrackedPulseX || "No investments tracked yet. Add one manually or connect your wallet to sync automatically. For synced assets, edit initial purchase data with your PulseX purchase details for accurate historical ROI."}</p>
              <div className="mt-4 p-3 bg-sky-100 dark:bg-sky-900/30 border-l-4 border-sky-500 text-sky-700 dark:text-sky-300 rounded-md flex items-start">
                <Info className="h-5 w-5 mr-2 mt-0.5 text-sky-500 flex-shrink-0" />
                <p className="text-sm">{t.roiTrackerInfoWalletSyncPulseX || "Assets from connected wallets are synced. For accurate historical ROI, initial purchase data (price & date) reflects current values at the time of sync. Please EDIT these entries with your actual purchase details from PulseX (or other sources)."}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {!isLoading && investments.length > 0 && (
        <motion.div variants={itemVariants}>
          <InvestmentTable 
            investments={investments} 
            onEdit={openModal} 
            onDelete={onInvestmentSavedOrDeleted} 
            isLoading={isLoading} 
          />
        </motion.div>
      )}

      <InvestmentForm
        isOpen={isModalOpen}
        onClose={closeModal}
        investment={currentInvestment}
        onSave={onInvestmentSavedOrDeleted} 
      />
    </motion.div>
  );
};

export default ROITrackerView;