import React, { useState, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect, useBalance } from 'wagmi';
import { formatEther, formatUnits } from 'viem';
import { useAuth } from '@/contexts/AuthContext';
import { Wallet, RefreshCw, Copy, ExternalLink, TrendingUp } from 'lucide-react';

// 🔥 PulseChain Tokens (OBERSTE PRIORITÄT)
const PULSECHAIN_TOKENS = [
  { 
    symbol: "PLS", 
    name: "PulseChain", 
    isNative: true, 
    decimals: 18,
    chainId: 369,
    logo: "🟢"
  },
  { 
    symbol: "PLSX", 
    name: "PulseX", 
    address: "0x95B303987A60C71504D99Aa1b13B4DA07b0790ab", 
    decimals: 18,
    chainId: 369,
    logo: "🔄"
  },
  { 
    symbol: "WPLS", 
    name: "Wrapped PLS", 
    address: "0xA1077a294dC1f4cFB0b86530fc3D182038FD36D8", 
    decimals: 18,
    chainId: 369,
    logo: "🟢"
  },
  { 
    symbol: "HEX", 
    name: "HEX", 
    address: "0x2b591e99afE9f32eAA6214f7B7629768c40Eeb39", 
    decimals: 8,
    chainId: 369,
    logo: "⬡"
  }
];

// 💎 Ethereum Tokens (Secondary)
const ETHEREUM_TOKENS = [
  { 
    symbol: "ETH", 
    name: "Ethereum", 
    isNative: true, 
    decimals: 18,
    chainId: 1,
    logo: "🔷"
  },
  { 
    symbol: "USDC", 
    name: "USD Coin", 
    address: "0xA0b86a33E6441ad7bfC40E4ac17F3Ac8bD5F8E34", 
    decimals: 6,
    chainId: 1,
    logo: "💵"
  },
  { 
    symbol: "USDT", 
    name: "Tether USD", 
    address: "0xdAC17F958D2ee523a2206206994597C13D831ec7", 
    decimals: 6,
    chainId: 1,
    logo: "💰"
  }
];

