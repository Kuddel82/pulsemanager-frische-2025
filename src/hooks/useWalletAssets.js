import { useState, useEffect, useCallback, useRef } from 'react';
import { ethers } from 'ethers';
// REMOVED: useToast to prevent DOM conflicts
import { useAppContext } from '@/contexts/AppContext';
import { fetchTokenPrices as fetchPricesFromApi } from '@/lib/priceService';
import { dbService } from '@/lib/dbService'; 
import { logger } from '@/lib/logger';

const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
  "function decimals() view returns (uint8)"
];

const KNOWN_TOKEN_ADDRESSES = [
  { address: "0x95B303987A60C71504D99Aa1b13B4DA07b0790ab", symbol: "PLSX", chainId: 369 }, 
  { address: "0x2b591e99afE9f32eAA6214f7B7629768c40Eeb39", symbol: "HEX", chainId: 369 },
  { address: "0x02DcdD04e3a455f2b876Ed0F699124A3A2504997", symbol: "INC", chainId: 369},
  { address: "0x8a810ea8B121d08342E0CAb46E4A60446266A3Ed", symbol: "PLSP", chainId: 369},
  { address: "0x6B175474E89094C44Da98b954EedeAC495271d0F", symbol: "DAI", chainId: 1 }, 
  { address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", symbol: "USDC", chainId: 1 }, 
];

export const useWalletAssets = () => {
  const { 
    user, 
    wcProvider, 
    wcIsConnected, 
    wcAccounts, 
    t,
    isSupabaseClientReady
  } = useAppContext();
  const [assets, setAssets] = useState([]);
  const [isLoadingAssets, setIsLoadingAssets] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  
  const connectedWalletAddress = wcAccounts?.[0] || null;

  const syncWalletAssetsToSupabase = useCallback(async (walletAssetsToSync) => {
    if (!user?.id || !walletAssetsToSync || walletAssetsToSync.length === 0 || !connectedWalletAddress) {
        logger.warn("syncWalletAssetsToSupabase: Pre-conditions not met.", { userId: user?.id, hasAssets: walletAssetsToSync?.length > 0, connectedWalletAddress });
        return;
    }

    logger.info("syncWalletAssetsToSupabase: Starting sync for user:", user.id, "and address:", connectedWalletAddress);

    try {
        const roiEntries = walletAssetsToSync.map(asset => ({
            symbol: asset.symbol,
            name: asset.name,
            purchase_date: asset.purchaseDate, 
            purchase_price: parseFloat(asset.purchasePrice) || 0,
            quantity: parseFloat(String(asset.balance).replace(/,/g, '')) || 0,
            current_value: parseFloat(String(asset.valueUSD).replace(/,/g, '')) || 0,
            wallet_address: connectedWalletAddress,
            source: 'wallet_sync' 
        }));
        
        logger.debug("syncWalletAssetsToSupabase: Prepared ROI entries:", roiEntries);
        const { error: roiError } = await dbService.syncRoiEntries(user.id, roiEntries);
        if (roiError) {
            logger.error("syncWalletAssetsToSupabase: Error syncing ROI entries:", roiError);
            throw new Error(`ROI Sync Error: ${roiError.message}`);
        }
        logger.info("syncWalletAssetsToSupabase: ROI entries synced successfully.");

        const taxEntries = walletAssetsToSync.map(asset => ({
            asset_symbol: asset.symbol,
            asset_name: asset.name,
            transaction_date: asset.purchaseDate, 
            transaction_type: 'purchase', 
            amount: parseFloat(String(asset.balance).replace(/,/g, '')) || 0,
            price_usd: parseFloat(asset.purchasePrice) || 0,
            wallet_address: connectedWalletAddress,
            total_value_usd: parseFloat(String(asset.valueUSD).replace(/,/g, '')) || 0,
            notes: 'Synchronized from wallet connection.'
        }));
        
        logger.debug("syncWalletAssetsToSupabase: Prepared Tax entries:", taxEntries);
        const { error: taxError } = await dbService.syncTaxEntries(user.id, taxEntries);
        if (taxError) {
            logger.error("syncWalletAssetsToSupabase: Error syncing Tax entries:", taxError);
            throw new Error(`Tax Sync Error: ${taxError.message}`);
        }
        logger.info("syncWalletAssetsToSupabase: Tax entries synced successfully.");

        setStatusMessage(`Assets synced successfully: ${walletAssetsToSync.length} items`);
        
    } catch (error) {
        logger.error("syncWalletAssetsToSupabase: Overall catch block error:", error);
        setStatusMessage(`Error syncing wallet assets: ${error.message}`);
    }
  }, [user, connectedWalletAddress, t]);


  const fetchAssets = useCallback(async (isManualRefresh = false) => {
    logger.info("useWalletAssets fetchAssets called.", { wcIsConnected, wcProvider: !!wcProvider, connectedWalletAddress, isManualRefresh, userId: user?.id, isSupabaseClientReady });
    if (!wcIsConnected || !connectedWalletAddress || !user?.id || !isSupabaseClientReady) {
      logger.warn("useWalletAssets fetchAssets: Preconditions not met. Aborting.", { wcIsConnected, connectedWalletAddress, userId: user?.id, isSupabaseClientReady });
      setAssets([]);
      setIsLoadingAssets(false);
      return;
    }
    
    setIsLoadingAssets(true);
    
    if (wcProvider) {
      try {
        const provider = new ethers.providers.Web3Provider(wcProvider);
        const signer = provider.getSigner();
        const network = await provider.getNetwork();
        const currentChainId = network.chainId;
        logger.debug("useWalletAssets fetchAssets: Connected to chain ID:", currentChainId);

        const plsBalanceWei = await signer.getBalance();
        const plsBalanceFormatted = ethers.utils.formatEther(plsBalanceWei);
        
        const tokenAddressesForChain = KNOWN_TOKEN_ADDRESSES.filter(t => t.chainId === currentChainId).map(t => t.address);
        logger.debug("useWalletAssets fetchAssets: Token addresses for current chain:", tokenAddressesForChain);

        const tokenDataPromises = tokenAddressesForChain.map(async (address) => {
          try {
            const contract = new ethers.Contract(address, ERC20_ABI, signer);
            const [balanceRaw, symbol, name, decimals] = await Promise.all([
              contract.balanceOf(connectedWalletAddress),
              contract.symbol(),
              contract.name(),
              contract.decimals()
            ]);
            return { address, name, symbol, balanceRaw, decimals };
          } catch (tokenError) {
            logger.error(`Error fetching data for token ${address}:`, tokenError.message);
            return null; 
          }
        });

        const rawTokenData = (await Promise.all(tokenDataPromises)).filter(data => data !== null);
        
        const allTokenAddresses = [
          '0x0000000000000000000000000000000000000000', 
          ...rawTokenData.map(token => token.address)
        ];

        const prices = await fetchPricesFromApi(allTokenAddresses, currentChainId);
        const plsPrice = prices['0x0000000000000000000000000000000000000000'] || 0;
        
        const fetchedAssetsList = [];

        fetchedAssetsList.push({ 
          id: `pls_real_${connectedWalletAddress.slice(-4)}`,
          name: 'PulseCoin', 
          symbol: 'PLS', 
          balance: parseFloat(plsBalanceFormatted),
          balanceFormatted: parseFloat(plsBalanceFormatted).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 }),
          valueUSD: (parseFloat(plsBalanceFormatted) * plsPrice).toFixed(2),
          priceUSD: plsPrice.toFixed(8),
          logoUrl: 'https://via.placeholder.com/32/A020F0/FFFFFF?text=PLS',
          purchaseDate: new Date().toISOString(),
          purchasePrice: plsPrice.toString(),
          decimals: 18,
          address: '0x0000000000000000000000000000000000000000' 
        });

        rawTokenData.forEach(token => {
          const balanceFormatted = ethers.utils.formatUnits(token.balanceRaw, token.decimals);
          const tokenPrice = prices[token.address.toLowerCase()] || prices[token.address] || 0;
          const displayDecimals = token.decimals > 4 ? 4 : token.decimals;
          
          fetchedAssetsList.push({
            id: `${token.symbol.toLowerCase()}_real_${token.address.slice(-4)}`,
            name: token.name,
            symbol: token.symbol,
            balance: parseFloat(balanceFormatted),
            balanceFormatted: parseFloat(balanceFormatted).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: displayDecimals }),
            valueUSD: (parseFloat(balanceFormatted) * tokenPrice).toFixed(2),
            priceUSD: tokenPrice.toFixed(8),
            logoUrl: `https://pulsechain.com/logo.png`, 
            purchaseDate: new Date().toISOString(),
            purchasePrice: tokenPrice.toString(),
            decimals: token.decimals,
            address: token.address
          });
        });
        
        setAssets(fetchedAssetsList);
        setLastFetchTime(new Date());
        logger.info("useWalletAssets fetchAssets: Assets fetched and prices applied. Count:", fetchedAssetsList.length);

        if (user?.id && isSupabaseClientReady) {
          logger.debug("useWalletAssets fetchAssets: Calling syncWalletAssetsToSupabase.");
          await syncWalletAssetsToSupabase(fetchedAssetsList);
        } else {
            logger.warn("useWalletAssets fetchAssets: Not calling syncWalletAssetsToSupabase due to missing user/Supabase client.");
        }
        
        if (isManualRefresh) {
          setStatusMessage(`Assets refreshed: ${fetchedAssetsList.length} items`);
        }
            
      } catch (error) {
        logger.error("useWalletAssets fetchAssets: Error fetching assets:", error);
        setStatusMessage(`Error fetching data: ${error.message}`);
        setAssets([]); 
      }
    }
    setIsLoadingAssets(false);
  }, [wcIsConnected, connectedWalletAddress, wcProvider, user, syncWalletAssetsToSupabase, t, isSupabaseClientReady]);

  return { 
    assets, 
    isLoadingAssets, 
    lastFetchTime, 
    fetchAssets,
    connectedWalletAddress,
    statusMessage,
    clearStatus: () => setStatusMessage('')
  };
};