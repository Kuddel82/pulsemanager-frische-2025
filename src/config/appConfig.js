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

export const PROTECTED_VIEWS_CONFIG = [
  { id: 'wallets', icon: Wallet, translationKey: 'walletViewTitle' },
  { id: 'roiTracker', icon: BarChart2, translationKey: 'roiTrackerTitle' },
  { id: 'market', icon: BarChartHorizontalBig, translationKey: 'marketViewTitle' },
  { id: 'tokenTrade', icon: Repeat, translationKey: 'swapViewTitle' },
  { id: 'bridge', icon: Zap, translationKey: 'bridgeViewTitle' },
  { id: 'taxReport', icon: FileSpreadsheet, translationKey: 'taxReportViewTitle' },
  { id: 'settings', icon: SettingsIcon, translationKey: 'settingsViewTitle' }, 
];

export const PUBLIC_VIEWS_CONFIG = [
  { id: 'dashboard', icon: Home, translationKey: 'dashboardViewTitle', isDefault: true, isSidebarLink: true },
  { id: 'wgep', icon: Printer, translationKey: 'wgepViewTitle', isSidebarLink: true },
  { id: 'pulseChainInfo', icon: Info, translationKey: 'pulseChainInfoTitle', isSidebarLink: true },
  { id: 'termsOfService', icon: FileText, translationKey: 'termsOfService', isFooterLink: true, isSidebarLink: false },
  { id: 'privacyPolicy', icon: ShieldCheck, translationKey: 'privacyPolicy', isFooterLink: true, isSidebarLink: false },
  { id: 'disclaimer', icon: AlertTriangle, translationKey: 'disclaimer', isFooterLink: true, isSidebarLink: false },
];

export const FOOTER_NAVIGATION_CONFIG = [
  { id: 'termsOfService', translationKey: 'termsOfService', path: '/termsOfService', icon: FileText },
  { id: 'privacyPolicy', translationKey: 'privacyPolicy', path: '/privacyPolicy', icon: ShieldCheck },
  { id: 'disclaimer', translationKey: 'disclaimer', path: '/disclaimer', icon: InfoIcon },
  { id: 'contactSupport', translationKey: 'contactSupport', path: `mailto:${FEEDBACK_EMAIL_ADDRESS}`, icon: Mail, isExternal: true },
  { id: 'community', translationKey: 'community', path: '#', icon: Users, isExternal: true, disabled: true } 
];

// No default export
