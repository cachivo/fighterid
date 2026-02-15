import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import fighterIdLogo from '@/assets/fighter-id-logo-auth.png';

export default function ResetPassword() {
  const { updatePassword, session } = useAuth();
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
          console.error('[ResetPassword] auth error:', params.error_code, params.error_description);
        }

        // Case A: access_token/refresh_token in URL (hash or query)
        if (params.type === 'recovery' && params.access_token && params.refresh_token) {
          const { error } = await supabase.auth.setSession({
            access_token: params.access_token,
            refresh_token: params.refresh_token,
          });
          if (error) console.error('[ResetPassword] setSession error:', error);
          return;
        }

        // Case B: code param present
        if (params.code) {
          const { error } = await supabase.auth.exchangeCodeForSession(params.code);
          if (error) console.error('[ResetPassword] exchangeCodeForSession error:', error);
          return;
        }

        // Case C: token_hash (or token) provided for recovery
        if (params.type === 'recovery' && params.token_hash) {
          const { error } = await supabase.auth.verifyOtp({
            type: 'recovery',
            token_hash: params.token_hash,
          } as any);
          if (error) console.error('[ResetPassword] verifyOtp error:', error);
          return;
        }
      } catch (e) {
        console.error('[ResetPassword] URL processing error:', e);
      }
    };

    // Start processing URL (no Supabase calls inside the listener)
    tryProcessAuthFromUrl();

    // Listen for auth state changes to end verifying state when session is ready
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (!cancelled && (event === 'PASSWORD_RECOVERY' || (newSession && newSession.user))) {
        setError('');
        setVerifying(false);
      }
    });

    // Extra time for Supabase to process the link
    const timer = setTimeout(() => {
      if (!cancelled) {
        if (!session) {
          setError('El enlace de recuperación es inválido o ha expirado. Por favor, solicita uno nuevo.');
        }
        setVerifying(false);
      }
    }, 12000);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, [session]);

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
      navigate('/');
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <img src={fighterIdLogo} alt="Fighter ID Logo" className="w-32 mb-4" />
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Verificando enlace de recuperación...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <img src={fighterIdLogo} alt="Fighter ID Logo" className="w-32 mx-auto mb-2" />
          <CardTitle className="text-2xl font-bold">Nueva Contraseña</CardTitle>
          <CardDescription>
            {session ? 'Ingresa tu nueva contraseña' : 'Enlace de recuperación inválido'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && !session && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="ml-2">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {!session ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                El enlace de recuperación puede haber expirado o ya fue utilizado. 
                Solicita un nuevo enlace para continuar.
              </p>
              <Link to="/auth/forgot-password" className="w-full">
                <Button type="button" variant="default" className="w-full">
                  Solicitar nuevo enlace
                </Button>
              </Link>
              <Link to="/auth" className="w-full">
                <Button type="button" variant="outline" className="w-full">
                  Volver al inicio de sesión
                </Button>
              </Link>
            </div>
          ) : (
            <>
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
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
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
              />
            </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Cambiar Contraseña
                </Button>
              </form>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
