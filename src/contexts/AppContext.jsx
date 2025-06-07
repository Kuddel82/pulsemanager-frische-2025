import React, { createContext, useState, useEffect, useContext, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext'; 
import { useStripeSubscription } from '@/hooks/useStripeSubscription';
import { useWalletConnect } from '@/hooks/useWalletConnect';
import { APP_TRANSLATIONS, PROTECTED_VIEWS_CONFIG, PUBLIC_VIEWS_CONFIG, TRIAL_DURATION_DAYS } from '@/config/appConfig';
import { logger } from '@/lib/logger';
import { supabase } from '../lib/supabase'; 

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const { 
    user, 
    
    loading: coreAuthLoading, 
    
    signIn, 
    signUp, 
    signOut, 
    
    
    
    
    
  } = useAuth(); 
  
  const isSupabaseClientReady = !!supabase; 
  const errorAuth = null; 
  const session = user ? { user } : null; 
  
  const sendPasswordResetEmail = async (email) => {
    
    logger.warn("AppContext: sendPasswordResetEmail called, but not fully implemented via AuthContext. Relying on a potential direct call to authService or similar if needed elsewhere.");
    
    return { error: "Not implemented directly in AppContext via AuthContext's exposed methods" };
  };
  const updateUserPassword = async (newPassword) => {
    
    logger.warn("AppContext: updateUserPassword called, but not fully implemented via AuthContext. Relying on a potential direct call to authService or similar if needed elsewhere.");
    
    return { error: "Not implemented directly in AppContext via AuthContext's exposed methods" };
  };


  const { 
    subscriptionStatus, 
    daysRemaining, 
    stripeCustomerId, 
    loadingSubscription, 
    errorSubscription, 
    handleStripeSubscriptionCheckout, 
    checkSubscriptionStatus,
  } = useStripeSubscription(user, supabase, isSupabaseClientReady, TRIAL_DURATION_DAYS);

  const {
    provider: wcProvider,
    accounts: wcAccounts,
    chainId: wcChainId,
    isConnected: wcIsConnected,
    isConnecting: wcIsConnecting,
    error: wcError,
    connectWallet: wcConnectWallet,
    disconnectWallet: wcDisconnectWallet,
    getProvider: wcGetProvider
  } = useWalletConnect();

  const [activeView, setActiveViewActual] = useState('dashboard'); 
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  
  const [language, setLanguageInternal] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('appLanguage') || 'de';
    }
    return 'de';
  });
  const [theme, setThemeInternal] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('appTheme');
      if (savedTheme) return savedTheme;
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    }
    return 'light';
  });

  const [appDataVersion, setAppDataVersion] = useState(0);
  
  const navigate = useNavigate();
  const location = useLocation();

  // Use refs to avoid dependencies on changing values
  const activeViewRef = useRef(activeView);
  activeViewRef.current = activeView;

  const currentTranslations = APP_TRANSLATIONS[language] || APP_TRANSLATIONS['de'];
  const t = currentTranslations;

  const publicViewsConfig = PUBLIC_VIEWS_CONFIG;
  const protectedViewsConfig = PROTECTED_VIEWS_CONFIG;

  // FIXED: Remove activeView from dependencies to prevent infinite loops
  const setActiveView = useCallback((viewId) => {
    const currentActiveView = activeViewRef.current;
    const currentPath = location.pathname;
    const newPath = viewId === 'dashboard' ? '/' : `/${viewId}`;
    
    logger.debug(`AppContext: setActiveView called with '${viewId}'. Current actual activeView: '${currentActiveView}', current path: '${currentPath}', target path: '${newPath}'`);
    
    const isNavigatingToSameLogicPath = (currentPath === '/' && viewId === 'dashboard') || currentPath === `/${viewId}`;

    if (currentActiveView !== viewId) {
      logger.info(`AppContext: activeView state changing from '${currentActiveView}' to '${viewId}'.`);
      setActiveViewActual(viewId); 
    } else {
      logger.debug(`AppContext: activeView state already '${viewId}', no state change needed for activeView.`);
    }

    if (!isNavigatingToSameLogicPath) {
      logger.info(`AppContext: Navigating from '${currentPath}' to '${newPath}'.`);
      navigate(newPath);
    } else {
      logger.debug(`AppContext: Already at target path or equivalent ('${currentPath}' for view '${viewId}'), no navigation needed.`);
    }
  }, [navigate, location.pathname]); // REMOVED activeView dependency

  // FIXED: Simplified URL sync effect
  useEffect(() => {
    const currentPathname = location.pathname;
    const viewIdFromPath = currentPathname === '/' ? 'dashboard' : currentPathname.substring(1);
    const currentActiveView = activeViewRef.current;
    
    if (viewIdFromPath !== currentActiveView) {
      const allViews = [...publicViewsConfig, ...protectedViewsConfig];
      if (allViews.some(v => v.id === viewIdFromPath)) {
        logger.info(`AppContext useEffect (URL Sync): Path matches view '${viewIdFromPath}'. Syncing activeView.`);
        setActiveViewActual(viewIdFromPath); 
      } else if (viewIdFromPath !== 'auth' && viewIdFromPath !== 'update-password' && viewIdFromPath !== '') {
        logger.warn(`AppContext useEffect (URL Sync): Path '${currentPathname}' (viewId '${viewIdFromPath}') not in known views. Keeping current activeView: '${currentActiveView}'.`);
      }
    }
  }, [location.pathname]); // SIMPLIFIED dependencies
  
  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => !prev);
  }, []);

  const handleSubscription = useCallback(async () => {
    if (!stripeCustomerId && user) {
      await checkSubscriptionStatus(); 
    }
    handleStripeSubscriptionCheckout();
    setShowSubscriptionModal(false);
  }, [stripeCustomerId, user, checkSubscriptionStatus, handleStripeSubscriptionCheckout]);

  const incrementAppDataVersion = useCallback(() => {
    setAppDataVersion(prev => prev + 1);
  }, []);

  // Theme effect
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('appTheme', theme);
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [theme]);

  const setTheme = useCallback((newTheme) => {
    setThemeInternal(newTheme);
  }, []);
  
  const toggleTheme = useCallback(() => {
    setThemeInternal(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  }, []);

  // Language effect
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('appLanguage', language);
    }
  }, [language]);

  const setLanguage = useCallback((lang) => {
    if (APP_TRANSLATIONS[lang]) {
      setLanguageInternal(lang);
    } else {
      logger.warn(`AppContext: Language "${lang}" not found, defaulting to 'de'.`);
      setLanguageInternal('de');
    }
  }, []);

  const loadingAuth = coreAuthLoading; 
  const loadingAppData = loadingSubscription; 

  // REMOVED: Debug effect that could cause performance issues


  const appContextValue = {
    activeView: activeView, 
    setActiveView,
    isSidebarOpen,
    setIsSidebarOpen,
    toggleSidebar,
    showSubscriptionModal,
    setShowSubscriptionModal,
    handleSubscription,
    showFeedbackModal,
    setShowFeedbackModal,
    language,
    setLanguage,
    translations: APP_TRANSLATIONS, 
    t, 
    theme,
    setTheme,
    toggleTheme,
    supabase,
    supabaseClient: supabase,
    user,
    session,
    loadingAuth, 
    loadingAppData, 
    errorAuth,
    signIn,
    signUp,
    signOut,
    updateUserPassword,
    sendPasswordResetEmail,
    subscriptionStatus,
    daysRemaining,
    stripeCustomerId,
    errorSubscription,
    protectedViewsConfig,
    publicViewsConfig,
    appDataVersion,
    incrementAppDataVersion,
    TRIAL_DURATION_DAYS,
    wcProvider,
    wcAccounts,
    wcChainId,
    wcIsConnected,
    wcIsConnecting,
    wcError,
    wcConnectWallet,
    wcDisconnectWallet,
    wcGetProvider,
    isSupabaseClientReady,
    connectedWalletAddress: wcAccounts && wcAccounts.length > 0 ? wcAccounts[0] : null
  };

  return <AppContext.Provider value={appContextValue}>{children}</AppContext.Provider>;
};

export const useAppContext = () => useContext(AppContext);