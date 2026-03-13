import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Loader2, Mail, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import fighterIdLogo from '@/assets/fighter-id-logo-auth.png';

export default function ForgotPassword() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [attemptsRemaining, setAttemptsRemaining] = useState(3);

  useEffect(() => {
    // Load cooldown from localStorage on mount
    const storedCooldown = localStorage.getItem('password-recovery-cooldown');
    if (storedCooldown) {
      const cooldownData = JSON.parse(storedCooldown);
      const remainingTime = Math.ceil((cooldownData.expiresAt - Date.now()) / 1000);
      if (remainingTime > 0) {
        setCooldownSeconds(remainingTime);
        setAttemptsRemaining(cooldownData.attemptsRemaining || 0);
      } else {
        localStorage.removeItem('password-recovery-cooldown');
      }
    }
  }, []);

  useEffect(() => {
    if (cooldownSeconds > 0) {
      const timer = setTimeout(() => {
        setCooldownSeconds(cooldownSeconds - 1);
        if (cooldownSeconds === 1) {
          localStorage.removeItem('password-recovery-cooldown');
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
        localStorage.setItem('password-recovery-cooldown', JSON.stringify({
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
      localStorage.removeItem('password-recovery-cooldown');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <img src={fighterIdLogo} alt="Fighter ID Logo" className="w-32 mx-auto mb-2" />
          <CardTitle className="text-2xl font-bold">Recuperar Contraseña</CardTitle>
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
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                disabled={loading || cooldownSeconds > 0}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || cooldownSeconds > 0}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? 'Enviando...' : 
               cooldownSeconds > 0 ? `Espera ${cooldownSeconds}s` : 
               success ? 'Reenviar enlace' : 'Enviar enlace de recuperación'}
            </Button>
          </form>

          {success && (
            <div className="text-sm text-muted-foreground text-center space-y-1">
              <p>¿No recibiste el correo?</p>
              <p>• Revisa tu carpeta de <strong>spam/correo no deseado</strong></p>
              <p>• Espera 60 segundos para reenviar</p>
            </div>
          )}

          <div className="text-center">
            <Link
              to="/auth"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
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
