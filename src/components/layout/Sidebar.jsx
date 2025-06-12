import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, LayoutDashboard, TrendingUp, FileText, Settings, LogOut, Bug, Crown, Timer, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';
import { logger } from '@/lib/logger';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getFeatureAccess, 
  BUSINESS_MODEL,
  PROTECTED_VIEWS_CONFIG as protectedViewsConfig,
  PUBLIC_VIEWS_CONFIG as publicViewsConfig
} from '@/config/appConfig';

const NavItem = ({ icon, label, viewId, isActive, onClick, accessResult, isSidebarOpen }) => {
  const IconComponent = icon;
  const isLocked = !accessResult.access;
  
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
        disabled={isLocked && accessResult.reason === 'registration_required'}
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
        
        {/* 🎯 STATUS BADGES */}
        {!isLocked && accessResult.reason === 'trial' && (
          <Badge variant="warning" className="ml-auto bg-yellow-100 text-yellow-800 text-xs">
            {accessResult.daysLeft}d
          </Badge>
        )}
        
        {!isLocked && accessResult.reason === 'premium' && (
          <Crown size={16} className="ml-auto text-yellow-500" />
        )}
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

  // 🎯 BUSINESS LOGIC - Feature Access Check
  const checkFeatureAccess = (featureId) => {
    return getFeatureAccess(featureId, user, subscriptionStatus, daysRemaining);
  };

  const handleNavClick = (viewId) => {
    const accessResult = checkFeatureAccess(viewId);
    
    if (!accessResult.access) {
      // Show appropriate modal/message based on reason
      if (accessResult.reason === 'registration_required') {
        // Redirect to registration or show message
        console.log('❌ NAVIGATION BLOCKED: Registration required for', viewId);
        alert('Registrierung erforderlich für dieses Feature');
      } else if (accessResult.reason === 'trial_expired' || accessResult.reason === 'premium_required') {
        console.log('❌ NAVIGATION BLOCKED: Premium required for', viewId);
        setShowSubscriptionModal(true);
      }
    } else {
      console.log('✅ NAVIGATION ALLOWED:', viewId, accessResult.reason);
      setActiveView(viewId);
    }
  };

  const allViewsMap = new Map();
  publicViewsConfig.forEach(v => allViewsMap.set(v.id, v));
  protectedViewsConfig.forEach(v => allViewsMap.set(v.id, v));

  // 🎯 SIMPLIFIED: Main menu items in correct order
  const mainMenuItems = [
    'dashboard',  // Portfolio - FREE
    'wallets',    // Wallets - TRIAL
    'roiTracker', // ROI Tracker - PREMIUM ONLY
    'taxReport',  // Tax Report - PREMIUM ONLY
    'tokenTrade', // Token Trade - TRIAL
    'bridge',     // Bridge - TRIAL
    'wgep',       // WGEP - FREE
    'settings'    // Settings - TRIAL
  ];

  console.log('🔍 SIDEBAR DEBUG:', {
    user: user?.email,
    subscriptionStatus,
    daysRemaining,
    totalViews: allViewsMap.size,
  });

  const sidebarViewConfigs = mainMenuItems
    .map(id => {
      const view = allViewsMap.get(id);
      if (!view) {
        console.warn(`⚠️ SIDEBAR: View '${id}' not found in config`);
        return null;
      }
      return view;
    })
    .filter(Boolean);

  console.log('✅ SIDEBAR: Final sidebar views:', sidebarViewConfigs.map(v => ({ id: v.id, translationKey: v.translationKey })));

  const displayableSidebarItems = sidebarViewConfigs;

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
          
          // 🎯 BUSINESS LOGIC CHECK
          const accessResult = checkFeatureAccess(view.id);
          
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
                accessResult={accessResult}
                isSidebarOpen={isSidebarOpen}
              />
              
              {/* 🎯 FEATURE STATUS ANZEIGE */}
              {isSidebarOpen && (
                <div className="px-3 pb-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500">
                      {BUSINESS_MODEL.getAccessDescription(view.id)}
                    </p>
                  </div>
                  
                  {/* 🔴 LOCKED MESSAGE */}
                  {!accessResult.access && (
                    <p className="text-xs text-red-500 mt-1 flex items-center">
                      <Lock className="h-3 w-3 mr-1" />
                      {accessResult.message}
                    </p>
                  )}
                  
                  {/* 🟡 TRIAL MESSAGE */}
                  {accessResult.access && accessResult.reason === 'trial' && (
                    <p className="text-xs text-yellow-600 mt-1 flex items-center">
                      <Timer className="h-3 w-3 mr-1" />
                      {accessResult.message}
                    </p>
                  )}
                  
                  {/* 🟢 FREE MESSAGE */}
                  {accessResult.access && accessResult.reason === 'free' && (
                    <p className="text-xs text-green-600 mt-1 flex items-center">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Kostenlos verfügbar
                    </p>
                  )}
                  
                  {/* 👑 PREMIUM MESSAGE */}
                  {accessResult.access && accessResult.reason === 'premium' && (
                    <p className="text-xs text-blue-600 mt-1 flex items-center">
                      <Crown className="h-3 w-3 mr-1" />
                      Premium aktiv
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* 🚀 USER STATUS PANEL */}
        {isSidebarOpen && (
          <div className="mt-6 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Crown className={`h-4 w-4 ${subscriptionStatus === 'active' ? 'text-yellow-500' : 'text-gray-400'}`} />
              <span className="text-sm font-medium">
                {user?.email || 'Nicht angemeldet'}
              </span>
            </div>
            
            {/* 🎯 STATUS ANZEIGE */}
            <div className="text-xs space-y-1">
              {!user && (
                <p className="text-gray-600">
                  🔐 Melden Sie sich an für Trial-Zugang
                </p>
              )}
              
              {user && subscriptionStatus === 'active' && (
                <p className="text-blue-600">
                  👑 Premium Nutzer - Vollzugriff
                </p>
              )}
              
              {user && subscriptionStatus === 'trial' && daysRemaining > 0 && (
                <p className="text-yellow-600">
                  ⏰ Trial: {daysRemaining} Tag{daysRemaining !== 1 ? 'e' : ''} verbleibend
                </p>
              )}
              
              {user && (subscriptionStatus === 'inactive' || daysRemaining <= 0) && (
                <p className="text-red-600">
                  ❌ Trial abgelaufen - Premium erforderlich
                </p>
              )}
            </div>
            
            {user && subscriptionStatus !== 'active' && (
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