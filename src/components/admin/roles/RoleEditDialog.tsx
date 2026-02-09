import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { UserCog, Loader2 } from 'lucide-react';
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

interface RoleEditDialogProps {
  user: UserRoleData;
  currentUserId: string;
  onRolesUpdated: () => void;
}

const ROLES: { value: AppRole; label: string }[] = [
  { value: 'admin', label: 'Administrador' },
  { value: 'moderator', label: 'Moderador' },
  { value: 'user', label: 'Usuario' },
];

export function RoleEditDialog({ user, currentUserId, onRolesUpdated }: RoleEditDialogProps) {
  const [selectedRoles, setSelectedRoles] = useState<AppRole[]>(user.roles);
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const isCurrentUser = user.id === currentUserId;
  const isRemovingOwnAdmin = isCurrentUser && user.roles.includes('admin') && !selectedRoles.includes('admin');

  const handleRoleToggle = (role: AppRole, checked: boolean) => {
    setSelectedRoles(prev => checked ? [...prev, role] : prev.filter(r => r !== role));
  };

  const handleSave = async () => {
    if (isRemovingOwnAdmin) {
      toast.error('No puedes remover tu propio rol de administrador');
      return;
    }
    if (selectedRoles.length === 0) {
      toast.error('El usuario debe tener al menos un rol');
      return;
    }

    setIsLoading(true);
    try {
      const currentRoles = new Set(user.roles);
      const newRoles = new Set(selectedRoles);
      const rolesToAdd = selectedRoles.filter(r => !currentRoles.has(r));
      const rolesToRemove = user.roles.filter(r => !newRoles.has(r));

      for (const role of rolesToAdd) {
        const { error } = await supabase.rpc('assign_user_role', { p_user_id: user.id, p_role: role });
        if (error) throw error;
      }
      for (const role of rolesToRemove) {
        const { error } = await supabase.rpc('remove_user_role', { p_user_id: user.id, p_role: role });
        if (error) throw error;
      }

      toast.success('Roles actualizados exitosamente');
      setOpen(false);
      onRolesUpdated();
    } catch (error) {
      console.error('Error updating roles:', error);
      toast.error('Error al actualizar roles');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserCog className="w-4 h-4 mr-2" />
          Editar Roles
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar roles de {user.first_name} {user.last_name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-3">
            {ROLES.map(({ value, label }) => (
              <div key={value} className="flex items-center space-x-2">
                <Checkbox
                  id={`role-${value}`}
                  checked={selectedRoles.includes(value)}
                  onCheckedChange={(checked) => handleRoleToggle(value, checked as boolean)}
                  disabled={isLoading}
                />
                <Label htmlFor={`role-${value}`} className="text-sm font-medium cursor-pointer">
                  {label}
                </Label>
              </div>
            ))}
          </div>
          {isCurrentUser && selectedRoles.includes('admin') && (
            <p className="text-sm text-muted-foreground">
              No puedes remover tu propio rol de administrador
            </p>
          )}
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>Cancelar</Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Guardar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
