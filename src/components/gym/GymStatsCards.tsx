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
    { label: 'Activos', value: stats.active_fighters, icon: Users, color: 'text-fighter-info' },
    { label: 'Victorias', value: stats.total_wins, icon: Trophy, color: 'text-fighter-success' },
    { label: 'Derrotas', value: stats.total_losses, icon: TrendingDown, color: 'text-fighter-danger' },
    { label: 'Empates', value: stats.total_draws, icon: Minus, color: 'text-fighter-warning' },
  ];

  return (
    <div className="space-y-4">
      {/* Stats grid - fixed 4 columns for mobile */}
      <div className="grid grid-cols-4 gap-2">
        {cards.map(card => (
          <div
            key={card.label}
            className="rounded-xl border bg-card p-2 text-center"
          >
            <card.icon className={`h-4 w-4 mx-auto mb-0.5 ${card.color}`} />
            <p className="text-xl font-bold">{card.value}</p>
            <p className="text-[10px] text-muted-foreground leading-tight">{card.label}</p>
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
