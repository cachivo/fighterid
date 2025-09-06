import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy, MapPin, Calendar } from 'lucide-react';

interface FighterMiniatureProps {
  fighter: {
    id: string;
    first_name: string;
    last_name: string;
    nickname?: string;
    avatar_url?: string;
    country?: string;
    weight_class?: string;
    record_wins?: number;
    record_losses?: number;
    record_draws?: number;
    elo_rating?: number;
    martial_arts?: string[];
    fighting_style?: string;
    boxrec_url?: string;
    tapology_url?: string;
  };
}

export const FighterMiniature = ({ fighter }: FighterMiniatureProps) => {
  const totalFights = (fighter.record_wins || 0) + (fighter.record_losses || 0) + (fighter.record_draws || 0);
  const winPercentage = totalFights > 0 ? Math.round(((fighter.record_wins || 0) / totalFights) * 100) : 0;

  return (
    <Card className="w-80 border-border/50">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {fighter.avatar_url ? (
              <img 
                src={fighter.avatar_url} 
                alt={`${fighter.first_name} ${fighter.last_name}`}
                className="w-16 h-16 rounded-full object-cover border-2 border-primary/20"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center border-2 border-primary/20">
                <span className="text-lg font-bold text-muted-foreground">
                  {fighter.first_name?.[0]}{fighter.last_name?.[0]}
                </span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="mb-2">
              <h3 className="font-bold text-base leading-tight">
                {fighter.first_name} {fighter.last_name}
              </h3>
              {fighter.nickname && (
                <p className="text-sm text-muted-foreground">
                  "{fighter.nickname}"
                </p>
              )}
            </div>

            {/* Record and Rating */}
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center gap-1">
                <span className="text-green-500 font-semibold text-sm">
                  {fighter.record_wins || 0}W
                </span>
                <span className="text-destructive font-semibold text-sm">
                  {fighter.record_losses || 0}L
                </span>
                {(fighter.record_draws || 0) > 0 && (
                  <span className="text-muted-foreground font-semibold text-sm">
                    {fighter.record_draws}D
                  </span>
                )}
              </div>
              
              {fighter.elo_rating && (
                <Badge variant="secondary" className="text-xs">
                  <Trophy className="w-3 h-3 mr-1" />
                  {fighter.elo_rating}
                </Badge>
              )}
            </div>

            {/* Additional Info */}
            <div className="space-y-1">
              {fighter.country && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="w-3 h-3" />
                  <span>{fighter.country}</span>
                  {fighter.weight_class && (
                    <>
                      <span>•</span>
                      <span>{fighter.weight_class}</span>
                    </>
                  )}
                </div>
              )}

              {fighter.martial_arts && fighter.martial_arts.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {fighter.martial_arts.slice(0, 3).map((art, index) => (
                    <Badge key={index} variant="outline" className="text-xs py-0 px-1">
                      {art}
                    </Badge>
                  ))}
                  {fighter.martial_arts.length > 3 && (
                    <Badge variant="outline" className="text-xs py-0 px-1">
                      +{fighter.martial_arts.length - 3}
                    </Badge>
                  )}
                </div>
              )}

              {fighter.fighting_style && (
                <p className="text-xs text-muted-foreground mt-1">
                  Estilo: {fighter.fighting_style}
                </p>
              )}

              {totalFights > 0 && (
                <p className="text-xs text-muted-foreground">
                  {winPercentage}% de victorias ({totalFights} peleas)
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};