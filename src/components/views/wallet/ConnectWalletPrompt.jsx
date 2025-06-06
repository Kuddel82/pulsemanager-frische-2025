import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Loader2, Wallet } from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';

const ConnectWalletPrompt = ({ onConnectWallet, isConnecting }) => {
  const { t, wcError } = useAppContext();

  return (
    <Card className="shadow-xl hover:shadow-2xl transition-shadow duration-300 border-border/20 bg-background/70 dark:bg-slate-800/70 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center text-xl">
          <AlertTriangle className="h-6 w-6 mr-2 text-destructive" />
          {t?.noWalletsConnected || "No Wallets Connected"}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center">
        {wcError && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border-l-4 border-red-500 text-red-700 dark:text-red-300 rounded-md flex items-start">
            <AlertTriangle className="h-5 w-5 mr-2 mt-0.5 text-red-500 flex-shrink-0" />
            <p className="text-sm">{typeof wcError === 'string' ? wcError : (wcError.message || t?.walletConnectErrorUnknown || "Ein unbekannter Verbindungsfehler ist aufgetreten.")}</p>
          </div>
        )}
        <p className="text-muted-foreground mb-6">{t?.walletConnectPrompt || "Connect a wallet to view your assets and manage your portfolio."}</p>
        <Button 
          onClick={onConnectWallet} 
          disabled={isConnecting}
          className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105"
        >
          {isConnecting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              {t?.connectingWallet || "Connecting..."}
            </>
          ) : (
            <>
              <Wallet className="mr-2 h-5 w-5" />
              {t?.connectWallet || "Connect Wallet"}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ConnectWalletPrompt;