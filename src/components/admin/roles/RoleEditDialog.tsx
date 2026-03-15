import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { UserCog, Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useUserDisciplineAccessById, type Discipline } from '@/hooks/useUserDisciplineAccess';

type AppRole = 'admin' | 'moderator' | 'user' | 'judge' | 'super_admin' | 'license_officer' | 'technical_coordinator' | 'auditor' | 'promoter' | 'official_judge' | 'official_referee' | 'official_doctor' | 'official_timekeeper' | 'official_inspector' | 'gym_owner' | 'gym_coach' | 'gym_assistant';

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

const ROLE_GROUPS: { group: string; roles: { value: AppRole; label: string }[] }[] = [
  {
    group: 'Sistema',
    roles: [
      { value: 'admin', label: 'Administrador' },
      { value: 'moderator', label: 'Moderador' },
      { value: 'user', label: 'Usuario' },
    ],
  },
  {
    group: 'Administración Especial',
    roles: [
      { value: 'license_officer', label: 'Oficial de Licencias' },
      { value: 'technical_coordinator', label: 'Coordinador Técnico' },
      { value: 'auditor', label: 'Auditor' },
      { value: 'promoter', label: 'Promotor' },
    ],
  },
  {
    group: 'Oficiales',
    roles: [
      { value: 'official_judge', label: 'Juez Oficial' },
      { value: 'official_referee', label: 'Árbitro Oficial' },
      { value: 'official_doctor', label: 'Médico Oficial' },
      { value: 'official_timekeeper', label: 'Cronometrador' },
      { value: 'official_inspector', label: 'Inspector' },
    ],
  },
  {
    group: 'Gimnasios',
    roles: [
      { value: 'gym_owner', label: 'Main Coach' },
      { value: 'gym_coach', label: 'Entrenador' },
      { value: 'gym_assistant', label: 'Asistente' },
    ],
  },
];

const GYM_ROLES: AppRole[] = ['gym_owner', 'gym_coach', 'gym_assistant'];
const DISCIPLINE_OPTIONS: { value: Discipline; label: string }[] = [
  { value: 'MMA', label: 'MMA' },
  { value: 'Boxeo', label: 'Boxeo' },
];

export function RoleEditDialog({ user, currentUserId, onRolesUpdated }: RoleEditDialogProps) {
  const [selectedRoles, setSelectedRoles] = useState<AppRole[]>(user.roles);
  const [selectedDisciplines, setSelectedDisciplines] = useState<Discipline[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const { data: currentDisciplines } = useUserDisciplineAccessById(user.id);

  // Sync disciplines when dialog opens or data loads
  useEffect(() => {
    if (currentDisciplines) {
      setSelectedDisciplines(currentDisciplines);
    }
  }, [currentDisciplines]);

  // Reset roles when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedRoles(user.roles);
    }
  }, [open, user.roles]);

  const disciplineRef = useRef<HTMLDivElement>(null);
  const isCurrentUser = user.id === currentUserId;
  const isRemovingOwnAdmin = isCurrentUser && user.roles.includes('admin') && !selectedRoles.includes('admin');
  const hasGymRole = selectedRoles.some(r => GYM_ROLES.includes(r));

  // Auto-scroll to discipline section when gym role is selected
  useEffect(() => {
    if (hasGymRole && disciplineRef.current) {
      setTimeout(() => {
        disciplineRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    }
  }, [hasGymRole]);

  const handleRoleToggle = (role: AppRole, checked: boolean) => {
    setSelectedRoles(prev => checked ? [...prev, role] : prev.filter(r => r !== role));
  };

  const handleDisciplineToggle = (disc: Discipline, checked: boolean) => {
    setSelectedDisciplines(prev => checked ? [...prev, disc] : prev.filter(d => d !== disc));
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
    const hasGymRoleSelected = selectedRoles.some(r => GYM_ROLES.includes(r));
    if (hasGymRoleSelected && selectedDisciplines.length === 0) {
      toast.error('Debes asignar al menos una disciplina para roles de gimnasio');
      return;
    }

    setIsLoading(true);
    try {
      // --- Roles ---
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

      // --- Discipline Access ---
      const currentDiscs = new Set(currentDisciplines || []);
      const newDiscs = new Set(selectedDisciplines);
      const discsToAdd = selectedDisciplines.filter(d => !currentDiscs.has(d));
      const discsToRemove = (currentDisciplines || []).filter(d => !newDiscs.has(d));

      if (discsToAdd.length > 0) {
        const { error } = await supabase.from('user_discipline_access').insert(
          discsToAdd.map(d => ({ user_id: user.id, discipline: d }))
        );
        if (error) throw error;
      }
      if (discsToRemove.length > 0) {
        for (const disc of discsToRemove) {
          const { error } = await supabase
            .from('user_discipline_access')
            .delete()
            .eq('user_id', user.id)
            .eq('discipline', disc);
          if (error) throw error;
        }
      }

      // If no gym role, clean up all discipline access
      if (!hasGymRoleSelected) {
        await supabase
          .from('user_discipline_access')
          .delete()
          .eq('user_id', user.id);
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
        <div className="space-y-4 py-4 max-h-[50vh] overflow-y-auto">
          {ROLE_GROUPS.map(({ group, roles }) => (
            <div key={group}>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{group}</p>
              <div className="space-y-2 ml-1">
                {roles.map(({ value, label }) => (
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
            </div>
          ))}

          {/* Discipline access section - shown when gym roles are selected */}
          {hasGymRole && (
            <div className="border-t pt-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Acceso por Disciplina
              </p>
              <p className="text-xs text-muted-foreground mb-3">
                Selecciona las disciplinas que este usuario puede gestionar
              </p>
              <div className="space-y-2 ml-1">
                {DISCIPLINE_OPTIONS.map(({ value, label }) => (
                  <div key={value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`disc-${value}`}
                      checked={selectedDisciplines.includes(value)}
                      onCheckedChange={(checked) => handleDisciplineToggle(value, checked as boolean)}
                      disabled={isLoading}
                    />
                    <Label htmlFor={`disc-${value}`} className="text-sm font-medium cursor-pointer">
                      {label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

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