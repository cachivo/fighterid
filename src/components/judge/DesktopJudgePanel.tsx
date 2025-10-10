import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useRoundClock } from '@/hooks/useRoundClock';
import { useRealtimeScoring } from '@/hooks/useRealtimeScoring';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import type { Corner, StrikeType } from '@/lib/scoring-types';

interface DesktopJudgePanelProps {
  roundId: string;
  fightId: string;
  judgeId: string;
  redFighter: { name: string; avatar?: string };
  blueFighter: { name: string; avatar?: string };
  startsAt?: string;
}

export function DesktopJudgePanel({
  roundId,
  fightId,
  judgeId,
  redFighter,
  blueFighter,
  startsAt
}: DesktopJudgePanelProps) {
  const { nowMs } = useRoundClock(startsAt);
  const { events } = useRealtimeScoring(roundId);
  const [stats, setStats] = useState({
    red: { strikes: 0, defenses: 0, knockdowns: 0 },
    blue: { strikes: 0, defenses: 0, knockdowns: 0 }
  });
  
  const lastEventTime = useRef(0);
  const DEBOUNCE_MS = 100; // Anti doble-click

  // Actualizar stats cuando cambien los eventos
  useEffect(() => {
    const newStats = {
      red: { strikes: 0, defenses: 0, knockdowns: 0 },
      blue: { strikes: 0, defenses: 0, knockdowns: 0 }
    };
    
    events.forEach(e => {
      const corner = e.corner as Corner;
      if (e.type === 'defense') {
        newStats[corner].defenses++;
      } else if (e.type === 'knockdown') {
        newStats[corner].knockdowns++;
      } else {
        newStats[corner].strikes++;
      }
    });
    
    setStats(newStats);
  }, [events]);

  // Registrar evento en DB
  async function recordEvent(corner: Corner, type: StrikeType) {
    const now = performance.now();
    if (now - lastEventTime.current < DEBOUNCE_MS) return;
    lastEventTime.current = now;

    const payload = {
      fight_id: fightId,
      round_id: roundId,
      judge_id: judgeId,
      timestamp_ms: Math.floor(nowMs),
      corner,
      type,
      created_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('scoring_events')
      .insert(payload);

    if (error) {
      console.error('Error registrando evento:', error);
      toast.error('Error al registrar evento');
    } else {
      toast.success(`${type === 'defense' ? 'Defensa' : 'Golpe'} registrado - ${corner.toUpperCase()}`);
    }
  }

  // Handler para clicks en zona del peleador
  function handleCornerClick(corner: Corner, event: React.MouseEvent) {
    event.preventDefault();
    
    if (event.button === 0) {
      // Click izquierdo = Golpe
      recordEvent(corner, 'punch');
    } else if (event.button === 2) {
      // Click derecho = Defensa
      recordEvent(corner, 'defense');
    }
  }

  // Prevenir menú contextual globalmente
  useEffect(() => {
    const preventDefault = (e: MouseEvent) => e.preventDefault();
    document.addEventListener('contextmenu', preventDefault);
    return () => document.removeEventListener('contextmenu', preventDefault);
  }, []);

  function formatTime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  return (
    <div className="min-h-screen bg-background p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Panel de Juez - Round 1</h1>
          <p className="text-muted-foreground">{formatTime(nowMs)}</p>
        </div>
        <Badge variant="destructive" className="text-lg px-4 py-2">
          🔴 EN VIVO
        </Badge>
      </div>

      {/* Zonas Clickeables */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* ESQUINA ROJA */}
        <div
          className="relative h-96 bg-red-950/20 border-4 border-red-600 rounded-xl cursor-pointer hover:bg-red-950/30 transition-colors"
          onMouseDown={(e) => handleCornerClick('red', e)}
          onContextMenu={(e) => e.preventDefault()}
        >
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
            <div className="text-6xl mb-4">🔴</div>
            <h2 className="text-2xl font-bold mb-2 text-center">{redFighter.name}</h2>
            <div className="w-full space-y-2 text-center">
              <div className="text-5xl font-bold text-red-400">{stats.red.strikes}</div>
              <div className="text-sm text-muted-foreground">Golpes</div>
              <Separator className="my-2" />
              <div className="text-2xl font-semibold text-red-300">{stats.red.defenses}</div>
              <div className="text-xs text-muted-foreground">Defensas</div>
            </div>
          </div>
          
          {/* Instrucciones */}
          <div className="absolute bottom-4 left-0 right-0 text-center text-xs text-muted-foreground">
            <p className="font-semibold">Click IZQ = Golpe | Click DER = Defensa</p>
          </div>
        </div>

        {/* ESQUINA AZUL */}
        <div
          className="relative h-96 bg-blue-950/20 border-4 border-blue-600 rounded-xl cursor-pointer hover:bg-blue-950/30 transition-colors"
          onMouseDown={(e) => handleCornerClick('blue', e)}
          onContextMenu={(e) => e.preventDefault()}
        >
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
            <div className="text-6xl mb-4">🔵</div>
            <h2 className="text-2xl font-bold mb-2 text-center">{blueFighter.name}</h2>
            <div className="w-full space-y-2 text-center">
              <div className="text-5xl font-bold text-blue-400">{stats.blue.strikes}</div>
              <div className="text-sm text-muted-foreground">Golpes</div>
              <Separator className="my-2" />
              <div className="text-2xl font-semibold text-blue-300">{stats.blue.defenses}</div>
              <div className="text-xs text-muted-foreground">Defensas</div>
            </div>
          </div>
          
          <div className="absolute bottom-4 left-0 right-0 text-center text-xs text-muted-foreground">
            <p className="font-semibold">Click IZQ = Golpe | Click DER = Defensa</p>
          </div>
        </div>
      </div>

      {/* Botones Especiales */}
      <div className="flex gap-4 justify-center mb-6">
        <Button 
          variant="destructive" 
          size="lg"
          onClick={() => recordEvent('red', 'knockdown')}
        >
          Knockdown Rojo
        </Button>
        <Button 
          variant="destructive" 
          size="lg"
          onClick={() => recordEvent('blue', 'knockdown')}
        >
          Knockdown Azul
        </Button>
        <Button variant="outline" size="lg" onClick={() => recordEvent('red', 'foul')}>
          Foul Rojo
        </Button>
        <Button variant="outline" size="lg" onClick={() => recordEvent('blue', 'foul')}>
          Foul Azul
        </Button>
      </div>

      {/* Stream de Eventos */}
      <Card>
        <CardHeader>
          <CardTitle>Eventos Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-40">
            {events.slice(-10).reverse().map((e, idx) => (
              <div key={e.id || idx} className="text-sm mb-2">
                <span className="font-mono text-xs text-muted-foreground">
                  {formatTime(e.timestamp_ms)}
                </span>
                {' - '}
                <span className={e.corner === 'red' ? 'text-red-400' : 'text-blue-400'}>
                  {e.corner.toUpperCase()}
                </span>
                {' - '}
                <span className="capitalize">{e.type}</span>
              </div>
            ))}
            {events.length === 0 && (
              <p className="text-sm text-muted-foreground">Esperando eventos...</p>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
