import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { wagmiConfig } from '@/lib/walletConnect';
import { AuthProvider } from '@/contexts/AuthContext';
import { AppProvider } from '@/contexts/AppContext';
import ErrorBoundary from '@/components/ErrorBoundary';

// 🔍 STEP 5: Testing AppProvider (Router + QueryClient + Wagmi + Auth + App)
// AppProvider is the most complex provider with many custom hooks!

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
        🔍 STEP 5: APP PROVIDER TEST
      </h1>
      <p className="text-xl mb-8">
        Testing if AppProvider causes runtime errors
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
          <li>✅ AuthProvider: Working</li>
          <li>⚠️ AppProvider: TESTING... (MOST COMPLEX!)</li>
          <li>⏳ Runtime Errors: Testing...</li>
        </ul>
      </div>
      
      <div className="mt-8 text-sm text-slate-400">
        <p>Testing AppProvider - most complex provider with custom hooks!</p>
        <p>Build: APP-PROVIDER-TEST - {new Date().toISOString()}</p>
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
            <AppProvider>
              <Router>
                <Routes>
                  <Route path="*" element={<DebugPage />} />
                </Routes>
              </Router>
            </AppProvider>
          </AuthProvider>
        </WagmiProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
} 