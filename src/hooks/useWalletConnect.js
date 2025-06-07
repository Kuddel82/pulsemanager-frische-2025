import { useState, useCallback } from 'react';
// REMOVED: useToast to prevent DOM conflicts
import { APP_TRANSLATIONS } from '@/config/appConfig'; 
import { logger } from '@/lib/logger';

// 🚧 SIMPLIFIED MOCK: WalletConnect removed to prevent runtime errors
export const useWalletConnect = () => {
  logger.info("🔧 SIMPLIFIED: useWalletConnect hook - WalletConnect removed for stability");
  
  const [language] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('appLanguage') || 'de';
    }
    return 'de';
  });
  const t = APP_TRANSLATIONS[language] || APP_TRANSLATIONS['de'];
  const [statusMessage, setStatusMessage] = useState('');

  // Mock state - all disconnected/empty
  const provider = null;
  const accounts = [];
  const chainId = null;
  const isConnected = false;
  const isConnecting = false;
  const error = null;

  const connectWallet = useCallback(async (walletType = 'walletconnect') => {
    logger.info("🚧 SIMPLIFIED: connectWallet called - WalletConnect removed");
    setStatusMessage(t.walletConnectRemovedForStability || "WalletConnect temporarily removed for app stability");
  }, [t]);

  const disconnectWallet = useCallback(async (showToast = true) => {
    logger.info("🚧 SIMPLIFIED: disconnectWallet called - WalletConnect removed");
    if (showToast) {
      setStatusMessage(t.walletDisconnected || "Wallet Disconnected");
    }
  }, [t]);

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
    getProvider,
    statusMessage,
    clearStatus: () => setStatusMessage('')
  };
};