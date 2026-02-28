import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Clock, Trash2, FileText, User } from 'lucide-react';
import { useFighterUpdates } from '@/hooks/useFighterUpdates';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';

interface FighterUpdatesFeedProps {
  fighterId: string;
  fighterName?: string;
  fighterAvatar?: string | null;
  isOwner?: boolean;
  onUpdateDeleted?: () => void;
}

export default function FighterUpdatesFeed({ 
  fighterId,
  fighterName = 'Peleador',
  fighterAvatar,
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

  const [expandedImage, setExpandedImage] = useState<string | null>(null);

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
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
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

  const initials = fighterName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

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
        {updates.map((update) => (
          <Card key={update.id} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="space-y-3">
                {/* Facebook-style header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={fighterAvatar || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {initials || <User className="h-4 w-4" />}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-sm">{fighterName}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{getRelativeTime(update.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  
                  {isOwner && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(update.id)}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {/* Content */}
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {update.content}
                </p>

                {/* Full-width image */}
                {update.image_url && (
                  <div 
                    className="-mx-4 cursor-pointer"
                    onClick={() => setExpandedImage(update.image_url!)}
                  >
                    <img
                      src={update.image_url}
                      alt="Actualización"
                      className="w-full max-h-[500px] object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Lightbox for expanded image */}
      <Dialog open={!!expandedImage} onOpenChange={() => setExpandedImage(null)}>
        <DialogContent className="max-w-4xl p-1 bg-black/95">
          <DialogTitle className="sr-only">Imagen ampliada</DialogTitle>
          {expandedImage && (
            <img
              src={expandedImage}
              alt="Imagen ampliada"
              className="w-full h-auto max-h-[85vh] object-contain rounded"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
