// 🚀 ROI TRACKER V2 - MORALIS DEFI INTEGRATION 
// Echte DeFi ROI-Daten von Moralis Enterprise APIs

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
  EyeOff,
  Activity,
  Target,
  Zap,
  PieChart,
  BarChart3
} from 'lucide-react';
import { formatCurrency, formatNumber, formatPercentage } from '@/lib/utils';
import CentralDataService from '@/services/CentralDataService';
import { MoralisV2Service } from '@/services/MoralisV2Service';
import { ROIDetectionService } from '@/services/ROIDetectionService';
import { useAuth } from '@/contexts/AuthContext';

const ROITrackerV2View = () => {
  const { user } = useAuth();
  const [portfolioData, setPortfolioData] = useState(null);
  const [defiData, setDefiData] = useState(null);
  const [roiDetectionData, setROIDetectionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [timeFrame, setTimeFrame] = useState('monthly');
  const [showDebug, setShowDebug] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // overview, defi, positions, detection

  // 🚀 LADE ALLE ROI-RELEVANTEN DATEN
  const loadAllROIData = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 ROI TRACKER V2: Loading comprehensive ROI data...');
      
      // 1. Standard Portfolio-Daten (lokale ROI-Transaktionen)
      const portfolioResponse = await CentralDataService.loadCompletePortfolio(user.id);
      
      // 2. Lade erste Wallet-Adresse für Moralis DeFi-Daten
      const wallets = portfolioResponse.wallets || [];
      const primaryWallet = wallets.find(w => w.chain === 'ethereum') || wallets[0];
      
      let defiResponse = null;
      let roiDetectionResponse = null;
      
      if (primaryWallet?.address) {
        console.log(`🚀 Loading DeFi data for wallet: ${primaryWallet.address}`);
        
        // 3. Parallel: DeFi Summary und ROI Detection  
        const [defiSummary, defiPositions, roiDetection] = await Promise.all([
          MoralisV2Service.getDefiSummary(primaryWallet.address, '1'),
          MoralisV2Service.getDefiPositions(primaryWallet.address, '1'),
          ROIDetectionService.detectROISources(primaryWallet.address, '1')
        ]);
        
        defiResponse = {
          summary: defiSummary,
          positions: defiPositions,
          wallet: primaryWallet.address
        };
        
        roiDetectionResponse = roiDetection;
      }
      
      setPortfolioData(portfolioResponse);
      setDefiData(defiResponse);
      setROIDetectionData(roiDetectionResponse);
      setLastUpdate(new Date());
      
      console.log('✅ ROI TRACKER V2: All data loaded', {
        portfolioROI: portfolioResponse.monthlyROI || 0,
        defiPositions: defiResponse?.positions?.positions?.length || 0,
        roiSources: roiDetectionResponse?.sources?.length || 0
      });
      
    } catch (err) {
      console.error('💥 ROI TRACKER V2 ERROR:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadAllROIData();
  }, [user?.id]);

  // Auto-refresh every 10 minutes
  useEffect(() => {
    const interval = setInterval(loadAllROIData, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user?.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="pulse-card p-8 text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-green-400 mx-auto mb-4" />
          <div className="space-y-2">
            <span className="text-lg pulse-text">🚀 Moralis DeFi-Daten werden geladen...</span>
            <p className="text-sm pulse-text-secondary">Portfolio • DeFi Positionen • ROI Detection</p>
          </div>
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
          <Button onClick={loadAllROIData} className="bg-green-500 hover:bg-green-600">
            <RefreshCw className="h-4 w-4 mr-2" />
            Erneut versuchen
          </Button>
        </div>
      </div>
    );
  }

  // BERECHNE KOMBINIERTE ROI-STATISTIKEN
  const getCombinedROIStats = () => {
    const portfolioROI = {
      daily: portfolioData?.dailyROI || 0,
      weekly: portfolioData?.weeklyROI || 0,
      monthly: portfolioData?.monthlyROI || 0
    };
    
    const defiROI = {
      daily: defiData?.positions?.roiAnalysis?.totalDailyROI || 0,
      weekly: (defiData?.positions?.roiAnalysis?.totalDailyROI || 0) * 7,
      monthly: defiData?.positions?.roiAnalysis?.estimatedMonthlyROI || 0
    };
    
    const totalROI = {
      daily: portfolioROI.daily + defiROI.daily,
      weekly: portfolioROI.weekly + defiROI.weekly,
      monthly: portfolioROI.monthly + defiROI.monthly
    };
    
    return { portfolioROI, defiROI, totalROI };
  };

  const roiStats = getCombinedROIStats();
  
  const getCurrentROI = () => {
    return roiStats.totalROI[timeFrame] || 0;
  };

  const getROIPercentage = () => {
    const totalValue = portfolioData?.totalValue || 0;
    const currentROI = getCurrentROI();
    return totalValue > 0 ? (currentROI / totalValue) * 100 : 0;
  };

  const tabs = [
    { id: 'overview', label: 'Überblick', icon: PieChart },
    { id: 'defi', label: 'DeFi Positionen', icon: Target },
    { id: 'positions', label: 'ROI Quellen', icon: Zap },
    { id: 'detection', label: 'ROI Detection', icon: Activity }
  ];

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="pulse-card p-8 text-center">
        <h1 className="text-2xl font-bold pulse-title mb-4">ROI Tracker V2</h1>
        <p className="pulse-text-secondary">Moralis DeFi Integration coming soon...</p>
      </div>
    </div>
  );
};

export default ROITrackerV2View; 