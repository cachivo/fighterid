import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FighterProfile } from '@/hooks/useFighterProfiles';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Shield } from 'lucide-react';

interface FighterCardProps {
  fighter: FighterProfile;
  onClick?: () => void;
}

export function FighterCard({ fighter, onClick }: FighterCardProps) {
  const navigate = useNavigate();

  const getLicenseStatusColor = (status: string) => {
    const normalizedStatus = status?.toUpperCase();
    switch (normalizedStatus) {
      case 'ACTIVE': 
      case 'ACTIVA': 
        return 'bg-fighter-success';
      case 'SUSPENDED': 
      case 'SUSPENDIDA': 
        return 'bg-fighter-danger';
      case 'PENDING_REVIEW': 
      case 'EN_REVISION': 
        return 'bg-fighter-warning';
      case 'EXPIRED': 
      case 'EXPIRADA': 
        return 'bg-fighter-accent';
      default: return 'bg-fighter-accent';
    }
  };

  const getStatusText = (status: string) => {
    const normalizedStatus = status?.toUpperCase();
    switch (normalizedStatus) {
      case 'ACTIVE': return 'ACTIVA';
      case 'ACTIVA': return 'ACTIVA';
      case 'SUSPENDED': return 'SUSPENDIDA';
      case 'SUSPENDIDA': return 'SUSPENDIDA';
      case 'PENDING_REVIEW': return 'EN REVISIÓN';
      case 'EN_REVISION': return 'EN REVISIÓN';
      case 'EXPIRED': return 'EXPIRADA';
      case 'EXPIRADA': return 'EXPIRADA';
      default: return status || 'ACTIVA';
    }
  };
  const totalFights = fighter.record_wins + fighter.record_losses + fighter.record_draws;
  
  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-all duration-300 bg-card border-border hover:border-purple-neon-primary/30"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center gap-4">
          {fighter.avatar_url ? (
            <img 
              src={fighter.avatar_url} 
              alt={`${fighter.first_name} ${fighter.last_name}`}
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-urban-gray flex items-center justify-center">
              <span className="text-xl font-bold text-foreground">
                {fighter.first_name[0]}{fighter.last_name[0]}
              </span>
            </div>
          )}
          
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground">
              {fighter.first_name} {fighter.last_name}
            </h3>
            {fighter.nickname && (
              <p className="text-sm text-purple-neon-primary font-medium">
                "{fighter.nickname}"
              </p>
            )}
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="text-xs">
                {fighter.weight_class}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {fighter.country}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Record</p>
            <p className="font-semibold text-foreground">
              {fighter.record_wins}-{fighter.record_losses}-{fighter.record_draws}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">ELO Rating</p>
            <p className="font-semibold text-foreground">
              {fighter.elo_rating}
            </p>
          </div>
          {(fighter.martial_arts && fighter.martial_arts.length > 0) || fighter.discipline ? (
            <div className="col-span-2">
              <p className="text-muted-foreground">Artes Marciales</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {fighter.martial_arts && fighter.martial_arts.length > 0 
                  ? fighter.martial_arts.map(art => (
                      <Badge key={art} variant="outline" className="text-xs">
                        {art}
                      </Badge>
                    ))
                  : fighter.discipline && (
                      <Badge variant="outline" className="text-xs">
                        {fighter.discipline}
                      </Badge>
                    )
                }
              </div>
            </div>
          ) : null}
          {fighter.fighting_style && (
            <div className="col-span-2">
              <p className="text-muted-foreground">Estilo de Pelea</p>
              <p className="font-medium text-foreground">{fighter.fighting_style}</p>
            </div>
          )}
        </div>
        
        {totalFights === 0 && (
          <Badge variant="outline" className="mt-3">
            Debutante
          </Badge>
        )}

        {/* License Info */}
        <div className="flex items-center justify-between pt-3 mt-3 border-t">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-white" />
            <span className="text-sm font-medium">{fighter.license_number}</span>
          </div>
          <Badge className={`${getLicenseStatusColor(fighter.license_status)} text-white text-xs font-semibold`}>
            {getStatusText(fighter.license_status)}
          </Badge>
        </div>

        {/* License Button */}
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full mt-3"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/fighters/license/${fighter.id}`);
          }}
        >
          <CreditCard className="h-5 w-5 mr-2 text-white" />
          Ver Licencia
        </Button>
      </CardContent>
    </Card>
  );
}