import { useState, useEffect } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UserCheck } from 'lucide-react';
import { useFighterInvitations } from '@/hooks/useFighterInvitations';
import { supabase } from '@/integrations/supabase/client';

const authSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

const signUpSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

type AuthFormData = z.infer<typeof authSchema>;
type SignUpFormData = z.infer<typeof signUpSchema>;

export default function Auth() {
  const { user, signIn, signUp } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect');
  const inviteToken = searchParams.get('invite');
  const { validateToken } = useFighterInvitations();
  const [invitation, setInvitation] = useState<any>(null);
  const [validatingToken, setValidatingToken] = useState(false);

  const form = useForm<AuthFormData>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const signUpForm = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: invitation?.email || '',
      password: '',
    },
  });

  // Validate invitation token on mount
  useEffect(() => {
    const checkInvitation = async () => {
      if (inviteToken) {
        setValidatingToken(true);
        const invitationData = await validateToken(inviteToken);
        
        if (invitationData) {
          setInvitation(invitationData);
          signUpForm.setValue('email', invitationData.email);
          toast({
            title: 'Invitación válida',
            description: `Bienvenido ${invitationData.first_name}! Completa tu registro para crear tu perfil de peleador.`,
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

  // Redirect if already authenticated
  if (user && !adminLoading) {
    // If there's a redirect parameter, use it (for admin access)
    if (redirectTo) {
      return <Navigate to={redirectTo} replace />;
    }
    // Otherwise, redirect based on role
    if (isAdmin === true) {
      return <Navigate to="/admin/dashboard" replace />;
    } else if (isAdmin === false) {
      return <Navigate to="/" replace />;
    }
  }

  const handleSignIn = async (data: AuthFormData) => {
    setLoading(true);
    const { error } = await signIn(data.email, data.password);
    
    if (error) {
      toast({
        title: 'Error de autenticación',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Bienvenido',
        description: 'Has iniciado sesión correctamente',
      });
    }
    setLoading(false);
  };

  const handleSignUp = async (data: SignUpFormData) => {
    setLoading(true);
    
    try {
      // Register the user
      const { error: signUpError } = await signUp(data.email, data.password);
      
      if (signUpError) {
        throw signUpError;
      }

      // If this is an invitation signup, create fighter profile
      if (invitation && inviteToken) {
        // Wait a bit for auth and trigger to complete
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Get the newly created user
        const { data: { user: newUser } } = await supabase.auth.getUser();
        
        if (newUser) {
          // Get app_user (should be created by trigger)
          const { data: appUser, error: appUserError } = await supabase
            .from('app_user')
            .select('id')
            .eq('auth_user_id', newUser.id)
            .single();

          if (appUserError || !appUser) {
            console.error('App user not found:', appUserError);
            throw new Error('Error configurando perfil de usuario');
          }

          // Create fighter profile
          const { data: fighterProfile, error: profileError } = await supabase
            .from('fighter_profiles')
            .insert({
              user_id: appUser.id,
              first_name: invitation.first_name,
              last_name: invitation.last_name,
              weight_class: invitation.weight_class || 'Lightweight',
              country: 'HN',
            })
            .select('id')
            .single();

          if (profileError) throw profileError;

          // Mark invitation as accepted using secure RPC function
          const { error: acceptError } = await supabase
            .rpc('accept_fighter_invitation', {
              p_token: inviteToken,
              p_fighter_profile_id: fighterProfile.id,
            });
          
          if (acceptError) throw acceptError;

          toast({
            title: '✅ Registro completo',
            description: 'Tu perfil de peleador ha sido creado exitosamente',
          });
        }
      } else {
        toast({
          title: 'Registro exitoso',
          description: 'Por favor revisa tu email para confirmar tu cuenta',
        });
      }
    } catch (error: any) {
      console.error('Error en registro:', error);
      toast({
        title: 'Error de registro',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Acceso a Batalla</CardTitle>
          <CardDescription>
            Inicia sesión o regístrate para acceder a la plataforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Iniciar Sesión</TabsTrigger>
              <TabsTrigger value="signup">Registrarse</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSignIn)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="tu@email.com"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contraseña</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="••••••••"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Iniciar Sesión
                  </Button>
                </form>
              </Form>
              <div className="mt-4 text-center">
                <Button
                  variant="link"
                  className="text-sm text-muted-foreground"
                  onClick={() => window.location.href = '/auth/forgot-password'}
                >
                  ¿Olvidaste tu contraseña?
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="signup">
              {invitation && (
                <div className="mb-4 p-4 bg-primary/10 border border-primary/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <UserCheck className="h-5 w-5 text-primary" />
                    <p className="text-sm font-medium">Invitación de Fighter ID</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Has sido invitado como: <strong>{invitation.first_name} {invitation.last_name}</strong>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Tu perfil de peleador se creará automáticamente al completar el registro
                  </p>
                </div>
              )}
              {!invitation && (
                <div className="mb-4 p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Después del registro podrás crear tu <strong>Fighter ID</strong> si deseas ser peleador profesional.
                  </p>
                </div>
              )}
              <Form {...signUpForm}>
                <form onSubmit={signUpForm.handleSubmit(handleSignUp)} className="space-y-4">
                  <FormField
                    control={signUpForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="tu@email.com"
                            {...field}
                            disabled={!!invitation}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={signUpForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contraseña</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="••••••••"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={loading || validatingToken}>
                    {(loading || validatingToken) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {invitation ? 'Completar Registro' : 'Registrarse'}
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}