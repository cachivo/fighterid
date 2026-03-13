import { useRoundControl } from '@/hooks/useRoundControl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Square, Clock, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export function RoundControlPanel({ fightId }: { fightId: string }) {
  const { 
    rounds, 
    loading, 
    startRound, 
    pauseRound, 
    endRound, 
    getCurrentRound, 
    getNextRound,
    getPausedRound 
  } = useRoundControl(fightId);
  
  const currentRound = getCurrentRound();
  const nextRound = getNextRound();
  const pausedRound = getPausedRound();

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live': return 'bg-fighter-success text-white';
      case 'paused': return 'bg-fighter-warning text-white';
      case 'ended': return 'bg-muted text-muted-foreground';
      case 'cancelled': return 'bg-fighter-danger text-white';
      default: return 'bg-fighter-info text-white';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-base">
          <Clock className="mr-2 h-4 w-4" />
          Control de Rounds
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Current Round Display */}
        {currentRound && (
          <div className="bg-fighter-success/10 border-2 border-fighter-success rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-fighter-success text-white">
                    <Play className="h-3 w-3 mr-1" />
                    EN VIVO
                  </Badge>
                  <span className="text-lg font-bold">Round {currentRound.number}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  Iniciado {formatDistanceToNow(new Date(currentRound.starts_at!), { 
                    addSuffix: true, 
                    locale: es 
                  })}
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => pauseRound(currentRound.id)}
                >
                  <Pause className="h-4 w-4 mr-1" />
                  Pausar
                </Button>
                <Button 
                  size="sm" 
                  variant="destructive" 
                  onClick={() => endRound(currentRound.id)}
                >
                  <Square className="h-4 w-4 mr-1" />
                  Terminar
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Paused Round */}
        {pausedRound && !currentRound && (
          <div className="bg-fighter-warning/10 border-2 border-fighter-warning rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-fighter-warning text-white">
                    <Pause className="h-3 w-3 mr-1" />
                    PAUSADO
                  </Badge>
                  <span className="text-lg font-bold">Round {pausedRound.number}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  Round en pausa
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="default" 
                  onClick={() => startRound(pausedRound.id)}
                >
                  <Play className="h-4 w-4 mr-1" />
                  Reanudar
                </Button>
                <Button 
                  size="sm" 
                  variant="destructive" 
                  onClick={() => endRound(pausedRound.id)}
                >
                  <Square className="h-4 w-4 mr-1" />
                  Terminar
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Next Round */}
        {!currentRound && !pausedRound && nextRound && (
          <div className="bg-fighter-info/10 border-2 border-fighter-info rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge className="bg-fighter-info text-white">LISTO</Badge>
                  <span className="text-lg font-bold">Round {nextRound.number}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {nextRound.duration_seconds / 60} minutos
                </div>
              </div>
              <Button onClick={() => startRound(nextRound.id)}>
                <Play className="h-4 w-4 mr-2" />
                Iniciar Round
              </Button>
            </div>
          </div>
        )}

        {/* No more rounds */}
        {!currentRound && !pausedRound && !nextRound && rounds.length > 0 && (
          <div className="bg-muted/50 border-2 border-border rounded-lg p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">Todos los rounds completados</span>
            </div>
          </div>
        )}

        {/* All Rounds Status */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Estado de Rounds</p>
          <div className="grid grid-cols-3 gap-2">
            {rounds.map(round => (
              <div 
                key={round.id}
                className={`p-3 rounded text-center transition-all ${getStatusColor(round.status)}`}
              >
                <div className="font-bold text-sm">R{round.number}</div>
                <div className="text-xs capitalize mt-1">
                  {round.status === 'scheduled' && 'Pendiente'}
                  {round.status === 'live' && 'En Vivo'}
                  {round.status === 'paused' && 'Pausado'}
                  {round.status === 'ended' && 'Terminado'}
                  {round.status === 'cancelled' && 'Cancelado'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}