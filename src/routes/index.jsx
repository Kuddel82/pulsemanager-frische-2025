import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import ProtectedRoute from '@/components/auth/ProtectedRoute'; // Corrected import
import { useAuth } from '@/contexts/AuthContext';
import { useAppContext } from '@/contexts/AppContext';

import AuthPage from '@/components/auth/AuthPage';
import UpdatePasswordPage from '@/components/auth/UpdatePasswordPage';

import MainLayout from '@/components/layout/MainLayout'; 
import MinimalLayout from '@/components/layout/MinimalLayout';

import Home from '@/components/views/Home';
import WalletView from '@/components/views/WalletView';
import ROITrackerView from '@/components/views/ROITrackerView';
import TaxReportView from '@/components/views/TaxReportView';
import SubscriptionModal from '@/components/SubscriptionModal';
import DisclaimerView from '@/components/views/DisclaimerView';
import PrivacyPolicyView from '@/components/views/PrivacyPolicyView';
import TermsOfServiceView from '@/components/views/TermsOfServiceView';
import PulseChainInfoView from '@/components/views/PulseChainInfoView';
import BridgeView from '@/components/views/BridgeView';
import SwapView from '@/components/views/SwapView';
import MarketView from '@/components/views/MarketView';
import NftPortfolioView from '@/components/views/NftPortfolioView';
import YieldOptimizerView from '@/components/views/YieldOptimizerView';
import SettingsView from '@/components/views/SettingsView';
import AcademyView from '@/components/views/AcademyView';

const AppRoutes = () => {
  const { loading: authLoading } = useAuth();
  const { t } = useAppContext();

  const safeT = (key, fallback) => {
    if (typeof t === 'function') {
      return t(key) || fallback;
    }
    return fallback;
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white p-4">
        <div className="animate-pulse text-center">
          {/* You can replace this with a more sophisticated SVG or component later */}
          <svg className="mx-auto h-16 w-16 text-yellow-400 mb-4" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
          </svg>
          <p className="text-2xl font-semibold gradient-text">
             {safeT('loadingApp', 'PulseManager lädt...')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Routes with MinimalLayout (e.g., auth, legal pages) */}
      <Route element={<MinimalLayout />}>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/update-password" element={<UpdatePasswordPage />} />
        <Route path="/disclaimer" element={<DisclaimerView />} />
        <Route path="/privacy-policy" element={<PrivacyPolicyView />} />
        <Route path="/terms-of-service" element={<TermsOfServiceView />} />
      </Route>

      {/* Protected Routes with MainLayout */}
      <Route 
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Home />} />
        <Route path="/wallet" element={<WalletView />} />
        <Route path="/roi-tracker" element={<ROITrackerView />} />
        <Route path="/tax-report" element={<TaxReportView />} />
        <Route path="/pulsechain-info" element={<PulseChainInfoView />} />
        <Route path="/bridge" element={<BridgeView />} />
        <Route path="/swap" element={<SwapView />} />
        <Route path="/market" element={<MarketView />} />
        <Route path="/nft-portfolio" element={<NftPortfolioView />} />
        <Route path="/yield-optimizer" element={<YieldOptimizerView />} />
        <Route path="/settings" element={<SettingsView />} />
        <Route path="/academy" element={<AcademyView />} />
        <Route path="/subscription" element={<SubscriptionModal isOpen={true} onClose={() => window.history.back()} />} /> 
      </Route>
      
      {/* Fallback for any other path */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;