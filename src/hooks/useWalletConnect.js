import { useState, useCallback } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { APP_TRANSLATIONS } from '@/config/appConfig'; 
import { logger } from '@/lib/logger';

// 🚧 SIMPLIFIED MOCK: WalletConnect removed to prevent runtime errors
export const useWalletConnect = () => {
  logger.info("🔧 SIMPLIFIED: useWalletConnect hook - WalletConnect removed for stability");
  
  const { toast } = useToast();
  const [language] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('appLanguage') || 'de';
    }
    return 'de';
  });
  const t = APP_TRANSLATIONS[language] || APP_TRANSLATIONS['de'];

  // Mock state - all disconnected/empty
  const provider = null;
  const accounts = [];
  const chainId = null;
  const isConnected = false;
  const isConnecting = false;
  const error = null;

  const connectWallet = useCallback(async (walletType = 'walletconnect') => {
    logger.info("🚧 SIMPLIFIED: connectWallet called - WalletConnect removed");
    toast({ 
      title: t.walletConnectDisabled || "Wallet Connect Disabled", 
      description: t.walletConnectRemovedForStability || "WalletConnect temporarily removed for app stability", 
      variant: "warning" 
    });
  }, [toast, t]);

  const disconnectWallet = useCallback(async (showToast = true) => {
    logger.info("🚧 SIMPLIFIED: disconnectWallet called - WalletConnect removed");
    if (showToast) {
      toast({ 
        title: t.walletDisconnected || "Wallet Disconnected", 
        variant: "info" 
      });
    }
  }, [toast, t]);

  const getProvider = useCallback(() => {
    logger.info("🚧 SIMPLIFIED: getProvider called - WalletConnect removed");
    return null;
  }, []);

  return {
    provider,
    accounts,
    chainId,
    isConnected,
    isConnecting,
    error,
    connectWallet,
    disconnectWallet,
    getProvider
  };
};