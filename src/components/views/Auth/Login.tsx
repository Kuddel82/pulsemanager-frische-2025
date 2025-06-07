import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LogIn, Mail, Lock, Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
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
    // Clear error message
    setErrorMessage('');
  };

  // ✅ Validate Form
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'Email ist erforderlich';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Ungültige Email-Adresse';
    }
    
    if (!formData.password) {
      newErrors.password = 'Passwort ist erforderlich';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Passwort muss mindestens 6 Zeichen haben';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 🚀 Handle Login
  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    setErrorMessage('');
    
    try {
      const result = await signIn(formData.email, formData.password);
      
      // ✅ Only navigate on successful authentication
      if (result && result.user) {
        navigate('/');
      } else {
        throw new Error('Login fehlgeschlagen - Bitte überprüfe deine Anmeldedaten');
      }
    } catch (error) {
      console.error('Login error:', error);
      // ❌ Enhanced error handling
      const errorMsg = error.message || 'Hoppla, da ist etwas schief gelaufen. Bitte versuche es erneut.';
      setErrorMessage(errorMsg);
      
      // Clear form on repeated errors to prevent user confusion
      if (errorMsg.includes('Invalid login credentials')) {
        setErrorMessage('Email oder Passwort ist falsch. Bitte überprüfe deine Angaben.');
      }
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
            🟢 PulseChain Dashboard
          </div>
        </div>

        {/* 📝 Login Form */}
        <div className="pulse-card p-8">
          <div className="flex items-center gap-3 mb-6">
            <LogIn className="h-6 w-6 text-green-400" />
            <h2 className="text-xl font-bold pulse-text">Anmelden</h2>
          </div>

          {/* ❌ Error Message */}
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-400/10 border border-red-400/20 rounded-lg">
              <p className="text-red-400 text-sm">{errorMessage}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
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
                  placeholder="Dein Passwort"
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
            </div>

            {/* 🚀 Login Button - NATIVE HTML */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-6 bg-gradient-to-r from-green-400 to-blue-500 text-black font-semibold rounded-lg hover:from-green-500 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-green-400/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                  Anmeldung läuft...
                </>
              ) : (
                <>
                  <LogIn className="h-5 w-5" />
                  Anmelden
                </>
              )}
            </button>
          </form>

          {/* 🔗 Links */}
          <div className="mt-6 space-y-4">
            <div className="text-center">
              <Link 
                to="/auth/forgot-password"
                className="text-sm text-green-400 hover:text-green-300 transition-colors"
              >
                Passwort vergessen?
              </Link>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-white/10"></div>
              <span className="text-sm pulse-text-secondary">oder</span>
              <div className="flex-1 h-px bg-white/10"></div>
            </div>

            <div className="text-center">
              <span className="text-sm pulse-text-secondary">Noch kein Account? </span>
              <Link 
                to="/auth/register"
                className="text-sm text-green-400 hover:text-green-300 transition-colors font-semibold"
              >
                Jetzt registrieren
              </Link>
            </div>
          </div>
        </div>

        {/* 🌐 Community Info */}
        <div className="text-center mt-6">
          <p className="text-xs pulse-text-secondary">
            PulseManager Community Edition
          </p>
          <p className="text-xs pulse-text-secondary mt-1">
            Made for PulseChain Community 💚
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login; 