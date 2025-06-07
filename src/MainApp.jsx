import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
// TEMPORARY STUB: Wagmi und React Query deaktiviert für DOM-Stabilität und Login-Fix
// import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// import { WagmiProvider } from 'wagmi';
// import { wagmiConfig } from '@/lib/walletConnect';
import ErrorBoundary from '@/components/ErrorBoundary';
import { AuthProvider } from '@/contexts/AuthContext';
import { AppProvider } from '@/contexts/AppContext';
import AppRoutes from '@/routes/index';

// STUB: Entfernt DOM-manipulierende Provider für Login-Fix
console.log('🔧 MainApp STUB - Wagmi und React Query deaktiviert für DOM-Stabilität');

export default function MainApp() {
  return (
    <ErrorBoundary>
      {/* STUB: Direkt ohne DOM-manipulierende Provider */}
      <AuthProvider>
        <Router>
          <AppProvider>
            <div className="min-h-screen bg-background">
              <AppRoutes />
            </div>
          </AppProvider>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
} 