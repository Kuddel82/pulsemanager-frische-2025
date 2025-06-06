import React, { useState } from 'react';
import { motion } from 'framer-motion';
import LoginForm from '@/components/auth/LoginForm';
import RegisterForm from '@/components/auth/RegisterForm';
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm';
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/contexts/AppContext';

const AuthPage = () => {
  const [authMode, setAuthMode] = useState('login'); // 'login', 'register', 'forgotPassword'
  const { t } = useAppContext();
  const userLogoUrl = "/photo_2025-06-03_09-55-04.jpg";

  const renderForm = () => {
    switch (authMode) {
      case 'register':
        return <RegisterForm setAuthMode={setAuthMode} />;
      case 'forgotPassword':
        return <ForgotPasswordForm setAuthMode={setAuthMode} />;
      case 'login':
      default:
        return <LoginForm setAuthMode={setAuthMode} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          
          <h1 className="text-4xl font-bold text-white pt-20">{t.appTitle || "PulseManager"}</h1>
          <p className="text-purple-300">{t.dashboardSubtitle || "Manage your crypto assets with ease and precision."}</p>
        </div>

        <motion.div
          key={authMode}
          initial={{ opacity: 0, x: authMode === 'login' ? 0 : (authMode === 'register' ? 50 : -50) }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: authMode === 'login' ? 0 : (authMode === 'register' ? -50 : 50) }}
          transition={{ duration: 0.3 }}
          className="bg-slate-800/70 backdrop-blur-md p-8 rounded-xl shadow-2xl"
        >
          {renderForm()}
        </motion.div>

        <div className="mt-6 text-center">
          {authMode === 'login' && (
            <p className="text-sm text-slate-400">
              {t.authNoAccount || "Don't have an account?"}{' '}
              <Button variant="link" className="text-purple-400 hover:text-purple-300 p-0 h-auto" onClick={() => setAuthMode('register')}>
                {t.authRegisterNow || "Register now"}
              </Button>
            </p>
          )}
          {authMode === 'register' && (
            <p className="text-sm text-slate-400">
              {t.authHaveAccount || "Already have an account?"}{' '}
              <Button variant="link" className="text-purple-400 hover:text-purple-300 p-0 h-auto" onClick={() => setAuthMode('login')}>
                {t.authLoginNow || "Login now"}
              </Button>
            </p>
          )}
           {authMode === 'forgotPassword' && (
            <p className="text-sm text-slate-400">
              {t.authRememberPassword || "Remember your password?"}{' '}
              <Button variant="link" className="text-purple-400 hover:text-purple-300 p-0 h-auto" onClick={() => setAuthMode('login')}>
                {t.authLoginNow || "Login now"}
              </Button>
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default AuthPage;