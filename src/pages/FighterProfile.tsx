import { useParams, Link } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { useFighterProfiles, FighterProfile as FighterProfileType } from '@/hooks/useFighterProfiles';
import { RecordType } from '@/hooks/useFighterHistory';
import { useCombinedFighterRecord } from '@/hooks/useCombinedFighterRecord';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ArrowLeft, Shield, Trophy, Calendar, MapPin, Users, BarChart3, ExternalLink, Info, ChevronDown, Share2, Star, Target, TrendingUp, Award, Eye } from 'lucide-react';
import { OptimizedImage } from '@/components/ui/optimized-image';
import UrbanDecorations from '@/components/UrbanDecorations';

// Animated Counter Component
const AnimatedCounter = ({ end, duration = 1000, prefix = '', suffix = '' }: { end: number; duration?: number; prefix?: string; suffix?: string }) => {
  const [count, setCount] = useState(0);
  const countRef = useRef<HTMLDivElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          let startTime: number;
          const animate = (currentTime: number) => {
            if (!startTime) startTime = currentTime;
            const progress = Math.min((currentTime - startTime) / duration, 1);
            const easedProgress = 1 - Math.pow(1 - progress, 3); // Ease-out cubic
            setCount(Math.floor(easedProgress * end));
            
            if (progress < 1) {
              requestAnimationFrame(animate);
            }
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.5 }
    );

    if (countRef.current) {
      observer.observe(countRef.current);
    }

    return () => observer.disconnect();
  }, [end, duration, hasAnimated]);

  return (
    <div ref={countRef} className="font-mono font-bold">
      {prefix}{count}{suffix}
    </div>
  );
};

