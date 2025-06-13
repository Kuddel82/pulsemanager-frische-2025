import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAppContext } from '@/contexts/AppContext';
import { Crown } from 'lucide-react';
import { logger } from '@/lib/logger';
import WalletReader from '@/components/WalletReader';
import WalletManualInput from '@/components/WalletManualInput';

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



      {/* 📋 DASHBOARD OBJEKTE (READ-ONLY VIEW + LINK) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        
        {/* PulseX */}
        <div className="pulse-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-8 w-8 bg-gradient-to-r from-purple-400 to-pink-400 rounded flex items-center justify-center text-white font-bold text-sm">
              PX
            </div>
            <h2 className="text-xl font-bold pulse-text">PulseX</h2>
          </div>
          
          <p className="pulse-text-secondary mb-4">
            Hier kannst du Token kaufen & tauschen
          </p>
          
          <a 
            href="https://app.pulsex.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
          >
            🚀 PulseX öffnen
          </a>
        </div>

        {/* Bridge */}
        <div className="pulse-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-8 w-8 bg-gradient-to-r from-cyan-400 to-blue-400 rounded flex items-center justify-center text-white font-bold text-sm">
              BR
            </div>
            <h2 className="text-xl font-bold pulse-text">PulseChain Bridge</h2>
          </div>
          
          <p className="pulse-text-secondary mb-4">
            Hier kannst du Tokens z.B. von Ethereum zur PulseChain senden
          </p>
          
          <a 
            href="https://bridge.pulsechain.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors"
          >
            🌉 Bridge öffnen
          </a>
        </div>
        
      </div>


    </div>
  );
};
  
export { Home };
export default Home;