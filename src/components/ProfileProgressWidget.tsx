import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Trophy, Award, Medal, Gem, AlertCircle, Star, Info } from 'lucide-react';
import { useProfileCompletion, CompletionLevel } from '@/hooks/useProfileCompletion';
import { FighterProfile } from '@/hooks/useFighterProfiles';
import type { LucideIcon } from 'lucide-react';

interface ProfileProgressWidgetProps {
  profile: FighterProfile;
  onEditClick?: () => void;
}

interface LevelConfig {
  icon: LucideIcon;
  iconColor: string;
  label: string;
}

const LEVEL_CONFIG: Record<CompletionLevel, LevelConfig> = {
  BRONZE: { 
    icon: Award, 
    iconColor: 'text-orange-600/70',
    label: 'Bronce'
  },
  SILVER: { 
    icon: Medal, 
    iconColor: 'text-gray-400',
    label: 'Plata'
  },
  GOLD: { 
    icon: Trophy, 
    iconColor: 'text-yellow-600/70',
    label: 'Oro'
  },
  DIAMOND: { 
    icon: Gem, 
    iconColor: 'text-cyan-600/70',
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
  const highPriorityFields = missingFields.filter(f => f.priority === 'high');
  const mediumPriorityFields = missingFields.filter(f => f.priority === 'medium');
  const lowPriorityFields = missingFields.filter(f => f.priority === 'low');

  return (
    <Card className="border shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-muted-foreground" />
            Progreso del Perfil
          </div>
          <Badge variant="outline" className="text-base px-3 py-1">
            <LevelIcon className={`h-4 w-4 mr-1 ${currentLevelConfig.iconColor}`} />
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
            className="h-3" 
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
                  variant="outline"
                  className="animate-scale-in"
                >
                  <BadgeIcon className="h-3 w-3 mr-1" />
                  {badge.label}
                </Badge>
              );
            })}
          </div>
        )}

        {/* Mostrar TODOS los campos faltantes agrupados por prioridad */}
        {missingFields.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-foreground">
                Campos faltantes ({missingFields.length})
              </p>
              <span className="text-sm text-muted-foreground">
                +{missingFields.reduce((sum, f) => sum + f.points, 0)}% total
              </span>
            </div>

            {/* Scroll si hay muchos campos */}
            <div className="max-h-96 overflow-y-auto pr-2 space-y-3 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
              
              {/* Campos de Prioridad Alta (Críticos) */}
              {highPriorityFields.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wide flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Información Crítica
                  </p>
                  {highPriorityFields.map((field) => {
                    const FieldIcon = field.icon;
                    return (
                      <div 
                        key={field.field}
                        className="flex items-center justify-between p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800"
                      >
                        <div className="flex items-center gap-2">
                          <FieldIcon className="h-4 w-4 text-red-600 dark:text-red-400" />
                          <span className="text-sm text-foreground font-medium">{field.label}</span>
                        </div>
                        <Badge variant="destructive" className="bg-red-600">
                          +{field.points}%
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Campos de Prioridad Media (Importantes) */}
              {mediumPriorityFields.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wide flex items-center gap-1">
                    <Star className="h-3 w-3" />
                    Información Importante
                  </p>
                  {mediumPriorityFields.map((field) => {
                    const FieldIcon = field.icon;
                    return (
                      <div 
                        key={field.field}
                        className="flex items-center justify-between p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800"
                      >
                        <div className="flex items-center gap-2">
                          <FieldIcon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                          <span className="text-sm text-foreground">{field.label}</span>
                        </div>
                        <Badge variant="outline" className="border-amber-600 text-amber-600 dark:border-amber-400 dark:text-amber-400">
                          +{field.points}%
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Campos de Prioridad Baja (Opcionales) */}
              {lowPriorityFields.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    Información Adicional
                  </p>
                  {lowPriorityFields.map((field) => {
                    const FieldIcon = field.icon;
                    return (
                      <div 
                        key={field.field}
                        className="flex items-center justify-between p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800"
                      >
                        <div className="flex items-center gap-2">
                          <FieldIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          <span className="text-sm text-foreground">{field.label}</span>
                        </div>
                        <Badge variant="outline" className="border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400">
                          +{field.points}%
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Reward Alert */}
        {level !== 'DIAMOND' && (
          <Alert className="bg-muted/50 border-border">
            <Trophy className="h-4 w-4 text-primary" />
            <AlertTitle className="text-foreground font-semibold">
              Recompensa al {nextLevel}%
            </AlertTitle>
            <AlertDescription className="text-sm text-muted-foreground">
              {REWARD_TEXT[level]}
            </AlertDescription>
          </Alert>
        )}

        {/* Success Message for Diamond */}
        {level === 'DIAMOND' && (
          <Alert className="bg-muted/50 border-border">
            <Gem className="h-4 w-4 text-primary" />
            <AlertTitle className="text-foreground font-semibold">
              ¡Felicidades!
            </AlertTitle>
            <AlertDescription className="text-sm text-muted-foreground">
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
