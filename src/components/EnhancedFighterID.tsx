import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { FighterProfile } from '@/hooks/useFighterProfiles';
import { 
  User, 
  Calendar, 
  MapPin, 
  Phone, 
  Heart,
  AlertTriangle,
  Shield,
  CreditCard,
  FileText,
  Clock,
  Star
} from 'lucide-react';

interface EnhancedFighterIDProps {
  profile: FighterProfile;
  onEdit?: () => void;
  onGenerateQR?: () => void;
  showAdmin?: boolean;
}

export function EnhancedFighterID({ profile, onEdit, onGenerateQR, showAdmin = false }: EnhancedFighterIDProps) {
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'active':
        return 'bg-professional-accent/10 text-professional-primary border-professional-accent/30';
      case 'suspended':
        return 'bg-professional-danger/10 text-professional-danger border-professional-danger/30';
      case 'expired':
        return 'bg-professional-muted/20 text-professional-foreground border-professional-border';
      default:
        return 'bg-professional-muted/10 text-professional-foreground border-professional-border';
    }
  };

  const getLevelColor = (level?: string) => {
    switch (level?.toLowerCase()) {
      case 'professional':
      case 'profesional':
        return 'bg-professional-primary/15 text-professional-primary border-professional-primary/30';
      case 'semi-professional':
      case 'semi-profesional':
        return 'bg-professional-accent/15 text-professional-accent border-professional-accent/30';
      default:
        return 'bg-professional-muted/15 text-professional-foreground border-professional-border';
    }
  };

  return (
    <div className="space-y-6">
      {/* Main Fighter ID Card */}
      <Card className="bg-gradient-professional border-professional-border/30 shadow-professional">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <img
                  src={profile.avatar_url || '/placeholder-avatar.png'}
                  alt={`${profile.first_name} ${profile.last_name}`}
                  className="h-20 w-20 rounded-xl object-cover border-2 border-professional-accent/40"
                />
                <Badge 
                  className={`absolute -bottom-2 -right-2 ${getStatusColor(profile.license_status)}`}
                >
                  {profile.license_status?.toUpperCase() || 'ACTIVE'}
                </Badge>
              </div>
              <div className="space-y-1">
                <h2 className="text-2xl font-bold text-professional-primary">
                  {profile.first_name} {profile.last_name}
                </h2>
                {profile.nickname && (
                  <p className="text-professional-accent text-lg">"{profile.nickname}"</p>
                )}
                <div className="flex items-center gap-2">
                  <Badge className={getLevelColor(profile.level)}>
                    {profile.level || 'Amateur'}
                  </Badge>
                  <Badge variant="professional-outline">
                    {profile.weight_class}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="text-right space-y-1">
              <p className="text-sm text-professional-accent">License #</p>
              <p className="font-mono text-lg text-professional-primary">{profile.license_number}</p>
              {onGenerateQR && (
                <Button 
                  variant="professional" 
                  size="sm"
                  onClick={onGenerateQR}
                >
                  QR Code
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-professional-primary">{profile.record_wins}</div>
              <div className="text-sm text-professional-accent">Victorias</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-professional-primary">{profile.record_losses}</div>
              <div className="text-sm text-professional-accent">Derrotas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-professional-primary">{profile.record_draws}</div>
              <div className="text-sm text-professional-accent">Empates</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-professional-primary">{profile.elo_rating}</div>
              <div className="text-sm text-professional-accent">ELO Rating</div>
            </div>
          </div>

          {profile.martial_arts && profile.martial_arts.length > 0 && (
            <div>
              <p className="text-sm text-professional-accent mb-2">Artes Marciales:</p>
              <div className="flex flex-wrap gap-1">
                {profile.martial_arts.map((art, index) => (
                  <Badge key={index} variant="professional" className="text-xs">
                    {art}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Critical Safety Information */}
      <Card className="border-professional-danger/20 bg-professional-danger/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-professional-danger">
            <AlertTriangle className="h-5 w-5" />
            Información Crítica de Seguridad
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Information */}
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2 text-professional-danger">
                <User className="h-4 w-4" />
                Información Personal
              </h4>
              <div className="space-y-2 text-sm">
                {profile.document_type && profile.document_number && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{profile.document_type}:</span>
                    <span className="font-mono">{profile.document_number}</span>
                  </div>
                )}
                {profile.birthdate && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fecha de Nacimiento:</span>
                    <span>{new Date(profile.birthdate).toLocaleDateString('es-HN')}</span>
                  </div>
                )}
                {profile.birthplace && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Lugar de Nacimiento:</span>
                    <span>{profile.birthplace}</span>
                  </div>
                )}
                {profile.blood_type && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tipo de Sangre:</span>
                    <Badge variant="destructive" className="text-xs">{profile.blood_type}</Badge>
                  </div>
                )}
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2 text-professional-danger">
                <Phone className="h-4 w-4" />
                Contacto de Emergencia
              </h4>
              <div className="space-y-2 text-sm">
                {profile.emergency_contact_name && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nombre:</span>
                    <span className="font-semibold">{profile.emergency_contact_name}</span>
                  </div>
                )}
                {profile.emergency_contact_relation && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Relación:</span>
                    <span>{profile.emergency_contact_relation}</span>
                  </div>
                )}
                {profile.emergency_contact_phone && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Teléfono:</span>
                    <span className="font-mono">{profile.emergency_contact_phone}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Medical Information */}
          <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2 text-professional-danger">
              <Heart className="h-4 w-4" />
              Información Médica
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {profile.medical_allergies && (
                <div>
                  <span className="text-muted-foreground font-medium">Alergias:</span>
                  <p className="mt-1 text-professional-danger">{profile.medical_allergies}</p>
                </div>
              )}
              {profile.medical_conditions && (
                <div>
                  <span className="text-muted-foreground font-medium">Condiciones Médicas:</span>
                  <p className="mt-1 text-professional-danger">{profile.medical_conditions}</p>
                </div>
              )}
            </div>
          </div>

          {/* Insurance Information */}
          {(profile.insurance_company || profile.insurance_policy) && (
            <>
              <Separator />
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2 text-professional-danger">
                    <Shield className="h-4 w-4" />
                    Seguro Médico
                  </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {profile.insurance_company && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Compañía:</span>
                      <span>{profile.insurance_company}</span>
                    </div>
                  )}
                  {profile.insurance_policy && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Póliza:</span>
                      <span className="font-mono">{profile.insurance_policy}</span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Professional Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Información Profesional
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Gimnasio/Academia:</p>
              <p className="font-medium">{profile.gym_name || 'No especificado'}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Estilo de Pelea:</p>
              <p className="font-medium">{profile.fighting_style || 'No especificado'}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Postura:</p>
              <p className="font-medium">{profile.stance || 'No especificado'}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">País:</p>
              <p className="font-medium">{profile.country}</p>
            </div>
          </div>

          {profile.bio && (
            <>
              <Separator />
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Biografía:</p>
                <p className="text-sm leading-relaxed">{profile.bio}</p>
              </div>
            </>
          )}

          {(profile.boxrec_url || profile.tapology_url) && (
            <>
              <Separator />
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Links Profesionales:</p>
                <div className="flex gap-2">
                  {profile.boxrec_url && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={profile.boxrec_url} target="_blank" rel="noopener noreferrer">
                        BoxRec
                      </a>
                    </Button>
                  )}
                  {profile.tapology_url && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={profile.tapology_url} target="_blank" rel="noopener noreferrer">
                        Tapology
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* License Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Información de Licencia
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {profile.license_issued_date && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Fecha de Emisión:</p>
                <p className="font-medium">
                  {new Date(profile.license_issued_date).toLocaleDateString('es-HN')}
                </p>
              </div>
            )}
            {profile.license_expires_date && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Fecha de Vencimiento:</p>
                <p className="font-medium">
                  {new Date(profile.license_expires_date).toLocaleDateString('es-HN')}
                </p>
              </div>
            )}
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Estado:</p>
              <Badge className={getStatusColor(profile.license_status)}>
                {profile.license_status?.toUpperCase() || 'ACTIVE'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Admin Actions */}
      {showAdmin && onEdit && (
        <Card className="border-professional-accent/20 bg-professional-accent/5">
          <CardContent className="pt-6">
            <div className="flex justify-center">
              <Button onClick={onEdit} variant="professional">
                Editar Información
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}