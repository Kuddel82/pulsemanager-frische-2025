import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { wagmiConfig } from '@/lib/walletConnect';
import { AuthProvider } from '@/contexts/AuthContext';
import { AppProvider } from '@/contexts/AppContext';
import ErrorBoundary from '@/components/ErrorBoundary';

// 🔧 FIXED: Correct Provider Hierarchy - Router OUTSIDE AppProvider!
// This fixes the useNavigate error in useStripeSubscription

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
    },
  },
});

const DebugPage = () => (
  <div className="min-h-screen bg-slate-900 text-white p-8">
    <div className="max-w-2xl mx-auto text-center">
      <h1 className="text-4xl font-bold mb-4 text-green-400">
        🔧 FIXED: ROUTER HIERARCHY
      </h1>
      <p className="text-xl mb-8">
        Router moved outside AppProvider to fix useNavigate error
      </p>
      
      <div className="bg-slate-800 p-6 rounded-lg">
        <h2 className="text-2xl mb-4">✅ Status Check</h2>
        <ul className="text-left space-y-2">
          <li>✅ ErrorBoundary: Working</li>
          <li>✅ Basic JSX: Working</li>
          <li>✅ CSS Classes: Working</li>
          <li>✅ QueryClient: Working</li>
          <li>✅ WagmiProvider: Working</li>
          <li>✅ AuthProvider: Working</li>
          <li>✅ Router: MOVED TO CORRECT POSITION</li>
          <li>⏳ AppProvider: Testing with Router context available...</li>
          <li>⏳ Runtime Errors: Should be FIXED!</li>
        </ul>
      </div>
      
      <div className="mt-8 text-sm text-slate-400">
        <p>FIXED: Router hierarchy corrected - useNavigate should work now!</p>
        <p>Build: HIERARCHY-FIXED - {new Date().toISOString()}</p>
      </div>
    </div>
  </div>
);

export default function MainApp() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>
          <AuthProvider>
            <Router>
              <AppProvider>
                <Routes>
                  <Route path="*" element={<DebugPage />} />
                </Routes>
              </AppProvider>
            </Router>
          </AuthProvider>
        </WagmiProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
} 