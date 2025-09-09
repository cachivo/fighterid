import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TrendingUp, TrendingDown, Weight, Activity, Trophy, Target } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface FighterPersonalStatsProps {
  fighterId: string;
}

export default function FighterPersonalStats({ fighterId }: FighterPersonalStatsProps) {
  const { data: personalStats, isLoading } = useQuery({
    queryKey: ['fighter-personal-stats', fighterId],
    queryFn: async () => {
      const [statusUpdates, fightsHistory, profile] = await Promise.all([
        supabase
          .from('fighter_status_updates')
          .select('*')
          .eq('fighter_id', fighterId)
          .order('created_at', { ascending: true })
          .limit(10),
        supabase
          .from('fights_history')
          .select('*')
          .or(`red_fighter_id.eq.${fighterId},blue_fighter_id.eq.${fighterId}`)
          .order('event_date', { ascending: false })
          .limit(5),
        supabase
          .from('fighter_profiles')
          .select('record_wins, record_losses, record_draws, weight_kg')
          .eq('id', fighterId)
          .single()
      ]);

      // Process weight evolution data
      const weightData = (statusUpdates.data || [])
        .filter(update => update.weight_kg)
        .map(update => ({
          date: new Date(update.created_at).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }),
          weight: update.weight_kg,
          bodyFat: update.bodyfat_pct || null
        }));

      // Calculate fight performance
      const fights = fightsHistory.data || [];
      const wins = fights.filter(fight => {
        const isRed = fight.red_fighter_id === fighterId;
        const isBlue = fight.blue_fighter_id === fighterId;
        return (isRed && fight.result === 'red_win') || (isBlue && fight.result === 'blue_win');
      }).length;

      const losses = fights.filter(fight => {
        const isRed = fight.red_fighter_id === fighterId;
        const isBlue = fight.blue_fighter_id === fighterId;
        return (isRed && fight.result === 'blue_win') || (isBlue && fight.result === 'red_win');
      }).length;

      // Calculate trends
      const recentWeight = weightData.length >= 2 ? 
        weightData[weightData.length - 1].weight - weightData[weightData.length - 2].weight : 0;

      const totalRecord = (profile.data?.record_wins || 0) + (profile.data?.record_losses || 0) + (profile.data?.record_draws || 0);
      const winRate = totalRecord > 0 ? ((profile.data?.record_wins || 0) / totalRecord * 100) : 0;

      return {
        weightData,
        fightsHistory: fights,
        currentWeight: profile.data?.weight_kg,
        record: {
          wins: profile.data?.record_wins || 0,
          losses: profile.data?.record_losses || 0,
          draws: profile.data?.record_draws || 0
        },
        trends: {
          weightChange: recentWeight,
          winRate: Math.round(winRate),
          recentFights: fights.length,
          activityLevel: (statusUpdates.data?.length || 0) >= 3 ? 'high' : 'low'
        }
      };
    },
    enabled: !!fighterId
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card className="border-border/50">
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-8 w-12" />
                  <Skeleton className="h-3 w-20" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = personalStats!;

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <Card className="border-border/50 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Estadísticas Personales
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <Trophy className="h-6 w-6 text-green-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{stats.record.wins}</div>
              <div className="text-sm text-green-400">Victorias</div>
            </div>
            
            <div className="text-center p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <Target className="h-6 w-6 text-red-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{stats.record.losses}</div>
              <div className="text-sm text-red-400">Derrotas</div>
            </div>
            
            <div className="text-center p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <Activity className="h-6 w-6 text-blue-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{stats.trends.winRate}%</div>
              <div className="text-sm text-blue-400">% Victorias</div>
            </div>
            
            <div className="text-center p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <Weight className="h-6 w-6 text-purple-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">
                {stats.currentWeight ? `${stats.currentWeight}kg` : 'N/A'}
              </div>
              <div className="text-sm text-purple-400">Peso Actual</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weight Evolution Chart */}
      {stats.weightData.length > 0 && (
        <Card className="border-border/50 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Weight className="h-5 w-5" />
              Evolución del Peso
              {stats.trends.weightChange !== 0 && (
                <Badge variant={stats.trends.weightChange > 0 ? 'destructive' : 'secondary'} className="ml-2">
                  {stats.trends.weightChange > 0 ? (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1" />
                  )}
                  {Math.abs(stats.trends.weightChange).toFixed(1)}kg
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.weightData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#F9FAFB'
                    }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="weight" 
                    stroke="#8B5CF6" 
                    strokeWidth={2}
                    dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 4 }}
                    name="Peso (kg)"
                  />
                  {stats.weightData.some(d => d.bodyFat) && (
                    <Line 
                      type="monotone" 
                      dataKey="bodyFat" 
                      stroke="#F59E0B" 
                      strokeWidth={2}
                      dot={{ fill: '#F59E0B', strokeWidth: 2, r: 4 }}
                      name="% Grasa Corporal"
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity Summary */}
      <Card className="border-border/50 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Resumen de Actividad
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Nivel de Actividad</span>
              <Badge variant={stats.trends.activityLevel === 'high' ? 'default' : 'secondary'}>
                {stats.trends.activityLevel === 'high' ? 'Alto' : 'Bajo'}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Peleas Recientes</span>
              <span className="text-white font-medium">{stats.trends.recentFights}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Récord Total</span>
              <span className="text-white font-medium">
                {stats.record.wins}-{stats.record.losses}-{stats.record.draws}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}