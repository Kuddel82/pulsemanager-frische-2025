import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useAppContext } from '@/contexts/AppContext';

// ✅ NEW PULSECHAIN AUTH COMPONENTS
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import AuthCallback from '@/pages/AuthCallback';
import UpdatePasswordPage from '@/components/auth/UpdatePasswordPage';

import MainLayout from '@/components/layout/MainLayout'; 
import MinimalLayout from '@/components/layout/MinimalLayout';

// ✅ ONLY THE 4 CORE FEATURES THE USER WANTS
import Home from '@/components/views/Home';
import PortfolioView from '@/views/PortfolioView';
import ROITrackerView from '@/views/ROITrackerView';
import TaxReportView from '@/views/TaxReportView';
import WgepView from '@/views/WGEPView';
import AcademyView from '@/components/views/AcademyView';
import SettingsView from '@/components/views/SettingsView';
import DebugView from '@/views/DebugView'; // Debug Monitor für PHASE 3
import NotFound from '@/components/NotFound';

// Legal pages
import DisclaimerView from '@/components/views/DisclaimerView';
import PrivacyPolicyView from '@/components/views/PrivacyPolicyView';
import TermsOfServiceView from '@/components/views/TermsOfServiceView';

// Subscription modal
import SubscriptionModal from '@/components/SubscriptionModal';

const AppRoutes = () => {
  const { loading: authLoading } = useAuth();
  const { loading: appLoading } = useAppContext();
  const { t } = useAppContext();

  const safeT = (key, fallback) => {
    if (typeof t === 'function') {
      return t(key) || fallback;
    }
    return fallback;
  };

  // Show loading while auth is initializing
  if (authLoading || appLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Lade Anwendung...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* 🔐 AUTH ROUTES - NEW PULSECHAIN DESIGN */}
      <Route path="/auth/login" element={<Login />} />
      <Route path="/auth/register" element={<Register />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/auth" element={<Navigate to="/auth/login" replace />} />
      
      {/* Legacy redirects for old login URLs */}
      <Route path="/login" element={<Navigate to="/auth/login" replace />} />
      <Route path="/register" element={<Navigate to="/auth/register" replace />} />
      
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
        <Route path="/portfolio" element={<PortfolioView />} />
        <Route path="/roi-tracker" element={<ROITrackerView />} />
        <Route path="/tax-report" element={<TaxReportView />} />
        <Route path="/wgep" element={<WgepView />} />
        
        {/* 🐛 DEBUG MONITOR - PHASE 3 */}
        <Route path="/debug" element={<DebugView />} />
        
        {/* Redirects for legacy routes */}
        <Route path="/wallet" element={<Navigate to="/portfolio" replace />} />
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

export default AppRoutes;
