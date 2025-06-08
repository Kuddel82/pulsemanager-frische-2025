// 📊 Portfolio View - VEREINFACHT: Nur Portfolio-Wert und Token Holdings
// ROI Coin Liste wurde in ROI Tracker verschoben

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { WalletParser } from '@/services/walletParser';
import { TokenPriceService } from '@/services/tokenPriceService';
import { supabase } from '@/lib/supabaseClient';
import { TrendingUp, DollarSign, RefreshCw, Coins, Activity } from 'lucide-react';
import '@/styles/pulsechain-design.css';

const PortfolioView = () => {
  const { user } = useAuth();
  const [portfolioData, setPortfolioData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [wallets, setWallets] = useState([]);
  const [showAllTokens, setShowAllTokens] = useState(false);

  // 📊 Portfolio-Daten laden
  const loadPortfolioData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      console.log('📊 LOADING PORTFOLIO DATA...');
      
      // Lade Token-Balances
      const tokenBalances = await WalletParser.getStoredTokenBalances(user.id);
      
      // Extrahiere Wallets
      const uniqueWallets = tokenBalances.reduce((acc, token) => {
        const existing = acc.find(w => w.address === token.wallet_address);
        if (!existing) {
          acc.push({
            id: `wallet_${token.wallet_address.slice(-8)}`,
            address: token.wallet_address,
            name: `Wallet ${token.wallet_address.slice(0, 6)}...${token.wallet_address.slice(-4)}`,
            chain_id: token.chain_id || 369
          });
        }
        return acc;
      }, []);
      
      setWallets(uniqueWallets);
      
      if (tokenBalances.length === 0) {
        console.log('📊 Keine Token-Daten gefunden, Wallets werden aktualisiert...');
        await refreshAllWallets();
        return;
      }
      
      // Echte Preise für Token abrufen
      const uniqueTokens = tokenBalances.reduce((acc, token) => {
        if (!acc.find(t => t.symbol === token.token_symbol)) {
          acc.push({
            symbol: token.token_symbol,
            contractAddress: token.contract_address
          });
        }
        return acc;
      }, []);
      
      console.log(`💰 Aktualisiere Preise für ${uniqueTokens.length} Token...`);
      const currentPrices = await TokenPriceService.getBatchPrices(uniqueTokens);
      
      // Portfolio-Statistiken berechnen
      const portfolioStats = calculatePortfolioStats(tokenBalances, currentPrices);
      
      setPortfolioData({
        tokens: tokenBalances,
        prices: currentPrices,
        stats: portfolioStats,
        wallets: uniqueWallets
      });
      
      setLastUpdate(new Date());
      
    } catch (error) {
      console.error('💥 Fehler beim Laden der Portfolio-Daten:', error);
    } finally {
      setLoading(false);
    }
  };

  // 📈 Portfolio-Statistiken berechnen
  const calculatePortfolioStats = (tokens, prices) => {
    let totalValue = 0;
    let totalPLSValue = 0;
    let totalTokenValue = 0;
    
    const tokenStats = tokens.map(token => {
      const currentPrice = prices[token.token_symbol] || 0;
      const currentValue = token.balance * currentPrice;
      totalValue += currentValue;
      
      if (token.token_symbol === 'PLS') {
        totalPLSValue += currentValue;
      } else {
        totalTokenValue += currentValue;
      }
      
      return {
        ...token,
        currentPrice,
        currentValue,
        allocation: 0 // Wird nach totalValue berechnet
      };
    });
    
    // Prozentuale Allokation berechnen
    tokenStats.forEach(token => {
      token.allocation = totalValue > 0 ? (token.currentValue / totalValue) * 100 : 0;
    });
    
    // Nach Wert sortieren
    tokenStats.sort((a, b) => b.currentValue - a.currentValue);
    
    console.log(`💰 PORTFOLIO: Total: $${totalValue.toFixed(2)}, PLS: $${totalPLSValue.toFixed(2)}, Tokens: $${totalTokenValue.toFixed(2)}`);
    
    return {
      totalValue,
      totalPLSValue,
      totalTokenValue,
      totalTokens: tokens.length,
      topHoldings: tokenStats.slice(0, 20),
      allHoldings: tokenStats,
      lastUpdated: new Date()
    };
  };

  // 🔄 Alle Wallets aktualisieren
  const refreshAllWallets = async () => {
    if (!user) return;
    
    try {
      setRefreshing(true);
      console.log('🔄 REFRESHING ALL WALLETS...');
      
      const currentTokens = await WalletParser.getStoredTokenBalances(user.id);
      const uniqueAddresses = [...new Set(currentTokens.map(token => token.wallet_address))];
      
      for (const address of uniqueAddresses) {
        console.log(`🔄 Aktualisiere Wallet: ${address}`);
        await WalletParser.refreshWalletData(user.id, address, 369);
      }
      
      await loadPortfolioData();
      
    } catch (error) {
      console.error('💥 Fehler beim Aktualisieren der Wallets:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // 💰 Wert formatieren
  const formatValue = (value) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(2)}K`;
    } else {
      return `$${value.toFixed(2)}`;
    }
  };

  useEffect(() => {
    loadPortfolioData();
    
    // Auto-refresh Portfolio alle 5 Minuten
    const portfolioInterval = setInterval(() => {
      if (!refreshing) {
        console.log('🔄 AUTO-REFRESH: Portfolio wird aktualisiert');
        loadPortfolioData();
      }
    }, 300000); // 5 Minuten
    
    return () => {
      clearInterval(portfolioInterval);
    };
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen pulse-bg p-6">
        <div className="max-w-7xl mx-auto">
          <div className="pulse-card text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-400 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold pulse-text-gradient mb-2">Portfolio wird geladen...</h2>
            <p className="text-gray-300">Token-Preise werden abgerufen...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!portfolioData) {
    return (
      <div className="min-h-screen pulse-bg p-6">
        <div className="max-w-7xl mx-auto">
          <div className="pulse-card text-center">
            <h2 className="text-xl font-semibold pulse-text-gradient mb-4">Keine Portfolio-Daten gefunden</h2>
            <p className="text-gray-300 mb-6">Bitte fügen Sie zuerst eine Wallet hinzu und aktualisieren Sie die Daten.</p>
            <button
              onClick={refreshAllWallets}
              disabled={refreshing}
              className="pulse-btn"
            >
              {refreshing ? 'Aktualisierung läuft...' : 'Wallets aktualisieren'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { stats } = portfolioData;

  return (
    <div className="min-h-screen pulse-bg p-6" translate="no">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* 📊 EINFACHES PORTFOLIO */}
        <div className="pulse-card">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold pulse-text-gradient mb-2">Portfolio</h1>
              <p className="pulse-subtitle">Wallet-Wert und Token Holdings</p>
            </div>
            <button
              onClick={refreshAllWallets}
              disabled={refreshing}
              className="pulse-btn-outline px-4 py-2 text-sm flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Updating...' : 'Refresh'}
            </button>
          </div>

          {/* Portfolio-Übersicht */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="text-center p-6 bg-gradient-to-br from-green-500/20 to-green-600/10 rounded-xl border border-green-500/30">
              <DollarSign className="h-8 w-8 text-green-400 mx-auto mb-2" />
              <h3 className="text-lg font-semibold text-green-300 mb-1">Portfolio Wert</h3>
              <p className="text-3xl font-bold text-green-400" translate="no">{formatValue(stats.totalValue)}</p>
              <p className="text-sm text-green-300 mt-1">Gesamtwert Wallet</p>
            </div>
            
            <div className="text-center p-6 bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded-xl border border-blue-500/30">
              <Activity className="h-8 w-8 text-blue-400 mx-auto mb-2" />
              <h3 className="text-lg font-semibold text-blue-300 mb-1">PLS Value</h3>
              <p className="text-3xl font-bold text-blue-400" translate="no">{formatValue(stats.totalPLSValue)}</p>
              <p className="text-sm text-blue-300 mt-1">{((stats.totalPLSValue / stats.totalValue) * 100).toFixed(1)}% des Portfolios</p>
            </div>
            
            <div className="text-center p-6 bg-gradient-to-br from-purple-500/20 to-purple-600/10 rounded-xl border border-purple-500/30">
              <TrendingUp className="h-8 w-8 text-purple-400 mx-auto mb-2" />
              <h3 className="text-lg font-semibold text-purple-300 mb-1">Token Value</h3>
              <p className="text-3xl font-bold text-purple-400" translate="no">{formatValue(stats.totalTokenValue)}</p>
              <p className="text-sm text-purple-300 mt-1">{((stats.totalTokenValue / stats.totalValue) * 100).toFixed(1)}% des Portfolios</p>
            </div>
            
            <div className="text-center p-6 bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 rounded-xl border border-yellow-500/30">
              <Coins className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
              <h3 className="text-lg font-semibold text-yellow-300 mb-1">Coins</h3>
              <p className="text-3xl font-bold text-yellow-400" translate="no">{stats.totalTokens}</p>
              <p className="text-sm text-yellow-300 mt-1">Verschiedene Token</p>
            </div>
          </div>

          {/* Update Info */}
          <div className="text-center text-sm text-gray-400 border-t border-green-500/20 pt-4">
            <span>Portfolio: {lastUpdate?.toLocaleTimeString('de-DE')}</span>
            <span className="mx-2">•</span>
            <span>Echtzeitpreise • Auto-Refresh 5 Min</span>
            <span className="mx-2">•</span>
            <span>ROI-Daten im ROI Tracker</span>
          </div>
        </div>

        {/* 🏆 Token Holdings */}
        <div className="pulse-card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold pulse-text-gradient">
              Token Holdings ({showAllTokens ? 'Alle' : 'Top 20'})
            </h2>
            <button
              onClick={() => setShowAllTokens(!showAllTokens)}
              className="pulse-btn-outline px-3 py-1 text-sm"
            >
              {showAllTokens ? 'Top 20' : 'Alle anzeigen'}
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-green-500/20">
                  <th className="text-left text-green-400 font-medium py-3">Token</th>
                  <th className="text-right text-green-400 font-medium py-3">Balance</th>
                  <th className="text-right text-green-400 font-medium py-3">Preis</th>
                  <th className="text-right text-green-400 font-medium py-3">Wert</th>
                  <th className="text-right text-green-400 font-medium py-3">Anteil</th>
                </tr>
              </thead>
              <tbody>
                {(showAllTokens ? stats.allHoldings : stats.topHoldings).map((token, index) => (
                  <tr key={`${token.token_symbol}-${index}`} className="border-b border-green-500/10">
                    <td className="py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center text-black font-bold text-sm">
                          {token.token_symbol?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="text-white font-medium" translate="no">{token.token_symbol}</p>
                          <p className="text-gray-400 text-sm" translate="no">{token.token_name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-right text-white py-4" translate="no">
                      {token.balance.toLocaleString('de-DE', { 
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 4 
                      })}
                    </td>
                    <td className="text-right text-green-400 py-4" translate="no">
                      ${token.currentPrice.toFixed(8)}
                    </td>
                    <td className="text-right text-white py-4 font-medium" translate="no">
                      {formatValue(token.currentValue)}
                    </td>
                    <td className="text-right text-blue-400 py-4" translate="no">
                      {token.allocation.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PortfolioView; 