import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAppContext } from '@/contexts/AppContext';
import { 
  Home, 
  Wallet, 
  TrendingUp, 
  FileText, 
  LogOut,
  Crown,
  Settings,
  Menu,
  X
} from 'lucide-react';

const MainLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { subscriptionStatus } = useAppContext();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Home,
      path: '/',
      description: 'Overview & Stats'
    },
    {
      id: 'portfolio',
      label: 'Portfolio',
      icon: Wallet,
      path: '/portfolio',
      description: 'Holdings & Values'
    },
    {
      id: 'roi',
      label: 'ROI Tracker',
      icon: TrendingUp,
      path: '/roi-tracker',
      description: 'Track Performance'
    },
    {
      id: 'tax',
      label: '🔥 STEUERREPORT',
      icon: FileText,
      path: '/tax-report',
      description: 'Deutsches Steuerrecht & PDF'
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

  const handleNavigate = (path) => {
    navigate(path);
    setIsMobileMenuOpen(false); // Close mobile menu after navigation
  };

  const isPremium = subscriptionStatus === 'active';

  return (
    <div className="min-h-screen pulse-bg flex">
      {/* 📱 Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 pulse-nav border-b border-white/10 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 pulse-border-gradient flex items-center justify-center">
              <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center">
                <span className="text-xs font-bold text-black">PM</span>
              </div>
            </div>
            <div>
              <h1 className="text-lg font-bold pulse-text-gradient">PulseManager</h1>
            </div>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* 🏢 Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-72 pulse-nav flex-col shadow-2xl">
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

        <SidebarContent 
          navItems={navItems}
          isActive={isActive}
          handleNavigate={handleNavigate}
          user={user}
          isPremium={isPremium}
          navigate={navigate}
          handleLogout={handleLogout}
        />
      </aside>

      {/* 📱 Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsMobileMenuOpen(false)} />
          <aside className="absolute left-0 top-16 bottom-0 w-80 max-w-[85vw] pulse-nav flex flex-col shadow-2xl">
            <SidebarContent 
              navItems={navItems}
              isActive={isActive}
              handleNavigate={handleNavigate}
              user={user}
              isPremium={isPremium}
              navigate={navigate}
              handleLogout={handleLogout}
              isMobile={true}
            />
          </aside>
        </div>
      )}

      {/* 📱 Main Content */}
      <main className="flex-1 lg:ml-0 pt-16 lg:pt-0 overflow-auto">
        <div className="p-4 lg:p-8">
          <Suspense fallback={<FullPageLoader />}>
            <Outlet />
          </Suspense>
        </div>
      </main>
    </div>
  );
};

// Extracted Sidebar Content Component
const SidebarContent = ({ navItems, isActive, handleNavigate, user, isPremium, navigate, handleLogout, isMobile = false }) => (
  <>
    {/* 🚀 Navigation */}
    <nav className="flex-1 px-4 py-6 space-y-2">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.path);
        
        return (
          <button
            key={item.id}
            onClick={() => handleNavigate(item.path)}
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
          <span className="font-semibold pulse-text text-sm lg:text-base">
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
          <button 
            onClick={() => navigate('/subscription')}
            className="w-full mt-3 py-2 px-4 bg-gradient-to-r from-green-400 to-blue-500 text-black font-semibold rounded-lg hover:from-green-500 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-green-400/50 transition-all duration-200 text-xs"
          >
            Upgrade Now
          </button>
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
        <button
          onClick={() => navigate('/settings')}
          className="flex-1 flex items-center justify-center gap-1 py-2 px-3 hover:bg-white/10 rounded-lg transition-colors text-xs pulse-text-secondary hover:text-green-400"
        >
          <Settings className="h-4 w-4" />
          Settings
        </button>
        <button
          onClick={handleLogout}
          className="flex-1 flex items-center justify-center gap-1 py-2 px-3 hover:bg-red-400/10 rounded-lg transition-colors text-xs text-red-400 hover:text-red-300"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </div>
  </>
);

const Suspense = ({ fallback, children }) => {
  const [isClient, setIsClient] = React.useState(false);
  React.useEffect(() => {
    setIsClient(true);
  }, []);
  return isClient ? <React.Suspense fallback={fallback}>{children}</React.Suspense> : fallback;
}

const FullPageLoader = () => {
  const { t } = useAppContext();
  const safeT = (key, fallback) => (typeof t === 'function' ? t(key) || fallback : fallback);
  
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <svg className="animate-spin h-12 w-12 text-primary mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-lg font-semibold text-primary">{safeT('common.loading', 'Loading...')}</p>
      </div>
    </div>
  );
};

export default MainLayout;