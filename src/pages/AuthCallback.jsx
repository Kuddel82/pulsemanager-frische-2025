import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Loader2, CheckCircle, XCircle, Mail } from 'lucide-react';

const AuthCallback = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  const [status, setStatus] = useState('processing'); // 'processing' | 'success' | 'error'
  const [message, setMessage] = useState('E-Mail-Bestätigung wird verarbeitet...');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the tokens from URL hash (Supabase sends them there)
        const hashFragment = window.location.hash;
        
        if (hashFragment) {
          // Supabase will automatically handle the session from the hash
          const { data, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('Auth callback error:', error);
            setStatus('error');
            setMessage('Fehler bei der E-Mail-Bestätigung. Bitte versuche es erneut.');
            return;
          }

          if (data.session && data.session.user) {
            setStatus('success');
            setMessage('✅ E-Mail erfolgreich bestätigt! Weiterleitung zum Dashboard...');
            
            // Wait a moment to show success message, then redirect
            setTimeout(() => {
              navigate('/dashboard');
            }, 2000);
          } else {
            setStatus('error');
            setMessage('Ungültiger Bestätigungslink oder bereits abgelaufen.');
          }
        } else {
          // No hash fragment means probably accessed directly
          setStatus('error');
          setMessage('Ungültiger Bestätigungslink. Bitte überprüfe den Link aus deiner E-Mail.');
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        setStatus('error');
        setMessage('Ein unerwarteter Fehler ist aufgetreten.');
      }
    };

    // If user is already authenticated, redirect
    if (isAuthenticated && user) {
      navigate('/dashboard');
      return;
    }

    handleAuthCallback();
  }, [navigate, user, isAuthenticated]);

  const handleRetry = () => {
    navigate('/auth/login');
  };

  const handleResendConfirmation = () => {
    navigate('/auth/register');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">PulseManager</h1>
          <p className="mt-2 text-gray-600">E-Mail-Bestätigung</p>
        </div>

        {/* Status Card */}
        <Card>
          <CardHeader className="text-center pb-3">
            <CardTitle className="flex items-center justify-center space-x-2">
              {status === 'processing' && (
                <>
                  <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                  <span>Verarbeitung...</span>
                </>
              )}
              {status === 'success' && (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-green-600">Bestätigt!</span>
                </>
              )}
              {status === 'error' && (
                <>
                  <XCircle className="h-5 w-5 text-red-600" />
                  <span className="text-red-600">Fehler</span>
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert className={`${
              status === 'success' ? 'border-green-200 bg-green-50' : 
              status === 'error' ? 'border-red-200 bg-red-50' : 
              'border-blue-200 bg-blue-50'
            }`}>
              <AlertDescription className={`${
                status === 'success' ? 'text-green-800' : 
                status === 'error' ? 'text-red-800' : 
                'text-blue-800'
              }`}>
                {message}
              </AlertDescription>
            </Alert>

            {status === 'processing' && (
              <div className="mt-4 text-center text-sm text-gray-600">
                <Mail className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                Bitte warte, während wir deine E-Mail-Adresse bestätigen...
              </div>
            )}

            {status === 'error' && (
              <div className="mt-4 space-y-3">
                <Button
                  onClick={handleRetry}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Zur Anmeldung
                </Button>
                <Button
                  onClick={handleResendConfirmation}
                  variant="outline"
                  className="w-full"
                >
                  Neue Bestätigungs-E-Mail anfordern
                </Button>
              </div>
            )}

            {status === 'success' && (
              <div className="mt-4 text-center text-sm text-gray-600">
                Du wirst automatisch weitergeleitet...
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            Bei Problemen kontaktiere den Support unter{' '}
            <a href="mailto:support@pulsemanager.vip" className="text-blue-600 hover:underline">
              support@pulsemanager.vip
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthCallback; 