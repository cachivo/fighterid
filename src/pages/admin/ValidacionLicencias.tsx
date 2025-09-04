import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAdminLicenseActions } from '@/hooks/useLicenseSystem';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Shield, Search, Plus, FileText, Loader2, AlertCircle } from 'lucide-react';

const DISCIPLINES = ['MMA','Boxeo','Judo','JiuJitsu','Kickboxing','MuayThai','Grappling','Otro'];

export default function ValidacionLicencias() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { approveLicense, suspendLicense } = useAdminLicenseActions();
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [optimisticUpdates, setOptimisticUpdates] = useState<Record<string, string>>({});
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  
  // Form state for creating/updating licenses
  const [fighterId, setFighterId] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [discipline, setDiscipline] = useState<'MMA' | 'Boxeo' | 'Judo' | 'JiuJitsu' | 'Kickboxing' | 'MuayThai' | 'Grappling' | 'Otro'>('MMA');
  const [status, setStatus] = useState<'ACTIVE'|'SUSPENDED'|'EXPIRED'|'PENDING_REVIEW'>('ACTIVE');
  const [notes, setNotes] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

  // Fetch all licenses for admin view
  const { data: licenses, refetch, isLoading } = useQuery({
    queryKey: ['admin_licenses', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('fighter_licenses')
        .select(`
          *,
          fighter:fighter_id(first_name, last_name, nickname, weight_class)
        `)
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.or(`license_number.ilike.%${searchTerm}%,fighter.first_name.ilike.%${searchTerm}%,fighter.last_name.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch fighters for dropdown
  const { data: fighters } = useQuery({
    queryKey: ['fighters_list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fighter_profiles')
        .select('id, first_name, last_name, nickname')
        .eq('active', true)
        .order('first_name');
      if (error) throw error;
      return data || [];
    },
  });

  // Check admin permissions
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsAdmin(false);
          return;
        }

        const { data: appUser, error } = await supabase
          .from('app_user')
          .select('is_admin')
          .eq('auth_user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error checking admin status:', error);
          setIsAdmin(false);
          return;
        }

        setIsAdmin(appUser?.is_admin ?? false);
      } catch (error) {
        console.error('Error in checkAdminStatus:', error);
        setIsAdmin(false);
      }
    };

    checkAdminStatus();
  }, []);

  // Set up real-time subscription for license updates
  useEffect(() => {
    const channel = supabase
      .channel('license-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'fighter_licenses'
        },
        (payload) => {
          console.log('License change detected:', payload);
          // Invalidate and refetch the licenses query
          queryClient.invalidateQueries({ queryKey: ['admin_licenses'] });
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, refetch]);

  const createOrUpdateLicense = async () => {
    if (!fighterId || !licenseNumber) {
      toast({ title: "Error", description: "Fighter ID y número de licencia son requeridos", variant: "destructive" });
      return;
    }

    try {
      const payload = {
        fighter_id: fighterId,
        license_number: licenseNumber,
        discipline: discipline as any,
        status,
        notes: notes || undefined,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : undefined,
      };

      const { error } = await supabase.from('fighter_licenses').insert(payload);
      
      if (error) throw error;

      toast({ title: "Licencia creada", description: "La licencia ha sido emitida exitosamente" });
      
      // Reset form
      setFighterId('');
      setLicenseNumber('');
      setDiscipline('MMA');
      setStatus('ACTIVE');
      setNotes('');
      setExpiresAt('');
      
      refetch();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const updateLicenseState = async (licenseId: string, newStatus: 'ACTIVE' | 'SUSPENDED') => {
    // Check admin permissions first
    if (!isAdmin) {
      toast({ 
        title: "Acceso Denegado", 
        description: "Solo los administradores pueden modificar licencias", 
        variant: "destructive" 
      });
      return;
    }

    // Optimistic update
    setOptimisticUpdates(prev => ({ ...prev, [licenseId]: newStatus }));
    setLoadingStates(prev => ({ ...prev, [licenseId]: true }));
    
    try {
      if (newStatus === 'ACTIVE') {
        console.log('Approving license:', licenseId);
        await approveLicense.mutateAsync({ 
          licenseId, 
          level: 'AMATEUR' // Default level, could be made configurable
        });
      } else if (newStatus === 'SUSPENDED') {
        console.log('Suspending license:', licenseId);
        await suspendLicense.mutateAsync({ 
          licenseId, 
          reason: 'Suspendida por administrador' 
        });
      }

      const statusText = newStatus === 'ACTIVE' ? 'Activada' : 'Suspendida';
      toast({ 
        title: "Licencia actualizada", 
        description: `Licencia ${statusText} exitosamente`,
        duration: 3000 
      });
      
      // Force a refetch and invalidate related queries
      await refetch();
      queryClient.invalidateQueries({ queryKey: ['admin_licenses'] });
      queryClient.invalidateQueries({ queryKey: ['pending-licenses'] });
      
    } catch (error: any) {
      console.error('Error updating license:', error);
      
      // Revert optimistic update on error
      setOptimisticUpdates(prev => {
        const newState = { ...prev };
        delete newState[licenseId];
        return newState;
      });
      
      // Provide more specific error messages
      let errorMessage = error.message;
      if (error.message?.includes('Unauthorized')) {
        errorMessage = 'No tienes permisos para realizar esta acción';
      } else if (error.message?.includes('admin')) {
        errorMessage = 'Solo los administradores pueden aprobar licencias';
      }
      
      toast({ 
        title: "Error al actualizar licencia", 
        description: errorMessage, 
        variant: "destructive" 
      });
    } finally {
      setLoadingStates(prev => ({ ...prev, [licenseId]: false }));
      
      // Clear optimistic update after a short delay
      setTimeout(() => {
        setOptimisticUpdates(prev => {
          const newState = { ...prev };
          delete newState[licenseId];
          return newState;
        });
      }, 1000);
    }
  };

  const getLicenseStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-fighter-success/20 text-fighter-success border-fighter-success/30 font-medium';
      case 'SUSPENDED': return 'bg-fighter-danger/20 text-fighter-danger border-fighter-danger/30 font-medium';
      case 'EXPIRED': return 'bg-fighter-accent/20 text-fighter-accent border-fighter-accent/30 font-medium';
      case 'PENDING_REVIEW': return 'bg-fighter-warning/20 text-amber-700 border-fighter-warning/30 font-medium';
      default: return 'bg-fighter-accent/20 text-fighter-accent border-fighter-accent/30 font-medium';
    }
  };

  // Loading state while checking admin status
  if (isAdmin === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Verificando permisos...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Gestión de Licencias</h1>
        {!isAdmin && (
          <Badge variant="destructive" className="ml-2">
            <AlertCircle className="h-3 w-3 mr-1" />
            Sin permisos de administrador
          </Badge>
        )}
      </div>

      {!isAdmin && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <p className="font-medium">Acceso Restringido</p>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              No tienes permisos de administrador para acceder a esta funcionalidad.
              Contacta a un administrador si necesitas acceso.
            </p>
          </CardContent>
        </Card>
      )}

      {isAdmin && (
        <>
          {/* Create License Form */}
          <Card className="border-border/50 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Emitir Nueva Licencia
              </CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fighter_select">Peleador</Label>
                <Select value={fighterId} onValueChange={setFighterId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un peleador" />
                  </SelectTrigger>
                  <SelectContent>
                    {fighters?.map(fighter => (
                      <SelectItem key={fighter.id} value={fighter.id}>
                        {fighter.first_name} {fighter.last_name}
                        {fighter.nickname ? ` "${fighter.nickname}"` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="license_number">Número de Licencia</Label>
                <Input 
                  placeholder="FGT-2025-123" 
                  value={licenseNumber} 
                  onChange={e => setLicenseNumber(e.target.value)} 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="discipline_select">Disciplina</Label>
                <Select value={discipline} onValueChange={(v) => setDiscipline(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DISCIPLINES.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="state_select">Estado</Label>
                <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING_REVIEW">Pendiente</SelectItem>
                    <SelectItem value="ACTIVE">Activa</SelectItem>
                    <SelectItem value="SUSPENDED">Suspendida</SelectItem>
                    <SelectItem value="EXPIRED">Expirada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expires_at">Fecha de Expiración</Label>
                <Input 
                  type="date" 
                  value={expiresAt} 
                  onChange={e => setExpiresAt(e.target.value)} 
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="notes">Notas</Label>
                <Textarea 
                  placeholder="Información adicional sobre la licencia..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>

              <div className="md:col-span-2">
                <Button onClick={createOrUpdateLicense} className="w-full sm:w-auto">
                  <FileText className="h-4 w-4 mr-2" />
                  Emitir Licencia
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Search and List */}
          <Card className="border-border/50 shadow-lg">
            <CardHeader>
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Licencias Existentes
                </CardTitle>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por licencia o nombre..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {licenses?.map(license => {
                  // Use optimistic update if available, otherwise use actual status
                  const displayStatus = optimisticUpdates[license.id] || license.status;
                  
                  return (
                    <div key={license.id} className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-card/50">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-3">
                          <div className="font-medium">{license.license_number}</div>
                          <Badge className={getLicenseStatusColor(displayStatus)}>
                            {displayStatus}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <strong>Peleador:</strong> {license.fighter?.first_name} {license.fighter?.last_name}
                          {license.fighter?.nickname ? ` "${license.fighter.nickname}"` : ''}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <strong>Disciplina:</strong> {license.discipline} | 
                          <strong> División:</strong> {license.fighter?.weight_class} | 
                          <strong> Expira:</strong> {license.expires_at ? new Date(license.expires_at).toLocaleDateString() : 'N/A'}
                        </div>
                        {license.notes && (
                          <div className="text-sm text-muted-foreground">
                            <strong>Notas:</strong> {license.notes}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2 ml-4">
                        {displayStatus !== 'ACTIVE' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => updateLicenseState(license.id, 'ACTIVE')}
                            disabled={loadingStates[license.id] || !isAdmin}
                            className="text-green-600 border-green-600 hover:bg-green-600 hover:text-white disabled:opacity-50"
                            title={!isAdmin ? "Solo administradores pueden activar licencias" : ""}
                          >
                            {loadingStates[license.id] ? (
                              <>
                                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                Activando...
                              </>
                            ) : (
                              'Activar'
                            )}
                          </Button>
                        )}
                        {displayStatus === 'ACTIVE' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => updateLicenseState(license.id, 'SUSPENDED')}
                            disabled={loadingStates[license.id] || !isAdmin}
                            className="text-red-600 border-red-600 hover:bg-red-600 hover:text-white disabled:opacity-50"
                            title={!isAdmin ? "Solo administradores pueden suspender licencias" : ""}
                          >
                            {loadingStates[license.id] ? (
                              <>
                                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                Suspendiendo...
                              </>
                            ) : (
                              'Suspender'
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
                
                {!licenses?.length && (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchTerm ? 'No se encontraron licencias con esos criterios' : 'No hay licencias registradas'}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}