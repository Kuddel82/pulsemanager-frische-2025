import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';

const AutoRefresh = ({ isActive, onToggle }) => {
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
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="flex items-center justify-between text-base sm:text-lg md:text-xl">
            <span className="font-semibold">{t?.autoRefreshTitle || "Automatic Refresh"}</span>
            <Button 
              variant={isActive ? "default" : "outline"}
              onClick={onToggle}
              className={`ml-2 px-3 py-1.5 h-auto text-xs sm:text-sm transition-all duration-300 transform hover:scale-105 ${isActive ? 'bg-green-500 hover:bg-green-600 text-white' : 'border-primary text-primary hover:bg-primary/10'}`}
              size="sm"
            >
              {isActive ? (
                <>
                  <Loader2 className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                  {t?.active || "Active"}
                </>
              ) : (
                <>
                  <RefreshCw className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  {t?.inactive || "Inactive"}
                </>
              )}
            </Button>
          </CardTitle>
        </CardHeader>
      </Card>
    </motion.div>
  );
};

export default AutoRefresh;