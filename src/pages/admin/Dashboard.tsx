import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { Swords, Target, Shield, Settings, Users, ImageIcon } from 'lucide-react';
import { useUserDisciplineAccess } from '@/hooks/useUserDisciplineAccess';
import { useSuperAdmin } from '@/hooks/useSuperAdmin';
import { useRealTimeStats } from '@/hooks/useRealTimeStats';

export default function Dashboard() {
  const { hasMMA, hasBoxeo, isLoading: accessLoading } = useUserDisciplineAccess();
  const { isSuperAdmin } = useSuperAdmin();
  const { stats, isLoading } = useRealTimeStats();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Panel de Administración</h2>
        <p className="text-muted-foreground">Selecciona una disciplina para administrar</p>
      </div>

      {/* Quick stats */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Peleadores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? '...' : stats?.totalFighters || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Eventos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? '...' : stats?.totalEvents || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">En Vivo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? '...' : stats?.liveEvents?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Licencias</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? '...' : stats?.activeLicenses || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Discipline selector cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {hasMMA && (
          <Link to="/admin/mma" className="group">
            <Card className="h-full border-2 border-primary/20 hover:border-primary/60 transition-all hover:shadow-lg hover:shadow-primary/10 cursor-pointer">
              <CardHeader className="text-center pb-2">
                <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-2 group-hover:bg-primary/20 transition-colors">
                  <Swords className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-xl">MMA</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-3">
                <p className="text-muted-foreground text-sm">Artes Marciales Mixtas</p>
                <div className="flex flex-wrap justify-center gap-2">
                  <Badge variant="secondary">UCC MMA</Badge>
                  <Badge variant="outline">Eventos</Badge>
                  <Badge variant="outline">Rankings</Badge>
                  <Badge variant="outline">Vision AI</Badge>
                </div>
              </CardContent>
            </Card>
          </Link>
        )}

        {hasBoxeo && (
          <Link to="/admin/boxeo" className="group">
            <Card className="h-full border-2 border-primary/20 hover:border-primary/60 transition-all hover:shadow-lg hover:shadow-primary/10 cursor-pointer">
              <CardHeader className="text-center pb-2">
                <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-2 group-hover:bg-primary/20 transition-colors">
                  <Target className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-xl">Boxeo</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-3">
                <p className="text-muted-foreground text-sm">Liga Nacional Olímpica + Minor League</p>
                <div className="flex flex-wrap justify-center gap-2">
                  <Badge variant="secondary">FEDEHBOX (Oficial)</Badge>
                  <Badge variant="secondary">HHF (Minor League)</Badge>
                  <Badge variant="outline">Eventos</Badge>
                  <Badge variant="outline">Rankings</Badge>
                </div>
              </CardContent>
            </Card>
          </Link>
        )}
      </div>

      {/* Super admin quick links */}
      {isSuperAdmin && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Administración del Sistema</h3>
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
            <Link to="/admin/user-roles">
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                <CardContent className="flex items-center gap-3 p-4">
                  <Shield className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">Gestión de Roles</span>
                </CardContent>
              </Card>
            </Link>
            <Link to="/admin/system-assets">
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                <CardContent className="flex items-center gap-3 p-4">
                  <ImageIcon className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">Assets del Sistema</span>
                </CardContent>
              </Card>
            </Link>
            <Link to="/admin/configuracion">
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                <CardContent className="flex items-center gap-3 p-4">
                  <Settings className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">Configuración</span>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
