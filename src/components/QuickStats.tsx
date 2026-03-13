import { useRealTimeStats } from '@/hooks/useRealTimeStats';
import { Users, Activity, Zap, TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export function QuickStats() {
  const { stats, isLoading } = useRealTimeStats();

  const statsConfig = [
    {
      title: 'Peleadores',
      value: stats?.totalFighters || 0,
      icon: Users,
    },
    {
      title: 'Activos',
      value: stats?.activeFighters || 0,
      icon: Activity,
    },
    {
      title: 'En Vivo',
      value: stats?.liveEvents?.length || 0,
      icon: Zap,
    },
    {
      title: 'Crecimiento',
      value: `${stats?.growthRate || 0}%`,
      icon: TrendingUp,
    }
  ];

  return (
    <div className="sticky top-14 z-40 bg-black/95 backdrop-blur-sm border-b border-purple-neon-primary/20 px-2 xs:px-3 sm:px-4 py-2 xs:py-2.5 sm:py-3">
      <div className="flex gap-2 xs:gap-3 overflow-x-auto no-scrollbar pb-1">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex-shrink-0">
              <Skeleton className="h-12 xs:h-14 w-20 xs:w-24 sm:w-28 bg-purple-500/10 rounded-lg" />
            </div>
          ))
        ) : (
          statsConfig.map((stat) => (
            <div 
              key={stat.title}
              className="flex-shrink-0 min-w-[72px] xs:min-w-[88px] sm:min-w-[110px]"
            >
              <div className="flex items-center gap-1.5 xs:gap-2 px-2 xs:px-3 py-1.5 xs:py-2 bg-purple-neon-primary/10 rounded-lg border border-purple-neon-primary/20">
                <stat.icon className="h-3.5 w-3.5 xs:h-4 xs:w-4 sm:h-5 sm:w-5 text-purple-neon-primary flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm xs:text-base sm:text-lg font-bold text-foreground leading-none truncate">{stat.value}</p>
                  <p className="text-[9px] xs:text-[10px] sm:text-xs text-muted-foreground mt-0.5 truncate">{stat.title}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
