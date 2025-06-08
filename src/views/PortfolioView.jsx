// 📊 PORTFOLIO VIEW - Zeigt Token-Holdings mit echten Preisen
// Datum: 2025-01-08 - PHASE 3: ECHTE PREISE INTEGRATION

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  RefreshCw, 
  DollarSign, 
  TrendingUp, 
  Coins, 
  AlertCircle,
  ExternalLink,
  Eye,
  EyeOff
} from 'lucide-react';
import { formatCurrency, formatNumber, formatPercentage } from '@/lib/utils';
import CentralDataService from '@/services/CentralDataService';
import { useAuth } from '@/contexts/AuthContext';

const PortfolioView = () => {
  const { user } = useAuth();
  const [portfolioData, setPortfolioData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [showDebug, setShowDebug] = useState(false);

  // Lade Portfolio-Daten
  const loadPortfolio = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 PORTFOLIO VIEW: Loading data...');
      const data = await CentralDataService.loadCompletePortfolio(user.id);
      
      if (data.error) {
        setError(data.error);
      } else {
        setPortfolioData(data);
        setLastUpdate(new Date());
        console.log('✅ PORTFOLIO VIEW: Data loaded', data);
      }
    } catch (err) {
      console.error('💥 PORTFOLIO VIEW ERROR:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadPortfolio();
  }, [user?.id]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(loadPortfolio, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user?.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="pulse-card p-8 text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-green-400 mx-auto mb-4" />
          <span className="text-lg pulse-text">Portfolio wird geladen...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black p-6">
        <div className="pulse-card max-w-lg mx-auto p-6 text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-400" />
          <h2 className="text-xl font-semibold mb-2 pulse-text">Fehler beim Laden des Portfolios</h2>
          <p className="pulse-text-secondary mb-4">{error}</p>
          <Button onClick={loadPortfolio} className="bg-green-500 hover:bg-green-600">
            <RefreshCw className="h-4 w-4 mr-2" />
            Erneut versuchen
          </Button>
        </div>
      </div>
    );
  }

  if (!portfolioData || portfolioData.tokens.length === 0) {
    return (
      <div className="min-h-screen bg-black p-6">
        <div className="pulse-card max-w-lg mx-auto p-6 text-center">
          <Coins className="h-12 w-12 mx-auto mb-4 text-blue-400" />
          <h2 className="text-xl font-semibold mb-2 pulse-text">Keine Token gefunden</h2>
          <p className="pulse-text-secondary mb-4">
            {portfolioData?.wallets?.length === 0 
              ? 'Fügen Sie zuerst Ihre Wallet-Adressen hinzu.'
              : 'In Ihren Wallets wurden keine Token mit Wert gefunden.'
            }
          </p>
          <Button onClick={loadPortfolio} className="bg-green-500 hover:bg-green-600">
            <RefreshCw className="h-4 w-4 mr-2" />
            Erneut laden
          </Button>
        </div>
      </div>
    );
  }

  const stats = [
    {
      title: 'Gesamtwert',
      value: formatCurrency(portfolioData.totalValue),
      icon: DollarSign,
      color: 'bg-green-500'
    },
    {
      title: 'Token',
      value: portfolioData.tokenCount.toString(),
      icon: Coins,
      color: 'bg-blue-500'
    },
    {
      title: 'Wallets',
      value: portfolioData.walletCount.toString(),
      icon: TrendingUp,
      color: 'bg-purple-500'
    }
  ];

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold pulse-title">Portfolio Übersicht</h1>
            <p className="pulse-text-secondary">
              Echte PulseChain Token-Daten • Letzte Aktualisierung: {lastUpdate?.toLocaleTimeString('de-DE')}
            </p>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDebug(!showDebug)}
            >
              {showDebug ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              Debug
            </Button>
            <Button onClick={loadPortfolio} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Aktualisieren
            </Button>
          </div>
        </div>

        {/* Portfolio Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {stats.map((stat, index) => (
            <div key={index} className="pulse-card p-6">
              <div className="flex items-center">
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium pulse-text-secondary">{stat.title}</p>
                  <p className="text-2xl font-bold pulse-text">{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Debug Information */}
        {showDebug && portfolioData.debug && (
          <div className="pulse-card p-6 mb-6">
            <h3 className="flex items-center text-lg font-bold pulse-text mb-4">
              <AlertCircle className="h-5 w-5 mr-2 text-blue-400" />
              Debug Information
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium pulse-text-secondary">Preise aktualisiert:</span>
                <p className="pulse-text">{portfolioData.debug.pricesUpdated}</p>
              </div>
              <div>
                <span className="font-medium pulse-text-secondary">Preis-Quelle:</span>
                <p className="pulse-text">{portfolioData.debug.priceSource}</p>
              </div>
              <div>
                <span className="font-medium pulse-text-secondary">API-Aufrufe:</span>
                <p className="pulse-text">{portfolioData.debug.apiCalls}</p>
              </div>
              <div>
                <span className="font-medium pulse-text-secondary">Letzte Preis-Update:</span>
                <p className="pulse-text">{new Date(portfolioData.debug.lastPriceUpdate).toLocaleTimeString('de-DE')}</p>
              </div>
            </div>
          </div>
        )}

        {/* PRICE SOURCE VALIDATION WARNING */}
        {portfolioData.tokens.filter(t => !t.hasReliablePrice && t.balance > 0.001).length > 0 && (
          <div className="pulse-card p-4 mb-6 border-l-4 border-yellow-500">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 text-yellow-400" />
              <span className="pulse-text font-medium">
                ⚠ {portfolioData.tokens.filter(t => !t.hasReliablePrice && t.balance > 0.001).length} Token ohne verlässliche Preise
              </span>
            </div>
            <p className="pulse-text-secondary text-sm mt-1">
              Diese Token werden nicht in den Portfolio-Wert eingerechnet bis verlässliche Preise verfügbar sind.
            </p>
          </div>
        )}

        {/* Token Holdings */}
        <div className="pulse-card p-6">
          <h3 className="text-lg font-bold pulse-text mb-4">Token Holdings ({portfolioData.tokens.length})</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-2 pulse-text-secondary">Rang</th>
                  <th className="text-left py-3 px-2 pulse-text-secondary">Token</th>
                  <th className="text-right py-3 px-2 pulse-text-secondary">Anzahl</th>
                  <th className="text-right py-3 px-2 pulse-text-secondary">Preis</th>
                  <th className="text-right py-3 px-2 pulse-text-secondary">Wert</th>
                  <th className="text-right py-3 px-2 pulse-text-secondary">Portfolio %</th>
                  <th className="text-center py-3 px-2 pulse-text-secondary">Preis-Quelle</th>
                  <th className="text-center py-3 px-2 pulse-text-secondary">Links</th>
                </tr>
              </thead>
              <tbody>
                {portfolioData.tokens.map((token, index) => (
                  <tr key={index} className={`border-b border-white/5 hover:bg-white/5 ${!token.hasReliablePrice ? 'opacity-60' : ''}`}>
                    <td className="py-3 px-2">
                      <Badge variant="outline" className={`text-xs ${token.isIncludedInPortfolio ? 'border-green-400 text-green-400' : 'border-gray-500 text-gray-500'}`}>
                        #{token.holdingRank || '?'}
                      </Badge>
                    </td>
                    <td className="py-3 px-2">
                      <div>
                        <div className="font-medium pulse-text flex items-center">
                          {token.symbol}
                          {!token.hasReliablePrice && <span className="ml-2 text-yellow-400">⚠</span>}
                        </div>
                        <div className="text-sm pulse-text-secondary">{token.name}</div>
                        <div className="text-xs pulse-text-secondary">
                          {token.contractAddress?.slice(0, 8)}...
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-right">
                      <div className="font-mono pulse-text">
                        {formatNumber(token.balance, 6)}
                      </div>
                    </td>
                    <td className="py-3 px-2 text-right">
                      <div className="font-mono pulse-text">
                        {token.price > 0 ? formatCurrency(token.price, 8) : (
                          <span className="text-red-400">Kein Preis</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-2 text-right">
                      <div className={`font-bold ${token.isIncludedInPortfolio ? 'text-green-400' : 'text-gray-500'}`}>
                        {token.value > 0 ? formatCurrency(token.value) : '-'}
                      </div>
                    </td>
                    <td className="py-3 px-2 text-right">
                      <div className="text-sm pulse-text">
                        {token.isIncludedInPortfolio ? formatPercentage(token.percentageOfPortfolio) : '-'}
                      </div>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <Badge 
                        variant="outline"
                        className={`text-xs ${
                          token.priceSource === 'dexscreener' ? 'border-green-400 text-green-400' : 
                          token.priceSource === 'verified' ? 'border-blue-400 text-blue-400' :
                          token.priceSource === 'blocked' ? 'border-red-400 text-red-400' :
                          'border-gray-500 text-gray-500'
                        }`}
                      >
                        {token.priceSource === 'dexscreener' ? '🟢 Live' : 
                         token.priceSource === 'verified' ? '🔵 Verified' : 
                         token.priceSource === 'blocked' ? '🔴 Blocked' :
                         '⚪ Unknown'}
                      </Badge>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <div className="flex justify-center space-x-1">
                        {token.contractAddress && (
                          <a
                            href={`https://scan.pulsechain.com/token/${token.contractAddress}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                        {token.contractAddress && (
                          <a
                            href={`https://dexscreener.com/pulsechain/${token.contractAddress}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-400 hover:text-green-300"
                          >
                            <TrendingUp className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Portfolio Distribution */}
        {portfolioData.tokens.filter(t => t.isIncludedInPortfolio).length > 0 && (
          <div className="pulse-card p-6 mt-6">
            <h3 className="text-lg font-bold pulse-text mb-4">Portfolio Verteilung (nur Tokens mit verlässlichen Preisen)</h3>
            <div className="space-y-3">
              {portfolioData.tokens.filter(t => t.isIncludedInPortfolio).slice(0, 10).map((token, index) => (
                <div key={index} className="flex items-center">
                  <div className="w-20 text-sm font-medium pulse-text">{token.symbol}</div>
                  <div className="flex-1 mx-3">
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full" 
                        style={{ width: `${Math.min(token.percentageOfPortfolio, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="w-16 text-right text-sm pulse-text">
                    {formatPercentage(token.percentageOfPortfolio)}
                  </div>
                  <div className="w-24 text-right text-sm font-medium ml-2 pulse-text">
                    {formatCurrency(token.value)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default PortfolioView; 