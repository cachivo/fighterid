import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Clock, User, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { GymFighterUpdate } from '@/hooks/useFighterUpdates';
import { useFighterUpdates } from '@/hooks/useFighterUpdates';

interface GymFighterUpdateCardProps {
  update: GymFighterUpdate;
}

export function GymFighterUpdateCard({ update }: GymFighterUpdateCardProps) {
  const navigate = useNavigate();
  const { getRelativeTime } = useFighterUpdates();

  const initials = update.fighter_name
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const displayName = update.fighter_nickname 
    ? `${update.fighter_name} "${update.fighter_nickname}"`
    : update.fighter_name;

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-3">
        <div className="flex gap-3">
          {/* Avatar */}
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarImage src={update.fighter_avatar || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {initials || <User className="h-3 w-3" />}
            </AvatarFallback>
          </Avatar>

          {/* Content */}
          <div className="flex-1 min-w-0 space-y-1.5">
            {/* Header */}
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold text-sm truncate">{displayName}</p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                <Clock className="h-3 w-3" />
                <span>{getRelativeTime(update.created_at)}</span>
              </div>
            </div>

            {/* Text (truncated to 2 lines) */}
            <p className="text-sm text-muted-foreground line-clamp-2">
              {update.content}
            </p>

            {/* Thumbnail image */}
            {update.image_url && (
              <div className="rounded-md overflow-hidden mt-2">
                <img
                  src={update.image_url}
                  alt="Update"
                  className="w-full max-h-40 object-cover"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              </div>
            )}

            {/* Link to fighter profile */}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-primary"
              onClick={() => navigate(`/fighter/${update.fighter_id}`)}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Ver perfil
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
