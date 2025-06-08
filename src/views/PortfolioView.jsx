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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span className="text-lg">Portfolio wird geladen...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <Card className="max-w-lg mx-auto">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-semibold mb-2">Fehler beim Laden des Portfolios</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={loadPortfolio}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Erneut versuchen
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!portfolioData || portfolioData.tokens.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <Card className="max-w-lg mx-auto">
          <CardContent className="p-6 text-center">
            <Coins className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-semibold mb-2">Keine Token gefunden</h2>
            <p className="text-gray-600 mb-4">
              {portfolioData?.wallets?.length === 0 
                ? 'Fügen Sie zuerst Ihre Wallet-Adressen hinzu.'
                : 'In Ihren Wallets wurden keine Token mit Wert gefunden.'
              }
            </p>
            <Button onClick={loadPortfolio}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Erneut laden
            </Button>
          </CardContent>
        </Card>
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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Portfolio Übersicht</h1>
            <p className="text-gray-600">
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
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className={`${stat.color} p-3 rounded-lg`}>
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Debug Information */}
        {showDebug && portfolioData.debug && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                Debug Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium">Preise aktualisiert:</span>
                  <p>{portfolioData.debug.pricesUpdated}</p>
                </div>
                <div>
                  <span className="font-medium">Preis-Quelle:</span>
                  <p>{portfolioData.debug.priceSource}</p>
                </div>
                <div>
                  <span className="font-medium">API-Aufrufe:</span>
                  <p>{portfolioData.debug.apiCalls}</p>
                </div>
                <div>
                  <span className="font-medium">Letzte Preis-Update:</span>
                  <p>{new Date(portfolioData.debug.lastPriceUpdate).toLocaleTimeString('de-DE')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Token Holdings */}
        <Card>
          <CardHeader>
            <CardTitle>Token Holdings ({portfolioData.tokens.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2">Rang</th>
                    <th className="text-left py-3 px-2">Token</th>
                    <th className="text-right py-3 px-2">Anzahl</th>
                    <th className="text-right py-3 px-2">Preis</th>
                    <th className="text-right py-3 px-2">Wert</th>
                    <th className="text-right py-3 px-2">Portfolio %</th>
                    <th className="text-center py-3 px-2">Preis-Quelle</th>
                    <th className="text-center py-3 px-2">Links</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolioData.tokens.map((token, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-2">
                        <Badge variant="outline" className="text-xs">
                          #{token.holdingRank}
                        </Badge>
                      </td>
                      <td className="py-3 px-2">
                        <div>
                          <div className="font-medium">{token.symbol}</div>
                          <div className="text-sm text-gray-500">{token.name}</div>
                          <div className="text-xs text-gray-400">
                            {token.contractAddress?.slice(0, 8)}...
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <div className="font-mono">
                          {formatNumber(token.balance, 6)}
                        </div>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <div className="font-mono">
                          {token.price > 0 ? formatCurrency(token.price, 8) : 'N/A'}
                        </div>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <div className="font-bold text-green-600">
                          {formatCurrency(token.value)}
                        </div>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <div className="text-sm">
                          {formatPercentage(token.percentageOfPortfolio)}
                        </div>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <Badge 
                          variant={token.priceSource === 'dexscreener' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {token.priceSource === 'dexscreener' ? 'Live' : 
                           token.priceSource === 'fallback' ? 'Fallback' : 'Unknown'}
                        </Badge>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <div className="flex justify-center space-x-1">
                          {token.contractAddress && (
                            <a
                              href={`https://scan.pulsechain.com/token/${token.contractAddress}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:text-blue-700"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          )}
                          {token.contractAddress && (
                            <a
                              href={`https://dexscreener.com/pulsechain/${token.contractAddress}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-green-500 hover:text-green-700"
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
          </CardContent>
        </Card>

        {/* Portfolio Distribution */}
        {portfolioData.tokens.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Portfolio Verteilung</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {portfolioData.tokens.slice(0, 10).map((token, index) => (
                  <div key={index} className="flex items-center">
                    <div className="w-20 text-sm font-medium">{token.symbol}</div>
                    <div className="flex-1 mx-3">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full" 
                          style={{ width: `${Math.min(token.percentageOfPortfolio, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="w-16 text-right text-sm">
                      {formatPercentage(token.percentageOfPortfolio)}
                    </div>
                    <div className="w-24 text-right text-sm font-medium ml-2">
                      {formatCurrency(token.value)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
};

export default PortfolioView; 