import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Loader2, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';

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
      setError('Die Passwörter stimmen nicht überein.');
      setIsSubmitting(false);
      return;
    }

    // Validate password strength
    if (formData.password.length < 6) {
      setError('Das Passwort muss mindestens 6 Zeichen lang sein.');
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
          setSuccess('✅ Registrierung erfolgreich! Bitte überprüfe deine E-Mails zur Bestätigung.');
          setTimeout(() => {
            navigate('/auth/login');
          }, 3000);
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      
      // User-friendly error messages
      let errorMessage = 'Ein unbekannter Fehler ist aufgetreten.';
      
      if (error.message.includes('User already registered')) {
        errorMessage = 'Ein Benutzer mit dieser E-Mail-Adresse existiert bereits.';
      } else if (error.message.includes('Password should be at least')) {
        errorMessage = 'Das Passwort ist zu schwach. Bitte wähle ein stärkeres Passwort.';
      } else if (error.message.includes('Invalid email')) {
        errorMessage = 'Bitte gib eine gültige E-Mail-Adresse ein.';
      } else if (error.message.includes('signup is disabled')) {
        errorMessage = 'Registrierung ist derzeit deaktiviert.';
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

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">PulseManager</h1>
          <p className="mt-2 text-gray-600">Erstelle dein Konto</p>
        </div>

        {/* Register Form */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Registrieren</CardTitle>
            <CardDescription className="text-center">
              Erstelle ein kostenloses Konto, um zu beginnen
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
                    disabled={isSubmitting || loading}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
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
                              : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-gray-600">
                      Passwortstärke: {passwordStrength <= 2 ? 'Schwach' : passwordStrength <= 3 ? 'Mittel' : 'Stark'}
                    </p>
                  </div>
                )}
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Passwort bestätigen</Label>
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
                    disabled={isSubmitting || loading}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
                
                {/* Password Match Indicator */}
                {formData.confirmPassword && (
                  <p className={`text-xs ${
                    formData.password === formData.confirmPassword 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {formData.password === formData.confirmPassword 
                      ? '✓ Passwörter stimmen überein' 
                      : '✗ Passwörter stimmen nicht überein'
                    }
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                disabled={!isFormValid || isSubmitting || loading}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Registrierung läuft...
                  </>
                ) : (
                  'Konto erstellen'
                )}
              </Button>

              {/* Login Link */}
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Bereits ein Konto?{' '}
                  <Link 
                    to="/auth/login" 
                    className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
                  >
                    Hier anmelden
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

export default Register; 