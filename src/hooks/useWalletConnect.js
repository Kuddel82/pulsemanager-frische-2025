import { useState, useEffect, useCallback, useRef } from 'react';
import { EthereumProvider } from '@walletconnect/ethereum-provider';
import { useToast } from "@/components/ui/use-toast";
import { APP_TRANSLATIONS } from '@/config/appConfig'; 
// Build cache fix - ensure named import is recognized
import { logger } from '@/lib/logger';

const WALLETCONNECT_PROJECT_ID = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;

export const useWalletConnect = () => {
  const [provider, setProvider] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [chainId, setChainId] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  
  const providerRef = useRef(null); 
  const { toast } = useToast();
  const [language] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('appLanguage') || 'de';
    }
    return 'de';
  });
  const t = APP_TRANSLATIONS[language] || APP_TRANSLATIONS['de'];

  // Use refs to store latest values without causing re-renders
  const latestValues = useRef({ toast, t });
  latestValues.current = { toast, t };

  // FIXED: Stable clearState function without dependencies on changing event handlers
  const clearState = useCallback(() => {
    setProvider(null);
    setAccounts([]);
    setChainId(null);
    setIsConnected(false);
    setIsConnecting(false);
    setError(null);
    if (providerRef.current) {
      try {
        // Remove listeners safely without depending on changing handler references
        providerRef.current.removeAllListeners("display_uri");
        providerRef.current.removeAllListeners("connect");
        providerRef.current.removeAllListeners("session_event");
        providerRef.current.removeAllListeners("disconnect");
      } catch (err) {
        logger.warn("Error removing WalletConnect listeners:", err);
      }
      providerRef.current = null;
    }
    logger.info("WalletConnect state cleared.");
  }, []); // Empty dependencies - stable reference

  const onDisplayUri = useCallback((uri) => {
    logger.info("WalletConnect display_uri:", uri);
  }, []);

  const onConnect = useCallback((connectParams) => {
    const { toast: currentToast, t: currentT } = latestValues.current;
    
    logger.info("WalletConnect connected:", connectParams);
    if (connectParams?.accounts?.length > 0) {
      setAccounts(connectParams.accounts);
      setChainId(connectParams.chainId);
      setIsConnected(true);
      currentToast({ 
        title: currentT.walletConnected, 
        description: `${currentT.walletConnectedTo || "Verbunden mit:"} ${connectParams.accounts[0].substring(0, 6)}...${connectParams.accounts[0].substring(connectParams.accounts[0].length - 4)}`, 
        variant: "success" 
      });
    } else {
      logger.warn("WalletConnect onConnect: No accounts found in session.");
      currentToast({ 
        title: currentT.walletConnectErrorTitle, 
        description: currentT.walletAccountError, 
        variant: "warning" 
      });
    }
    setIsConnecting(false);
  }, []); // Empty dependencies - use latestValues.current

  const onSessionEvent = useCallback((sessionEvent) => {
    logger.info("WalletConnect session_event:", sessionEvent);
    if (sessionEvent.params?.event?.name === "accountsChanged") {
      setAccounts(sessionEvent.params.event.data);
      logger.info("WalletConnect accountsChanged:", sessionEvent.params.event.data);
    }
    if (sessionEvent.params?.event?.name === "chainChanged") {
      setChainId(sessionEvent.params.event.data);
      logger.info("WalletConnect chainChanged:", sessionEvent.params.event.data);
    }
  }, []);

  const onDisconnect = useCallback(() => {
    const { toast: currentToast, t: currentT } = latestValues.current;
    
    logger.info("WalletConnect disconnected event received.");
    clearState(); 
    currentToast({ title: currentT.walletDisconnected, variant: "info" });
  }, [clearState]); // Only depend on stable clearState

  const initializeProvider = useCallback(async () => {
    if (providerRef.current) {
      logger.debug("WalletConnect: Provider already initialized.");
      return providerRef.current;
    }
    if (!WALLETCONNECT_PROJECT_ID) {
      const { toast: currentToast, t: currentT } = latestValues.current;
      currentToast({ 
        title: currentT.walletConnectErrorProjectId, 
        description: currentT.projectIdMissing, 
        variant: "destructive" 
      });
      setError(new Error(currentT.projectIdMissing));
      return null;
    }
    try {
      logger.info("WalletConnect: Initializing EthereumProvider...");
      const newProviderInstance = await EthereumProvider.init({
        projectId: WALLETCONNECT_PROJECT_ID,
        chains: [369], 
        showQrModal: true,
        metadata: {
          name: 'PulseManager App',
          description: 'PulseManager Crypto Dashboard',
          url: window.location.origin,
          icons: [`${window.location.origin}/favicon.ico`],
        },
      });
      providerRef.current = newProviderInstance;
      setProvider(newProviderInstance); 
      
      newProviderInstance.on("display_uri", onDisplayUri);
      newProviderInstance.on("connect", onConnect);
      newProviderInstance.on("session_event", onSessionEvent);
      newProviderInstance.on("disconnect", onDisconnect);
      logger.info("WalletConnect: Provider initialized and listeners attached.");
      return newProviderInstance;
    } catch (e) {
      const { toast: currentToast, t: currentT } = latestValues.current;
      logger.error("Failed to initialize WalletConnect provider:", e);
      currentToast({ 
        title: currentT.walletConnectErrorTitle, 
        description: `${currentT.errorPrefix || "Error:"} ${e.message || currentT.walletConnectErrorUnknown}`, 
        variant: "destructive" 
      });
      setError(e);
      return null;
    }
  }, [onDisplayUri, onConnect, onSessionEvent, onDisconnect]); // These are now stable

  const connectWallet = useCallback(async (walletType = 'walletconnect') => {
    if (isConnecting || isConnected) {
      logger.debug("WalletConnect: connectWallet called but already connecting or connected.");
      return;
    }
    setIsConnecting(true);
    setError(null);
    
    const { toast: currentToast, t: currentT } = latestValues.current;
    
    try {
      if (walletType === 'metamask') {
        if (!window.ethereum) {
          currentToast({ 
            title: currentT.walletConnectErrorTitle, 
            description: currentT.metamaskNotInstalled || 'MetaMask nicht installiert', 
            variant: 'destructive' 
          });
          setError(new Error(currentT.metamaskNotInstalled || 'MetaMask nicht installiert'));
          setIsConnecting(false);
          return;
        }
        const provider = window.ethereum;
        const accounts = await provider.request({ method: 'eth_requestAccounts' });
        setProvider(provider);
        setAccounts(accounts);
        setIsConnected(true);
        setChainId(provider.chainId || null);
        currentToast({ 
          title: currentT.walletConnected, 
          description: `${currentT.walletConnectedTo || "Verbunden mit:"} ${accounts[0].substring(0, 6)}...${accounts[0].substring(accounts[0].length - 4)}`, 
          variant: "success" 
        });
        setIsConnecting(false);
        return;
      }
      if (walletType === 'rabby') {
        if (!window.rabby) {
          currentToast({ 
            title: currentT.walletConnectErrorTitle, 
            description: currentT.rabbyNotInstalled || 'Rabby Wallet nicht installiert', 
            variant: 'destructive' 
          });
          setError(new Error(currentT.rabbyNotInstalled || 'Rabby Wallet nicht installiert'));
          setIsConnecting(false);
          return;
        }
        const provider = window.rabby;
        const accounts = await provider.request({ method: 'eth_requestAccounts' });
        setProvider(provider);
        setAccounts(accounts);
        setIsConnected(true);
        setChainId(provider.chainId || null);
        currentToast({ 
          title: currentT.walletConnected, 
          description: `${currentT.walletConnectedTo || "Verbunden mit:"} ${accounts[0].substring(0, 6)}...${accounts[0].substring(accounts[0].length - 4)}`, 
          variant: "success" 
        });
        setIsConnecting(false);
        return;
      }
      // Default: WalletConnect
      let currentProvider = providerRef.current;
      if (!currentProvider) {
        logger.debug("WalletConnect: No provider, initializing...");
        currentProvider = await initializeProvider();
      }
      if (!currentProvider) {
        logger.warn("WalletConnect: Provider initialization failed.");
        setIsConnecting(false);
        return;
      }
      if (currentProvider.session && currentProvider.accounts?.length > 0) {
        logger.info("WalletConnect: Found existing session, attempting to use it.");
        onConnect({ accounts: currentProvider.accounts, chainId: currentProvider.chainId });
      } else {
        logger.info("WalletConnect: No existing session or accounts, calling connect().");
        await currentProvider.connect();
      }
    } catch (e) {
      logger.error("WalletConnect connect error:", e);
      let detailedErrorMessage = e?.message || currentT.walletConnectErrorUnknown;
      if (String(e?.message).includes("User closed modal")) detailedErrorMessage = currentT.walletConnectUserClosedModal;
      else if (String(e?.message).includes("Connection request reset")) detailedErrorMessage = currentT.walletConnectRequestReset;
      currentToast({ 
        title: currentT.walletConnectErrorTitle, 
        description: detailedErrorMessage, 
        variant: "destructive" 
      });
      setError(e);
      setIsConnecting(false);
      clearState(); 
    }
  }, [isConnecting, isConnected, initializeProvider, onConnect, clearState]); // Stable dependencies

  const disconnectWallet = useCallback(async (showToast = true) => {
    logger.info("WalletConnect: disconnectWallet called.");
    if (providerRef.current) {
      try {
        if (providerRef.current.connected || providerRef.current.session) {
           logger.debug("WalletConnect: Provider connected or has session, calling disconnect on provider.");
           await providerRef.current.disconnect();
        }
      } catch (e) {
        logger.error("Error during WalletConnect provider.disconnect():", e);
      }
    }
    clearState(); 
    if (showToast) {
      const { toast: currentToast, t: currentT } = latestValues.current;
      currentToast({ title: currentT.walletDisconnected, variant: "info" });
    }
  }, [clearState]);

  // FIXED: Simplified cleanup effect without problematic dependencies
  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (providerRef.current) {
        logger.debug("WalletConnect: Cleaning up provider on unmount.");
        try {
          providerRef.current.removeAllListeners();
        } catch (err) {
          logger.warn("Error during unmount cleanup:", err);
        }
      }
    };
  }, []); // Empty dependencies - only run on mount/unmount
  
  const getProvider = useCallback(() => {
    return providerRef.current;
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