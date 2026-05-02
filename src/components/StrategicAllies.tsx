import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { StrategicAlliesSkeleton } from "@/components/ui/strategic-allies-skeleton";
import { Dumbbell, Trophy } from "lucide-react";

const StrategicAllies = () => {
  const { data: partners, isLoading, error } = useQuery({
    queryKey: ["strategic-partners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("partners")
        .select("*")
        .in("tipo", ["Gimnasio", "Organización"])
        .eq("activo", true)
        .order("orden", { ascending: true });
      
      if (error) throw error;
      return data;
    },
    staleTime: 15 * 60 * 1000, // Cache for 15 minutes
    gcTime: 30 * 60 * 1000, // Keep in memory for 30 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return <StrategicAlliesSkeleton />;
  }
  
  if (error) {
    console.error('Error loading strategic partners:', error);
    return null;
  }

  if (!partners || partners.length === 0) {
    return null;
  }

  return (
    <section className="bg-gradient-to-b from-black to-urban-dark">
      <SectionDivider
        title="Aliados Estratégicos"
        subtitle="Gimnasios y organizaciones que llevan el combate al siguiente nivel"
      />
      <div className="container mx-auto px-4 py-6 sm:py-8 md:py-10">
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8 max-w-4xl mx-auto">
          {partners.map((partner, index) => (
            <Card key={partner.id} className="bg-urban-darker border-purple-neon-primary/20 hover:border-purple-neon-primary/40 transition-all duration-300 group animate-slide-up touch-manipulation" style={{ animationDelay: `${index * 100}ms` }}>
              <div className="p-4 sm:p-6 text-center">
                <div className="mb-4 flex justify-center">
                  <div className="w-full max-w-[140px] h-20 sm:h-24 bg-white/10 rounded-lg flex items-center justify-center p-2 sm:p-3 group-hover:bg-white/20 transition-colors grayscale-logo">
                    {partner.logo ? (
                      <OptimizedImage
                        src={partner.logo}
                        alt={partner.nombre}
                        className="w-full h-full"
                        objectFit="contain"
                        priority={index < 3}
                        fallbackIcon={
                          <div className="text-purple-neon-primary">
                            {partner.tipo === "Gimnasio" ? 
                              <Dumbbell className="h-8 w-8 sm:h-10 sm:w-10" /> : 
                              <Trophy className="h-8 w-8 sm:h-10 sm:w-10" />
                            }
                          </div>
                        }
                      />
                    ) : (
                      <div className="text-purple-neon-primary">
                        {partner.tipo === "Gimnasio" ? 
                          <Dumbbell className="h-8 w-8 sm:h-10 sm:w-10" /> : 
                          <Trophy className="h-8 w-8 sm:h-10 sm:w-10" />
                        }
                      </div>
                    )}
                  </div>
                </div>
                
                <h3 className="text-lg sm:text-xl font-bold text-white mb-2 group-hover:text-purple-neon-primary transition-colors">
                  {partner.nombre}
                </h3>
                
                <div className="text-xs sm:text-sm text-purple-neon-secondary font-medium mb-3 uppercase tracking-wider">
                  {partner.tipo}
                </div>
                
                <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">
                  {partner.descripcion}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StrategicAllies;