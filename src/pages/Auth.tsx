import { useState } from 'react';
import { Navigate } from 'react-router-dom';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { Loader2, User, Shield, Clock, Zap, Trophy, Eye } from 'lucide-react';

const authSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

const signUpSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  userType: z.enum(['fighter', 'user'], {
    message: 'Debes seleccionar un tipo de usuario',
  }),
});

type AuthFormData = z.infer<typeof authSchema>;
type SignUpFormData = z.infer<typeof signUpSchema>;

export default function Auth() {
  const { user, signIn, signUp } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

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
      email: '',
      password: '',
      userType: undefined,
    },
  });

  // Redirect if already authenticated
  if (user && !adminLoading) {
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
    const { error } = await signUp(data.email, data.password, data.userType);
    
    if (error) {
      toast({
        title: 'Error de registro',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Registro exitoso',
        description: data.userType === 'fighter' 
          ? 'Por favor revisa tu email para confirmar tu cuenta. Serás redirigido al proceso de creación de tu Fighter ID.'
          : 'Por favor revisa tu email para confirmar tu cuenta',
      });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Panel de Administración</CardTitle>
          <CardDescription>
            Accede a tu cuenta o crea una nueva
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
            </TabsContent>
            
            <TabsContent value="signup">
              <Form {...signUpForm}>
                <form onSubmit={signUpForm.handleSubmit(handleSignUp)} className="space-y-6">
                  <FormField
                    control={signUpForm.control}
                    name="userType"
                    render={({ field }) => (
                      <FormItem className="space-y-4">
                        <FormLabel className="text-base font-medium">Elige tu experiencia en la plataforma</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="grid grid-cols-1 gap-4"
                          >
                            {/* Fighter Option */}
                            <div className="relative flex items-start space-x-4 rounded-xl border-2 border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 p-6 hover:from-orange-100 hover:to-amber-100 cursor-pointer transition-all duration-200 hover:border-orange-300">
                              <RadioGroupItem value="fighter" id="fighter" className="mt-1" />
                              <div className="flex-1 space-y-3">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 rounded-lg bg-orange-100">
                                    <Trophy className="h-6 w-6 text-orange-600" />
                                  </div>
                                  <div className="flex-1">
                                    <label htmlFor="fighter" className="text-lg font-semibold text-gray-900 cursor-pointer block">
                                      Quiero ser Peleador
                                    </label>
                                    <div className="flex items-center gap-2 mt-1">
                                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                        Fighter ID
                                      </span>
                                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        Proceso completo
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <p className="text-sm text-gray-700 leading-relaxed">
                                  Registro completo con proceso de verificación para obtener tu <strong>Fighter ID oficial</strong> y licencia de combate. Accede a eventos profesionales, sistema de ranking y oportunidades de pelea.
                                </p>
                                <div className="flex items-center gap-4 text-xs text-gray-600">
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    <span>3-5 días de verificación</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Shield className="h-3 w-3" />
                                    <span>Licencia oficial</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Regular User Option */}
                            <div className="relative flex items-start space-x-4 rounded-xl border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 hover:from-blue-100 hover:to-indigo-100 cursor-pointer transition-all duration-200 hover:border-blue-300">
                              <RadioGroupItem value="user" id="user" className="mt-1" />
                              <div className="flex-1 space-y-3">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 rounded-lg bg-blue-100">
                                    <Eye className="h-6 w-6 text-blue-600" />
                                  </div>
                                  <div className="flex-1">
                                    <label htmlFor="user" className="text-lg font-semibold text-gray-900 cursor-pointer block">
                                      Solo quiero ver eventos
                                    </label>
                                    <div className="flex items-center gap-2 mt-1">
                                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        Acceso inmediato
                                      </span>
                                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        Espectador
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <p className="text-sm text-gray-700 leading-relaxed">
                                  Acceso completo como <strong>espectador</strong> para ver peleas en vivo, apostar en eventos, seguir a tus peleadores favoritos y participar en la comunidad de fans.
                                </p>
                                <div className="flex items-center gap-4 text-xs text-gray-600">
                                  <div className="flex items-center gap-1">
                                    <Zap className="h-3 w-3" />
                                    <span>Activación instantánea</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <User className="h-3 w-3" />
                                    <span>Perfil de fan</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
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
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Registrarse
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