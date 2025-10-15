import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLicenseAuth } from '@/hooks/useLicenseAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Eye, EyeOff, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function LicenseResetPassword() {
  const { updatePassword, session } = useLicenseAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const parseParams = () => {
      const rawHash = window.location.hash || '';
      const hashParams = new URLSearchParams(rawHash.startsWith('#') ? rawHash.slice(1) : rawHash);
      const queryParams = new URLSearchParams(window.location.search || '');
      const get = (k: string) => hashParams.get(k) || queryParams.get(k);
      return {
        type: get('type') || undefined,
        access_token: get('access_token') || undefined,
        refresh_token: get('refresh_token') || undefined,
        code: get('code') || undefined,
        token_hash: get('token_hash') || get('token') || undefined,
        error_code: get('error_code') || undefined,
        error_description: get('error_description') || undefined,
      };
    };

    const tryProcessAuthFromUrl = async () => {
      try {
        const params = parseParams();

        if (params.error_code) {
          console.error('[LicenseResetPassword] auth error:', params.error_code, params.error_description);
        }

        if (params.type === 'recovery' && params.access_token && params.refresh_token) {
          const { error } = await supabase.auth.setSession({
            access_token: params.access_token,
            refresh_token: params.refresh_token,
          });
          if (error) console.error('[LicenseResetPassword] setSession error:', error);
          return;
        }

        if (params.code) {
          const { error } = await supabase.auth.exchangeCodeForSession(params.code);
          if (error) console.error('[LicenseResetPassword] exchangeCodeForSession error:', error);
          return;
        }

        if (params.type === 'recovery' && params.token_hash) {
          const { error } = await supabase.auth.verifyOtp({
            type: 'recovery',
            token_hash: params.token_hash,
          } as any);
          if (error) console.error('[LicenseResetPassword] verifyOtp error:', error);
          return;
        }
      } catch (e) {
        console.error('[LicenseResetPassword] URL processing error:', e);
      }
    };

    tryProcessAuthFromUrl();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (!cancelled && (event === 'PASSWORD_RECOVERY' || (newSession && newSession.user))) {
        setError('');
        setVerifying(false);
      }
    });

    const timer = setTimeout(() => {
      if (!cancelled) {
        if (!session) {
          toast({
            title: 'Enlace inválido o expirado',
            description: 'El enlace de recuperación es inválido o ha expirado. Por favor, solicita uno nuevo.',
            variant: 'destructive',
          });
          navigate('/license/forgot-password');
        } else {
          setVerifying(false);
        }
      }
    }, 12000);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, [session, navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);

    const { error } = await updatePassword(password);

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      toast({
        title: 'Contraseña actualizada',
        description: 'Tu contraseña ha sido cambiada exitosamente',
      });
      navigate('/license/auth?mode=signin');
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-gray-50 p-4">
        <Card className="w-full max-w-md border-0 shadow-2xl bg-card/95 backdrop-blur-sm">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-800 mb-4" />
            <p className="text-muted-foreground">Verificando enlace de recuperación...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-gray-50 p-4">
      <Card className="w-full max-w-md border-0 shadow-2xl bg-card/95 backdrop-blur-sm">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 p-3 rounded-full bg-gray-100">
            <Shield className="h-8 w-8 text-gray-800" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Nueva Contraseña
          </CardTitle>
          <CardDescription>
            Ingresa tu nueva contraseña para tu Fighter ID
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Nueva Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="h-11 pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-11 w-11 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="h-11"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-gray-900 hover:bg-gray-800 text-white font-medium"
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Cambiar Contraseña
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
