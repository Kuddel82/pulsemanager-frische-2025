import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { wagmiConfig } from '@/lib/walletConnect';
import { AuthProvider } from '@/contexts/AuthContext';
import ErrorBoundary from '@/components/ErrorBoundary';

// 🔍 STEP 4: Testing AuthProvider (Router + QueryClient + Wagmi + Auth)
// AuthProvider has complex Supabase integrations - could cause runtime errors!

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
        🔍 STEP 4: AUTH PROVIDER TEST
      </h1>
      <p className="text-xl mb-8">
        Testing if AuthProvider causes runtime errors
      </p>
      
      <div className="bg-slate-800 p-6 rounded-lg">
        <h2 className="text-2xl mb-4">✅ Status Check</h2>
        <ul className="text-left space-y-2">
          <li>✅ ErrorBoundary: Working</li>
          <li>✅ Basic JSX: Working</li>
          <li>✅ CSS Classes: Working</li>
          <li>✅ Router: Working</li>
          <li>✅ QueryClient: Working</li>
          <li>✅ WagmiProvider: Working</li>
          <li>⚠️ AuthProvider: TESTING... (Supabase Integration!)</li>
          <li>⏳ Runtime Errors: Testing...</li>
        </ul>
      </div>
      
      <div className="mt-8 text-sm text-slate-400">
        <p>Testing AuthProvider - complex Supabase auth integration!</p>
        <p>Build: AUTH-TEST - {new Date().toISOString()}</p>
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
              <Routes>
                <Route path="*" element={<DebugPage />} />
              </Routes>
            </Router>
          </AuthProvider>
        </WagmiProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
} 