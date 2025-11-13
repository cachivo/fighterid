import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Coach } from '@/types/gyms';

interface CoachCardProps {
  coach: Coach;
}

export function CoachCard({ coach }: CoachCardProps) {
  const navigate = useNavigate();

  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-all duration-300"
      onClick={() => navigate(`/entrenadores/${coach.slug}`)}
    >
      <CardContent className="p-4">
        <div className="flex gap-4">
          <img 
            src={coach.avatar_url || '/placeholder.svg'} 
            alt={coach.nombre}
            className="h-16 w-16 rounded-full object-cover flex-shrink-0"
          />
          
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground">
              {coach.nombre} {coach.apellidos}
            </h3>
            
            {coach.ciudad && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                <MapPin className="h-3 w-3" />
                {coach.ciudad}{coach.pais ? `, ${coach.pais}` : ''}
              </div>
            )}

            {coach.especialidades && coach.especialidades.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {coach.especialidades.slice(0, 2).map((e) => (
                  <Badge key={e} variant="outline" className="text-xs">
                    <Award className="h-3 w-3 mr-1" />
                    {e}
                  </Badge>
                ))}
              </div>
            )}

            {coach.gym && (
              <p className="text-xs text-muted-foreground mt-2">
                📍 {(coach.gym as any).nombre}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
