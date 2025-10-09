import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface FighterProfile {
  id: string;
  first_name: string;
  last_name: string;
  nickname?: string;
  weight_class: string;
  country?: string;
  record_wins: number;
  record_losses: number;
  record_draws: number;
}

interface DeleteFighterDialogProps {
  fighter: FighterProfile | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
}

export function DeleteFighterDialog({ fighter, isOpen, onClose, onConfirm }: DeleteFighterDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    if (!fighter) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase.rpc('admin_delete_fighter_profile', {
        p_fighter_id: fighter.id
      });

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Perfil de peleador eliminado correctamente",
      });

      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Error deleting fighter:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al eliminar peleador';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (!fighter) return null;

  const fighterName = `${fighter.first_name} ${fighter.last_name}${fighter.nickname ? ` "${fighter.nickname}"` : ''}`;
  const fighterRecord = `${fighter.record_wins}-${fighter.record_losses}-${fighter.record_draws}`;

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-destructive">
            ¿Eliminar Perfil de Peleador?
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>
                Estás a punto de eliminar permanentemente el perfil del peleador:
              </p>
              <div className="bg-muted p-4 rounded-lg">
                <div className="font-medium">{fighterName}</div>
                <div className="text-sm text-muted-foreground mt-1">
                  {fighter.weight_class} • Record: {fighterRecord}
                  {fighter.country && ` • ${fighter.country}`}
                </div>
              </div>
              <div className="text-destructive font-medium">
                Esta acción NO se puede deshacer y eliminará:
              </div>
              <ul className="text-sm space-y-1 ml-4">
                <li>• El perfil completo del peleador</li>
                <li>• Todas sus licencias y documentos</li>
                <li>• Certificaciones médicas</li>
                <li>• Reservas de peleas</li>
                <li>• Actualizaciones de estado</li>
              </ul>
              <p className="text-sm text-muted-foreground">
                Las peleas históricas se mantendrán pero sin referencia al peleador eliminado.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Eliminando..." : "Eliminar Permanentemente"}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}