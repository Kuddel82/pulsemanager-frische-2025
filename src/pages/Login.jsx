import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Loader2, AlertCircle, CheckCircle, Mail, RefreshCw, Eye, EyeOff } from 'lucide-react';

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
  const [showEmailConfirmationHelp, setShowEmailConfirmationHelp] = useState(false);
  const [isResendingConfirmation, setIsResendingConfirmation] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
    if (showEmailConfirmationHelp) setShowEmailConfirmationHelp(false);
  };

  const handleResendConfirmation = async () => {
    if (!formData.email) {
      setError('Bitte gib deine E-Mail-Adresse ein, um die Bestätigung erneut zu senden.');
      return;
    }

    setIsResendingConfirmation(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: formData.email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        throw error;
      }

      setSuccess('✅ Bestätigungs-E-Mail wurde erneut gesendet! Überprüfe dein Postfach (auch Spam-Ordner).');
      setShowEmailConfirmationHelp(false);
    } catch (error) {
      console.error('Resend confirmation error:', error);
      setError('Fehler beim Senden der Bestätigungs-E-Mail: ' + error.message);
    } finally {
      setIsResendingConfirmation(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');
    setShowEmailConfirmationHelp(false);

    try {
      // Use AuthContext signIn method
      const { data, error } = await signIn(formData.email, formData.password);
      
      if (error) {
        throw error;
      }

      if (data.user) {
        setSuccess('✅ Erfolgreich angemeldet! Weiterleitung zum Dashboard...');
        
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
        errorMessage = '❌ E-Mail oder Passwort ist falsch. Bitte überprüfe deine Eingaben.';
      } else if (error.message.includes('Email not confirmed')) {
        errorMessage = '⚠️ E-Mail-Adresse noch nicht bestätigt.';
        setShowEmailConfirmationHelp(true);
      } else if (error.message.includes('Too many requests')) {
        errorMessage = '⏰ Zu viele Anmeldeversuche. Bitte warte einen Moment und versuche es erneut.';
      } else if (error.message.includes('Invalid email')) {
        errorMessage = '📧 Bitte gib eine gültige E-Mail-Adresse ein.';
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            PulseManager
          </h1>
          <p className="mt-2 text-gray-300">Willkommen zurück</p>
        </div>

        {/* Login Card */}
        <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-white">Anmelden</CardTitle>
            <CardDescription className="text-gray-400">
              Melde dich mit deinem PulseManager-Konto an
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Confirmation Help Alert */}
              {showEmailConfirmationHelp && (
                <Alert className="border-yellow-600 bg-yellow-900/20 backdrop-blur-sm">
                  <Mail className="h-4 w-4 text-yellow-400" />
                  <AlertDescription className="text-yellow-200">
                    <div className="space-y-3">
                      <div>
                        <strong className="text-yellow-300">📧 E-Mail-Bestätigung erforderlich</strong>
                        <p className="text-sm mt-1">
                          Du musst zuerst deine E-Mail-Adresse bestätigen, bevor du dich anmelden kannst.
                        </p>
                      </div>
                      
                      <div className="text-sm bg-yellow-900/30 p-3 rounded">
                        <p><strong className="text-yellow-300">Was tun?</strong></p>
                        <ul className="list-disc list-inside mt-1 space-y-1">
                          <li>📬 Überprüfe dein E-Mail-Postfach</li>
                          <li>🗂️ Schaue auch im <strong>Spam-Ordner</strong></li>
                          <li>🔗 Klicke auf den Bestätigungslink in der E-Mail</li>
                          <li>📧 Falls keine E-Mail da ist:</li>
                        </ul>
                      </div>
                      
                      <Button
                        type="button"
                        onClick={handleResendConfirmation}
                        disabled={isResendingConfirmation || !formData.email}
                        className="w-full bg-yellow-600 hover:bg-yellow-700 text-black font-semibold"
                      >
                        {isResendingConfirmation ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Wird gesendet...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            📧 Bestätigungs-E-Mail erneut senden
                          </>
                        )}
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Error Alert */}
              {error && !showEmailConfirmationHelp && (
                <Alert className="border-red-600 bg-red-900/20 backdrop-blur-sm">
                  <AlertCircle className="h-4 w-4 text-red-400" />
                  <AlertDescription className="text-red-200">
                    <strong>{error}</strong>
                    {error.includes('falsch') && (
                      <div className="mt-2 text-sm">
                        💡 <strong>Tipps:</strong>
                        <ul className="list-disc list-inside mt-1 space-y-1">
                          <li>Prüfe die Groß-/Kleinschreibung</li>
                          <li>Ist dein Passwort mindestens 6 Zeichen lang?</li>
                          <li>Hast du dich mit dieser E-Mail registriert?</li>
                        </ul>
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {/* Success Alert */}
              {success && (
                <Alert className="border-green-600 bg-green-900/20 backdrop-blur-sm">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <AlertDescription className="text-green-200">
                    <strong>{success}</strong>
                  </AlertDescription>
                </Alert>
              )}

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300">E-Mail-Adresse</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="deine@email.de"
                  className="w-full bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-400"
                />
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-300">Passwort</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Mindestens 6 Zeichen"
                    className="w-full bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-400 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-300"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={!isFormValid || isSubmitting}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 text-base font-semibold transition-all duration-200 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Anmeldung läuft...
                  </>
                ) : (
                  '🚀 Anmelden'
                )}
              </Button>
            </form>

            {/* Register Link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-400">
                Noch kein Konto?{' '}
                <Link
                  to="/auth/register"
                  className="font-medium text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Hier registrieren 📝
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Info for Test Users */}
        <div className="text-center">
          <Alert className="border-blue-600 bg-blue-900/20 backdrop-blur-sm">
            <AlertCircle className="h-4 w-4 text-blue-400" />
            <AlertDescription className="text-blue-200 text-sm">
              <strong>💡 Hinweis:</strong><br />
              Verwende eine <strong>echte E-Mail-Adresse</strong>, zu der du Zugang hast. 
              Die Bestätigungs-E-Mail wird automatisch versendet.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  );
};

export default Login; 