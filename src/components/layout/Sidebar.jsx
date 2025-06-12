import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, LayoutDashboard, TrendingUp, FileText, Settings, LogOut, Bug, Crown, Timer, CheckCircle } from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';
import { logger } from '@/lib/logger';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getFeatureAccess, 
  BUSINESS_MODEL,
  PROTECTED_VIEWS_CONFIG as protectedViewsConfig,
  PUBLIC_VIEWS_CONFIG as publicViewsConfig
} from '@/config/appConfig';

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
        className={`w-full justify-start gap-3 text-left h-auto p-3 ${
          isLocked ? 'opacity-60 cursor-not-allowed' : ''
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
        {isLocked && <Lock size={16} className="ml-auto" />}
      </Button>
    </motion.div>
  );
};

const Sidebar = () => {
  const { user } = useAuth();
  const {
    isSidebarOpen, 
    setIsSidebarOpen,
    activeView,
    setActiveView,
    subscriptionStatus,
    daysRemaining,
    setShowSubscriptionModal,
    t
  } = useAppContext();

  // 🎯 NEUE BUSINESS LOGIC - Feature Access Check
  const checkFeatureAccess = (featureId) => {
    return getFeatureAccess(featureId, user, subscriptionStatus, daysRemaining);
  };

  const handleNavClick = (viewId) => {
    const accessResult = checkFeatureAccess(viewId);
    
    if (!accessResult.access) {
      // Show appropriate modal/message based on reason
      if (accessResult.reason === 'registration_required') {
        // Redirect to registration
        console.log('Redirect to registration:', accessResult.message);
      } else if (accessResult.reason === 'trial_expired' || accessResult.reason === 'premium_required') {
        setShowSubscriptionModal(true);
      }
    } else {
      setActiveView(viewId);
    }
  };

  const allViewsMap = new Map();
  publicViewsConfig.forEach(v => allViewsMap.set(v.id, v));
  protectedViewsConfig.forEach(v => allViewsMap.set(v.id, v));

  // 🎯 FIXED: Use all needed views in correct order
  const customOrderedItems = [
    'dashboard',  // Dashboard first
    'wallets',
    'roiTracker', 
    'tokenTrade',
    'bridge',
    'taxReport',
    'wgep',  // WGEP after Tax Report
    'pulseChainInfo',
    'settings'
  ];

  console.log('🔍 SIDEBAR DEBUG:', {
    protectedViewsCount: protectedViewsConfig.length,
    publicViewsCount: publicViewsConfig.length,
    totalMappedViews: allViewsMap.size,
    subscriptionStatus,
    daysRemaining,
    allProtectedViews: protectedViewsConfig.map(v => ({ id: v.id, translationKey: v.translationKey, isSidebarLink: v.isSidebarLink })),
    allPublicViews: publicViewsConfig.map(v => ({ id: v.id, translationKey: v.translationKey, isSidebarLink: v.isSidebarLink })),
  });

  const sidebarViewConfigs = customOrderedItems
    .map(id => {
      const view = allViewsMap.get(id);
      if (!view) {
        console.warn(`⚠️ SIDEBAR: View '${id}' not found in config`);
        return null;
      }
      if (view.isSidebarLink === false) {
        console.log(`ℹ️ SIDEBAR: View '${id}' excluded (isSidebarLink: false)`);
        return null;
      }
      
      // 🔥 FORCE WGEP ALWAYS VISIBLE!
      if (id === 'wgep') {
        console.log('🔥 FORCING WGEP TO BE VISIBLE!', view);
        return view;
      }
      
      return view;
    })
    .filter(Boolean);

  console.log('✅ SIDEBAR: Final sidebar views:', sidebarViewConfigs.map(v => ({ id: v.id, translationKey: v.translationKey })));

  const displayableSidebarItems = sidebarViewConfigs;

  const menuItems = [
    {
      icon: LayoutDashboard,
      label: 'Portfolio',
      path: '/dashboard'
    },
    {
      icon: TrendingUp,
      label: 'ROI Tracker',
      path: '/roi-tracker'
    },
    {
      icon: FileText,
      label: 'Steuer Report',
      path: '/tax-report'
    },
    {
      icon: Bug,
      label: 'Debug Monitor',
      path: '/debug'
    },
    {
      icon: Settings,
      label: 'Einstellungen',
      path: '/settings'
    }
  ];

  return (
    <div className="flex">
      <motion.div
        initial={{ width: isSidebarOpen ? 256 : 64 }}
        animate={{ width: isSidebarOpen ? 256 : 64 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="fixed inset-y-0 left-0 z-40 bg-background/70 backdrop-blur-sm border-r border-border/20 p-4 space-y-2 overflow-y-auto shadow-md pt-20"
      >
        {displayableSidebarItems.map(view => {
          if (!view || !view.id || !view.icon || !view.translationKey) {
              console.warn("Sidebar: Skipping invalid view config:", view);
              return null;
          }
          
          // 🎯 NEUE BUSINESS LOGIC
          const accessResult = checkFeatureAccess(view.id);
          const isLocked = !accessResult.access;
          
          let labelText = view.translationKey;
          if (t && t[view.translationKey]) {
            labelText = t[view.translationKey];
          } else {
            console.warn(`Sidebar: Missing translation for key '${view.translationKey}'. Using key as fallback.`);
          }

          return (
            <div key={view.id} className="space-y-1">
              <NavItem
                icon={view.icon}
                label={labelText}
                viewId={view.id}
                isActive={activeView === view.id}
                onClick={() => handleNavClick(view.id)}
                isLocked={isLocked}
                isSidebarOpen={isSidebarOpen}
              />
              
              {/* 🎯 NEUE FEATURE STATUS ANZEIGE */}
              {isSidebarOpen && (
                <div className="px-3 pb-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500">
                      {BUSINESS_MODEL.getAccessDescription(view.id)}
                    </p>
                    
                    {/* Status Badge */}
                    {accessResult.access && accessResult.reason === 'trial' && (
                      <Badge variant="warning" className="bg-yellow-100 text-yellow-800 text-xs">
                        {accessResult.daysLeft}d Trial
                      </Badge>
                    )}
                    {accessResult.access && accessResult.reason === 'premium' && (
                      <Badge variant="default" className="bg-blue-100 text-blue-800 text-xs">
                        Premium
                      </Badge>
                    )}
                    {!accessResult.access && accessResult.reason === 'trial_expired' && (
                      <Badge variant="destructive" className="bg-red-100 text-red-800 text-xs">
                        Abgelaufen
                      </Badge>
                    )}
                    {!accessResult.access && accessResult.reason === 'premium_required' && (
                      <Badge variant="outline" className="bg-gray-100 text-gray-600 text-xs">
                        Premium
                      </Badge>
                    )}
                  </div>
                  
                  {accessResult.message && (
                    <p className="text-xs text-blue-600 mt-1">
                      {accessResult.message}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Subscription Status */}
        {isSidebarOpen && (
          <div className="mt-6 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Crown className={`h-4 w-4 ${subscriptionStatus === 'active' ? 'text-yellow-500' : 'text-gray-400'}`} />
              <span className="text-sm font-medium">
                {subscriptionStatus === 'active' ? 'Premium Aktiv' : 'Basic Plan'}
              </span>
            </div>
            
            {subscriptionStatus !== 'active' && daysRemaining > 0 && (
              <p className="text-xs text-orange-600 mb-2">
                Trial läuft noch {daysRemaining} Tag{daysRemaining !== 1 ? 'e' : ''}
              </p>
            )}
            
            {subscriptionStatus !== 'active' && daysRemaining <= 0 && (
              <p className="text-xs text-red-600 mb-2">
                Trial abgelaufen
              </p>
            )}
            
            {subscriptionStatus !== 'active' && (
              <Button 
                size="sm" 
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600"
                onClick={() => setShowSubscriptionModal(true)}
              >
                <Crown className="h-3 w-3 mr-1" />
                Upgrade zu Premium
              </Button>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Sidebar;