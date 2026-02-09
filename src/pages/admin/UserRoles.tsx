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

type AppRole = 'admin' | 'moderator' | 'user';
type RoleFilter = AppRole | 'all' | 'none';

interface UserRoleData {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  roles: AppRole[];
  created_at: string;
}

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
        (roleFilter === 'none' ? user.roles.length === 0 : user.roles.includes(roleFilter));
      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, roleFilter]);

  const getRoleBadge = (role: AppRole) => {
    const config: Record<AppRole, { variant: "default" | "secondary" | "outline"; icon: typeof Shield }> = {
      admin: { variant: "default", icon: Shield },
      moderator: { variant: "secondary", icon: UserCog },
      user: { variant: "outline", icon: User }
    };
    const { variant, icon: Icon } = config[role];
    return (
      <Badge key={role} variant={variant} className="gap-1">
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
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">
                      {user.first_name} {user.last_name}
                    </h3>
                    {user.id === currentUser?.id && (
                      <Badge variant="outline" className="text-xs">Tú</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  <div className="flex gap-2 mt-2">
                    {user.roles.length > 0 ? (
                      user.roles.map(role => getRoleBadge(role))
                    ) : (
                      <Badge variant="outline">Sin roles</Badge>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <RoleEditDialog
                    user={user}
                    currentUserId={currentUser?.id || ''}
                    onRolesUpdated={refetch}
                  />
                  <DeleteUserDialog
                    user={user}
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
