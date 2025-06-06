import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/components/ui/use-toast';
import { AppProvider } from '@/contexts/AppContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { WagmiConfig } from 'wagmi';
import { wagmiConfig } from '@/lib/walletConnect';
import AuthPage from '@/components/auth/AuthPage';
import Dashboard from '@/pages/Dashboard';
import TermsOfService from '@/components/legal/TermsOfService';
import PrivacyPolicy from '@/components/legal/PrivacyPolicy';
import { logger } from '@/lib/logger';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const { toast } = useToast();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    logger.info('ProtectedRoute: User not authenticated, redirecting to login');
    toast({
      title: "Anmeldung erforderlich",
      description: "Bitte melden Sie sich an, um auf diese Seite zuzugreifen.",
      variant: "destructive"
    });
    return <Navigate to="/login" replace />;
  }

  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<AuthPage />} />
      <Route path="/register" element={<AuthPage />} />
      <Route
        path="/dashboard/*"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route path="/terms" element={<TermsOfService />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

const App = () => {
  return (
    <Router>
      <WagmiConfig config={wagmiConfig}>
        <AuthProvider>
          <AppProvider>
            <AppRoutes />
            <Toaster />
          </AppProvider>
        </AuthProvider>
      </WagmiConfig>
    </Router>
  );
};

export default App;
