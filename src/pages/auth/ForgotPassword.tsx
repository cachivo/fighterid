import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Loader2, Mail, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ForgotPassword() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  useEffect(() => {
    if (cooldownSeconds > 0) {
      const timer = setTimeout(() => {
        setCooldownSeconds(cooldownSeconds - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldownSeconds]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Por favor ingresa tu correo electrónico.');
      return;
    }

    setError('');
    setLoading(true);

    const { error } = await resetPassword(email);

    if (error) {
      // Handle rate limit error (429)
      if (error.message.includes('Email rate limit exceeded') || 
          error.message.includes('can only request this after') ||
          error.message.includes('security purposes')) {
        setError('Has solicitado demasiados correos. Por favor espera 60 segundos antes de intentar nuevamente.');
        setCooldownSeconds(60);
      } else {
        setError(error.message || 'No se pudo enviar el correo de recuperación.');
      }
      setSuccess(false);
    } else {
      setSuccess(true);
      setCooldownSeconds(60);
      setError('');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
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
            <Alert className="border-green-500/50 bg-green-500/10">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-sm">
                <strong>✅ Correo enviado a: {email}</strong>
                <br />
                <br />
                Revisa tu bandeja de entrada y <strong>carpeta de spam</strong>.
                <br />
                El correo proviene de: <code className="text-xs bg-muted px-1 py-0.5 rounded">noreply@mail.app.supabase.io</code>
              </AlertDescription>
            </Alert>
          )}

          {cooldownSeconds > 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                Podrás solicitar otro correo en <strong>{cooldownSeconds} segundos</strong>
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
