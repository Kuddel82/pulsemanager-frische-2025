
import React from 'react';
import { motion } from 'framer-motion';
import { Leaf, ExternalLink, ShieldAlert } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAppContext } from '@/contexts/AppContext';

const WgepView = () => {
  const { language, translations } = useAppContext();
  const t = translations[language];
  const wgepTradeUrl = "https://matcha.xyz/tokens/1/0xfca88920ca5639ad5e954ea776e73dec54fdc065";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="h-full flex flex-col"
    >
      <div className="flex items-center mb-6">
        <Leaf className="h-8 w-8 text-green-500 mr-3" />
        <h1 className="text-3xl font-bold gradient-text">{t.wgepViewTitle}</h1>
      </div>

      <Card className="mb-6 bg-background/70 dark:bg-slate-800/70 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl text-primary">{t.wgepAbout}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-foreground/90 leading-relaxed mb-4">
            {t.wgepDescription}
          </p>
          <Button 
            onClick={() => window.open(wgepTradeUrl, '_blank')}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {t.wgepTradeButton}
            <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>

      <Alert variant="destructive" className="mb-6">
        <ShieldAlert className="h-5 w-5" />
        <AlertTitle>{t.wgepAlertTitle}</AlertTitle>
        <AlertDescription>
          {t.wgepAlertDescription}
        </AlertDescription>
      </Alert>

      <div className="flex-grow rounded-lg overflow-hidden shadow-2xl border border-primary/20 bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
        <div className="text-center p-4">
          <ShieldAlert className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground">
            {t.wgepDirectViewNotAvailable}
          </p>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-4 text-center">
        {t.wgepTradeDisclaimer}
      </p>
    </motion.div>
  );
};

export default WgepView;