const WalletView = () => {
  const { user } = useAuth();
  const { address, isConnected, chain } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  
  const [isLoading, setIsLoading] = useState(false);
  const [tokenBalances, setTokenBalances] = useState({});
  const [tokenPrices, setTokenPrices] = useState({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' | 'error'

  // 🔗 Get native balance for current chain
  const { data: nativeBalance } = useBalance({
    address: address,
    enabled: isConnected && !!address,
  });

  // 💰 Fetch Token Balances
  const fetchTokenBalances = async () => {
    if (!address || !isConnected) return;
    
    setIsRefreshing(true);
    try {
      const currentTokens = chain?.id === 369 ? PULSECHAIN_TOKENS : ETHEREUM_TOKENS;
      const balances = {};
      
      // Native token balance
      if (nativeBalance) {
        const nativeToken = currentTokens.find(t => t.isNative);
        if (nativeToken) {
          balances[nativeToken.symbol] = {
            balance: formatEther(nativeBalance.value),
            decimals: nativeToken.decimals,
            symbol: nativeToken.symbol,
            name: nativeToken.name
          };
        }
      }

      // ERC20 token balances (simulated for now)
      for (const token of currentTokens.filter(t => !t.isNative)) {
        // TODO: Real ERC20 balance calls here
        balances[token.symbol] = {
          balance: "0",
          decimals: token.decimals,
          symbol: token.symbol,
          name: token.name
        };
      }

      setTokenBalances(balances);
    } catch (error) {
      setMessage("Failed to fetch token balances");
      setMessageType('error');
      setTimeout(() => setMessage(''), 5000);
    } finally {
      setIsRefreshing(false);
    }
  };

  // 📊 Fetch Token Prices
  const fetchTokenPrices = async () => {
    try {
      const prices = {};
      
      if (chain?.id === 369) {
        // PulseChain prices (simulated - would use PulseX API)
        prices.PLS = 0.0001; // Placeholder
        prices.PLSX = 0.0002; // Placeholder
        prices.WPLS = 0.0001; // Placeholder
        prices.HEX = 0.005; // Placeholder
      } else {
        // Ethereum prices (simulated - would use CoinGecko/CoinMarketCap)
        prices.ETH = 2300; // Placeholder
        prices.USDC = 1.00; // Placeholder
        prices.USDT = 1.00; // Placeholder
      }
      
      setTokenPrices(prices);
    } catch (error) {
      console.error("Failed to fetch prices:", error);
    }
  };

  // 🔄 Auto-refresh when wallet connects
  useEffect(() => {
    if (isConnected && address) {
      fetchTokenBalances();
      fetchTokenPrices();
    }
  }, [isConnected, address, chain?.id, nativeBalance]);

  // 🚀 Simple Connect Function
  const handleConnect = async () => {
    try {
      setIsLoading(true);
      const connector = connectors.find(c => c.id === 'metaMask') || connectors[0];
      await connect({ connector });
      setMessage("Successfully connected to your wallet");
      setMessageType('success');
      setTimeout(() => setMessage(''), 5000);
    } catch (error) {
      setMessage(error.message || "Connection failed");
      setMessageType('error');
      setTimeout(() => setMessage(''), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  // 🔄 Manual Refresh
  const handleRefresh = () => {
    fetchTokenBalances();
    fetchTokenPrices();
  };

  // 📋 Copy Address
  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setMessage("Wallet address copied to clipboard");
      setMessageType('success');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  // 🔗 Open in Explorer
  const openInExplorer = () => {
    if (address) {
      const explorerUrl = chain?.id === 369 
        ? `https://scan.pulsechain.com/address/${address}`
        : `https://etherscan.io/address/${address}`;
      window.open(explorerUrl, '_blank');
    }
  };

  // 💎 Get current tokens based on chain
  const getCurrentTokens = () => {
    return chain?.id === 369 ? PULSECHAIN_TOKENS : ETHEREUM_TOKENS;
  };

  // 💰 Calculate total portfolio value
  const getTotalValue = () => {
    let total = 0;
    Object.entries(tokenBalances).forEach(([symbol, data]) => {
      const price = tokenPrices[symbol] || 0;
      const balance = parseFloat(data.balance) || 0;
      total += balance * price;
    });
    return total;
  };

  if (!user) {
    return (
      <div className="pulse-card p-8 text-center">
        <Wallet className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h2 className="pulse-title mb-2">Wallet Access</h2>
        <p className="pulse-text-secondary">Please log in to connect your wallet</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 🎯 Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="pulse-title mb-2">
            {chain?.id === 369 ? "🟢 PulseChain Wallet" : "🔷 Ethereum Wallet"}
          </h1>
          <p className="pulse-subtitle">
            {chain?.id === 369 
              ? "Connect and monitor your PulseChain assets" 
              : "Connect and monitor your Ethereum assets"
            }
          </p>
        </div>
        {isConnected && (
          <button 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="py-3 px-6 bg-gradient-to-r from-green-400 to-blue-500 text-black font-semibold rounded-lg hover:from-green-500 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-green-400/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        )}
      </div>

      {/* 📢 Message Display */}
      {message && (
        <div className={`p-3 rounded-lg border ${
          messageType === 'success' 
            ? 'bg-green-400/10 border-green-400/20 text-green-400' 
            : 'bg-red-400/10 border-red-400/20 text-red-400'
        }`}>
          <p className="text-sm">{message}</p>
        </div>
      )}

      {/* 💼 Wallet Connection */}
      <div className="pulse-card p-6">
        {!isConnected ? (
          <div className="text-center">
            <Wallet className="h-16 w-16 text-green-400 mx-auto mb-6" />
            <h3 className="text-xl font-semibold pulse-text mb-2">Connect Your Wallet</h3>
            <p className="pulse-text-secondary mb-6">
              Connect MetaMask to view your {chain?.id === 369 ? "PulseChain" : "Ethereum"} assets
            </p>
            <button 
              onClick={handleConnect} 
              disabled={isLoading}
              className="py-3 px-6 bg-gradient-to-r from-green-400 to-blue-500 text-black font-semibold rounded-lg hover:from-green-500 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-green-400/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Wallet className="h-4 w-4" />
              )}
              Connect Wallet
            </button>
          </div>
        ) : (
          <div>
            {/* 🔗 Connected Wallet Info */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
              <div>
                <h3 className="text-lg font-semibold pulse-text mb-1">
                  {chain?.id === 369 ? "🟢 PulseChain Connected" : "🔷 Ethereum Connected"}
                </h3>
                <div className="flex items-center gap-2 text-sm pulse-text-secondary">
                  <code className="bg-white/5 px-2 py-1 rounded">
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                  </code>
                  <button onClick={copyAddress} className="p-1 hover:text-green-400">
                    <Copy className="h-4 w-4" />
                  </button>
                  <button onClick={openInExplorer} className="p-1 hover:text-green-400">
                    <ExternalLink className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <button 
                onClick={() => disconnect()} 
                className="py-2 px-4 border border-red-400 text-red-400 rounded-lg hover:bg-red-400/10 focus:outline-none focus:ring-2 focus:ring-red-400/50 transition-all duration-200"
              >
                Disconnect
              </button>
            </div>

            {/* 📊 Token Balances */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {getCurrentTokens().map((token) => {
                const balance = tokenBalances[token.symbol]?.balance || "0";
                const price = tokenPrices[token.symbol] || 0;
                const value = parseFloat(balance) * price;
                
                return (
                  <div key={token.symbol} className="pulse-card p-4 text-center">
                    <div className="text-2xl mb-2">{token.logo}</div>
                    <div className="text-xl font-bold text-green-400 mb-1">
                      {parseFloat(balance).toFixed(4)}
                    </div>
                    <div className="text-sm pulse-text-secondary mb-1">{token.name}</div>
                    <div className="text-xs pulse-text-secondary">
                      ${value.toFixed(2)} USD
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      ${price.toFixed(6)}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 📈 Portfolio Summary */}
            <div className="p-4 bg-green-400/5 border border-green-400/20 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm pulse-text-secondary mb-1">
                    {chain?.id === 369 ? "PulseChain" : "Ethereum"} Portfolio Value
                  </div>
                  <div className="text-2xl font-bold text-green-400">
                    ${getTotalValue().toFixed(2)} USD
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs pulse-text-secondary">Last updated</div>
                  <div className="text-xs text-green-400">
                    {new Date().toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 🚀 Quick Actions */}
      {isConnected && (
        <div className="pulse-card p-6">
          <h3 className="font-semibold pulse-text mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button 
              onClick={() => window.open(chain?.id === 369 ? 'https://app.pulsex.com' : 'https://app.uniswap.org', '_blank')}
              className="p-4 text-left hover:bg-white/5 rounded-lg transition-colors"
            >
              <div className="font-medium pulse-text">🔄 Trade Tokens</div>
              <div className="text-sm pulse-text-secondary">
                {chain?.id === 369 ? "Open PulseX DEX" : "Open Uniswap"}
              </div>
            </button>
            <button className="p-4 text-left hover:bg-white/5 rounded-lg transition-colors">
              <div className="font-medium pulse-text">📊 View ROI Tracker</div>
              <div className="text-sm pulse-text-secondary">Track your performance</div>
            </button>
            <button className="p-4 text-left hover:bg-white/5 rounded-lg transition-colors">
              <div className="font-medium pulse-text">📄 Export for Taxes</div>
              <div className="text-sm pulse-text-secondary">Generate tax reports</div>
            </button>
          </div>
        </div>
      )}

      {/* ⚠️ Network Info */}
      {isConnected && chain && (
        <div className="pulse-card p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${chain.id === 369 ? 'bg-green-400' : 'bg-blue-400'}`}></div>
              <span className="text-sm pulse-text">
                Connected to {chain.name} (Chain ID: {chain.id})
              </span>
            </div>
            <div className="text-xs pulse-text-secondary">
              {chain.id === 369 ? "🟢 PulseChain Priority Network" : "🔷 Ethereum Network"}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletView;
