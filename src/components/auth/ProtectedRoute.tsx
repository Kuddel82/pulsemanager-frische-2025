import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requirePremium?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requirePremium = false,
}) => {
  const { user, isPremium, isTrialActive, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!user) {
    toast.error('Bitte melden Sie sich an, um fortzufahren');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requirePremium && !(isPremium() || isTrialActive())) {
    toast.error('Premium oder aktiver Testzeitraum erforderlich');
    return <Navigate to="/abo" replace />;
  }

  return <>{children}</>;
}; 