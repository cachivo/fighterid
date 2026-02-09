import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Trash2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

type AppRole = 'admin' | 'moderator' | 'user';

interface UserRoleData {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  roles: AppRole[];
  created_at: string;
}

interface DeleteUserDialogProps {
  user: UserRoleData;
  currentUserId: string;
  onUserDeleted: () => void;
}

export function DeleteUserDialog({ user, currentUserId, onUserDeleted }: DeleteUserDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [open, setOpen] = useState(false);
  const isCurrentUser = user.id === currentUserId;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase.functions.invoke('delete-user', {
        body: { user_id: user.id }
      });
      if (error) throw error;
      toast.success(`Usuario ${user.email} eliminado exitosamente`);
      setOpen(false);
      onUserDeleted();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast.error(error.message || 'Error al eliminar usuario');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="destructive"
          size="sm"
          disabled={isCurrentUser}
          title={isCurrentUser ? 'No puedes eliminarte a ti mismo' : 'Eliminar usuario'}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Eliminar
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            ¿Eliminar usuario permanentemente?
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>Estás a punto de eliminar a:</p>
            <div className="p-3 bg-muted rounded-lg">
              <p className="font-semibold">{user.first_name} {user.last_name}</p>
              <p className="text-sm">{user.email}</p>
            </div>
            <p className="text-destructive font-medium mt-3">
              Esta acción es IRREVERSIBLE y eliminará:
            </p>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li>Cuenta de autenticación</li>
              <li>Perfil de usuario</li>
              <li>Todos los roles asignados</li>
              <li>Historial de actividad</li>
            </ul>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? 'Eliminando...' : 'Sí, eliminar permanentemente'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
