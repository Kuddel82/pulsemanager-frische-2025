import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/lib/logger';
import { useAppContext } from '@/contexts/AppContext';

const ProtectedRoute = ({ children, requirePremium = false }) => {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const { t, subscriptionStatus } = useAppContext();
  const location = useLocation();

  logger.debug(`[ProtectedRoute] Path: ${location.pathname}, AuthLoading: ${authLoading}, User: ${user ? user.id : 'null'}, IsAuthenticated: ${isAuthenticated}, RequirePremium: ${requirePremium}`);

  if (authLoading) {
    logger.info(`[ProtectedRoute] Auth is loading for path: ${location.pathname}. Displaying loading indicator.`);
    return (
      <div className="flex justify-center items-center h-screen pulse-bg">
        <div className="text-center">
          <div className="h-16 w-16 pulse-border-gradient flex items-center justify-center mx-auto mb-4">
            <div className="h-14 w-14 rounded-lg bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center">
              <span className="text-2xl font-bold text-black">PM</span>
            </div>
          </div>
          <p className="text-xl pulse-text-gradient">{typeof t === 'function' ? t('loadingApp') : "PulseManager lädt..."}</p>
        </div>
      </div>
    );
  }

  // STRICT: Check both user AND isAuthenticated flag
  if (!user || !isAuthenticated) {
    logger.warn(`[ProtectedRoute] User not authenticated for path: ${location.pathname}. User: ${!!user}, IsAuthenticated: ${isAuthenticated}. Redirecting to /auth/login.`);
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  if (requirePremium && subscriptionStatus !== 'active') {
    logger.warn(`[ProtectedRoute] Premium required for path: ${location.pathname}, but user subscription is ${subscriptionStatus}. Redirecting to /dashboard.`);
    return <Navigate to="/dashboard" replace />; 
  }

  logger.debug(`[ProtectedRoute] Access granted for path: ${location.pathname}.`);
  return children;
};

export default ProtectedRoute;