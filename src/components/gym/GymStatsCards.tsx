import { Users, Trophy, TrendingDown, Minus, Dumbbell } from 'lucide-react';

interface GymStatsCardsProps {
  stats: {
    active_fighters: number;
    total_wins: number;
    total_losses: number;
    total_draws: number;
  };
  disciplines: Array<{ name: string }>;
}

export function GymStatsCards({ stats, disciplines }: GymStatsCardsProps) {
  const cards = [
    { label: 'Activos', value: stats.active_fighters, icon: Users, color: 'text-blue-500' },
    { label: 'Victorias', value: stats.total_wins, icon: Trophy, color: 'text-green-500' },
    { label: 'Derrotas', value: stats.total_losses, icon: TrendingDown, color: 'text-red-500' },
    { label: 'Empates', value: stats.total_draws, icon: Minus, color: 'text-yellow-500' },
  ];

  return (
    <div className="space-y-4">
      {/* Stats horizontal scroll */}
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
        {cards.map(card => (
          <div
            key={card.label}
            className="min-w-[120px] flex-shrink-0 rounded-xl border bg-card p-3 text-center"
          >
            <card.icon className={`h-5 w-5 mx-auto mb-1 ${card.color}`} />
            <p className="text-2xl font-bold">{card.value}</p>
            <p className="text-xs text-muted-foreground">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Disciplines */}
      {disciplines.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <Dumbbell className="h-4 w-4 text-muted-foreground" />
          {disciplines.map(d => (
            <span
              key={d.name}
              className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium"
            >
              {d.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
