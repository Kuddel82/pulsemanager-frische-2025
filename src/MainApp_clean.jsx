import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { wagmiConfig } from '@/lib/walletConnect';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/AuthContext';
import { AppProvider } from '@/contexts/AppContext';
import { TranslationProvider } from '@/contexts/TranslationContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import MainLayout from '@/components/layout/MainLayout';
import MinimalLayout from '@/components/layout/MinimalLayout';

// Views
import DashboardView from '@/components/views/DashboardView';
import WalletView from '@/components/views/WalletView';
import PulseChainInfoView from '@/components/views/PulseChainInfoView';
import ROITrackerView from '@/components/views/ROITrackerView';
import TaxReportView from '@/components/views/TaxReportView';
import MarketView from '@/components/views/MarketView';
import NftPortfolioView from '@/components/views/NftPortfolioView';
import SettingsView from '@/components/views/SettingsView';
import HelpView from '@/components/views/HelpView';
import TermsOfServiceView from '@/components/views/TermsOfServiceView';
import PrivacyPolicyView from '@/components/views/PrivacyPolicyView';

// Auth Components
import LoginForm from '@/components/auth/LoginForm';
import LicenseKeyInput from '@/components/auth/LicenseKeyInput';

// Create a new QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

// HARD BLOCK System - Main App Router
function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes - Minimal Layout */}
      <Route path="/login" element={
        <MinimalLayout>
          <LoginForm />
        </MinimalLayout>
      } />
      <Route path="/license" element={
        <MinimalLayout>
          <LicenseKeyInput />
        </MinimalLayout>
      } />
      
      {/* Protected Routes - Main Layout */}
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardView />} />
        <Route path="wallet" element={<WalletView />} />
        <Route path="pulsechain-info" element={<PulseChainInfoView />} />
        <Route path="roi-tracker" element={<ROITrackerView />} />
        <Route path="tax-report" element={<TaxReportView />} />
        <Route path="market" element={<MarketView />} />
        <Route path="nft-portfolio" element={<NftPortfolioView />} />
        <Route path="settings" element={<SettingsView />} />
        <Route path="help" element={<HelpView />} />
        <Route path="terms" element={<TermsOfServiceView />} />
        <Route path="privacy" element={<PrivacyPolicyView />} />
      </Route>
      
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

// Main App Component with all Providers
export default function MainApp() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <WagmiProvider config={wagmiConfig}>
            <TranslationProvider>
              <AuthProvider>
                <AppProvider>
                  <Router>
                    <div className="min-h-screen bg-background">
                      <AppRoutes />
                      <Toaster />
                    </div>
                  </Router>
                </AppProvider>
              </AuthProvider>
            </TranslationProvider>
          </WagmiProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

