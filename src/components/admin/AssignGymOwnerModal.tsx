import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AlertTriangle, Crown, Search, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AssignGymOwnerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gymId: string;
  gymName: string;
}

interface UserResult {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  email: string | null;
  handle: string;
  isFighter: boolean;
  currentGymStaff: { gym_id: string; gym_name: string; role: string } | null;
}

export function AssignGymOwnerModal({ open, onOpenChange, gymId, gymName }: AssignGymOwnerModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [currentOwner, setCurrentOwner] = useState<{ id: string; user_name: string } | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserResult | null>(null);
  const [confirmReplace, setConfirmReplace] = useState(false);
  const queryClient = useQueryClient();

  const searchUsers = async (q: string) => {
    if (q.length < 2) { setResults([]); return; }
    setSearching(true);
    try {
      const { data: users } = await supabase
        .from('app_user')
        .select('id, first_name, last_name, avatar_url, email, handle')
        .or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,email.ilike.%${q}%`)
        .limit(15);

      if (!users?.length) { setResults([]); return; }

      const userIds = users.map(u => u.id);
      const [{ data: fighters }, { data: staffEntries }] = await Promise.all([
        supabase.from('fighter_profiles').select('user_id').in('user_id', userIds),
        supabase.from('gym_staff').select('user_id, gym_id, role, gyms(nombre)').in('user_id', userIds).eq('active', true),
      ]);

      const fighterSet = new Set((fighters || []).map((f: any) => f.user_id));

      setResults(users.map(u => ({
        ...u,
        isFighter: fighterSet.has(u.id),
        currentGymStaff: (() => {
          const s = (staffEntries || []).find((s: any) => s.user_id === u.id);
          if (!s) return null;
          return { gym_id: s.gym_id, gym_name: (s as any).gyms?.nombre || '', role: s.role };
        })(),
      })));
    } catch (e) {
      console.error(e);
    } finally {
      setSearching(false);
    }
  };

  const handleSelect = async (user: UserResult) => {
    setSelectedUser(user);
    // Check if gym already has an active OWNER
    const { data: existing } = await supabase
      .from('gym_staff')
      .select('id, user_id')
      .eq('gym_id', gymId)
      .eq('role', 'OWNER')
      .eq('active', true)
      .maybeSingle();

    if (existing) {
      const { data: ownerUser } = await supabase
        .from('app_user')
        .select('first_name, last_name')
        .eq('id', existing.user_id)
        .single();
      setCurrentOwner({
        id: existing.id,
        user_name: [ownerUser?.first_name, ownerUser?.last_name].filter(Boolean).join(' ') || 'Usuario',
      });
      setConfirmReplace(true);
    } else {
      await assignOwner(user.id);
    }
  };

  const assignOwner = async (userId: string, deactivateId?: string) => {
    setAssigning(true);
    try {
      if (deactivateId) {
        await supabase.from('gym_staff').update({ active: false }).eq('id', deactivateId);
      }
      const { error } = await supabase.from('gym_staff').insert({
        gym_id: gymId,
        user_id: userId,
        role: 'OWNER',
        is_primary: true,
      });
      if (error) throw error;

      toast.success('Main Coach asignado exitosamente');
      queryClient.invalidateQueries({ queryKey: ['gym-staff'] });
      queryClient.invalidateQueries({ queryKey: ['gym-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['my-gym-staff'] });
      queryClient.invalidateQueries({ queryKey: ['all-gym-staff'] });
      queryClient.invalidateQueries({ queryKey: ['gym-staff-count'] });
      resetAndClose();
    } catch (e: any) {
      toast.error('Error: ' + e.message);
    } finally {
      setAssigning(false);
    }
  };

  const resetAndClose = () => {
    setQuery('');
    setResults([]);
    setSelectedUser(null);
    setConfirmReplace(false);
    setCurrentOwner(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-500" />
            Asignar Main Coach — {gymName}
          </DialogTitle>
        </DialogHeader>

        {confirmReplace && selectedUser ? (
          <div className="space-y-4">
            <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 border border-destructive/20">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium">Este gimnasio ya tiene Main Coach</p>
                <p className="text-muted-foreground mt-1">
                  <strong>{currentOwner?.user_name}</strong> será reemplazado por{' '}
                  <strong>{[selectedUser.first_name, selectedUser.last_name].filter(Boolean).join(' ')}</strong>
                </p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => { setConfirmReplace(false); setSelectedUser(null); }}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                disabled={assigning}
                onClick={() => assignOwner(selectedUser.id, currentOwner?.id)}
              >
                {assigning ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                Reemplazar
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o email..."
                className="pl-9"
                value={query}
                onChange={e => { setQuery(e.target.value); searchUsers(e.target.value); }}
              />
            </div>

            {searching && <p className="text-sm text-muted-foreground text-center py-2">Buscando...</p>}

            <div className="max-h-64 overflow-y-auto space-y-1">
              {results.map(user => (
                <button
                  key={user.id}
                  className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-accent text-left transition-colors"
                  onClick={() => handleSelect(user)}
                  disabled={assigning}
                >
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user.avatar_url || undefined} />
                    <AvatarFallback>{(user.first_name?.[0] || '?').toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {[user.first_name, user.last_name].filter(Boolean).join(' ') || user.handle}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {user.isFighter && <Badge variant="secondary" className="text-[10px]">Peleador</Badge>}
                    {user.currentGymStaff && (
                      <Badge variant="outline" className="text-[10px]">
                        {user.currentGymStaff.role === 'OWNER' ? 'Admin' : 'Staff'}: {user.currentGymStaff.gym_name}
                      </Badge>
                    )}
                  </div>
                </button>
              ))}
              {query.length >= 2 && !searching && results.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">Sin resultados</p>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
