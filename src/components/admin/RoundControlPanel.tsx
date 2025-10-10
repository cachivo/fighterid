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
      case 'live': return 'bg-green-500 text-white';
      case 'paused': return 'bg-yellow-500 text-white';
      case 'ended': return 'bg-gray-500 text-white';
      case 'cancelled': return 'bg-red-500 text-white';
      default: return 'bg-blue-500 text-white';
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
          <div className="bg-green-50 dark:bg-green-950 border-2 border-green-500 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-green-500 text-white">
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
          <div className="bg-yellow-50 dark:bg-yellow-950 border-2 border-yellow-500 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-yellow-500 text-white">
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
          <div className="bg-blue-50 dark:bg-blue-950 border-2 border-blue-500 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge className="bg-blue-500 text-white">LISTO</Badge>
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
          <div className="bg-gray-50 dark:bg-gray-900 border-2 border-gray-300 rounded-lg p-4">
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
