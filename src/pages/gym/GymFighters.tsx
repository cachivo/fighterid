import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useGymFighters } from '@/hooks/gyms/useGymFighters';
import { GymFighterCard } from '@/components/gym/GymFighterCard';
import { PageHeader } from '@/components/ui/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Users, ChevronLeft, ChevronRight } from 'lucide-react';
import Header from '@/components/Header';

export default function GymFighters() {
  const { gymId } = useParams<{ gymId: string }>();
  const [page, setPage] = useState(1);
  const { data, isLoading } = useGymFighters(gymId || '', { page });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-20 px-4 pb-8">
        <PageHeader
          title="Peleadores del Gimnasio"
          subtitle={data ? `${data.totalCount} peleadores activos` : undefined}
          backTo={`/gym/${gymId}/dashboard`}
          backLabel="Dashboard"
        />

        <div className="mt-6 space-y-3">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20" />)
          ) : data?.fighters.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No hay peleadores vinculados</p>
            </div>
          ) : (
            data?.fighters.map(f => (
              <GymFighterCard key={f.membership_id} fighter={f} />
            ))
          )}
        </div>

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-6">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              className="h-10 touch-manipulation"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Anterior
            </Button>
            <span className="text-sm text-muted-foreground">
              {page} / {data.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= data.totalPages}
              onClick={() => setPage(p => p + 1)}
              className="h-10 touch-manipulation"
            >
              Siguiente
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
