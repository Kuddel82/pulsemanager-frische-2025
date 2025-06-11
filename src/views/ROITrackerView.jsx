// 📊 ROI TRACKER VIEW - Zeigt echte ROI-Daten von PulseChain
// Datum: 2025-01-08 - PHASE 3: ECHTE ROI DATEN INTEGRATION

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
  TrendingUp, 
  Calendar,
  Coins,
  AlertCircle,
  ExternalLink,
  DollarSign,
  Clock,
  Eye,
  EyeOff
} from 'lucide-react';
import { formatCurrency, formatNumber, formatPercentage } from '@/lib/utils';
import CentralDataService from '@/services/CentralDataService';
import { useAuth } from '@/contexts/AuthContext';

const ROITrackerView = () => {
  const { user } = useAuth();
  const [portfolioData, setPortfolioData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [timeFrame, setTimeFrame] = useState('monthly'); // daily, weekly, monthly
  const [showDebug, setShowDebug] = useState(false);

  // Lade Portfolio-Daten (mit ROI)
  const loadROIData = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 ROI TRACKER: Loading data...');
      const data = await CentralDataService.loadCompletePortfolio(user.id);
      
      if (data.error) {
        setError(data.error);
      } else {
        setPortfolioData(data);
        setLastUpdate(new Date());
        console.log('✅ ROI TRACKER: Data loaded', {
          roiTransactions: data.roiTransactions.length,
          dailyROI: data.dailyROI,
          weeklyROI: data.weeklyROI,
          monthlyROI: data.monthlyROI
        });
      }
    } catch (err) {
      console.error('💥 ROI TRACKER ERROR:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadROIData();
  }, [user?.id]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(loadROIData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user?.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="pulse-card p-8 text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-green-400 mx-auto mb-4" />
          <span className="text-lg pulse-text">ROI-Daten werden geladen...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black p-6">
        <div className="pulse-card max-w-lg mx-auto p-6 text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-400" />
          <h2 className="text-xl font-semibold mb-2 pulse-text">Fehler beim Laden der ROI-Daten</h2>
          <p className="pulse-text-secondary mb-4">{error}</p>
          <Button onClick={loadROIData} className="bg-green-500 hover:bg-green-600">
            <RefreshCw className="h-4 w-4 mr-2" />
            Erneut versuchen
          </Button>
        </div>
      </div>
    );
  }

  if (!portfolioData) {
    return (
      <div className="min-h-screen bg-black p-6">
        <div className="pulse-card max-w-lg mx-auto p-6 text-center">
          <TrendingUp className="h-12 w-12 mx-auto mb-4 text-blue-400" />
          <h2 className="text-xl font-semibold mb-2 pulse-text">Keine ROI-Daten verfügbar</h2>
          <p className="pulse-text-secondary mb-4">
            Fügen Sie zuerst Ihre Wallet-Adressen hinzu oder warten Sie auf neue ROI-Transaktionen.
          </p>
          <Button onClick={loadROIData} className="bg-green-500 hover:bg-green-600">
            <RefreshCw className="h-4 w-4 mr-2" />
            Erneut laden
          </Button>
        </div>
      </div>
    );
  }

  const getCurrentROI = () => {
    switch (timeFrame) {
      case 'daily': return portfolioData.dailyROI || 0;
      case 'weekly': return portfolioData.weeklyROI || 0;
      case 'monthly': return portfolioData.monthlyROI || 0;
      default: return portfolioData.monthlyROI || 0;
    }
  };

  const getROIPercentage = () => {
    const totalValue = portfolioData.totalValue || 0;
    const currentROI = getCurrentROI();
    return totalValue > 0 ? (currentROI / totalValue) * 100 : 0;
  };

  // Filter ROI-Transaktionen nach Zeitrahmen
  const getFilteredROITransactions = () => {
    if (!portfolioData.roiTransactions) return [];
    
    const now = Date.now();
    const timeFrameMs = {
      daily: 24 * 60 * 60 * 1000,
      weekly: 7 * 24 * 60 * 60 * 1000,
      monthly: 30 * 24 * 60 * 60 * 1000
    };
    
    const cutoff = now - timeFrameMs[timeFrame];
    
    return portfolioData.roiTransactions.filter(tx => 
      new Date(tx.timestamp).getTime() > cutoff
    );
  };

  // Gruppiere ROI-Transaktionen nach Token
  const getROIByToken = () => {
    const filteredTransactions = getFilteredROITransactions();
    const tokenMap = new Map();
    
    filteredTransactions.forEach(tx => {
      const existing = tokenMap.get(tx.tokenSymbol) || {
        symbol: tx.tokenSymbol,
        name: tx.tokenName,
        contractAddress: tx.contractAddress,
        totalAmount: 0,
        totalValue: 0,
        transactionCount: 0,
        latestPrice: tx.price
      };
      
      existing.totalAmount += tx.amount;
      existing.totalValue += tx.value;
      existing.transactionCount += 1;
      
      tokenMap.set(tx.tokenSymbol, existing);
    });
    
    return Array.from(tokenMap.values()).sort((a, b) => b.totalValue - a.totalValue);
  };

  const roiStats = [
    {
      title: 'Täglicher ROI',
      value: formatCurrency(portfolioData.dailyROI || 0),
      icon: Clock,
      active: timeFrame === 'daily',
      onClick: () => setTimeFrame('daily')
    },
    {
      title: 'Wöchentlicher ROI',
      value: formatCurrency(portfolioData.weeklyROI || 0),
      icon: Calendar,
      active: timeFrame === 'weekly',
      onClick: () => setTimeFrame('weekly')
    },
    {
      title: 'Monatlicher ROI',
      value: formatCurrency(portfolioData.monthlyROI || 0),
      icon: TrendingUp,
      active: timeFrame === 'monthly',
      onClick: () => setTimeFrame('monthly')
    }
  ];

  const filteredTransactions = getFilteredROITransactions();
  const roiByToken = getROIByToken();

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold pulse-title">ROI Tracker</h1>
            <p className="pulse-text-secondary">
              Echte PulseChain ROI-Daten • Letzte Aktualisierung: {lastUpdate?.toLocaleTimeString('de-DE')}
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
            <Button onClick={loadROIData} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Aktualisieren
            </Button>
          </div>
        </div>

        {/* ROI PRICE VALIDATION WARNING */}
        {portfolioData.roiTransactions?.filter(tx => tx.value === 0 && tx.amount > 0.001).length > 0 && (
          <div className="pulse-card p-4 mb-6 border-l-4 border-yellow-500">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 text-yellow-400" />
              <span className="pulse-text font-medium">
                ⚠ {portfolioData.roiTransactions.filter(tx => tx.value === 0 && tx.amount > 0.001).length} ROI-Transaktionen ohne verlässliche Preise
              </span>
            </div>
            <p className="pulse-text-secondary text-sm mt-1">
              Diese ROI-Transaktionen zeigen $0.00 bis verlässliche Preise verfügbar sind.
            </p>
          </div>
        )}

        {/* ROI Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {roiStats.map((stat, index) => (
            <div 
              key={index} 
              className={`pulse-card p-6 cursor-pointer transition-all ${stat.active ? 'ring-2 ring-green-400 bg-green-400/10' : 'hover:bg-white/5'}`}
              onClick={stat.onClick}
            >
              <div className="flex items-center">
                <div className={`${stat.active ? 'bg-green-500' : 'bg-gray-600'} p-3 rounded-lg`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium pulse-text-secondary">{stat.title}</p>
                  <p className="text-2xl font-bold pulse-text">{stat.value}</p>
                  {stat.active && (
                    <p className="text-sm text-green-400">
                      {formatPercentage(getROIPercentage())} des Portfolios
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Debug Information */}
        {showDebug && portfolioData.debug && (
          <div className="pulse-card p-6 mb-6">
            <h3 className="flex items-center text-lg font-bold pulse-title mb-4">
              <AlertCircle className="h-5 w-5 mr-2 text-blue-400" />
              ROI Debug Information
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium pulse-text-secondary">ROI Transaktionen:</span>
                <p className="pulse-text">{portfolioData.roiTransactions?.length || 0}</p>
              </div>
              <div>
                <span className="font-medium pulse-text-secondary">Gefiltert ({timeFrame}):</span>
                <p className="pulse-text">{filteredTransactions.length}</p>
              </div>
              <div>
                <span className="font-medium pulse-text-secondary">Einzigartige Token:</span>
                <p className="pulse-text">{roiByToken.length}</p>
              </div>
              <div>
                <span className="font-medium pulse-text-secondary">ROI Percentage:</span>
                <p className="pulse-text">{formatPercentage(getROIPercentage())}</p>
              </div>
            </div>
          </div>
        )}

        {/* Current ROI Summary */}
        <div className="pulse-card p-6 mb-6">
          <h3 className="flex items-center text-lg font-bold pulse-title mb-4">
            <DollarSign className="h-5 w-5 mr-2 text-green-400" />
            {timeFrame === 'daily' ? 'Täglicher' : timeFrame === 'weekly' ? 'Wöchentlicher' : 'Monatlicher'} ROI Überblick
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-400">{formatCurrency(getCurrentROI())}</p>
              <p className="text-sm pulse-text-secondary">Gesamt ROI</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-400">{formatPercentage(getROIPercentage())}</p>
              <p className="text-sm pulse-text-secondary">ROI %</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-400">{filteredTransactions.length}</p>
              <p className="text-sm pulse-text-secondary">Transaktionen</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-orange-400">{roiByToken.length}</p>
              <p className="text-sm pulse-text-secondary">Token</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* ROI by Token */}
          <div className="pulse-card p-6">
            <h3 className="text-lg font-bold pulse-title mb-4">ROI nach Token ({timeFrame})</h3>
            {roiByToken.length > 0 ? (
              <div className="space-y-3">
                {roiByToken.map((token, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Badge variant="outline" className="text-xs border-green-400 text-green-400">
                        #{index + 1}
                      </Badge>
                      <div>
                        <div className="font-medium pulse-text">{token.symbol}</div>
                        <div className="text-sm pulse-text-secondary">
                          {token.transactionCount} Transaktionen
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-400">
                        {formatCurrency(token.totalValue)}
                      </div>
                      <div className="text-sm pulse-text-secondary">
                        {formatNumber(token.totalAmount, 4)} {token.symbol}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 pulse-text-secondary">
                <Coins className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Keine ROI-Transaktionen im ausgewählten Zeitraum</p>
              </div>
            )}
          </div>

          {/* Recent ROI Transactions */}
          <div className="pulse-card p-6">
            <h3 className="text-lg font-bold pulse-title mb-4">Letzte ROI-Transaktionen ({timeFrame})</h3>
            {filteredTransactions.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredTransactions.slice(0, 20).map((tx, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border border-white/10 rounded-lg bg-slate-800/30">
                    <div className="flex items-center space-x-3">
                      <div>
                        <div className="font-medium pulse-text">{tx.tokenSymbol}</div>
                        <div className="text-sm pulse-text-secondary">
                          {new Date(tx.timestamp).toLocaleDateString('de-DE')} {new Date(tx.timestamp).toLocaleTimeString('de-DE')}
                        </div>
                        <div className="text-xs pulse-text-secondary opacity-75">
                          {tx.roiReason}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-400">
                        {formatCurrency(tx.value)}
                      </div>
                      <div className="text-sm pulse-text-secondary">
                        {formatNumber(tx.amount, 4)} {tx.tokenSymbol}
                      </div>
                      <div className="flex items-center space-x-1 mt-1">
                        <a
                          href={tx.explorerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                        {tx.tokenExplorerUrl && (
                          <a
                            href={tx.tokenExplorerUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-400 hover:text-green-300"
                          >
                            <TrendingUp className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 pulse-text-secondary">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Keine ROI-Transaktionen im ausgewählten Zeitraum</p>
                <p className="text-sm mt-2">Versuchen Sie einen größeren Zeitrahmen oder fügen Sie Wallet-Adressen hinzu.</p>
              </div>
            )}
          </div>

        </div>

        {/* Total ROI Performance */}
        {portfolioData.totalValue > 0 && getCurrentROI() > 0 && (
          <div className="pulse-card p-6 mt-6">
            <h3 className="text-lg font-bold pulse-title mb-4">ROI Performance</h3>
            <div className="bg-green-500/10 border border-green-400/20 p-6 rounded-lg">
              <div className="text-center">
                <h4 className="text-xl font-semibold mb-2 pulse-title">Portfolio ROI Analyse</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm pulse-text-secondary">Portfolio Wert</p>
                    <p className="text-2xl font-bold pulse-text">{formatCurrency(portfolioData.totalValue)}</p>
                  </div>
                  <div>
                    <p className="text-sm pulse-text-secondary">{timeFrame === 'daily' ? 'Täglicher' : timeFrame === 'weekly' ? 'Wöchentlicher' : 'Monatlicher'} ROI</p>
                    <p className="text-2xl font-bold text-green-400">{formatCurrency(getCurrentROI())}</p>
                  </div>
                  <div>
                    <p className="text-sm pulse-text-secondary">ROI Rendite</p>
                    <p className="text-2xl font-bold text-blue-400">{formatPercentage(getROIPercentage())}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ROITrackerView; 