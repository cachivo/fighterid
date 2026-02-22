import { useParams } from 'react-router-dom';
import { useGymStaff, useRemoveGymStaff } from '@/hooks/gyms/useGymStaff';
import { useGymStaffRole } from '@/hooks/gyms/useMyGymStaff';
import { GymStaffCard } from '@/components/gym/GymStaffCard';
import { PageHeader } from '@/components/ui/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { Users } from 'lucide-react';
import Header from '@/components/Header';

export default function GymStaffManagement() {
  const { gymId } = useParams<{ gymId: string }>();
  const { data: staff, isLoading } = useGymStaff(gymId || '');
  const { data: staffRole } = useGymStaffRole(gymId || '');
  const removeStaff = useRemoveGymStaff(gymId || '');

  const canManageStaff = staffRole?.canManageStaff ?? false;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-20 px-4 pb-8">
        <PageHeader
          title="Staff del Gimnasio"
          subtitle={staff ? `${staff.length} miembros activos` : undefined}
          backTo={`/gym/${gymId}/dashboard`}
          backLabel="Dashboard"
        />

        <div className="mt-6 space-y-3">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20" />)
          ) : staff?.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No hay staff registrado</p>
            </div>
          ) : (
            staff?.map(s => (
              <GymStaffCard
                key={s.id}
                staff={s}
                canManage={canManageStaff}
                onRemove={(id) => removeStaff.mutate(id)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
