import { useState, useEffect } from 'react';
import { Navigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UserCheck, Mail, HelpCircle, ArrowLeft } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import fighterIdLogo from '@/assets/fighter-id-logo-auth.png';
import { useFighterInvitations } from '@/hooks/useFighterInvitations';
import { supabase } from '@/integrations/supabase/client';

type AuthStep = 'email' | 'login' | 'register';

export default function Auth() {
  const { user, signIn, signUp, resendConfirmation } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect');
  const inviteToken = searchParams.get('invite');
  const { validateToken } = useFighterInvitations();
  const [invitation, setInvitation] = useState<any>(null);
  const [validatingToken, setValidatingToken] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const [step, setStep] = useState<AuthStep>('email');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Redirect fighter invitations to license auth flow
  useEffect(() => {
    if (inviteToken) {
      window.location.href = `/license/auth?mode=signup&invite=${inviteToken}`;
    }
  }, [inviteToken]);

  // Validate invitation token
  useEffect(() => {
    const checkInvitation = async () => {
      if (inviteToken) {
        setValidatingToken(true);
        const invitationData = await validateToken(inviteToken);
        if (invitationData) {
          setInvitation(invitationData);
          setEmail(invitationData.email);
          toast({
            title: 'Invitación válida',
            description: `Bienvenido ${invitationData.first_name}! Completa tu registro.`,
          });
        } else {
          toast({
            title: 'Invitación inválida',
            description: 'El link de invitación ha expirado o no es válido',
            variant: 'destructive',
          });
        }
        setValidatingToken(false);
      }
    };
    checkInvitation();
  }, [inviteToken]);

  // Cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Detect email confirmation redirect
  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get('type');
    if (type === 'signup' || type === 'email') {
      toast({
        title: 'Email confirmado',
        description: 'Tu cuenta ha sido verificada. Ahora puedes iniciar sesión.',
      });
      setStep('login');
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }, [toast]);

  // Redirect if already authenticated
  if (user && !adminLoading) {
    if (redirectTo) {
      return <Navigate to={redirectTo} replace />;
    }
    if (isAdmin === true) {
      return <Navigate to="/admin/dashboard" replace />;
    } else if (isAdmin === false) {
      return <Navigate to="/" replace />;
    }
  }

  const checkEmailExists = async (emailToCheck: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke('check-email-exists', {
        body: { email: emailToCheck },
      });
      if (error) return false;
      return data?.exists ?? false;
    } catch {
      return false;
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setCheckingEmail(true);
    const exists = await checkEmailExists(email);
    setCheckingEmail(false);

    setStep(exists ? 'login' : 'register');
  };

  const handleBackToEmail = () => {
    setStep('email');
    setPassword('');
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) {
      toast({ title: 'Error de autenticación', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Bienvenido', description: 'Has iniciado sesión correctamente' });
    }
    setLoading(false);
  };

  const handleResendEmail = async () => {
    if (resendCooldown > 0 || !registeredEmail) return;
    setIsResending(true);
    const { error } = await resendConfirmation(registeredEmail);
    if (error) {
      toast({ title: 'Error al reenviar', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Correo reenviado', description: 'Revisa tu bandeja de entrada' });
      setResendCooldown(60);
    }
    setIsResending(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setRegistrationSuccess(false);

    try {
      const { error: signUpError } = await signUp(email, password);

      if (signUpError) {
        if (signUpError.message?.includes('For security purposes') || signUpError.message?.includes('email_send_rate_limit')) {
          throw new Error('Has intentado registrarte varias veces. Espera 60 segundos.');
        }
        if (signUpError.message?.includes('already registered') || 
            signUpError.message?.includes('already exists') ||
            signUpError.message?.includes('Database error')) {
          toast({ title: 'Cuenta existente', description: 'Este correo ya está registrado en el sistema. Intenta iniciar sesión o recupera tu contraseña.' });
          setTimeout(() => setStep('login'), 1500);
          setLoading(false);
          return;
        }
        throw signUpError;
      }

      if (invitation && inviteToken) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        const { data: { user: newUser } } = await supabase.auth.getUser();
        if (newUser) {
          const { data: appUser, error: appUserError } = await supabase
            .from('app_user')
            .select('id')
            .eq('auth_user_id', newUser.id)
            .single();

          if (appUserError || !appUser) throw new Error('Error configurando perfil');

          const { data: fighterProfile, error: profileError } = await supabase
            .from('fighter_profiles')
            .insert({
              user_id: appUser.id,
              first_name: invitation.first_name,
              last_name: invitation.last_name,
              weight_class: invitation.weight_class || 'Peso Ligero',
              country: 'Honduras',
            })
            .select('id')
            .single();

          if (profileError) throw profileError;

          const { error: acceptError } = await supabase.rpc('accept_fighter_invitation', {
            p_token: inviteToken,
            p_fighter_profile_id: fighterProfile.id,
          });
          if (acceptError) throw acceptError;

          toast({ title: 'Registro completo', description: 'Tu perfil de peleador ha sido creado' });
        }
      } else {
        setRegistrationSuccess(true);
        setRegisteredEmail(email);
      }
    } catch (error: any) {
      toast({ title: 'Error de registro', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <img src={fighterIdLogo} alt="Fighter ID Logo" className="w-32 mx-auto mb-2" />
          <CardTitle className="text-2xl font-bold">Acceso a Fighter ID</CardTitle>
          <CardDescription>
            {step === 'email' && 'Ingresa tu email para continuar'}
            {step === 'login' && 'Ingresa tu contraseña para acceder'}
            {step === 'register' && (registrationSuccess ? '¡Registro exitoso!' : 'Crea tu cuenta para continuar')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* STEP 1: Email */}
          {step === 'email' && (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium" htmlFor="auth-email">Email</label>
                <Input
                  id="auth-email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  disabled={!!invitation}
                />
              </div>
              <Button type="submit" className="w-full" disabled={checkingEmail}>
                {checkingEmail && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Continuar
              </Button>
              <div className="text-center">
                <Link to="/auth/forgot-password" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <HelpCircle className="h-3.5 w-3.5" />
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
            </form>
          )}

          {/* STEP 2A: Login */}
          {step === 'login' && (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="bg-muted rounded-lg p-3">
                <p className="text-sm text-muted-foreground">Email:</p>
                <p className="font-medium">{email}</p>
              </div>

              <div>
                <label className="text-sm font-medium" htmlFor="auth-password">Contraseña</label>
                <Input
                  id="auth-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Iniciar Sesión
              </Button>

              <div className="flex flex-col gap-2 pt-2 border-t border-border/50">
                <Link
                  to="/auth/forgot-password"
                  className="inline-flex items-center justify-center text-sm font-medium text-primary hover:text-primary/80 underline underline-offset-4"
                >
                  <HelpCircle className="w-4 h-4 mr-1.5" />
                  ¿Olvidaste tu contraseña?
                </Link>
                <p className="text-xs text-muted-foreground px-2">
                  Te enviaremos un correo con un enlace seguro para crear una nueva contraseña. El enlace es válido por 24 horas.
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleBackToEmail}
                  className="text-sm"
                >
                  <ArrowLeft className="w-4 h-4 mr-1.5" />
                  Usar otro email
                </Button>
              </div>
            </form>
          )}

          {/* STEP 2B: Register */}
          {step === 'register' && (
            <div>
              {registrationSuccess && (
                <Alert className="mb-4 bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800">
                  <AlertDescription className="space-y-3">
                    <p className="font-semibold text-blue-900 dark:text-blue-100">
                      ✉️ ¡Registro exitoso! Revisa tu correo electrónico
                    </p>
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      Te hemos enviado un correo de confirmación a:
                    </p>
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100 bg-blue-100 dark:bg-blue-900/30 px-3 py-2 rounded">
                      {registeredEmail}
                    </p>
                    <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                      <p>⚠️ <strong>Importante:</strong> Revisa tu carpeta de spam/promociones</p>
                      <p>🕒 El enlace es válido por <strong>24 horas</strong></p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full mt-2"
                      onClick={handleResendEmail}
                      disabled={resendCooldown > 0 || isResending}
                    >
                      {isResending ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Reenviando...</>
                      ) : resendCooldown > 0 ? (
                        <><Mail className="mr-2 h-4 w-4" />Reenviar en {resendCooldown}s</>
                      ) : (
                        <><Mail className="mr-2 h-4 w-4" />Reenviar correo</>
                      )}
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              {invitation && (
                <div className="mb-4 p-4 bg-primary/10 border border-primary/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <UserCheck className="h-5 w-5 text-primary" />
                    <p className="text-sm font-medium text-white">Invitación de Fighter ID</p>
                  </div>
                  <p className="text-sm text-white/90">
                    Has sido invitado como: <strong>{invitation.first_name} {invitation.last_name}</strong>
                  </p>
                </div>
              )}

              {!registrationSuccess && (
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="bg-muted rounded-lg p-3 mb-2">
                    <p className="text-sm text-muted-foreground">Nuevo registro para:</p>
                    <p className="font-medium">{email}</p>
                  </div>

                  {!invitation && (
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        Después del registro podrás crear tu <strong>Fighter ID</strong> si deseas ser peleador profesional.
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium" htmlFor="signup-password">Contraseña</label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={loading || validatingToken}>
                    {(loading || validatingToken) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {invitation ? 'Completar Registro' : 'Registrarse'}
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleBackToEmail}
                    className="w-full text-sm"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1.5" />
                    Usar otro email
                  </Button>
                </form>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
