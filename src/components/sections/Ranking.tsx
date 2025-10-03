import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Users, Target, Award, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useFighterRanking } from "@/hooks/useFighterRanking";
import { EnhancedSkeleton } from "@/components/ui/enhanced-skeleton";
import { useNavigate } from "react-router-dom";

const Ranking = () => {
  const { fighters, stats, isLoading } = useFighterRanking(3);
  const navigate = useNavigate();

  const estadisticas = [
    {
      numero: stats?.total_fighters.toString() || "0",
      descripcion: "Peleadores Registrados",
      Icon: Users
    },
    {
      numero: stats?.total_fights.toString() || "0",
      descripcion: "Peleas Realizadas",
      Icon: Target
    },
    {
      numero: stats?.professional_fighters.toString() || "0",
      descripcion: "Profesionales Activos",
      Icon: Award
    },
    {
      numero: stats?.undefeated_count.toString() || "0",
      descripcion: "Invictos",
      Icon: TrendingUp
    }
  ];

  return (
    <section id="ranking" className="py-12 sm:py-16 md:py-20 relative overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center bg-fixed opacity-80"
        style={{ backgroundImage: 'url(/lovable-uploads/17f6dde8-5a0e-4986-a833-30fc435b156c.png)' }}
      />
      <div className="absolute inset-0 bg-black/20" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-12 sm:mb-16 animate-slide-up">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6">
            NUESTROS <span className="text-purple-neon-primary">RESULTADOS</span>
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Cifras que demuestran nuestro compromiso con la excelencia en cada evento
          </p>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-12 sm:mb-16">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <Card key={index} className="bg-black/60 border-purple-neon-primary/30 backdrop-blur-sm">
                <CardContent className="p-4 sm:p-6">
                  <EnhancedSkeleton className="h-10 w-10 mx-auto mb-2 rounded-full" />
                  <EnhancedSkeleton className="h-8 w-16 mx-auto mb-2" />
                  <EnhancedSkeleton className="h-4 w-24 mx-auto" />
                </CardContent>
              </Card>
            ))
          ) : (
            estadisticas.map((stat, index) => (
              <Card key={index} className="bg-black/60 border-purple-neon-primary/30 backdrop-blur-sm text-center group hover:scale-105 transition-all duration-300 touch-manipulation">
                <CardContent className="p-4 sm:p-6">
                  <stat.Icon className="h-8 w-8 sm:h-10 sm:w-10 mx-auto mb-2 text-purple-neon-primary" />
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold text-purple-neon-primary mb-2 group-hover:animate-pulse-purple-neon">
                    {stat.numero}
                  </div>
                  <p className="text-gray-300 text-xs sm:text-sm md:text-base">
                    {stat.descripcion}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Top Peleadores */}
        <div className="mb-8 sm:mb-12">
          <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-center text-white mb-6 sm:mb-8">
            Top 10 <span className="text-purple-neon-primary">Peleadores</span>
          </h3>
          
          {isLoading ? (
            <div className="space-y-3 sm:space-y-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <Card key={index} className="bg-black/40 border-purple-neon-primary/20 backdrop-blur-sm">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center gap-4">
                      <EnhancedSkeleton className="h-12 w-12 rounded-full" />
                      <div className="flex-1">
                        <EnhancedSkeleton className="h-5 w-32 mb-2" />
                        <EnhancedSkeleton className="h-4 w-24" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : fighters && fighters.length > 0 ? (
            <div className="space-y-3 sm:space-y-4">
              {fighters.map((fighter, index) => {
                const rankColors = ['text-yellow-400', 'text-gray-300', 'text-orange-400'];
                const rankColor = index < 3 ? rankColors[index] : 'text-purple-neon-primary';
                
                return (
                  <Card 
                    key={fighter.id} 
                    className="bg-black/40 border-purple-neon-primary/20 backdrop-blur-sm hover:bg-black/60 transition-all duration-300 cursor-pointer touch-manipulation group"
                    onClick={() => navigate(`/fighter/${fighter.id}`)}
                  >
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex items-center gap-4">
                        {/* Ranking Position */}
                        <div className={`text-2xl sm:text-3xl font-bold ${rankColor} min-w-[40px] text-center`}>
                          {index < 3 ? <Trophy className="h-6 w-6 sm:h-8 sm:w-8 mx-auto" /> : `#${index + 1}`}
                        </div>

                        {/* Avatar */}
                        <Avatar className="h-12 w-12 sm:h-14 sm:w-14 border-2 border-purple-neon-primary/50">
                          <AvatarImage src={fighter.avatar_url || undefined} />
                          <AvatarFallback className="bg-purple-neon-primary/20 text-white">
                            {fighter.first_name[0]}{fighter.last_name[0]}
                          </AvatarFallback>
                        </Avatar>

                        {/* Fighter Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h4 className="text-base sm:text-lg font-bold text-white group-hover:text-purple-neon-primary transition-colors">
                              {fighter.first_name} {fighter.last_name}
                            </h4>
                            {fighter.nickname && (
                              <span className="text-sm text-gray-400 italic">"{fighter.nickname}"</span>
                            )}
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                            <span className="text-gray-300">
                              {fighter.record_wins}-{fighter.record_losses}-{fighter.record_draws}
                            </span>
                            {fighter.discipline && (
                              <Badge variant="outline" className="text-xs border-purple-neon-primary/50 text-purple-neon-primary">
                                {fighter.discipline}
                              </Badge>
                            )}
                            {fighter.level && (
                              <Badge variant="secondary" className="text-xs bg-purple-neon-primary/20 text-purple-neon-primary">
                                {fighter.level}
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Win Rate */}
                        <div className="text-right min-w-[80px]">
                          <div className="text-lg sm:text-xl font-bold text-purple-neon-primary">
                            {fighter.win_rate.toFixed(1)}%
                          </div>
                          <div className="text-xs text-gray-400">
                            Win Rate
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="bg-black/40 border-purple-neon-primary/20 backdrop-blur-sm">
              <CardContent className="p-8 text-center">
                <p className="text-gray-400">No hay suficientes peleadores con el mínimo de peleas requeridas</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="text-center">
          <Button 
            size="lg" 
            onClick={() => navigate('/fighters')}
            className="bg-purple-neon-primary hover:bg-purple-neon-secondary text-black font-bold px-6 sm:px-8 py-4 text-base sm:text-lg animate-glow-neon min-h-[48px] touch-manipulation"
          >
            Ver Todos los Peleadores
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Ranking;