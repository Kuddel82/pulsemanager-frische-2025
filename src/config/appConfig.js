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

// 🎯 NEUE BUSINESS MODEL STRUKTUR (KORRIGIERT)
export const FREE_VIEWS = [
  'dashboard',      // Portfolio - Free Forever  
  'wgep',           // WGEP - Free Forever
  'pulseChainInfo'  // PulseChain Info - Free Forever
];

export const TRIAL_VIEWS = [
  'wallets',        // Wallets - 3 Tage Trial → Premium
  'tokenTrade',     // Token Trade - 3 Tage Trial → Premium  
  'bridge',         // Bridge - 3 Tage Trial → Premium
  'settings'        // Settings - 3 Tage Trial → Premium
];

export const PREMIUM_ONLY_VIEWS = [
  'roiTracker',     // ROI Tracker - PREMIUM ONLY (kein Trial!)
  'taxReport'       // Tax Report - PREMIUM ONLY (kein Trial!)
];

// 🆓 TRIAL FEATURES (3 Tage kostenlos für registrierte User)
export const TRIAL_VIEWS_OBJECT = [
  { id: 'wallets', icon: Wallet, translationKey: 'walletViewTitle' },
  { id: 'roiTracker', icon: BarChart2, translationKey: 'roiTrackerTitle' },
  { id: 'market', icon: BarChartHorizontalBig, translationKey: 'marketViewTitle' },
  { id: 'tokenTrade', icon: Repeat, translationKey: 'swapViewTitle' },
  { id: 'bridge', icon: Zap, translationKey: 'bridgeViewTitle' },
  { id: 'settings', icon: SettingsIcon, translationKey: 'settingsViewTitle' }
];

// ✅ KOMPLETT FREI (auch unregistrierte User)
export const FREE_VIEWS_OBJECT = [
  { id: 'dashboard', icon: Home, translationKey: 'dashboardViewTitle', isDefault: true, isSidebarLink: true },
  { id: 'wgep', icon: Printer, translationKey: 'wgepViewTitle', isSidebarLink: true },
  { id: 'pulseChainInfo', icon: Info, translationKey: 'pulseChainInfoTitle', isSidebarLink: true }
];

// 🔗 FOOTER LINKS (immer frei)
export const FOOTER_VIEWS = [
  { id: 'termsOfService', icon: FileText, translationKey: 'termsOfService', isFooterLink: true, isSidebarLink: false },
  { id: 'privacyPolicy', icon: ShieldCheck, translationKey: 'privacyPolicy', isFooterLink: true, isSidebarLink: false },
  { id: 'disclaimer', icon: AlertTriangle, translationKey: 'disclaimer', isFooterLink: true, isSidebarLink: false }
];

// ⚠️ BACKWARD COMPATIBILITY (wird schrittweise entfernt)
export const PROTECTED_VIEWS_CONFIG = PREMIUM_ONLY_VIEWS;
export const PUBLIC_VIEWS_CONFIG = [...FREE_VIEWS_OBJECT, ...FOOTER_VIEWS];

export const FOOTER_NAVIGATION_CONFIG = [
  { id: 'termsOfService', translationKey: 'termsOfService', path: '/termsOfService', icon: FileText },
  { id: 'privacyPolicy', translationKey: 'privacyPolicy', path: '/privacyPolicy', icon: ShieldCheck },
  { id: 'disclaimer', translationKey: 'disclaimer', path: '/disclaimer', icon: InfoIcon },
  { id: 'contactSupport', translationKey: 'contactSupport', path: `mailto:${FEEDBACK_EMAIL_ADDRESS}`, icon: Mail, isExternal: true },
  { id: 'community', translationKey: 'community', path: '#', icon: Users, isExternal: true, disabled: true } 
];

/**
 * 📊 BUSINESS MODEL - Access Descriptions (KORRIGIERT)
 */
export const BUSINESS_MODEL = {
  getAccessDescription: (viewId) => {
    if (FREE_VIEWS.includes(viewId)) {
      return 'Kostenlos für immer verfügbar';
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
    if (FREE_VIEWS.includes(viewId)) return 'free';
    if (TRIAL_VIEWS.includes(viewId)) return 'trial';
    if (PREMIUM_ONLY_VIEWS.includes(viewId)) return 'premium_only';
    return 'unknown';
  }
};

/**
 * 🎯 FEATURE ACCESS LOGIC (KORRIGIERT)
 * @param {string} featureId - ID der zu prüfenden Funktion
 * @param {object} user - User object (null wenn nicht eingeloggt)
 * @param {string} subscriptionStatus - 'active', 'trial', 'inactive'
 * @param {number} daysRemaining - Verbleibende Trial-Tage
 * @returns {object} {access: boolean, reason: string, message: string, daysLeft: number}
 */
export function getFeatureAccess(featureId, user, subscriptionStatus, daysRemaining) {
  // 🟢 FREE FEATURES - Immer verfügbar
  if (FREE_VIEWS.includes(featureId)) {
    return {
      access: true,
      reason: 'free',
      message: 'Kostenlos verfügbar',
      daysLeft: null
    };
  }

  // 🔐 Nicht eingeloggt = kein Zugriff auf Premium/Trial Features
  if (!user) {
    return {
      access: false,
      reason: 'registration_required',
      message: 'Registrierung erforderlich',
      daysLeft: null
    };
  }

  // 👑 PREMIUM USER - Vollzugriff auf alles
  if (subscriptionStatus === 'active') {
    return {
      access: true,
      reason: 'premium',
      message: 'Premium Zugriff',
      daysLeft: null
    };
  }

  // 🚨 PREMIUM ONLY FEATURES - Kein Trial!
  if (PREMIUM_ONLY_VIEWS.includes(featureId)) {
    return {
      access: false,
      reason: 'premium_required',
      message: 'Premium erforderlich - kein Trial verfügbar',
      daysLeft: null
    };
  }

  // 🔄 TRIAL FEATURES - 3 Tage verfügbar
  if (TRIAL_VIEWS.includes(featureId)) {
    if (daysRemaining > 0) {
      return {
        access: true,
        reason: 'trial',
        message: `Trial läuft noch ${daysRemaining} Tag${daysRemaining !== 1 ? 'e' : ''}`,
        daysLeft: daysRemaining
      };
    } else {
      return {
        access: false,
        reason: 'trial_expired',
        message: 'Trial abgelaufen - Premium erforderlich',
        daysLeft: 0
      };
    }
  }

  // 🚫 Unbekannte Features = kein Zugriff
  return {
    access: false,
    reason: 'unknown_feature',
    message: 'Feature nicht konfiguriert',
    daysLeft: null
  };
}

// No default export
