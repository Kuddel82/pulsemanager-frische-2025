import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserPlus, Mail, Lock, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';

const Register = () => {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // 📝 Handle Form Input Changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    // Clear messages
    setErrorMessage('');
    setSuccessMessage('');
  };

  // 🔒 Password Requirements
  const passwordRequirements = [
    { text: 'Mindestens 8 Zeichen', test: (pwd) => pwd.length >= 8 },
    { text: 'Mindestens 1 Großbuchstabe', test: (pwd) => /[A-Z]/.test(pwd) },
    { text: 'Mindestens 1 Kleinbuchstabe', test: (pwd) => /[a-z]/.test(pwd) },
    { text: 'Mindestens 1 Zahl', test: (pwd) => /\d/.test(pwd) }
  ];

  // ✅ Check Individual Password Requirement
  const checkPasswordRequirement = (requirement) => {
    return requirement.test(formData.password);
  };

  // ✅ Validate Form
  const validateForm = () => {
    const newErrors = {};
    
    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email ist erforderlich';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Ungültige Email-Adresse';
    }
    
    // Password validation
    if (!formData.password) {
      newErrors.password = 'Passwort ist erforderlich';
    } else {
      const failedRequirements = passwordRequirements.filter(req => !req.test(formData.password));
      if (failedRequirements.length > 0) {
        newErrors.password = 'Passwort erfüllt nicht alle Anforderungen';
      }
    }
    
    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwort-Bestätigung ist erforderlich';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwörter stimmen nicht überein';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 🚀 Handle Registration
  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    
    try {
      await signUp(formData.email, formData.password);
      setSuccessMessage('🎉 Registrierung erfolgreich! Bitte bestätige deine Email.');
    } catch (error) {
      console.error('Registration error:', error);
      setErrorMessage(error.message || 'Registrierung fehlgeschlagen');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen pulse-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* 🎯 PulseChain Header */}
        <div className="text-center mb-8">
          <div className="h-16 w-16 pulse-border-gradient flex items-center justify-center mx-auto mb-4">
            <div className="h-14 w-14 rounded-lg bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center">
              <span className="text-2xl font-bold text-black">PM</span>
            </div>
          </div>
          <h1 className="pulse-title mb-2">PulseManager</h1>
          <p className="pulse-subtitle">Community Edition</p>
          <div className="pulse-community-badge mt-2">
            🟢 Jetzt der PulseChain Community beitreten
          </div>
        </div>

        {/* 📝 Register Form */}
        <div className="pulse-card p-8">
          <div className="flex items-center gap-3 mb-6">
            <UserPlus className="h-6 w-6 text-green-400" />
            <h2 className="text-xl font-bold pulse-text">Registrieren</h2>
          </div>

          {/* ✅ Success Message */}
          {successMessage && (
            <div className="mb-4 p-3 bg-green-400/10 border border-green-400/20 rounded-lg">
              <p className="text-green-400 text-sm">{successMessage}</p>
            </div>
          )}

          {/* ❌ Error Message */}
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-400/10 border border-red-400/20 rounded-lg">
              <p className="text-red-400 text-sm">{errorMessage}</p>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-6">
            {/* 📧 Email Field */}
            <div>
              <label className="block text-sm font-medium pulse-text mb-2">
                Email-Adresse
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="deine@email.com"
                  className={`w-full pl-10 pr-4 py-3 bg-white/5 border rounded-lg pulse-text placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400/50 transition-all ${
                    errors.email ? 'border-red-400' : 'border-white/20 focus:border-green-400'
                  }`}
                  disabled={isLoading}
                />
              </div>
              {errors.email && (
                <p className="text-red-400 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            {/* 🔒 Password Field */}
            <div>
              <label className="block text-sm font-medium pulse-text mb-2">
                Passwort
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Sicheres Passwort"
                  className={`w-full pl-10 pr-12 py-3 bg-white/5 border rounded-lg pulse-text placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400/50 transition-all ${
                    errors.password ? 'border-red-400' : 'border-white/20 focus:border-green-400'
                  }`}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-green-400"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-400 text-sm mt-1">{errors.password}</p>
              )}

              {/* 📋 Password Requirements */}
              {formData.password && (
                <div className="mt-3 p-3 bg-white/5 rounded-lg">
                  <p className="text-xs pulse-text-secondary mb-2">Passwort-Anforderungen:</p>
                  <div className="space-y-1">
                    {passwordRequirements.map((requirement, index) => (
                      <div key={index} className="flex items-center gap-2">
                        {checkPasswordRequirement(requirement) ? (
                          <CheckCircle className="h-3 w-3 text-green-400" />
                        ) : (
                          <XCircle className="h-3 w-3 text-gray-400" />
                        )}
                        <span className={`text-xs ${
                          checkPasswordRequirement(requirement) 
                            ? 'text-green-400' 
                            : 'pulse-text-secondary'
                        }`}>
                          {requirement.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 🔒 Confirm Password Field */}
            <div>
              <label className="block text-sm font-medium pulse-text mb-2">
                Passwort bestätigen
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Passwort wiederholen"
                  className={`w-full pl-10 pr-12 py-3 bg-white/5 border rounded-lg pulse-text placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400/50 transition-all ${
                    errors.confirmPassword ? 'border-red-400' : 'border-white/20 focus:border-green-400'
                  }`}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-green-400"
                  disabled={isLoading}
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-red-400 text-sm mt-1">{errors.confirmPassword}</p>
              )}
              {formData.confirmPassword && formData.password === formData.confirmPassword && (
                <div className="flex items-center gap-2 mt-1">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <span className="text-green-400 text-sm">Passwörter stimmen überein</span>
                </div>
              )}
            </div>

            {/* 🚀 Register Button - NATIVE HTML */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-6 bg-gradient-to-r from-green-400 to-blue-500 text-black font-semibold rounded-lg hover:from-green-500 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-green-400/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                  Registrierung läuft...
                </>
              ) : (
                <>
                  <UserPlus className="h-5 w-5" />
                  Account erstellen
                </>
              )}
            </button>
          </form>

          {/* 🔗 Links */}
          <div className="mt-6 space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-white/10"></div>
              <span className="text-sm pulse-text-secondary">oder</span>
              <div className="flex-1 h-px bg-white/10"></div>
            </div>

            <div className="text-center">
              <span className="text-sm pulse-text-secondary">Bereits registriert? </span>
              <Link 
                to="/auth/login"
                className="text-sm text-green-400 hover:text-green-300 transition-colors font-semibold"
              >
                Hier anmelden
              </Link>
            </div>
          </div>
        </div>

        {/* 🌐 Community Info */}
        <div className="text-center mt-6">
          <p className="text-xs pulse-text-secondary">
            Mit der Registrierung stimmst du unseren Nutzungsbedingungen zu
          </p>
          <p className="text-xs pulse-text-secondary mt-1">
            Made for PulseChain Community 💚
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register; 