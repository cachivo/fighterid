import { Button } from "@/components/ui/button";
import { useState } from "react";
import batallaPoster from "@/assets/batalla-poster.jpg";

const VotingPreview = () => {
  const [selectedBattler, setSelectedBattler] = useState<number | null>(null);
  
  const battlers = [
    { id: 1, name: "DJ STORM", votes: 342, percentage: 65 },
    { id: 2, name: "MC THUNDER", votes: 184, percentage: 35 },
  ];

  return (
    <section className="relative py-20 px-4">
      {/* Background image section from poster */}
      <div className="absolute inset-0">
        <img 
          src="/lovable-uploads/047f0269-860f-4365-9dc4-8e1343a62359.png"
          alt="Voting Background"
          className="w-full h-full object-cover"
          style={{ objectPosition: '50% 20%' }}
        />
        <div className="absolute inset-0 bg-black/40"></div>
      </div>
      
      <div className="relative z-10 max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white drop-shadow-xl">
            Sistema de Votación
          </h2>
          <p className="text-xl text-gray-300">
            Vota por tu favorito y ve los resultados en tiempo real
          </p>
        </div>
        
        <div className="relative bg-black/60 backdrop-blur-md border border-gray-700/50 rounded-xl p-8 shadow-2xl shadow-magenta-primary/10">
          {/* Card glow effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-magenta-primary/5 via-transparent to-magenta-secondary/5 rounded-xl"></div>
          <div className="mb-8">
            <h3 className="relative text-2xl font-bold text-center mb-2 text-white drop-shadow-lg">
              BATALLA ACTUAL: FREESTYLE FINAL
            </h3>
            <div className="flex items-center justify-center gap-2 text-magenta-primary font-semibold">
              <div className="w-3 h-3 bg-magenta-primary rounded-full animate-pulse shadow-lg shadow-magenta-primary/50"></div>
              <span className="tracking-wider">EN VIVO</span>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {battlers.map((battler) => (
              <div 
                key={battler.id}
                className={`relative border-2 rounded-lg p-6 transition-all duration-300 cursor-pointer ${
                  selectedBattler === battler.id 
                    ? 'border-magenta-primary bg-magenta-primary/10 shadow-lg shadow-magenta-primary/20' 
                    : 'border-gray-600 hover:border-magenta-primary/50 bg-gray-900/50'
                }`}
                onClick={() => setSelectedBattler(battler.id)}
              >
                <div className="text-center">
                  <h4 className="text-2xl font-bold mb-4 text-white drop-shadow-md">
                    {battler.name}
                  </h4>
                  
                  <div className="mb-4">
                    <div className="w-full bg-gray-700 rounded-full h-4 mb-2 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-magenta-primary to-magenta-secondary h-4 rounded-full transition-all duration-500 shadow-lg shadow-magenta-primary/30"
                        style={{ width: `${battler.percentage}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-sm text-gray-400">
                      <span>{battler.votes} votos</span>
                      <span className="text-magenta-primary font-semibold">{battler.percentage}%</span>
                    </div>
                  </div>
                  
                  <Button 
                    variant={selectedBattler === battler.id ? "hero" : "vote"}
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedBattler(battler.id);
                    }}
                  >
                    {selectedBattler === battler.id ? "VOTADO ✓" : "VOTAR"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-8 text-center">
            <p className="relative text-gray-400 mb-4">
              Total de votos: <span className="font-bold text-magenta-primary">526</span>
            </p>
            <p className="relative text-sm text-gray-500">
              <span className="text-magenta-primary">⚡</span> Los votos se actualizan en tiempo real
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default VotingPreview;