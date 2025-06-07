import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAppContext } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { 
  Home, 
  Wallet, 
  TrendingUp, 
  FileText, 
  LogOut,
  Crown,
  Settings
} from 'lucide-react';

const PulseLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { subscriptionStatus } = useAppContext();
  
  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Home,
      path: '/',
      description: 'Overview & Stats'
    },
    {
      id: 'wallet',
      label: 'Wallet',
      icon: Wallet,
      path: '/wallet',
      description: 'Connect & Monitor'
    },
    {
      id: 'roi',
      label: 'ROI Tracker',
      icon: TrendingUp,
      path: '/pulsechain-roi',
      description: 'Track Performance'
    },
    {
      id: 'tax',
      label: 'Tax Report',
      icon: FileText,
      path: '/tax-report',
      description: 'Export Reports'
    }
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/auth');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const isPremium = subscriptionStatus === 'active';

  return (
    <div className="min-h-screen pulse-bg flex">
      {/* 🏢 PulseChain Sidebar */}
      <aside className="w-72 pulse-nav flex flex-col shadow-2xl">
        {/* 🎯 Brand Header */}
        <div className="flex items-center gap-3 px-6 py-8 border-b border-white/10">
          <div className="h-12 w-12 pulse-border-gradient flex items-center justify-center">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center">
              <span className="text-lg font-bold text-black">PM</span>
            </div>
          </div>
          <div>
            <h1 className="text-xl font-bold pulse-text-gradient">PulseManager</h1>
            <p className="text-xs pulse-text-secondary uppercase tracking-wider">
              Community Edition
            </p>
          </div>
        </div>

        {/* 🚀 Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={`
                  w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 group
                  ${active 
                    ? 'pulse-card-glow bg-green-500/10 border-l-4 border-green-400 text-green-400' 
                    : 'hover:bg-white/5 pulse-text-secondary hover:text-green-400'
                  }
                `}
              >
                <Icon className={`h-5 w-5 ${active ? 'text-green-400' : 'group-hover:text-green-400'}`} />
                <div className="flex-1 text-left">
                  <div className={`font-semibold ${active ? 'text-green-400' : 'pulse-text'}`}>
                    {item.label}
                  </div>
                  <div className="text-xs pulse-text-secondary">
                    {item.description}
                  </div>
                </div>
                {active && (
                  <div className="w-2 h-2 bg-green-400 rounded-full pulse-glow-animation"></div>
                )}
              </button>
            );
          })}
        </nav>

        {/* 👤 User Section */}
        <div className="px-4 py-6 border-t border-white/10 space-y-4">
          {/* Premium Status */}
          <div className="pulse-card p-4 rounded-xl">
            <div className="flex items-center gap-3 mb-2">
              <Crown className={`h-5 w-5 ${isPremium ? 'text-yellow-400' : 'text-gray-500'}`} />
              <span className="font-semibold pulse-text">
                {isPremium ? 'Premium Active' : 'Basic Plan'}
              </span>
            </div>
            <p className="text-xs pulse-text-secondary">
              {isPremium 
                ? 'Full access to all features' 
                : 'Upgrade for unlimited access'
              }
            </p>
            {!isPremium && (
              <Button 
                onClick={() => navigate('/subscription')}
                className="w-full mt-3 pulse-btn text-xs"
              >
                Upgrade Now
              </Button>
            )}
          </div>

          {/* User Info */}
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/5">
            <div className="h-8 w-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
              <span className="text-sm font-bold text-black">
                {user?.email?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium pulse-text truncate">
                {user?.email || 'Anonymous'}
              </p>
              <div className="pulse-community-badge">
                PulseChainer
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/settings')}
              className="flex-1 text-xs pulse-text-secondary hover:text-green-400"
            >
              <Settings className="h-4 w-4 mr-1" />
              Settings
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="flex-1 text-xs text-red-400 hover:text-red-300"
            >
              <LogOut className="h-4 w-4 mr-1" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* 📱 Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default PulseLayout; 