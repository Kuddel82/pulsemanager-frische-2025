import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wallet, Loader2, AlertTriangle } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { useAppContext } from '@/contexts/AppContext';

const WalletConnection = ({ 
  onConnect, 
  onDisconnect, 
  isConnected, 
  address, 
  isLoading, 
  error 
}) => {
  const { toast } = useToast();
  const { t } = useAppContext();

  const handleConnect = async () => {
    try {
      await onConnect();
      toast({
        title: t?.walletConnectedToastTitle || "Wallet verbunden",
        description: t?.walletConnectedToastDesc || "Ihre Wallet wurde erfolgreich verbunden.",
        variant: "success",
      });
    } catch (err) {
      toast({
        title: t?.walletConnectErrorToastTitle || "Verbindungsfehler",
        description: t?.walletConnectErrorToastDesc || "Die Wallet konnte nicht verbunden werden. Bitte versuchen Sie es erneut.",
        variant: "destructive",
      });
    }
  };

  const handleDisconnect = () => {
    onDisconnect();
    toast({
      title: t?.walletDisconnectedToastTitle || "Wallet getrennt",
      description: t?.walletDisconnectedToastDesc || "Ihre Wallet wurde erfolgreich getrennt.",
    });
  };

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
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-xl">
            <span className="flex items-center">
              <Wallet className="h-5 w-5 mr-2 text-primary" />
              {isConnected ? (t?.connectedWalletTitle || 'Verbundene Wallet') : (t?.connectWalletTitle || 'Wallet verbinden')}
            </span>
            {isConnected && (
              <Button 
                variant="outline" 
                onClick={handleDisconnect}
                className="ml-2 border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                {t?.disconnectButton || "Trennen"}
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && !isConnected && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border-l-4 border-red-500 text-red-700 dark:text-red-300 rounded-md flex items-start">
              <AlertTriangle className="h-5 w-5 mr-2 mt-0.5 text-red-500 flex-shrink-0" />
              <p className="text-sm">{typeof error === 'string' ? error : (error.message || t?.walletConnectErrorUnknown || "Ein unbekannter Verbindungsfehler ist aufgetreten.")}</p>
            </div>
          )}
          {isConnected ? (
            <p className="text-sm font-mono text-muted-foreground break-all">
             <span className="font-semibold text-foreground">{t?.addressLabel || "Adresse:"}</span> {address ? `${address.substring(0, 6)}...${address.substring(address.length - 4)}` : (t?.loadingAddress || "Lade Adresse...")}
            </p>
          ) : (
            <>
              <p className="text-muted-foreground mb-6 text-center">
                {t?.connectWalletPromptMetaMask || "Verbinden Sie Ihre Wallet, um Ihre Assets zu verwalten."}
              </p>
              <div className="flex flex-col gap-4">
                <Button 
                  onClick={() => onConnect('metamask')} 
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                >
                  <Wallet className="mr-2 h-4 w-4" />
                  {t?.connectMetaMaskButton || "Mit MetaMask verbinden"}
                </Button>
                <Button 
                  onClick={() => onConnect('rabby')} 
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-500 to-sky-500 hover:from-blue-600 hover:to-sky-600 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                >
                  <Wallet className="mr-2 h-4 w-4" />
                  {t?.connectRabby || "Mit Rabby verbinden"}
                </Button>
                <Button 
                  onClick={() => onConnect('walletconnect')} 
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                >
                  <Wallet className="mr-2 h-4 w-4" />
                  {t?.connectWalletConnect || "WalletConnect nutzen"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default WalletConnection;
