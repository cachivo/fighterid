import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/AdminLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Monitor, Link2, UserCheck, X, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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
  status: 'connected' | 'disconnected';
}

export default function JudgeStationsSetup() {
  const [stations, setStations] = useState<Station[]>([
    { id: 1, judge: null, ip: '', status: 'disconnected' },
    { id: 2, judge: null, ip: '', status: 'disconnected' },
    { id: 3, judge: null, ip: '', status: 'disconnected' }
  ]);
  const [judges, setJudges] = useState<Judge[]>([]);
  const [selectedFight, setSelectedFight] = useState<string>('');
  const [fights, setFights] = useState<any[]>([]);

  const roleForStation = (stationId: number): string => {
    if (stationId === 1) return 'JUDGE_1';
    if (stationId === 2) return 'JUDGE_2';
    if (stationId === 3) return 'JUDGE_3';
    return 'JUDGE_SCORER';
  };

  useEffect(() => {
    loadJudges();
    loadActiveFights();
  }, []);
  useEffect(() => {
    if (selectedFight) {
      loadExistingAssignments();
    }
  }, [selectedFight]);

  async function loadJudges() {
    const { data } = await supabase
      .from('judges')
      .select('*')
      .eq('active', true)
      .order('last_name');
    
    if (data) setJudges(data);
  }

  async function loadActiveFights() {
    const { data } = await supabase
      .from('fights')
      .select(`
        id,
        fight_number,
        status,
        red_fighter:fighter_a_id(first_name, last_name),
        blue_fighter:fighter_b_id(first_name, last_name)
      `)
      .in('status', ['scheduled', 'in_progress'])
      .order('fight_number');
    
    if (data) setFights(data);
  }

  async function loadExistingAssignments() {
    if (!selectedFight) return;

    const { data } = await supabase
      .from('fight_judges')
      .select(`
        station_number,
        station_ip,
        judge:judges(id, first_name, last_name, certification_level, active)
      `)
      .eq('fight_id', selectedFight);
    
    if (data) {
      setStations(prev => prev.map(station => {
        const assignment = data.find(d => d.station_number === station.id);
        return assignment && assignment.judge
          ? {
              ...station,
              judge: assignment.judge as Judge,
              ip: (assignment.station_ip as string) || '',
              status: 'connected' as const
            }
          : { ...station, judge: null, ip: '', status: 'disconnected' as const };
      }));
    }
  }

  async function assignJudge(stationId: number, judgeId: string, ip: string) {
    if (!selectedFight) {
      toast.error('Selecciona una pelea primero');
      return;
    }

    const judge = judges.find(j => j.id === judgeId);
    if (!judge) return;

    // Verificar si el juez ya está asignado a esta pelea
    const { data: existing } = await supabase
      .from('fight_judges')
      .select('id, station_number')
      .eq('fight_id', selectedFight)
      .eq('judge_id', judgeId)
      .maybeSingle();

    let error;
    
    if (existing) {
      // Actualizar la estación existente
      const { error: updateError } = await supabase
        .from('fight_judges')
        .update({
          station_number: stationId,
          station_ip: ip || null,
          confirmed: true
        })
        .eq('id', existing.id);
      
      error = updateError;
      if (!error) {
        toast.success(`Juez reasignado a estación ${stationId}`);
      }
    } else {
      // Insertar nueva asignación
      const { error: insertError } = await supabase
        .from('fight_judges')
        .insert({
          fight_id: selectedFight,
          judge_id: judgeId,
          role: 'scorer',
          station_number: stationId,
          station_ip: ip || null,
          confirmed: true
        });
      
      error = insertError;
      if (!error) {
        toast.success(`Juez asignado a estación ${stationId}`);
      }
    }

    // Espejar asignación en fight_officials (usado por el panel del juez)
    if (!error) {
      const { data: officialExisting } = await supabase
        .from('fight_officials')
        .select('id')
        .eq('fight_id', selectedFight)
        .eq('official_id', judgeId)
        .maybeSingle();

      if (officialExisting) {
        await supabase
          .from('fight_officials')
          .update({
            role: roleForStation(stationId),
            confirmed: true,
            confirmed_at: new Date().toISOString()
          })
          .eq('id', officialExisting.id);
      } else {
        await supabase
          .from('fight_officials')
          .insert({
            fight_id: selectedFight,
            official_id: judgeId,
            role: roleForStation(stationId),
            confirmed: true,
            confirmed_at: new Date().toISOString()
          });
      }
    }

    if (error) {
      toast.error('Error al asignar juez');
      console.error(error);
    } else {
      // Recargar asignaciones para reflejar el estado actual
      await loadExistingAssignments();
    }
  }

  async function removeJudge(stationId: number) {
    if (!selectedFight) return;
    
    const station = stations.find(s => s.id === stationId);
    if (!station?.judge) return;
    
    const { error } = await supabase
      .from('fight_judges')
      .delete()
      .eq('fight_id', selectedFight)
      .eq('judge_id', station.judge.id);
    
    // También eliminar asignación en fight_officials
    await supabase
      .from('fight_officials')
      .delete()
      .eq('fight_id', selectedFight)
      .eq('official_id', station.judge.id);
    
    if (error) {
      toast.error('Error al remover juez');
      console.error(error);
    } else {
      setStations(prev => prev.map(s => 
        s.id === stationId 
          ? { ...s, judge: null, status: 'disconnected' as const }
          : s
      ));
      toast.success('Juez removido de la estación');
    }
  }

  function generateAccessLink(stationId: number) {
    if (!selectedFight) {
      toast.error('Selecciona una pelea primero');
      return;
    }
    
    const url = `${window.location.origin}/judge/fight/${selectedFight}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copiado al portapapeles');
  }

  return (
    <AdminLayout>
      <PageHeader 
        title="Estaciones de Jueces" 
        subtitle="Configurar computadores para scoring en vivo"
      />

      <Alert className="mb-6">
        <Info className="h-4 w-4" />
        <AlertTitle>⚠️ Importante</AlertTitle>
        <AlertDescription>
          Los jueces <strong>NO necesitan estar conectados</strong> para ser asignados. 
          El flujo es: <br/>
          <strong>1️⃣</strong> Asigna jueces aquí <br/>
          <strong>2️⃣</strong> Copia los links de acceso <br/>
          <strong>3️⃣</strong> Cada juez hace login cuando llegue a su estación
        </AlertDescription>
      </Alert>
      
      <div className="mb-6">
        <Label>Pelea Activa</Label>
        <Select value={selectedFight} onValueChange={setSelectedFight}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Seleccionar pelea..." />
          </SelectTrigger>
          <SelectContent>
            {fights.map(f => (
              <SelectItem key={f.id} value={f.id}>
                Pelea #{f.fight_number} - {f.red_fighter?.first_name} vs {f.blue_fighter?.first_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stations.map(station => (
          <Card key={station.id} className="min-h-[400px]">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Monitor className="h-5 w-5" />
                  Estación #{station.id}
                </CardTitle>
                <Badge variant={station.status === 'connected' ? 'default' : 'secondary'}>
                  {station.status === 'connected' ? '🟢 Conectado' : '⚪ Desconectado'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Dirección IP (Opcional)</Label>
                <Input 
                  placeholder="192.168.1.101" 
                  value={station.ip}
                  onChange={(e) => {
                    const newIp = e.target.value;
                    setStations(prev => prev.map(s => 
                      s.id === station.id ? { ...s, ip: newIp } : s
                    ));
                  }}
                />
              </div>
              
              <div>
                <Label>Juez Asignado</Label>
                <Select onValueChange={(judgeId) => assignJudge(station.id, judgeId, station.ip)}>
                  <SelectTrigger>
                    <SelectValue placeholder={
                      station.judge 
                        ? `${station.judge.first_name} ${station.judge.last_name}`
                        : 'Seleccionar juez...'
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {judges.map(j => (
                      <SelectItem key={j.id} value={j.id}>
                        {j.first_name} {j.last_name} ({j.certification_level})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  className="flex-1" 
                  variant="outline"
                  onClick={() => generateAccessLink(station.id)}
                  disabled={!selectedFight}
                >
                  <Link2 className="h-4 w-4 mr-2" />
                  Copiar Link
                </Button>
                
                {station.judge && (
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => removeJudge(station.id)}
                    title="Limpiar estación"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              {station.judge && (
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 text-sm">
                    <UserCheck className="h-4 w-4 text-primary" />
                    <span className="font-medium">
                      {station.judge.first_name} {station.judge.last_name}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Nivel: {station.judge.certification_level}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 p-6 bg-muted rounded-lg">
        <h3 className="font-semibold mb-2">📋 Instrucciones de Setup:</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
          <li>Conectar cada computador con cable Ethernet</li>
          <li>Abrir navegador Chrome o Firefox</li>
          <li>Seleccionar la pelea activa arriba</li>
          <li>Asignar juez a cada estación</li>
          <li>Copiar y pegar el link de acceso en el navegador del computador</li>
          <li>El juez debe hacer login con sus credenciales</li>
          <li>Verificar que aparezca el panel de scoring</li>
        </ol>
      </div>
    </AdminLayout>
  );
}
