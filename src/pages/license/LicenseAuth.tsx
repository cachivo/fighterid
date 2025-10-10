import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Shield, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useLicenseAuth } from '@/hooks/useLicenseAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function LicenseAuth() {
  const { user, signIn, signUp, loading } = useLicenseAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    phone: ''
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  // Redirect if already authenticated
  if (user && !loading) {
    return <Navigate to="/license/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setRegistrationSuccess(false);
    setIsSubmitting(true);

    try {
      const { error } = isLogin 
        ? await signIn(formData.email, formData.password)
        : await signUp(formData.email, formData.password);

      if (error) {
        // Check for rate limiting error
        if (error.message?.includes('For security purposes') || error.message?.includes('email_send_rate_limit')) {
          setError('Has intentado registrarte varias veces. Por favor espera 60 segundos antes de intentar nuevamente.');
        } else {
          setError(error.message);
        }
      } else if (!isLogin) {
        // Registration successful
        setRegistrationSuccess(true);
        setRegisteredEmail(formData.email);
      }
    } catch (err) {
      setError('Ha ocurrido un error inesperado');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

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
                    <p>⚠️ <strong>Importante:</strong> Revisa tu carpeta de spam si no lo encuentras en tu bandeja principal</p>
                    <p>🕒 El enlace de confirmación es válido por <strong>24 horas</strong></p>
                  </div>
                </AlertDescription>
              </Alert>
            )}
            
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
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

              {!isLogin && (
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
              )}

              <Button
                type="submit"
                className="w-full h-11 bg-gray-900 hover:bg-gray-800 text-white font-medium"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isLogin ? 'Iniciando sesión...' : 'Creando cuenta...'}
                  </>
                ) : (
                  isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'
                )}
              </Button>
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
                  setFormData({ email: '', password: '', phone: '' });
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