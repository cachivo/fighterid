import { useState, useEffect } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { Shield, Eye, EyeOff, Loader2, Mail, UserCheck, User } from 'lucide-react';
import { useLicenseAuth } from '@/hooks/useLicenseAuth';
import { useFighterInvitations } from '@/hooks/useFighterInvitations';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

export default function LicenseAuth() {
  const { user, signIn, signUp, loading, resendConfirmation } = useLicenseAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get('invite');
  const { validateToken } = useFighterInvitations();
  const [invitation, setInvitation] = useState<any>(null);
  const [validatingToken, setValidatingToken] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [registrationStep, setRegistrationStep] = useState(0); // 0: account type, 1: basic info, 2: fighter info
  const [accountType, setAccountType] = useState<'fighter' | 'user' | null>(null);
  
  const [formData, setFormData] = useState({
    // Auth
    email: '',
    password: '',
    // Basic info
    phone: '',
    firstName: '',
    lastName: '',
    // Fighter-specific
    nickname: '',
    country: 'HN',
    weightClass: '',
    heightCm: '',
    weightKg: '',
    reachCm: '',
    martialArts: [] as string[],
    gymName: '',
    stance: '',
    level: '',
    birthdate: '',
    gender: '',
    bio: ''
  });
  
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);

  // Validate invitation token on mount if present
  useEffect(() => {
    const checkInvitation = async () => {
      if (inviteToken) {
        setValidatingToken(true);
        console.info('[LicenseAuth] Validating invitation token:', inviteToken);
        const invitationData = await validateToken(inviteToken);
        
        if (invitationData) {
          setInvitation(invitationData);
          setFormData(prev => ({
            ...prev,
            email: invitationData.email
          }));
          console.info('[LicenseAuth] Valid invitation found:', invitationData);
          toast({
            title: 'Invitación válida',
            description: `Bienvenido ${invitationData.first_name}! Completa tu registro.`,
          });
        } else {
          console.warn('[LicenseAuth] Invalid or expired invitation token');
          toast({
            title: 'Invitación inválida',
            description: 'El link ha expirado o no es válido',
            variant: 'destructive',
          });
        }
        setValidatingToken(false);
      }
    };
    
    checkInvitation();
  }, [inviteToken]);

  // Preselect tab and account type based on query parameters
  useEffect(() => {
    const mode = searchParams.get('mode');
    const type = searchParams.get('type');
    
    if (mode === 'signup' || mode === 'register') {
      setIsLogin(false);
      // Pre-select account type if provided
      if (type === 'fighter') {
        setAccountType('fighter');
      } else if (type === 'user') {
        setAccountType('user');
      }
      console.info('[LicenseAuth] Mode:', mode, 'Type:', type, 'Has invitation:', !!invitation);
    } else if (mode === 'signin' || mode === 'login') {
      setIsLogin(true);
      console.info('[LicenseAuth] Mode:', mode, 'Has invitation:', !!invitation);
    }
  }, [searchParams, invitation]);

  // Cooldown timer - MUST be before early return
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Redirect if already authenticated - AFTER all hooks
  if (user && !loading) {
    return <Navigate to="/license/dashboard" replace />;
  }

  const handleResendEmail = async () => {
    if (resendCooldown > 0 || !registeredEmail) return;
    
    setIsResending(true);
    const { error } = await resendConfirmation(registeredEmail);
    
    if (error) {
      toast({
        title: 'Error al reenviar',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Correo reenviado',
        description: 'Revisa tu bandeja de entrada',
      });
      setResendCooldown(60);
    }
    setIsResending(false);
  };

  const handleNextStep = () => {
    if (registrationStep === 0 && accountType) {
      setRegistrationStep(1);
    } else if (registrationStep === 1) {
      if (accountType === 'user') {
        handleSubmit();
      } else {
        setRegistrationStep(2);
      }
    }
  };

  const handleSubmit = async () => {
    setError('');
    setRegistrationSuccess(false);
    setIsSubmitting(true);

    try {
      // 1. Create auth account
      const { error: signUpError, data: authData } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/license/dashboard`
        }
      });

      if (signUpError) {
        if (signUpError.message?.includes('For security purposes') || signUpError.message?.includes('email_send_rate_limit')) {
          setError('Has intentado registrarte varias veces. Por favor espera 60 segundos antes de intentar nuevamente.');
          return;
        }
        if (signUpError.message?.includes('already registered')) {
          toast({
            title: 'Cuenta existente detectada',
            description: 'Este email ya está registrado. Te llevamos a Iniciar Sesión.',
          });
          setIsLogin(true);
          setError('');
          setRegistrationStep(0);
          return;
        }
        setError(signUpError.message);
        return;
      }

      // 2. Wait for app_user trigger
      await new Promise(resolve => setTimeout(resolve, 2000));

      const { data: { user: newUser } } = await supabase.auth.getUser();
      
      if (newUser) {
        const { data: appUser } = await supabase
          .from('app_user')
          .select('id')
          .eq('auth_user_id', newUser.id)
          .single();

        if (appUser) {
          // Update app_user with basic info
          await supabase
            .from('app_user')
            .update({
              first_name: formData.firstName,
              last_name: formData.lastName,
              phone: formData.phone,
              country: formData.country
            })
            .eq('id', appUser.id);
        }

        if (appUser && accountType === 'fighter') {
          // 3. Create fighter profile with all data
          const martialArtsString = formData.martialArts.join(',');
          
          const validDisciplines = ['MMA', 'Boxeo', 'Judo', 'JiuJitsu', 'Kickboxing', 'MuayThai', 'Grappling', 'Otro'] as const;
          type ValidDiscipline = typeof validDisciplines[number];
          const discipline: ValidDiscipline = formData.martialArts.length > 0 && 
            validDisciplines.includes(formData.martialArts[0] as ValidDiscipline)
              ? formData.martialArts[0] as ValidDiscipline
              : 'MMA';

          await supabase.rpc('create_fighter_profile_with_license', {
            p_first_name: formData.firstName,
            p_last_name: formData.lastName,
            p_country: formData.country,
            p_weight_class: formData.weightClass,
            p_height_cm: parseInt(formData.heightCm),
            p_weight_kg: parseFloat(formData.weightKg),
            p_phone: formData.phone || null,
            p_birthdate: formData.birthdate || null,
            p_nickname: formData.nickname || null,
            p_reach_cm: formData.reachCm ? parseInt(formData.reachCm) : null,
            p_discipline: discipline,
            p_martial_arts: martialArtsString,
            p_gym_name: formData.gymName || null,
            p_stance: formData.stance || null,
            p_level: formData.level || null,
            p_record_wins: 0,
            p_record_losses: 0,
            p_record_draws: 0,
            p_record_type: 'Amateur',
            p_gender: formData.gender || null,
            p_bio: formData.bio || null
          });

          toast({
            title: '✅ Fighter ID creado',
            description: 'Tu perfil está pendiente de revisión',
          });
        }
      }

      setRegistrationSuccess(true);
      setRegisteredEmail(formData.email);
      setResendCooldown(60);
      
    } catch (err: any) {
      console.error('[LicenseAuth] Error:', err);
      setError(err.message || 'Ha ocurrido un error inesperado');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const { error } = await signIn(formData.email, formData.password);
      if (error) {
        setError(error.message);
      }
    } catch (err: any) {
      console.error('[LicenseAuth] Error:', err);
      setError(err.message || 'Ha ocurrido un error inesperado');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };
  
  const handleMartialArtsChange = (art: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({...prev, martialArts: [...prev.martialArts, art]}));
    } else {
      setFormData(prev => ({...prev, martialArts: prev.martialArts.filter(a => a !== art)}));
    }
  };

  const weightClasses = [
    'Strawweight', 'Flyweight', 'Bantamweight', 'Featherweight',
    'Lightweight', 'Welterweight', 'Middleweight', 'Light Heavyweight', 'Heavyweight'
  ];

  const martialArts = [
    'MMA', 'Boxeo', 'Judo', 'JiuJitsu', 'Kickboxing', 'MuayThai', 'Grappling', 'Otro'
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-gray-800" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-gray-50 p-4">
      <div className="w-full max-w-md">
        <Card className="border-0 shadow-2xl bg-card/95 backdrop-blur-sm">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 p-3 rounded-full bg-gray-100">
              <Shield className="h-8 w-8 text-gray-800" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              {isLogin ? 'Acceso a tu Fighter ID' : 'Crear Fighter ID'}
            </CardTitle>
            <CardDescription>
              {isLogin 
                ? 'Ingresa a tu portal de peleador' 
                : 'Solicita tu Fighter ID'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {registrationSuccess && (
              <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800">
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
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Reenviando...
                      </>
                    ) : resendCooldown > 0 ? (
                      <>
                        <Mail className="mr-2 h-4 w-4" />
                        Reenviar en {resendCooldown}s
                      </>
                    ) : (
                      <>
                        <Mail className="mr-2 h-4 w-4" />
                        Reenviar correo
                      </>
                    )}
                  </Button>
                </AlertDescription>
              </Alert>
            )}
            
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {invitation && !isLogin && (
              <Alert className="bg-primary/10 border-primary/20">
                <AlertDescription>
                  <div className="flex items-center gap-2 mb-2">
                    <UserCheck className="h-5 w-5 text-primary" />
                    <p className="text-sm font-medium">Invitación de Fighter ID</p>
                  </div>
                  <p className="text-sm">
                    Has sido invitado como: <strong>{invitation.first_name} {invitation.last_name}</strong>
                  </p>
                  {invitation.weight_class && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Categoría: {invitation.weight_class}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Tu perfil se creará automáticamente al completar el registro
                  </p>
                </AlertDescription>
              </Alert>
            )}

            {!isLogin && !invitation && registrationStep === 0 && (
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold mb-2">¿Qué tipo de cuenta deseas?</h3>
                  <p className="text-sm text-muted-foreground">Selecciona el tipo de perfil que mejor se adapte a ti</p>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  <button
                    type="button"
                    onClick={() => setAccountType('fighter')}
                    className={`p-6 border-2 rounded-lg text-left transition-all hover:border-primary ${
                      accountType === 'fighter' ? 'border-primary bg-primary/5' : 'border-border'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <Shield className="h-8 w-8 text-primary flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-lg mb-1">Fighter ID (Peleador)</h4>
                        <p className="text-sm text-muted-foreground">
                          Crea tu perfil de peleador con licencia oficial, récord de peleas, y acceso a eventos
                        </p>
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAccountType('user')}
                    className={`p-6 border-2 rounded-lg text-left transition-all hover:border-primary ${
                      accountType === 'user' ? 'border-primary bg-primary/5' : 'border-border'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <User className="h-8 w-8 text-gray-600 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-lg mb-1">Usuario Común</h4>
                        <p className="text-sm text-muted-foreground">
                          Acceso básico para seguir eventos, votar y participar en la comunidad
                        </p>
                      </div>
                    </div>
                  </button>
                </div>

                <Button
                  type="button"
                  className="w-full h-11 bg-gray-900 hover:bg-gray-800 text-white font-medium"
                  onClick={handleNextStep}
                  disabled={!accountType}
                >
                  Continuar
                </Button>
              </div>
            )}

            {!isLogin && registrationStep === 1 && (
              <div className="space-y-4">
                <div className="mb-4">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setRegistrationStep(0)}
                  >
                    ← Volver
                  </Button>
                  <h3 className="text-lg font-semibold mt-2">
                    Información Básica
                    {accountType === 'fighter' && ' (Paso 1 de 2)'}
                  </h3>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Correo Electrónico</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="tu@correo.com"
                    required
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={handleInputChange}
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

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Nombre</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Apellido</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                      className="h-11"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+504 9999-9999"
                    required
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">País</Label>
                  <Select 
                    value={formData.country} 
                    onValueChange={(value) => setFormData(prev => ({...prev, country: value}))}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Selecciona tu país" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HN">Honduras</SelectItem>
                      <SelectItem value="SV">El Salvador</SelectItem>
                      <SelectItem value="GT">Guatemala</SelectItem>
                      <SelectItem value="NI">Nicaragua</SelectItem>
                      <SelectItem value="CR">Costa Rica</SelectItem>
                      <SelectItem value="PA">Panamá</SelectItem>
                      <SelectItem value="MX">México</SelectItem>
                      <SelectItem value="US">Estados Unidos</SelectItem>
                      <SelectItem value="CO">Colombia</SelectItem>
                      <SelectItem value="VE">Venezuela</SelectItem>
                      <SelectItem value="EC">Ecuador</SelectItem>
                      <SelectItem value="PE">Perú</SelectItem>
                      <SelectItem value="CL">Chile</SelectItem>
                      <SelectItem value="AR">Argentina</SelectItem>
                      <SelectItem value="BR">Brasil</SelectItem>
                      <SelectItem value="ES">España</SelectItem>
                      <SelectItem value="OTHER">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  type="button"
                  className="w-full h-11 bg-gray-900 hover:bg-gray-800 text-white font-medium"
                  onClick={handleNextStep}
                  disabled={!formData.email || !formData.password || !formData.firstName || !formData.lastName || !formData.phone || isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creando cuenta...
                    </>
                  ) : accountType === 'user' ? (
                    'Crear Cuenta'
                  ) : (
                    'Continuar al Paso 2'
                  )}
                </Button>
              </div>
            )}

            {!isLogin && registrationStep === 2 && accountType === 'fighter' && (
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                <div className="mb-4 sticky top-0 bg-card z-10 pb-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setRegistrationStep(1)}
                  >
                    ← Volver
                  </Button>
                  <h3 className="text-lg font-semibold mt-2">Información de Peleador (Paso 2 de 2)</h3>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nickname">Apodo / Nickname (Opcional)</Label>
                  <Input
                    id="nickname"
                    name="nickname"
                    value={formData.nickname}
                    onChange={handleInputChange}
                    placeholder="El Tigre"
                    className="h-11"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="birthdate">Fecha de Nacimiento</Label>
                    <Input
                      id="birthdate"
                      name="birthdate"
                      type="date"
                      value={formData.birthdate}
                      onChange={handleInputChange}
                      required
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">Género</Label>
                    <Select value={formData.gender} onValueChange={(value) => setFormData(prev => ({...prev, gender: value}))}>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="M">Masculino</SelectItem>
                        <SelectItem value="F">Femenino</SelectItem>
                        <SelectItem value="Otro">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Artes Marciales</Label>
                  <p className="text-sm text-muted-foreground mb-3">Selecciona todas las que practiques</p>
                  <div className="grid grid-cols-2 gap-3">
                    {martialArts.map((art) => (
                      <div key={art} className="flex items-center space-x-2">
                        <Checkbox
                          id={art}
                          checked={formData.martialArts.includes(art)}
                          onCheckedChange={(checked) => handleMartialArtsChange(art, checked as boolean)}
                        />
                        <Label htmlFor={art} className="text-sm font-normal cursor-pointer">
                          {art}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="heightCm">Altura (cm)</Label>
                    <Input
                      id="heightCm"
                      name="heightCm"
                      type="number"
                      value={formData.heightCm}
                      onChange={handleInputChange}
                      placeholder="170"
                      required
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="weightKg">Peso (kg)</Label>
                    <Input
                      id="weightKg"
                      name="weightKg"
                      type="number"
                      step="0.1"
                      value={formData.weightKg}
                      onChange={handleInputChange}
                      placeholder="70"
                      required
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reachCm">Alcance (cm)</Label>
                    <Input
                      id="reachCm"
                      name="reachCm"
                      type="number"
                      value={formData.reachCm}
                      onChange={handleInputChange}
                      placeholder="175"
                      className="h-11"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="weightClass">Categoría de Peso</Label>
                    <Select value={formData.weightClass} onValueChange={(value) => setFormData(prev => ({...prev, weightClass: value}))}>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        {weightClasses.map((wc) => (
                          <SelectItem key={wc} value={wc}>{wc}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="level">Nivel</Label>
                    <Select value={formData.level} onValueChange={(value) => setFormData(prev => ({...prev, level: value}))}>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Amateur">Amateur</SelectItem>
                        <SelectItem value="Semi-profesional">Semi-profesional</SelectItem>
                        <SelectItem value="Profesional">Profesional</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gymName">Gimnasio/Academia (Opcional)</Label>
                  <Input
                    id="gymName"
                    name="gymName"
                    value={formData.gymName}
                    onChange={handleInputChange}
                    placeholder="Team Alpha"
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio / Descripción (Opcional)</Label>
                  <Textarea
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    placeholder="Cuéntanos sobre ti..."
                    rows={3}
                  />
                </div>

                <Button
                  type="button"
                  className="w-full h-11 bg-gray-900 hover:bg-gray-800 text-white font-medium"
                  onClick={handleSubmit}
                  disabled={!formData.birthdate || !formData.gender || !formData.heightCm || !formData.weightKg || !formData.weightClass || !formData.martialArts.length || isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creando Fighter ID...
                    </>
                  ) : (
                    'Crear Mi Fighter ID'
                  )}
                </Button>
              </div>
            )}

            <form onSubmit={handleLogin}>
              {isLogin && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Correo Electrónico</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="tu@correo.com"
                      required
                      disabled={!!invitation}
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Contraseña</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={handleInputChange}
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

                  <Button
                    type="submit"
                    className="w-full h-11 bg-gray-900 hover:bg-gray-800 text-white font-medium"
                    disabled={isSubmitting || validatingToken}
                  >
                    {(isSubmitting || validatingToken) ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Iniciando sesión...
                      </>
                    ) : (
                      'Iniciar Sesión'
                    )}
                  </Button>
                </div>
              )}
            </form>

            {isLogin && (
              <div className="text-center mt-3">
                <button
                  type="button"
                  onClick={() => window.location.href = '/license/forgot-password'}
                  className="text-sm text-gray-600 hover:text-gray-900 underline underline-offset-4"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            )}

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                  setRegistrationStep(0);
                  setAccountType(null);
                  setFormData({
                    email: '',
                    password: '',
                    phone: '',
                    firstName: '',
                    lastName: '',
                    nickname: '',
                    country: 'HN',
                    weightClass: '',
                    heightCm: '',
                    weightKg: '',
                    reachCm: '',
                    martialArts: [],
                    gymName: '',
                    stance: '',
                    level: '',
                    birthdate: '',
                    gender: '',
                    bio: ''
                  });
                }}
                className="text-sm text-gray-700 hover:text-gray-900 font-medium underline underline-offset-4"
              >
                {isLogin 
                  ? '¿No tienes licencia? Solicítala aquí' 
                  : '¿Ya tienes licencia? Inicia sesión'}
              </button>
            </div>

            {!isLogin && (
              <div className="text-xs text-muted-foreground text-center space-y-1">
                <p>Al crear tu cuenta, tu solicitud será revisada por un administrador.</p>
                <p>Recibirás una notificación cuando tu licencia sea aprobada.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}