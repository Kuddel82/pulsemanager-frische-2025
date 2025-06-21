import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, LayoutDashboard, TrendingUp, FileText, Settings, LogOut, Bug, Crown, Timer, CheckCircle, Eye, EyeOff, Printer, Zap } from 'lucide-react';
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
  
  console.log('🚨 EMERGENCY OVERRIDE ACTIVE:', {
    userEmail: user?.email,
    isEmergencyPremiumUser,
    originalStatus: subscriptionStatus,
    effectiveStatus: effectiveSubscriptionStatus,
    originalDays: daysRemaining,
    effectiveDays: effectiveDaysRemaining,
    forceWGEP: isEmergencyPremiumUser
  });

  // 🎯 KORRIGIERTE FEATURE ACCESS CHECK - EMERGENCY OVERRIDE FIRST!
  const getFeatureStatus = (viewId) => {
    // 🚨 EMERGENCY OVERRIDE - BYPASSES ALL CHECKS
    if (isEmergencyPremiumUser) {
      console.log(`🚨 EMERGENCY ACCESS GRANTED for ${viewId} to ${user.email}`);
      return {
        access: true,
        reason: 'emergency_premium',
        message: `🚨 Emergency Premium Access`,
        disabled: false,
        iconClass: 'text-green-500',
        badge: '🚨 Emergency Premium'
      };
    }
    
    const access = getFeatureAccess(viewId, user, effectiveSubscriptionStatus, effectiveDaysRemaining);
    
    if (!user) {
      return {
        ...access,
        iconClass: 'text-red-500',
        badge: '🔐 Registrierung',
        disabled: true
      };
    }

    if (access.access) {
      if (access.reason === 'premium') {
        return {
          ...access,
          iconClass: 'text-green-500',
          badge: '👑 Premium',
          disabled: false
        };
      } else if (access.reason === 'trial') {
        return {
          ...access,
          iconClass: 'text-blue-500',
          badge: `⏰ ${access.daysLeft} Tag${access.daysLeft !== 1 ? 'e' : ''} verbleibend`,
          disabled: false
        };
      }
    } else {
      if (access.reason === 'premium_required') {
        return {
          ...access,
          iconClass: 'text-red-500',
          badge: '🔒 Premium Only',
          disabled: true
        };
      } else if (access.reason === 'trial_expired') {
        return {
          ...access,
          iconClass: 'text-red-500',
          badge: '🔒 Trial abgelaufen',
          disabled: true
        };
      }
    }

    return {
      ...access,
      iconClass: 'text-gray-500',
      badge: '🔒 Gesperrt',
      disabled: true
    };
  };

  const handleNavClick = (viewId) => {
    const accessResult = getFeatureStatus(viewId);
    
    if (accessResult.disabled) {
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

  // 🚨 EMERGENCY FIX: WGEP BUTTON EXPLIZIT HINZUFÜGEN
  // Da die View-Config Logic eventuell Probleme macht, fügen wir WGEP direkt hinzu
  const EMERGENCY_WGEP_ITEM = {
    id: 'wgep',
    icon: Printer,
    translationKey: 'wgepViewTitle',
    name: 'WGEP',
    isSidebarLink: true
  };

  // 🚨 STEUERREPORT ITEM (TRIAL-SAFE BUG-FIXES)
  const STEUERREPORT_ITEM = {
    id: 'tax-report',
    icon: FileText,
    translationKey: 'steuerreportTitle',
    name: '🚨 STEUERREPORT',
    isSidebarLink: true
  };

  // 🇩🇪 TAX EXPORT ITEM
  const TAX_EXPORT_ITEM = {
    id: 'taxExport',
    icon: FileText,
    translationKey: 'taxExportTitle',
    name: 'Tax Export',
    isSidebarLink: true
  };

  // 🌟 PULSECHAIN INFO ITEM
  const PULSECHAIN_INFO_ITEM = {
    id: 'pulsechain-info',
    icon: Zap,
    translationKey: 'pulsechainInfoTitle',
    name: 'PulseChain Infos',
    isSidebarLink: true
  };

  // 🎯 SIMPLIFIED: Main menu items in correct order - KORRIGIERT FÜR NEUES BUSINESS MODEL + EMERGENCY WGEP
  const mainMenuItems = [
    'dashboard',     // Portfolio - 3-TAGE TRIAL → Premium
    'wallets',       // Wallets - 3-TAGE TRIAL → Premium
    'roiTracker',    // ROI Tracker - PREMIUM ONLY
    'taxReport',     // Tax Report - PREMIUM ONLY
    'taxExport',     // Tax Export - PREMIUM ONLY
    'pulsechain-info', // PulseChain Infos - 3-TAGE TRIAL → Premium
    'tokenTrade',    // Token Trade - 3-TAGE TRIAL → Premium
    'bridge',        // Bridge - 3-TAGE TRIAL → Premium
    'wgep',          // WGEP - 3-TAGE TRIAL → Premium ⚠️ PROBLEM HIER!
    'settings'       // Settings - 3-TAGE TRIAL → Premium
  ];

  console.log('🔍 SIDEBAR DEBUG:', {
    user: user?.email,
    subscriptionStatus,
    daysRemaining,
    totalViews: allViewsMap.size,
    wgepInMap: allViewsMap.has('wgep'),
    wgepView: allViewsMap.get('wgep')
  });

  const sidebarViewConfigs = mainMenuItems
    .map(id => {
      const view = allViewsMap.get(id);
      if (!view) {
        console.warn(`⚠️ SIDEBAR: View '${id}' not found in config`);
        
        // 🚨 EMERGENCY: Wenn WGEP nicht gefunden wird, füge es manuell hinzu
        if (id === 'wgep') {
          console.log('🚨 EMERGENCY: Adding WGEP manually');
          return EMERGENCY_WGEP_ITEM;
        }
        
        // 🇩🇪 EMERGENCY: Tax Export manuell hinzufügen
        if (id === 'taxExport') {
          console.log('🇩🇪 EMERGENCY: Adding Tax Export manually');
          return TAX_EXPORT_ITEM;
        }
        
        // 🌟 EMERGENCY: PulseChain Info manuell hinzufügen
        if (id === 'pulsechain-info') {
          console.log('🌟 EMERGENCY: Adding PulseChain Info manually');
          return PULSECHAIN_INFO_ITEM;
        }
        
        return null;
      }
      return view;
    })
    .filter(Boolean);

  console.log('✅ SIDEBAR: Final sidebar views:', sidebarViewConfigs.map(v => ({ id: v.id, translationKey: v.translationKey, name: v.name })));

  // 🚨 EMERGENCY CHECK: Stelle sicher dass WGEP in der Liste ist
  const hasWGEP = sidebarViewConfigs.some(v => v.id === 'wgep');
  if (!hasWGEP) {
    console.error('🚨 CRITICAL: WGEP still missing, adding manually!');
    sidebarViewConfigs.splice(6, 0, EMERGENCY_WGEP_ITEM); // Füge an Position 6 ein
  }

  // 🚨 FORCE WGEP for Emergency Users
  if (isEmergencyPremiumUser && !hasWGEP) {
            console.error('🚨 EMERGENCY USER: Force-adding WGEP for premium user');
    sidebarViewConfigs.push(EMERGENCY_WGEP_ITEM);
  }

  const displayableSidebarItems = sidebarViewConfigs;

  console.log('🚨 FINAL SIDEBAR ITEMS:', displayableSidebarItems.map(v => v.id));
  console.log('🚨 WGEP IN FINAL LIST:', displayableSidebarItems.some(v => v.id === 'wgep'));

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
          const accessResult = getFeatureStatus(view.id);
          
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
              
              {/* 🎯 FEATURE STATUS ANZEIGE - KORRIGIERT */}
              {isSidebarOpen && (
                <div className="px-3 pb-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500">
                      {BUSINESS_MODEL.getAccessDescription(view.id)}
                    </p>
                  </div>
                  
                  {/* 🔴 LOCKED MESSAGE */}
                  {accessResult.disabled && (
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
                  
                  {/* 🚫 FREE MESSAGE - ENTFERNT! Keine kostenlosen Features mehr! */}
                  
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
              <Crown className={`h-4 w-4 ${effectiveSubscriptionStatus === 'active' ? 'text-yellow-500' : 'text-gray-400'}`} />
              <span className="text-sm font-medium">
                {user?.email || 'Nicht angemeldet'}
              </span>
            </div>
            
            {/* 🎯 STATUS ANZEIGE - KORRIGIERT FÜR NEUES MODEL */}
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