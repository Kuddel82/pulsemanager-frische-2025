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

// 🔐 PREMIUM-ONLY FEATURES (Abo erforderlich)
export const PREMIUM_ONLY_VIEWS = [
  { id: 'taxReport', icon: FileSpreadsheet, translationKey: 'taxReportViewTitle' }
];

// 🆓 TRIAL FEATURES (3 Tage kostenlos für registrierte User)
export const TRIAL_VIEWS = [
  { id: 'wallets', icon: Wallet, translationKey: 'walletViewTitle' },
  { id: 'roiTracker', icon: BarChart2, translationKey: 'roiTrackerTitle' },
  { id: 'market', icon: BarChartHorizontalBig, translationKey: 'marketViewTitle' },
  { id: 'tokenTrade', icon: Repeat, translationKey: 'swapViewTitle' },
  { id: 'bridge', icon: Zap, translationKey: 'bridgeViewTitle' },
  { id: 'settings', icon: SettingsIcon, translationKey: 'settingsViewTitle' }
];

// ✅ KOMPLETT FREI (auch unregistrierte User)
export const FREE_VIEWS = [
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
export const PUBLIC_VIEWS_CONFIG = [...FREE_VIEWS, ...FOOTER_VIEWS];

export const FOOTER_NAVIGATION_CONFIG = [
  { id: 'termsOfService', translationKey: 'termsOfService', path: '/termsOfService', icon: FileText },
  { id: 'privacyPolicy', translationKey: 'privacyPolicy', path: '/privacyPolicy', icon: ShieldCheck },
  { id: 'disclaimer', translationKey: 'disclaimer', path: '/disclaimer', icon: InfoIcon },
  { id: 'contactSupport', translationKey: 'contactSupport', path: `mailto:${FEEDBACK_EMAIL_ADDRESS}`, icon: Mail, isExternal: true },
  { id: 'community', translationKey: 'community', path: '#', icon: Users, isExternal: true, disabled: true } 
];

// 🎯 NEUE HELPER FUNCTIONS
export const getFeatureAccess = (featureId, user, subscriptionStatus, daysRemaining) => {
  // 1. IMMER FREI (auch für unregistrierte User)
  if (FREE_VIEWS.some(view => view.id === featureId) || FOOTER_VIEWS.some(view => view.id === featureId)) {
    return { access: true, reason: 'free' };
  }
  
  // 2. PREMIUM-ONLY (Tax Report - kein Trial!)
  if (PREMIUM_ONLY_VIEWS.some(view => view.id === featureId)) {
    if (subscriptionStatus === 'active') {
      return { access: true, reason: 'premium' };
    }
    return { access: false, reason: 'premium_required', message: 'Tax Report ist nur mit Premium-Abo verfügbar' };
  }
  
  // 3. TRIAL → PREMIUM FEATURES (3 Tage Trial, dann Premium erforderlich)
  if (TRIAL_VIEWS.some(view => view.id === featureId)) {
    // Nicht eingeloggt → Registrierung erforderlich
    if (!user) {
      return { 
        access: false, 
        reason: 'registration_required',
        message: 'Registrierung erforderlich für 3-Tage Trial' 
      };
    }
    
    // Premium User → immer Zugang
    if (subscriptionStatus === 'active') {
      return { access: true, reason: 'premium' };
    }
    
    // Trial noch aktiv → Trial-Zugang
    if (daysRemaining > 0) {
      return { 
        access: true, 
        reason: 'trial', 
        daysLeft: daysRemaining,
        message: `Trial noch ${daysRemaining} Tag${daysRemaining !== 1 ? 'e' : ''} gültig` 
      };
    }
    
    // Trial abgelaufen → Premium erforderlich
    return { 
      access: false, 
      reason: 'trial_expired',
      message: '3-Tage Trial abgelaufen - Premium-Abo erforderlich für weitere Nutzung' 
    };
  }
  
  // 4. Unknown feature - default deny
  return { access: false, reason: 'unknown_feature' };
};

// 🎯 BUSINESS LOGIC SUMMARY
export const BUSINESS_MODEL = {
  FREE_FOREVER: ['dashboard', 'wgep', 'pulseChainInfo', 'termsOfService', 'privacyPolicy', 'disclaimer'],
  TRIAL_3_DAYS: ['wallets', 'roiTracker', 'market', 'tokenTrade', 'bridge', 'settings'],
  PREMIUM_ONLY: ['taxReport'],
  
  // Helper text für UI
  getAccessDescription: (featureId) => {
    if (BUSINESS_MODEL.FREE_FOREVER.includes(featureId)) {
      return 'Kostenlos für alle';
    }
    if (BUSINESS_MODEL.TRIAL_3_DAYS.includes(featureId)) {
      return '3-Tage Trial, dann Premium';
    }
    if (BUSINESS_MODEL.PREMIUM_ONLY.includes(featureId)) {
      return 'Nur mit Premium-Abo';
    }
    return 'Unbekanntes Feature';
  }
};

// No default export
