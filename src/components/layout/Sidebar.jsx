import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Lock, LayoutDashboard, TrendingUp, FileText, Settings, LogOut, Bug } from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';
import { logger } from '@/lib/logger';

const NavItem = ({ icon, label, viewId, isActive, onClick, isLocked, isSidebarOpen }) => {
  const IconComponent = icon;
  return (
    <Button
      variant={isActive ? "secondary" : "ghost"}
      className="w-full justify-start text-lg py-6 hover:bg-primary/10 hover:text-primary transition-all duration-300 relative"
      onClick={onClick}
      disabled={isLocked && isActive} 
    >
      {IconComponent && <IconComponent className="h-6 w-6 text-primary" />}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2, delay: 0.1 }}
            className="ml-4 truncate" 
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
      {isLocked && <Lock className="h-4 w-4 text-destructive absolute right-4 top-1/2 -translate-y-1/2" />}
    </Button>
  );
};

const Sidebar = () => {
  const {
    isSidebarOpen, 
    activeView, 
    setActiveView, 
    setShowSubscriptionModal, 
    subscriptionStatus, 
    daysRemaining, 
    t, 
    protectedViewsConfig,
    publicViewsConfig 
  } = useAppContext();

  const handleNavClick = (viewId) => {
    const isProtected = protectedViewsConfig.some(pv => pv.id === viewId);
    const isLocked = isProtected && subscriptionStatus !== 'active' && daysRemaining <= 0;
    
    if (isLocked) {
      setShowSubscriptionModal(true);
    } else {
      setActiveView(viewId); 
    }
  };
  
  const orderedSidebarItemsDefault = [
    'wallets',
    'roiTracker',
    'tokenTrade',
    'bridge',
    // 'nftPortfolio', // Removed
    'taxReport',
    'pulseChainInfo', 
    'settings',       
  ];

  const allViewsMap = new Map();
  publicViewsConfig.forEach(v => allViewsMap.set(v.id, v));
  protectedViewsConfig.forEach(v => allViewsMap.set(v.id, v));

  // 🎯 CUSTOM ORDER: Dashboard, then protected views, then WGEP, then other public views
  const customOrderedItems = [
    'wallets',
    'roiTracker', 
    'tokenTrade',
    'bridge',
    'taxReport',
    'wgep',  // WGEP directly after Tax Report
    'pulseChainInfo',
    'settings'
  ];

  const sidebarViewConfigs = customOrderedItems
    .map(id => allViewsMap.get(id))
    .filter(view => view && (view.isSidebarLink === undefined || view.isSidebarLink === true));

  const dashboardConfig = publicViewsConfig.find(v => v.id === 'dashboard');
    
  const displayableSidebarItems = [
    dashboardConfig, 
    ...sidebarViewConfigs,
  ].filter(Boolean); 

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
    <AnimatePresence>
      {isSidebarOpen && (
        <motion.nav
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 280, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-y-0 left-0 z-40 bg-background/70 backdrop-blur-sm border-r border-border/20 p-4 space-y-2 overflow-y-auto shadow-md pt-20"
        >
          {displayableSidebarItems.map(view => {
            if (!view || !view.id || !view.icon || !view.translationKey) {
                console.warn("Sidebar: Skipping invalid view config:", view);
                return null;
            }
            const isProtected = protectedViewsConfig.some(pv => pv.id === view.id);
            const isLocked = isProtected && subscriptionStatus !== 'active' && daysRemaining <= 0;
            
            let labelText = view.translationKey;
            if (t && t[view.translationKey]) {
              labelText = t[view.translationKey];
            } else {
              console.warn(`Sidebar: Missing translation for key '${view.translationKey}'. Using key as fallback.`);
            }

            return (
              <NavItem
                key={view.id}
                icon={view.icon}
                label={labelText}
                viewId={view.id}
                isActive={activeView === view.id}
                onClick={() => handleNavClick(view.id)}
                isLocked={isLocked}
                isSidebarOpen={isSidebarOpen}
              />
            );
          })}
        </motion.nav>
      )}
    </AnimatePresence>
  );
};

export default Sidebar;