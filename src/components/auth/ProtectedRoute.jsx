import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { logger } from '@/lib/logger';
import { useAppContext } from '@/contexts/AppContext';

const ProtectedRoute = ({ children, requirePremium = false }) => {
  const { user, isPremium, loading: authLoading } = useAuth();
  const { t } = useAppContext();
  const { toast } = useToast();
  const location = useLocation();

  logger.debug(`[ProtectedRoute] Path: ${location.pathname}, AuthLoading: ${authLoading}, User: ${user ? user.id : 'null'}, RequirePremium: ${requirePremium}`);

  if (authLoading) {
    logger.info(`[ProtectedRoute] Auth is loading for path: ${location.pathname}. Displaying loading indicator.`);
    return (
      <div className="flex justify-center items-center h-screen bg-background">
        <p className="text-xl text-primary">{typeof t === 'function' ? t('loadingApp') : "Laden..."}</p>
      </div>
    );
  }

  if (!user) {
    logger.warn(`[ProtectedRoute] No user found for path: ${location.pathname}. Redirecting to /auth.`);
    toast({
      title: typeof t === 'function' ? t('auth.loginRequiredTitle') : "Anmeldung erforderlich",
      description: typeof t === 'function' ? t('auth.loginRequiredDescription') : "Bitte melden Sie sich an, um fortzufahren.",
      variant: "destructive",
    });
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (requirePremium && !isPremium()) {
    logger.warn(`[ProtectedRoute] Premium required for path: ${location.pathname}, but user is not premium. Redirecting to /dashboard.`);
    toast({
      title: typeof t === 'function' ? t('subscription.premiumRequiredTitle') : "Premium-Funktion",
      description: typeof t === 'function' ? t('subscription.premiumRequiredDescription') : "Diese Funktion ist nur für Premium-Benutzer verfügbar.",
      variant: "destructive",
    });
    return <Navigate to="/dashboard" replace />; 
  }

  logger.debug(`[ProtectedRoute] Access granted for path: ${location.pathname}.`);
  return children;
};

export default ProtectedRoute;