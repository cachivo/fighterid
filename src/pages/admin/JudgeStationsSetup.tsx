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
import { Monitor, Link2, UserCheck } from 'lucide-react';

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

  useEffect(() => {
    loadJudges();
    loadActiveFights();
  }, []);

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

  async function assignJudge(stationId: number, judgeId: string, ip: string) {
    if (!selectedFight) {
      toast.error('Selecciona una pelea primero');
      return;
    }

    const judge = judges.find(j => j.id === judgeId);
    if (!judge) return;

    const { error } = await supabase
      .from('fight_judges')
      .insert({
        fight_id: selectedFight,
        judge_id: judgeId,
        role: 'scorer',
        station_number: stationId,
        station_ip: ip || null,
        confirmed: true
      });

    if (error) {
      toast.error('Error al asignar juez');
      console.error(error);
    } else {
      setStations(prev => prev.map(s => 
        s.id === stationId 
          ? { ...s, judge, ip, status: 'connected' as const }
          : s
      ));
      toast.success(`Juez asignado a estación ${stationId}`);
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
          <Card key={station.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  Estación #{station.id}
                </span>
                <Badge variant={station.status === 'connected' ? 'default' : 'secondary'}>
                  {station.status === 'connected' ? '🟢 Conectado' : '⚪ Desconectado'}
                </Badge>
              </CardTitle>
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
              
              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => generateAccessLink(station.id)}
                disabled={!selectedFight}
              >
                <Link2 className="h-4 w-4 mr-2" />
                Copiar Link de Acceso
              </Button>
              
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
