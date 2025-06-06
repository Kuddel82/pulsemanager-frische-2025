
import React from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, AlertTriangle, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppContext } from '@/contexts/AppContext';

const SwapView = () => {
  const { language, translations } = useAppContext();
  const t = translations[language];
  const pulseXUrl = "https://pulsex.mypinata.cloud/ipfs/bafybeiajyhfbf6evh4mdabassmbtsy73ci2gmcgh4ffmjkrgsea35vqxba/";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="h-full flex flex-col"
    >
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold gradient-text">{t.tokenTradeViewTitle}</h1>
        <Button variant="outline" onClick={() => window.open(pulseXUrl, '_blank', 'noopener,noreferrer')}>
          <ExternalLink className="mr-2 h-5 w-5" /> 
          {t.tokenTradeOpenInNewTab}
        </Button>
      </div>

      <p className="text-lg text-foreground/80 mb-4">
        {t.tokenTradeDisclaimer}
      </p>
      
      <div className="mb-6 p-4 bg-yellow-100 dark:bg-yellow-900/30 border-l-4 border-yellow-500 text-yellow-700 dark:text-yellow-300 rounded-md">
        <div className="flex items-center">
          <AlertTriangle className="h-6 w-6 mr-2 text-yellow-600 dark:text-yellow-400" />
          <p className="font-semibold">
            {t.tokenTradeWarning}
          </p>
        </div>
      </div>

      <Card className="shadow-xl bg-background/80 dark:bg-slate-800/80 flex-grow flex flex-col min-h-[70vh]">
        <CardHeader>
          <CardTitle className="flex items-center">
            <ShoppingCart className="mr-2 h-6 w-6 text-primary" />
            {t.tokenTradeInterfaceTitle}
          </CardTitle>
          <CardDescription>
            {t.tokenTradeInterfaceDescription}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow p-0 md:p-2 flex flex-col">
          <iframe
            src={pulseXUrl}
            title="PulseX Trade"
            className="w-full flex-grow border-0 rounded-b-lg md:rounded-lg min-h-[600px]"
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          />
        </CardContent>
      </Card>
       <div className="mt-6 p-4 text-sm text-muted-foreground text-center">
         {t.tokenTradeEmbedNote}
      </div>
    </motion.div>
  );
};

export default SwapView;
