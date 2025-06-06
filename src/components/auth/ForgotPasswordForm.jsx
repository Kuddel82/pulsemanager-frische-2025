import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAppContext } from '@/contexts/AppContext';
import { useToast } from "@/components/ui/use-toast";
import { Loader2, MailQuestion } from 'lucide-react';

const ForgotPasswordForm = ({ setAuthMode }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { supabaseClient, t } = useAppContext();
  const { toast } = useToast();

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (!supabaseClient) {
      toast({ title: t.error, description: "Supabase client not available.", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`, // URL to your password update page
    });

    setIsLoading(false);
    if (error) {
      toast({ title: t.authPasswordResetFailed || "Password Reset Failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: t.authPasswordResetSent || "Password Reset Email Sent", description: t.authCheckEmailForReset || "Please check your email for password reset instructions.", variant: "success" });
      setAuthMode('login'); // Optionally switch back to login or show a success message
    }
  };

  return (
    <form onSubmit={handlePasswordReset} className="space-y-6">
      <h2 className="text-2xl font-semibold text-center text-white mb-6">{t.authForgotPasswordTitle || "Reset Your Password"}</h2>
      <p className="text-sm text-slate-300 text-center mb-4">
        {t.authForgotPasswordInstructions || "Enter your email address and we'll send you a link to reset your password."}
      </p>
      <div className="space-y-2">
        <Label htmlFor="email-forgot" className="text-slate-300">{t.authEmail || "Email"}</Label>
        <Input
          id="email-forgot"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:ring-purple-500 focus:border-purple-500"
          placeholder="your@email.com"
        />
      </div>
      <Button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white py-3 text-base" disabled={isLoading}>
        {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <MailQuestion className="mr-2 h-5 w-5" />}
        {t.authSendResetLinkButton || "Send Reset Link"}
      </Button>
    </form>
  );
};

export default ForgotPasswordForm;
