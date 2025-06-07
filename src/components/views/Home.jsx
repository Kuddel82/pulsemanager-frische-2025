import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAppContext } from '@/contexts/AppContext';
import { TrendingUp, Activity, Users, ExternalLink } from 'lucide-react';
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

      {/* 📊 Portfolio Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="pulse-card p-6 text-center">
          <div className="text-3xl font-bold text-green-400 mb-2">$0.00</div>
          <div className="text-sm pulse-text-secondary mb-1">Portfolio Value</div>
          <div className="text-xs text-green-400">+0.00% (24h)</div>
        </div>
        <div className="pulse-card p-6 text-center">
          <div className="text-3xl font-bold text-blue-400 mb-2">0</div>
          <div className="text-sm pulse-text-secondary mb-1">Connected Wallets</div>
          <div className="text-xs pulse-text-secondary">Ready to connect</div>
        </div>
        <div className="pulse-card p-6 text-center">
          <div className="text-3xl font-bold text-purple-400 mb-2">0</div>
          <div className="text-sm pulse-text-secondary mb-1">Tax Entries</div>
          <div className="text-xs pulse-text-secondary">Export ready</div>
        </div>
      </div>

      {/* 📈 Recent Activity */}
      <div className="pulse-card p-6 mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Activity className="h-6 w-6 text-green-400" />
          <h2 className="text-xl font-bold pulse-text">Recent Activity</h2>
        </div>
        <div className="text-center py-8">
          <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="pulse-text-secondary">No recent activity</p>
          <p className="text-sm pulse-text-secondary mt-2">Connect your wallet to start tracking</p>
        </div>
      </div>

      {/* 🌐 PulseChain Community */}
      <div className="pulse-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <Users className="h-6 w-6 text-green-400" />
          <h2 className="text-xl font-bold pulse-text">PulseChain Community</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a 
            href="https://pulsechain.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="p-4 hover:bg-white/5 rounded-lg transition-colors group flex items-center justify-between"
          >
            <div>
              <div className="font-medium pulse-text group-hover:text-green-400">🔗 PulseChain.com</div>
              <div className="text-sm pulse-text-secondary">Official PulseChain website</div>
            </div>
            <ExternalLink className="h-4 w-4 pulse-text-secondary group-hover:text-green-400" />
          </a>
          
          <a 
            href="https://scan.pulsechain.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="p-4 hover:bg-white/5 rounded-lg transition-colors group flex items-center justify-between"
          >
            <div>
              <div className="font-medium pulse-text group-hover:text-green-400">🔍 PulseScan</div>
              <div className="text-sm pulse-text-secondary">Blockchain explorer</div>
            </div>
            <ExternalLink className="h-4 w-4 pulse-text-secondary group-hover:text-green-400" />
          </a>
          
          <a 
            href="https://app.pulsex.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="p-4 hover:bg-white/5 rounded-lg transition-colors group flex items-center justify-between"
          >
            <div>
              <div className="font-medium pulse-text group-hover:text-green-400">💱 PulseX DEX</div>
              <div className="text-sm pulse-text-secondary">Decentralized exchange</div>
            </div>
            <ExternalLink className="h-4 w-4 pulse-text-secondary group-hover:text-green-400" />
          </a>
          
          <a 
            href="https://www.pulsewatch.app" 
            target="_blank" 
            rel="noopener noreferrer"
            className="p-4 hover:bg-white/5 rounded-lg transition-colors group flex items-center justify-between"
          >
            <div>
              <div className="font-medium pulse-text group-hover:text-green-400">📊 PulseWatch</div>
              <div className="text-sm pulse-text-secondary">Portfolio tracker</div>
            </div>
            <ExternalLink className="h-4 w-4 pulse-text-secondary group-hover:text-green-400" />
          </a>
        </div>
      </div>
    </div>
  );
};
  
export { Home };
export default Home;