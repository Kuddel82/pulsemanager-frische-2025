// 💎 Portfolio View - PulseWatch-kompatible Ansicht
// Zeigt Token-Holdings mit echten Preisen und korrekter Wallet-Struktur

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, ExternalLink, TrendingUp, TrendingDown, DollarSign, Coins, BarChart3, Activity } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { WalletParser } from '@/services/WalletParser';

const PortfolioView = () => {
  const { user } = useAuth();
  const [portfolioData, setPortfolioData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAllTokens, setShowAllTokens] = useState(false);
  
  // 🔄 Portfolio-Daten laden
  const loadPortfolioData = async () => {
    if (!user?.wallet_address) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 LOADING PORTFOLIO DATA...');
      
      // Lade echte Wallet-Daten via WalletParser
      const result = await WalletParser.refreshWalletData(
        user.id, 
        user.wallet_address, 
        369 // PulseChain
      );
      
      if (result.success) {
        setPortfolioData(result);
        console.log(`✅ PORTFOLIO LOADED: $${result.totalValue.toFixed(2)} (${result.tokensFound} tokens)`);
      } else {
        throw new Error(result.error || 'Failed to load portfolio');
      }
      
    } catch (error) {
      console.error('💥 Portfolio loading error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // 🚀 Initiales Laden
  useEffect(() => {
    loadPortfolioData();
    
    // Auto-refresh alle 5 Minuten
    const interval = setInterval(loadPortfolioData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user]);

  // 📊 Portfolio-Statistiken berechnen
  const getPortfolioStats = () => {
    if (!portfolioData?.tokens) return null;
    
    const tokens = portfolioData.tokens;
    const totalValue = portfolioData.totalValue || 0;
    
    return {
      totalValue: totalValue,
      tokenCount: tokens.length,
      topHolding: tokens[0] || null,
      avgTokenValue: totalValue / tokens.length,
      top5Value: tokens.slice(0, 5).reduce((sum, t) => sum + t.valueUSD, 0),
      top10Value: tokens.slice(0, 10).reduce((sum, t) => sum + t.valueUSD, 0)
    };
  };

  // 🎨 Token-Zeile rendern (PulseWatch-Style)
  const renderTokenRow = (token, index) => {
    const stats = getPortfolioStats();
    const percentageOfTotal = stats ? (token.valueUSD / stats.totalValue) * 100 : 0;
    
    return (
      <div key={`${token.symbol}-${index}`} className="flex items-center justify-between p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors">
        {/* 📊 Rank & Token Info */}
        <div className="flex items-center space-x-4 flex-1">
          <div className="text-sm font-mono text-gray-500 w-8">
            #{index + 1}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <span className="font-semibold text-gray-900" translate="no">
                {token.symbol}
              </span>
              
              {/* 🏆 Top Token Badge */}
              {index < 3 && (
                <Badge variant={index === 0 ? "default" : "secondary"} className="text-xs">
                  {index === 0 ? '🏆 Top' : index === 1 ? '🥈 2nd' : '🥉 3rd'}
                </Badge>
              )}
              
              {/* 🔗 DexScreener Link */}
              {token.contractAddress && token.contractAddress !== 'native' && (
                <a 
                  href={token.dexScreenerUrl || `https://dexscreener.com/pulsechain/${token.contractAddress}`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-blue-500 transition-colors"
                >
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
            
            <div className="text-sm text-gray-600" translate="no">
              {token.name}
            </div>
          </div>
        </div>
        
        {/* 💰 Balance & Value */}
        <div className="text-right space-y-1">
          <div className="font-semibold text-gray-900">
            ${token.valueUSD.toFixed(2)}
          </div>
          
          <div className="text-sm text-gray-600">
            {token.balance.toLocaleString(undefined, { 
              minimumFractionDigits: 2,
              maximumFractionDigits: 4 
            })} {token.symbol}
          </div>
          
          <div className="text-xs text-gray-500">
            {percentageOfTotal.toFixed(1)}% • ${token.estimatedPrice.toExponential(2)}
          </div>
        </div>
      </div>
    );
  };

  const stats = getPortfolioStats();
  const displayTokens = showAllTokens ? portfolioData?.tokens || [] : (portfolioData?.tokens || []).slice(0, 20);

  return (
    <div className="space-y-6">
      {/* 📊 Portfolio Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 💰 Total Value */}
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Portfolio Value</p>
                <p className="text-2xl font-bold">
                  ${stats?.totalValue.toFixed(2) || '0.00'}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        {/* 🪙 Token Count */}
        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Token Count</p>
                <p className="text-2xl font-bold">
                  {stats?.tokenCount || 0}
                </p>
              </div>
              <Coins className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        {/* 🏆 Top Holding */}
        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Top Holding</p>
                <p className="text-xl font-bold" translate="no">
                  {stats?.topHolding?.symbol || 'N/A'}
                </p>
                <p className="text-sm text-purple-200">
                  ${stats?.topHolding?.valueUSD.toFixed(2) || '0.00'}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>

        {/* 📈 Avg Token Value */}
        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">Avg Token Value</p>
                <p className="text-2xl font-bold">
                  ${stats?.avgTokenValue.toFixed(2) || '0.00'}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 🪙 Token Holdings Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Coins className="h-5 w-5" />
            <span>Token Holdings</span>
            
            {portfolioData && (
              <Badge variant="outline" className="ml-2">
                {portfolioData.tokens?.length || 0} tokens
              </Badge>
            )}
          </CardTitle>
          
          <div className="flex items-center space-x-2">
            {/* 🔄 Refresh Button */}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadPortfolioData}
              disabled={loading}
              className="flex items-center space-x-1"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Loading...' : 'Refresh'}</span>
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          {error && (
            <div className="p-6 text-center">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 font-medium">Error loading portfolio:</p>
                <p className="text-red-600 text-sm mt-1">{error}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={loadPortfolioData}
                  className="mt-3"
                >
                  Try Again
                </Button>
              </div>
            </div>
          )}
          
          {loading && !portfolioData && (
            <div className="p-12 text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400" />
              <p className="text-gray-600 mt-2">Loading portfolio data...</p>
            </div>
          )}
          
          {portfolioData && portfolioData.tokens && portfolioData.tokens.length > 0 && (
            <>
              {/* 📊 Portfolio Header Info */}
              <div className="p-4 bg-gray-50 border-b">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    💎 Showing <span className="font-semibold">{displayTokens.length}</span> of <span className="font-semibold">{portfolioData.tokens.length}</span> tokens
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    🔄 Updated: {new Date().toLocaleTimeString()}
                  </div>
                </div>
              </div>
              
              {/* 🪙 Token List */}
              <div className="max-h-96 overflow-y-auto">
                {displayTokens.map((token, index) => renderTokenRow(token, index))}
              </div>
              
              {/* 👀 Show More Button */}
              {portfolioData.tokens.length > 20 && (
                <div className="p-4 border-t text-center">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowAllTokens(!showAllTokens)}
                    className="w-full"
                  >
                    {showAllTokens 
                      ? `Hide ${portfolioData.tokens.length - 20} tokens` 
                      : `Show all ${portfolioData.tokens.length} tokens`
                    }
                  </Button>
                </div>
              )}
            </>
          )}
          
          {portfolioData && (!portfolioData.tokens || portfolioData.tokens.length === 0) && (
            <div className="p-12 text-center">
              <Coins className="h-12 w-12 mx-auto text-gray-300" />
              <p className="text-gray-600 mt-4">No tokens found in this wallet</p>
              <p className="text-gray-500 text-sm mt-1">
                Make sure your wallet address is correct and has token balances
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 🔍 Debug Info */}
      {portfolioData?.debug && (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-sm text-gray-600">Debug Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-gray-500 space-y-1">
              <div>Wallet: {user?.wallet_address}</div>
              <div>Chain: PulseChain (369)</div>
              <div>Method: {portfolioData.method}</div>
              <div>API Status: {JSON.stringify(portfolioData.debug?.apiCalls)}</div>
              <div>Last Update: {portfolioData.debug?.timestamp}</div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PortfolioView; 