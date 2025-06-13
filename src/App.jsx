import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SubscriptionProvider } from './contexts/SubscriptionProvider'; // FIXED VERSION
import { PortfolioProvider } from './contexts/PortfolioContext';
import AppRoutes from './routes';
import Navigation from './components/layout/Navigation';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SubscriptionProvider>
          <PortfolioProvider>
            <div className="min-h-screen bg-gray-900 text-white">
              <Navigation />
              <main className="container mx-auto px-4 py-8">
                <AppRoutes />
              </main>
            </div>
          </PortfolioProvider>
        </SubscriptionProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App; 