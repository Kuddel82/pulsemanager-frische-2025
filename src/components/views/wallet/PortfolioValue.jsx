import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart2, Loader2, RefreshCw } from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';

const PortfolioValue = ({ totalValue, isLoading, lastFetchTime, onRefresh }) => {
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
    <motion.div variants={itemVariants}>
      <Card className="shadow-xl hover:shadow-2xl transition-shadow duration-300 border-border/20 bg-background/70 dark:bg-slate-800/70 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t?.totalPortfolioValue || "Gesamtwert des Portfolios"}</CardTitle>
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onRefresh} 
              disabled={isLoading} 
              className="mr-2 text-muted-foreground hover:text-primary"
              aria-label={t?.refreshButtonLabel || "Refresh portfolio value"}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <BarChart2 className="h-5 w-5 text-primary" />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && parseFloat(String(totalValue).replace(/,/g, '')) === 0 ? (
            <div className="h-8 flex items-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="text-3xl font-bold gradient-text">${totalValue}</div>
          )}
          {lastFetchTime && !isLoading && (
            <p className="text-xs text-muted-foreground mt-1">
              {t?.lastUpdated || "Letzte Aktualisierung"}: {lastFetchTime.toLocaleTimeString()}
            </p>
          )}
           {isLoading && parseFloat(String(totalValue).replace(/,/g, '')) > 0 && (
             <p className="text-xs text-muted-foreground mt-1">
              {t?.updatingValue || "Aktualisiere Wert..."}
            </p>
           )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default PortfolioValue;