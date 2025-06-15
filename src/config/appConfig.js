import { Wallet, LayoutDashboard, Info, Image as ImageIcon, TrendingUp, ShoppingCart, Shuffle, Leaf, FileSpreadsheet, Percent, BookOpen, Settings as SettingsIcon, Award, FileText, Mail, ShieldCheck, BadgeInfo as InfoIcon, Users, BarChartHorizontalBig, Home, BarChart2, Repeat, Zap, AlertTriangle, Printer } from 'lucide-react';
import { translationsEn } from '@/config/locales/en.js';
import { translationsDe } from '@/config/locales/de.js';

export const TRIAL_DURATION_DAYS = 3;

export const FEEDBACK_EMAIL_ADDRESS = "dkuddel@web.de";

export const STRIPE_PUBLISHABLE_KEY = "pk_test_51RVSOiReZk1QDkJzpBL8DbDgdDNl7SAIWpc458u9AA4MI3chDaT6vLQbJsFOCl87Bd6C2lxxxCoWXLmC1BI50BUM00sOJUzDCI";
export const STRIPE_PRICE_ID = "price_1RVTzmDe4UZAo4ngzD0sb17m";

export const APP_TRANSLATIONS = {
  en: translationsEn,
  de: translationsDe,
};

// 🎯 KORRIGIERTES BUSINESS MODEL - KEIN FREE FOREVER!
export const FREE_VIEWS = [
  // 🚫 KEINE FREE FOREVER FEATURES!
  // Alles wird nach 3-Tage Trial gesperrt
];

export const TRIAL_VIEWS = [
  'dashboard',      // Portfolio - 3 Tage Trial → Premium
  'portfolio',      // Portfolio View - 3 Tage Trial → Premium
  'wgep',           // WGEP - 3 Tage Trial → Premium
  'pulseChainInfo', // PulseChain Info - 3 Tage Trial → Premium
  'wallets',        // Wallets - 3 Tage Trial → Premium
  'tokenTrade',     // Token Trade - 3 Tage Trial → Premium  
  'bridge',         // Bridge - 3 Tage Trial → Premium
  'settings'        // Settings - 3 Tage Trial → Premium
];

export const PREMIUM_ONLY_VIEWS = [
  'roiTracker',     // ROI Tracker - PREMIUM ONLY (kein Trial!)
  'roi-tracker',    // ROI Tracker (URL format) - PREMIUM ONLY (kein Trial!)
  'taxReport',      // Tax Report - PREMIUM ONLY (kein Trial!)
  'tax-report',     // Tax Report (URL format) - PREMIUM ONLY (kein Trial!)
  'tax-report-new'  // Neuer Tax Report - PREMIUM ONLY (kein Trial!)
];

// 🆓 TRIAL FEATURES (3 Tage kostenlos für registrierte User) - KORRIGIERT
export const TRIAL_VIEWS_OBJECT = [
  { id: 'dashboard', icon: Home, translationKey: 'dashboardViewTitle', isDefault: true, isSidebarLink: true },
  { id: 'portfolio', icon: BarChartHorizontalBig, translationKey: 'portfolioViewTitle', isSidebarLink: true },
  { id: 'wgep', icon: Printer, translationKey: 'wgepViewTitle', isSidebarLink: true },
  { id: 'pulseChainInfo', icon: Info, translationKey: 'pulseChainInfoTitle', isSidebarLink: true },
  { id: 'wallets', icon: Wallet, translationKey: 'walletViewTitle', isSidebarLink: true },
  { id: 'tokenTrade', icon: Repeat, translationKey: 'swapViewTitle', isSidebarLink: true },
  { id: 'bridge', icon: Zap, translationKey: 'bridgeViewTitle', isSidebarLink: true },
  { id: 'settings', icon: SettingsIcon, translationKey: 'settingsViewTitle', isSidebarLink: true }
];

// 💎 PREMIUM ONLY FEATURES
export const PREMIUM_VIEWS_OBJECT = [
  { id: 'roi-tracker', icon: BarChart2, translationKey: 'roiTrackerTitle', isSidebarLink: true },
  { id: 'roiTracker', icon: BarChart2, translationKey: 'roiTrackerTitle', isSidebarLink: true },
  { id: 'tax-report', icon: FileText, translationKey: 'taxReportTitle', isSidebarLink: true },
  { id: 'taxReport', icon: FileText, translationKey: 'taxReportTitle', isSidebarLink: true },
  { id: 'tax-report-new', icon: FileText, translationKey: 'taxReportNewTitle', isSidebarLink: true }
];

// 🚫 LEER - Keine kostenlosen Features mehr
export const FREE_VIEWS_OBJECT = [
  // KOMPLETT LEER! Keine Free Forever Features
];

// 🔗 FOOTER LINKS (immer frei)
export const FOOTER_VIEWS = [
  { id: 'termsOfService', icon: FileText, translationKey: 'termsOfService', isFooterLink: true, isSidebarLink: false },
  { id: 'privacyPolicy', icon: ShieldCheck, translationKey: 'privacyPolicy', isFooterLink: true, isSidebarLink: false },
  { id: 'disclaimer', icon: AlertTriangle, translationKey: 'disclaimer', isFooterLink: true, isSidebarLink: false }
];

// ⚠️ BACKWARD COMPATIBILITY (wird schrittweise entfernt) - KORRIGIERT
export const PROTECTED_VIEWS_CONFIG = PREMIUM_VIEWS_OBJECT;
export const PUBLIC_VIEWS_CONFIG = [...TRIAL_VIEWS_OBJECT, ...FOOTER_VIEWS];

