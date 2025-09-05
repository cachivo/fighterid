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
        return 'bg-green-100 text-green-800 border-green-300';
      case 'suspended':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'expired':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getLevelColor = (level?: string) => {
    switch (level?.toLowerCase()) {
      case 'professional':
      case 'profesional':
        return 'bg-gold-100 text-gold-800 border-gold-300';
      case 'semi-professional':
      case 'semi-profesional':
        return 'bg-silver-100 text-silver-800 border-silver-300';
      default:
        return 'bg-bronze-100 text-bronze-800 border-bronze-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Main Fighter ID Card */}
      <Card className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white border-purple-500/30">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <img
                  src={profile.avatar_url || '/placeholder-avatar.png'}
                  alt={`${profile.first_name} ${profile.last_name}`}
                  className="h-20 w-20 rounded-xl object-cover border-2 border-purple-400"
                />
                <Badge 
                  className={`absolute -bottom-2 -right-2 ${getStatusColor(profile.license_status)}`}
                >
                  {profile.license_status?.toUpperCase() || 'ACTIVE'}
                </Badge>
              </div>
              <div className="space-y-1">
                <h2 className="text-2xl font-bold">
                  {profile.first_name} {profile.last_name}
                </h2>
                {profile.nickname && (
                  <p className="text-purple-300 text-lg">"{profile.nickname}"</p>
                )}
                <div className="flex items-center gap-2">
                  <Badge className={getLevelColor(profile.level)}>
                    {profile.level || 'Amateur'}
                  </Badge>
                  <Badge variant="outline" className="text-white border-white/30">
                    {profile.weight_class}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="text-right space-y-1">
              <p className="text-sm text-purple-300">License #</p>
              <p className="font-mono text-lg">{profile.license_number}</p>
              {onGenerateQR && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={onGenerateQR}
                  className="border-white/30 text-white hover:bg-white/10"
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
              <div className="text-2xl font-bold text-green-400">{profile.record_wins}</div>
              <div className="text-sm text-purple-300">Victorias</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">{profile.record_losses}</div>
              <div className="text-sm text-purple-300">Derrotas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">{profile.record_draws}</div>
              <div className="text-sm text-purple-300">Empates</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{profile.elo_rating}</div>
              <div className="text-sm text-purple-300">ELO Rating</div>
            </div>
          </div>

          {profile.martial_arts && profile.martial_arts.length > 0 && (
            <div>
              <p className="text-sm text-purple-300 mb-2">Artes Marciales:</p>
              <div className="flex flex-wrap gap-1">
                {profile.martial_arts.map((art, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {art}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Critical Safety Information */}
      <Card className="border-red-200 bg-red-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-800">
            <AlertTriangle className="h-5 w-5" />
            Información Crítica de Seguridad
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Information */}
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2 text-red-700">
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
              <h4 className="font-semibold flex items-center gap-2 text-red-700">
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
            <h4 className="font-semibold flex items-center gap-2 text-red-700">
              <Heart className="h-4 w-4" />
              Información Médica
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {profile.medical_allergies && (
                <div>
                  <span className="text-muted-foreground font-medium">Alergias:</span>
                  <p className="mt-1 text-red-600">{profile.medical_allergies}</p>
                </div>
              )}
              {profile.medical_conditions && (
                <div>
                  <span className="text-muted-foreground font-medium">Condiciones Médicas:</span>
                  <p className="mt-1 text-orange-600">{profile.medical_conditions}</p>
                </div>
              )}
            </div>
          </div>

          {/* Insurance Information */}
          {(profile.insurance_company || profile.insurance_policy) && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2 text-red-700">
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

          {(profile.sherdog_url || profile.tapology_url) && (
            <>
              <Separator />
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Links Profesionales:</p>
                <div className="flex gap-2">
                  {profile.sherdog_url && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={profile.sherdog_url} target="_blank" rel="noopener noreferrer">
                        Sherdog
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
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="pt-6">
            <div className="flex justify-center">
              <Button onClick={onEdit} className="bg-blue-600 hover:bg-blue-700">
                Editar Información
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}