export default function FighterProfile() {
  const { id } = useParams<{ id: string }>();
  const { getFighterById } = useFighterProfiles();
  const { calculateCombinedRecord, isLoading: isLoadingRecord } = useCombinedFighterRecord(id || null);
  const [fighter, setFighter] = useState<FighterProfileType | null>(null);
  const [loading, setLoading] = useState(true);
  const [recordType, setRecordType] = useState<RecordType>('AMATEUR');
  const [expandedBio, setExpandedBio] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);

  // Handle scroll for parallax effect
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
        <div className="text-center space-y-6 animate-fade-in">
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-professional-primary/20 border-t-professional-primary mx-auto"></div>
            <div className="absolute inset-0 animate-pulse">
              <div className="h-20 w-20 rounded-full bg-professional-primary/10 mx-auto"></div>
            </div>
          </div>
          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-foreground animate-pulse">Cargando perfil del peleador...</h2>
            <div className="flex justify-center space-x-2">
              <div className="h-2 w-2 bg-professional-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="h-2 w-2 bg-professional-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="h-2 w-2 bg-professional-primary rounded-full animate-bounce"></div>
            </div>
            <p className="text-muted-foreground">Preparando la experiencia definitiva</p>
          </div>
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
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        {/* Enhanced Header Navigation with Share */}
        <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border/50 shadow-lg">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex justify-between items-center">
              <Button asChild className="hover-scale transition-all duration-300">
                <Link to="/fighters">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver a Fighters
                </Link>
              </Button>
              
              <div className="flex items-center gap-3">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (navigator.share) {
                          navigator.share({
                            title: `${fighter?.first_name} ${fighter?.last_name} - Perfil de Peleador`,
                            text: `Conoce el perfil de ${fighter?.first_name} ${fighter?.last_name}`,
                            url: window.location.href,
                          });
                        } else {
                          navigator.clipboard.writeText(window.location.href);
                        }
                      }}
                      className="hover-scale"
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Compartir perfil</TooltipContent>
                </Tooltip>
                
                <Badge variant="outline" className="animate-pulse">
                  <Eye className="h-3 w-3 mr-1" />
                  En vivo
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-6 space-y-8">
          {/* Enhanced Hero Section with Parallax */}
          <div 
            ref={heroRef}
            className="relative overflow-hidden bg-gradient-to-br from-card via-background to-muted rounded-3xl"
            style={{
              transform: `translateY(${scrollY * 0.1}px)`
            }}
          >
            {/* Dynamic background elements */}
            <div className="absolute inset-0">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/5 via-transparent to-accent/5"></div>
              <div 
                className="absolute top-10 left-10 md:top-20 md:left-20 w-48 h-48 md:w-96 md:h-96 bg-primary/5 rounded-full blur-3xl transition-all duration-700"
                style={{
                  transform: `translateX(${scrollY * -0.05}px) translateY(${scrollY * -0.02}px)`
                }}
              ></div>
              <div 
                className="absolute bottom-10 right-10 md:bottom-20 md:right-20 w-32 h-32 md:w-64 md:h-64 bg-accent/5 rounded-full blur-2xl transition-all duration-700"
                style={{
                  transform: `translateX(${scrollY * 0.03}px) translateY(${scrollY * 0.01}px)`
                }}
              ></div>
            </div>
            
            {/* Animated accent line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-professional-accent/60 to-transparent shadow-sm">
              <div className="h-full w-full bg-gradient-to-r from-professional-accent/80 to-transparent animate-pulse"></div>
            </div>
          
            <div className="relative p-4 md:p-8 lg:p-16">
              <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 lg:gap-12 items-center">
                  {/* Enhanced Fighter Info */}
                  <div className="space-y-4 md:space-y-6 lg:space-y-8">
                    <div className="space-y-3 md:space-y-4 animate-fade-in [animation-delay:0.1s]">
                      <div className="flex flex-wrap gap-2 md:gap-3 mb-3 md:mb-4">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge className={`${getStatusColor(fighter.license_status)} border-0 font-medium px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm uppercase tracking-wider hover-scale transition-all duration-300 cursor-help`}>
                              {fighter.license_status === 'active' ? 'Activo' : fighter.license_status}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>Estado de la licencia del peleador</TooltipContent>
                        </Tooltip>
                        
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge variant="outline" className="border-2 border-professional-accent/40 text-foreground px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-medium hover-scale transition-all duration-300 cursor-help">
                              {fighter.weight_class}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>Categoría de peso oficial</TooltipContent>
                        </Tooltip>
                        
                        <Badge variant="secondary" className="animate-pulse">
                          <Star className="h-3 w-3 mr-1" />
                          Pro
                        </Badge>
                      </div>
                    
                      {fighter.nickname && (
                        <div className="animate-fade-in [animation-delay:0.2s]">
                          <p className="text-lg md:text-xl lg:text-2xl font-medium text-muted-foreground uppercase tracking-wider relative">
                            <span className="absolute -left-2 text-professional-accent">"</span>
                            {fighter.nickname}
                            <span className="absolute -right-2 text-professional-accent">"</span>
                          </p>
                        </div>
                      )}
                      
                      <div className="animate-fade-in [animation-delay:0.3s]">
                        <h1 className="text-3xl md:text-4xl lg:text-7xl font-bold text-foreground tracking-tight hover:text-professional-accent transition-colors duration-500 cursor-default">
                          {fighter.first_name}
                        </h1>
                        <h1 className="text-3xl md:text-4xl lg:text-7xl font-bold text-foreground tracking-tight -mt-2 md:-mt-3 lg:-mt-4 hover:text-professional-accent transition-colors duration-500 cursor-default">
                          {fighter.last_name}
                        </h1>
                      </div>
                      
                      <div className="flex items-center gap-2 text-muted-foreground animate-fade-in [animation-delay:0.4s]">
                        <MapPin className="h-4 w-4 md:h-5 md:w-5 animate-pulse" />
                        <span className="text-base md:text-lg font-medium">{fighter.country}</span>
                      </div>
                    </div>

                    {/* Enhanced Record Type Toggle */}
                    <div className="mb-6 animate-fade-in [animation-delay:0.5s]">
                      <Tabs value={recordType} onValueChange={(value) => setRecordType(value as RecordType)}>
                        <TabsList className="bg-card/95 border border-professional-border/40 w-full shadow-xl backdrop-blur-sm">
                          <TabsTrigger 
                            value="AMATEUR" 
                            className="flex-1 data-[state=active]:bg-professional-accent data-[state=active]:text-professional-accent-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-professional-accent/30 bg-transparent text-muted-foreground hover:bg-professional-accent/10 transition-all duration-300 font-medium hover-scale"
                          >
                            <div className="flex items-center gap-2">
                              <Target className="h-4 w-4" />
                              Amateur
                            </div>
                          </TabsTrigger>
                          <TabsTrigger 
                            value="PROFESSIONAL" 
                            className="flex-1 data-[state=active]:bg-professional-accent data-[state=active]:text-professional-accent-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-professional-accent/30 bg-transparent text-muted-foreground hover:bg-professional-accent/10 transition-all duration-300 font-medium hover-scale"
                          >
                            <div className="flex items-center gap-2">
                              <Award className="h-4 w-4" />
                              Profesional
                            </div>
                          </TabsTrigger>
                        </TabsList>
                      </Tabs>
                    </div>

                    {/* Enhanced Fight Stats with Animations */}
                    <div className="grid grid-cols-3 gap-3 md:gap-6 lg:gap-8 animate-fade-in [animation-delay:0.6s]">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="text-center group cursor-help hover-scale transition-all duration-300">
                            <div className="text-2xl md:text-4xl lg:text-6xl font-bold text-green-600 mb-1 md:mb-2 drop-shadow-2xl group-hover:scale-110 transition-transform duration-300" style={{textShadow: '0 4px 12px rgba(0,0,0,0.3)'}}>
                              <AnimatedCounter end={currentRecord.wins} />
                            </div>
                            <div className="text-xs md:text-sm font-medium text-muted-foreground uppercase tracking-wider">
                              Victorias
                            </div>
                            <div className="h-1 bg-green-600/20 rounded-full mt-2">
                              <div 
                                className="h-full bg-green-600 rounded-full transition-all duration-1000 ease-out"
                                style={{ 
                                  width: `${currentRecord.totalFights > 0 ? (currentRecord.wins / currentRecord.totalFights) * 100 : 0}%` 
                                }}
                              ></div>
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="text-center">
                            <p className="font-semibold">{currentRecord.wins} Victorias</p>
                            <p className="text-sm text-muted-foreground">
                              {currentRecord.totalFights > 0 ? Math.round((currentRecord.wins / currentRecord.totalFights) * 100) : 0}% del total
                            </p>
                          </div>
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="text-center group cursor-help hover-scale transition-all duration-300">
                            <div className="text-2xl md:text-4xl lg:text-6xl font-bold text-red-600 mb-1 md:mb-2 drop-shadow-2xl group-hover:scale-110 transition-transform duration-300" style={{textShadow: '0 4px 12px rgba(0,0,0,0.4)'}}>
                              <AnimatedCounter end={currentRecord.losses} />
                            </div>
                            <div className="text-xs md:text-sm font-medium text-muted-foreground uppercase tracking-wider">
                              Derrotas
                            </div>
                            <div className="h-1 bg-red-600/20 rounded-full mt-2">
                              <div 
                                className="h-full bg-red-600 rounded-full transition-all duration-1000 ease-out"
                                style={{ 
                                  width: `${currentRecord.totalFights > 0 ? (currentRecord.losses / currentRecord.totalFights) * 100 : 0}%` 
                                }}
                              ></div>
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="text-center">
                            <p className="font-semibold">{currentRecord.losses} Derrotas</p>
                            <p className="text-sm text-muted-foreground">
                              {currentRecord.totalFights > 0 ? Math.round((currentRecord.losses / currentRecord.totalFights) * 100) : 0}% del total
                            </p>
                          </div>
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="text-center group cursor-help hover-scale transition-all duration-300">
                            <div className="text-2xl md:text-4xl lg:text-6xl font-bold text-muted-foreground mb-1 md:mb-2 drop-shadow-2xl group-hover:scale-110 transition-transform duration-300" style={{textShadow: '0 4px 12px rgba(0,0,0,0.3)'}}>
                              <AnimatedCounter end={currentRecord.draws} />
                            </div>
                            <div className="text-xs md:text-sm font-medium text-muted-foreground uppercase tracking-wider">
                              Empates
                            </div>
                            <div className="h-1 bg-muted-foreground/20 rounded-full mt-2">
                              <div 
                                className="h-full bg-muted-foreground rounded-full transition-all duration-1000 ease-out"
                                style={{ 
                                  width: `${currentRecord.totalFights > 0 ? (currentRecord.draws / currentRecord.totalFights) * 100 : 0}%` 
                                }}
                              ></div>
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="text-center">
                            <p className="font-semibold">{currentRecord.draws} Empates</p>
                            <p className="text-sm text-muted-foreground">
                              {currentRecord.totalFights > 0 ? Math.round((currentRecord.draws / currentRecord.totalFights) * 100) : 0}% del total
                            </p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground animate-fade-in [animation-delay:0.7s]">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-2 bg-muted/30 px-3 py-2 rounded-full hover:bg-muted/50 transition-colors cursor-help">
                            <Trophy className="h-4 w-4 text-fighter-success" />
                            <TrendingUp className="h-3 w-3" />
                            <AnimatedCounter end={winPercentage} suffix="%" />% Victorias
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>Porcentaje de victorias del récord {recordType.toLowerCase()}</TooltipContent>
                      </Tooltip>
                      
                      {currentRecord.source && (
                        <Popover>
                          <PopoverTrigger asChild>
                            <div className="flex items-center gap-1 text-xs px-2 py-1 bg-muted/50 rounded-md hover:bg-muted/70 transition-colors cursor-pointer">
                              <Info className="h-3 w-3" />
                              {getRecordSourceText()}
                            </div>
                          </PopoverTrigger>
                          <PopoverContent className="w-80">
                            <div className="space-y-2">
                              <h4 className="font-medium">Fuente del Récord</h4>
                              <p className="text-sm text-muted-foreground">
                                {currentRecord.source === 'manual' && 'Récord ingresado manualmente por el administrador.'}
                                {currentRecord.source === 'fights' && 'Récord calculado automáticamente desde las peleas registradas.'}
                                {currentRecord.source === 'combined' && 'Récord que combina datos manuales y peleas registradas.'}
                              </p>
                            </div>
                          </PopoverContent>
                        </Popover>
                      )}
                    </div>
                  </div>

                  {/* Enhanced Fighter Image with Interactions */}
                  <div className="flex justify-center lg:justify-end animate-scale-in [animation-delay:0.8s]">
                    <div className="relative group">
                      {fighter.avatar_url ? (
                        <div className="relative">
                          {/* Enhanced shadow base */}
                          <div className="absolute inset-0 bg-gradient-to-t from-professional-accent/20 via-muted/10 to-transparent rounded-3xl blur-xl scale-105 group-hover:scale-110 transition-transform duration-500"></div>
                          
                          {/* Fighter image container with enhanced interactivity */}
                          <div className="relative h-64 md:h-80 lg:h-[500px] w-48 md:w-60 lg:w-80 flex items-end justify-center overflow-hidden rounded-2xl">
                            <img 
                              src={fighter.avatar_url} 
                              alt={`${fighter.first_name} ${fighter.last_name}`}
                              className="h-full w-full object-contain hover-scale transition-all duration-700 group-hover:scale-105"
                              style={{
                                filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.2))',
                                transform: `translateY(${scrollY * -0.02}px)`
                              }}
                            />
                            
                            {/* Hover overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
                            
                            {/* Interactive elements on hover */}
                            <div className="absolute bottom-4 left-4 right-4 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                              <div className="bg-black/80 backdrop-blur-sm rounded-lg p-3 text-white">
                                <p className="text-sm font-medium">
                                  {currentRecord.totalFights} Peleas Totales
                                </p>
                                <div className="flex gap-2 mt-2 text-xs">
                                  <span className="text-green-400">{currentRecord.wins}V</span>
                                  <span className="text-red-400">{currentRecord.losses}D</span>
                                  <span className="text-gray-400">{currentRecord.draws}E</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Enhanced base accent with animation */}
                          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-24 md:w-40 h-1 bg-gradient-to-r from-transparent via-professional-accent/60 to-transparent rounded-full shadow-lg group-hover:via-professional-accent transition-colors duration-300"></div>
                          <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-12 md:w-20 h-0.5 bg-professional-accent/60 rounded-full animate-pulse"></div>
                        </div>
                      ) : (
                        <div className="h-64 md:h-80 lg:h-[500px] w-48 md:w-60 lg:w-80 bg-gradient-to-b from-muted/50 to-card/80 rounded-3xl flex items-center justify-center shadow-2xl border border-professional-border/20 group-hover:shadow-3xl group-hover:border-professional-accent/40 transition-all duration-500">
                          <div className="text-6xl md:text-8xl font-bold text-foreground/80 group-hover:text-professional-accent transition-colors duration-300" style={{textShadow: '0 4px 12px rgba(0,0,0,0.3)'}}>
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

          {/* Enhanced Stats Grid with Staggered Animations */}
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
            {[
              { 
                label: 'Altura', 
                value: fighter.height_cm ? `${fighter.height_cm} cm` : 'N/A',
                icon: BarChart3,
                tooltip: 'Altura oficial del peleador'
              },
              { 
                label: 'Peso', 
                value: fighter.weight_kg ? `${fighter.weight_kg} kg` : 'N/A',
                icon: BarChart3,
                tooltip: 'Peso en competencia'
              },
              { 
                label: 'Alcance', 
                value: fighter.reach_cm ? `${fighter.reach_cm} cm` : 'N/A',
                icon: BarChart3,
                tooltip: 'Alcance de brazos'
              },
              { 
                label: 'Stance', 
                value: fighter.stance || 'N/A',
                icon: Users,
                tooltip: 'Postura de pelea preferida'
              }
            ].map((stat, index) => (
              <Tooltip key={index}>
                <TooltipTrigger asChild>
                  <Card className={`border border-professional-border/30 bg-gradient-professional-light shadow-professional hover:shadow-professional-light transition-all duration-300 hover-scale group cursor-help animate-fade-in`} style={{ animationDelay: `${0.9 + index * 0.1}s` }}>
                    <CardContent className="p-3 md:p-4 lg:p-6 text-center">
                      <div className="p-2 md:p-3 rounded-full bg-professional-accent/20 w-fit mx-auto mb-2 md:mb-4 group-hover:bg-professional-accent/30 group-hover:scale-110 transition-all duration-300">
                        <stat.icon className="h-4 w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 text-professional-primary group-hover:text-professional-accent transition-colors duration-300" />
                      </div>
                      <p className="text-xs md:text-sm font-medium text-muted-foreground uppercase tracking-wide mb-1 md:mb-2 group-hover:text-foreground transition-colors duration-300">{stat.label}</p>
                      <p className="text-lg md:text-xl lg:text-2xl font-bold text-foreground group-hover:text-professional-accent transition-colors duration-300">{stat.value}</p>
                    </CardContent>
                  </Card>
                </TooltipTrigger>
                <TooltipContent>{stat.tooltip}</TooltipContent>
              </Tooltip>
            ))}
          </div>

          {/* Enhanced Fighter Details with Tabs */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8 animate-fade-in" style={{ animationDelay: '1.2s' }}>
            {/* Interactive Bio & Background */}
            <div className="lg:col-span-2">
              <Card className="border border-professional-border/30 bg-gradient-professional-light shadow-professional hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-2xl">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-professional-accent/20 group-hover:bg-professional-accent/30 transition-colors duration-300">
                        <Users className="h-6 w-6 text-professional-primary" />
                      </div>
                      <span className="text-foreground">Perfil del Peleador</span>
                    </div>
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  {/* Enhanced Tabbed Content */}
                  <Tabs defaultValue="bio" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="bio">Biografía</TabsTrigger>
                      <TabsTrigger value="skills">Habilidades</TabsTrigger>
                      <TabsTrigger value="career">Carrera</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="bio" className="space-y-4">
                      {fighter.bio ? (
                        <Collapsible open={expandedBio} onOpenChange={setExpandedBio}>
                          <div className="space-y-3">
                            <div className="text-muted-foreground leading-relaxed">
                              {expandedBio ? fighter.bio : `${fighter.bio.substring(0, 200)}${fighter.bio.length > 200 ? '...' : ''}`}
                            </div>
                            {fighter.bio.length > 200 && (
                              <CollapsibleTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-professional-accent hover:text-professional-accent/80">
                                  {expandedBio ? 'Ver menos' : 'Ver más'}
                                  <ChevronDown className={`h-4 w-4 ml-2 transition-transform duration-200 ${expandedBio ? 'rotate-180' : ''}`} />
                                </Button>
                              </CollapsibleTrigger>
                            )}
                          </div>
                        </Collapsible>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>No hay información biográfica disponible</p>
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="skills" className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-semibold text-sm mb-3 text-foreground flex items-center gap-2">
                            <Target className="h-4 w-4" />
                            Disciplinas
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {fighter.martial_arts && fighter.martial_arts.length > 0 ? (
                              fighter.martial_arts.map((art, index) => (
                                <Badge 
                                  key={art} 
                                  variant="outline" 
                                  className={`border-professional-accent/40 text-foreground hover-scale animate-fade-in`}
                                  style={{ animationDelay: `${index * 0.1}s` }}
                                >
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
                          <h4 className="font-semibold text-sm mb-3 text-foreground flex items-center gap-2">
                            <Award className="h-4 w-4" />
                            Estilo de Pelea
                          </h4>
                          <p className="text-muted-foreground text-sm">{fighter.fighting_style || 'No especificado'}</p>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="career" className="space-y-4">
                      {fighter.gym_name && (
                        <div className="bg-muted/30 rounded-lg p-4">
                          <h4 className="font-semibold text-sm mb-2 text-foreground flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            Gimnasio Actual
                          </h4>
                          <p className="text-muted-foreground text-sm">{fighter.gym_name}</p>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-4 bg-muted/20 rounded-lg">
                          <div className="text-2xl font-bold text-foreground mb-1">
                            <AnimatedCounter end={currentRecord.totalFights} />
                          </div>
                          <div className="text-xs text-muted-foreground uppercase tracking-wide">Peleas</div>
                        </div>
                        <div className="text-center p-4 bg-muted/20 rounded-lg">
                          <div className="text-2xl font-bold text-professional-accent mb-1">
                            <AnimatedCounter end={winPercentage} suffix="%" />
                          </div>
                          <div className="text-xs text-muted-foreground uppercase tracking-wide">Efectividad</div>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>

            {/* Enhanced Quick Stats & Interactive Links */}
            <div className="space-y-6">
              {/* Interactive License Info */}
              <Card className="border border-professional-border/30 bg-gradient-professional-light shadow-professional hover:shadow-xl transition-all duration-300 group">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-professional-accent/20 group-hover:bg-professional-accent/30 transition-colors duration-300">
                      <Shield className="h-5 w-5 text-professional-primary group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    <span className="text-foreground">Licencia</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {fighter.license_number && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="p-3 rounded-lg bg-muted/50 border border-professional-border/30 hover:bg-muted/70 transition-colors cursor-help group/license">
                          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide group-hover/license:text-foreground transition-colors">Número</p>
                          <p className="font-mono font-bold text-foreground mt-1 group-hover/license:text-professional-accent transition-colors">{fighter.license_number}</p>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>Número oficial de licencia deportiva</TooltipContent>
                    </Tooltip>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Estado</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge className={`${getStatusColor(fighter.license_status)} border-0 font-medium hover-scale transition-all duration-300 cursor-help`}>
                          {fighter.license_status === 'active' ? 'Activa' : fighter.license_status}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>Estado actual de la licencia deportiva</TooltipContent>
                    </Tooltip>
                  </div>
                  
                  {fighter.level && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">Nivel</span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge variant="outline" className="border-professional-accent/40 text-foreground hover-scale transition-all duration-300 cursor-help">
                            {fighter.level}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>Nivel de competencia autorizado</TooltipContent>
                      </Tooltip>
                    </div>
                  )}
                  
                  {/* Performance Indicator */}
                  <div className="pt-4 border-t border-professional-border/30">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Rendimiento</span>
                      <span className="text-professional-accent font-medium">{winPercentage}%</span>
                    </div>
                    <Progress 
                      value={winPercentage} 
                      className="h-2"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Enhanced External Links */}
              {(fighter.boxrec_url || fighter.tapology_url) && (
                <Card className="border border-professional-border/30 bg-gradient-professional-light shadow-professional hover:shadow-xl transition-all duration-300 group">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-professional-accent/20 group-hover:bg-professional-accent/30 transition-colors duration-300">
                        <ExternalLink className="h-5 w-5 text-professional-primary group-hover:scale-110 transition-transform duration-300" />
                      </div>
                      <span className="text-foreground">Enlaces Profesionales</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {fighter.boxrec_url && (
                      <Button 
                        variant="outline" 
                        asChild 
                        className="w-full border-professional-accent/40 hover:bg-professional-accent/10 hover:border-professional-accent hover-scale transition-all duration-300 group/button"
                      >
                        <a href={fighter.boxrec_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-2 group-hover/button:rotate-12 transition-transform duration-300" />
                          <span className="flex-1 text-left">Ver en BoxRec</span>
                          <Badge variant="secondary" className="ml-2 text-xs">Oficial</Badge>
                        </a>
                      </Button>
                    )}
                    {fighter.tapology_url && (
                      <Button 
                        variant="outline" 
                        asChild 
                        className="w-full border-professional-accent/40 hover:bg-professional-accent/10 hover:border-professional-accent hover-scale transition-all duration-300 group/button"
                      >
                        <a href={fighter.tapology_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-2 group-hover/button:rotate-12 transition-transform duration-300" />
                          <span className="flex-1 text-left">Ver en Tapology</span>
                          <Badge variant="secondary" className="ml-2 text-xs">Stats</Badge>
                        </a>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Additional Interactive Stats */}
              <Card className="border border-professional-border/30 bg-gradient-professional-light shadow-professional hover:shadow-xl transition-all duration-300">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-professional-accent/20">
                      <BarChart3 className="h-5 w-5 text-professional-primary" />
                    </div>
                    <span className="text-foreground">Estadísticas Clave</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="text-lg font-bold text-professional-accent">
                        <AnimatedCounter end={currentRecord.totalFights} />
                      </div>
                      <div className="text-xs text-muted-foreground">Peleas</div>
                    </div>
                    <div className="text-center p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="text-lg font-bold text-green-600">
                        <AnimatedCounter end={winPercentage} suffix="%" />
                      </div>
                      <div className="text-xs text-muted-foreground">Efectividad</div>
                    </div>
                  </div>
                  
                  <Separator className="bg-gradient-to-r from-transparent via-professional-accent/40 to-transparent" />
                  
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <TrendingUp className="h-4 w-4 text-professional-accent" />
                    <span>Récord {recordType.toLowerCase()}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}