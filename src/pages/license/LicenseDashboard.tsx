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
      case 'ACTIVE': return 'bg-fighter-success text-white';
      case 'SUSPENDED': return 'bg-fighter-danger text-white';
      case 'PENDING_REVIEW': return 'bg-fighter-warning text-black';
      case 'EXPIRED': return 'bg-fighter-accent text-white';
      default: return 'bg-fighter-accent text-white';
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
      case 'AMATEUR': return 'bg-fighter-info text-white';
      case 'SEMI_PRO': return 'bg-fighter-secondary text-white';
      case 'PROFESSIONAL': return 'bg-amber-600 text-white';
      default: return 'bg-fighter-accent text-white';
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-urban-light/30 p-6">
      <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-neon-primary to-purple-neon-secondary bg-clip-text text-transparent">
              Mi Licencia de Pelea
            </h1>
            <p className="text-muted-foreground text-lg">
              Gestiona tu identidad como peleador profesional
            </p>
          </div>
          <Button 
            asChild 
            variant="outline" 
            className="border-2 border-purple-neon-primary/50 text-purple-neon-primary hover:bg-purple-neon-primary hover:text-white hover:shadow-purple-neon transition-all duration-300 hover-scale"
          >
            <Link to="/license/qr">
              <QrCode className="h-4 w-4 mr-2" />
              Ver Código QR
            </Link>
          </Button>
        </div>

        {/* Main License Card */}
        <Card className="relative overflow-hidden border-2 border-purple-neon-primary/20 bg-gradient-card shadow-urban hover:shadow-purple-neon transition-all duration-500 animate-slide-up">
          {/* Neon accent line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-purple-neon"></div>
          
          <CardHeader className="pb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <Avatar className="h-20 w-20 border-3 border-purple-neon-primary/50 shadow-glow">
                  <AvatarFallback className="bg-gradient-to-br from-purple-neon-primary to-purple-neon-secondary text-white text-2xl font-bold">
                    {fighterProfile?.first_name?.charAt(0) || 'U'}
                    {fighterProfile?.last_name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-3">
                  <CardTitle className="text-3xl font-bold text-foreground">
                    {fighterProfile?.first_name || 'Usuario'} {fighterProfile?.last_name || ''}
                  </CardTitle>
                  {fighterProfile?.nickname && (
                    <CardDescription className="text-xl font-medium text-purple-neon-primary">
                      "{fighterProfile.nickname}"
                    </CardDescription>
                  )}
                  <div className="flex items-center gap-3">
                    <Badge 
                      className={`${getStatusColor(licenseData.status)} border-0 font-medium px-3 py-1 shadow-md`}
                    >
                      {getStatusText(licenseData.status)}
                    </Badge>
                    <Badge 
                      className={`${getLevelColor(licenseData.license_level)} border-0 font-medium px-3 py-1 shadow-md`}
                    >
                      {licenseData.license_level}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="text-right bg-gradient-to-br from-purple-neon-primary/10 to-purple-neon-secondary/10 p-6 rounded-xl border border-purple-neon-primary/20">
                <p className="text-sm font-medium text-purple-neon-primary uppercase tracking-wider">Número de Licencia</p>
                <p className="text-3xl font-bold text-purple-neon-primary tracking-wider mt-2 font-mono">
                  {licenseData.license_number}
                </p>
              </div>
            </div>
          </CardHeader>
          
          <Separator className="bg-gradient-to-r from-transparent via-purple-neon-primary/30 to-transparent" />
          
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { label: 'País', value: fighterProfile?.country || 'N/A' },
                { label: 'División', value: fighterProfile?.weight_class || 'N/A' },
                { 
                  label: 'Record', 
                  value: `${fighterProfile?.record_wins || 0}-${fighterProfile?.record_losses || 0}-${fighterProfile?.record_draws || 0}` 
                },
                { label: 'Rating ELO', value: fighterProfile?.elo_rating || 1200 }
              ].map((stat, index) => (
                <div key={index} className="text-center p-4 rounded-lg bg-gradient-to-br from-background to-muted/20 border border-border hover:border-purple-neon-primary/30 transition-all duration-300">
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">{stat.label}</p>
                  <p className="text-xl font-bold text-foreground mt-2">{stat.value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Status Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-slide-up">
          {/* Status Overview */}
          <Card className="border border-purple-neon-primary/20 bg-gradient-card shadow-urban hover:shadow-purple-neon/20 transition-all duration-300 hover-scale">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-lg">
                <div className="p-2 rounded-lg bg-purple-neon-primary/10">
                  <Shield className="h-5 w-5 text-purple-neon-primary" />
                </div>
                Estado de Licencia
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border">
                <span className="font-medium text-foreground">Estado Médico</span>
                {licenseData.medical_cleared ? (
                  <CheckCircle className="h-5 w-5 text-fighter-success" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-fighter-warning" />
                )}
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border">
                <span className="font-medium text-foreground">Estado Físico</span>
                {licenseData.physical_cleared ? (
                  <CheckCircle className="h-5 w-5 text-fighter-success" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-fighter-warning" />
                )}
              </div>
              {licenseData.expires_at && (
                <div className="p-3 rounded-lg bg-purple-neon-primary/5 border border-purple-neon-primary/20">
                  <p className="text-sm font-medium text-purple-neon-primary uppercase tracking-wide">Expira</p>
                  <p className="font-bold text-foreground mt-1">
                    {format(new Date(licenseData.expires_at), 'PP', { locale: es })}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Medical Certification */}
          <Card className="border border-purple-neon-primary/20 bg-gradient-card shadow-urban hover:shadow-purple-neon/20 transition-all duration-300 hover-scale">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-lg">
                <div className="p-2 rounded-lg bg-purple-neon-primary/10">
                  <CheckCircle className="h-5 w-5 text-purple-neon-primary" />
                </div>
                Certificación Médica
              </CardTitle>
            </CardHeader>
            <CardContent>
              {validMedicalCert ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-fighter-success/10 border border-fighter-success/20">
                    <CheckCircle className="h-5 w-5 text-fighter-success" />
                    <span className="font-bold text-fighter-success">Vigente</span>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      Emitido por: <span className="text-foreground font-semibold">{validMedicalCert.issued_by}</span>
                    </p>
                    <p className="text-sm font-medium text-muted-foreground">
                      Expira: <span className="text-foreground font-semibold">{format(new Date(validMedicalCert.expires_date), 'PP', { locale: es })}</span>
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-fighter-warning/10 border border-fighter-warning/20">
                    <AlertTriangle className="h-5 w-5 text-fighter-warning" />
                    <span className="font-bold text-fighter-warning">Requerida</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Necesitas una certificación médica válida para mantener tu licencia activa
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Next Fight */}
          <Card className="border border-purple-neon-primary/20 bg-gradient-card shadow-urban hover:shadow-purple-neon/20 transition-all duration-300 hover-scale">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-lg">
                <div className="p-2 rounded-lg bg-purple-neon-primary/10">
                  <Calendar className="h-5 w-5 text-purple-neon-primary" />
                </div>
                Próxima Pelea
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingFights.length > 0 ? (
                <div className="space-y-3">
                  <div className="p-4 rounded-lg bg-gradient-to-br from-purple-neon-primary/10 to-purple-neon-secondary/10 border border-purple-neon-primary/20">
                    <p className="font-bold text-foreground text-lg">{upcomingFights[0].event_name}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {format(new Date(upcomingFights[0].scheduled_date), 'PPP', { locale: es })}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {upcomingFights[0].venue}
                    </p>
                    <Badge variant="outline" className="mt-2 border-purple-neon-primary/50 text-purple-neon-primary">
                      {upcomingFights[0].weight_class}
                    </Badge>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="p-4 rounded-full bg-muted/20 w-fit mx-auto mb-4">
                    <Clock className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground font-medium">
                    No tienes peleas programadas
                  </p>
                  <p className="text-sm text-muted-foreground/80 mt-1">
                    Mantén tu licencia activa para futuras oportunidades
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Suspension Notice */}
        {licenseData.status === 'SUSPENDED' && (
          <Card className="border-2 border-fighter-danger/20 bg-gradient-to-br from-fighter-danger/5 to-fighter-danger/10 shadow-lg animate-pulse-purple-neon">
            <CardHeader>
              <CardTitle className="text-fighter-danger flex items-center gap-3 text-xl">
                <div className="p-2 rounded-lg bg-fighter-danger/10">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                Licencia Suspendida
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-fighter-danger/10 border border-fighter-danger/20">
                <p className="text-fighter-danger font-semibold mb-2">
                  Razón: {licenseData.suspension_reason}
                </p>
                {licenseData.suspension_until && (
                  <p className="text-sm text-fighter-danger/80">
                    Suspensión hasta: {format(new Date(licenseData.suspension_until), 'PPP', { locale: es })}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}