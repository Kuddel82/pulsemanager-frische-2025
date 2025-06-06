import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Info, Loader2 } from 'lucide-react';
import PortfolioValue from './PortfolioValue';
import AssetTable from './AssetTable';
import AutoRefresh from './AutoRefresh';
import { useAppContext } from '@/contexts/AppContext';

const AssetDisplay = ({ 
  assets, 
  isLoading, 
  lastFetchTime, 
  onRefresh, 
  totalPortfolioValue,
  autoRefresh,
  onToggleAutoRefresh 
}) => {
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
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PortfolioValue
          totalValue={totalPortfolioValue}
          isLoading={isLoading}
          lastFetchTime={lastFetchTime}
          onRefresh={onRefresh}
        />
        <AutoRefresh
          isActive={autoRefresh}
          onToggle={onToggleAutoRefresh}
        />
      </div>

      <motion.div variants={itemVariants}>
        <Card className="shadow-xl hover:shadow-2xl transition-shadow duration-300 border-border/20 bg-background/70 dark:bg-slate-800/70 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>{t?.assetsCardTitle || "Assets"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-6 p-4 bg-gradient-to-r from-sky-500/10 via-sky-600/10 to-blue-600/10 dark:from-sky-700/20 dark:via-sky-800/20 dark:to-blue-800/20 border-l-4 border-sky-500 text-sky-700 dark:text-sky-200 rounded-lg shadow-inner flex items-start space-x-3">
              <Info className="h-5 w-5 mt-0.5 text-sky-500 dark:text-sky-400 flex-shrink-0" />
              <p className="text-sm leading-relaxed">
                {t?.walletSyncInfoSimplified || "Assets are automatically synced with the ROI Tracker. For accurate ROI calculations, please edit the entries in the ROI Tracker."}
              </p>
            </div>

            {isLoading && (!assets || assets.length === 0) ? (
              <div className="flex flex-col justify-center items-center py-16 text-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-lg font-semibold text-primary">{t?.loadingAssetsTitle || "Loading Assets..."}</p>
                <p className="text-muted-foreground">{t?.loadingAssetsDescription || "Please wait while we fetch your asset data."}</p>
              </div>
            ) : !isLoading && (!assets || assets.length === 0) ? (
              <div className="text-center py-16">
                <p className="text-xl font-semibold text-muted-foreground mb-2">{t?.noAssetsFoundTitle || "No Assets Found"}</p>
                <p className="text-muted-foreground">{t?.noAssetsFoundDescription || "Either no assets were found in your wallet, or we couldn't load the data."}</p>
              </div>
            ) : (
              <AssetTable assets={assets} isLoading={isLoading} />
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default AssetDisplay;