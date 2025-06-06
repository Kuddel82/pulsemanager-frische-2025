import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useToast } from "@/components/ui/use-toast";
import { useAppContext } from '@/contexts/AppContext';
import { dbService } from '@/lib/dbService';
import { fetchTokenPrices } from '@/lib/priceService'; 
import { fetchTransactionHistory } from '@/lib/transactionService';
import { retryOperation, retryStrategies } from '@/lib/retryService';
import { logger } from '@/lib/logger';
import WalletConnection from '@/components/views/wallet/WalletConnection';
import AssetDisplay from '@/components/views/wallet/AssetDisplay';
import { ethers } from 'ethers';
import { Button } from '@/components/ui/button';
import { PlusCircle, History, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useWalletData } from '../../hooks/useWalletData';
import { useAccount, useBalance, useConnect } from 'wagmi';
import { formatEther, formatUnits } from 'viem';

const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address) view returns (uint256)"
];

const POPULAR_PULSECHAIN_TOKENS = [
  { name: "PulseX", symbol: "PLSX", address: "0x95B303987A60C71504D99Aa1b13B4DA07b0790ab", logoUrl: "https://assets.coingecko.com/coins/images/28305/large/pulse_x_logo.png?1696527228" },
  { name: "PulseChain Liquid Loans", symbol: "LOAN", address: "0x0C0403152E81b549C20B212051b7A052f0D17578", logoUrl: "https://assets.coingecko.com/coins/images/29320/large/LOAN_Token_Symbol_200x200.png?1696528200" },
  { name: "Piteas", symbol: "PTS", address: "0x58F3744c499628015927100504AF8E05170953D2", logoUrl: "https://assets.coingecko.com/coins/images/30070/large/200x200_ALL_COLOUR_Piteas_PTS_Logo.png?1696528900" },
  { name: "Mintra", symbol: "MINT", address: "0x432EA0afA0335933001462A6134405A8A94139A2", logoUrl: "https://assets.coingecko.com/coins/images/29319/large/MINT_Token_Symbol_200x200.png?1696528199" },
  { name: "Wrapped PLS", symbol: "WPLS", address: "0xA1077a294dC1f4cFB0b86530fc3D182038FD36D8", logoUrl: "https://assets.coingecko.com/coins/images/28305/large/pulse_x_logo.png?1696527228" } 
];

