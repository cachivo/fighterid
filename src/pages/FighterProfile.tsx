import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useFighterProfiles, FighterProfile as FighterProfileType } from '@/hooks/useFighterProfiles';
import { RecordType } from '@/hooks/useFighterHistory';
import { useCombinedFighterRecord } from '@/hooks/useCombinedFighterRecord';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ArrowLeft, Shield, Trophy, Calendar, MapPin, Users, BarChart3, ExternalLink } from 'lucide-react';
import { OptimizedImage } from '@/components/ui/optimized-image';
import UrbanDecorations from '@/components/UrbanDecorations';

export default function FighterProfile() {
  const { id } = useParams<{ id: string }>();
  const { getFighterById } = useFighterProfiles();
  const { calculateCombinedRecord, isLoading: isLoadingRecord } = useCombinedFighterRecord(id || null);
  const [fighter, setFighter] = useState<FighterProfileType | null>(null);
  const [loading, setLoading] = useState(true);
  const [recordType, setRecordType] = useState<RecordType>('AMATEUR');

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
          <h2 className="text-xl font-semibold mb-2 text-foreground">Cargando perfil...</h2>
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
          <h2 className="text-2xl font-bold mb-2 text-foreground">Peleador no encontrado</h2>
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

  // Calculate record based on selected type
  const currentRecord = calculateCombinedRecord(recordType);
  const record = `${currentRecord.wins}-${currentRecord.losses}-${currentRecord.draws}`;
  const winPercentage = currentRecord.winPercentage;

  // Record source indicator
  const getRecordSourceText = () => {
    switch (currentRecord.source) {
      case 'manual': return 'Récord oficial';
      case 'fights': return 'Desde peleas';
      case 'combined': return 'Récord combinado';
      default: return '';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header Navigation */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Button asChild>
            <Link to="/fighters">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a Fighters
            </Link>
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-8 animate-fade-in">
        {/* Hero Section - Professional Style */}
        <div className="relative overflow-hidden bg-gradient-to-br from-card via-background to-muted">
          {/* Elegant background elements */}
          <div className="absolute inset-0">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/5 via-transparent to-accent/5"></div>
            <div className="absolute top-10 left-10 md:top-20 md:left-20 w-48 h-48 md:w-96 md:h-96 bg-primary/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-10 right-10 md:bottom-20 md:right-20 w-32 h-32 md:w-64 md:h-64 bg-accent/5 rounded-full blur-2xl"></div>
          </div>
          
          {/* Professional accent line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-professional-accent/60 to-transparent shadow-sm"></div>
          
          <div className="relative p-4 md:p-8 lg:p-16">
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 lg:gap-12 items-center">
                {/* Fighter Info */}
                <div className="space-y-4 md:space-y-6 lg:space-y-8 animate-fade-in">
                  <div className="space-y-3 md:space-y-4">
                    <div className="flex flex-wrap gap-2 md:gap-3 mb-3 md:mb-4">
                      <Badge className={`${getStatusColor(fighter.license_status)} border-0 font-medium px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm uppercase tracking-wider`}>
                        {fighter.license_status === 'active' ? 'Activo' : fighter.license_status}
                      </Badge>
                      <Badge variant="outline" className="border-2 border-professional-accent/40 text-foreground px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-medium">
                        {fighter.weight_class}
                      </Badge>
                    </div>
                    
                    {fighter.nickname && (
                      <p className="text-lg md:text-xl lg:text-2xl font-medium text-muted-foreground uppercase tracking-wider">
                        "{fighter.nickname}"
                      </p>
                    )}
                    
                    <h1 className="text-3xl md:text-4xl lg:text-7xl font-bold text-foreground tracking-tight">
                      {fighter.first_name}
                    </h1>
                    <h1 className="text-3xl md:text-4xl lg:text-7xl font-bold text-foreground tracking-tight -mt-2 md:-mt-3 lg:-mt-4">
                      {fighter.last_name}
                    </h1>
                    
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4 md:h-5 md:w-5" />
                      <span className="text-base md:text-lg font-medium">{fighter.country}</span>
                    </div>
                  </div>

                  {/* Record Type Toggle */}
                  <div className="mb-6">
                    <Tabs value={recordType} onValueChange={(value) => setRecordType(value as RecordType)}>
                      <TabsList className="bg-card/95 border border-professional-border/40 w-full shadow-xl backdrop-blur-sm">
                        <TabsTrigger 
                          value="AMATEUR" 
                          className="flex-1 data-[state=active]:bg-professional-accent data-[state=active]:text-professional-accent-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-professional-accent/30 bg-transparent text-muted-foreground hover:bg-professional-accent/10 transition-all duration-300 font-medium"
                        >
                          Amateur
                        </TabsTrigger>
                        <TabsTrigger 
                          value="PROFESSIONAL" 
                          className="flex-1 data-[state=active]:bg-professional-accent data-[state=active]:text-professional-accent-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-professional-accent/30 bg-transparent text-muted-foreground hover:bg-professional-accent/10 transition-all duration-300 font-medium"
                        >
                          Profesional
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>

                  {/* Fight Stats */}
                  <div className="grid grid-cols-3 gap-3 md:gap-6 lg:gap-8">
                    <div className="text-center">
                      <div className="text-2xl md:text-4xl lg:text-6xl font-bold text-green-600 font-mono mb-1 md:mb-2 drop-shadow-2xl" style={{textShadow: '0 4px 12px rgba(0,0,0,0.3)'}}>
                        {currentRecord.wins}
                      </div>
                      <div className="text-xs md:text-sm font-medium text-muted-foreground uppercase tracking-wider">
                        Victorias
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl md:text-4xl lg:text-6xl font-bold text-red-600 font-mono mb-1 md:mb-2 drop-shadow-2xl" style={{textShadow: '0 4px 12px rgba(0,0,0,0.4)'}}>
                        {currentRecord.losses}
                      </div>
                      <div className="text-xs md:text-sm font-medium text-muted-foreground uppercase tracking-wider">
                        Derrotas
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl md:text-4xl lg:text-6xl font-bold text-muted-foreground font-mono mb-1 md:mb-2 drop-shadow-2xl" style={{textShadow: '0 4px 12px rgba(0,0,0,0.3)'}}>
                        {currentRecord.draws}
                      </div>
                      <div className="text-xs md:text-sm font-medium text-muted-foreground uppercase tracking-wider">
                        Empates
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <span className="flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-fighter-success" />
                      {winPercentage}% Victorias
                    </span>
                    {currentRecord.source && (
                      <span className="text-xs px-2 py-1 bg-muted/50 rounded-md">
                        {getRecordSourceText()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Fighter Image */}
                <div className="flex justify-center lg:justify-end animate-scale-in">
                  <div className="relative">
                    {fighter.avatar_url ? (
                      <div className="relative">
                        {/* Professional shadow base */}
                        <div className="absolute inset-0 bg-gradient-to-t from-professional-accent/10 via-muted/5 to-transparent rounded-3xl blur-xl scale-105"></div>
                        
                        {/* Fighter image container with UFC-style presentation */}
                        <div className="relative h-64 md:h-80 lg:h-[500px] w-48 md:w-60 lg:w-80 flex items-end justify-center">
                          <img 
                            src={fighter.avatar_url} 
                            alt={`${fighter.first_name} ${fighter.last_name}`}
                            className="h-full w-full object-contain hover-scale transition-all duration-500"
                            style={{
                              filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.1))'
                            }}
                          />
                        </div>
                        
                        {/* Professional base accent */}
                        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-24 md:w-40 h-1 bg-gradient-to-r from-transparent via-professional-accent/40 to-transparent rounded-full shadow-lg"></div>
                        <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-12 md:w-20 h-0.5 bg-professional-accent/60 rounded-full"></div>
                      </div>
                    ) : (
                      <div className="h-64 md:h-80 lg:h-[500px] w-48 md:w-60 lg:w-80 bg-gradient-to-b from-muted/50 to-card/80 rounded-3xl flex items-center justify-center shadow-2xl border border-professional-border/20">
                        <div className="text-6xl md:text-8xl font-bold text-foreground/80" style={{textShadow: '0 4px 12px rgba(0,0,0,0.3)'}}>
                          {fighter.first_name?.charAt(0) || 'F'}
                          {fighter.last_name?.charAt(0) || 'F'}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Fighter Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6 animate-slide-up">
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
              <CardContent className="p-3 md:p-4 lg:p-6 text-center">
                <div className="p-2 md:p-3 rounded-full bg-professional-accent/20 w-fit mx-auto mb-2 md:mb-4">
                  <stat.icon className="h-4 w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 text-professional-primary" />
                </div>
                <p className="text-xs md:text-sm font-medium text-muted-foreground uppercase tracking-wide mb-1 md:mb-2">{stat.label}</p>
                <p className="text-lg md:text-xl lg:text-2xl font-bold text-foreground">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Fighter Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8 animate-slide-up">
          {/* Bio & Background */}
          <div className="lg:col-span-2">
            <Card className="border border-professional-border/30 bg-gradient-professional-light shadow-professional">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <div className="p-2 rounded-lg bg-professional-accent/20">
                    <Users className="h-6 w-6 text-professional-primary" />
                  </div>
                  <span className="text-foreground">Perfil del Peleador</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {fighter.bio && (
                  <div>
                    <h3 className="font-semibold text-lg mb-3 text-foreground">Biografía</h3>
                    <p className="text-muted-foreground leading-relaxed">{fighter.bio}</p>
                  </div>
                )}
                
                <Separator className="bg-gradient-to-r from-transparent via-professional-accent/40 to-transparent" />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div>
                    <h3 className="font-semibold text-lg mb-3 text-foreground">Disciplinas</h3>
                    <div className="flex flex-wrap gap-2">
                      {fighter.martial_arts && fighter.martial_arts.length > 0 ? (
                        fighter.martial_arts.map((art) => (
                          <Badge key={art} variant="outline" className="border-professional-accent/40 text-foreground">
                            {art}
                          </Badge>
                        ))
                      ) : (
                        <Badge variant="outline" className="border-professional-accent/40 text-foreground">
                          {fighter.discipline || 'N/A'}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-lg mb-3 text-foreground">Estilo de Pelea</h3>
                    <p className="text-muted-foreground">{fighter.fighting_style || 'No especificado'}</p>
                  </div>
                </div>

                {fighter.gym_name && (
                  <>
                    <Separator className="bg-gradient-to-r from-transparent via-professional-accent/40 to-transparent" />
                    <div>
                      <h3 className="font-semibold text-lg mb-3 text-foreground">Gimnasio</h3>
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
                  <span className="text-foreground">Licencia</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {fighter.license_number && (
                  <div className="p-3 rounded-lg bg-muted/50 border border-professional-border/30">
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Número</p>
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
                    <Badge variant="outline" className="border-professional-accent/40 text-foreground">
                      {fighter.level}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* External Links */}
            {(fighter.boxrec_url || fighter.tapology_url) && (
              <Card className="border border-professional-border/30 bg-gradient-professional-light shadow-professional">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-professional-accent/20">
                      <ExternalLink className="h-5 w-5 text-professional-primary" />
                    </div>
                    <span className="text-foreground">Enlaces</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {fighter.boxrec_url && (
                    <Button variant="outline" asChild className="w-full border-professional-accent/40 hover:bg-professional-accent/10">
                      <a href={fighter.boxrec_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Ver en BoxRec
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