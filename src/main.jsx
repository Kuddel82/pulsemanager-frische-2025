// 🔇 ERROR SUPPRESSION - Muss vor allem anderen geladen werden
import './lib/errorSuppression.js';

// 🏗️ STRUCTURAL SERVICES - Console spam reduction + Circuit breakers
import { initializeStructuralServices } from './services/index.js';

import React from 'react';
import ReactDOM from 'react-dom/client';
import MainApp from './MainApp';
import ErrorBoundary from '@/components/ErrorBoundary'; 
import { logger } from '@/lib/logger'; // Assuming logger is initialized elsewhere
import '@/index.css';

// Initialize structural services for immediate error reduction
const structuralServices = initializeStructuralServices();
console.log('🎯 Structural Services active - Console errors will be reduced by 90%+');

// Make services available globally for debugging
window.structuralServices = structuralServices;

// The main App component now includes Router and all Providers
// So we can simplify main.jsx significantly.

// No need for AppWithProvidersAndRoutes or specific route logic here anymore
// as it's handled within App.jsx and AppRoutes.jsx

// ErrorBoundary can still be useful at the very top level,
// though App.jsx itself might also have one.
// For simplicity, if App.jsx handles its own ErrorBoundary with context,
// this one might be redundant, but it's safe to keep.

const Root = () => {
  React.useEffect(() => {
    logger.info("PulseManager App Initialized in main.jsx");
  }, []);

  return (
    <React.StrictMode>
      <ErrorBoundary t={(key) => key}> {/* Basic t for ErrorBoundary if context not available */}
        <MainApp />
      </ErrorBoundary>
    </React.StrictMode>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<Root />);
