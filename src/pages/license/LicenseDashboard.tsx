import { Shield, Calendar, AlertTriangle, CheckCircle, Clock, QrCode } from 'lucide-react';
import { useLicenseAuth } from '@/hooks/useLicenseAuth';
import { useLicenseData } from '@/hooks/useLicenseSystem';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Link } from 'react-router-dom';

export default function LicenseDashboard() {
  const { user, licenseData } = useLicenseAuth();
  const { license, fightBookings, medicalCerts } = useLicenseData(licenseData?.id);

  console.log('Dashboard - licenseData:', licenseData);
  console.log('Dashboard - license:', license);

  if (!licenseData) {
    return (
      <div className="text-center py-12">
        <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Sin Licencia</h2>
        <p className="text-muted-foreground">No tienes una licencia activa.</p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-500';
      case 'SUSPENDED': return 'bg-red-500';
      case 'PENDING_REVIEW': return 'bg-orange-500';
      case 'EXPIRED': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'Activa';
      case 'SUSPENDED': return 'Suspendida';
      case 'PENDING_REVIEW': return 'En Revisión';
      case 'EXPIRED': return 'Expirada';
      default: return status;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'AMATEUR': return 'bg-blue-500';
      case 'SEMI_PRO': return 'bg-purple-500';
      case 'PROFESSIONAL': return 'bg-gold-500';
      default: return 'bg-gray-500';
    }
  };

  const upcomingFights = fightBookings?.data?.filter(fight => 
    new Date(fight.scheduled_date) > new Date()
  ).slice(0, 3) || [];

  const validMedicalCert = medicalCerts?.data?.find(cert => 
    cert.cleared && new Date(cert.expires_date) > new Date()
  );

  // Get fighter profile from license data
  const fighterProfile = license?.data?.fighter_profiles;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Mi Licencia de Pelea</h1>
          <p className="text-muted-foreground">
            Gestiona tu identidad como peleador
          </p>
        </div>
        <Button asChild variant="outline" className="border-purple-neon-primary text-purple-neon-primary">
          <Link to="/license/qr">
            <QrCode className="h-4 w-4 mr-2" />
            Ver Código QR
          </Link>
        </Button>
      </div>

      {/* License Card */}
      <Card className="border-2 border-purple-neon-primary/20 bg-gradient-to-r from-purple-neon-primary/5 to-purple-neon-secondary/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-2 border-purple-neon-primary">
                <AvatarFallback className="bg-purple-neon-primary text-white text-xl">
                  {fighterProfile?.first_name?.charAt(0) || 'U'}
                  {fighterProfile?.last_name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-2xl">
                  {fighterProfile?.first_name || 'Usuario'} {fighterProfile?.last_name || ''}
                </CardTitle>
                {fighterProfile?.nickname && (
                  <CardDescription className="text-lg font-medium">
                    "{fighterProfile.nickname}"
                  </CardDescription>
                )}
                <div className="mt-2 flex items-center gap-2">
                  <Badge 
                    variant="outline" 
                    className={`${getStatusColor(licenseData.status)} text-white border-0`}
                  >
                    {getStatusText(licenseData.status)}
                  </Badge>
                  <Badge 
                    variant="outline" 
                    className={`${getLevelColor(licenseData.license_level)} text-white border-0`}
                  >
                    {licenseData.license_level}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Número de Licencia</p>
              <p className="text-2xl font-bold text-purple-neon-primary">
                {licenseData.license_number}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">País</p>
              <p className="font-medium">{fighterProfile?.country || 'N/A'}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">División</p>
              <p className="font-medium">{fighterProfile?.weight_class || 'N/A'}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Record</p>
              <p className="font-medium">
                {fighterProfile?.record_wins || 0}-
                {fighterProfile?.record_losses || 0}-
                {fighterProfile?.record_draws || 0}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Rating ELO</p>
              <p className="font-medium">{fighterProfile?.elo_rating || 1200}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Status Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Estado de Licencia
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Estado Médico</span>
              {licenseData.medical_cleared ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-orange-500" />
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Estado Físico</span>
              {licenseData.physical_cleared ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-orange-500" />
              )}
            </div>
            {licenseData.expires_at && (
              <div>
                <p className="text-sm text-muted-foreground">Expira</p>
                <p className="font-medium">
                  {format(new Date(licenseData.expires_at), 'PP', { locale: es })}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Medical Certification */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Certificación Médica
            </CardTitle>
          </CardHeader>
          <CardContent>
            {validMedicalCert ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-green-600 font-medium">Vigente</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Emitido por: {validMedicalCert.issued_by}
                </p>
                <p className="text-sm text-muted-foreground">
                  Expira: {format(new Date(validMedicalCert.expires_date), 'PP', { locale: es })}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  <span className="text-orange-600 font-medium">Requerida</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Necesitas una certificación médica válida
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Next Fight */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Próxima Pelea
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingFights.length > 0 ? (
              <div className="space-y-2">
                <p className="font-medium">{upcomingFights[0].event_name}</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(upcomingFights[0].scheduled_date), 'PPP', { locale: es })}
                </p>
                <p className="text-sm text-muted-foreground">
                  {upcomingFights[0].venue}
                </p>
                <Badge variant="outline" className="text-xs">
                  {upcomingFights[0].weight_class}
                </Badge>
              </div>
            ) : (
              <div className="text-center py-4">
                <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  No tienes peleas programadas
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Suspension Notice */}
      {licenseData.status === 'SUSPENDED' && (
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
          <CardHeader>
            <CardTitle className="text-red-700 dark:text-red-400 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Licencia Suspendida
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600 dark:text-red-300 mb-2">
              Razón: {licenseData.suspension_reason}
            </p>
            {licenseData.suspension_until && (
              <p className="text-sm text-red-500 dark:text-red-400">
                Suspensión hasta: {format(new Date(licenseData.suspension_until), 'PPP', { locale: es })}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}