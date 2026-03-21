import { useVisionEngineStatus } from '@/hooks/useVisionEngineStatus';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, Activity, Users } from 'lucide-react';

interface VisionEngineIndicatorProps {
  fightId: string;
}

export default function VisionEngineIndicator({ fightId }: VisionEngineIndicatorProps) {
  const { isLive, deviceId, fps, personsDetected } = useVisionEngineStatus(fightId);

  if (!isLive && !deviceId) return null;

  return (
    <Badge
      variant="outline"
      className={`gap-1.5 text-[10px] sm:text-xs font-semibold px-2 py-1 ${
        isLive
          ? 'border-green-500/50 bg-green-500/10 text-green-400'
          : 'border-destructive/50 bg-destructive/10 text-destructive'
      }`}
    >
      {isLive ? (
        <>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
          <Wifi className="h-3 w-3" />
          <span className="truncate max-w-[120px]">
            Motor AI{deviceId && deviceId !== 'unknown' ? ` · ${deviceId}` : ''}
          </span>
          {fps !== null && (
            <span className="flex items-center gap-0.5 text-green-300">
              <Activity className="h-2.5 w-2.5" />
              {Math.round(fps)}
            </span>
          )}
          {personsDetected !== null && (
            <span className="flex items-center gap-0.5 text-green-300">
              <Users className="h-2.5 w-2.5" />
              {personsDetected}
            </span>
          )}
        </>
      ) : (
        <>
          <span className="h-2 w-2 rounded-full bg-destructive" />
          <WifiOff className="h-3 w-3" />
          Sin señal
        </>
      )}
    </Badge>
  );
}
