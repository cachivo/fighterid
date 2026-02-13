import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Eye, EyeOff, Shield, Mail, CheckCircle, HelpCircle, ArrowLeft, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type AuthStep = 'email' | 'login' | 'register';

export default function LicenseAuth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signIn, signUp, loading, user, resendConfirmation } = useAuth();

  // Flow state
  const [step, setStep] = useState<AuthStep>('email');
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Form data
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [country, setCountry] = useState('HN');
  const [birthdate, setBirthdate] = useState('');
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState('');

  // Handle email confirmation from URL params
  useEffect(() => {
    const confirmed = searchParams.get('confirmed');
    if (confirmed === 'true') {
      toast.success('¡Email confirmado! Ahora puedes iniciar sesión.');
    }
  }, [searchParams]);

  // Handle auth callback with tokens in hash
  useEffect(() => {
    const handleHashCallback = async () => {
      const hash = window.location.hash;
      if (!hash || !hash.includes('access_token')) return;

      try {
        const hashParams = new URLSearchParams(hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');

        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            toast.error('Error al verificar cuenta. Intenta de nuevo.');
          } else {
            window.history.replaceState({}, '', window.location.pathname);
            if (type === 'signup' || type === 'email') {
              toast.success('¡Cuenta confirmada exitosamente!');
            }
          }
        }
      } catch (err) {
        console.error('[LicenseAuth] Hash callback error:', err);
      }
    };

    handleHashCallback();
  }, []);

  // Smart routing for authenticated users
  useEffect(() => {
    const routeAuthenticatedUser = async () => {
      if (!user || loading) return;

      try {
        const { data: appUser } = await supabase
          .from('app_user')
          .select('id')
          .eq('auth_user_id', user.id)
          .maybeSingle();

        if (!appUser) {
          navigate('/license/onboarding');
          return;
        }

        const { data: fighterProfile } = await supabase
          .from('fighter_profiles')
          .select('id')
          .eq('user_id', appUser.id)
          .maybeSingle();

        if (!fighterProfile) {
          navigate('/license/onboarding');
          return;
        }

        const { data: license } = await supabase
          .from('fighter_licenses')
          .select('status')
          .eq('fighter_id', fighterProfile.id)
          .maybeSingle();

        if (!license) {
          navigate('/license/onboarding');
          return;
        }

        switch (license.status) {
          case 'ACTIVE':
            navigate('/license/dashboard');
            break;
          case 'PENDING_REVIEW':
          case 'APPLIED':
            navigate('/license/pending');
            break;
          case 'SUSPENDED':
          case 'REVOKED':
            navigate('/license/suspended');
            break;
          default:
            navigate('/license/onboarding');
        }
      } catch (error) {
        console.error('[LicenseAuth] Error routing user:', error);
        navigate('/license/onboarding');
      }
    };

    routeAuthenticatedUser();
  }, [user, loading, navigate]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // If mode=signup is in URL, pre-set to register flow (but still start with email step)
  useEffect(() => {
    const mode = searchParams.get('mode');
    if (mode === 'signup') {
      // We still start with email step, but could auto-advance if needed
    }
  }, [searchParams]);

  const checkEmailExists = async (emailToCheck: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke('check-email-exists', {
        body: { email: emailToCheck },
      });

      if (error) {
        console.error('Error checking email:', error);
        return false;
      }

      return data?.exists ?? false;
    } catch (err) {
      console.error('Error checking email:', err);
      return false;
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Ingresa tu email para continuar');
      return;
    }

    setCheckingEmail(true);
    const exists = await checkEmailExists(email);
    setCheckingEmail(false);

    if (exists) {
      setStep('login');
    } else {
      setStep('register');
    }
  };

  const handleBackToEmail = () => {
    setStep('email');
    setPassword('');
    setFirstName('');
    setLastName('');
    setBirthdate('');
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatar(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await signIn(email, password);
    if (error) {
      toast.error(error.message || 'Credenciales inválidas');
    } else {
      toast.success('Sesión iniciada correctamente');
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Email y contraseña son requeridos');
      return;
    }
    if (!firstName || !lastName) {
      toast.error('Nombre y apellido son requeridos');
      return;
    }
    if (!birthdate) {
      toast.error('Fecha de nacimiento es requerida');
      return;
    }

    try {
      let avatarUrl = '';
      if (avatar) {
        const fileExt = avatar.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, avatar);
        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from('avatars')
            .getPublicUrl(fileName);
          avatarUrl = urlData.publicUrl;
        }
      }

      const { error } = await signUp(email, password);
      if (error) {
        toast.error(error.message || 'Error al registrarse');
        return;
      }

      setEmailSuccess(true);
      toast.success('¡Registro exitoso! Revisa tu email para confirmar tu cuenta.');
    } catch (error: any) {
      console.error('Signup error:', error);
      toast.error(error.message || 'Error al registrarse');
    }
  };

  const handleResendEmail = async () => {
    if (resendCooldown > 0) return;
    try {
      const { error } = await resendConfirmation(email);
      if (error) {
        toast.error(error.message || 'Error al reenviar email');
      } else {
        toast.success('Email reenviado correctamente');
        setResendCooldown(60);
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al reenviar email');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-red-950/20 to-slate-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-400 mx-auto mb-4"></div>
          <p className="text-gold-200">Cargando...</p>
        </div>
      </div>
    );
  }

  const inputClasses = "bg-slate-900/50 border-purple-500/30 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300";
  const labelClasses = "text-white/90 group-focus-within:text-purple-400 transition-colors duration-300";
  const buttonClasses = "w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] transition-all duration-300";

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4 relative overflow-hidden">
      {/* Background nebulas */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-slate-950 to-black" />
      <div className="absolute inset-0 bg-[url('/lovable-uploads/octagon-background.png')] opacity-[0.02] bg-cover bg-center" />
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-purple-600/15 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '8s' }} />
      <div className="absolute top-1/4 right-0 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s', animationDuration: '10s' }} />
      <div className="absolute bottom-0 left-1/4 w-[450px] h-[450px] bg-indigo-600/12 rounded-full blur-[110px] animate-pulse" style={{ animationDelay: '4s', animationDuration: '12s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-600/8 rounded-full blur-[130px] animate-pulse" style={{ animationDelay: '6s', animationDuration: '14s' }} />
      <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] bg-cyan-600/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s', animationDuration: '9s' }} />

      <Card className="w-full max-w-md bg-slate-950/95 border-purple-500/30 backdrop-blur-xl shadow-[0_0_50px_rgba(168,85,247,0.15)] relative z-10 animate-fade-in">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4 animate-scale-in">
            <div className="relative">
              <Shield className="w-12 h-12 text-gold-400 relative z-10" />
              <div className="absolute inset-0 bg-gold-400/30 blur-xl animate-pulse" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-white bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text">
            Fighter ID Portal
          </CardTitle>
          <CardDescription className="text-white/80">
            {step === 'email' && 'Ingresa tu email para continuar'}
            {step === 'login' && 'Ingresa tu contraseña'}
            {step === 'register' && (emailSuccess ? '¡Revisa tu correo!' : 'Crea tu cuenta')}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* STEP 1: Email input */}
          {step === 'email' && (
            <form onSubmit={handleEmailSubmit} className="space-y-4 animate-fade-in">
              <div className="group">
                <Label htmlFor="email-step" className={labelClasses}>Email</Label>
                <Input
                  id="email-step"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  required
                  autoFocus
                  className={inputClasses}
                />
              </div>

              <Button type="submit" className={buttonClasses} disabled={checkingEmail}>
                {checkingEmail ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  'Continuar'
                )}
              </Button>
            </form>
          )}

          {/* STEP 2A: Login (email exists) */}
          {step === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4 animate-fade-in">
              <div className="bg-slate-900/60 rounded-lg p-3 border border-purple-500/20">
                <p className="text-sm text-white/70">Email:</p>
                <p className="text-white font-medium">{email}</p>
              </div>

              <div className="relative group">
                <Label htmlFor="login-password" className={labelClasses}>Contraseña</Label>
                <Input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoFocus
                  minLength={6}
                  className={inputClasses}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-6 h-9 w-9 hover:text-purple-400 transition-colors duration-300"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>

              <Button type="submit" className={buttonClasses} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Iniciando sesión...
                  </>
                ) : (
                  'Iniciar Sesión'
                )}
              </Button>

              <div className="flex flex-col gap-2 pt-2">
                <Button
                  type="button"
                  variant="link"
                  onClick={() => navigate('/license/forgot-password')}
                  className="text-gold-400 hover:text-gold-300 font-medium underline underline-offset-4"
                >
                  <HelpCircle className="w-4 h-4 mr-1.5" />
                  ¿Olvidaste tu contraseña?
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleBackToEmail}
                  className="text-white/60 hover:text-white"
                >
                  <ArrowLeft className="w-4 h-4 mr-1.5" />
                  Usar otro email
                </Button>
              </div>
            </form>
          )}

          {/* STEP 2B: Register (email does not exist) */}
          {step === 'register' && (
            <div className="animate-fade-in">
              {emailSuccess ? (
                <div className="space-y-6 py-4">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="bg-green-500/20 rounded-full p-4 animate-bounce">
                      <CheckCircle className="h-12 w-12 text-green-500" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-2">¡Revisa tu correo!</h3>
                      <p className="text-white/90">Hemos enviado un email de confirmación a</p>
                      <p className="text-gold-400 font-semibold mt-1">{email}</p>
                    </div>

                    <div className="bg-slate-900/60 rounded-lg p-4 w-full max-w-sm border border-purple-500/20">
                      <p className="text-sm font-medium text-white mb-3">Sigue estos pasos:</p>
                      <ol className="text-left text-sm text-white/80 space-y-2">
                        <li className="flex items-start gap-2">
                          <span className="bg-purple-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0">1</span>
                          <span>Busca un email de <strong className="text-gold-400">Fighter ID</strong></span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="bg-purple-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0">2</span>
                          <span>Revisa <strong className="text-gold-400">spam</strong> o <strong className="text-gold-400">promociones</strong></span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="bg-purple-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0">3</span>
                          <span>Haz clic en <strong className="text-gold-400">"Confirmar mi cuenta"</strong></span>
                        </li>
                      </ol>
                    </div>

                    <p className="text-xs text-white/50">⏱️ El email puede tardar 2-3 minutos</p>

                    <div className="flex flex-col sm:flex-row gap-3 w-full px-4">
                      <Button
                        variant="outline"
                        onClick={handleResendEmail}
                        disabled={resendCooldown > 0}
                        className="flex-1 border-purple-500/30 hover:bg-purple-500/10"
                      >
                        <Mail className="w-4 h-4 mr-2" />
                        {resendCooldown > 0 ? `Reenviar en ${resendCooldown}s` : 'Reenviar email'}
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setEmailSuccess(false);
                          handleBackToEmail();
                        }}
                        className="flex-1 border border-gold-500/30 hover:bg-gold-500/10"
                      >
                        Cambiar correo
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="bg-slate-900/60 rounded-lg p-3 border border-purple-500/20 mb-2">
                    <p className="text-sm text-white/70">Nuevo registro para:</p>
                    <p className="text-white font-medium">{email}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="group">
                      <Label htmlFor="firstName" className={labelClasses}>Nombre</Label>
                      <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Juan" required className={inputClasses} autoFocus />
                    </div>
                    <div className="group">
                      <Label htmlFor="lastName" className={labelClasses}>Apellido</Label>
                      <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Pérez" required className={inputClasses} />
                    </div>
                  </div>

                  <div className="relative group">
                    <Label htmlFor="signup-password" className={labelClasses}>Contraseña</Label>
                    <Input
                      id="signup-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={6}
                      className={inputClasses}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-6 h-9 w-9 hover:text-purple-400 transition-colors duration-300"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="group">
                      <Label htmlFor="birthdate" className={labelClasses}>Fecha de Nacimiento</Label>
                      <Input id="birthdate" type="date" value={birthdate} onChange={(e) => setBirthdate(e.target.value)} required className={inputClasses} />
                    </div>
                    <div className="group">
                      <Label htmlFor="country" className={labelClasses}>País</Label>
                      <Input id="country" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="HN" required className={inputClasses} />
                    </div>
                  </div>

                  <div className="group">
                    <Label htmlFor="avatar" className={labelClasses}>Foto de Perfil (Opcional)</Label>
                    <Input id="avatar" type="file" accept="image/*" onChange={handleAvatarChange} className={inputClasses} />
                    {avatarPreview && (
                      <img src={avatarPreview} alt="Preview" className="mt-2 w-24 h-24 object-cover rounded-full border-2 border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.5)] animate-scale-in" />
                    )}
                  </div>

                  <Button type="submit" className={buttonClasses} disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creando cuenta...
                      </>
                    ) : (
                      'Crear Cuenta'
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleBackToEmail}
                    className="w-full text-white/60 hover:text-white"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1.5" />
                    Usar otro email
                  </Button>

                  <p className="text-sm text-center text-gold-400/90 mt-2 font-medium">
                    ¿Eres peleador? Podrás solicitar tu Fighter ID después del registro.
                  </p>
                </form>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
