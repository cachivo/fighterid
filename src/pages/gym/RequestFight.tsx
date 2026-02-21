import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { BackButton } from '@/components/ui/back-button';
import { useFightRequests } from '@/hooks/useFightRequests';
import { useAppUserId } from '@/hooks/useAppUserId';
import { supabase } from '@/integrations/supabase/client';
import { WEIGHT_CLASSES } from '@/lib/constants/disciplines';
import { Swords, CheckCircle, AlertTriangle, Shield, Send } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface FighterOption {
  id: string;
  first_name: string;
  last_name: string;
  nickname: string | null;
  weight_class: string;
}

export default function RequestFight() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { appUserId } = useAppUserId();
  const { createRequest, validateEligibility, requests, loading: requestsLoading } = useFightRequests();

  const [myGym, setMyGym] = useState<{ id: string; nombre: string } | null>(null);
  const [gymFighters, setGymFighters] = useState<FighterOption[]>([]);
  const [allFighters, setAllFighters] = useState<FighterOption[]>([]);
  const [eligibilityResult, setEligibilityResult] = useState<any>(null);
  const [checking, setChecking] = useState(false);

  const [form, setForm] = useState({
    fighter_a_id: '',
    fighter_b_id: '',
    weight_class: '',
    discipline: 'MMA',
    fight_type: 'AMATEUR',
    number_of_rounds: 3,
    is_championship: false,
    notes: '',
  });

  useEffect(() => {
    if (!appUserId) return;
    
    // Find gym where this user is staff (owner/coach)
    supabase
      .from('gym_staff')
      .select('gym_id, gyms!inner(id, nombre)')
      .eq('user_id', appUserId)
      .eq('active', true)
      .limit(1)
      .then(({ data }) => {
        if (data?.[0]) {
          const gym = (data[0] as any).gyms;
          setMyGym(gym);
          
          // Fetch fighters from this gym
          supabase
            .from('fighter_gym_memberships')
            .select('fighter_id, fighter_profiles!inner(id, first_name, last_name, nickname, weight_class)')
            .eq('gym_id', gym.id)
            .eq('status', 'ACTIVE')
            .then(({ data: memberships }) => {
              const fighters = (memberships || []).map((d: any) => d.fighter_profiles).filter(Boolean);
              setGymFighters(fighters);
            });
        }
      });

    // Fetch all active fighters for opponent selection
    supabase
      .from('fighter_profiles')
      .select('id, first_name, last_name, nickname, weight_class')
      .eq('active', true)
      .order('first_name')
      .then(({ data }) => setAllFighters(data || []));
  }, [appUserId]);

  const handleCheckEligibility = async () => {
    if (!form.fighter_a_id || !form.fighter_b_id) {
      toast.error('Selecciona ambos peleadores');
      return;
    }
    setChecking(true);
    try {
      const result = await validateEligibility(form.fighter_a_id, form.fighter_b_id, form.weight_class || undefined);
      setEligibilityResult(result);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setChecking(false);
    }
  };

  const handleSubmit = async () => {
    if (!appUserId || !form.fighter_a_id || !form.weight_class) {
      toast.error('Completa los campos obligatorios');
      return;
    }

    try {
      const fighterA = gymFighters.find(f => f.id === form.fighter_a_id);
      const fighterB = allFighters.find(f => f.id === form.fighter_b_id);

      await createRequest({
        requested_by: appUserId,
        gym_id: myGym?.id || null,
        fighter_a_id: form.fighter_a_id,
        fighter_a_name: fighterA ? `${fighterA.first_name} ${fighterA.last_name}` : null,
        fighter_b_id: form.fighter_b_id || null,
        fighter_b_name: fighterB ? `${fighterB.first_name} ${fighterB.last_name}` : null,
        discipline: form.discipline,
        weight_class: form.weight_class,
        fight_type: form.fight_type,
        number_of_rounds: form.number_of_rounds,
        is_championship: form.is_championship,
        notes: form.notes || null,
        eligibility_check: eligibilityResult,
        status: 'submitted',
        submitted_at: new Date().toISOString(),
      } as any);

      toast.success('Solicitud enviada para aprobación');
      navigate('/gym/dashboard');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const opponentFighters = allFighters.filter(f => f.id !== form.fighter_a_id);

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl space-y-6">
      <BackButton to="/gym/dashboard" />
      <PageHeader
        title="Solicitar Pelea"
        subtitle="Envía una solicitud de pelea para aprobación del coordinador técnico"
        showBackButton={false}
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Swords className="h-5 w-5" />
            Detalles de la Pelea
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Fighter A */}
          <div>
            <Label>Tu Peleador *</Label>
            <Select value={form.fighter_a_id} onValueChange={v => setForm(p => ({ ...p, fighter_a_id: v }))}>
              <SelectTrigger><SelectValue placeholder="Seleccionar peleador" /></SelectTrigger>
              <SelectContent>
                {gymFighters.map(f => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.first_name} {f.last_name} {f.nickname ? `"${f.nickname}"` : ''} — {f.weight_class}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Fighter B */}
          <div>
            <Label>Oponente</Label>
            <Select value={form.fighter_b_id} onValueChange={v => setForm(p => ({ ...p, fighter_b_id: v }))}>
              <SelectTrigger><SelectValue placeholder="Seleccionar oponente (opcional)" /></SelectTrigger>
              <SelectContent>
                {opponentFighters.map(f => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.first_name} {f.last_name} {f.nickname ? `"${f.nickname}"` : ''} — {f.weight_class}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Weight / Discipline / Type */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Categoría de Peso *</Label>
              <Select value={form.weight_class} onValueChange={v => setForm(p => ({ ...p, weight_class: v }))}>
                <SelectTrigger><SelectValue placeholder="Peso" /></SelectTrigger>
                <SelectContent>
                  {WEIGHT_CLASSES.map(wc => (
                    <SelectItem key={wc.value} value={wc.value}>{wc.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Disciplina</Label>
              <Select value={form.discipline} onValueChange={v => setForm(p => ({ ...p, discipline: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="MMA">MMA</SelectItem>
                  <SelectItem value="Boxing">Boxeo</SelectItem>
                  <SelectItem value="Kickboxing">Kickboxing</SelectItem>
                  <SelectItem value="Muay Thai">Muay Thai</SelectItem>
                  <SelectItem value="BJJ">BJJ</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Tipo</Label>
              <Select value={form.fight_type} onValueChange={v => setForm(p => ({ ...p, fight_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="AMATEUR">Amateur</SelectItem>
                  <SelectItem value="SEMI_PRO">Semi-Pro</SelectItem>
                  <SelectItem value="PROFESSIONAL">Profesional</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Rounds</Label>
              <Select value={String(form.number_of_rounds)} onValueChange={v => setForm(p => ({ ...p, number_of_rounds: Number(v) }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map(n => (
                    <SelectItem key={n} value={String(n)}>{n} rounds</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Switch checked={form.is_championship} onCheckedChange={v => setForm(p => ({ ...p, is_championship: v }))} />
            <Label>Pelea de campeonato</Label>
          </div>

          <div>
            <Label>Notas adicionales</Label>
            <Textarea
              value={form.notes}
              onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              placeholder="Información adicional para el coordinador..."
              rows={3}
            />
          </div>

          {/* Eligibility Check */}
          {form.fighter_a_id && form.fighter_b_id && (
            <div className="space-y-2">
              <Button variant="outline" size="sm" onClick={handleCheckEligibility} disabled={checking} className="w-full">
                <Shield className="h-4 w-4 mr-2" />
                {checking ? 'Verificando...' : 'Verificar Elegibilidad'}
              </Button>

              {eligibilityResult && (
                <div className="space-y-2">
                  <div className={`p-2 rounded text-sm font-medium ${eligibilityResult.eligible ? 'bg-green-500/10 text-green-400' : 'bg-destructive/10 text-destructive'}`}>
                    {eligibilityResult.eligible ? '✅ Ambos peleadores son elegibles' : '⚠️ No cumplen todos los requisitos'}
                  </div>
                  {(eligibilityResult.checks || []).map((check: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      {check.passed ? <CheckCircle className="h-3.5 w-3.5 text-green-400" /> : <AlertTriangle className="h-3.5 w-3.5 text-destructive" />}
                      <span>{check.label}: {check.detail}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <Button onClick={handleSubmit} className="w-full" disabled={!form.fighter_a_id || !form.weight_class}>
            <Send className="h-4 w-4 mr-2" />
            Enviar Solicitud
          </Button>
        </CardContent>
      </Card>

      {/* My Requests */}
      {!requestsLoading && requests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Mis Solicitudes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {requests.slice(0, 5).map(req => (
              <div key={req.id} className="flex items-center justify-between text-sm p-2 rounded bg-muted/50">
                <span>{req.fighter_a_name || 'TBD'} vs {req.fighter_b_name || 'TBD'}</span>
                <Badge variant="outline">{req.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
