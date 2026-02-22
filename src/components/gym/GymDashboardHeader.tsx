import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Shield, MapPin } from 'lucide-react';

interface GymDashboardHeaderProps {
  gym: {
    nombre: string;
    logo_url: string | null;
    banner_url: string | null;
    ciudad: string | null;
    pais: string | null;
  };
  staff: Array<{
    role: string;
    user: {
      first_name: string | null;
      last_name: string | null;
    };
  }>;
}

const roleLabels: Record<string, string> = {
  OWNER: 'Main Coach',
  HEAD_COACH: 'Entrenador Principal',
  ASSISTANT_COACH: 'Asistente',
};

export function GymDashboardHeader({ gym, staff }: GymDashboardHeaderProps) {
  const owner = staff.find(s => s.role === 'OWNER');

  return (
    <div className="relative">
      {/* Banner */}
      <div className="h-28 bg-gradient-to-br from-primary/20 via-primary/10 to-background overflow-hidden">
        {gym.banner_url && (
          <img src={gym.banner_url} alt="" className="w-full h-full object-cover opacity-60" />
        )}
      </div>

      {/* Shield + Info */}
      <div className="px-4 -mt-10 flex items-end gap-3">
        <Avatar className="h-16 w-16 border-4 border-background shadow-lg">
          <AvatarImage src={gym.logo_url || undefined} alt={gym.nombre} />
          <AvatarFallback className="bg-primary/10 text-primary">
            <Shield className="h-8 w-8" />
          </AvatarFallback>
        </Avatar>

        <div className="pb-1 min-w-0">
          <h1 className="text-lg font-bold truncate">{gym.nombre}</h1>
          {(gym.ciudad || gym.pais) && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">
                {[gym.ciudad, gym.pais].filter(Boolean).join(', ')}
              </span>
            </div>
          )}
          {owner && (
            <Badge variant="secondary" className="mt-1 text-xs">
              {roleLabels[owner.role]}: {owner.user.first_name} {owner.user.last_name}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
