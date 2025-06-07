import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAppContext } from '@/contexts/AppContext';
import { Wallet } from 'lucide-react';
import { logger } from '@/lib/logger';

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

  const premiumUntilDate = user?.premium_until 
    ? new Date(user.premium_until).toLocaleDateString(language, { year: 'numeric', month: 'long', day: 'numeric' })
    : safeT('home.premiumNotActive', 'Not active');

  return (
    <div className="min-h-screen pulse-text">
      {/* 🎯 PulseChain Welcome Header */}
      <div className="pulse-card p-8 mb-8 pulse-border-gradient">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <h1 className="pulse-title mb-2">
              Welcome back, <span className="text-green-400">{user?.email?.split('@')[0] || 'PulseChainer'}</span>
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

      {/* 🚀 Quick Actions - Clean & Minimal */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <button
          onClick={() => navigate('/wallet')}
          className="pulse-card pulse-card-glow p-6 text-center group cursor-pointer"
        >
          <Wallet className="h-8 w-8 text-green-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
          <h3 className="font-semibold pulse-text mb-1">Wallet</h3>
          <p className="text-xs pulse-text-secondary">Connect & Monitor</p>
        </button>

        <button
          onClick={() => navigate('/roi-tracker')}
          className="pulse-card pulse-card-glow p-6 text-center group cursor-pointer"
        >
          <svg className="h-8 w-8 text-blue-400 mx-auto mb-3 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          <h3 className="font-semibold pulse-text mb-1">ROI Tracker</h3>
          <p className="text-xs pulse-text-secondary">Track Performance</p>
        </button>

        <button
          onClick={() => navigate('/tax-report')}
          className="pulse-card pulse-card-glow p-6 text-center group cursor-pointer"
        >
          <svg className="h-8 w-8 text-purple-400 mx-auto mb-3 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="font-semibold pulse-text mb-1">Tax Report</h3>
          <p className="text-xs pulse-text-secondary">Export Reports</p>
        </button>

        <button
          onClick={() => navigate('/settings')}
          className="pulse-card pulse-card-glow p-6 text-center group cursor-pointer"
        >
          <svg className="h-8 w-8 text-gray-400 mx-auto mb-3 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <h3 className="font-semibold pulse-text mb-1">Settings</h3>
          <p className="text-xs pulse-text-secondary">Preferences</p>
        </button>
      </div>

      {/* 📊 Simple Stats */}
      <div className="mt-12 pulse-card p-6">
        <h2 className="pulse-text-gradient text-xl font-bold mb-4">PulseChain Community Dashboard</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">$0.00</div>
            <div className="text-sm pulse-text-secondary">Portfolio Value</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">0</div>
            <div className="text-sm pulse-text-secondary">Connected Wallets</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">0</div>
            <div className="text-sm pulse-text-secondary">Tax Entries</div>
          </div>
        </div>
      </div>

    </div>
  );
  };
  
  export { Home };
export default Home;