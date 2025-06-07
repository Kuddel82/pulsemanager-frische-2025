import React, { useState, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { formatEther } from 'viem';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Wallet, RefreshCw, Copy, ExternalLink } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";

// 🔥 Essential PulseChain Tokens Only
const PULSE_TOKENS = [
  { symbol: "PLS", name: "PulseChain", isNative: true },
  { symbol: "PLSX", name: "PulseX", address: "0x95B303987A60C71504D99Aa1b13B4DA07b0790ab" },
  { symbol: "WPLS", name: "Wrapped PLS", address: "0xA1077a294dC1f4cFB0b86530fc3D182038FD36D8" }
];

const WalletView = () => {
  const { user } = useAuth();
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [balance, setBalance] = useState('0');

  // 🚀 Simple Connect Function
  const handleConnect = async () => {
    try {
      setIsLoading(true);
      const connector = connectors.find(c => c.id === 'metaMask') || connectors[0];
      await connect({ connector });
      toast({ title: "Wallet Connected", description: "Successfully connected to your wallet", variant: "default" });
    } catch (error) {
      toast({ title: "Connection Failed", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  // 📋 Copy Address
  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      toast({ title: "Address Copied", description: "Wallet address copied to clipboard", variant: "default" });
    }
  };

  // 🔗 Open in Explorer
  const openInExplorer = () => {
    if (address) {
      window.open(`https://scan.pulsechain.com/address/${address}`, '_blank');
    }
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
      <div>
        <h1 className="pulse-title mb-2">PulseChain Wallet</h1>
        <p className="pulse-subtitle">Connect and monitor your PulseChain assets</p>
      </div>

      {/* 💼 Wallet Connection */}
      <div className="pulse-card p-6">
        {!isConnected ? (
          <div className="text-center">
            <Wallet className="h-16 w-16 text-green-400 mx-auto mb-6" />
            <h3 className="text-xl font-semibold pulse-text mb-2">Connect Your Wallet</h3>
            <p className="pulse-text-secondary mb-6">Connect your MetaMask or compatible wallet to view your PulseChain assets</p>
            <Button 
              onClick={handleConnect} 
              disabled={isLoading}
              className="pulse-btn"
            >
              {isLoading ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Wallet className="mr-2 h-4 w-4" />
              )}
              Connect Wallet
            </Button>
          </div>
        ) : (
          <div>
            {/* 🔗 Connected Wallet Info */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
              <div>
                <h3 className="text-lg font-semibold pulse-text mb-1">Wallet Connected</h3>
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
              <Button 
                onClick={() => disconnect()} 
                variant="outline"
                className="text-red-400 border-red-400 hover:bg-red-400/10"
              >
                Disconnect
              </Button>
            </div>

            {/* 📊 Simple Balance Display */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {PULSE_TOKENS.map((token) => (
                <div key={token.symbol} className="pulse-card p-4 text-center">
                  <div className="text-2xl font-bold text-green-400 mb-1">
                    {token.symbol === 'PLS' ? balance : '0.00'}
                  </div>
                  <div className="text-sm pulse-text-secondary">{token.name}</div>
                  <div className="text-xs pulse-text-secondary mt-1">
                    ${token.symbol === 'PLS' ? '0.00' : '0.00'}
                  </div>
                </div>
              ))}
            </div>

            {/* 📈 Portfolio Summary */}
            <div className="mt-6 p-4 bg-green-400/5 border border-green-400/20 rounded-lg">
              <div className="text-center">
                <div className="text-sm pulse-text-secondary mb-1">Total Portfolio Value</div>
                <div className="text-2xl font-bold text-green-400">$0.00 USD</div>
                <div className="text-xs pulse-text-secondary mt-1">
                  Last updated: {new Date().toLocaleTimeString()}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button className="p-4 text-left hover:bg-white/5 rounded-lg transition-colors">
              <div className="font-medium pulse-text">📊 View ROI Tracker</div>
              <div className="text-sm pulse-text-secondary">Track your PulseChain performance</div>
            </button>
            <button className="p-4 text-left hover:bg-white/5 rounded-lg transition-colors">
              <div className="font-medium pulse-text">📄 Export for Taxes</div>
              <div className="text-sm pulse-text-secondary">Generate tax reports</div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletView;
