import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Loader2, AlertCircle, CheckCircle, Eye, EyeOff, Mail, CheckCircle2 } from 'lucide-react';

const Register = () => {
  const navigate = useNavigate();
  const { signUp, loading, isAuthenticated } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('❌ Die Passwörter stimmen nicht überein. Bitte überprüfe deine Eingaben.');
      setIsSubmitting(false);
      return;
    }

    // Validate password strength
    if (formData.password.length < 6) {
      setError('🔒 Das Passwort muss mindestens 6 Zeichen lang sein.');
      setIsSubmitting(false);
      return;
    }

    try {
      // Use AuthContext signUp method
      const { data, error } = await signUp(formData.email, formData.password);
      
      if (error) {
        throw error;
      }

      if (data.user) {
        if (data.user.email_confirmed_at) {
          setSuccess('✅ Registrierung erfolgreich! Weiterleitung zum Dashboard...');
          setTimeout(() => {
            navigate('/dashboard');
          }, 2000);
        } else {
          setSuccess('🎉 Konto erfolgreich erstellt! Bestätige jetzt deine E-Mail-Adresse.');
          setTimeout(() => {
            navigate('/auth/login');
          }, 4000);
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      
      // User-friendly error messages
      let errorMessage = 'Ein unbekannter Fehler ist aufgetreten.';
      
      if (error.message.includes('User already registered')) {
        errorMessage = '👤 Ein Benutzer mit dieser E-Mail-Adresse existiert bereits. Versuche dich anzumelden oder verwende eine andere E-Mail.';
      } else if (error.message.includes('Password should be at least')) {
        errorMessage = '🔒 Das Passwort ist zu schwach. Verwende mindestens 6 Zeichen mit Buchstaben und Zahlen.';
      } else if (error.message.includes('Invalid email')) {
        errorMessage = '📧 Bitte gib eine gültige E-Mail-Adresse ein.';
      } else if (error.message.includes('signup is disabled')) {
        errorMessage = '🚫 Registrierung ist derzeit deaktiviert. Versuche es später erneut.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = 
    formData.email && 
    formData.password && 
    formData.confirmPassword &&
    formData.password.length >= 6 &&
    formData.password === formData.confirmPassword;

  // Password strength indicator
  const getPasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(formData.password);
  
  const getStrengthText = (strength) => {
    if (strength <= 2) return { text: 'Schwach', color: 'text-red-400' };
    if (strength <= 3) return { text: 'Mittel', color: 'text-yellow-400' };
    return { text: 'Stark', color: 'text-green-400' };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
            PulseManager
          </h1>
          <p className="mt-2 text-gray-300">Erstelle dein Konto</p>
        </div>

        {/* Register Form */}
        <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-white">Registrieren</CardTitle>
            <CardDescription className="text-gray-400">
              Erstelle ein kostenloses Konto, um zu beginnen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Success Alert */}
              {success && (
                <Alert className="border-green-600 bg-green-900/20 backdrop-blur-sm">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <AlertDescription className="text-green-200">
                    <div className="space-y-2">
                      <strong>{success}</strong>
                      {success.includes('Bestätige') && (
                        <div className="text-sm bg-green-900/30 p-3 rounded mt-2">
                          <p className="font-semibold text-green-300">📧 Nächste Schritte:</p>
                          <ul className="list-disc list-inside mt-1 space-y-1">
                            <li>Überprüfe dein E-Mail-Postfach</li>
                            <li>Schaue auch im <strong>Spam-Ordner</strong></li>
                            <li>Klicke auf den Bestätigungslink</li>
                            <li>Dann kannst du dich anmelden</li>
                          </ul>
                        </div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Error Alert */}
              {error && (
                <Alert className="border-red-600 bg-red-900/20 backdrop-blur-sm">
                  <AlertCircle className="h-4 w-4 text-red-400" />
                  <AlertDescription className="text-red-200">
                    <strong>{error}</strong>
                    {error.includes('existiert bereits') && (
                      <div className="mt-2 text-sm">
                        💡 <strong>Lösungen:</strong>
                        <ul className="list-disc list-inside mt-1 space-y-1">
                          <li>
                            <Link to="/auth/login" className="text-red-300 underline hover:text-red-200">
                              Zur Anmeldung wechseln
                            </Link>
                          </li>
                          <li>Eine andere E-Mail-Adresse verwenden</li>
                        </ul>
                      </div>
                    )}
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
                  className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-green-400"
                  disabled={isSubmitting || loading}
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
                    autoComplete="new-password"
                    required
                    minLength={6}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Mindestens 6 Zeichen"
                    className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-green-400 pr-10"
                    disabled={isSubmitting || loading}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-300"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                
                {/* Password Strength Indicator */}
                {formData.password && (
                  <div className="space-y-1">
                    <div className="flex space-x-1">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div
                          key={level}
                          className={`h-1 w-full rounded ${
                            level <= passwordStrength
                              ? passwordStrength <= 2
                                ? 'bg-red-500'
                                : passwordStrength <= 3
                                ? 'bg-yellow-500'
                                : 'bg-green-500'
                              : 'bg-gray-600'
                          }`}
                        />
                      ))}
                    </div>
                    <p className={`text-xs ${getStrengthText(passwordStrength).color}`}>
                      Passwortstärke: {getStrengthText(passwordStrength).text}
                    </p>
                  </div>
                )}
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-gray-300">Passwort bestätigen</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Passwort wiederholen"
                    className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-green-400 pr-10"
                    disabled={isSubmitting || loading}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-300"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                
                {/* Password Match Indicator */}
                {formData.confirmPassword && (
                  <p className={`text-xs flex items-center gap-1 ${
                    formData.password === formData.confirmPassword 
                      ? 'text-green-400' 
                      : 'text-red-400'
                  }`}>
                    {formData.password === formData.confirmPassword ? (
                      <>
                        <CheckCircle2 className="h-3 w-3" />
                        Passwörter stimmen überein
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-3 w-3" />
                        Passwörter stimmen nicht überein
                      </>
                    )}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white py-3 text-base font-semibold transition-all duration-200 disabled:opacity-50"
                disabled={!isFormValid || isSubmitting || loading}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Registrierung läuft...
                  </>
                ) : (
                  '🎯 Konto erstellen'
                )}
              </Button>

              {/* Login Link */}
              <div className="text-center">
                <p className="text-sm text-gray-400">
                  Bereits ein Konto?{' '}
                  <Link 
                    to="/auth/login" 
                    className="font-medium text-green-400 hover:text-green-300 transition-colors"
                  >
                    Hier anmelden 🔑
                  </Link>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Info Box */}
        <div className="text-center">
          <Alert className="border-green-600 bg-green-900/20 backdrop-blur-sm">
            <Mail className="h-4 w-4 text-green-400" />
            <AlertDescription className="text-green-200 text-sm">
              <strong>📧 E-Mail-Bestätigung erforderlich</strong><br />
              Nach der Registrierung senden wir dir eine Bestätigungs-E-Mail. 
              Klicke auf den Link, um dein Konto zu aktivieren.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  );
};

export default Register; 