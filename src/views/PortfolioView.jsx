// 📊 PORTFOLIO VIEW - Zeigt Token-Holdings mit echten Preisen
// Datum: 2025-01-08 - PHASE 3: ECHTE PREISE INTEGRATION

import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import SmartLoadButton from '@/components/ui/SmartLoadButton';
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
import { usePortfolioContext } from '@/contexts/PortfolioContext';

const PortfolioView = () => {
  // 🚀 GLOBAL: Portfolio Context mit Caching & State-Sharing
  const {
    portfolioData,
    loading,
    error,
    lastUpdate,
    loadPortfolioData,
    canRefresh,
    remainingTime,
    stats,
    hasData,
    isStale,
    isCached
  } = usePortfolioContext();

  const [showDebug, setShowDebug] = useState(false);
  
  // 👁️ TOKEN VISIBILITY STATE - User kann Shit Coins ausblenden
  const [hiddenTokens, setHiddenTokens] = useState(new Set());
  
  // Toggle Token Visibility
  const toggleTokenVisibility = (tokenAddress) => {
    setHiddenTokens(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tokenAddress)) {
        newSet.delete(tokenAddress);
      } else {
        newSet.add(tokenAddress);
      }
      return newSet;
    });
  };

  // 🚀 FIXED: Smart loading states - Berücksichtige Cache-Daten
  const showEmptyState = !loading && !portfolioData;
  const showErrorState = !loading && error && !portfolioData;
  const showContent = portfolioData && portfolioData.tokens && portfolioData.tokens.length > 0;

  // 🔍 DEBUG: Log states for troubleshooting
  console.log('🔍 PORTFOLIO VIEW STATES:', {
    loading,
    hasData,
    portfolioData: !!portfolioData,
    tokensCount: portfolioData?.tokens?.length || 0,
    showEmptyState,
    showErrorState,
    showContent,
    isCached,
    lastUpdate
  });

  if (showErrorState) {
    return (
      <div className="min-h-screen bg-black p-6">
        <div className="pulse-card max-w-lg mx-auto p-6 text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-400" />
          <h2 className="text-xl font-semibold mb-2 pulse-text">Fehler beim Laden des Portfolios</h2>
          <p className="pulse-text-secondary mb-6">{error}</p>
          <SmartLoadButton
            onLoad={loadPortfolioData}
            loading={loading}
            canRefresh={canRefresh}
            remainingTime={remainingTime}
            stats={stats}
            buttonText="Erneut versuchen"
          />
        </div>
      </div>
    );
  }

  if (showEmptyState) {
    return (
      <div className="min-h-screen bg-black p-6">
        <div className="pulse-card max-w-lg mx-auto p-6 text-center">
          <Coins className="h-12 w-12 mx-auto mb-4 text-blue-400" />
          <h2 className="text-xl font-semibold mb-2 pulse-text">Portfolio noch nicht geladen</h2>
          <p className="pulse-text-secondary mb-6">
            Laden Sie Ihre Portfolio-Daten um Token-Holdings und Werte zu sehen.
          </p>
          <SmartLoadButton
            onLoad={loadPortfolioData}
            loading={loading}
            canRefresh={canRefresh}
            remainingTime={remainingTime}
            stats={stats}
            buttonText="Portfolio laden"
            size="lg"
          />
        </div>
      </div>
    );
  }

  // 🛡️ SAFE STATS - Verhindere Crashes bei fehlenden Daten
  const portfolioStats = portfolioData ? [
    {
      title: 'Gesamtwert',
      value: formatCurrency(portfolioData.totalValue || 0),
      icon: DollarSign,
      color: 'bg-green-500'
    },
    {
      title: 'Token',
      value: (portfolioData.tokenCount || 0).toString(),
      icon: Coins,
      color: 'bg-blue-500'
    },
    {
      title: 'Wallets',
      value: (portfolioData.walletCount || 0).toString(),
      icon: TrendingUp,
      color: 'bg-purple-500'
    }
  ] : [];

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold pulse-title">Portfolio Übersicht</h1>
            <div className="flex items-center space-x-4 text-sm pulse-text-secondary">
              <span>💰 MORALIS PRO MODUS</span>
              <span className="text-green-400">✅ Manuelle Steuerung aktiv</span>
              {isCached && <span className="text-blue-400">💾 Aus Cache geladen</span>}
              {lastUpdate && (
                <span>Letzte Aktualisierung: {lastUpdate.toLocaleTimeString('de-DE')}</span>
              )}
              {isStale && (
                <Badge variant="outline" className="border-yellow-400 text-yellow-600">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Daten älter als 10 Min
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDebug(!showDebug)}
            >
              {showDebug ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              Debug
            </Button>
            
            {/* 🚀 NEW: Smart Load Button with Rate Limiting */}
            <SmartLoadButton
              onLoad={loadPortfolioData}
              loading={loading}
              canRefresh={canRefresh}
              remainingTime={remainingTime}
              lastUpdate={lastUpdate}
              stats={stats}
              buttonText="Aktualisieren"
              showStats={true}
            />
          </div>
        </div>

        {/* Portfolio Stats */}
        {portfolioStats.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {portfolioStats.map((stat, index) => (
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
        )}

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

        {/* MORALIS PRO STATUS & COST SAVING INFO */}
        <div className="pulse-card p-4 mb-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <DollarSign className="h-5 w-5 mr-2 text-green-400" />
              <div>
                <span className="pulse-text font-medium">💰 MORALIS PRO: Auto-Loading gestoppt!</span>
                <p className="text-sm pulse-text-secondary">
                  Alle versteckten API-Calls deaktiviert • 5-Min Rate-Limit • Nur manuelle Anfragen
                </p>
              </div>
            </div>
            <Badge variant="outline" className="text-green-400 border-green-400">
              COST OPTIMIZED
            </Badge>
          </div>
          {portfolioData?.totalValue && portfolioData.totalValue < 20000 && (
            <div className="mt-3 p-2 bg-yellow-500/10 border border-yellow-400/20 rounded">
              <p className="text-yellow-400 text-sm">
                💡 <strong>Portfolio-Wert-Hinweis:</strong> Falls Ihr Portfolio ca. 25.000€ wert ist, 
                könnten noch nicht alle Token-Preise korrekt geladen sein. 
                Klicken Sie auf "Aktualisieren" für eine vollständige Preisabfrage.
              </p>
            </div>
          )}
        </div>

        {/* PRICE SOURCE VALIDATION WARNING */}
        {portfolioData?.tokens?.filter(t => !t.hasReliablePrice && t.balance > 0.001).length > 0 && (
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

        {/* Hidden Tokens Panel */}
        {hiddenTokens.size > 0 && (
          <div className="pulse-card p-4 mb-6 border-l-4 border-gray-500">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <EyeOff className="h-5 w-5 mr-2 text-gray-400" />
                <span className="pulse-text font-medium">
                  {hiddenTokens.size} versteckte Token{hiddenTokens.size !== 1 ? 's' : ''}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setHiddenTokens(new Set())}
                className="text-xs"
              >
                <Eye className="h-3 w-3 mr-1" />
                Alle einblenden
              </Button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {(portfolioData?.tokens || [])
                .filter(token => hiddenTokens.has(token.contractAddress))
                .map((token, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => toggleTokenVisibility(token.contractAddress)}
                    className="text-xs text-gray-400 hover:text-white"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    {token.symbol}
                  </Button>
                ))}
            </div>
          </div>
        )}

        {/* Token Holdings */}
        <div className="pulse-card p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold pulse-text">
              Token Holdings ({(portfolioData?.tokens || []).filter(token => !hiddenTokens.has(token.contractAddress)).length}/{portfolioData?.tokens?.length || 0})
            </h3>
            {hiddenTokens.size > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setHiddenTokens(new Set())}
                className="text-xs"
              >
                <Eye className="h-3 w-3 mr-1" />
                Alle anzeigen
              </Button>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-center py-3 px-2 pulse-text-secondary">👁️</th>
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
                {(portfolioData?.tokens || [])
                  .filter(token => !hiddenTokens.has(token.contractAddress))
                  .map((token, index) => (
                  <tr key={index} className={`border-b border-white/5 hover:bg-white/5 ${!token.hasReliablePrice ? 'opacity-60' : ''}`}>
                    <td className="py-3 px-2 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleTokenVisibility(token.contractAddress)}
                        className="h-8 w-8 p-0"
                        title="Token verstecken/anzeigen"
                      >
                        <Eye className="h-4 w-4 text-blue-400 hover:text-blue-300" />
                      </Button>
                    </td>
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
                          token.priceSource === 'moralis_live' ? 'border-green-400 text-green-400' :
                          token.priceSource === 'moralis_combined' ? 'border-cyan-400 text-cyan-400' :
                          token.priceSource === 'moralis_realtime' ? 'border-emerald-400 text-emerald-400' :
                          token.priceSource === 'pulsex_manual' ? 'border-purple-400 text-purple-400' :
                          token.priceSource === 'fallback_minimal' ? 'border-blue-400 text-blue-400' :
                          token.priceSource?.includes('blocked') ? 'border-red-400 text-red-400' :
                          'border-gray-500 text-gray-500'
                        }`}
                      >
                        {token.priceSource === 'moralis_live' ? '🔵 Moralis' :
                         token.priceSource === 'moralis_combined' ? '⚡ Combined' :
                         token.priceSource === 'moralis_realtime' ? '💎 Moralis RT' :
                         token.priceSource === 'pulsex_manual' ? '🚀 Manual' :
                         token.priceSource === 'fallback_minimal' ? '🟡 Fallback' : 
                         token.priceSource?.includes('blocked') ? '🔴 Blocked' :
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
                            href={`https://scan.pulsechain.com/token/${token.contractAddress}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-400 hover:text-green-300"
                            title="View on PulseChain Explorer"
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
        {(portfolioData?.tokens || []).filter(t => t.isIncludedInPortfolio && !hiddenTokens.has(t.contractAddress)).length > 0 && (
          <div className="pulse-card p-6 mt-6">
            <h3 className="text-lg font-bold pulse-text mb-4">Portfolio Verteilung (nur sichtbare Tokens mit verlässlichen Preisen)</h3>
            <div className="space-y-3">
              {(portfolioData?.tokens || [])
                .filter(t => t.isIncludedInPortfolio && !hiddenTokens.has(t.contractAddress))
                .slice(0, 10)
                .map((token, index) => (
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