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
      handle?: string;
    };
  }>;
}

const roleLabels: Record<string, string> = {
  OWNER: 'Main Coach',
  HEAD_COACH: 'Entrenador Principal',
  ASSISTANT_COACH: 'Asistente',
};

function getStaffDisplayName(user: { first_name: string | null; last_name: string | null; handle?: string }) {
  const full = [user.first_name, user.last_name].filter(Boolean).join(' ');
  if (full) return full;
  if (user.handle) return `@${user.handle}`;
  return 'Sin nombre';
}

export function GymDashboardHeader({ gym, staff }: GymDashboardHeaderProps) {
  const owner = staff.find(s => s.role === 'OWNER');

  return (
    <div className="border-b border-border">
      {/* Banner compacto solo si existe */}
      {gym.banner_url && (
        <div className="h-20 overflow-hidden">
          <img src={gym.banner_url} alt="" className="w-full h-full object-cover" />
        </div>
      )}

      {/* Avatar + Info */}
      <div className="px-4 py-3 flex items-center gap-3">
        <Avatar className="h-14 w-14 border-2 border-border shadow-sm flex-shrink-0">
          <AvatarImage src={gym.logo_url || undefined} alt={gym.nombre} />
          <AvatarFallback className="bg-primary/10 text-primary">
            <Shield className="h-7 w-7" />
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0">
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
              {roleLabels[owner.role]}: {getStaffDisplayName(owner.user)}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
