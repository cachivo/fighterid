import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { useGymDashboard } from '@/hooks/gyms/useGymDashboard';
import { GymDashboardHeader } from '@/components/gym/GymDashboardHeader';
import { GymStatsCards } from '@/components/gym/GymStatsCards';
import { GymFighterCard } from '@/components/gym/GymFighterCard';
import { useGymFighters } from '@/hooks/gyms/useGymFighters';
import { useGymStaffRole } from '@/hooks/gyms/useMyGymStaff';
import { GymEditModal } from '@/components/admin/GymEditModal';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Users, Settings, ChevronRight, Plus, Pencil } from 'lucide-react';
import Header from '@/components/Header';
import type { Gym } from '@/types/gyms';

export default function GymDashboard() {
  const { gymId } = useParams<{ gymId: string }>();
  const navigate = useNavigate();
  const { data, isLoading } = useGymDashboard(gymId || '');
  const { data: fightersData } = useGymFighters(gymId || '', { limit: 5 });
  const { data: staffRole } = useGymStaffRole(gymId || '');
  const [showEditModal, setShowEditModal] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="pt-20 p-4 space-y-4">
          <Skeleton className="h-40 w-full" />
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20" />)}
          </div>
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (!data) return <div className="min-h-screen bg-background pt-20 p-4 text-center text-muted-foreground">Gimnasio no encontrado</div>;

  const canManageFighters = staffRole?.canManageFighters ?? false;
  const canEditGymProfile = staffRole?.canEditGymProfile ?? false;
  const canManageStaff = staffRole?.canManageStaff ?? false;

  // Build a Gym-compatible object for GymEditModal
  const gymForEdit: Gym = {
    id: gymId || '',
    slug: '',
    nombre: data.gym.nombre,
    ciudad: data.gym.ciudad || undefined,
    pais: data.gym.pais || undefined,
    logo_url: data.gym.logo_url || undefined,
    banner_url: data.gym.banner_url || undefined,
    disciplinas: data.disciplines.map(d => d.name),
    activo: true,
    created_at: '',
    updated_at: '',
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-20 pb-20">
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
              {canManageFighters && (
                <Button
                  variant="outline"
                  className="mt-3"
                  onClick={() => navigate(`/gym/${gymId}/add-fighter`)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar primer peleador
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {fightersData?.fighters.map(f => (
                <GymFighterCard key={f.membership_id} fighter={f} />
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions - stacked vertically for mobile */}
        <div className="px-4 mt-6 space-y-2">
          {canEditGymProfile && (
            <Button
              className="w-full h-12 touch-manipulation"
              variant="outline"
              onClick={() => setShowEditModal(true)}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Editar Gimnasio
            </Button>
          )}
          {canManageFighters && (
            <Button
              className="w-full h-12 touch-manipulation bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => navigate(`/gym/${gymId}/add-fighter`)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar Peleador
            </Button>
          )}
          {canManageStaff ? (
            <Button
              variant="outline"
              className="w-full h-12 touch-manipulation"
              onClick={() => navigate(`/gym/${gymId}/staff`)}
            >
              <Settings className="h-4 w-4 mr-2" />
              Gestionar Staff
            </Button>
          ) : (
            <Button
              variant="outline"
              className="w-full h-12 touch-manipulation"
              onClick={() => navigate(`/gym/${gymId}/staff`)}
            >
              <Users className="h-4 w-4 mr-2" />
              Ver Staff
            </Button>
          )}
          <Button
            variant="outline"
            className="w-full h-12 touch-manipulation"
            onClick={() => navigate(`/gym/${gymId}/fighters`)}
          >
            <Users className="h-4 w-4 mr-2" />
            Ver Peleadores
          </Button>
        </div>
      </div>

      {canEditGymProfile && (
        <GymEditModal
          gym={gymForEdit}
          open={showEditModal}
          onOpenChange={setShowEditModal}
        />
      )}
    </div>
  );
}
