import { Building2, Clock, Mail } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import fighterIdLogo from '@/assets/fighter-id-logo-auth.png';

export default function GymPendingInvitation() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-background" />
      <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-primary/15 rounded-full blur-[100px]" />

      <Card className="w-full max-w-md bg-card border-primary/30 backdrop-blur-xl shadow-[0_0_50px_hsl(var(--primary)/0.15)] relative z-10 animate-fade-in">
        <CardHeader className="text-center pb-2">
          <img src={fighterIdLogo} alt="Fighter ID" className="w-24 mx-auto mb-2" />
          <CardTitle className="text-xl font-bold text-foreground">Cuenta Lista</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="rounded-full p-4 bg-fighter-warning/20">
              <Clock className="w-10 h-10 text-fighter-warning" />
            </div>
            <p className="text-muted-foreground">
              Tu cuenta ha sido creada exitosamente. Un <strong className="text-primary">administrador</strong> debe vincularte a tu gimnasio para que puedas acceder al dashboard.
            </p>
          </div>

          <div className="bg-secondary rounded-lg p-4 border border-primary/20 space-y-3">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Building2 className="w-4 h-4 text-primary shrink-0" />
              <span>Si ya recibiste una invitación por correo, usa el enlace del email.</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Mail className="w-4 h-4 text-primary shrink-0" />
              <span>Contacta al administrador si aún no has recibido tu invitación.</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              onClick={() => navigate('/', { replace: true })}
              className="w-full border-primary/30 text-foreground hover:bg-primary/20"
            >
              Ir al inicio
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}