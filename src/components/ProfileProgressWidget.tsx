import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Trophy, Award, Medal, Gem } from 'lucide-react';
import { useProfileCompletion, CompletionLevel } from '@/hooks/useProfileCompletion';
import { FighterProfile } from '@/hooks/useFighterProfiles';
import type { LucideIcon } from 'lucide-react';

interface ProfileProgressWidgetProps {
  profile: FighterProfile;
  onEditClick?: () => void;
}

interface LevelConfig {
  icon: LucideIcon;
  gradient: string;
  label: string;
  borderColor: string;
}

const LEVEL_CONFIG: Record<CompletionLevel, LevelConfig> = {
  BRONZE: { 
    icon: Award, 
    gradient: 'from-orange-800 to-orange-600',
    borderColor: 'border-orange-600/30',
    label: 'Bronce'
  },
  SILVER: { 
    icon: Medal, 
    gradient: 'from-gray-400 to-gray-300',
    borderColor: 'border-gray-400/30',
    label: 'Plata'
  },
  GOLD: { 
    icon: Trophy, 
    gradient: 'from-yellow-500 to-yellow-400',
    borderColor: 'border-yellow-500/30',
    label: 'Oro'
  },
  DIAMOND: { 
    icon: Gem, 
    gradient: 'from-blue-500 to-cyan-400',
    borderColor: 'border-cyan-500/30',
    label: 'Diamante'
  }
};

const REWARD_TEXT: Record<CompletionLevel, string> = {
  BRONZE: 'Desbloquea el badge "Verificado" en tu perfil',
  SILVER: 'Aparece primero en búsquedas + Badge "Elite"',
  GOLD: 'Perfil destacado + Badge "Perfil Completo"',
  DIAMOND: '¡Has alcanzado el máximo nivel!'
};

export function ProfileProgressWidget({ profile, onEditClick }: ProfileProgressWidgetProps) {
  const { score, level, nextLevel, missingFields, badges } = useProfileCompletion(profile);
  
  const currentLevelConfig = LEVEL_CONFIG[level];
  const LevelIcon = currentLevelConfig.icon;
  const highPriorityFields = missingFields.filter(f => f.priority === 'high').slice(0, 3);

  return (
    <Card className={`border-2 ${currentLevelConfig.borderColor} bg-gradient-to-br ${currentLevelConfig.gradient} bg-opacity-5 shadow-lg`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Progreso del Perfil
          </div>
          <Badge variant="outline" className="text-base px-3 py-1">
            <LevelIcon className="h-4 w-4 mr-1" />
            {currentLevelConfig.label}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium text-foreground">{score}% Completado</span>
            <span className="text-muted-foreground">
              Siguiente nivel: {nextLevel}%
            </span>
          </div>
          <Progress 
            value={score} 
            className="h-3 shadow-inner" 
          />
        </div>

        {/* Badges Earned */}
        {badges.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {badges.map((badge, idx) => {
              const BadgeIcon = badge.icon;
              return (
                <Badge 
                  key={idx} 
                  variant={badge.variant}
                  className="animate-scale-in"
                >
                  <BadgeIcon className="h-3 w-3 mr-1" />
                  {badge.label}
                </Badge>
              );
            })}
          </div>
        )}

        {/* Missing Fields (High Priority Only) */}
        {highPriorityFields.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Para subir de nivel:</p>
            {highPriorityFields.map((field) => {
              const FieldIcon = field.icon;
              return (
                <div 
                  key={field.field}
                  className="flex items-center justify-between p-3 rounded-lg bg-background/50 hover:bg-background/80 transition-colors border border-border/50"
                >
                  <div className="flex items-center gap-2">
                    <FieldIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">{field.label}</span>
                  </div>
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                    +{field.points}%
                  </Badge>
                </div>
              );
            })}
          </div>
        )}

        {/* Reward Alert */}
        {level !== 'DIAMOND' && (
          <Alert className="bg-amber-500/10 border-amber-500/30">
            <Trophy className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-600 font-semibold">
              Recompensa al {nextLevel}%
            </AlertTitle>
            <AlertDescription className="text-sm text-amber-700">
              {REWARD_TEXT[level]}
            </AlertDescription>
          </Alert>
        )}

        {/* Success Message for Diamond */}
        {level === 'DIAMOND' && (
          <Alert className="bg-cyan-500/10 border-cyan-500/30">
            <Gem className="h-4 w-4 text-cyan-600" />
            <AlertTitle className="text-cyan-600 font-semibold">
              ¡Felicidades!
            </AlertTitle>
            <AlertDescription className="text-sm text-cyan-700">
              Has completado tu perfil al 100%. Gracias por mantener tu información actualizada.
            </AlertDescription>
          </Alert>
        )}

        {/* Action Button */}
        {onEditClick && (
          <Button 
            onClick={onEditClick}
            className="w-full"
            variant={level === 'DIAMOND' ? 'outline' : 'default'}
          >
            {level === 'DIAMOND' ? (
              <>
                <Trophy className="h-4 w-4 mr-2" />
                ¡Perfil 100% Completo!
              </>
            ) : (
              <>
                <Trophy className="h-4 w-4 mr-2" />
                Completar Información (+{100 - score}%)
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
