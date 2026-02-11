import { useParams, useNavigate } from 'react-router-dom';
import { useGymDashboard } from '@/hooks/gyms/useGymDashboard';
import { GymDashboardHeader } from '@/components/gym/GymDashboardHeader';
import { GymStatsCards } from '@/components/gym/GymStatsCards';
import { GymFighterCard } from '@/components/gym/GymFighterCard';
import { useGymFighters } from '@/hooks/gyms/useGymFighters';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Users, Settings, ChevronRight } from 'lucide-react';
import Header from '@/components/Header';

export default function GymDashboard() {
  const { gymId } = useParams<{ gymId: string }>();
  const navigate = useNavigate();
  const { data, isLoading } = useGymDashboard(gymId || '');
  const { data: fightersData } = useGymFighters(gymId || '', { limit: 5 });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="pt-20 p-4 space-y-4">
          <Skeleton className="h-40 w-full" />
          <div className="flex gap-3 overflow-x-auto">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 min-w-[140px]" />)}
          </div>
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (!data) return <div className="min-h-screen bg-background pt-20 p-4 text-center text-muted-foreground">Gimnasio no encontrado</div>;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-20 pb-8">
        <GymDashboardHeader gym={data.gym} staff={data.staff} />

        <div className="px-4 mt-6">
          <GymStatsCards stats={data.stats} disciplines={data.disciplines} />
        </div>

        {/* Top Fighters */}
        <div className="px-4 mt-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold">Peleadores Activos</h2>
            {(fightersData?.totalCount || 0) > 5 && (
              <Button variant="ghost" size="sm" onClick={() => navigate(`/gym/${gymId}/fighters`)}>
                Ver todos <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>

          {fightersData?.fighters.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No hay peleadores vinculados</p>
            </div>
          ) : (
            <div className="space-y-3">
              {fightersData?.fighters.map(f => (
                <GymFighterCard key={f.membership_id} fighter={f} />
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="px-4 mt-6 flex gap-3">
          <Button
            variant="outline"
            className="flex-1 h-12 touch-manipulation"
            onClick={() => navigate(`/gym/${gymId}/staff`)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Staff
          </Button>
          <Button
            variant="outline"
            className="flex-1 h-12 touch-manipulation"
            onClick={() => navigate(`/gym/${gymId}/fighters`)}
          >
            <Users className="h-4 w-4 mr-2" />
            Peleadores
          </Button>
        </div>
      </div>
    </div>
  );
}
