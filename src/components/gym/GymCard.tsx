import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Gym } from '@/types/gyms';

interface GymCardProps {
  gym: Gym;
}

export function GymCard({ gym }: GymCardProps) {
  const navigate = useNavigate();

  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden group"
      onClick={() => navigate(`/gimnasios/${gym.slug}`)}
    >
      <div 
        className="h-32 w-full bg-gradient-to-br from-primary/20 to-secondary/20 bg-cover bg-center group-hover:scale-105 transition-transform duration-300"
        style={{ 
          backgroundImage: gym.banner_url ? `url(${gym.banner_url})` : undefined 
        }}
      />
      
      <CardContent className="p-4 -mt-8 relative">
        <div className="flex items-start gap-3">
          <img 
            src={gym.logo_url || '/placeholder.svg'} 
            alt={gym.nombre}
            className="h-16 w-16 rounded-xl object-cover border-4 border-background shadow-md"
          />
          <div className="flex-1 pt-8">
            <h3 className="text-lg font-bold text-foreground truncate">
              {gym.nombre}
            </h3>
            {gym.ciudad && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                <MapPin className="h-3 w-3" />
                {gym.ciudad}{gym.pais ? `, ${gym.pais}` : ''}
              </div>
            )}
          </div>
        </div>

        {gym.descripcion && (
          <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
            {gym.descripcion}
          </p>
        )}

        {gym.disciplinas && gym.disciplinas.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {gym.disciplinas.slice(0, 3).map((d) => (
              <Badge key={d} variant="secondary" className="text-xs">
                {d}
              </Badge>
            ))}
            {gym.disciplinas.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{gym.disciplinas.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
