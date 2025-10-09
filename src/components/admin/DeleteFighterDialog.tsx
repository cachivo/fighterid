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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle } from 'lucide-react';

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
  const [confirmText, setConfirmText] = useState('');
  const { toast } = useToast();

  const handleDelete = async () => {
    if (!fighter) return;

    // Validar confirmación
    if (confirmText.toUpperCase() !== 'ELIMINAR') {
      toast({
        title: "Error de confirmación",
        description: "Debes escribir ELIMINAR para confirmar esta acción",
        variant: "destructive",
      });
      return;
    }

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
      setConfirmText(''); // Limpiar el input
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

  const handleClose = () => {
    setConfirmText(''); // Limpiar cuando se cierra
    onClose();
  };

  if (!fighter) return null;

  const fighterName = `${fighter.first_name} ${fighter.last_name}${fighter.nickname ? ` "${fighter.nickname}"` : ''}`;
  const fighterRecord = `${fighter.record_wins}-${fighter.record_losses}-${fighter.record_draws}`;
  const isConfirmationValid = confirmText.toUpperCase() === 'ELIMINAR';

  return (
    <AlertDialog open={isOpen} onOpenChange={handleClose}>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            <AlertDialogTitle className="text-destructive text-xl">
              ⚠️ Eliminación Permanente
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription asChild>
            <div className="space-y-4 mt-4">
              <p className="font-medium text-foreground">
                Estás a punto de eliminar permanentemente el perfil del peleador:
              </p>
              
              <div className="bg-destructive/10 border-2 border-destructive/30 p-4 rounded-lg">
                <div className="font-bold text-lg text-foreground">{fighterName}</div>
                <div className="text-sm text-muted-foreground mt-1">
                  {fighter.weight_class} • Record: {fighterRecord}
                  {fighter.country && ` • ${fighter.country}`}
                </div>
              </div>
              
              <div className="bg-destructive/5 border border-destructive/20 p-4 rounded-lg space-y-2">
                <div className="text-destructive font-bold flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Esta acción NO se puede deshacer
                </div>
                <p className="text-sm font-medium text-foreground">Se eliminará permanentemente:</p>
                <ul className="text-sm space-y-1 ml-4 text-foreground">
                  <li>• El perfil completo del peleador</li>
                  <li>• Todas sus licencias y documentos</li>
                  <li>• Certificaciones médicas y tests antidoping</li>
                  <li>• Reservas de peleas programadas</li>
                  <li>• Actualizaciones de estado e historial</li>
                </ul>
                <p className="text-xs text-muted-foreground mt-2">
                  Nota: Las peleas históricas se mantendrán pero sin referencia al peleador.
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <Label htmlFor="confirm-text" className="text-base font-semibold text-foreground">
                  Para confirmar, escribe la palabra: <span className="text-destructive">ELIMINAR</span>
                </Label>
                <Input
                  id="confirm-text"
                  type="text"
                  placeholder="Escribe ELIMINAR aquí"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  disabled={isDeleting}
                  className="border-2"
                  autoComplete="off"
                />
                {confirmText && !isConfirmationValid && (
                  <p className="text-xs text-destructive">
                    El texto no coincide. Debes escribir exactamente: ELIMINAR
                  </p>
                )}
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting} onClick={handleClose}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting || !isConfirmationValid}
              className="font-bold"
            >
              {isDeleting ? "Eliminando..." : "Eliminar Permanentemente"}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
