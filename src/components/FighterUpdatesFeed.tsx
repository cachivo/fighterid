import { useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Clock, Edit, Trash2, ImageIcon } from 'lucide-react';
import { useFighterUpdates } from '@/hooks/useFighterUpdates';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface FighterUpdatesFeedProps {
  fighterId: string;
  isOwner?: boolean;
  onUpdateDeleted?: () => void;
}

export default function FighterUpdatesFeed({ 
  fighterId, 
  isOwner = false, 
  onUpdateDeleted 
}: FighterUpdatesFeedProps) {
  const { 
    updates, 
    loading, 
    error,
    fetchFighterUpdates, 
    deleteUpdate,
    getRelativeTime 
  } = useFighterUpdates();

  useEffect(() => {
    if (fighterId) {
      fetchFighterUpdates(fighterId);
    }
  }, [fighterId]);

  const handleDelete = async (updateId: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta actualización?')) {
      try {
        await deleteUpdate(updateId);
        onUpdateDeleted?.();
      } catch (error) {
        console.error('Error deleting update:', error);
      }
    }
  };

  if (loading && updates.length === 0) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          <p>Error al cargar las actualizaciones</p>
        </CardContent>
      </Card>
    );
  }

  if (updates.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          <div className="space-y-2">
            <div className="text-4xl">📝</div>
            <p className="text-lg font-medium">
              {isOwner ? 'Aún no has publicado actualizaciones' : 'No hay actualizaciones disponibles'}
            </p>
            <p className="text-sm">
              {isOwner 
                ? 'Comparte tu progreso, entrenamientos y noticias con tus fans.'
                : 'Este peleador aún no ha compartido actualizaciones.'
              }
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-lg font-semibold">Actualizaciones</h3>
        <div className="h-1 w-1 rounded-full bg-primary"></div>
        <span className="text-sm text-muted-foreground">
          {updates.length} publicación{updates.length !== 1 ? 'es' : ''}
        </span>
      </div>

      <div className="space-y-4">
        {updates.map((update, index) => (
          <Card key={update.id} className="relative overflow-hidden">
            <CardContent className="p-4">
              <div className="space-y-3">
                {/* Header with timestamp and actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{getRelativeTime(update.created_at)}</span>
                  </div>
                  
                  {isOwner && (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(update.id)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="space-y-3">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {update.content}
                  </p>

                  {/* Image */}
                  {update.image_url && (
                    <div className="relative rounded-md overflow-hidden">
                      <img
                        src={update.image_url}
                        alt="Actualización"
                        className="w-full max-h-96 object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
            
            {/* Separator for all but last item */}
            {index < updates.length - 1 && (
              <div className="px-4">
                <Separator />
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}