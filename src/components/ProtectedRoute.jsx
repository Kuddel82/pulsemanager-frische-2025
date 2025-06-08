import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Wait for auth to load before redirecting
    if (!loading) {
      if (!isAuthenticated || !user) {
        // Save the attempted location for redirect after login
        navigate('/auth/login', { 
          state: { from: location },
          replace: true 
        });
      }
    }
  }, [user, loading, isAuthenticated, navigate, location]);

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Authentifizierung wird überprüft...</p>
        </div>
      </div>
    );
  }

  // Don't render children if not authenticated
  if (!isAuthenticated || !user) {
    return null;
  }

  // Render children if authenticated
  return children;
};

export default ProtectedRoute; 