import { Building2, Clock, Mail } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import fighterIdLogo from '@/assets/fighter-id-logo-auth.png';

export default function GymPendingInvitation() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-black via-slate-950 to-black" />
      <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-purple-600/15 rounded-full blur-[100px]" />

      <Card className="w-full max-w-md bg-slate-950/95 border-purple-500/30 backdrop-blur-xl shadow-[0_0_50px_rgba(168,85,247,0.15)] relative z-10 animate-fade-in">
        <CardHeader className="text-center pb-2">
          <img src={fighterIdLogo} alt="Fighter ID" className="w-24 mx-auto mb-2" />
          <CardTitle className="text-xl font-bold text-white">Cuenta Lista</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="rounded-full p-4 bg-amber-500/20">
              <Clock className="w-10 h-10 text-amber-400" />
            </div>
            <p className="text-white/80">
              Tu cuenta ha sido creada exitosamente. Un <strong className="text-purple-400">administrador</strong> debe vincularte a tu gimnasio para que puedas acceder al dashboard.
            </p>
          </div>

          <div className="bg-slate-900/60 rounded-lg p-4 border border-purple-500/20 space-y-3">
            <div className="flex items-center gap-2 text-white/70 text-sm">
              <Building2 className="w-4 h-4 text-purple-400 shrink-0" />
              <span>Si ya recibiste una invitación por correo, usa el enlace del email.</span>
            </div>
            <div className="flex items-center gap-2 text-white/70 text-sm">
              <Mail className="w-4 h-4 text-purple-400 shrink-0" />
              <span>Contacta al administrador si aún no has recibido tu invitación.</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              onClick={() => navigate('/', { replace: true })}
              className="w-full border-purple-500/30 text-white hover:bg-purple-600/20"
            >
              Ir al inicio
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
