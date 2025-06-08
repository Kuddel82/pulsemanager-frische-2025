import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  TrendingUp, 
  TrendingDown, 
  RefreshCw, 
  ExternalLink, 
  DollarSign,
  Calendar,
  Coins,
  BarChart3,
  AlertCircle
} from 'lucide-react';
import { dbService } from '@/lib/dbService';
import { supabase } from '@/lib/supabaseClient';
import WalletBalanceService from '@/lib/walletBalanceService';
import WalletParser from '@/services/walletParser';
import { PulseWatchService } from '@/services/pulseWatchService';
import { TokenPriceService } from '@/services/tokenPriceService';
import { TransactionHistoryService } from '@/services/TransactionHistoryService';
import { TaxExportService } from '@/services/TaxExportService';
import CentralDataService from '@/services/CentralDataService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const ROITrackerView = () => {
  const { user } = useAuth();
  const [portfolioData, setPortfolioData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');

  // Portfolio laden
  const loadPortfolioData = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    setError(null);
    setStatusMessage('📊 Lade Portfolio-Daten...');
    
    try {
      console.log('🔄 ROI TRACKER: Loading portfolio with CentralDataService');
      
      const data = await CentralDataService.loadCompletePortfolio(user.id);
      
      if (data.isLoaded) {
        setPortfolioData(data);
        setStatusMessage(`✅ Portfolio geladen: ${data.tokenCount} Tokens, $${data.totalValue.toFixed(2)}, ROI: $${data.totalROI.toFixed(2)}`);
        console.log('✅ ROI TRACKER: Portfolio loaded successfully');
      } else {
        setError(data.error);
        setStatusMessage(`❌ Fehler: ${data.error}`);
      }
      
    } catch (error) {
      console.error('💥 ROI TRACKER: Error loading portfolio:', error);
      setError(error.message);
      setStatusMessage(`💥 Fehler beim Laden: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Initiales Laden
  useEffect(() => {
    loadPortfolioData();
    
    // Auto-refresh alle 5 Minuten
    const interval = setInterval(loadPortfolioData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user?.id]);

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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Fallback für leere Daten
  if (!user?.id) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Anmeldung erforderlich</h3>
            <p className="text-gray-600">Bitte melden Sie sich an, um Ihr ROI-Portfolio zu verwalten.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header mit Status */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">ROI Tracker</h1>
          <p className="text-gray-600">Echte ROI-Daten von PulseChain API</p>
        </div>
        
        <Button 
          onClick={loadPortfolioData}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Lade...' : 'Aktualisieren'}
        </Button>
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
              <p className="font-medium">Fehler beim Laden der Daten</p>
            </div>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Portfolio Overview Cards */}
      {portfolioData && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Portfolio Value */}
            <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">Portfolio Wert</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(portfolioData.totalValue)}
                    </p>
                    <p className="text-blue-200 text-sm">
                      {portfolioData.tokenCount} Tokens
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-blue-200" />
                </div>
              </CardContent>
            </Card>

            {/* Daily ROI */}
            <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium">Täglich ROI</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(portfolioData.dailyROI)}
                    </p>
                    <p className="text-green-200 text-sm">
                      Letzte 24h
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-200" />
                </div>
              </CardContent>
            </Card>

            {/* Weekly ROI */}
            <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium">Wöchentlich ROI</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(portfolioData.weeklyROI)}
                    </p>
                    <p className="text-purple-200 text-sm">
                      Letzte 7 Tage
                    </p>
                  </div>
                  <Calendar className="h-8 w-8 text-purple-200" />
                </div>
              </CardContent>
            </Card>

            {/* Monthly ROI */}
            <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm font-medium">Monatlich ROI</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(portfolioData.monthlyROI)}
                    </p>
                    <p className="text-orange-200 text-sm">
                      Letzte 30 Tage
                    </p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-orange-200" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent ROI Transactions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                Aktuelle ROI-Transaktionen
                <Badge variant="outline" className="ml-2">
                  {portfolioData.roiTransactions.length} Transaktionen
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {portfolioData.roiTransactions.length > 0 ? (
                <div className="space-y-2">
                  {portfolioData.roiTransactions.slice(0, 10).map((tx, index) => (
                    <div key={`${tx.txHash}-${index}`} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center space-x-4">
                        <div className="text-sm font-mono text-gray-500">
                          #{index + 1}
                        </div>
                        
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold">{tx.tokenSymbol}</span>
                            <Badge variant={tx.roiType === 'daily_roi' ? 'default' : 'secondary'} className="text-xs">
                              {tx.roiType === 'daily_roi' ? 'Daily' : 'Weekly'}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600">
                            {tx.tokenName || 'Unknown Token'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatDate(tx.timestamp)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="font-semibold text-green-600">
                          +{formatCurrency(tx.value)}
                        </div>
                        <div className="text-sm text-gray-600">
                          {formatCrypto(tx.amount, tx.tokenSymbol)}
                        </div>
                        <div className="flex items-center space-x-1 mt-1">
                          <a 
                            href={tx.explorerUrl}
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:text-blue-700"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                          {tx.dexScreenerUrl && (
                            <a 
                              href={tx.dexScreenerUrl}
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-green-500 hover:text-green-700"
                            >
                              <BarChart3 className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <TrendingUp className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">Keine ROI-Transaktionen gefunden</h3>
                  <p className="text-gray-500">
                    ROI-Transaktionen werden automatisch aus der PulseChain API geladen.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Token Holdings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-blue-500" />
                Top Token Holdings
                <Badge variant="outline" className="ml-2">
                  {portfolioData.tokens.length} Tokens
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {portfolioData.tokens.length > 0 ? (
                <div className="space-y-2">
                  {portfolioData.tokens.slice(0, 10).map((token, index) => (
                    <div key={`${token.symbol}-${token.contractAddress}-${index}`} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="text-sm font-mono text-gray-500 w-8">
                          #{token.holdingRank}
                        </div>
                        
                        <div>
                          <div className="font-semibold">{token.symbol}</div>
                          <div className="text-sm text-gray-600">
                            {token.name || 'Unknown Token'}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="font-semibold">
                          {formatCurrency(token.value)}
                        </div>
                        <div className="text-sm text-gray-600">
                          {formatCrypto(token.balance, token.symbol)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {token.percentageOfPortfolio.toFixed(1)}% von Portfolio
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Coins className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">Keine Tokens gefunden</h3>
                  <p className="text-gray-500">
                    Fügen Sie Wallets hinzu, um Token-Holdings zu sehen.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Empty State - Kein Portfolio geladen */}
      {!portfolioData && !loading && !error && (
        <Card>
          <CardContent className="p-12 text-center">
            <BarChart3 className="h-16 w-16 mx-auto text-gray-300 mb-6" />
            <h3 className="text-xl font-semibold text-gray-600 mb-4">ROI Tracker bereit</h3>
            <p className="text-gray-500 mb-6">
              Klicken Sie auf "Aktualisieren", um Ihre ROI-Daten zu laden.
            </p>
            <Button onClick={loadPortfolioData}>
              Portfolio laden
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ROITrackerView;