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
    language,
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
    publicViewsCount: publicViewsConfig.length,
    protectedViewsCount: protectedViewsConfig.length,
    totalViewsInMap: allViewsMap.size,
    wgepExists: allViewsMap.has('wgep'),
    wgepConfig: allViewsMap.get('wgep'),
    customOrderedItems,
    subscriptionStatus,
    daysRemaining,
    allPublicViews: publicViewsConfig.map(v => ({ id: v.id, translationKey: v.translationKey, isSidebarLink: v.isSidebarLink })),
    wgepTranslationExists: !!t.wgepViewTitle,
    wgepTranslationValue: t.wgepViewTitle,
    currentLanguage: language || 'unknown'
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
      return view;
    })
    .filter(Boolean);

  console.log('✅ SIDEBAR: Final sidebar views:', sidebarViewConfigs.map(v => ({ id: v.id, translationKey: v.translationKey })));
    
  const displayableSidebarItems = sidebarViewConfigs;

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