export const FOOTER_NAVIGATION_CONFIG = [
  { id: 'termsOfService', translationKey: 'termsOfService', path: '/termsOfService', icon: FileText },
  { id: 'privacyPolicy', translationKey: 'privacyPolicy', path: '/privacyPolicy', icon: ShieldCheck },
  { id: 'disclaimer', translationKey: 'disclaimer', path: '/disclaimer', icon: InfoIcon },
  { id: 'contactSupport', translationKey: 'contactSupport', path: `mailto:${FEEDBACK_EMAIL_ADDRESS}`, icon: Mail, isExternal: true },
  { id: 'community', translationKey: 'community', path: '#', icon: Users, isExternal: true, disabled: true } 
];

/**
 * 📊 BUSINESS MODEL - Access Descriptions (KORRIGIERT - KEIN FREE FOREVER)
 */
export const BUSINESS_MODEL = {
  getAccessDescription: (viewId) => {
    if (FREE_VIEWS.includes(viewId)) {
      return 'Kostenlos für immer verfügbar'; // 🚫 WIRD NICHT VERWENDET
    }
    if (TRIAL_VIEWS.includes(viewId)) {
      return '3-Tage Trial, dann Premium erforderlich';
    }
    if (PREMIUM_ONLY_VIEWS.includes(viewId)) {
      return 'Premium erforderlich - kein Trial verfügbar';
    }
    return 'Zugriff unbekannt';
  },

  getFeatureType: (viewId) => {
    if (FREE_VIEWS.includes(viewId)) return 'free'; // 🚫 WIRD NICHT VERWENDET
    if (TRIAL_VIEWS.includes(viewId)) return 'trial';
    if (PREMIUM_ONLY_VIEWS.includes(viewId)) return 'premium_only';
    return 'unknown';
  }
};

// 🚨 EMERGENCY OVERRIDE for Premium Users
const EMERGENCY_PREMIUM_EMAILS = ['dkuddel@web.de', 'phi_bel@yahoo.de'];

const isEmergencyPremiumUser = (user) => {
  const isEmergency = user?.email && EMERGENCY_PREMIUM_EMAILS.includes(user.email);
  if (isEmergency) {
    console.log('🚨🚨🚨 EMERGENCY PREMIUM USER DETECTED:', user.email);
  }
  return isEmergency;
};

/**
 * 🎯 HAUPTFUNKTION: Feature Access Check
 * @param {string} viewId - ID des Views (z.B. 'dashboard', 'roiTracker')
 * @param {Object} user - User-Objekt von Supabase
 * @param {string} subscriptionStatus - Status: 'inactive', 'trial', 'active'
 * @param {number} daysRemaining - Verbleibende Trial-Tage
 * @returns {Object} { access: boolean, reason: string, message: string, daysLeft?: number }
 */
export const getFeatureAccess = (viewId, user, subscriptionStatus, daysRemaining) => {
  console.log(`🔍 FEATURE ACCESS CHECK: ${viewId}`, {
    hasUser: !!user,
    userEmail: user?.email,
    subscriptionStatus,
    daysRemaining
  });

  // 🚨🚨🚨 EMERGENCY OVERRIDE - ABSOLUTE PRIORITY
  if (isEmergencyPremiumUser(user)) {
    console.log('🚨🚨🚨 EMERGENCY PREMIUM OVERRIDE ACTIVE for', user.email);
    console.log('🚨🚨🚨 GRANTING FULL ACCESS TO:', viewId);
    return {
      access: true,
      reason: 'emergency_premium',
      message: `🚨 Emergency Premium Access for ${user.email}`,
      daysLeft: 999
    };
  }

  // Schritt 1: User-Check
  if (!user) {
    return {
      access: false,
      reason: 'registration_required',
      message: 'Registrierung erforderlich'
    };
  }

  // Schritt 2: Premium-Only Features (ROI Tracker & Tax Report)
  if (PREMIUM_ONLY_VIEWS.includes(viewId)) {
    if (subscriptionStatus === 'active') {
      return {
        access: true,
        reason: 'premium',
        message: 'Premium Feature verfügbar'
      };
    } else {
      return {
        access: false,
        reason: 'premium_required',
        message: 'Premium-Abonnement erforderlich'
      };
    }
  }

  // Schritt 3: Trial-Views (alle anderen Features)
  if (TRIAL_VIEWS.includes(viewId)) {
    if (subscriptionStatus === 'active') {
      return {
        access: true,
        reason: 'premium',
        message: 'Premium Vollzugriff'
      };
    } else if (subscriptionStatus === 'trial' && daysRemaining > 0) {
      return {
        access: true,
        reason: 'trial',
        message: `Trial-Zugang: ${daysRemaining} Tag${daysRemaining !== 1 ? 'e' : ''} verbleibend`,
        daysLeft: daysRemaining
      };
    } else {
      return {
        access: false,
        reason: 'trial_expired',
        message: 'Trial abgelaufen - Premium erforderlich'
      };
    }
  }

  // Fallback: Unbekannter View
  console.warn(`⚠️ UNKNOWN VIEW: ${viewId} - Defaulting to no access`);
  return {
    access: false,
    reason: 'unknown_view',
    message: 'Feature nicht verfügbar'
  };
};

// No default export
