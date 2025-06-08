// 📊 Portfolio View - Echte Token-Übersicht mit Echtzeit-Preisen
// Zeigt alle Holdings, Werte, Performance und Portfolio-Statistiken

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { WalletParser } from '@/services/walletParser';
import { TokenPriceService } from '@/services/tokenPriceService';
import { supabase } from '@/lib/supabaseClient';
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
      
      // Lade Token-Balances und extrahiere Wallet-Informationen
      const tokenBalances = await WalletParser.getStoredTokenBalances(user.id);
      
      // Extrahiere eindeutige Wallets aus Token-Balances
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
      
      // Debug: Token-Anzahl und Werte loggen
      console.log(`🔍 DEBUG TOKEN COUNT: ${tokenBalances.length} tokens loaded from DB`);
      tokenBalances.forEach(token => {
        const price = currentPrices[token.token_symbol] || 0;
        const value = token.balance * price;
        console.log(`🪙 DEBUG TOKEN: ${token.token_symbol} | Balance: ${token.balance} | Price: $${price} | Value: $${value.toFixed(2)}`);
      });

      // Berechne Portfolio-Statistiken mit Debug-Ausgabe
      const portfolioStats = calculatePortfolioStats(tokenBalances, currentPrices);
      
      console.log(`💰 DEBUG PORTFOLIO STATS:`, portfolioStats);
      
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

  // 🔄 Alle Wallets aktualisieren
  const refreshAllWallets = async () => {
    if (!user) return;
    
    try {
      setRefreshing(true);
      console.log('🔄 REFRESHING ALL WALLETS...');
      
      // Lade aktuelle Token-Daten um Wallet-Adressen zu finden
      const currentTokens = await WalletParser.getStoredTokenBalances(user.id);
      const uniqueAddresses = [...new Set(currentTokens.map(token => token.wallet_address))];
      
      for (const address of uniqueAddresses) {
        console.log(`🔄 Aktualisiere Wallet: ${address}`);
        await WalletParser.refreshWalletData(user.id, address, 369); // PulseChain
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
      topHoldings: tokenStats.slice(0, 20), // Zeige mehr Top Holdings
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
      <div className="min-h-screen pulse-bg p-6">
        <div className="max-w-7xl mx-auto">
          <div className="pulse-card text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-400 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold pulse-text-gradient mb-2">Portfolio wird geladen...</h2>
            <p className="text-gray-300">Echte Token-Preise werden abgerufen...</p>
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
    <div className="min-h-screen pulse-bg p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* 📊 Portfolio-Header */}
        <div className="pulse-card">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="pulse-title mb-2">Portfolio Übersicht</h1>
              <p className="pulse-subtitle">
                Letzte Aktualisierung: {lastUpdate?.toLocaleTimeString('de-DE')}
              </p>
            </div>
            <button
              onClick={refreshAllWallets}
              disabled={refreshing}
              className="pulse-btn disabled:opacity-50 flex items-center space-x-2"
            >
              <span>{refreshing ? '🔄' : '↻'}</span>
              <span>{refreshing ? 'Aktualisiert...' : 'Aktualisieren'}</span>
            </button>
          </div>
          
          {/* Portfolio-Statistiken */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="pulse-stat bg-gradient-to-br from-green-500/10 to-green-600/20 rounded-xl p-4 border border-green-500/20">
              <h3 className="pulse-stat-label">Gesamt-Portfolio</h3>
              <p className="pulse-stat-value">{formatValue(stats.totalValue)}</p>
              <p className="text-green-400 text-sm">+0.00% (24h)</p>
            </div>
            
            <div className="pulse-stat bg-gradient-to-br from-blue-500/10 to-blue-600/20 rounded-xl p-4 border border-blue-500/20">
              <h3 className="pulse-stat-label">PLS Wert</h3>
              <p className="pulse-stat-value">{formatValue(stats.totalPLSValue)}</p>
              <p className="text-blue-400 text-sm">{((stats.totalPLSValue / stats.totalValue) * 100).toFixed(1)}% des Portfolios</p>
            </div>
            
            <div className="pulse-stat bg-gradient-to-br from-purple-500/10 to-purple-600/20 rounded-xl p-4 border border-purple-500/20">
              <h3 className="pulse-stat-label">Token Wert</h3>
              <p className="pulse-stat-value">{formatValue(stats.totalTokenValue)}</p>
              <p className="text-purple-400 text-sm">{((stats.totalTokenValue / stats.totalValue) * 100).toFixed(1)}% des Portfolios</p>
            </div>
            
            <div className="pulse-stat bg-gradient-to-br from-pink-500/10 to-pink-600/20 rounded-xl p-4 border border-pink-500/20">
              <h3 className="pulse-stat-label">Anzahl Token</h3>
              <p className="pulse-stat-value">{stats.totalTokens}</p>
              <p className="text-pink-400 text-sm">Verschiedene Assets</p>
            </div>
          </div>
        </div>

        {/* 🏆 Top Holdings */}
        <div className="pulse-card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold pulse-text-gradient">
              {showAllTokens ? 'Alle Token' : 'Top Holdings'}
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
                  <th className="text-right text-green-400 font-medium py-3">Allokation</th>
                  <th className="text-right text-green-400 font-medium py-3">24h</th>
                </tr>
              </thead>
              <tbody>
                {(showAllTokens ? stats.allHoldings : stats.topHoldings).map((token, index) => (
                  <tr key={`${token.token_symbol}-${index}`} className="border-b border-green-500/10 hover:bg-green-500/5 transition-colors">
                    <td className="py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center text-black font-bold text-sm">
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
                    <td className="text-right text-green-400 py-4">
                      ${token.currentPrice.toFixed(6)}
                    </td>
                    <td className="text-right text-white py-4 font-medium">
                      {formatValue(token.currentValue)}
                    </td>
                    <td className="text-right text-blue-400 py-4">
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
          <div className="pulse-card">
            <h2 className="text-xl font-semibold pulse-text-gradient mb-4">Verbundene Wallets</h2>
            <div className="space-y-3">
              {wallets.map((wallet) => (
                <div key={wallet.id} className="bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-lg p-4 border border-green-500/20">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-white font-medium">{wallet.name}</p>
                      <p className="text-gray-400 text-sm font-mono">
                        {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-green-400 font-medium">
                        {wallet.chain_id === 369 ? 'PulseChain' : 'Ethereum'}
                      </p>
                      <p className="text-blue-400 text-sm">Aktiv</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Performance-Metriken */}
          <div className="pulse-card">
            <h2 className="text-xl font-semibold pulse-text-gradient mb-4">Performance</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-300">24h Änderung</span>
                <span className="text-gray-500 font-medium">Wird berechnet...</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-300">7d Änderung</span>
                <span className="text-gray-500 font-medium">Wird berechnet...</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-300">30d Änderung</span>
                <span className="text-gray-500 font-medium">Wird berechnet...</span>
              </div>
              <div className="flex justify-between items-center py-2 border-t border-green-500/20 pt-4">
                <span className="text-gray-300">Portfolio Wert</span>
                <span className="text-green-400 font-medium">{formatValue(stats.totalValue)}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-300">Token Anzahl</span>
                <span className="text-blue-400 font-medium">{stats.totalTokens} Assets</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-300">Letzte Aktualisierung</span>
                <span className="text-purple-400 font-medium">{lastUpdate?.toLocaleTimeString('de-DE')}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PortfolioView; 