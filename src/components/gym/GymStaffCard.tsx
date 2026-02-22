import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import type { GymStaffMember } from '@/hooks/gyms/useGymStaff';

interface GymStaffCardProps {
  staff: GymStaffMember;
  canManage?: boolean;
  onRemove?: (staffId: string) => void;
}

const roleLabels: Record<string, string> = {
  OWNER: 'Director',
  HEAD_COACH: 'Entrenador Principal',
  ASSISTANT_COACH: 'Asistente',
};

const roleColors: Record<string, string> = {
  OWNER: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  HEAD_COACH: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  ASSISTANT_COACH: 'bg-green-500/10 text-green-600 border-green-500/20',
};

export function GymStaffCard({ staff, canManage, onRemove }: GymStaffCardProps) {
  const user = staff.user;
  const name = user
    ? [user.first_name, user.last_name].filter(Boolean).join(' ') || user.handle
    : 'Usuario desconocido';

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border bg-card">
      <Avatar className="h-12 w-12 flex-shrink-0">
        <AvatarImage src={user?.avatar_url || undefined} alt={name} />
        <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
          {(user?.first_name?.[0] || '') + (user?.last_name?.[0] || '')}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <p className="font-semibold truncate">{name}</p>
        <Badge variant="outline" className={`text-xs mt-0.5 ${roleColors[staff.role] || ''}`}>
          {roleLabels[staff.role] || staff.role}
        </Badge>
      </div>

      {canManage && staff.role !== 'OWNER' && onRemove && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={() => onRemove(staff.id)}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