const WalletView = () => {
  const { 
    t, 
    wcConnectWallet, 
    wcDisconnectWallet, 
    wcIsConnecting, 
    wcIsConnected, 
    wcError,
    wcProvider, 
    user, 
    connectedWalletAddress: wcAddress 
  } = useAppContext();

  const [isLoadingAssets, setIsLoadingAssets] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [assets, setAssets] = useState([]);
  const [lastFetchTime, setLastFetchTime] = useState(null);
  const [autoRefreshActive, setAutoRefreshActive] = useState(false);
  const [totalPortfolioValue, setTotalPortfolioValue] = useState(0);
  const [fetchError, setFetchError] = useState(null);

  const { toast } = useToast();
  const { showToast } = useToast();
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const refreshInterval = useRef(null);

  const { walletData, isLoading, refreshData } = useWalletData(address);

  const [isRefreshing, setIsRefreshing] = useState(false);

  // Memoize the stable fetch function to prevent infinite loops
  const stableFetchAssets = useCallback(async (isManualRefresh = false) => {
    if (!wcIsConnected || !wcProvider || !wcAddress || !user?.id) {
      logger.info("WalletView.fetchAssets: Pre-conditions not met.");
      setAssets([]);
      setTotalPortfolioValue(0);
      return;
    }

    logger.info(`WalletView.fetchAssets: Starting asset fetch for ${wcAddress}. Manual: ${isManualRefresh}`);
    setIsLoadingAssets(true);
    setFetchError(null);

    try {
      const ethersProvider = new ethers.providers.Web3Provider(wcProvider);
      const signer = ethersProvider.getSigner();
      const currentAddress = await signer.getAddress(); 
      
      if (currentAddress.toLowerCase() !== wcAddress.toLowerCase()) {
        logger.warn(`WalletView.fetchAssets: Address mismatch. WC: ${wcAddress}, Signer: ${currentAddress}.`);
        setIsLoadingAssets(false);
        setFetchError(t?.walletAddressMismatch || 'Wallet address mismatch. Please reconnect.');
        return;
      }

      let fetchedAssets = [];
      const tokenAddressMap = {};

      try {
        const nativeBalance = await ethersProvider.getBalance(currentAddress);
        const nativeBalanceFormatted = parseFloat(ethers.utils.formatEther(nativeBalance));
        if (nativeBalanceFormatted > 0) {
          fetchedAssets.push({
            id: 'PLS', name: 'PulseChain', symbol: 'PLS', balance: nativeBalanceFormatted,
            valueUSD: 0, logoUrl: 'https://assets.coingecko.com/coins/images/28305/large/pulse_x_logo.png?1696527228', 
            isNative: true, address: '0x0000000000000000000000000000000000000000' 
          });
          tokenAddressMap['PLS'] = '0xA1077a294dC1f4cFB0b86530fc3D182038FD36D8'; 
        }
      } catch (e) {
        logger.error("WalletView.fetchAssets: Error fetching native balance:", e);
      }

      for (const token of POPULAR_PULSECHAIN_TOKENS) {
        try {
          const contract = new ethers.Contract(token.address, ERC20_ABI, ethersProvider);
          const balance = await contract.balanceOf(currentAddress);
          const decimals = await contract.decimals(); 
          const name = await contract.name(); 
          const symbol = await contract.symbol();
          const formattedBalance = parseFloat(ethers.utils.formatUnits(balance, decimals));

          if (formattedBalance > 0) {
            fetchedAssets.push({
              id: token.address, name: name || token.name, symbol: symbol || token.symbol, 
              balance: formattedBalance, valueUSD: 0, logoUrl: token.logoUrl || null, 
              isNative: false, address: token.address
            });
            tokenAddressMap[symbol || token.symbol] = token.address;
          }
        } catch (e) {
          logger.error(`WalletView.fetchAssets: Error for ${token.symbol} (${token.address}):`, e);
        }
      }
      
      let tokenPrices = {};
      if (Object.keys(tokenAddressMap).length > 0) {
        tokenPrices = await fetchTokenPrices(tokenAddressMap, '369'); 
      }

      let currentTotalValue = 0;
      const finalAssets = fetchedAssets.map(asset => {
        const price = tokenPrices[asset.symbol] || (asset.isNative ? tokenPrices['PLS'] : 0) || 0;
        const valueUSD = asset.balance * price;
        currentTotalValue += valueUSD;
        return { ...asset, valueUSD, price };
      });

      setAssets(finalAssets);
      setTotalPortfolioValue(parseFloat(currentTotalValue.toFixed(2)));
      setLastFetchTime(new Date());

      if (finalAssets.length > 0) {
        const roiEntries = finalAssets.map(asset => ({
          user_id: user.id, asset_symbol: asset.symbol, asset_name: asset.name,
          current_balance: asset.balance, purchase_price: asset.price, 
          current_value_usd: asset.valueUSD, transaction_date: new Date().toISOString(), 
          source: 'wallet-sync', wallet_address: currentAddress
        }));
        
        try {
          const { error: dbError } = await dbService.batchSync(user.id, { roiEntries });
          if (dbError) {
            logger.error("WalletView.fetchAssets: DB sync error:", dbError);
            toast({ title: t?.dbSyncErrorTitle, description: t?.dbSyncErrorDesc, variant: "destructive" });
          } else if (isManualRefresh) {
            toast({ title: t?.assetsRefreshedTitle, description: t?.assetsRefreshedDesc, variant: "success" });
          }
        } catch (dbSyncError) {
          logger.error("WalletView.fetchAssets: DB sync exception:", dbSyncError);
        }
      }

    } catch (error) {
      logger.error('WalletView.fetchAssets: General error:', error);
      setFetchError(t?.assetsLoadError || 'Assets konnten nicht geladen werden.');
      toast({ title: t?.errorGenericTitle, description: t?.assetsLoadErrorToast, variant: "destructive" });
      setAssets([]);
      setTotalPortfolioValue(0);
    } finally {
      setIsLoadingAssets(false);
    }
  }, [wcIsConnected, wcProvider, wcAddress, user?.id, toast, t]); // Fixed dependencies

  // Memoize the transaction history function
  const loadTransactionHistory = useCallback(async () => {
    if (!wcIsConnected || !wcAddress || !user?.id) {
      logger.info("WalletView.loadTransactionHistory: Pre-conditions not met.");
      return;
    }
    
    logger.info(`WalletView.loadTransactionHistory: Starting history fetch for ${wcAddress}`);
    setIsLoadingHistory(true);
    try {
      await fetchTransactionHistory(wcAddress, 0, user.id);
      toast({
        title: t?.txHistoryLoadedTitle || "Transaktionshistorie geladen",
        description: t?.txHistoryLoadedDesc || "Die Transaktionen wurden erfolgreich importiert.",
        variant: "success"
      });
    } catch (error) {
      logger.error('WalletView.loadTransactionHistory: Error:', error);
      toast({
        title: t?.errorGenericTitle || "Fehler",
        description: t?.txHistoryLoadErrorToast || "Transaktionshistorie konnte nicht geladen werden.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingHistory(false);
    }
  }, [wcIsConnected, wcAddress, user?.id, toast, t]); // Fixed dependencies

  // Only fetch data once when conditions are met - prevent infinite loops
  useEffect(() => {
    if (wcIsConnected && user?.id && wcAddress && !autoRefreshActive && !isLoadingAssets) {
      logger.debug("WalletView: Initial data fetch on connect/user change.");
      stableFetchAssets(false);
      loadTransactionHistory();
    }
  }, [wcIsConnected, user?.id, wcAddress]); // Removed function dependencies to prevent loops

  // Auto-refresh effect with proper cleanup
  useEffect(() => {
    if (autoRefreshActive && wcIsConnected && user?.id && wcAddress) {
      logger.info("WalletView: Starting auto-refresh.");
      const interval = setInterval(() => {
        logger.debug("WalletView: Auto-refresh triggered.");
        stableFetchAssets(true); 
      }, 30000); 
      
      refreshInterval.current = interval;
      
      return () => {
        logger.info("WalletView: Clearing auto-refresh interval.");
        clearInterval(interval);
      };
    } else {
      if (refreshInterval.current) {
        clearInterval(refreshInterval.current);
        refreshInterval.current = null;
      }
    }
  }, [autoRefreshActive, wcIsConnected, user?.id, wcAddress]); // Removed function dependency

  // Memoize event handlers to prevent re-renders
  const handleConnect = useCallback(async () => {
    try {
      // Verwende MetaMask als Standard-Connector
      const metaMaskConnector = connectors.find(connector => connector.id === 'metaMask');
      if (metaMaskConnector) {
        await connect({ connector: metaMaskConnector });
      } else {
        // Fallback auf den ersten verfügbaren Connector
        await connect({ connector: connectors[0] });
      }
    } catch (error) {
      logger.error('Wallet connection error:', error);
      showToast('Fehler beim Verbinden der Wallet', 'error');
    }
  }, [connectors, connect, showToast]);

  const handleDisconnect = useCallback(() => {
    wcDisconnectWallet();
    setAssets([]);
    setTotalPortfolioValue(0);
    setLastFetchTime(null);
    setFetchError(null);
    if (refreshInterval.current) {
      clearInterval(refreshInterval.current);
      refreshInterval.current = null;
    }
  }, [wcDisconnectWallet]);

  const toggleAutoRefresh = useCallback(() => {
    setAutoRefreshActive(prev => !prev);
  }, []);

  const handleRefresh = useCallback(async () => {
    if (isRefreshing) return; // Prevent multiple simultaneous calls
    
    try {
      setIsRefreshing(true);
      await refreshData();
      // Call stableFetchAssets directly without dependency
      stableFetchAssets(true);
      showToast('Wallet-Daten aktualisiert', 'success');
    } catch (error) {
      logger.error('Error refreshing wallet data:', error);
      showToast('Fehler beim Aktualisieren der Daten', 'error');
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, refreshData, showToast]);

  // Memoize animation variants to prevent re-creation
  const containerVariants = useMemo(() => ({
    hidden: { opacity: 0 }, 
    visible: { opacity: 1, transition: { staggerChildren: 0.1 }}
  }), []);

  const itemVariants = useMemo(() => ({
    hidden: { y: 20, opacity: 0 }, 
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 }}
  }), []);

  // Separate effect for Wagmi account changes
  useEffect(() => {
    if (isConnected && address) {
      // Call refreshData directly without dependency
      refreshData?.();
    }
  }, [isConnected, address]); // Removed refreshData to prevent loops

  return (
    <motion.div 
      className="space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl md:text-4xl font-bold gradient-text mb-2">{t?.walletViewTitle || "My Wallets"}</h1>
        <p className="text-muted-foreground text-lg">{t?.walletViewSubtitle || "Overview of your connected wallets and balances."}</p>
      </motion.div>

      {!user?.id ? (
         <motion.div variants={itemVariants}>
           <p className="text-muted-foreground text-center py-10">{t?.pleaseLogIn || "Please log in to view wallet information."}</p>
        </motion.div>
      ) : (
        <WalletConnection
          onConnect={handleConnect}
          onDisconnect={handleDisconnect}
          isConnected={wcIsConnected}
          address={wcAddress || (wcIsConnected && !wcError && !fetchError ? (t?.loadingAddress || "Lade Adresse...") : null)}
          isLoading={wcIsConnecting || (wcIsConnected && (isLoadingAssets || isLoadingHistory) && assets.length === 0)}
          error={fetchError || (wcError ? (wcError.message || t?.walletConnectErrorUnknown || "Unknown wallet connection error") : null)}
        />
      )}

      {wcIsConnected && user?.id && (
        <>
          <AssetDisplay
            assets={assets}
            isLoading={isLoadingAssets || isLoadingHistory}
            lastFetchTime={lastFetchTime}
            onRefresh={handleRefresh}
            totalPortfolioValue={totalPortfolioValue}
            autoRefresh={autoRefreshActive}
            onToggleAutoRefresh={toggleAutoRefresh}
          />
          
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4 mt-8">
            <Button 
              variant="outline" 
              className="border-primary text-primary hover:bg-primary/10 w-full sm:w-auto" 
              onClick={loadTransactionHistory}
              disabled={isLoadingHistory}
            >
              {isLoadingHistory ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <History className="mr-2 h-5 w-5" />
              )}
              {t?.reloadTxHistoryButton || "Reload Transaction History"}
            </Button>
            <Button variant="outline" className="border-accent text-accent-foreground hover:bg-accent/10 w-full sm:w-auto" disabled>
              <PlusCircle className="mr-2 h-5 w-5" />
              {t?.addAnotherWallet || "Add Another Wallet (Coming Soon)"}
            </Button>
          </motion.div>
        </>
      )}
    </motion.div>
  );
};

export default WalletView;
