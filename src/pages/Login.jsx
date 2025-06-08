import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const { signIn, loading, isAuthenticated } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      // Use AuthContext signIn method
      const { data, error } = await signIn(formData.email, formData.password);
      
      if (error) {
        throw error;
      }

      if (data.user) {
        setSuccess('✅ Erfolgreich angemeldet! Weiterleitung...');
        
        // Wait a moment to show success message
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      }
    } catch (error) {
      console.error('Login error:', error);
      
      // User-friendly error messages
      let errorMessage = 'Ein unbekannter Fehler ist aufgetreten.';
      
      if (error.message.includes('Invalid login credentials')) {
        errorMessage = 'E-Mail oder Passwort ist falsch.';
      } else if (error.message.includes('Email not confirmed')) {
        errorMessage = 'Bitte bestätige zuerst deine E-Mail-Adresse.';
      } else if (error.message.includes('Too many requests')) {
        errorMessage = 'Zu viele Anmeldeversuche. Bitte warte einen Moment.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = formData.email && formData.password && formData.password.length >= 6;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">PulseManager</h1>
          <p className="mt-2 text-gray-600">Willkommen zurück</p>
        </div>

        {/* Login Form */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Anmelden</CardTitle>
            <CardDescription className="text-center">
              Melde dich an, um auf dein Dashboard zuzugreifen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Success Alert */}
              {success && (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    {success}
                  </AlertDescription>
                </Alert>
              )}

              {/* Error Alert */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email">E-Mail-Adresse</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@example.com"
                  disabled={isSubmitting || loading}
                />
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password">Passwort</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Mindestens 6 Zeichen"
                  disabled={isSubmitting || loading}
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                disabled={!isFormValid || isSubmitting || loading}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Anmeldung läuft...
                  </>
                ) : (
                  'Anmelden'
                )}
              </Button>

              {/* Register Link */}
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Noch kein Konto?{' '}
                  <Link 
                    to="/register" 
                    className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
                  >
                    Hier registrieren
                  </Link>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login; 