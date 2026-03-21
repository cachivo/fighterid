import { useVisionEngineStatus } from '@/hooks/useVisionEngineStatus';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff } from 'lucide-react';

interface VisionEngineIndicatorProps {
  fightId: string;
}

export default function VisionEngineIndicator({ fightId }: VisionEngineIndicatorProps) {
  const { isLive, deviceId } = useVisionEngineStatus(fightId);

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
          Motor AI
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
