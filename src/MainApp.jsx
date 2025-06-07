import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { wagmiConfig } from '@/lib/walletConnect';
import ErrorBoundary from '@/components/ErrorBoundary';

// 🔍 STEP 3: Testing WagmiProvider (Router + QueryClient + Wagmi)
// WagmiProvider is HIGHLY SUSPICIOUS for Web3 runtime errors!

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
        🔍 STEP 3: WAGMI PROVIDER TEST
      </h1>
      <p className="text-xl mb-8">
        Testing if WagmiProvider causes runtime errors
      </p>
      
      <div className="bg-slate-800 p-6 rounded-lg">
        <h2 className="text-2xl mb-4">✅ Status Check</h2>
        <ul className="text-left space-y-2">
          <li>✅ ErrorBoundary: Working</li>
          <li>✅ Basic JSX: Working</li>
          <li>✅ CSS Classes: Working</li>
          <li>✅ Router: Working</li>
          <li>✅ QueryClient: Working</li>
          <li>⚠️ WagmiProvider: TESTING... (HIGHLY SUSPICIOUS!)</li>
          <li>⏳ Runtime Errors: Testing...</li>
        </ul>
      </div>
      
      <div className="mt-8 text-sm text-slate-400">
        <p>Testing WagmiProvider - often causes Web3 runtime errors!</p>
        <p>Build: WAGMI-TEST - {new Date().toISOString()}</p>
      </div>
    </div>
  </div>
);

export default function MainApp() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>
          <Router>
            <Routes>
              <Route path="*" element={<DebugPage />} />
            </Routes>
          </Router>
        </WagmiProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
} 