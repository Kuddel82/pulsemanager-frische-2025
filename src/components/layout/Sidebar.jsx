import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, LayoutDashboard, TrendingUp, FileText, Settings, LogOut, Bug, Crown, Timer, CheckCircle, Eye, EyeOff, Printer, Zap, Wallet, BarChartHorizontalBig, Repeat } from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';
import { logger } from '@/lib/logger';
import { useAuth } from '@/contexts/AuthContext';

const NavItem = ({ icon, label, viewId, isActive, onClick, isLocked, isSidebarOpen }) => {
  const IconComponent = icon;
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
    >
      <Button
        variant={isActive ? "default" : "ghost"}
        className={`w-full justify-start gap-3 text-left h-auto p-3 relative ${
          isLocked ? 'opacity-60' : ''
        }`}
        onClick={onClick}
        disabled={isLocked}
      >
        <IconComponent size={20} />
        
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              className="font-medium"
            >
              {label}
            </motion.span>
          )}
        </AnimatePresence>
        
        {/* 🔒 LOCK ICON für gesperrte Features */}
        {isLocked && (
          <Lock size={16} className="ml-auto text-red-400" />
        )}
      </Button>
    </motion.div>
  );
};

const Sidebar = () => {
  const { user, subscriptionStatus } = useAuth();
  const {
    isSidebarOpen, 
    setIsSidebarOpen,
    activeView,
    setActiveView,
    daysRemaining,
    setShowSubscriptionModal,
    t
  } = useAppContext();

  // 🚨 EMERGENCY PREMIUM OVERRIDE for Premium Users
  const isEmergencyPremiumUser = user?.email === 'dkuddel@web.de' || user?.email === 'phi_bel@yahoo.de';
  const effectiveSubscriptionStatus = isEmergencyPremiumUser ? 'active' : subscriptionStatus;
  const effectiveDaysRemaining = isEmergencyPremiumUser ? 999 : daysRemaining;

  // 🎯 EXAKTE URSPRÜNGLICHE REIHENFOLGE - Hardcodiert für 100% Zuverlässigkeit
  const menuItems = [
    {
      id: 'dashboard',
      icon: LayoutDashboard,
      label: 'Dashboard',
      isLocked: false
    },
    {
      id: 'portfolio',
      icon: BarChartHorizontalBig,
      label: 'Portfolio',
      isLocked: false
    },
    {
      id: 'roi-tracker',
      icon: TrendingUp,
      label: 'ROI Tracker',
      isLocked: false
    },
    {
      id: 'tax-report',
      icon: FileText,
      label: '🔥 STEUERREPORT',
      isLocked: effectiveSubscriptionStatus !== 'active'
    },
    {
      id: 'pulsechain-info',
      icon: Zap,
      label: 'PulseChain Infos',
      isLocked: false
    },
    {
      id: 'tax-export',
      icon: FileText,
      label: 'Tax Export',
      isLocked: false
    },
    {
      id: 'tokenTrade',
      icon: Repeat,
      label: 'Token-Handel (Swap)',
      isLocked: false
    },
    {
      id: 'bridge',
      icon: Zap,
      label: 'Bridge',
      isLocked: false
    },
    {
      id: 'wgep',
      icon: Printer,
      label: 'WGEP',
      isLocked: false
    },
    {
      id: 'settings',
      icon: Settings,
      label: 'Einstellungen',
      isLocked: false
    }
  ];

  const handleNavClick = (viewId) => {
    const menuItem = menuItems.find(item => item.id === viewId);
    
    if (menuItem && menuItem.isLocked) {
      console.log('❌ NAVIGATION BLOCKED: Premium required for', viewId);
      setShowSubscriptionModal(true);
    } else {
      console.log('✅ NAVIGATION ALLOWED:', viewId);
      
      // 🎯 KORREKTE URL-NAVIGATION
      const urlMap = {
        'dashboard': '/dashboard',
        'portfolio': '/portfolio',
        'roi-tracker': '/roi-tracker',
        'tax-report': '/tax-report',
        'pulsechain-info': '/pulsechain-info',
        'tax-export': '/tax-export',
        'tokenTrade': '/token-trade',
        'bridge': '/bridge',
        'wgep': '/wgep',
        'settings': '/settings'
      };
      
      const targetUrl = urlMap[viewId] || `/${viewId}`;
      window.location.href = targetUrl;
    }
  };

  return (
    <div className="flex">
      <motion.div
        initial={{ width: isSidebarOpen ? 256 : 64 }}
        animate={{ width: isSidebarOpen ? 256 : 64 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="fixed inset-y-0 left-0 z-40 bg-background/70 backdrop-blur-sm border-r border-border/20 p-4 space-y-2 overflow-y-auto shadow-md pt-20"
      >
        {menuItems.map(item => (
          <div key={item.id} className="space-y-1">
            <NavItem
              icon={item.icon}
              label={item.label}
              viewId={item.id}
              isActive={activeView === item.id}
              onClick={() => handleNavClick(item.id)}
              isLocked={item.isLocked}
              isSidebarOpen={isSidebarOpen}
            />
          </div>
        ))}

        {/* 🚀 USER STATUS PANEL */}
        {isSidebarOpen && (
          <div className="mt-6 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Crown className={`h-4 w-4 ${effectiveSubscriptionStatus === 'active' ? 'text-yellow-500' : 'text-gray-400'}`} />
              <span className="text-sm font-medium">
                {user?.email || 'Nicht angemeldet'}
              </span>
            </div>
            
            {/* 🎯 STATUS ANZEIGE */}
            <div className="text-xs space-y-1">
              {!user && (
                <p className="text-gray-600">
                  🔐 Registrierung für 3-Tage Trial erforderlich
                </p>
              )}
              
              {user && effectiveSubscriptionStatus === 'active' && (
                <p className="text-blue-600">
                  👑 Premium Nutzer - Vollzugriff auf alle Features
                </p>
              )}
              
              {user && effectiveSubscriptionStatus === 'trial' && daysRemaining > 0 && (
                <div className="space-y-1">
                  <p className="text-yellow-600">
                    ⏰ Trial: {daysRemaining} Tag{daysRemaining !== 1 ? 'e' : ''} verbleibend
                  </p>
                  <p className="text-orange-600">
                    ⚠️ Danach: Alle Features erfordern Premium
                  </p>
                </div>
              )}
              
              {user && (effectiveSubscriptionStatus === 'inactive' || daysRemaining <= 0) && (
                <p className="text-red-600">
                  ❌ Trial abgelaufen - Alle Features gesperrt
                </p>
              )}
            </div>
            
            {user && effectiveSubscriptionStatus !== 'active' && (
              <Button 
                size="sm" 
                className="w-full mt-2 bg-gradient-to-r from-blue-500 to-purple-600"
                onClick={() => setShowSubscriptionModal(true)}
              >
                <Crown className="h-3 w-3 mr-1" />
                Premium holen
              </Button>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Sidebar;