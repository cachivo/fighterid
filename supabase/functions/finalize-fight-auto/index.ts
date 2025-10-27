import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FightData {
  fight: any;
  scorecards: any[];
  statistics: any[];
  aiStrikes: any[];
  controlEvents: any[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fight_id, result_type = 'DECISION', override_winner_id = null } = await req.json();
    
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    
    // ═══════════════════════════════════════════════════════════
    // PASO 1: Recopilar TODOS los datos de la pelea
    // ═══════════════════════════════════════════════════════════
    const fightData = await collectFightData(supabase, fight_id);
    
    if (!fightData.fight) {
      throw new Error("Pelea no encontrada");
    }
    
    // ═══════════════════════════════════════════════════════════
    // PASO 2: Determinar ganador automáticamente
    // ═══════════════════════════════════════════════════════════
    const result = determineWinner(fightData, result_type, override_winner_id);
    
    // ═══════════════════════════════════════════════════════════
    // PASO 3: Generar resumen con IA (Lovable AI)
    // ═══════════════════════════════════════════════════════════
    const summary = await generateAISummary(fightData, result);
    
    // ═══════════════════════════════════════════════════════════
    // PASO 4: Guardar resultado en fight_results
    // ═══════════════════════════════════════════════════════════
    const { error: resultError } = await supabase.from('fight_results').upsert({
      fight_id,
      winner_id: result.winner_id,
      result_type,
      finish_method: result.finish_method,
      finish_round: result.finish_round,
      finish_time: result.finish_time,
      judge_1_scorecard: result.judge_1_scorecard,
      judge_2_scorecard: result.judge_2_scorecard,
      judge_3_scorecard: result.judge_3_scorecard,
      judge_1_total: result.judge_1_total,
      judge_2_total: result.judge_2_total,
      judge_3_total: result.judge_3_total,
      confirmed_by: fightData.fight.referee_id,
      confirmed_at: new Date().toISOString()
    });
    
    if (resultError) throw resultError;
    
    // ═══════════════════════════════════════════════════════════
    // PASO 5: Actualizar pelea (triggers actualizan récords)
    // ═══════════════════════════════════════════════════════════
    await supabase.from('fights').update({
      status: 'finished',
      winner_id: result.winner_id,
      finish_method: result.finish_method,
      finish_round: result.finish_round,
      finish_time: result.finish_time
    }).eq('id', fight_id);
    
    // ═══════════════════════════════════════════════════════════
    // PASO 6: Guardar resumen generado por IA
    // ═══════════════════════════════════════════════════════════
    await supabase.from('fight_summaries').upsert({
      fight_id,
      summary_md: summary.text,
      highlights: summary.highlights,
      key_moments: summary.keyMoments,
      fight_stats_summary: summary.stats,
      model_used: "google/gemini-2.5-flash",
      tokens_used: summary.tokens
    });
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        result,
        summary: summary.text
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("Error finalizing fight:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// ═══════════════════════════════════════════════════════════════════
// FUNCIONES HELPER
// ═══════════════════════════════════════════════════════════════════

async function collectFightData(supabase: any, fightId: string): Promise<FightData> {
  const { data: fight } = await supabase
    .from('fights')
    .select(`
      *,
      event:bdg_event(name, start_time),
      fighterA:fighter_profiles!fighter_a_id(*),
      fighterB:fighter_profiles!fighter_b_id(*),
      fight_judges(
        id,
        judge:judges(first_name, last_name)
      )
    `)
    .eq('id', fightId)
    .single();

  const { data: scorecards } = await supabase
    .from('fight_scorecards')
    .select('*')
    .eq('fight_id', fightId)
    .order('round_number');

  const { data: statistics } = await supabase
    .from('fight_statistics')
    .select('*')
    .eq('fight_id', fightId);

  const { data: aiStrikes } = await supabase
    .from('ai_strike_events')
    .select('*')
    .eq('fight_id', fightId)
    .order('timestamp_ms');

  const { data: controlEvents } = await supabase
    .from('fight_control_events')
    .select('*')
    .eq('fight_id', fightId)
    .order('timestamp');

  return {
    fight,
    scorecards: scorecards || [],
    statistics: statistics || [],
    aiStrikes: aiStrikes || [],
    controlEvents: controlEvents || []
  };
}

function determineWinner(data: FightData, resultType: string, overrideWinnerId: string | null) {
  // Si hay override manual (KO, TKO, Submission), usar ese
  if (overrideWinnerId) {
    return {
      winner_id: overrideWinnerId,
      result_type: resultType,
      finish_method: determineFinishMethod(data, resultType),
      finish_round: determineFinishRound(data),
      finish_time: determineFinishTime(data),
      ...calculateScorecards(data)
    };
  }

  // Si es DECISION, calcular por scorecards
  if (resultType === 'DECISION') {
    const scorecards = calculateScorecards(data);
    const winnerId = determineWinnerByScorecard(
      data.fight.fighter_a_id,
      data.fight.fighter_b_id,
      scorecards
    );

    return {
      winner_id: winnerId,
      result_type: 'DECISION',
      finish_method: determineDecisionType(scorecards),
      finish_round: data.fight.scheduled_rounds,
      finish_time: `${data.fight.round_duration_minutes}:00`,
      ...scorecards
    };
  }

  // Por defecto, empate
  return {
    winner_id: null,
    result_type: 'DRAW',
    finish_method: null,
    finish_round: data.fight.scheduled_rounds,
    finish_time: `${data.fight.round_duration_minutes}:00`,
    ...calculateScorecards(data)
  };
}

function calculateScorecards(data: FightData) {
  const judges = Array.from(new Set(data.scorecards.map(sc => sc.judge_id)));
  const maxRounds = data.fight.scheduled_rounds || 3;

  const result: any = {
    judge_1_scorecard: Array(maxRounds).fill(10),
    judge_2_scorecard: Array(maxRounds).fill(10),
    judge_3_scorecard: Array(maxRounds).fill(10),
    judge_1_total: 0,
    judge_2_total: 0,
    judge_3_total: 0
  };

  judges.forEach((judgeId, judgeIndex) => {
    if (judgeIndex >= 3) return; // Solo 3 jueces
    
    const judgeScores = data.scorecards.filter(sc => sc.judge_id === judgeId);
    const scorecard: number[] = [];

    for (let round = 1; round <= maxRounds; round++) {
      const roundScore = judgeScores.find(sc => sc.round_number === round);
      if (roundScore) {
        scorecard.push(roundScore.fighter_a_score);
      } else {
        scorecard.push(10);
      }
    }

    const total = scorecard.reduce((sum, score) => sum + score, 0);
    result[`judge_${judgeIndex + 1}_scorecard`] = scorecard;
    result[`judge_${judgeIndex + 1}_total`] = total;
  });

  return result;
}

function determineWinnerByScorecard(fighterAId: string, fighterBId: string, scorecards: any): string | null {
  const totals = [
    { judge: 1, totalA: scorecards.judge_1_total, totalB: calculateOpponentTotal(scorecards.judge_1_scorecard) },
    { judge: 2, totalA: scorecards.judge_2_total, totalB: calculateOpponentTotal(scorecards.judge_2_scorecard) },
    { judge: 3, totalA: scorecards.judge_3_total, totalB: calculateOpponentTotal(scorecards.judge_3_scorecard) }
  ];

  let winsA = 0;
  let winsB = 0;

  totals.forEach(t => {
    if (t.totalA > t.totalB) winsA++;
    else if (t.totalB > t.totalA) winsB++;
  });

  if (winsA > winsB) return fighterAId;
  if (winsB > winsA) return fighterBId;
  return null; // Draw
}

function calculateOpponentTotal(scorecard: number[]): number {
  return scorecard.reduce((sum, score) => sum + (10 - (10 - score)), 0);
}

function determineDecisionType(scorecards: any): string {
  const totals = [
    { totalA: scorecards.judge_1_total, totalB: calculateOpponentTotal(scorecards.judge_1_scorecard) },
    { totalA: scorecards.judge_2_total, totalB: calculateOpponentTotal(scorecards.judge_2_scorecard) },
    { totalA: scorecards.judge_3_total, totalB: calculateOpponentTotal(scorecards.judge_3_scorecard) }
  ];

  const winnersA = totals.filter(t => t.totalA > t.totalB).length;
  const winnersB = totals.filter(t => t.totalB > t.totalA).length;

  if (winnersA === 3 || winnersB === 3) return "Unanimous Decision";
  if (winnersA === 2 || winnersB === 2) return "Split Decision";
  return "Majority Decision";
}

function determineFinishMethod(data: FightData, resultType: string): string | null {
  if (resultType === 'KO') return 'Knockout';
  if (resultType === 'TKO') return 'Technical Knockout';
  if (resultType === 'SUBMISSION') {
    const subEvent = data.controlEvents.find(e => e.event_type === 'SUBMISSION');
    return subEvent?.description || 'Submission';
  }
  return null;
}

function determineFinishRound(data: FightData): number {
  const finishEvent = data.controlEvents.find(e => 
    ['FIGHT_STOP', 'SUBMISSION', 'KNOCKOUT'].includes(e.event_type)
  );
  return finishEvent?.round_number || data.fight.scheduled_rounds;
}

function determineFinishTime(data: FightData): string {
  const finishEvent = data.controlEvents.find(e => 
    ['FIGHT_STOP', 'SUBMISSION', 'KNOCKOUT'].includes(e.event_type)
  );
  if (finishEvent?.metadata?.time) {
    return finishEvent.metadata.time;
  }
  return `${data.fight.round_duration_minutes}:00`;
}

async function generateAISummary(data: FightData, result: any) {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  
  if (!LOVABLE_API_KEY) {
    console.warn("LOVABLE_API_KEY not found, skipping AI summary generation");
    return {
      text: "Resumen no disponible (API key no configurada)",
      highlights: [],
      keyMoments: [],
      stats: {},
      tokens: 0
    };
  }

  const fighterA = `${data.fight.fighterA.first_name} ${data.fight.fighterA.last_name}${data.fight.fighterA.nickname ? ` "${data.fight.fighterA.nickname}"` : ''}`;
  const fighterB = `${data.fight.fighterB.first_name} ${data.fight.fighterB.last_name}${data.fight.fighterB.nickname ? ` "${data.fight.fighterB.nickname}"` : ''}`;
  
  const statsA = data.statistics.find((s: any) => s.fighter_id === data.fight.fighter_a_id) || {};
  const statsB = data.statistics.find((s: any) => s.fighter_id === data.fight.fighter_b_id) || {};
  
  const aiStrikesA = data.aiStrikes.filter((s: any) => s.fighter === 'A');
  const aiStrikesB = data.aiStrikes.filter((s: any) => s.fighter === 'B');
  
  const prompt = `
Eres un cronista conciso de MMA para Fighter ID. Redacta un resumen profesional en español de 120-180 palabras en un solo párrafo Markdown.

**DATOS DE LA PELEA:**

Evento: ${data.fight.event?.name || 'N/A'}
Fecha: ${data.fight.event?.start_time || 'N/A'}
Peleadores: ${fighterA} vs ${fighterB}
Peso: ${data.fight.weight_class}
Rounds: ${data.fight.scheduled_rounds} x ${data.fight.round_duration_minutes} min

**RESULTADO:**
Ganador: ${result.winner_id === data.fight.fighter_a_id ? fighterA : result.winner_id === data.fight.fighter_b_id ? fighterB : 'Empate'}
Método: ${result.result_type} ${result.finish_method ? `(${result.finish_method})` : ''}
Round: ${result.finish_round}
Tiempo: ${result.finish_time}

**ESTADÍSTICAS ${fighterA} (A):**
- Golpes totales: ${statsA.strikes_landed || 0} / ${statsA.strikes_thrown || 0}
- Golpes significativos: ${statsA.significant_strikes_landed || 0}
- Knockdowns: ${statsA.knockdowns || 0}
- Control: ${statsA.cage_control_time || 0}s

**ESTADÍSTICAS ${fighterB} (B):**
- Golpes totales: ${statsB.strikes_landed || 0} / ${statsB.strikes_thrown || 0}
- Golpes significativos: ${statsB.significant_strikes_landed || 0}
- Knockdowns: ${statsB.knockdowns || 0}
- Control: ${statsB.cage_control_time || 0}s

**DETECCIÓN IA:**
- Strikes conectados A: ${aiStrikesA.filter(s => s.event_type === 'strike_connected').length}
- Strikes conectados B: ${aiStrikesB.filter(s => s.event_type === 'strike_connected').length}

**SCORECARDS:**
Juez 1: ${result.judge_1_total} pts
Juez 2: ${result.judge_2_total} pts
Juez 3: ${result.judge_3_total} pts

**INSTRUCCIONES:**
1. Explica la dinámica general de la pelea
2. Menciona momentos clave (knockdowns, control dominante)
3. Explica por qué ganó el vencedor de forma objetiva
4. Usa datos estadísticos para respaldar tu narrativa
5. No inventes datos que no estén aquí
6. Tono profesional, sin clichés ni hipérboles

Formato: Un solo párrafo en Markdown de 120-180 palabras.
`.trim();

  try {
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "Eres un cronista experto de MMA. Escribe resúmenes concisos, profesionales y basados en datos."
          },
          {
            role: "user",
            content: prompt
          }
        ]
      })
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      throw new Error(`AI Error: ${aiResponse.status} - ${errorText}`);
    }

    const aiData = await aiResponse.json();
    const summaryText = aiData.choices[0].message.content;

    // Extraer highlights automáticamente
    const highlights: string[] = [];
    if (statsA.knockdowns > 0) highlights.push(`${data.fight.fighterA.first_name} logró ${statsA.knockdowns} knockdown(s)`);
    if (statsB.knockdowns > 0) highlights.push(`${data.fight.fighterB.first_name} logró ${statsB.knockdowns} knockdown(s)`);
    if (result.result_type !== 'DECISION') highlights.push(`Finalización: ${result.finish_method}`);

    return {
      text: summaryText,
      highlights,
      keyMoments: extractKeyMoments(data),
      stats: {
        totalStrikesA: statsA.strikes_landed || 0,
        totalStrikesB: statsB.strikes_landed || 0,
        aiAccuracyA: calculateAIAccuracy(aiStrikesA),
        aiAccuracyB: calculateAIAccuracy(aiStrikesB)
      },
      tokens: aiData.usage?.total_tokens || null
    };
  } catch (error) {
    console.error("Error generating AI summary:", error);
    return {
      text: `**${fighterA} vs ${fighterB}** - ${result.result_type} en el evento ${data.fight.event?.name || 'N/A'}. El ganador fue determinado por ${result.finish_method || 'decisión de los jueces'}.`,
      highlights: [],
      keyMoments: [],
      stats: {},
      tokens: 0
    };
  }
}

function extractKeyMoments(data: FightData): any[] {
  const moments: any[] = [];

  // Knockdowns
  data.controlEvents
    .filter(e => e.event_type === 'KNOCKDOWN')
    .forEach(e => {
      moments.push({
        round: e.round_number,
        type: 'knockdown',
        fighter: e.fighter_affected === data.fight.fighter_a_id ? 'A' : 'B',
        description: e.description || 'Knockdown'
      });
    });

  // Submissions attempts
  data.controlEvents
    .filter(e => e.event_type === 'SUBMISSION' || e.description?.toLowerCase().includes('submission'))
    .forEach(e => {
      moments.push({
        round: e.round_number,
        type: 'submission_attempt',
        description: e.description || 'Intento de sumisión'
      });
    });

  return moments.sort((a, b) => a.round - b.round);
}

function calculateAIAccuracy(strikes: any[]): number {
  const connected = strikes.filter(s => s.event_type === 'strike_connected').length;
  const attempted = strikes.length;
  return attempted > 0 ? Math.round((connected / attempted) * 100) : 0;
}
