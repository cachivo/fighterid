import { useState, useMemo } from 'react';
import { useAllGymStaff } from '@/hooks/gyms';
import { useGyms } from '@/hooks/useGyms';
import { useUserDisciplineAccess } from '@/hooks/useUserDisciplineAccess';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus, Users, Search } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

const ROLE_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  OWNER: { label: 'Propietario', variant: 'default' },
  HEAD_COACH: { label: 'Entrenador Principal', variant: 'secondary' },
  ASSISTANT_COACH: { label: 'Asistente', variant: 'outline' },
};

export default function EntrenadoresAdmin() {
  const { data: allStaff, isLoading } = useAllGymStaff();
  const { data: gyms } = useGyms();
  const { disciplines: allowedDisciplines, hasFullAccess } = useUserDisciplineAccess();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedGym, setSelectedGym] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('HEAD_COACH');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const searchUsers = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) { setSearchResults([]); return; }
    const { data } = await supabase
      .from('app_user')
      .select('id, first_name, last_name, avatar_url, handle, email')
      .or(`handle.ilike.%${query}%,email.ilike.%${query}%,first_name.ilike.%${query}%`)
      .limit(5);
    setSearchResults(data || []);
  };

  const handleAddStaff = async () => {
    if (!selectedUser || !selectedGym || !selectedRole) {
      toast.error('Selecciona gimnasio, usuario y rol');
      return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('gym_staff').insert([{
        gym_id: selectedGym,
        user_id: selectedUser.id,
        role: selectedRole as 'OWNER' | 'HEAD_COACH' | 'ASSISTANT_COACH',
      }]);
      if (error) throw error;
      toast.success('Staff agregado exitosamente');
      queryClient.invalidateQueries({ queryKey: ['all-gym-staff'] });
      setIsDialogOpen(false);
      setSelectedUser(null);
      setSearchQuery('');
      setSearchResults([]);
      setSelectedGym('');
    } catch (error: any) {
      toast.error('Error: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeactivate = async (staffId: string) => {
    const { error } = await supabase.from('gym_staff').update({ active: false }).eq('id', staffId);
    if (error) { toast.error('Error: ' + error.message); return; }
    toast.success('Staff desactivado');
    queryClient.invalidateQueries({ queryKey: ['all-gym-staff'] });
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Staff de Gimnasios</h1>
          <p className="text-muted-foreground">Gestiona el personal de todos los gimnasios</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Agregar Staff</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Agregar Staff a Gimnasio</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Gimnasio *</Label>
                <Select value={selectedGym || '__none__'} onValueChange={v => setSelectedGym(v === '__none__' ? '' : v)}>
                  <SelectTrigger><SelectValue placeholder="Selecciona un gimnasio" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Seleccionar...</SelectItem>
                    {(hasFullAccess ? gyms : gyms?.filter(g => g.disciplinas?.some(d => allowedDisciplines.includes(d as any))))?.map(gym => (
                      <SelectItem key={gym.id} value={gym.id}>{gym.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Buscar Usuario *</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    placeholder="Buscar por handle o email..."
                    value={searchQuery}
                    onChange={e => searchUsers(e.target.value)}
                  />
                </div>
                {searchResults.length > 0 && !selectedUser && (
                  <div className="border rounded-md mt-1 max-h-40 overflow-y-auto">
                    {searchResults.map(user => (
                      <button
                        key={user.id}
                        type="button"
                        className="w-full flex items-center gap-2 p-2 hover:bg-muted text-left text-sm"
                        onClick={() => { setSelectedUser(user); setSearchQuery(`@${user.handle}`); setSearchResults([]); }}
                      >
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={user.avatar_url || ''} />
                          <AvatarFallback>{(user.first_name || user.handle || '?').charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">@{user.handle}</span>
                        <span className="text-muted-foreground">{user.email}</span>
                      </button>
                    ))}
                  </div>
                )}
                {selectedUser && (
                  <div className="flex items-center gap-2 mt-2 p-2 bg-muted rounded-md text-sm">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={selectedUser.avatar_url || ''} />
                      <AvatarFallback>{(selectedUser.first_name || '?').charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span>@{selectedUser.handle}</span>
                    <Button variant="ghost" size="sm" className="ml-auto h-6" onClick={() => { setSelectedUser(null); setSearchQuery(''); }}>
                      Cambiar
                    </Button>
                  </div>
                )}
              </div>

              <div>
                <Label>Rol *</Label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OWNER">Propietario</SelectItem>
                    <SelectItem value="HEAD_COACH">Entrenador Principal</SelectItem>
                    <SelectItem value="ASSISTANT_COACH">Asistente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleAddStaff} disabled={isSubmitting}>
                  {isSubmitting ? 'Agregando...' : 'Agregar Staff'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p>Cargando...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(hasFullAccess ? allStaff : allStaff?.filter(s => {
            const gym = gyms?.find(g => g.id === (s as any).gym_id);
            return gym?.disciplinas?.some(d => allowedDisciplines.includes(d as any));
          }))?.map(staff => {
            const roleInfo = ROLE_LABELS[staff.role] || ROLE_LABELS.ASSISTANT_COACH;
            const gymName = (staff as any).gyms?.nombre || 'Sin gimnasio';
            return (
              <Card key={staff.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={staff.user?.avatar_url || ''} />
                      <AvatarFallback>{(staff.user?.first_name || staff.user?.handle || '?').charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {[staff.user?.first_name, staff.user?.last_name].filter(Boolean).join(' ') || `@${staff.user?.handle}`}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{gymName}</p>
                    </div>
                    <Badge variant={roleInfo.variant}>{roleInfo.label}</Badge>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t">
                    <span className="text-xs text-muted-foreground">@{staff.user?.handle}</span>
                    <Button variant="ghost" size="sm" className="text-destructive h-7 text-xs" onClick={() => handleDeactivate(staff.id)}>
                      Desactivar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {allStaff?.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">No hay staff registrado</p>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Agregar Primer Staff
          </Button>
        </div>
      )}
    </div>
  );
}
