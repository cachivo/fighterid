import { useState, useMemo } from 'react';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Shield, UserCog, User, Loader2, Trash2, AlertTriangle, Search, X, Users } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { RoleEditDialog } from '@/components/admin/roles/RoleEditDialog';
import { DeleteUserDialog } from '@/components/admin/roles/DeleteUserDialog';

// Use string type for roles to avoid conflicts with hook's internal AppRole type
type RoleFilter = string;

const ROLE_BADGE_CONFIG: Record<string, { variant: "default" | "secondary" | "outline"; icon: typeof Shield }> = {
  admin: { variant: "default", icon: Shield },
  super_admin: { variant: "default", icon: Shield },
  moderator: { variant: "secondary", icon: UserCog },
  user: { variant: "outline", icon: User },
  judge: { variant: "secondary", icon: UserCog },
  license_officer: { variant: "secondary", icon: Shield },
  technical_coordinator: { variant: "secondary", icon: UserCog },
  auditor: { variant: "outline", icon: User },
  promoter: { variant: "outline", icon: User },
  official_judge: { variant: "secondary", icon: UserCog },
  official_referee: { variant: "secondary", icon: Shield },
  official_doctor: { variant: "secondary", icon: UserCog },
  official_timekeeper: { variant: "outline", icon: User },
  official_inspector: { variant: "outline", icon: User },
  gym_owner: { variant: "secondary", icon: UserCog },
  gym_coach: { variant: "outline", icon: User },
  gym_assistant: { variant: "outline", icon: User },
};

const ROLE_FILTER_CONFIG: { value: RoleFilter; label: string; icon: typeof Shield }[] = [
  { value: 'all', label: 'Todos', icon: Users },
  { value: 'admin', label: 'Admin', icon: Shield },
  { value: 'moderator', label: 'Moderador', icon: UserCog },
  { value: 'user', label: 'Usuario', icon: User },
  { value: 'none', label: 'Sin rol', icon: AlertTriangle },
];

export default function UserRoles() {
  const { users, loading, refetch } = useUserRoles();
  const { user: currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');

  const roleCounts = useMemo(() => {
    const counts = { all: users.length, admin: 0, moderator: 0, user: 0, none: 0 };
    users.forEach(u => {
      if (u.roles.length === 0) counts.none++;
      if (u.roles.includes('admin')) counts.admin++;
      if (u.roles.includes('moderator')) counts.moderator++;
      if (u.roles.includes('user')) counts.user++;
    });
    return counts;
  }, [users]);

  const filteredUsers = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return users.filter(user => {
      const matchesSearch = !q ||
        user.first_name?.toLowerCase().includes(q) ||
        user.last_name?.toLowerCase().includes(q) ||
        user.email.toLowerCase().includes(q);
      const matchesRole = roleFilter === 'all' ||
        (roleFilter === 'none' ? user.roles.length === 0 : user.roles.includes(roleFilter as any));
      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, roleFilter]);

  const getRoleBadge = (role: string) => {
    const cfg = ROLE_BADGE_CONFIG[role] || { variant: "outline" as const, icon: User };
    const Icon = cfg.icon;
    return (
      <Badge key={role} variant={cfg.variant} className="gap-1">
        <Icon className="w-3 h-3" />
        {role}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando usuarios...</p>
        </div>
      </div>
    );
  }

  const isFiltered = searchQuery || roleFilter !== 'all';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gestión de Roles</h1>
        <p className="text-muted-foreground">
          Administra los roles y permisos de usuarios del sistema
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre o email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 pr-9"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Role filter tabs */}
      <div className="flex flex-wrap gap-2">
        {ROLE_FILTER_CONFIG.map(({ value, label, icon: Icon }) => (
          <Button
            key={value}
            variant={roleFilter === value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setRoleFilter(value)}
            className="gap-1.5"
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
            <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs min-w-[1.25rem] justify-center">
              {roleCounts[value]}
            </Badge>
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Usuarios del Sistema</CardTitle>
          <CardDescription>
            {isFiltered
              ? `Mostrando ${filteredUsers.length} de ${users.length} usuarios`
              : `Total de usuarios: ${users.length}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-medium">
                      {user.first_name} {user.last_name}
                    </h3>
                    {user.id === currentUser?.id && (
                      <Badge variant="outline" className="text-xs">Tú</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground break-all">{user.email}</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {user.roles.length > 0 ? (
                      user.roles.map(role => getRoleBadge(role))
                    ) : (
                      <Badge variant="outline">Sin roles</Badge>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 shrink-0">
                  <RoleEditDialog
                    user={user as any}
                    currentUserId={currentUser?.id || ''}
                    onRolesUpdated={refetch}
                  />
                  <DeleteUserDialog
                    user={user as any}
                    currentUserId={currentUser?.id || ''}
                    onUserDeleted={refetch}
                  />
                </div>
              </div>
            ))}

            {filteredUsers.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                {isFiltered ? 'No se encontraron usuarios con ese criterio' : 'No se encontraron usuarios'}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
