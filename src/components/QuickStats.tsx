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
    <div className="sticky top-12 sm:top-14 z-40 bg-black/90 backdrop-blur-md border-b border-purple-neon-primary/20 px-3 py-2.5 sm:px-4 sm:py-3 overflow-hidden">
      <div className="flex gap-3 sm:gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex-shrink-0 snap-start">
              <Skeleton className="h-14 sm:h-16 w-28 sm:w-32 bg-purple-500/10" />
            </div>
          ))
        ) : (
          statsConfig.map((stat) => (
            <div 
              key={stat.title}
              className="flex-shrink-0 snap-start min-w-[120px] sm:min-w-[140px]"
            >
              <div className="flex items-center gap-2 sm:gap-3 px-3 py-2 sm:px-4 bg-purple-neon-primary/10 rounded-lg border border-purple-neon-primary/20 hover:bg-purple-neon-primary/15 transition-colors">
                <stat.icon className="h-4 w-4 sm:h-5 sm:w-5 text-purple-neon-primary flex-shrink-0" />
                <div>
                  <p className="text-base sm:text-lg md:text-xl font-bold text-white leading-none">{stat.value}</p>
                  <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5">{stat.title}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
