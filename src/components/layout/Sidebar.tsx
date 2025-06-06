import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  LineChart,
  Wallet,
  FileText,
  GraduationCap,
  Settings,
  ArrowLeftRight,
  TrendingUp,
  Coins
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const menuItems = [
    { path: '/', icon: Home, label: t('nav.dashboard') },
    { path: '/wallet', icon: Wallet, label: t('nav.wallet') },
    { path: '/tax-report', icon: FileText, label: t('nav.tax') },
    { path: '/learning', icon: GraduationCap, label: t('nav.academy') },
    { path: '/bridge', icon: ArrowLeftRight, label: t('nav.bridge') },
    { path: '/pulsechain-roi', icon: TrendingUp, label: t('nav.roi') },
    { path: 'https://dexscreener.com/pulsechain', icon: LineChart, label: 'Charts', external: true },
    { path: '/settings', icon: Settings, label: t('nav.settings') },
  ];

  return (
    <aside
      className="fixed left-0 top-0 h-full w-60 bg-card border-r border-border flex flex-col z-40"
    >
      {/* Logo Section */}
      <div className="h-16 flex items-center px-6 border-b border-border">
        <img src="/photo_2025-06-03_09-55-04.jpg" alt="Logo" className="h-8 w-8 rounded-lg mr-3" />
        <span className="text-lg font-bold text-foreground tracking-wide">Pulse Manager</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-2 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          if (item.external) {
            return (
              <a
                key={item.label}
                href={item.path}
                target="_blank"
                rel="noopener noreferrer"
                className={`
                  w-full flex items-center gap-3 px-4 py-2 text-base font-medium
                  transition-colors
                  rounded-none
                  text-muted-foreground hover:bg-muted hover:text-foreground
                `}
                style={{ minHeight: '44px' }}
              >
                <Icon className="h-5 w-5" />
                <span className="truncate">{item.label}</span>
              </a>
            );
          }
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`