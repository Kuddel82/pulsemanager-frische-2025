// 📊 Portfolio View - Echte Token-Übersicht mit Echtzeit-Preisen
// Zeigt alle Holdings, Werte, Performance und Portfolio-Statistiken

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { WalletParser } from '@/services/walletParser';
import { TokenPriceService } from '@/services/tokenPriceService';
import { supabase } from '@/lib/supabaseClient';

const PortfolioView = () => {
  const { user } = useAuth();
  const [portfolioData, setPortfolioData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [wallets, setWallets] = useState([]);

  // 📊 Portfolio-Daten laden
  const loadPortfolioData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      console.log('📊 LOADING PORTFOLIO DATA...');
      
      // Lade gespeicherte Wallets
      const { data: walletsData } = await supabase
        .from('user_wallets')
        .select('*')
        .eq('user_id', user.id);
      
      setWallets(walletsData || []);
      
      // Lade Token-Balances
      const tokenBalances = await WalletParser.getStoredTokenBalances(user.id);
      
      if (tokenBalances.length === 0) {
        console.log('📊 Keine Token-Daten gefunden, Wallets werden aktualisiert...');
        await refreshAllWallets();
        return;
      }
      
      // Aktualisiere Preise für alle Token
      const uniqueTokens = tokenBalances.reduce((acc, token) => {
        if (!acc.find(t => t.token_symbol === token.token_symbol)) {
          acc.push({
            symbol: token.token_symbol,
            contractAddress: token.contract_address
          });
        }
        return acc;
      }, []);
      
      console.log(`💰 Aktualisiere Preise für ${uniqueTokens.length} einzigartige Token...`);
      const currentPrices = await TokenPriceService.getBatchPrices(uniqueTokens);
      
      // Berechne Portfolio-Statistiken
      const portfolioStats = calculatePortfolioStats(tokenBalances, currentPrices);
      
      setPortfolioData({
        tokens: tokenBalances,
        prices: currentPrices,
        stats: portfolioStats,
        wallets: walletsData || []
      });
      
      setLastUpdate(new Date());
      
    } catch (error) {
      console.error('💥 Fehler beim Laden der Portfolio-Daten:', error);
    } finally {
      setLoading(false);
    }
  };

  // 🔄 Alle Wallets aktualisieren
  const refreshAllWallets = async () => {
    if (!user) return;
    
    try {
      setRefreshing(true);
      console.log('🔄 REFRESHING ALL WALLETS...');
      
      for (const wallet of wallets) {
        console.log(`🔄 Aktualisiere Wallet: ${wallet.name} (${wallet.address})`);
        await WalletParser.refreshWalletData(user.id, wallet.address, wallet.chain_id);
      }
      
      // Lade aktualisierte Daten
      await loadPortfolioData();
      
    } catch (error) {
      console.error('💥 Fehler beim Aktualisieren der Wallets:', error);
    } finally {
      setRefreshing(false);
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
        priceChange24h: 0, // TODO: 24h Preis-Änderung implementieren
        allocation: 0 // Wird nach totalValue berechnet
      };
    });
    
    // Berechne prozentuale Allokation
    tokenStats.forEach(token => {
      token.allocation = totalValue > 0 ? (token.currentValue / totalValue) * 100 : 0;
    });
    
    // Sortiere nach Wert (höchste zuerst)
    tokenStats.sort((a, b) => b.currentValue - a.currentValue);
    
    return {
      totalValue,
      totalPLSValue,
      totalTokenValue,
      totalTokens: tokens.length,
      topHoldings: tokenStats.slice(0, 10),
      allHoldings: tokenStats,
      lastUpdated: new Date()
    };
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

  // 🎨 Prozent-Farbe bestimmen
  const getPercentColor = (percent) => {
    if (percent > 0) return 'text-green-500';
    if (percent < 0) return 'text-red-500';
    return 'text-gray-500';
  };

  useEffect(() => {
    loadPortfolioData();
    
    // Auto-refresh alle 30 Sekunden
    const interval = setInterval(() => {
      if (!refreshing) {
        loadPortfolioData();
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-white mb-2">Portfolio wird geladen...</h2>
            <p className="text-gray-300">Echte Token-Preise werden abgerufen...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!portfolioData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center">
            <h2 className="text-xl font-semibold text-white mb-4">Keine Portfolio-Daten gefunden</h2>
            <p className="text-gray-300 mb-6">Bitte fügen Sie zuerst eine Wallet hinzu und aktualisieren Sie die Daten.</p>
            <button
              onClick={refreshAllWallets}
              disabled={refreshing}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
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
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* 📊 Portfolio-Header */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Portfolio Übersicht</h1>
              <p className="text-gray-300">
                Letzte Aktualisierung: {lastUpdate?.toLocaleTimeString('de-DE')}
              </p>
            </div>
            <button
              onClick={refreshAllWallets}
              disabled={refreshing}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2"
            >
              <span>{refreshing ? '🔄' : '↻'}</span>
              <span>{refreshing ? 'Aktualisiert...' : 'Aktualisieren'}</span>
            </button>
          </div>
          
          {/* Portfolio-Statistiken */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white/5 rounded-xl p-4">
              <h3 className="text-gray-300 text-sm font-medium mb-1">Gesamt-Portfolio</h3>
              <p className="text-2xl font-bold text-white">{formatValue(stats.totalValue)}</p>
              <p className="text-green-400 text-sm">+0.00% (24h)</p>
            </div>
            
            <div className="bg-white/5 rounded-xl p-4">
              <h3 className="text-gray-300 text-sm font-medium mb-1">PLS Wert</h3>
              <p className="text-2xl font-bold text-white">{formatValue(stats.totalPLSValue)}</p>
              <p className="text-gray-400 text-sm">{((stats.totalPLSValue / stats.totalValue) * 100).toFixed(1)}% des Portfolios</p>
            </div>
            
            <div className="bg-white/5 rounded-xl p-4">
              <h3 className="text-gray-300 text-sm font-medium mb-1">Token Wert</h3>
              <p className="text-2xl font-bold text-white">{formatValue(stats.totalTokenValue)}</p>
              <p className="text-gray-400 text-sm">{((stats.totalTokenValue / stats.totalValue) * 100).toFixed(1)}% des Portfolios</p>
            </div>
            
            <div className="bg-white/5 rounded-xl p-4">
              <h3 className="text-gray-300 text-sm font-medium mb-1">Anzahl Token</h3>
              <p className="text-2xl font-bold text-white">{stats.totalTokens}</p>
              <p className="text-gray-400 text-sm">Verschiedene Assets</p>
            </div>
          </div>
        </div>

        {/* 🏆 Top Holdings */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Top Holdings</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="text-left text-gray-300 font-medium py-3">Token</th>
                  <th className="text-right text-gray-300 font-medium py-3">Balance</th>
                  <th className="text-right text-gray-300 font-medium py-3">Preis</th>
                  <th className="text-right text-gray-300 font-medium py-3">Wert</th>
                  <th className="text-right text-gray-300 font-medium py-3">Allokation</th>
                  <th className="text-right text-gray-300 font-medium py-3">24h</th>
                </tr>
              </thead>
              <tbody>
                {stats.topHoldings.map((token, index) => (
                  <tr key={`${token.token_symbol}-${index}`} className="border-b border-white/10 hover:bg-white/5">
                    <td className="py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {token.token_symbol?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="text-white font-medium">{token.token_symbol}</p>
                          <p className="text-gray-400 text-sm">{token.token_name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-right text-white py-4">
                      {token.balance.toLocaleString('de-DE', { 
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 4 
                      })}
                    </td>
                    <td className="text-right text-white py-4">
                      ${token.currentPrice.toFixed(6)}
                    </td>
                    <td className="text-right text-white py-4 font-medium">
                      {formatValue(token.currentValue)}
                    </td>
                    <td className="text-right text-gray-300 py-4">
                      {token.allocation.toFixed(1)}%
                    </td>
                    <td className="text-right py-4">
                      <span className={getPercentColor(token.priceChange24h)}>
                        {token.priceChange24h > 0 ? '+' : ''}{token.priceChange24h.toFixed(2)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 📈 Portfolio-Verteilung */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Wallet-Übersicht */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Verbundene Wallets</h2>
            <div className="space-y-3">
              {wallets.map((wallet) => (
                <div key={wallet.id} className="bg-white/5 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-white font-medium">{wallet.name}</p>
                      <p className="text-gray-400 text-sm font-mono">
                        {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-medium">
                        {wallet.chain_id === 369 ? 'PulseChain' : 'Ethereum'}
                      </p>
                      <p className="text-gray-400 text-sm">Aktiv</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Performance-Metriken */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Performance</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-300">24h Änderung</span>
                <span className="text-green-400 font-medium">+$0.00 (0.00%)</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-300">7d Änderung</span>
                <span className="text-green-400 font-medium">+$0.00 (0.00%)</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-300">30d Änderung</span>
                <span className="text-green-400 font-medium">+$0.00 (0.00%)</span>
              </div>
              <div className="flex justify-between items-center py-2 border-t border-white/20 pt-4">
                <span className="text-gray-300">All Time High</span>
                <span className="text-white font-medium">{formatValue(stats.totalValue)}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PortfolioView; 