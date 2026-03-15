import { useAIStrikeEvents } from '@/hooks/useAIStrikeEvents';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Activity } from 'lucide-react';

interface LiveFightStatsWidgetProps {
  fightId: string;
}

export default function LiveFightStatsWidget({ fightId }: LiveFightStatsWidgetProps) {
  const { events, loading } = useAIStrikeEvents(fightId);

  if (loading || events.length === 0) return null;

  const statsA = computeQuick(events, 'A');
  const statsB = computeQuick(events, 'B');

  return (
    <div className="rounded-xl border border-white/10 bg-gray-950/80 p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm">
        <Activity className="w-4 h-4 text-red-500 animate-pulse" />
        <span className="font-semibold text-white">Estadísticas AI en Vivo</span>
        <Badge variant="outline" className="text-[10px] border-white/20 text-gray-400 ml-auto">
          {events.length} eventos
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatColumn label="🔴 Peleador A" stats={statsA} color="red" />
        <StatColumn label="🔵 Peleador B" stats={statsB} color="blue" />
      </div>
    </div>
  );
}

function computeQuick(events: any[], fighter: string) {
  const mine = events.filter((e: any) => e.fighter === fighter);
  const attempted = mine.filter((e: any) => e.event_type === 'strike_attempted').length;
  const connected = mine.filter((e: any) => e.event_type === 'strike_connected').length;
  return {
    attempted,
    connected,
    accuracy: attempted > 0 ? Math.round((connected / attempted) * 100) : 0,
  };
}

function StatColumn({ label, stats, color }: { label: string; stats: ReturnType<typeof computeQuick>; color: 'red' | 'blue' }) {
  const accent = color === 'red' ? 'text-red-400' : 'text-blue-400';
  const progressColor = color === 'red' ? '[&>div]:bg-red-500' : '[&>div]:bg-blue-500';

  return (
    <div className="space-y-2">
      <div className={`text-xs font-medium ${accent}`}>{label}</div>
      <div className="text-2xl font-black text-white">{stats.connected}<span className="text-sm text-gray-500 font-normal ml-1">/ {stats.attempted}</span></div>
      <div className="flex items-center gap-2">
        <Progress value={stats.accuracy} className={`h-1.5 bg-white/10 flex-1 ${progressColor}`} />
        <span className="text-xs text-gray-400 font-mono">{stats.accuracy}%</span>
      </div>
    </div>
  );
}
