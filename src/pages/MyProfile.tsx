import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useFighterProfiles, FighterProfile } from '@/hooks/useFighterProfiles';
import { useStatusUpdates } from '@/hooks/useStatusUpdates'; 
import { useSparring } from '@/hooks/useSparring';
import { useFighterLicenses, useOrganizations } from '@/hooks/useLicenses';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Shield, Activity, Users, Plus, ExternalLink, Eye, Camera, Edit, Info } from 'lucide-react';
import { FighterProfileForm } from '@/components/FighterProfileForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const DISCIPLINES = ['MMA','Boxeo','Judo','JiuJitsu','Kickboxing','MuayThai','Grappling','Otro'];

export default function MyProfile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { getUserFighterProfile } = useFighterProfiles();
  const { organizations } = useOrganizations();
  const [profile, setProfile] = useState<FighterProfile | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => { 
    getUserFighterProfile().then((profile) => {
      setProfile(profile);
      if (!profile) {
        setShowCreateDialog(true);
      }
    }); 
  }, [getUserFighterProfile]);

  const { updates, addUpdate } = useStatusUpdates(profile?.id ?? null);
  const { inbox, createRequest, updateStatus } = useSparring(profile?.id ?? null);
  const { licenses } = useFighterLicenses(profile?.id ?? null);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-professional-muted/20 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center p-8">
            <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Acceso Restringido</h2>
            <p className="text-muted-foreground mb-6">Debes iniciar sesión para ver tu perfil.</p>
            <Button asChild>
              <Link to="/auth">Iniciar Sesión</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-professional-muted/20 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <Shield className="h-16 w-16 text-professional-primary mx-auto mb-4" />
            <h1 className="text-4xl font-bold text-professional-primary mb-2">Mi Perfil</h1>
            <p className="text-muted-foreground text-lg">Crea tu perfil de peleador para comenzar</p>
          </div>

          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl">Crear Perfil de Peleador</DialogTitle>
              </DialogHeader>
              <FighterProfileForm onSuccess={() => {
                setShowCreateDialog(false);
                getUserFighterProfile().then(setProfile);
                toast({ title: "Perfil creado", description: "Tu perfil de peleador ha sido creado exitosamente" });
              }} />
            </DialogContent>
          </Dialog>

          <Card className="border border-professional-border/30 bg-gradient-professional-light shadow-professional">
            <CardContent className="text-center p-12">
              <div className="p-6 rounded-full bg-professional-accent/10 w-fit mx-auto mb-6">
                <Users className="h-12 w-12 text-professional-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-4">No tienes un perfil de peleador</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Para acceder a todas las funciones de la plataforma, necesitas crear tu perfil de peleador.
              </p>
              <Button onClick={() => setShowCreateDialog(true)} size="lg">
                <Plus className="h-5 w-5 mr-2" />
                Crear Mi Perfil
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const addStatus = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!profile) return;
    const fd = new FormData(e.currentTarget);
    try {
      await addUpdate.mutateAsync({
        fighter_id: profile.id,
        weight_kg: Number(fd.get('weight_kg') || 0) || undefined,
        bodyfat_pct: Number(fd.get('bodyfat_pct') || 0) || undefined,
        injuries: String(fd.get('injuries') || '') || undefined,
        ready_to_fight: Boolean(fd.get('ready_to_fight')),
        note: String(fd.get('note') || '') || undefined,
      });
      (e.target as HTMLFormElement).reset();
      toast({ title: "Update agregado", description: "Tu estado físico ha sido actualizado" });
    } catch (error) {
      toast({ title: "Error", description: "No se pudo agregar el update", variant: "destructive" });
    }
  };

  const sendSparring = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!profile) return;
    const fd = new FormData(e.currentTarget);
    try {
      await createRequest.mutateAsync({
        from_fighter_id: profile.id,
        to_fighter_id: String(fd.get('to_fighter_id') || '') || null,
        discipline: String(fd.get('sp_discipline') || 'MMA') as 'MMA' | 'Boxeo' | 'Judo' | 'JiuJitsu' | 'Kickboxing' | 'MuayThai' | 'Grappling' | 'Otro',
        weight_range: String(fd.get('weight_range') || '') || undefined,
        proposed_at: String(fd.get('proposed_at') || '') || undefined,
        location: String(fd.get('location') || '') || undefined,
        message: String(fd.get('message') || '') || undefined,
      });
      (e.target as HTMLFormElement).reset();
      toast({ title: "Solicitud enviada", description: "Tu solicitud de sparring ha sido enviada" });
    } catch (error) {
      toast({ title: "Error", description: "No se pudo enviar la solicitud", variant: "destructive" });
    }
  };

  const getLicenseStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-fighter-success/20 text-fighter-success border-fighter-success/30';
      case 'suspended': return 'bg-fighter-danger/20 text-fighter-danger border-fighter-danger/30';
      case 'expired': return 'bg-fighter-info/20 text-fighter-info border-fighter-info/30';
      case 'pending': return 'bg-fighter-warning/20 text-fighter-warning border-fighter-warning/30';
      default: return 'bg-fighter-info/20 text-fighter-info border-fighter-info/30';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-professional-muted/20 p-6">
      <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-professional-primary" />
            <h1 className="text-4xl font-bold text-professional-primary">Mi Perfil</h1>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" asChild className="border-professional-accent/40 hover:bg-professional-accent/10">
              <Link to={`/fighter/${profile.id}`}>
                <Eye className="h-4 w-4 mr-2" />
                Ver Perfil Público
              </Link>
            </Button>
            <Button variant="outline" asChild className="border-professional-accent/40 hover:bg-professional-accent/10">
              <Link to="/license/dashboard">
                <Shield className="h-4 w-4 mr-2" />
                Mi Fighter ID
              </Link>
            </Button>
          </div>
        </div>

        {/* Profile Overview Card */}
        <Card className="relative overflow-hidden border-2 border-professional-border/30 bg-gradient-professional-light shadow-professional">
          {/* Professional accent line */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-professional"></div>
          
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <Avatar className="h-24 w-24 border-4 border-professional-accent/50 shadow-professional">
                    <AvatarImage 
                      src={profile.avatar_url} 
                      alt={`${profile.first_name} ${profile.last_name}`}
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-gradient-professional text-professional-primary-foreground text-2xl font-bold">
                      {profile.first_name?.charAt(0) || 'F'}
                      {profile.last_name?.charAt(0) || 'F'}
                    </AvatarFallback>
                  </Avatar>
                  <Button 
                    size="sm" 
                    className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0 bg-professional-accent hover:bg-professional-accent/80"
                    disabled
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold text-foreground">
                    {profile.first_name} {profile.last_name}
                  </h2>
                  {profile.nickname && (
                    <p className="text-xl font-medium text-professional-accent">
                      "{profile.nickname}"
                    </p>
                  )}
                  <div className="flex gap-3">
                    <Badge variant="outline" className="border-professional-accent/40 text-professional-primary">
                      {profile.weight_class}
                    </Badge>
                    <Badge variant="outline" className="border-professional-border/40">
                      {profile.country}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div className="text-right bg-gradient-to-br from-professional-muted/20 to-professional-accent/10 p-6 rounded-xl border border-professional-border/30">
                <p className="text-sm font-medium text-professional-accent uppercase tracking-wider">Record</p>
                <p className="text-3xl font-bold text-professional-primary tracking-wider mt-2 font-mono">
                  {profile.record_wins || 0}-{profile.record_losses || 0}-{profile.record_draws || 0}
                </p>
                <p className="text-sm text-muted-foreground mt-1">ELO: {profile.elo_rating || 1200}</p>
              </div>
            </div>

            {/* Profile Info Alert */}
            <div className="bg-professional-muted/10 border border-professional-border/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="bg-professional-accent/20 text-professional-primary rounded-full p-2">
                  <Info className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-foreground mb-1">
                    ¿Necesitas actualizar tu información básica?
                  </h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Para realizar cambios en tu perfil de peleador (nombre, disciplina, peso, etc.), debes contactar con el equipo de administración. 
                    Esto garantiza la integridad y veracidad de los datos en el sistema.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <strong>Contacto:</strong> Envía un correo a admin@batalla.hn o comunícate a través del panel de administración.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-slide-up">
          {[
            { label: 'Altura', value: profile.height_cm ? `${profile.height_cm} cm` : 'N/A' },
            { label: 'Peso', value: profile.weight_kg ? `${profile.weight_kg} kg` : 'N/A' },
            { label: 'Alcance', value: profile.reach_cm ? `${profile.reach_cm} cm` : 'N/A' },
            { label: 'Gimnasio', value: profile.gym_name || 'N/A' }
          ].map((stat, index) => (
            <div key={index} className="text-center p-4 rounded-lg bg-gradient-to-br from-background to-professional-muted/10 border border-professional-border/20">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">{stat.label}</p>
              <p className="text-lg font-bold text-foreground mt-2">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs-like sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-slide-up">
          {/* Main Content - 2 columns */}
          <div className="lg:col-span-2 space-y-8">
            {/* Status Updates Section */}
            <Card className="border border-professional-border/30 bg-gradient-professional-light shadow-professional">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Actualizaciones Físicas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <form onSubmit={addStatus} className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="weight_kg">Peso (kg)</Label>
                    <Input name="weight_kg" type="number" step="0.1" placeholder="70.5" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bodyfat_pct">% Grasa corporal</Label>
                    <Input name="bodyfat_pct" type="number" step="0.1" placeholder="15.2" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="injuries">Lesiones</Label>
                    <Input name="injuries" placeholder="Ninguna" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ready_to_fight" className="flex items-center gap-2">
                      <input name="ready_to_fight" type="checkbox" className="rounded" />
                      Listo para pelear
                    </Label>
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="note">Notas</Label>
                    <Input name="note" placeholder="Información adicional..." />
                  </div>
                  <div className="md:col-span-3">
                    <Button type="submit" disabled={addUpdate.isPending}>
                      <Plus className="h-4 w-4 mr-2" />
                      {addUpdate.isPending ? 'Agregando...' : 'Agregar update'}
                    </Button>
                  </div>
                </form>

                <Separator className="bg-gradient-to-r from-transparent via-professional-accent/40 to-transparent" />

                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {updates.data?.map(u => (
                    <div key={u.id} className="p-3 rounded-lg border border-professional-border/30 bg-background/50">
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-medium text-sm">
                          {new Date(u.created_at).toLocaleDateString()} - {new Date(u.created_at).toLocaleTimeString()}
                        </div>
                        <Badge variant={u.ready_to_fight ? 'default' : 'secondary'}>
                          {u.ready_to_fight ? 'Listo' : 'No listo'}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>Peso: {u.weight_kg ?? '—'} kg</div>
                        <div>Grasa: {u.bodyfat_pct ?? '—'}%</div>
                        <div className="col-span-2">Lesiones: {u.injuries || '—'}</div>
                        {u.note && <div className="col-span-2">Nota: {u.note}</div>}
                      </div>
                    </div>
                  ))}
                  {!updates.data?.length && (
                    <div className="text-center py-6 text-muted-foreground">
                      No hay updates físicos registrados
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Sparring Section */}
            <Card className="border border-professional-border/30 bg-gradient-professional-light shadow-professional">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Sparring / Matchmaking
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <form onSubmit={sendSparring} className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="to_fighter_id">Para peleador específico (ID)</Label>
                    <Input name="to_fighter_id" placeholder="UUID del peleador o vacío para abierto" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sp_discipline">Disciplina</Label>
                    <Select name="sp_discipline" defaultValue="MMA">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DISCIPLINES.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="weight_range">Rango de peso</Label>
                    <Input name="weight_range" placeholder="155–170 lbs" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="proposed_at">Fecha/hora propuesta</Label>
                    <Input name="proposed_at" type="datetime-local" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Ubicación</Label>
                    <Input name="location" placeholder="Gimnasio, ciudad..." />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="message">Mensaje</Label>
                    <Textarea name="message" placeholder="Información adicional sobre la solicitud..." />
                  </div>
                  <div className="md:col-span-2">
                    <Button type="submit" disabled={createRequest.isPending}>
                      <Plus className="h-4 w-4 mr-2" />
                      {createRequest.isPending ? 'Enviando...' : 'Enviar solicitud'}
                    </Button>
                  </div>
                </form>

                <Separator className="bg-gradient-to-r from-transparent via-professional-accent/40 to-transparent" />

                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {inbox.data?.map(r => (
                    <div key={r.id} className="p-4 rounded-lg border border-professional-border/30 bg-background/50">
                      <div className="flex items-start justify-between mb-3">
                        <div className="space-y-1">
                          <div className="font-medium">{r.discipline} - {r.weight_range}</div>
                          <div className="text-sm text-muted-foreground">
                            De: {r.from_fighter?.first_name} {r.from_fighter?.last_name} 
                            {r.from_fighter?.nickname ? ` "${r.from_fighter.nickname}"` : ''}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Para: {r.to_fighter ? `${r.to_fighter.first_name} ${r.to_fighter.last_name}` : 'Solicitud abierta'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {r.proposed_at ? `Propuesto: ${new Date(r.proposed_at).toLocaleString()}` : 'Sin fecha específica'}
                          </div>
                          {r.location && <div className="text-sm text-muted-foreground">Lugar: {r.location}</div>}
                          {r.message && <div className="text-sm mt-2 p-2 bg-background/50 rounded">{r.message}</div>}
                        </div>
                        <Badge className={r.status === 'pending' ? 'bg-fighter-warning/20 text-fighter-warning' : 
                                        r.status === 'accepted' ? 'bg-fighter-success/20 text-fighter-success' :
                                        'bg-fighter-danger/20 text-fighter-danger'}>
                          {r.status}
                        </Badge>
                      </div>
                      {r.status === 'pending' && r.to_fighter_id === profile.id && (
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            onClick={() => updateStatus.mutate({ id: r.id, status: 'accepted' })}
                            disabled={updateStatus.isPending}
                          >
                            Aceptar
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => updateStatus.mutate({ id: r.id, status: 'declined' })}
                            disabled={updateStatus.isPending}
                          >
                            Rechazar
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                  {!inbox.data?.length && (
                    <div className="text-center py-6 text-muted-foreground">
                      No hay solicitudes de sparring
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Licenses Card */}
            <Card className="border border-professional-border/30 bg-gradient-professional-light shadow-professional">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Licencias
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {licenses.data?.map(license => (
                    <div key={license.id} className="flex items-center justify-between p-3 rounded-lg border border-professional-border/30 bg-background/50">
                      <div className="space-y-1">
                        <div className="font-medium text-sm">{license.license_number}</div>
                        <div className="text-xs text-muted-foreground">
                          {license.discipline} | Expira: {license.expires_at ? new Date(license.expires_at).toLocaleDateString() : 'N/A'}
                        </div>
                        {license.notes && <div className="text-xs text-muted-foreground">{license.notes}</div>}
                      </div>
                      <Badge className={getLicenseStatusColor(license.status)}>
                        {license.status}
                      </Badge>
                    </div>
                  ))}
                  {!licenses.data?.length && (
                    <div className="text-center py-6 text-muted-foreground text-sm">
                      No tienes licencias registradas aún
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Profile Details */}
            <Card className="border border-professional-border/30 bg-gradient-professional-light shadow-professional">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Detalles del Perfil
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">Disciplinas</Label>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {profile.martial_arts && profile.martial_arts.length > 0 ? (
                      profile.martial_arts.map((art) => (
                        <Badge key={art} variant="outline" className="text-xs border-professional-accent/40 text-professional-primary">
                          {art}
                        </Badge>
                      ))
                    ) : (
                      <Badge variant="outline" className="text-xs border-professional-accent/40 text-professional-primary">
                        {profile.discipline || 'N/A'}
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">Organización</Label>
                  <p className="text-sm mt-1">
                    {organizations.data?.find(org => org.id === profile.organization_id)?.name || 'Sin organización'}
                  </p>
                </div>
                
                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">Estilo de Pelea</Label>
                  <p className="text-sm mt-1">{profile.fighting_style || 'No especificado'}</p>
                </div>
                
                {profile.bio && (
                  <div>
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">Biografía</Label>
                    <p className="text-sm mt-1 text-muted-foreground leading-relaxed">{profile.bio}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}