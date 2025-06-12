
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

      {/* 🖨️ WGEP Information Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="p-4 bg-yellow-500/10 border border-yellow-400/20 rounded-lg">
          <h3 className="text-lg font-bold text-yellow-400 mb-2">💰 Was ist WGEP?</h3>
          <p className="text-sm text-foreground/80">
            Der World Greatest Ethereum Printer ist ein innovatives DeFi-Protokoll, das darauf ausgelegt ist, 
            kontinuierliche Renditen durch automatisierte Yield-Farming-Strategien zu generieren.
          </p>
        </div>
        
        <div className="p-4 bg-green-500/10 border border-green-400/20 rounded-lg">
          <h3 className="text-lg font-bold text-green-400 mb-2">🎯 Hauptmerkmale</h3>
          <ul className="text-sm text-foreground/80 space-y-1">
            <li>• Automatische Yield-Optimierung</li>
            <li>• Dezentralisierte Governance</li>
            <li>• Kompoundierung von Erträgen</li>
            <li>• Risikomanagement-Tools</li>
          </ul>
        </div>
      </div>

      <div className="p-4 bg-blue-500/10 border border-blue-400/20 rounded-lg mb-6">
        <h3 className="text-lg font-bold text-blue-400 mb-2">⚠️ Wichtige Hinweise</h3>
        <p className="text-sm text-foreground/80">
          <strong>Risiko:</strong> DeFi-Investitionen bergen Verlustrisiken. Investieren Sie nur, was Sie sich leisten können zu verlieren.
          <br />
          <strong>DYOR:</strong> Führen Sie Ihre eigenen Recherchen durch, bevor Sie investieren.
          <br />
          <strong>Externe Plattform:</strong> Das Trading erfolgt über Matcha.xyz - PulseManager ist nicht für Transaktionen verantwortlich.
        </p>
      </div>

      {/* Trading Interface */}
      <div className="flex-grow rounded-lg overflow-hidden shadow-2xl border border-yellow-500/20 bg-black/20">
        <div className="p-4 border-b border-yellow-500/20">
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded flex items-center justify-center text-white font-bold text-xs">
              🖨️
            </div>
            <h3 className="text-lg font-bold gradient-text">WGEP Token kaufen/verkaufen</h3>
          </div>
        </div>
        
        <iframe
          src="https://matcha.xyz/tokens/ethereum/0xfca88920ca5639ad5e954ea776e73dec54fdc065?sellChain=1&sellAddress=0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"
          className="w-full h-[600px] border-0"
          title="WGEP Token Trading Interface"
          allowFullScreen
        />
      </div>
      
      <p className="text-xs text-muted-foreground mt-4 text-center">
        🖨️ <strong>WGEP Trading Interface:</strong> Nutzen Sie die obenstehende Schnittstelle, um WGEP Token über Matcha.xyz zu handeln.
      </p>
    </motion.div>
  );
};

export default WgepView;
