import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Monitor, Copy, X, AlertCircle } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import AdminLayout from '@/components/AdminLayout';

// NUEVOS TIPOS
type StationStatus = 'online' | 'assigned' | 'empty';

interface Judge {
  id: string;
  first_name: string;
  last_name: string;
  certification_level: string;
  active: boolean;
}

interface Station {
  id: number;
  judge: Judge | null;
  ip: string;
  status: StationStatus;
}

interface Fight {
  id: string;
  fight_number: number;
  fighter_a: { first_name: string; last_name: string; } | null;
  fighter_b: { first_name: string; last_name: string; } | null;
}

export default function JudgeStationsSetup() {
  const [stations, setStations] = useState<Station[]>([
    { id: 1, judge: null, ip: '', status: 'empty' },
    { id: 2, judge: null, ip: '', status: 'empty' },
    { id: 3, judge: null, ip: '', status: 'empty' },
  ]);
  
  const [judges, setJudges] = useState<Judge[]>([]);
  const [selectedFight, setSelectedFight] = useState<string>('');
  const [fights, setFights] = useState<Fight[]>([]);

  useEffect(() => {
    loadJudges();
    loadActiveFights();
  }, []);

  const loadJudges = async () => {
    const { data, error } = await supabase
      .from('judges')
      .select('id, first_name, last_name, certification_level, active')
      .eq('active', true)
      .order('last_name');

    if (error) {
      console.error('Error cargando jueces:', error);
      return;
    }

    setJudges(data || []);
  };

  const loadActiveFights = async () => {
    const { data, error } = await supabase
      .from('fights')
      .select(`
        id,
        fight_number,
        status,
        fighter_a:fighter_profiles!fights_fighter_a_id_fkey(first_name, last_name),
        fighter_b:fighter_profiles!fights_fighter_b_id_fkey(first_name, last_name)
      `)
      .in('status', ['scheduled', 'in_progress'])
      .order('fight_number');

    if (error) {
      console.error('Error cargando peleas:', error);
      return;
    }

    setFights(data || []);
  };

  const loadExistingAssignments = async () => {
    if (!selectedFight) return;

    console.log('[STATIONS] Cargando asignaciones para pelea:', selectedFight);

    const { data, error } = await supabase
      .from('fight_officials')
      .select(`
        role,
        station_metadata,
        judges!fight_officials_official_id_fkey(
          id, first_name, last_name, certification_level, active
        )
      `)
      .eq('fight_id', selectedFight)
      .in('role', ['JUDGE_1', 'JUDGE_2', 'JUDGE_3']);
    
    if (error) {
      console.error('[STATIONS] Error cargando asignaciones:', error);
      toast.error('Error al cargar asignaciones');
      return;
    }

    console.log('[STATIONS] Asignaciones cargadas:', data);

    setStations(prev => prev.map(station => {
      const assignment = data?.find(d => {
        if (d.role === 'JUDGE_1' && station.id === 1) return true;
        if (d.role === 'JUDGE_2' && station.id === 2) return true;
        if (d.role === 'JUDGE_3' && station.id === 3) return true;
        return false;
      });

      if (assignment && assignment.judges) {
        const metadata = assignment.station_metadata as any || {};
        return {
          ...station,
          judge: assignment.judges as Judge,
          ip: metadata.station_ip || '',
          status: 'assigned' as const,
        };
      }

      return { 
        ...station, 
        judge: null, 
        ip: '', 
        status: 'empty' as const 
      };
    }));
  };

  useEffect(() => {
    loadExistingAssignments();
  }, [selectedFight]);

  useEffect(() => {
    if (!selectedFight) return;

    console.log('[PRESENCE] Iniciando suscripción para pelea:', selectedFight);

    const presenceChannel = supabase.channel(`judge_presence:${selectedFight}`, {
      config: { 
        presence: { 
          key: `admin-${crypto.randomUUID?.() ?? Math.random()}` 
        } 
      }
    });

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        console.log('[PRESENCE] Estado sincronizado:', state);
        
        const onlineStations = new Set<number>();
        
        Object.values(state).forEach((presences: any[]) => {
          presences.forEach(p => {
            if (typeof p.station_number === 'number') {
              onlineStations.add(p.station_number);
            }
          });
        });

        console.log('[PRESENCE] Estaciones online:', Array.from(onlineStations));

        setStations(prev => prev.map(s => ({
          ...s,
          status: onlineStations.has(s.id) 
            ? 'online' 
            : (s.judge ? 'assigned' : 'empty')
        })));
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('[PRESENCE] Join:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('[PRESENCE] Leave:', key, leftPresences);
      })
      .subscribe();

    return () => {
      console.log('[PRESENCE] Limpiando suscripción');
      supabase.removeChannel(presenceChannel);
    };
  }, [selectedFight]);

  const roleForStation = (stationId: number): string => {
    return `JUDGE_${stationId}`;
  };

  const assignJudge = async (stationId: number, judgeId: string, ip: string) => {
    if (!selectedFight) {
      toast.error('Selecciona una pelea primero');
      return;
    }

    const role = roleForStation(stationId);

    try {
      console.log('[ASSIGN] Asignando juez:', { stationId, judgeId, role, ip });

      const { data: existing, error: checkError } = await supabase
        .from('fight_officials')
        .select('id, role')
        .eq('fight_id', selectedFight)
        .eq('official_id', judgeId)
        .maybeSingle();

      if (checkError) throw checkError;

      const metadata = {
        station_number: stationId,
        station_ip: ip || null,
        assigned_at: new Date().toISOString()
      };

      if (existing) {
        console.log('[ASSIGN] Actualizando asignación existente:', existing.id);
        
        const { error: updateError } = await supabase
          .from('fight_officials')
          .update({
            role,
            station_metadata: metadata,
            confirmed: true,
            confirmed_at: new Date().toISOString()
          })
          .eq('id', existing.id);

        if (updateError) throw updateError;
        toast.success(`Juez reasignado a estación ${stationId}`);
      } else {
        console.log('[ASSIGN] Creando nueva asignación');

        const { error: insertError } = await supabase
          .from('fight_officials')
          .insert({
            fight_id: selectedFight,
            official_id: judgeId,
            role,
            station_metadata: metadata,
            confirmed: true,
            confirmed_at: new Date().toISOString()
          });

        if (insertError) throw insertError;
        toast.success(`Juez asignado a estación ${stationId}`);
      }

      await loadExistingAssignments();
    } catch (error) {
      console.error('[ASSIGN] Error:', error);
      toast.error('Error al asignar juez');
    }
  };

  const removeJudge = async (stationId: number) => {
    if (!selectedFight) return;

    const role = roleForStation(stationId);

    try {
      const { error } = await supabase
        .from('fight_officials')
        .delete()
        .eq('fight_id', selectedFight)
        .eq('role', role);

      if (error) throw error;

      toast.success('Juez removido');
      await loadExistingAssignments();
    } catch (error) {
      console.error('Error removiendo juez:', error);
      toast.error('Error al remover juez');
    }
  };

  const generateAccessLink = (stationId: number) => {
    if (!selectedFight) {
      toast.error('Selecciona una pelea primero');
      return;
    }

    const url = `${window.location.origin}/judge/fight/${selectedFight}`;
    
    navigator.clipboard.writeText(url);
    toast.success(`Link copiado para estación ${stationId}`, {
      description: '⚠️ El juez debe iniciar sesión con su cuenta asignada'
    });
  };

  const getBadgeVariant = (status: StationStatus) => {
    switch (status) {
      case 'online': return 'default';
      case 'assigned': return 'secondary';
      case 'empty': return 'outline';
    }
  };

  const getBadgeText = (status: StationStatus) => {
    switch (status) {
      case 'online': return '🟢 En Línea';
      case 'assigned': return '🟡 Asignado';
      case 'empty': return '⚪ Libre';
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <PageHeader
          title="Configuración de Estaciones de Jueces"
          subtitle="Asigna jueces a estaciones para scoring en vivo"
        />

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Importante:</strong> Los jueces deben iniciar sesión con su cuenta en el dispositivo 
            antes de acceder al link de la estación. El estado "🟢 En Línea" aparecerá cuando el juez 
            abra el panel de scoring.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>Seleccionar Pelea</CardTitle>
            <CardDescription>Elige la pelea para configurar las estaciones</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedFight} onValueChange={setSelectedFight}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una pelea..." />
              </SelectTrigger>
              <SelectContent>
                {fights.map(fight => (
                  <SelectItem key={fight.id} value={fight.id}>
                    Pelea #{fight.fight_number} - {fight.fighter_a?.first_name} {fight.fighter_a?.last_name} vs{' '}
                    {fight.fighter_b?.first_name} {fight.fighter_b?.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stations.map(station => (
            <Card key={station.id} className="min-h-[400px]">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between gap-3 flex-wrap min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <Monitor className="h-5 w-5 shrink-0" />
                    <CardTitle className="text-lg truncate">
                      Estación #{station.id}
                    </CardTitle>
                  </div>
                  <Badge 
                    variant={getBadgeVariant(station.status)}
                    className="text-xs px-2 py-1 shrink-0"
                  >
                    {getBadgeText(station.status)}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">IP de la Estación</label>
                  <Input
                    placeholder="192.168.1.100"
                    value={station.ip}
                    onChange={(e) => {
                      setStations(prev => prev.map(s => 
                        s.id === station.id ? { ...s, ip: e.target.value } : s
                      ));
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Asignar Juez</label>
                  <Select
                    value={station.judge?.id || ''}
                    onValueChange={(judgeId) => assignJudge(station.id, judgeId, station.ip)}
                    disabled={!selectedFight}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un juez..." />
                    </SelectTrigger>
                    <SelectContent>
                      {judges.map(judge => (
                        <SelectItem key={judge.id} value={judge.id}>
                          {judge.first_name} {judge.last_name} - {judge.certification_level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => generateAccessLink(station.id)}
                    disabled={!station.judge}
                    className="flex-1"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar Link
                  </Button>
                  {station.judge && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeJudge(station.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {station.judge && (
                  <div className="pt-4 border-t space-y-2">
                    <p className="text-sm font-medium">Juez Asignado:</p>
                    <p className="text-sm text-muted-foreground">
                      {station.judge.first_name} {station.judge.last_name}
                    </p>
                    <Badge variant="outline" className="text-xs">
                      {station.judge.certification_level}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Instrucciones de Configuración</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">Pasos para configurar una estación:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>Selecciona la pelea que se va a calificar</li>
                <li>Ingresa la IP del dispositivo (opcional)</li>
                <li>Asigna un juez certificado a la estación</li>
                <li>Copia el link de acceso</li>
                <li>En el dispositivo del juez, inicia sesión con su cuenta</li>
                <li>Pega el link en el navegador del juez</li>
                <li>Verifica que el estado cambie a "🟢 En Línea"</li>
              </ol>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Estados de Estación:</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li><Badge variant="default" className="mr-2">🟢 En Línea</Badge> - Juez conectado y listo</li>
                <li><Badge variant="secondary" className="mr-2">🟡 Asignado</Badge> - Juez asignado pero no conectado</li>
                <li><Badge variant="outline" className="mr-2">⚪ Libre</Badge> - Sin juez asignado</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
