import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAIStrikeEvents } from '@/hooks/useAIStrikeEvents';
import { useAIInferenceSessions } from '@/hooks/useAIInferenceSessions';
import { useAIConfig } from '@/hooks/useAIConfig';
import { useToast } from '@/hooks/use-toast';
import { 
  Activity, 
  Zap, 
  TrendingUp, 
  Settings, 
  PlayCircle, 
  StopCircle,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  ExternalLink,
  Copy
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function AIStrikeMonitor() {
  const { toast } = useToast();
  const [selectedFightId, setSelectedFightId] = useState<string>('');
  const [selectedRound, setSelectedRound] = useState<number | undefined>();
  
  const { events, stats, loading: eventsLoading } = useAIStrikeEvents(
    selectedFightId || 'demo-fight',
    selectedRound
  );
  const { sessions, activeSessions, totalActiveSessions } = useAIInferenceSessions();
  const { 
    configItems, 
    updateConfig, 
    confidenceThresholdConnected,
    confidenceThresholdAttempted,
    debounceWindowMs,
    maxLatencyMs,
    targetFps
  } = useAIConfig();

  const copyOverlayUrl = (layout: 'side-by-side' | 'compact' | 'minimal') => {
    const fightId = selectedFightId || activeSessions[0]?.fight_id || 'demo-fight';
    const url = `${window.location.origin}/ai-overlay?fightId=${fightId}&layout=${layout}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "✅ URL copiada",
      description: `Overlay ${layout} listo para OBS`,
    });
  };

  const openOverlay = (layout: 'side-by-side' | 'compact' | 'minimal') => {
    const fightId = selectedFightId || activeSessions[0]?.fight_id || 'demo-fight';
    const url = `/ai-overlay?fightId=${fightId}&layout=${layout}`;
    window.open(url, '_blank');
  };

  const getEventTypeColor = (eventType: string) => {
    return eventType === 'strike_connected' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-yellow-100 text-yellow-800';
  };

  const getSessionStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-green-100 text-green-800';
      case 'stopped': return 'bg-gray-100 text-gray-800';
      case 'error': return 'bg-red-100 text-red-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Monitor de IA - Sistema de Visión</h1>
          <p className="text-muted-foreground mt-1">
            Monitoreo en tiempo real del sistema de detección de golpes por visión por computadora
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <ExternalLink className="h-4 w-4" />
              Abrir Overlay
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Overlay para OBS</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => openOverlay('side-by-side')}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Abrir Side-by-Side
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openOverlay('compact')}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Abrir Compact
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openOverlay('minimal')}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Abrir Minimal
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
              Copiar URL
            </DropdownMenuLabel>
            <DropdownMenuItem onClick={() => copyOverlayUrl('side-by-side')}>
              <Copy className="h-4 w-4 mr-2" />
              Copiar Side-by-Side
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => copyOverlayUrl('compact')}>
              <Copy className="h-4 w-4 mr-2" />
              Copiar Compact
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => copyOverlayUrl('minimal')}>
              <Copy className="h-4 w-4 mr-2" />
              Copiar Minimal
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Sesiones Activas</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalActiveSessions}</div>
            <p className="text-xs text-muted-foreground">
              {sessions.length} totales
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Eventos Totales</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{events.length}</div>
            <p className="text-xs text-muted-foreground">
              Últimos 500 eventos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Latencia Promedio</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activeSessions[0]?.avg_latency_ms?.toFixed(0) || '--'}<span className="text-sm">ms</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Target: {maxLatencyMs}ms
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">FPS Actual</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activeSessions[0]?.avg_fps?.toFixed(1) || '--'}
            </div>
            <p className="text-xs text-muted-foreground">
              Target: {targetFps} FPS
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="events" className="space-y-4">
        <TabsList>
          <TabsTrigger value="events">Eventos en Vivo</TabsTrigger>
          <TabsTrigger value="sessions">Sesiones</TabsTrigger>
          <TabsTrigger value="stats">Estadísticas</TabsTrigger>
          <TabsTrigger value="config">Configuración</TabsTrigger>
        </TabsList>

        {/* Tab: Eventos en Vivo */}
        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Eventos Detectados en Tiempo Real</CardTitle>
              <CardDescription>
                Stream de golpes detectados por el sistema de visión por computadora
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {events.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No hay eventos registrados aún</p>
                    <p className="text-sm mt-2">Los eventos aparecerán aquí en tiempo real cuando el microservicio esté activo</p>
                  </div>
                ) : (
                  events.map((event) => (
                    <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <Badge className={getEventTypeColor(event.event_type)}>
                          {event.event_type === 'strike_connected' ? 'CONECTADO' : 'INTENTO'}
                        </Badge>
                        <div>
                          <p className="font-medium">
                            Fighter {event.fighter} • {event.strike_type || 'golpe'} • Round {event.round_number}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Confianza: {(event.confidence * 100).toFixed(1)}% • {new Date(event.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline">{event.model_version}</Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Sesiones */}
        <TabsContent value="sessions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sesiones de Inferencia</CardTitle>
              <CardDescription>
                Control y monitoreo de sesiones del microservicio de IA
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sessions.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <PlayCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No hay sesiones registradas</p>
                    <p className="text-sm mt-2">Las sesiones aparecerán cuando inicies el microservicio</p>
                  </div>
                ) : (
                  sessions.map((session) => (
                    <Card key={session.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge className={getSessionStatusColor(session.status)}>
                                {session.status === 'running' && <PlayCircle className="h-3 w-3 mr-1" />}
                                {session.status === 'stopped' && <StopCircle className="h-3 w-3 mr-1" />}
                                {session.status === 'error' && <AlertTriangle className="h-3 w-3 mr-1" />}
                                {session.status.toUpperCase()}
                              </Badge>
                              <p className="font-medium">{session.model_version}</p>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Iniciado: {new Date(session.started_at).toLocaleString()}
                            </p>
                            {session.stopped_at && (
                              <p className="text-sm text-muted-foreground">
                                Detenido: {new Date(session.stopped_at).toLocaleString()}
                              </p>
                            )}
                            <div className="flex gap-4 mt-2 text-sm">
                              <span className="text-muted-foreground">
                                FPS: <span className="font-medium text-foreground">{session.avg_fps?.toFixed(1) || 'N/A'}</span>
                              </span>
                              <span className="text-muted-foreground">
                                Latencia: <span className="font-medium text-foreground">{session.avg_latency_ms?.toFixed(0) || 'N/A'}ms</span>
                              </span>
                              <span className="text-muted-foreground">
                                Frames: <span className="font-medium text-foreground">{session.total_frames_processed.toLocaleString()}</span>
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Estadísticas */}
        <TabsContent value="stats" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Estadísticas por Peleador</CardTitle>
              <CardDescription>
                Métricas agregadas del sistema de detección
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                {/* Fighter A Stats */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Fighter A</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Intentos:</span>
                      <span className="font-medium">{stats.find(s => s.fighter === 'A')?.attempted_count || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Conectados:</span>
                      <span className="font-medium text-green-600">{stats.find(s => s.fighter === 'A')?.connected_count || 0}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Precisión:</span>
                      <span className="font-bold text-lg">{stats.find(s => s.fighter === 'A')?.accuracy || 0}%</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Fighter B Stats */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Fighter B</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Intentos:</span>
                      <span className="font-medium">{stats.find(s => s.fighter === 'B')?.attempted_count || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Conectados:</span>
                      <span className="font-medium text-green-600">{stats.find(s => s.fighter === 'B')?.connected_count || 0}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Precisión:</span>
                      <span className="font-bold text-lg">{stats.find(s => s.fighter === 'B')?.accuracy || 0}%</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Configuración */}
        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configuración del Sistema de IA
              </CardTitle>
              <CardDescription>
                Ajusta umbrales y parámetros del sistema de detección
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {configItems.map((item) => (
                <div key={item.id} className="grid gap-2">
                  <Label htmlFor={item.key}>{item.description || item.key}</Label>
                  <div className="flex gap-2">
                    <Input
                      id={item.key}
                      type="number"
                      step="0.01"
                      defaultValue={item.value}
                      onBlur={(e) => {
                        const newValue = parseFloat(e.target.value);
                        if (!isNaN(newValue)) {
                          updateConfig(item.key, newValue);
                        }
                      }}
                    />
                    <Button variant="outline" size="icon">
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Última actualización: {new Date(item.updated_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}