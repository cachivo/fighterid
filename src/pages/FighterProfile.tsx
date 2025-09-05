import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useFighterProfiles, FighterProfile as FighterProfileType } from '@/hooks/useFighterProfiles';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Shield, Trophy, Calendar, MapPin, Users, BarChart3, ExternalLink } from 'lucide-react';
import { OptimizedImage } from '@/components/ui/optimized-image';

export default function FighterProfile() {
  const { id } = useParams<{ id: string }>();
  const { getFighterById } = useFighterProfiles();
  const [fighter, setFighter] = useState<FighterProfileType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      getFighterById(id).then((profile) => {
        setFighter(profile);
        setLoading(false);
      });
    }
  }, [id, getFighterById]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-professional-muted/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-professional-primary mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold mb-2">Cargando perfil...</h2>
          <p className="text-muted-foreground">Por favor espera mientras cargamos la información del peleador</p>
        </div>
      </div>
    );
  }

  if (!fighter) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-professional-muted/20 flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Peleador no encontrado</h2>
          <p className="text-muted-foreground mb-6">El perfil que buscas no existe o no está disponible.</p>
          <Button asChild>
            <Link to="/fighters">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a Fighters
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-fighter-success text-white';
      case 'suspended': return 'bg-fighter-danger text-white';
      case 'expired': return 'bg-fighter-info text-white';
      case 'pending': return 'bg-fighter-warning text-black';
      default: return 'bg-fighter-info text-white';
    }
  };

  const record = `${fighter.record_wins || 0}-${fighter.record_losses || 0}-${fighter.record_draws || 0}`;
  const winPercentage = fighter.record_wins && (fighter.record_wins + fighter.record_losses + fighter.record_draws) > 0 
    ? Math.round((fighter.record_wins / (fighter.record_wins + fighter.record_losses + fighter.record_draws)) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-professional-muted/20">
      {/* Header Navigation */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-professional-border/30">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Button variant="ghost" asChild className="hover:bg-professional-muted/20">
            <Link to="/fighters">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a Fighters
            </Link>
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-8 animate-fade-in">
        {/* Hero Section - UFC Style */}
        <Card className="relative overflow-hidden border-2 border-professional-border/30 bg-gradient-professional-light shadow-professional">
          {/* Professional accent line */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-professional"></div>
          
          <CardContent className="p-0">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute inset-0 bg-gradient-to-r from-professional-primary via-transparent to-professional-accent"></div>
            </div>
            
            <div className="relative p-8">
              <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8">
                {/* Fighter Photo & Basic Info */}
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <Avatar className="h-32 w-32 border-4 border-professional-accent/50 shadow-professional bg-gradient-to-br from-professional-muted/20 to-transparent">
                      <AvatarImage 
                        src={fighter.avatar_url} 
                        alt={`${fighter.first_name} ${fighter.last_name}`}
                        className="object-cover"
                        style={{ 
                          background: 'transparent',
                          backdropFilter: 'none'
                        }}
                      />
                      <AvatarFallback className="bg-gradient-professional text-professional-primary-foreground text-4xl font-bold">
                        {fighter.first_name?.charAt(0) || 'F'}
                        {fighter.last_name?.charAt(0) || 'F'}
                      </AvatarFallback>
                    </Avatar>
                    {/* Professional gradient background for the avatar */}
                    <div className="absolute inset-0 -z-10 rounded-full bg-gradient-to-br from-professional-primary/20 via-professional-accent/10 to-professional-muted/5 blur-xl"></div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-2">
                        {fighter.first_name} {fighter.last_name}
                      </h1>
                      {fighter.nickname && (
                        <p className="text-2xl font-medium text-professional-accent mb-3">
                          "{fighter.nickname}"
                        </p>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap gap-3">
                      <Badge className={`${getStatusColor(fighter.license_status)} border-0 font-medium px-4 py-2 shadow-md text-lg`}>
                        {fighter.license_status === 'active' ? 'Activo' : fighter.license_status}
                      </Badge>
                      <Badge variant="outline" className="border-2 border-professional-accent/40 text-professional-primary px-4 py-2 text-lg">
                        {fighter.weight_class}
                      </Badge>
                      <Badge variant="outline" className="border-2 border-professional-border/40 px-4 py-2 text-lg">
                        <MapPin className="h-4 w-4 mr-1" />
                        {fighter.country}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Fight Record - Prominent Display */}
                <div className="flex-1 lg:text-right">
                  <div className="bg-gradient-to-br from-professional-muted/20 to-professional-accent/10 p-8 rounded-2xl border border-professional-border/30">
                    <p className="text-lg font-medium text-professional-accent uppercase tracking-wider mb-2">Record Profesional</p>
                    <p className="text-6xl font-bold text-professional-primary tracking-tight mb-2 font-mono">
                      {record}
                    </p>
                    <div className="flex justify-center lg:justify-end gap-6 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Trophy className="h-4 w-4 text-fighter-success" />
                        {winPercentage}% victorias
                      </span>
                      <span className="flex items-center gap-1">
                        <BarChart3 className="h-4 w-4 text-professional-accent" />
                        ELO: {fighter.elo_rating || 1200}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fighter Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-slide-up">
          {[
            { 
              label: 'Altura', 
              value: fighter.height_cm ? `${fighter.height_cm} cm` : 'N/A',
              icon: BarChart3
            },
            { 
              label: 'Peso', 
              value: fighter.weight_kg ? `${fighter.weight_kg} kg` : 'N/A',
              icon: BarChart3
            },
            { 
              label: 'Alcance', 
              value: fighter.reach_cm ? `${fighter.reach_cm} cm` : 'N/A',
              icon: BarChart3
            },
            { 
              label: 'Stance', 
              value: fighter.stance || 'N/A',
              icon: Users
            }
          ].map((stat, index) => (
            <Card key={index} className="border border-professional-border/30 bg-gradient-professional-light shadow-professional hover:shadow-professional-light transition-all duration-300 hover-scale">
              <CardContent className="p-6 text-center">
                <div className="p-3 rounded-full bg-professional-accent/20 w-fit mx-auto mb-4">
                  <stat.icon className="h-6 w-6 text-professional-primary" />
                </div>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-2">{stat.label}</p>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Fighter Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-slide-up">
          {/* Bio & Background */}
          <div className="lg:col-span-2">
            <Card className="border border-professional-border/30 bg-gradient-professional-light shadow-professional">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <div className="p-2 rounded-lg bg-professional-accent/20">
                    <Users className="h-6 w-6 text-professional-primary" />
                  </div>
                  Perfil del Peleador
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {fighter.bio && (
                  <div>
                    <h3 className="font-semibold text-lg mb-3 text-professional-primary">Biografía</h3>
                    <p className="text-muted-foreground leading-relaxed">{fighter.bio}</p>
                  </div>
                )}
                
                <Separator className="bg-gradient-to-r from-transparent via-professional-accent/40 to-transparent" />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-lg mb-3 text-professional-primary">Disciplinas</h3>
                    <div className="flex flex-wrap gap-2">
                      {fighter.martial_arts && fighter.martial_arts.length > 0 ? (
                        fighter.martial_arts.map((art) => (
                          <Badge key={art} variant="outline" className="border-professional-accent/40 text-professional-primary">
                            {art}
                          </Badge>
                        ))
                      ) : (
                        <Badge variant="outline" className="border-professional-accent/40 text-professional-primary">
                          {fighter.discipline || 'N/A'}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-lg mb-3 text-professional-primary">Estilo de Pelea</h3>
                    <p className="text-muted-foreground">{fighter.fighting_style || 'No especificado'}</p>
                  </div>
                </div>

                {fighter.gym_name && (
                  <>
                    <Separator className="bg-gradient-to-r from-transparent via-professional-accent/40 to-transparent" />
                    <div>
                      <h3 className="font-semibold text-lg mb-3 text-professional-primary">Gimnasio</h3>
                      <p className="text-muted-foreground">{fighter.gym_name}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats & Links */}
          <div className="space-y-6">
            {/* License Info */}
            <Card className="border border-professional-border/30 bg-gradient-professional-light shadow-professional">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-professional-accent/20">
                    <Shield className="h-5 w-5 text-professional-primary" />
                  </div>
                  Licencia
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {fighter.license_number && (
                  <div className="p-3 rounded-lg bg-background/50 border border-professional-border/30">
                    <p className="text-sm font-medium text-professional-accent uppercase tracking-wide">Número</p>
                    <p className="font-mono font-bold text-foreground mt-1">{fighter.license_number}</p>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Estado</span>
                  <Badge className={`${getStatusColor(fighter.license_status)} border-0 font-medium`}>
                    {fighter.license_status === 'active' ? 'Activa' : fighter.license_status}
                  </Badge>
                </div>
                {fighter.level && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Nivel</span>
                    <Badge variant="outline" className="border-professional-accent/40 text-professional-primary">
                      {fighter.level}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* External Links */}
            {(fighter.sherdog_url || fighter.tapology_url) && (
              <Card className="border border-professional-border/30 bg-gradient-professional-light shadow-professional">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-professional-accent/20">
                      <ExternalLink className="h-5 w-5 text-professional-primary" />
                    </div>
                    Enlaces
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {fighter.sherdog_url && (
                    <Button variant="outline" asChild className="w-full border-professional-accent/40 hover:bg-professional-accent/10">
                      <a href={fighter.sherdog_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Ver en Sherdog
                      </a>
                    </Button>
                  )}
                  {fighter.tapology_url && (
                    <Button variant="outline" asChild className="w-full border-professional-accent/40 hover:bg-professional-accent/10">
                      <a href={fighter.tapology_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Ver en Tapology
                      </a>
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}