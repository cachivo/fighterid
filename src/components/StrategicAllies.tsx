import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { useState } from "react";

const ImageWithFallback = ({ src, alt, className }: { src: string; alt: string; className: string }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  return (
    <div className="relative w-20 h-20">
      {isLoading && (
        <div className="absolute inset-0 bg-white/20 rounded animate-pulse flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-purple-neon-primary/30 border-t-purple-neon-primary rounded-full animate-spin" />
        </div>
      )}
      {!hasError ? (
        <img 
          src={src}
          alt={alt}
          className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
          loading="lazy"
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-2xl text-purple-neon-primary bg-white/10 rounded">
          {alt?.includes("Gimnasio") || alt?.includes("Team") ? "🥊" : "🏆"}
        </div>
      )}
    </div>
  );
};

const StrategicAllies = () => {
  const { data: partners, isLoading } = useQuery({
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
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });

  if (isLoading) {
    return (
      <section className="py-16 px-4 bg-black">
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-white">
            Aliados Estratégicos
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[...Array(2)].map((_, i) => (
              <Card key={i} className="bg-urban-darker border-purple-neon-primary/20">
                <div className="p-6 text-center">
                  <div className="mb-4 flex justify-center">
                    <div className="w-24 h-24 bg-white/10 rounded-lg animate-pulse" />
                  </div>
                  <div className="h-6 bg-white/10 rounded mb-2 animate-pulse" />
                  <div className="h-4 bg-white/10 rounded mb-3 w-20 mx-auto animate-pulse" />
                  <div className="space-y-2">
                    <div className="h-3 bg-white/10 rounded animate-pulse" />
                    <div className="h-3 bg-white/10 rounded w-3/4 mx-auto animate-pulse" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!partners || partners.length === 0) {
    return null;
  }

  return (
    <section className="py-16 px-4 bg-gradient-to-b from-black to-urban-dark">
      <div className="container mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-white animate-fade-in">
          Aliados Estratégicos
        </h2>
        <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto animate-fade-in">
          Trabajamos con los mejores gimnasios y organizaciones para llevar el combate al siguiente nivel
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {partners.map((partner, index) => (
            <Card 
              key={partner.id} 
              className="bg-urban-darker border-purple-neon-primary/20 hover:border-purple-neon-primary/40 transition-all duration-300 group animate-fade-in" 
              style={{ animationDelay: `${index * 150}ms` }}
            >
              <div className="p-6 text-center">
                <div className="mb-4 flex justify-center">
                  <div className="w-24 h-24 bg-white/10 rounded-lg flex items-center justify-center group-hover:bg-white/20 transition-colors">
                    {partner.logo ? (
                      <ImageWithFallback
                        src={partner.logo}
                        alt={partner.nombre}
                        className="max-w-20 max-h-20 object-contain filter brightness-0 invert group-hover:brightness-100 group-hover:invert-0 transition-all"
                      />
                    ) : (
                      <div className="text-2xl text-purple-neon-primary">
                        {partner.tipo === "Gimnasio" ? "🥊" : "🏆"}
                      </div>
                    )}
                  </div>
                </div>
                
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-neon-primary transition-colors">
                  {partner.nombre}
                </h3>
                
                <div className="text-sm text-purple-neon-secondary font-medium mb-3 uppercase tracking-wider">
                  {partner.tipo}
                </div>
                
                <p className="text-gray-400 text-sm leading-relaxed">
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