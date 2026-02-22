import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Gym } from '@/types/gyms';

interface GymCardProps {
  gym: Gym;
}

export function GymCard({ gym }: GymCardProps) {
  const navigate = useNavigate();

  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden"
      onClick={() => navigate(`/gimnasios/${gym.slug}`)}
    >
      {/* Banner solo si existe */}
      {gym.banner_url && (
        <div className="h-24 w-full overflow-hidden">
          <img src={gym.banner_url} alt="" className="w-full h-full object-cover" />
        </div>
      )}
      
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12 border-2 border-border shadow-sm flex-shrink-0">
            <AvatarImage src={gym.logo_url || undefined} alt={gym.nombre} />
            <AvatarFallback className="bg-primary/10 text-primary">
              <Shield className="h-6 w-6" />
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold truncate">
              {gym.nombre}
            </h3>
            {gym.ciudad && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                <MapPin className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{gym.ciudad}{gym.pais ? `, ${gym.pais}` : ''}</span>
              </div>
            )}
          </div>
        </div>

        {gym.descripcion && (
          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
            {gym.descripcion}
          </p>
        )}

        {gym.disciplinas && gym.disciplinas.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {gym.disciplinas.slice(0, 3).map((d) => (
              <Badge key={d} variant="secondary" className="text-xs px-2 py-0.5">
                {d}
              </Badge>
            ))}
            {gym.disciplinas.length > 3 && (
              <Badge variant="outline" className="text-xs px-2 py-0.5">
                +{gym.disciplinas.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
