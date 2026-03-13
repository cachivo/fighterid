import { useState, useEffect } from 'react';
import { useLicenseAuth } from '@/hooks/useLicenseAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Loader2, Mail, Shield, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function LicenseForgotPassword() {
  const { resetPassword } = useLicenseAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [attemptsRemaining, setAttemptsRemaining] = useState(3);

  useEffect(() => {
    // Load cooldown from localStorage on mount
    const storedCooldown = localStorage.getItem('license-recovery-cooldown');
    if (storedCooldown) {
      const cooldownData = JSON.parse(storedCooldown);
      const remainingTime = Math.ceil((cooldownData.expiresAt - Date.now()) / 1000);
      if (remainingTime > 0) {
        setCooldownSeconds(remainingTime);
        setAttemptsRemaining(cooldownData.attemptsRemaining || 0);
      } else {
        localStorage.removeItem('license-recovery-cooldown');
      }
    }
  }, []);

  useEffect(() => {
    if (cooldownSeconds > 0) {
      const timer = setTimeout(() => {
        setCooldownSeconds(cooldownSeconds - 1);
        if (cooldownSeconds === 1) {
          localStorage.removeItem('license-recovery-cooldown');
          setAttemptsRemaining(3);
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldownSeconds]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError("Por favor ingresa tu correo electrónico");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Por favor ingresa un correo electrónico válido");
      return;
    }

    setLoading(true);
    setError("");

    const { error } = await resetPassword(email);

    if (error) {
      if (error.message.includes("Demasiados intentos") || error.retryAfter) {
        const cooldown = error.retryAfter || 300;
        setCooldownSeconds(cooldown);
        const newAttempts = Math.max(0, attemptsRemaining - 1);
        setAttemptsRemaining(newAttempts);
        
        // Store in localStorage
        localStorage.setItem('license-recovery-cooldown', JSON.stringify({
          expiresAt: Date.now() + (cooldown * 1000),
          attemptsRemaining: newAttempts
        }));
        
        setError(`Has excedido el número de intentos. Por favor espera ${Math.ceil(cooldown / 60)} minutos.`);
      } else {
        setError(error.message || "Error al procesar tu solicitud");
      }
    } else {
      setSuccess(true);
      setAttemptsRemaining(3);
      localStorage.removeItem('license-recovery-cooldown');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-gray-50 p-4">
      <Card className="w-full max-w-md border-0 shadow-2xl bg-card/95 backdrop-blur-sm">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 p-3 rounded-full bg-gray-100">
            <Shield className="h-8 w-8 text-gray-800" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Recuperar Acceso Fighter ID
          </CardTitle>
          <CardDescription>
            Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="bg-fighter-success/10 border-fighter-success/30">
              <CheckCircle2 className="h-4 w-4 text-fighter-success" />
              <AlertDescription className="text-fighter-success">
                <p className="font-semibold mb-2">¡Correo enviado!</p>
                <p className="mb-2">Te hemos enviado un correo desde <strong>Fighter ID</strong> con instrucciones para restablecer tu contraseña.</p>
                <p className="text-sm">
                  ⏱️ El correo debería llegar en 1-2 minutos. Si no lo ves, revisa tu carpeta de spam.
                </p>
              </AlertDescription>
            </Alert>
          )}

          {cooldownSeconds > 0 && (
            <Alert className="bg-fighter-warning/10 border-fighter-warning/30">
              <AlertCircle className="h-4 w-4 text-fighter-warning" />
              <AlertDescription className="text-fighter-warning">
                <p className="font-semibold mb-1">Espera antes de reintentar</p>
                <p>Debes esperar <strong>{cooldownSeconds} segundos</strong> antes de solicitar otro correo.</p>
                {attemptsRemaining > 0 && (
                  <p className="text-sm mt-2">Intentos restantes: {attemptsRemaining}</p>
                )}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                required
                disabled={loading || cooldownSeconds > 0}
                className="h-11"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
              disabled={loading || cooldownSeconds > 0}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? 'Enviando...' : 
               cooldownSeconds > 0 ? `Espera ${cooldownSeconds}s` : 
               success ? 'Reenviar enlace' : 'Enviar enlace de recuperación'}
            </Button>
          </form>

          {success && (
            <div className="text-sm text-gray-600 text-center space-y-1">
              <p>¿No recibiste el correo?</p>
              <p>• Revisa tu carpeta de <strong>spam/correo no deseado</strong></p>
              <p>• Espera 60 segundos para reenviar</p>
            </div>
          )}

          <div className="text-center">
            <Link
              to="/license/auth?mode=signin"
              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al inicio de sesión
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
