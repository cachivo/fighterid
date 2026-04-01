import { useDisciplineContext } from '@/contexts/DisciplineContext';
import { useRealTimeStats } from '@/hooks/useRealTimeStats';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Calendar, Trophy, Shield } from 'lucide-react';
import AdminAnalytics from '@/components/AdminAnalytics';

export default function DisciplineDashboard() {
  const ctx = useDisciplineContext();
  const discipline = ctx?.discipline || 'MMA';
  const { stats, isLoading } = useRealTimeStats();

  const label = discipline === 'MMA' ? 'MMA' : 'Boxeo';

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold tracking-tight">Dashboard {label}</h2>

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Peleadores {label}</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? '...' : stats?.totalFighters || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eventos</CardTitle>
            <Calendar className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? '...' : stats?.totalEvents || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Vivo</CardTitle>
            <Trophy className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? '...' : stats?.liveEvents?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Licencias</CardTitle>
            <Shield className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? '...' : stats?.activeLicenses || 0}</div>
          </CardContent>
        </Card>
      </div>

      <AdminAnalytics />
    </div>
  );
}
