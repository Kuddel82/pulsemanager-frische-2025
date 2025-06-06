import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PortfolioValue from './PortfolioValue'; // Import the new component
import { useAppContext } from '@/contexts/AppContext';
import { motion } from 'framer-motion';

const PortfolioSummaryCard = ({ totalValue, onRefresh, isLoading, lastFetchTime, connectedWalletAddress }) => {
  const { t } = useAppContext();

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 100 }
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
      <PortfolioValue
        totalValue={totalValue}
        isLoading={isLoading}
        lastFetchTime={lastFetchTime}
        onRefresh={onRefresh}
      />
      <motion.div variants={itemVariants}>
        <Card className="shadow-xl hover:shadow-2xl transition-shadow duration-300 border-border/20 bg-background/70 dark:bg-slate-800/70 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t?.connectedWallet || "Verbundene Wallet"}</CardTitle>
            {/* Optional: Icon for wallet */}
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold font-mono break-all">
              {connectedWalletAddress 
                ? `${connectedWalletAddress.substring(0, 6)}...${connectedWalletAddress.substring(connectedWalletAddress.length - 4)}` 
                : (t?.notConnected || "Nicht verbunden")}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {connectedWalletAddress ? (t?.walletActive || "Wallet ist aktiv und bereit.") : (t?.pleaseConnectWallet || "Bitte verbinden Sie Ihre Wallet.")}
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default PortfolioSummaryCard;