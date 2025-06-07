import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useAppContext } from '@/contexts/AppContext';

// ✅ NEW PULSECHAIN AUTH COMPONENTS
import Login from '@/components/views/Auth/Login';
import Register from '@/components/views/Auth/Register';
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
import NotFound from '@/components/NotFound';

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
      <div className="flex items-center justify-center min-h-screen pulse-bg p-4">
        <div className="animate-pulse text-center">
          <div className="h-16 w-16 pulse-border-gradient flex items-center justify-center mx-auto mb-4">
            <div className="h-14 w-14 rounded-lg bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center">
              <span className="text-2xl font-bold text-black">PM</span>
            </div>
          </div>
          <p className="text-2xl font-semibold pulse-text-gradient">
             {safeT('loadingApp', 'PulseManager lädt...')}
          </p>
          <p className="pulse-text-secondary mt-2">Community Edition</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* 🔐 AUTH ROUTES - NEW PULSECHAIN DESIGN */}
      <Route path="/auth/login" element={<Login />} />
      <Route path="/auth/register" element={<Register />} />
      <Route path="/auth" element={<Navigate to="/auth/login" replace />} />
      
      {/* Other minimal layout routes */}
      <Route element={<MinimalLayout />}>
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
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;import SimpleLogin from '@/components/SimpleLogin';
