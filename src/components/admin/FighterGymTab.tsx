import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useGymMembership, useAddMembership, useTransferFighter } from '@/hooks/gyms';
import { useGymStaff } from '@/hooks/gyms';
import { useGyms } from '@/hooks/useGyms';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Building, UserCheck, ArrowRightLeft, Calendar, Clock, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

interface FighterGymTabProps {
  fighterId: string;
}

export const FighterGymTab = ({ fighterId }: FighterGymTabProps) => {
  const { data: membership, isLoading: loadingMembership } = useGymMembership(fighterId);
  const { data: gyms } = useGyms();
  const addMembership = useAddMembership();
  const transferFighter = useTransferFighter();

  const [selectedGymId, setSelectedGymId] = useState<string>('');
  const [selectedCoachId, setSelectedCoachId] = useState<string>('');
  const [mode, setMode] = useState<'idle' | 'assign' | 'transfer'>('idle');

  const { data: staffForSelected } = useGymStaff(selectedGymId);
  const coaches = (staffForSelected || []).filter(
    (s) => s.role === 'HEAD_COACH' || s.role === 'ASSISTANT_COACH'
  );

  // History query
  const { data: history } = useQuery({
    queryKey: ['gym-membership-history', fighterId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fighter_gym_memberships')
        .select('id, gym_id, status, joined_at, left_at, gyms(id, nombre)')
        .eq('fighter_id', fighterId)
        .neq('status', 'ACTIVE')
        .order('left_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!fighterId,
  });

  const handleAssign = async () => {
    if (!selectedGymId) return;
    try {
      await addMembership.mutateAsync({
        fighterId,
        gymId: selectedGymId,
        coachUserId: selectedCoachId || undefined,
      });
      setMode('idle');
      setSelectedGymId('');
      setSelectedCoachId('');
    } catch {}
  };

  const handleTransfer = async () => {
    if (!selectedGymId || !membership) return;
    try {
      await transferFighter.mutateAsync({
        fighterId,
        fromGymId: membership.gym_id,
        toGymId: selectedGymId,
        coachUserId: selectedCoachId || undefined,
      });
      setMode('idle');
      setSelectedGymId('');
      setSelectedCoachId('');
    } catch {}
  };

  const handleDeactivate = async () => {
    if (!membership) return;
    const { error } = await supabase
      .from('fighter_gym_memberships')
      .update({ status: 'INACTIVE', left_at: new Date().toISOString() })
      .eq('id', membership.id);
    if (error) {
      toast.error('Error al desvincular: ' + error.message);
    } else {
      toast.success('Peleador desvinculado del gimnasio');
      // Refetch handled by query invalidation won't fire here, manual workaround
      window.location.reload();
    }
  };

  const gymData = membership?.gyms as any;

  return (
    <div className="space-y-4">
      {/* Current membership */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building className="h-5 w-5" />
            Membresía Actual
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingMembership ? (
            <p className="text-sm text-muted-foreground">Cargando...</p>
          ) : membership ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-lg">{gymData?.nombre || 'Gimnasio'}</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Desde {membership.joined_at ? format(new Date(membership.joined_at), 'dd MMM yyyy', { locale: es }) : '—'}
                  </p>
                </div>
                <Badge variant="default">Activa</Badge>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setMode('transfer'); setSelectedGymId(''); setSelectedCoachId(''); }}
                >
                  <ArrowRightLeft className="h-4 w-4 mr-1" />
                  Transferir
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeactivate}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Desvincular
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-muted-foreground mb-3">Sin gimnasio asignado</p>
              <Button size="sm" onClick={() => { setMode('assign'); setSelectedGymId(''); setSelectedCoachId(''); }}>
                <Building className="h-4 w-4 mr-1" />
                Vincular a Gimnasio
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assign / Transfer form */}
      {(mode === 'assign' || mode === 'transfer') && (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="text-base">
              {mode === 'assign' ? 'Vincular a Gimnasio' : 'Transferir a Gimnasio'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Gimnasio</label>
              <Select value={selectedGymId} onValueChange={(v) => { setSelectedGymId(v); setSelectedCoachId(''); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar gimnasio" />
                </SelectTrigger>
                <SelectContent>
                  {(gyms || [])
                    .filter(g => mode !== 'transfer' || g.id !== membership?.gym_id)
                    .map(g => (
                      <SelectItem key={g.id} value={g.id}>{g.nombre}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {selectedGymId && coaches.length > 0 && (
              <div>
                <label className="text-sm font-medium mb-1 block">Entrenador (opcional)</label>
                <Select value={selectedCoachId} onValueChange={setSelectedCoachId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sin asignar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin asignar</SelectItem>
                    {coaches.map(c => (
                      <SelectItem key={c.id} value={c.user_id}>
                        {c.user?.first_name} {c.user?.last_name} ({c.role === 'HEAD_COACH' ? 'Principal' : 'Asistente'})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={mode === 'assign' ? handleAssign : handleTransfer}
                disabled={!selectedGymId || addMembership.isPending || transferFighter.isPending}
                size="sm"
              >
                {addMembership.isPending || transferFighter.isPending ? 'Procesando...' : mode === 'assign' ? 'Vincular' : 'Transferir'}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setMode('idle')}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* History */}
      {history && history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-5 w-5" />
              Historial de Membresías
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {history.map((h: any) => (
                <div key={h.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="text-sm font-medium">{h.gyms?.nombre || 'Gimnasio'}</p>
                    <p className="text-xs text-muted-foreground">
                      {h.joined_at ? format(new Date(h.joined_at), 'dd/MM/yyyy', { locale: es }) : '—'}
                      {h.left_at ? ` → ${format(new Date(h.left_at), 'dd/MM/yyyy', { locale: es })}` : ''}
                    </p>
                  </div>
                  <Badge variant={h.status === 'TRANSFERRED' ? 'secondary' : 'outline'}>
                    {h.status === 'TRANSFERRED' ? 'Transferido' : h.status === 'INACTIVE' ? 'Inactivo' : h.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
