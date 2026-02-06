import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * AuthCallback handles Supabase auth redirects including:
 * - Email confirmation
 * - Password reset
 * - Magic links
 * - OAuth callbacks
 * 
 * Supabase redirects to this page with tokens in the URL hash or query params.
 */
export default function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verificando...');
  const [errorDetails, setErrorDetails] = useState('');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('[AuthCallback] Processing auth callback...');
        console.log('[AuthCallback] URL:', window.location.href);
        console.log('[AuthCallback] Hash:', window.location.hash);
        console.log('[AuthCallback] Search:', window.location.search);

        // Check for error in URL params first
        const urlParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        
        const error = urlParams.get('error') || hashParams.get('error');
        const errorDescription = urlParams.get('error_description') || hashParams.get('error_description');
        
        if (error) {
          console.error('[AuthCallback] Error in URL:', error, errorDescription);
          setStatus('error');
          setMessage('Error de verificación');
          setErrorDetails(errorDescription || error);
          return;
        }

        // Get the auth event type
        const type = urlParams.get('type') || hashParams.get('type');
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        console.log('[AuthCallback] Type:', type, 'Has tokens:', !!accessToken);

        // If we have tokens in hash, set the session
        if (accessToken && refreshToken) {
          console.log('[AuthCallback] Setting session from tokens...');
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) {
            console.error('[AuthCallback] Session error:', sessionError);
            throw sessionError;
          }

          console.log('[AuthCallback] Session set successfully:', data.user?.id);
        }

        // Verify we now have a valid session
        const { data: { session }, error: getSessionError } = await supabase.auth.getSession();
        
        if (getSessionError) {
          console.error('[AuthCallback] Get session error:', getSessionError);
          throw getSessionError;
        }

        if (!session) {
          // Try to exchange the token if we don't have a session yet
          console.log('[AuthCallback] No session, checking for verification flow...');
          
          // For email confirmation, Supabase may have already verified
          // Just show success and redirect to login
          if (type === 'signup' || type === 'email') {
            setStatus('success');
            setMessage('¡Email confirmado exitosamente!');
            
            setTimeout(() => {
              navigate('/license/auth?confirmed=true', { replace: true });
            }, 2000);
            return;
          }

          throw new Error('No se pudo establecer la sesión');
        }

        // Session is valid
        console.log('[AuthCallback] Session verified:', session.user.id);
        
        // Handle different auth types
        if (type === 'recovery') {
          setStatus('success');
          setMessage('Verificación exitosa. Redirigiendo...');
          setTimeout(() => {
            navigate('/license/reset-password', { replace: true });
          }, 1500);
        } else {
          // Signup confirmation or other
          setStatus('success');
          setMessage('¡Cuenta verificada exitosamente!');
          
          // Clean up URL
          window.history.replaceState({}, '', '/auth/callback');
          
          setTimeout(() => {
            navigate('/', { replace: true });
          }, 2000);
        }

      } catch (err: any) {
        console.error('[AuthCallback] Error:', err);
        setStatus('error');
        setMessage('Error de verificación');
        setErrorDetails(err.message || 'Por favor intenta de nuevo');
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 p-4">
      <div className="text-center max-w-md">
        {status === 'loading' && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4" />
            <p className="text-foreground/80 text-lg">{message}</p>
            <p className="text-muted-foreground text-sm mt-2">Por favor espera...</p>
          </>
        )}
        
        {status === 'success' && (
          <div className="animate-fade-in">
            <div className="bg-green-500/20 rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">{message}</h2>
            <p className="text-muted-foreground">Serás redirigido automáticamente...</p>
          </div>
        )}
        
        {status === 'error' && (
          <div className="animate-fade-in">
            <div className="bg-destructive/20 rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <XCircle className="w-12 h-12 text-destructive" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">{message}</h2>
            <p className="text-destructive/80 mb-6">{errorDetails}</p>
            
            <div className="space-y-3">
              <Button 
                onClick={() => navigate('/license/auth', { replace: true })}
                className="w-full bg-primary hover:bg-primary/90"
              >
                Ir a Iniciar Sesión
              </Button>
              <Button 
                variant="outline"
                onClick={() => navigate('/license/auth?mode=signup', { replace: true })}
                className="w-full border-border"
              >
                Registrarse de nuevo
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
