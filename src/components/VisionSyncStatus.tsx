import { Badge } from '@/components/ui/badge';
import type { VisionSyncState } from '@/hooks/useVisionSyncSession';

interface VisionSyncStatusProps {
  status: VisionSyncState;
  hudConnected: boolean;
  visionConnected: boolean;
  shortSession: string;
}

const stateConfig: Record<VisionSyncState, { engineLabel: string; indicator: string }> = {
  waiting: {
    engineLabel: 'WAITING',
    indicator: '🔴 Waiting for Vision Engine',
  },
  connecting: {
    engineLabel: 'CONNECTING',
    indicator: '🟡 Vision Engine Connecting',
  },
  synced: {
    engineLabel: 'CONNECTED',
    indicator: '🟢 Vision Engine Synced',
  },
  error: {
    engineLabel: 'ERROR',
    indicator: '🔴 Vision Engine Error',
  },
};

export default function VisionSyncStatus({
  status,
  hudConnected,
  visionConnected,
  shortSession,
}: VisionSyncStatusProps) {
  const state = stateConfig[status];

  return (
    <div className="inline-flex flex-col gap-1 rounded-md border border-border bg-background/80 px-3 py-2 text-xs font-mono text-foreground backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <span className="font-semibold">VISION STATUS</span>
        <Badge variant={visionConnected ? 'default' : 'secondary'}>
          {visionConnected ? 'SYNCED' : 'WAITING'}
        </Badge>
      </div>
      <span>HUD: {hudConnected ? 'CONNECTED' : 'DISCONNECTED'}</span>
      <span>VISION ENGINE: {state.engineLabel}</span>
      <span>SESSION: {shortSession}</span>
      <span className="text-muted-foreground">{state.indicator}</span>
    </div>
  );
}
