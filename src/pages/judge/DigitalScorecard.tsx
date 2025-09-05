import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, Clock, Users, Trophy, Plus, Minus, Save, Send } from 'lucide-react';
import { useFightRealtime } from '@/hooks/useFightRealtime';
import { useCurrentJudge } from '@/hooks/useJudges';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export default function DigitalScorecard() {
  const { fightId } = useParams<{ fightId: string }>();
  const { toast } = useToast();
  const { currentJudge } = useCurrentJudge();
  const { realtimeData, getCurrentRound, getFightStatus, broadcastScorecardUpdate } = useFightRealtime(fightId!);
  
  const [currentScorecard, setCurrentScorecard] = useState({
    round_number: 1,
    fighter_a_score: 10,
    fighter_b_score: 9,
    knockdown_fighter_a: 0,
    knockdown_fighter_b: 0,
    point_deduction_a: 0,
    point_deduction_b: 0,
    notes: ''
  });
  
  const [fight, setFight] = useState<any>(null);
  const [submittedRounds, setSubmittedRounds] = useState<Set<number>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (fightId) {
      fetchFightDetails();
      loadSubmittedRounds();
    }
  }, [fightId]);

  useEffect(() => {
    const round = getCurrentRound();
    if (round && round !== currentScorecard.round_number) {
      setCurrentScorecard(prev => ({ ...prev, round_number: round }));
    }
  }, [getCurrentRound()]);

  const fetchFightDetails = async () => {
    const { data, error } = await supabase
      .from('fights')
      .select(`
        *,
        fighterA:fighter_profiles!fighter_a_id(first_name, last_name, nickname),
        fighterB:fighter_profiles!fighter_b_id(first_name, last_name, nickname),
        event:bdg_event(name, state)
      `)
      .eq('id', fightId)
      .single();
    
    if (error) {
      toast({ title: "Error", description: "No se pudo cargar la pelea", variant: "destructive" });
      return;
    }
    
    setFight(data);
  };

  const loadSubmittedRounds = async () => {
    if (!currentJudge?.id) return;
    
    const { data } = await supabase
      .from('fight_scorecards')
      .select('round_number')
      .eq('fight_id', fightId)
      .eq('judge_id', currentJudge.id);
    
    if (data) {
      setSubmittedRounds(new Set(data.map(sc => sc.round_number)));
    }
  };

  const adjustScore = (fighter: 'A' | 'B', adjustment: number) => {
    const field = fighter === 'A' ? 'fighter_a_score' : 'fighter_b_score';
    setCurrentScorecard(prev => ({
      ...prev,
      [field]: Math.max(6, Math.min(10, prev[field] + adjustment))
    }));
  };

  const adjustKnockdown = (fighter: 'A' | 'B', adjustment: number) => {
    const field = fighter === 'A' ? 'knockdown_fighter_a' : 'knockdown_fighter_b';
    setCurrentScorecard(prev => ({
      ...prev,
      [field]: Math.max(0, prev[field] + adjustment)
    }));
  };

  const adjustDeduction = (fighter: 'A' | 'B', adjustment: number) => {
    const field = fighter === 'A' ? 'point_deduction_a' : 'point_deduction_b';
    setCurrentScorecard(prev => ({
      ...prev,
      [field]: Math.max(0, prev[field] + adjustment)
    }));
  };

  const submitScorecard = async (isFinal = false) => {
    if (!currentJudge?.id) {
      toast({ title: "Error", description: "No se pudo identificar al juez", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const scorecardData = {
        fight_id: fightId,
        judge_id: currentJudge.id,
        round_number: currentScorecard.round_number,
        fighter_a_score: currentScorecard.fighter_a_score,
        fighter_b_score: currentScorecard.fighter_b_score,
        knockdown_fighter_a: currentScorecard.knockdown_fighter_a,
        knockdown_fighter_b: currentScorecard.knockdown_fighter_b,
        point_deduction_a: currentScorecard.point_deduction_a,
        point_deduction_b: currentScorecard.point_deduction_b,
        notes: currentScorecard.notes,
        round_start_time: new Date().toISOString(),
        round_end_time: isFinal ? new Date().toISOString() : null
      };

      const { error } = await supabase
        .from('fight_scorecards')
        .upsert(scorecardData, {
          onConflict: 'fight_id,judge_id,round_number'
        });

      if (error) throw error;

      // Broadcast update
      await broadcastScorecardUpdate(scorecardData);
      
      setSubmittedRounds(prev => new Set([...prev, currentScorecard.round_number]));
      
      toast({ 
        title: "Scorecard enviado", 
        description: `Round ${currentScorecard.round_number} ${isFinal ? 'finalizado' : 'guardado'} exitosamente`
      });

      // Reset for next round if final
      if (isFinal) {
        setCurrentScorecard(prev => ({
          ...prev,
          round_number: prev.round_number + 1,
          fighter_a_score: 10,
          fighter_b_score: 9,
          knockdown_fighter_a: 0,
          knockdown_fighter_b: 0,
          point_deduction_a: 0,
          point_deduction_b: 0,
          notes: ''
        }));
      }
      
    } catch (error) {
      console.error('Error submitting scorecard:', error);
      toast({ title: "Error", description: "No se pudo enviar el scorecard", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentJudge) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Acceso Denegado</h3>
          <p className="text-muted-foreground">Solo jueces autorizados pueden acceder a esta página</p>
        </div>
      </div>
    );
  }

  if (!fight) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const fightStatus = getFightStatus();
  const isRoundSubmitted = submittedRounds.has(currentScorecard.round_number);
  
  return (
    <div className="space-y-6 max-w-4xl mx-auto p-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">
                Scorecard Digital - Round {currentScorecard.round_number}
              </CardTitle>
              <CardDescription>
                {fight.fighterA?.first_name} {fight.fighterA?.last_name} vs {fight.fighterB?.first_name} {fight.fighterB?.last_name}
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={fightStatus === 'ACTIVE' ? 'default' : 'secondary'}>
                <Clock className="mr-1 h-3 w-3" />
                {fightStatus}
              </Badge>
              <Badge variant="outline">
                {fight.weight_class}
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Scoring Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fighter A Scoring */}
        <Card className="border-l-4 border-l-red-500">
          <CardHeader>
            <CardTitle className="text-red-600">
              {fight.fighterA?.first_name} {fight.fighterA?.last_name}
              {fight.fighterA?.nickname && <span className="text-sm text-muted-foreground"> "{fight.fighterA.nickname}"</span>}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Round Score */}
            <div>
              <label className="text-sm font-medium mb-2 block">Puntuación del Round</label>
              <div className="flex items-center justify-center gap-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => adjustScore('A', -1)}
                  disabled={isRoundSubmitted}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="text-3xl font-bold text-red-600 min-w-[60px] text-center">
                  {currentScorecard.fighter_a_score}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => adjustScore('A', 1)}
                  disabled={isRoundSubmitted}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Knockdowns */}
            <div>
              <label className="text-sm font-medium mb-2 block">Knockdowns</label>
              <div className="flex items-center justify-center gap-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => adjustKnockdown('A', -1)}
                  disabled={isRoundSubmitted}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="text-xl font-semibold min-w-[40px] text-center">
                  {currentScorecard.knockdown_fighter_a}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => adjustKnockdown('A', 1)}
                  disabled={isRoundSubmitted}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Point Deductions */}
            <div>
              <label className="text-sm font-medium mb-2 block">Deducción de Puntos</label>
              <div className="flex items-center justify-center gap-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => adjustDeduction('A', -1)}
                  disabled={isRoundSubmitted}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="text-xl font-semibold min-w-[40px] text-center">
                  {currentScorecard.point_deduction_a}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => adjustDeduction('A', 1)}
                  disabled={isRoundSubmitted}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fighter B Scoring */}
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader>
            <CardTitle className="text-blue-600">
              {fight.fighterB?.first_name} {fight.fighterB?.last_name}
              {fight.fighterB?.nickname && <span className="text-sm text-muted-foreground"> "{fight.fighterB.nickname}"</span>}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Round Score */}
            <div>
              <label className="text-sm font-medium mb-2 block">Puntuación del Round</label>
              <div className="flex items-center justify-center gap-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => adjustScore('B', -1)}
                  disabled={isRoundSubmitted}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="text-3xl font-bold text-blue-600 min-w-[60px] text-center">
                  {currentScorecard.fighter_b_score}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => adjustScore('B', 1)}
                  disabled={isRoundSubmitted}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Knockdowns */}
            <div>
              <label className="text-sm font-medium mb-2 block">Knockdowns</label>
              <div className="flex items-center justify-center gap-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => adjustKnockdown('B', -1)}
                  disabled={isRoundSubmitted}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="text-xl font-semibold min-w-[40px] text-center">
                  {currentScorecard.knockdown_fighter_b}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => adjustKnockdown('B', 1)}
                  disabled={isRoundSubmitted}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Point Deductions */}
            <div>
              <label className="text-sm font-medium mb-2 block">Deducción de Puntos</label>
              <div className="flex items-center justify-center gap-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => adjustDeduction('B', -1)}
                  disabled={isRoundSubmitted}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="text-xl font-semibold min-w-[40px] text-center">
                  {currentScorecard.point_deduction_b}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => adjustDeduction('B', 1)}
                  disabled={isRoundSubmitted}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Notas del Round</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Observaciones sobre el round (golpes significativos, control, etc.)"
            value={currentScorecard.notes}
            onChange={(e) => setCurrentScorecard(prev => ({ ...prev, notes: e.target.value }))}
            disabled={isRoundSubmitted}
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-center">
        <Button
          variant="outline"
          onClick={() => submitScorecard(false)}
          disabled={isSubmitting || isRoundSubmitted}
          className="flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          Guardar Round
        </Button>
        
        <Button
          onClick={() => submitScorecard(true)}
          disabled={isSubmitting || isRoundSubmitted}
          className="flex items-center gap-2"
        >
          <Send className="h-4 w-4" />
          {isSubmitting ? 'Enviando...' : 'Finalizar Round'}
        </Button>
      </div>

      {isRoundSubmitted && (
        <div className="text-center">
          <Badge variant="secondary" className="text-sm">
            Round {currentScorecard.round_number} ya enviado
          </Badge>
        </div>
      )}

      {/* Previous Scorecards Summary */}
      {realtimeData.scorecards.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Resumen de Rounds</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Array.from({ length: Math.max(...realtimeData.scorecards.map(sc => sc.round_number)) }, (_, i) => {
                const roundNum = i + 1;
                const roundScorecard = realtimeData.scorecards.find(sc => 
                  sc.round_number === roundNum && sc.judge_id === currentJudge?.id
                );
                
                return (
                  <div key={roundNum} className="text-center p-3 bg-muted rounded">
                    <div className="font-medium">Round {roundNum}</div>
                    {roundScorecard ? (
                      <div className="text-sm text-primary">
                        {roundScorecard.fighter_a_score} - {roundScorecard.fighter_b_score}
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground">Pendiente</div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}