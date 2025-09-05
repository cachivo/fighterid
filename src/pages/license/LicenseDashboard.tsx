import { Shield, Calendar, AlertTriangle, CheckCircle, Clock, QrCode, Edit, RefreshCw } from 'lucide-react';
import { useLicenseAuth } from '@/hooks/useLicenseAuth';
import { useLicenseData } from '@/hooks/useLicenseSystem';
import { useFighterProfiles } from '@/hooks/useFighterProfiles';
import { EnhancedFighterID } from '@/components/EnhancedFighterID';
import { ProfileCompletionPrompt } from '@/components/ProfileCompletionPrompt';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';

export default function LicenseDashboard() {
  const { user, licenseData } = useLicenseAuth();
  const { license, fightBookings, medicalCerts } = useLicenseData(licenseData?.id);
  const { refreshUserProfile } = useFighterProfiles();
  const [refreshingProfile, setRefreshingProfile] = useState(false);

  console.log('Dashboard - licenseData:', licenseData);
  console.log('Dashboard - license:', license);

  const handleRefreshProfile = async () => {
    setRefreshingProfile(true);
    try {
      await refreshUserProfile();
      // Force a page reload to refresh all license data
      window.location.reload();
    } catch (error) {
      console.error('Error refreshing profile:', error);
    } finally {
      setRefreshingProfile(false);
    }
  };

  // Auto-refresh every 30 seconds to catch applied changes
  useEffect(() => {
    const interval = setInterval(() => {
      // Silent refresh - just reload the page to get latest data
      window.location.reload();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

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
  const fighterProfile = licenseData?.fighter_profiles;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-professional-muted/20 p-6">
      <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-professional-primary">
              Fighter ID Dashboard
            </h1>
            <p className="text-muted-foreground text-lg">
              Información completa de licencia y seguridad
            </p>
          </div>
          <div className="flex gap-3">
            <Button 
              onClick={handleRefreshProfile}
              disabled={refreshingProfile}
              variant="outline" 
              size="sm"
              className="border-2 border-professional-accent/60 text-professional-primary hover:bg-professional-primary hover:text-professional-primary-foreground"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshingProfile ? 'animate-spin' : ''}`} />
              {refreshingProfile ? 'Actualizando...' : 'Actualizar'}
            </Button>
            <Button 
              asChild 
              variant="outline" 
              size="sm"
              className="border-2 border-professional-accent/60 text-professional-primary hover:bg-professional-primary hover:text-professional-primary-foreground"
            >
              <Link to="/license/qr">
                <QrCode className="h-4 w-4 mr-2" />
                Ver QR
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/license/onboarding" className="flex items-center gap-2">
                <Edit className="h-4 w-4" />
                Completar Info
              </Link>
            </Button>
          </div>
        </div>

        {/* Profile Completion Prompt */}
        {fighterProfile && (
          <ProfileCompletionPrompt profile={fighterProfile} className="mb-6" />
        )}

        {/* Enhanced Fighter ID */}
        <EnhancedFighterID 
          profile={fighterProfile}
          showAdmin={false}
        />

        {/* Status Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-slide-up">
          {/* Status Overview */}
          <Card className="border border-professional-border/30 bg-gradient-professional-light shadow-professional hover:shadow-professional-light transition-all duration-300 hover-scale">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-lg">
                <div className="p-2 rounded-lg bg-professional-accent/20">
                  <Shield className="h-5 w-5 text-professional-primary" />
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
                <div className="p-3 rounded-lg bg-professional-muted/10 border border-professional-border/30">
                  <p className="text-sm font-medium text-professional-accent uppercase tracking-wide">Expira</p>
                  <p className="font-bold text-foreground mt-1">
                    {format(new Date(licenseData.expires_at), 'PP', { locale: es })}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Medical Certification */}
          <Card className="border border-professional-border/30 bg-gradient-professional-light shadow-professional hover:shadow-professional-light transition-all duration-300 hover-scale">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-lg">
                <div className="p-2 rounded-lg bg-professional-accent/20">
                  <CheckCircle className="h-5 w-5 text-professional-primary" />
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
                    Necesitas una certificación médica válida para mantener tu Fighter ID activo
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Next Fight */}
          <Card className="border border-professional-border/30 bg-gradient-professional-light shadow-professional hover:shadow-professional-light transition-all duration-300 hover-scale">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-lg">
                <div className="p-2 rounded-lg bg-professional-accent/20">
                  <Calendar className="h-5 w-5 text-professional-primary" />
                </div>
                Próxima Pelea
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingFights.length > 0 ? (
                <div className="space-y-3">
                  <div className="p-4 rounded-lg bg-gradient-to-br from-professional-muted/15 to-professional-accent/10 border border-professional-border/30">
                    <p className="font-bold text-foreground text-lg">{upcomingFights[0].event_name}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {format(new Date(upcomingFights[0].scheduled_date), 'PPP', { locale: es })}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {upcomingFights[0].venue}
                    </p>
                    <Badge variant="outline" className="mt-2 border-professional-accent/60 text-professional-primary">
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
                    Mantén tu Fighter ID activo para futuras oportunidades
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Suspension Notice */}
        {licenseData.status === 'SUSPENDED' && (
          <Card className="border-2 border-fighter-danger/20 bg-gradient-to-br from-fighter-danger/5 to-fighter-danger/10 shadow-professional">
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