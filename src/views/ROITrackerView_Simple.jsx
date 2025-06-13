// 🚀 ROI TRACKER VIEW - SIMPLIFIED PRO PLAN VERSION
// Transaction-based ROI detection with DirectMoralisService

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { 
  RefreshCw, 
  TrendingUp, 
  Calendar,
  Coins,
  AlertCircle,
  DollarSign,
  Activity,
  BarChart3
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { DirectMoralisService } from '../services/DirectMoralisService';
import { supabase } from '../lib/supabaseClient';

const ROITrackerView = () => {
  const { user } = useAuth();
  
  // 🔥 DIREKTE PREMIUM-ERKENNUNG
  const isPremium = user?.email === 'dkuddel@web.de' || user?.email === 'phi_bel@yahoo.de';
  const canAccessROI = () => isPremium;
  const getAccessMessage = () => {
    if (isPremium) {
      return '🎯 Premium-Zugang: Alle Features verfügbar';
    }
    return '🔒 ROI Tracker nur für Premium-Mitglieder verfügbar';
  };
  
  const [roiData, setROIData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [timeFrame, setTimeFrame] = useState('30'); // 24h, 7d, 30d
  const [lastUpdate, setLastUpdate] = useState(null);

  // Load ROI Data
  const loadROIData = async () => {
    if (!user?.id || !canAccessROI()) {
      setError('ROI-Tracker nur für Premium-Mitglieder verfügbar');
      return;
    }
    
    // Get user wallets
    const { data: wallets } = await supabase
      .from('wallets')
      .select('address, chain_id')
      .eq('user_id', user.id)
      .eq('is_active', true);
    
    if (!wallets || wallets.length === 0) {
      setError('Keine Wallets gefunden für ROI-Analyse');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('🚀 ROI: Loading transfer history for', wallets.length, 'wallets');
      
      let allROITransfers = [];
      let totalCUs = 0;
      
      // Load transfer history for all wallets
      for (const wallet of wallets) {
        const chain = wallet.chain_id === 369 ? '0x171' : '0x1';
        
        const result = await DirectMoralisService.getTransferHistory(wallet.address, chain, 200);
        
        if (result.success) {
          // Add wallet info to transfers
          const transfersWithWallet = result.roiTransfers.map(transfer => ({
            ...transfer,
            walletAddress: wallet.address,
            chain: chain
          }));
          
          allROITransfers.push(...transfersWithWallet);
          totalCUs += result.cuUsed;
          
          console.log(`✅ Found ${result.roiTransfers.length} ROI transfers for ${wallet.address}`);
        } else {
          console.warn(`⚠️ Failed to load transfers for ${wallet.address}:`, result.error);
        }
      }
      
      // Calculate ROI by timeframe
      const roiStats = calculateROIStats(allROITransfers, timeFrame);
      
      setROIData({
        transfers: allROITransfers,
        stats: roiStats,
        walletCount: wallets.length,
        cuUsed: totalCUs,
        timeFrame: timeFrame,
        source: 'direct_moralis_pro_roi'
      });
      
      setLastUpdate(new Date());
      console.log('✅ ROI Data loaded:', roiStats);
      
    } catch (error) {
      console.error('💥 ROI loading error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Calculate ROI statistics
  const calculateROIStats = (transfers, days) => {
    const now = new Date();
    const cutoffDate = new Date(now.getTime() - (parseInt(days) * 24 * 60 * 60 * 1000));
    
    // Filter transfers by timeframe
    const recentTransfers = transfers.filter(transfer => {
      const transferDate = new Date(transfer.block_timestamp);
      return transferDate >= cutoffDate;
    });
    
    // Calculate values
    let totalROIValue = 0;
    let transferCount = recentTransfers.length;
    
    recentTransfers.forEach(transfer => {
      // Estimate value based on transfer amount
      const decimals = parseInt(transfer.decimals) || 18;
      const amount = parseFloat(transfer.value) / Math.pow(10, decimals);
      
      // Simple estimation: assume $0.001 per token if no price available
      // In reality, you'd fetch token prices
      totalROIValue += amount * 0.001;
    });
    
    return {
      totalValue: totalROIValue,
      transferCount: transferCount,
      avgPerTransfer: transferCount > 0 ? totalROIValue / transferCount : 0,
      dailyAvg: totalROIValue / parseInt(days),
      period: `${days} Tage`
    };
  };

  // Format functions
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'USD'
    }).format(value || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('de-DE');
  };

  // Access Control Check
  if (!canAccessROI()) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">ROI Tracker</h1>
        </div>
        
        <Card className="p-6 text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-yellow-400" />
          <h3 className="text-lg font-medium mb-2">Premium Feature</h3>
          <p className="text-gray-600 mb-4">{getAccessMessage()}</p>
          <p className="text-sm text-gray-500">
            Der ROI Tracker analysiert Ihre Token-Transfers und identifiziert potenzielle ROI-Quellen.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">ROI Tracker</h1>
          <p className="text-gray-600">Transaction-based ROI Analysis</p>
        </div>
        <div className="flex space-x-2">
          <Button 
            onClick={loadROIData}
            disabled={loading}
            className="flex items-center space-x-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Lädt...' : 'ROI laden'}</span>
          </Button>
        </div>
      </div>

      {/* Subscription Status */}
      <Card className="bg-green-500/10 border-green-400/20">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-green-400" />
            <span className="text-green-400 font-medium">{getAccessMessage()}</span>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="bg-red-500/10 border-red-400/20">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <span className="text-red-400">{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Time Frame Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Zeitraum auswählen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2">
            {['1', '7', '30'].map((days) => (
              <Button
                key={days}
                variant={timeFrame === days ? 'default' : 'outline'}
                onClick={() => setTimeFrame(days)}
                className="flex items-center space-x-1"
              >
                <Calendar className="h-4 w-4" />
                <span>{days === '1' ? '24h' : days === '7' ? '7 Tage' : '30 Tage'}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ROI Statistics */}
      {roiData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Gesamt ROI</p>
                  <p className="text-xl font-bold text-green-400">
                    {formatCurrency(roiData.stats.totalValue)}
                  </p>
                </div>
                <DollarSign className="h-6 w-6 text-green-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">ROI Transfers</p>
                  <p className="text-xl font-bold text-blue-400">
                    {roiData.stats.transferCount}
                  </p>
                </div>
                <Coins className="h-6 w-6 text-blue-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Ø pro Tag</p>
                  <p className="text-xl font-bold text-purple-400">
                    {formatCurrency(roiData.stats.dailyAvg)}
                  </p>
                </div>
                <TrendingUp className="h-6 w-6 text-purple-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">CU Verbrauch</p>
                  <p className="text-xl font-bold text-orange-400">
                    {roiData.cuUsed}
                  </p>
                </div>
                <BarChart3 className="h-6 w-6 text-orange-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ROI Transfers List */}
      {roiData && roiData.transfers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>ROI Transfers ({roiData.stats.period})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {roiData.transfers.slice(0, 20).map((transfer, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 bg-green-500/20 rounded-full flex items-center justify-center">
                      <Coins className="h-4 w-4 text-green-400" />
                    </div>
                    <div>
                      <div className="font-medium">{transfer.token_symbol || 'Unknown'}</div>
                      <div className="text-sm text-gray-600">
                        {formatDate(transfer.block_timestamp)}
                      </div>
                      <div className="text-xs text-gray-500">
                        Von: {transfer.from_address?.slice(0, 8)}...
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-400">
                      {((parseFloat(transfer.value) / Math.pow(10, transfer.decimals || 18)) * 0.001).toFixed(4)} USD
                    </div>
                    <div className="text-sm text-gray-600">
                      {(parseFloat(transfer.value) / Math.pow(10, transfer.decimals || 18)).toFixed(4)} {transfer.token_symbol}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Last Update Info */}
      {lastUpdate && (
        <div className="text-center text-sm text-gray-500">
          Letzte Aktualisierung: {lastUpdate.toLocaleString('de-DE')}
        </div>
      )}
    </div>
  );
};

export default ROITrackerView; 