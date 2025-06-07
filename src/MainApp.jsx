import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { wagmiConfig } from '@/lib/walletConnect';
import { Toaster } from '@/components/ui/toaster';
import ErrorBoundary from '@/components/ErrorBoundary';
import { AuthProvider } from '@/contexts/AuthContext';
import { AppProvider } from '@/contexts/AppContext';
import AppRoutes from '@/routes/index';

// ✅ FIXED: Correct Provider Hierarchy - Router outside AppProvider!
// This fixes the useNavigate error in useStripeSubscription

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
    },
  },
});

export default function MainApp() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>
          <AuthProvider>
            <Router>
              <AppProvider>
                <div className="min-h-screen bg-background">
                  <AppRoutes />
                  <Toaster />
                </div>
              </AppProvider>
            </Router>
          </AuthProvider>
        </WagmiProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
} 