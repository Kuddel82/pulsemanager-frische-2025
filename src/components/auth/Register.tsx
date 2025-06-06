import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string()
    .min(1, 'E-Mail ist erforderlich')
    .email('Ungültige E-Mail-Adresse'),
  password: z.string()
    .min(1, 'Passwort ist erforderlich')
    .min(6, 'Passwort muss mindestens 6 Zeichen lang sein')
    .regex(/[A-Z]/, 'Passwort muss mindestens einen Großbuchstaben enthalten')
    .regex(/[a-z]/, 'Passwort muss mindestens einen Kleinbuchstaben enthalten')
    .regex(/[0-9]/, 'Passwort muss mindestens eine Zahl enthalten'),
  confirmPassword: z.string()
    .min(1, 'Passwortbestätigung ist erforderlich')
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwörter stimmen nicht überein",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

interface PasswordRequirement {
  id: keyof typeof passwordRequirements;
  label: string;
  regex: RegExp;
}

const passwordRequirements: Record<string, PasswordRequirement> = {
  length: {
    id: 'length',
    label: 'Mindestens 6 Zeichen',
    regex: /.{6,}/,
  },
  uppercase: {
    id: 'uppercase',
    label: 'Mindestens ein Großbuchstabe',
    regex: /[A-Z]/,
  },
  lowercase: {
    id: 'lowercase',
    label: 'Mindestens ein Kleinbuchstabe',
    regex: /[a-z]/,
  },
  number: {
    id: 'number',
    label: 'Mindestens eine Zahl',
    regex: /[0-9]/,
  },
};

const Register: React.FC = () => {
  const [formData, setFormData] = useState<RegisterFormData>({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<RegisterFormData>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof RegisterFormData, boolean>>>({});
  const navigate = useNavigate();
  const { signUp } = useAuth();

  useEffect(() => {
    // Validierung bei Änderungen
    if (Object.keys(touched).length > 0) {
      try {
        registerSchema.parse(formData);
        setErrors({});
      } catch (error) {
        if (error instanceof z.ZodError) {
          const newErrors: Partial<RegisterFormData> = {};
          error.errors.forEach((err) => {
            if (err.path[0]) {
              newErrors[err.path[0] as keyof RegisterFormData] = err.message;
            }
          });
          setErrors(newErrors);
        }
      }
    }
  }, [formData, touched]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setTouched(prev => ({ ...prev, [name]: true }));
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validierung
      registerSchema.parse(formData);

      await signUp(formData.email, formData.password);
      toast.success('Registrierung erfolgreich');
      navigate('/');
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Partial<RegisterFormData> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as keyof RegisterFormData] = err.message;
          }
        });
        setErrors(newErrors);
      } else {
        toast.error(error instanceof Error ? error.message : 'Fehler bei der Registrierung');
      }
    } finally {
      setLoading(false);
    }
  };

  const checkPasswordRequirement = (requirement: PasswordRequirement) => {
    return requirement.regex.test(formData.password);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Registrieren</CardTitle>
          <CardDescription className="text-center">
            Erstellen Sie ein neues Konto
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-Mail</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                autoComplete="email"
                className={errors.email ? 'border-red-500' : ''}
                disabled={loading}
              />
              {touched.email && errors.email && (
                <Alert variant="destructive" className="py-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{errors.email}</AlertDescription>
                </Alert>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Passwort</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                autoComplete="new-password"
                className={errors.password ? 'border-red-500' : ''}
                disabled={loading}
              />
              {touched.password && errors.password && (
                <Alert variant="destructive" className="py-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{errors.password}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2 mt-2">
                {Object.values(passwordRequirements).map((requirement) => (
                  <div
                    key={requirement.id}
                    className="flex items-center gap-2 text-sm"
                  >
                    {checkPasswordRequirement(requirement) ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-gray-400" />
                    )}
                    <span className={checkPasswordRequirement(requirement) ? 'text-green-500' : 'text-gray-500'}>
                      {requirement.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Passwort bestätigen</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                autoComplete="new-password"
                className={errors.confirmPassword ? 'border-red-500' : ''}
                disabled={loading}
              />
              {touched.confirmPassword && errors.confirmPassword && (
                <Alert variant="destructive" className="py-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{errors.confirmPassword}</AlertDescription>
                </Alert>
              )}
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={loading || Object.keys(errors).length > 0}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Lade...
                </>
              ) : (
                'Registrieren'
              )}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              Bereits ein Konto?{' '}
              <Link to="/login" className="text-blue-600 hover:underline">
                Anmelden
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export { Register }; 