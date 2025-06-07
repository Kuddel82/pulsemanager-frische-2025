import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useAppContext } from '@/contexts/AppContext';

import AuthPage from '@/components/auth/AuthPage';
import UpdatePasswordPage from '@/components/auth/UpdatePasswordPage';

import MainLayout from '@/components/layout/MainLayout'; 
import MinimalLayout from '@/components/layout/MinimalLayout';

// ✅ ONLY THE 4 CORE FEATURES THE USER WANTS
import Home from '@/components/views/Home';
import WalletView from '@/components/views/WalletView';
import ROITrackerView from '@/components/views/ROITrackerView';
import TaxReportView from '@/components/views/TaxReportView';
import AcademyView from '@/components/views/AcademyView';
import SettingsView from '@/components/views/SettingsView';

// Legal pages
import DisclaimerView from '@/components/views/DisclaimerView';
import PrivacyPolicyView from '@/components/views/PrivacyPolicyView';
import TermsOfServiceView from '@/components/views/TermsOfServiceView';

// Subscription modal
import SubscriptionModal from '@/components/SubscriptionModal';

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
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white p-4">
        <div className="animate-pulse text-center">
          <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-2xl font-semibold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
             {safeT('loadingApp', 'PulseManager lädt...')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Routes with MinimalLayout (auth, legal pages) */}
      <Route element={<MinimalLayout />}>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/update-password" element={<UpdatePasswordPage />} />
        <Route path="/disclaimer" element={<DisclaimerView />} />
        <Route path="/privacy-policy" element={<PrivacyPolicyView />} />
        <Route path="/terms-of-service" element={<TermsOfServiceView />} />
      </Route>

      {/* Protected Routes with MainLayout - SIMPLIFIED TO 4 CORE FEATURES */}
      <Route 
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Home />} />
        
        {/* ✅ THE 4 CORE FEATURES */}
        <Route path="/wallet" element={<WalletView />} />
        <Route path="/roi-tracker" element={<ROITrackerView />} />
        <Route path="/tax-report" element={<TaxReportView />} />
        
        {/* Redirects for legacy routes */}
        <Route path="/pulsechain-roi" element={<Navigate to="/roi-tracker" replace />} />
        
        {/* Academy (Phase 4 - später) */}
        <Route path="/academy" element={<AcademyView />} />
        
        {/* Settings and subscription */}
        <Route path="/settings" element={<SettingsView />} />
        <Route path="/subscription" element={<SubscriptionModal isOpen={true} onClose={() => window.history.back()} />} /> 
      </Route>
      
      {/* Fallback for any other path */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;