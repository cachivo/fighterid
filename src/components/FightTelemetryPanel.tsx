import type { FightMeta } from '@/hooks/useFightTelemetry';

interface FightTelemetryPanelProps {
  meta: FightMeta | null;
  shortSession: string;
  status: 'connecting' | 'active' | 'error';
  roundNumber?: number;
  clockDisplay?: string;
  strikesByCorner?: Record<string, Record<string, number>>;
}

const statusIndicator: Record<string, string> = {
  connecting: '🟡 CONNECTING',
  active: '🟢 LIVE',
  error: '🔴 ERROR',
};

export default function FightTelemetryPanel({
  meta,
  shortSession,
  status,
  roundNumber,
  clockDisplay,
  strikesByCorner,
}: FightTelemetryPanelProps) {
  const now = meta ? new Date(meta.startedAt) : new Date();
  const fecha = now.toISOString().slice(0, 10);
  const hora = now.toTimeString().slice(0, 8);

  return (
    <div className="rounded-md border border-border bg-background/80 backdrop-blur px-4 py-3 font-mono text-xs text-foreground space-y-2">
      <div className="text-sm font-bold tracking-widest text-primary">FIGHT TELEMETRY</div>
      <div className="border-t border-border" />

      <div className="grid grid-cols-2 gap-x-6 gap-y-0.5">
        <span className="text-muted-foreground">EVENTO</span>
        <span className="truncate">{meta?.eventName || '—'}</span>

        <span className="text-muted-foreground">PELEA</span>
        <span>#{meta?.fightNumber ?? '—'}</span>

        <span className="text-muted-foreground">RED</span>
        <span className="text-red-400 truncate">{meta?.redName || '—'}</span>

        <span className="text-muted-foreground">BLUE</span>
        <span className="text-blue-400 truncate">{meta?.blueName || '—'}</span>

        <span className="text-muted-foreground">FECHA</span>
        <span>{fecha}</span>

        <span className="text-muted-foreground">HORA</span>
        <span>{hora}</span>

        {roundNumber != null && (
          <>
            <span className="text-muted-foreground">ROUND</span>
            <span>{roundNumber}{clockDisplay ? `  MINUTO: ${clockDisplay}` : ''}</span>
          </>
        )}

        <span className="text-muted-foreground">SESSION</span>
        <span>{shortSession}</span>

        <span className="text-muted-foreground">STATUS</span>
        <span>{statusIndicator[status]}</span>
      </div>

      {/* Inline strike counts when available */}
      {strikesByCorner && (Object.keys(strikesByCorner.red).length > 0 || Object.keys(strikesByCorner.blue).length > 0) && (
        <>
          <div className="border-t border-border pt-1">
            <span className="text-sm font-bold tracking-widest text-primary">STRIKES</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <CornerStrikes label={meta?.redName || 'RED'} strikes={strikesByCorner.red} color="text-red-400" />
            <CornerStrikes label={meta?.blueName || 'BLUE'} strikes={strikesByCorner.blue} color="text-blue-400" />
          </div>
        </>
      )}
    </div>
  );
}

function CornerStrikes({ label, strikes, color }: { label: string; strikes: Record<string, number>; color: string }) {
  const entries = Object.entries(strikes).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) return null;

  return (
    <div>
      <div className={`${color} font-semibold truncate mb-0.5`}>{label}</div>
      {entries.map(([type, count]) => (
        <div key={type} className="flex justify-between">
          <span className="text-muted-foreground capitalize">{type.replace('_', ' ')}</span>
          <span>{count}</span>
        </div>
      ))}
    </div>
  );
}
