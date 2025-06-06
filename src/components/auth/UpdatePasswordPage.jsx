import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAppContext } from '@/contexts/AppContext';
import { useToast } from "@/components/ui/use-toast";
import { Loader2, KeyRound } from 'lucide-react';
import { motion } from 'framer-motion';

const UpdatePasswordPage = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const { supabaseClient, t } = useAppContext();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Check for access token in URL hash on mount (Supabase specific for password recovery)
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.includes('access_token')) {
      // No access token, likely means user landed here directly or token expired
      // Redirect or show error. For now, just a message.
      // In a real app, you might redirect to login if no session and no token.
      // If there's a session, this page shouldn't be accessible anyway.
      setMessage(t.authUpdatePasswordInvalidLink || "Invalid or expired password reset link.");
      setIsError(true);
    }
  }, [t]);


  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ title: t.authError, description: t.authPasswordsDoNotMatch || "Passwords do not match.", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: t.authError, description: t.authPasswordMinChars || "Password must be at least 6 characters.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    setMessage('');
    setIsError(false);

    if (!supabaseClient) {
      toast({ title: t.error, description: "Supabase client not available.", variant: "destructive" });
      setIsLoading(false);
      return;
    }
    
    // Supabase handles the session from the access_token in the URL fragment.
    // The updateUser call will use this implicit session.
    const { error } = await supabaseClient.auth.updateUser({ password: password });

    setIsLoading(false);
    if (error) {
      setMessage(t.authUpdatePasswordFailed || "Failed to update password: " + error.message);
      setIsError(true);
      toast({ title: t.authUpdatePasswordFailed || "Update Failed", description: error.message, variant: "destructive" });
    } else {
      setMessage(t.authUpdatePasswordSuccess || "Password updated successfully! You can now log in.");
      setIsError(false);
      toast({ title: t.authUpdatePasswordSuccessTitle || "Password Updated", description: t.authUpdatePasswordSuccessLogin || "Your password has been updated. Please log in.", variant: "success" });
      setTimeout(() => navigate('/auth'), 3000); // Redirect to login after a delay
    }
  };
  
  const userLogoUrl = "/photo_2025-06-03_09-55-04.jpg";


  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
           <img 
            src={userLogoUrl} 
            alt={t.logoAlt || "PulseManager Logo"} 
            className="mx-auto h-20 w-auto mb-4 filter dark:brightness-0 dark:invert-[0.8]"
          />
          <h1 className="text-3xl font-bold text-white">{t.authUpdatePasswordPageTitle || "Update Your Password"}</h1>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="bg-slate-800/70 backdrop-blur-md p-8 rounded-xl shadow-2xl"
        >
          {message && (
            <div className={`mb-4 p-3 rounded-md text-sm ${isError ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300'}`}>
              {message}
            </div>
          )}
          <form onSubmit={handleUpdatePassword} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="new-password" className="text-slate-300">{t.authNewPassword || "New Password"}</Label>
              <Input
                id="new-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength="6"
                className="bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:ring-purple-500 focus:border-purple-500"
                placeholder={t.authPasswordMinChars || "Min. 6 characters"}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-new-password" className="text-slate-300">{t.authConfirmNewPassword || "Confirm New Password"}</Label>
              <Input
                id="confirm-new-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:ring-purple-500 focus:border-purple-500"
                placeholder={t.authRepeatPassword || "Repeat password"}
              />
            </div>
            <Button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white py-3 text-base" disabled={isLoading || isError && !message.includes("Invalid")}>
              {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <KeyRound className="mr-2 h-5 w-5" />}
              {t.authUpdateButton || "Update Password"}
            </Button>
          </form>
        </motion.div>
         <div className="mt-6 text-center">
            <Button variant="link" className="text-purple-400 hover:text-purple-300" onClick={() => navigate('/auth')}>
              {t.authBackToLogin || "Back to Login"}
            </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default UpdatePasswordPage;
