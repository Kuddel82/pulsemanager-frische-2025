import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAppContext } from '@/contexts/AppContext';
import { TrendingUp, Activity, FileText, Crown } from 'lucide-react';
import { logger } from '@/lib/logger';
import WalletReader from '@/components/WalletReader';
import WalletManualInput from '@/components/WalletManualInput';
import ROICalculator from '@/components/ROICalculator';

const Home = () => {
  const navigate = useNavigate();
  const { user, signOut, loading: authLoading } = useAuth();
  const { t, language, subscriptionStatus } = useAppContext();

  const safeT = (key, fallback) => {
    if (typeof t === 'function') {
      return t(key) || fallback;
    }
    return fallback;
  };
  
  const handleLogout = async () => {
    logger.info('Home: Attempting logout.');
    try {
      await signOut();
      logger.info('Home: Logout successful, navigating to /auth.');
      navigate('/auth');
    } catch (error) {
      logger.error('Home: Error during logout:', error);
      
    }
  };



  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white p-4">
        <div className="animate-pulse text-center">
          <Crown className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
          <p className="text-2xl font-semibold">
            {safeT('common.loadingApp', 'Loading Application...')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pulse-text">
      {/* 🎯 PulseChain Welcome Header */}
      <div className="pulse-card p-8 mb-8" style={{outline: 'none', boxShadow: 'none', border: '1px solid rgba(255, 255, 255, 0.1)'}}>
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <h1 className="pulse-title mb-2">
              Welcome back, {user?.email?.split('@')[0] || 'PulseChainer'}
            </h1>
            <p className="pulse-subtitle">
              Ready to track your PulseChain portfolio? 🚀
            </p>
            <div className="pulse-community-badge mt-4">
              🔥 Community Member
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm pulse-text-secondary">Status</div>
              <div className={`font-semibold ${subscriptionStatus === 'active' ? 'text-green-400' : 'text-yellow-400'}`}>
                {subscriptionStatus === 'active' ? '✅ Premium' : '⚡ Basic'}
              </div>
            </div>
          </div>
        </div>
      </div>



      {/* 🔌 WalletReader - DOM-sichere Wallet-Verbindung */}
      <div className="mb-8">
        <WalletReader />
      </div>

      {/* 📝 Manual Wallet Input - Tangem/Mobile Support */}
      <div className="mb-8">
        <WalletManualInput />
      </div>

      {/* 💰 ROI Calculator & Portfolio Tracking */}
      <div className="mb-8">
        <ROICalculator />
      </div>

      {/* 📈 Quick Navigation Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Tax Report Navigation */}
        <button
          onClick={() => navigate('/tax-report')}
          className="pulse-card p-6 hover:bg-white/5 transition-colors text-left"
        >
          <div className="flex items-center gap-3 mb-3">
            <FileText className="h-8 w-8 text-red-400" />
            <div>
              <div className="text-lg font-bold pulse-text">Tax Report</div>
              <div className="text-sm pulse-text-secondary">Steuer-Export für Deutschland</div>
            </div>
          </div>
          <div className="text-xs pulse-text-secondary">→ Klicken zum Öffnen</div>
        </button>

        {/* ROI Tracker Navigation */}
        <button
          onClick={() => navigate('/roi-tracker')}
          className="pulse-card p-6 hover:bg-white/5 transition-colors text-left"
        >
          <div className="flex items-center gap-3 mb-3">
            <TrendingUp className="h-8 w-8 text-green-400" />
            <div>
              <div className="text-lg font-bold pulse-text">ROI Tracker</div>
              <div className="text-sm pulse-text-secondary">Performance Analyse</div>
            </div>
          </div>
          <div className="text-xs pulse-text-secondary">→ Klicken zum Öffnen</div>
        </button>

        {/* Portfolio Navigation */}
        <button
          onClick={() => navigate('/portfolio')}
          className="pulse-card p-6 hover:bg-white/5 transition-colors text-left"
        >
          <div className="flex items-center gap-3 mb-3">
            <Activity className="h-8 w-8 text-blue-400" />
            <div>
              <div className="text-lg font-bold pulse-text">Portfolio</div>
              <div className="text-sm pulse-text-secondary">Token Holdings anzeigen</div>
            </div>
          </div>
          <div className="text-xs pulse-text-secondary">→ Klicken zum Öffnen</div>
        </button>
      </div>


    </div>
  );
};
  
export { Home };
export default Home;