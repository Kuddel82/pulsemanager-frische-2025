// 💎 PORTFOLIO VIEW - Vereinfacht mit CentralDataService  
// Zeigt Token-Holdings mit echten Preisen - Datum: 2025-01-08 REPARATUR

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  RefreshCw, 
  ExternalLink, 
  DollarSign, 
  Coins, 
  BarChart3, 
  TrendingUp,
  AlertCircle,
  EyeOff,
  Eye,
  Wallet
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { DirectMoralisService } from '@/services/DirectMoralisService';
import { supabase } from '@/lib/supabaseClient';
import { getHiddenTokens, hideToken as hideTokenService, showToken as showTokenService, testHiddenTokenService } from '@/services/HiddenTokenService';

const PortfolioView = () => {
  const { user } = useAuth();
  const { canAccessPortfolio, getAccessMessage, isPremium } = useSubscription();
  const [portfolioData, setPortfolioData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  
  // 🙈 Token-Hiding Feature
  const [hiddenTokens, setHiddenTokens] = useState([]);
  const [showHidden, setShowHidden] = useState(false);

  // 🚀 IMPROVED: Allow direct navigation to Portfolio view
  // Show empty state with load button if no data, don't force loading
  const showEmptyState = !loading && !portfolioData && !error;
  const showLoadButton = !loading && !portfolioData;
  
  // 🚀 FORCE UPDATE for debugging
  const [forceUpdateCount, setForceUpdateCount] = useState(0);
  const handleForceUpdate = () => {
    console.log('🚨 PORTFOLIO: Force update requested');
    setForceUpdateCount(prev => prev + 1);
    loadPortfolioData(true); // Force load bypassing rate limits
  };

  // Portfolio laden mit DirectMoralisService
  const loadPortfolioData = async (force = false) => {
    if (!user?.id || !canAccessPortfolio()) {
      setError('Portfolio-Zugang nicht verfügbar');
      return;
    }
    
    // Hole gespeicherte Wallet-Adressen
    const { data: wallets } = await supabase
      .from('wallets')
      .select('address, chain_id')
      .eq('user_id', user.id)
      .eq('is_active', true);
    
    if (!wallets || wallets.length === 0) {
      setError('Keine Wallets gefunden. Bitte verbinden Sie zuerst ein Wallet.');
      return;
    }
    
    setLoading(true);
    setError(null);
    setStatusMessage('🚀 Lade Portfolio über DirectMoralisService...');
    
    try {
      console.log('🚀 PORTFOLIO: Loading with DirectMoralisService for', wallets.length, 'wallets');
      
      let allTokens = [];
      let totalValue = 0;
      let totalCUs = 0;
      
      // Lade Portfolio für alle Wallets
      for (const wallet of wallets) {
        const chain = wallet.chain_id === 369 ? '0x171' : '0x1'; // PulseChain oder Ethereum
        
        console.log(`🔍 Loading portfolio for ${wallet.address} on chain ${chain}`);
        
        const result = await DirectMoralisService.getPortfolioTokens(wallet.address, chain);
        
        if (result.success) {
          allTokens.push(...result.tokens.map(token => ({
            ...token,
            walletAddress: wallet.address,
            chain: chain,
            value: token.usdValue || 0
          })));
          totalValue += result.totalValue;
          totalCUs += result.cuUsed;
          
          console.log(`✅ Loaded ${result.tokens.length} tokens, $${result.totalValue}`);
        } else {
          console.warn(`⚠️ Failed to load portfolio for ${wallet.address}:`, result.error);
        }
      }
      
      // Sortiere Tokens nach Wert
      allTokens.sort((a, b) => (b.value || 0) - (a.value || 0));
      
      const portfolioResult = {
        tokens: allTokens,
        totalValue: totalValue,
        tokenCount: allTokens.length,
        cuUsed: totalCUs,
        walletCount: wallets.length,
        source: 'direct_moralis_pro'
      };
      
      setPortfolioData(portfolioResult);
      setStatusMessage(`✅ Portfolio geladen: ${allTokens.length} Tokens, $${totalValue.toFixed(2)} (${totalCUs} CUs)`);
      console.log('✅ PORTFOLIO: DirectMoralis portfolio loaded successfully');
      
      // 🙈 Lade versteckte Tokens
      try {
        const hidden = await getHiddenTokens(user.id);
        setHiddenTokens(hidden);
      } catch (hiddenError) {
        console.warn('⚠️ HIDDEN_TOKENS: Could not load hidden tokens:', hiddenError);
        setHiddenTokens([]);
      }
      
    } catch (error) {
      console.error('💥 PORTFOLIO: DirectMoralis error:', error);
      setError(error.message);
      setStatusMessage(`💥 Fehler: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ❌ EMERGENCY DISABLED: Auto-loading komplett deaktiviert für Kostenreduktion
  // useEffect(() => {
  //   loadPortfolioData();
  //   
  //   // Auto-refresh alle 5 Minuten
  //   const interval = setInterval(loadPortfolioData, 5 * 60 * 1000);
  //   return () => clearInterval(interval);
  // }, [user?.id]);

  // Format Funktionen
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value || 0);
  };

  const formatCrypto = (value, symbol) => {
    const formatted = (value || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    });
    return `${formatted} ${symbol}`;
  };

  // Portfolio-Statistiken berechnen
  const getPortfolioStats = () => {
    if (!portfolioData?.tokens) return null;
    
    const tokens = portfolioData.tokens;
    const totalValue = portfolioData.totalValue || 0;
    
    return {
      totalValue: totalValue,
      tokenCount: tokens.length,
      topHolding: tokens[0] || null,
      avgTokenValue: tokens.length > 0 ? totalValue / tokens.length : 0,
      top5Value: tokens.slice(0, 5).reduce((sum, t) => sum + t.value, 0),
      diversificationScore: tokens.length > 0 ? Math.min(100, (tokens.length / 20) * 100) : 0
    };
  };

  const stats = getPortfolioStats();
  
  // 🙈 Token-Hiding Funktionen
  const getTokenIdentifier = (token) => {
    // Nutze contractAddress oder symbol als eindeutigen Identifier
    return token.contractAddress && token.contractAddress !== 'native' 
      ? token.contractAddress 
      : token.symbol;
  };

  const hideToken = async (token) => {
    if (!user?.id) return;
    
    try {
      const tokenId = getTokenIdentifier(token);
      const updated = await hideTokenService(user.id, tokenId);
      setHiddenTokens(updated);
      console.log('🙈 TOKEN_HIDDEN: Successfully hidden token:', token.symbol);
    } catch (error) {
      console.error('💥 HIDE_TOKEN: Failed to hide token:', error);
    }
  };

  const showToken = async (token) => {
    if (!user?.id) return;
    
    try {
      const tokenId = getTokenIdentifier(token);
      const updated = await showTokenService(user.id, tokenId);
      setHiddenTokens(updated);
      console.log('👁️ TOKEN_SHOWN: Successfully shown token:', token.symbol);
    } catch (error) {
      console.error('💥 SHOW_TOKEN: Failed to show token:', error);
    }
  };

  // 📊 Token-Filterung basierend auf showHidden und hiddenTokens
  const getFilteredTokens = () => {
    if (!portfolioData?.tokens) return [];
    
    if (showHidden) {
      // Zeige alle Tokens
      return portfolioData.tokens;
    } else {
      // Verstecke Tokens die in hiddenTokens sind
      return portfolioData.tokens.filter(token => {
        const tokenId = getTokenIdentifier(token);
        return !hiddenTokens.includes(tokenId);
      });
    }
  };

  const isTokenHidden = (token) => {
    const tokenId = getTokenIdentifier(token);
    return hiddenTokens.includes(tokenId);
  };

  if (showEmptyState) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Portfolio</h1>
            <p className="text-gray-600">Ihr Krypto-Portfolio Überblick</p>
          </div>
          <div className="flex space-x-2">
            <Button 
              onClick={() => loadPortfolioData()} 
              disabled={!showLoadButton}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Portfolio laden
            </Button>
            {/* 🚀 FORCE BUTTON for debugging */}
            <Button 
              onClick={handleForceUpdate}
              variant="destructive"
              size="sm"
              className="bg-red-600 hover:bg-red-700"
            >
              <AlertCircle className="h-4 w-4 mr-2" />
              Force Load
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-12 text-center">
            <Wallet className="h-16 w-16 mx-auto text-gray-300 mb-6" />
            <h3 className="text-xl font-semibold text-gray-600 mb-4">Portfolio bereit zum Laden</h3>
            <p className="text-gray-500 mb-6">
              Klicken Sie auf "Portfolio laden", um Ihre Wallet-Daten und Token-Holdings zu laden.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-500">
              <div>
                <strong>✅ Sofortige Navigation</strong><br/>
                Wechseln Sie direkt zum Portfolio ohne Wartezeit
              </div>
              <div>
                <strong>💰 Kostenoptimiert</strong><br/>
                Daten werden nur auf Anfrage geladen
              </div>
              <div>
                <strong>🚀 Smart Caching</strong><br/>
                Einmal geladene Daten werden 10 Minuten gecacht
              </div>
            </div>
            <div className="mt-6">
              <Button 
                onClick={() => loadPortfolioData()} 
                disabled={!showLoadButton}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700"
              >
                <TrendingUp className="h-5 w-5 mr-2" />
                Portfolio jetzt laden
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Portfolio</h1>
          <p className="text-gray-600">Ihre Token-Holdings auf PulseChain</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            onClick={loadPortfolioData}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Lade...' : 'Aktualisieren'}
          </Button>
          
          {/* 🧪 DEBUG: Test Token-Hiding */}
          <Button 
            onClick={() => testHiddenTokenService(user?.id)}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <EyeOff className="h-4 w-4" />
            Test Hiding
          </Button>
        </div>
      </div>

      {/* Status Message */}
      {statusMessage && (
        <Card>
          <CardContent className="p-4">
            <p className="text-sm font-mono">{statusMessage}</p>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-4 w-4" />
              <p className="font-medium">Fehler beim Laden des Portfolios</p>
            </div>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Portfolio Statistics Cards */}
      {portfolioData && stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Value */}
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Portfolio Wert</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(stats.totalValue)}
                  </p>
                  <p className="text-blue-200 text-sm">
                    {portfolioData.walletCount} Wallets
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          {/* Token Count */}
          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Token Count</p>
                  <p className="text-2xl font-bold">
                    {stats.tokenCount}
                  </p>
                  <p className="text-green-200 text-sm">
                    Verschiedene Tokens
                  </p>
                </div>
                <Coins className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          {/* Top Holding */}
          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Top Holding</p>
                  <p className="text-xl font-bold">
                    {stats.topHolding?.symbol || 'N/A'}
                  </p>
                  <p className="text-purple-200 text-sm">
                    {stats.topHolding ? formatCurrency(stats.topHolding.value) : '$0.00'}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          {/* Avg Token Value */}
          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">Ø Token Wert</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(stats.avgTokenValue)}
                  </p>
                  <p className="text-orange-200 text-sm">
                    Durchschnitt
                  </p>
                </div>
                <BarChart3 className="h-8 w-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Token Holdings Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5" />
              Token Holdings
              {portfolioData && (
                <Badge variant="outline" className="ml-2">
                  {getFilteredTokens().length} von {portfolioData.tokens?.length || 0} Tokens
                </Badge>
              )}
              {hiddenTokens.length > 0 && !showHidden && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {hiddenTokens.length} versteckt
                </Badge>
              )}
            </CardTitle>
            
            {/* 🙈 Token-Hiding Controls - IMMER anzeigen */}
            {portfolioData?.tokens && (
              <div className="flex items-center gap-2">
                {hiddenTokens.length > 0 && (
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showHidden}
                      onChange={(e) => setShowHidden(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-gray-600">Versteckte Tokens anzeigen</span>
                  </label>
                )}
                <div className="flex items-center gap-3">
                  <div className="text-xs text-gray-500">
                    👁️ Auge-Icon zum Ausblenden • 🔒 Scam-Schutz
                  </div>
                  {/* 🧪 DEBUG INFO */}
                  <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    Debug: {hiddenTokens.length} versteckt • Storage: {typeof window !== 'undefined' && localStorage.getItem(`pulsemanager_hidden_tokens_${user?.id}`) ? 'localStorage' : 'none'}
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {portfolioData?.tokens && getFilteredTokens().length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">Rang</th>
                    <th className="text-left p-3 font-medium">Token</th>
                    <th className="text-right p-3 font-medium">Balance</th>
                    <th className="text-right p-3 font-medium">Preis</th>
                    <th className="text-right p-3 font-medium">Wert</th>
                    <th className="text-right p-3 font-medium">Anteil</th>
                    <th className="text-center p-3 font-medium">Links</th>
                    <th className="text-center p-3 font-medium">Aktion</th>
                  </tr>
                </thead>
                <tbody>
                  {getFilteredTokens().slice(0, 20).map((token, index) => (
                    <tr key={`${token.symbol}-${token.contractAddress}-${index}`} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-mono text-gray-500 w-8">
                            #{token.holdingRank}
                          </span>
                          {index < 3 && (
                            <Badge variant={index === 0 ? "default" : "secondary"} className="text-xs">
                              {index === 0 ? '🏆' : index === 1 ? '🥈' : '🥉'}
                            </Badge>
                          )}
                        </div>
                      </td>
                      
                      <td className="p-3">
                        <div>
                          <div className="font-semibold">{token.symbol}</div>
                          <div className="text-sm text-gray-600">
                            {token.name || 'Unknown Token'}
                          </div>
                        </div>
                      </td>
                      
                      <td className="p-3 text-right">
                        <div className="font-mono text-sm">
                          {formatCrypto(token.balance, '')}
                        </div>
                      </td>
                      
                      <td className="p-3 text-right">
                        <div className="text-sm font-mono">
                          {token.price > 0 ? 
                            (token.price < 0.01 ? 
                              `$${token.price.toExponential(2)}` : 
                              formatCurrency(token.price)
                            ) : 
                            '$0.00'
                          }
                        </div>
                      </td>
                      
                      <td className="p-3 text-right">
                        <div className="font-semibold">
                          {formatCurrency(token.value)}
                        </div>
                      </td>
                      
                      <td className="p-3 text-right">
                        <div className="text-sm">
                          {token.percentageOfPortfolio.toFixed(1)}%
                        </div>
                      </td>
                      
                      <td className="p-3 text-center">
                        <div className="flex justify-center gap-1">
                          {token.contractAddress && token.contractAddress !== 'native' && (
                            <>
                              <a 
                                href={`https://scan.pulsechain.com/address/${token.contractAddress}`}
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-500 hover:text-blue-700"
                                title="Auf PulseChain Scan anzeigen"
                              >
                                <ExternalLink className="h-3 w-3" />
                              </a>
                              <a 
                                href={`https://dexscreener.com/pulsechain/${token.contractAddress}`}
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-green-500 hover:text-green-700"
                                title="Auf DexScreener anzeigen"
                              >
                                <BarChart3 className="h-3 w-3" />
                              </a>
                            </>
                          )}
                        </div>
                      </td>
                      
                      {/* 🙈 Token-Hiding Aktion */}
                      <td className="p-3 text-center">
                        <button
                          onClick={() => isTokenHidden(token) ? showToken(token) : hideToken(token)}
                          className={`p-1 rounded transition-colors ${
                            isTokenHidden(token) 
                              ? 'text-gray-400 hover:text-blue-500' 
                              : 'text-gray-600 hover:text-red-500'
                          }`}
                          title={isTokenHidden(token) ? 'Token einblenden' : 'Token ausblenden'}
                        >
                          {isTokenHidden(token) ? (
                            <Eye className="h-4 w-4" />
                          ) : (
                            <EyeOff className="h-4 w-4" />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {getFilteredTokens().length > 20 && (
                <div className="mt-4 text-center text-sm text-gray-500">
                  Zeige die ersten 20 von {getFilteredTokens().length} Tokens
                  {!showHidden && hiddenTokens.length > 0 && (
                    <span className="text-gray-400"> ({hiddenTokens.length} versteckt)</span>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <Coins className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                Keine Tokens gefunden
              </h3>
              <p className="text-gray-500 mb-4">
                {portfolioData ? 
                  'Keine Token mit Mindest-Wert im Portfolio gefunden.' :
                  'Laden Sie zuerst Ihre Portfolio-Daten.'
                }
              </p>
              {!portfolioData && (
                <Button onClick={loadPortfolioData}>
                  Portfolio laden
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Wallet Information */}
      {portfolioData?.wallets && portfolioData.wallets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Verbundene Wallets
              <Badge variant="outline" className="ml-2">
                {portfolioData.wallets.length} Wallets
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {portfolioData.wallets.map((wallet, index) => (
                <div key={wallet.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <div>
                      <div className="font-medium">{wallet.nickname || `Wallet ${index + 1}`}</div>
                      <div className="text-sm text-gray-600 font-mono">
                        {wallet.address.slice(0, 8)}...{wallet.address.slice(-6)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <a 
                      href={`https://scan.pulsechain.com/address/${wallet.address}`}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-700"
                      title="Auf PulseChain Scan anzeigen"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Portfolio Information */}
      <Card className="bg-green-50 border-green-200">
        <CardHeader>
          <CardTitle className="text-green-800">💡 Portfolio-Informationen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-green-700 space-y-2 text-sm">
            <p><strong>Echte Preise:</strong> Alle Token-Preise werden von verifizierten Quellen bezogen.</p>
            <p><strong>Auto-Refresh:</strong> Das Portfolio wird automatisch alle 5 Minuten aktualisiert.</p>
            <p><strong>Mindest-Wert:</strong> Nur Token mit einem Wert ≥ $0.01 werden angezeigt.</p>
            <p><strong>Scam-Schutz:</strong> Unerwünschte Token können mit dem 👁️-Icon ausgeblendet werden.</p>
            <p><strong>PulseChain fokus:</strong> Optimiert für PulseChain Token und Ecosystem.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PortfolioView; 