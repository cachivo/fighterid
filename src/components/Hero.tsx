import { Button } from "@/components/ui/button";
import batallaPoster from "@/assets/batalla-poster.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Dark gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900"></div>
      
      {/* Content */}
      <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto">
        <div className="mb-6 animate-slide-up">
          <img 
            src="/lovable-uploads/19e8d3e6-b5ff-48b7-bd8f-c14e12a47b0f.png" 
            alt="Batalla de Gimnasios" 
            className="h-24 md:h-32 w-auto mx-auto filter brightness-0 invert"
          />
        </div>
        
        {/* New call to action focused on participation */}
        <h1 className="text-4xl md:text-6xl font-black mb-4 text-white drop-shadow-2xl animate-slide-up">
          <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            ÚNETE A LA
          </span>
          <br />
          <span className="text-white text-shadow-lg">REVOLUCIÓN URBANA</span>
        </h1>
        
        <p className="text-lg md:text-xl mb-8 font-light max-w-2xl mx-auto animate-fade-in text-gray-400">
          Transmisión en vivo de eventos urbanos con votaciones en tiempo real. 
          La cultura callejera se encuentra con la tecnología.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-slide-up">
          <Button variant="hero" size="lg" className="text-lg px-8 py-4">
            Ver Batalla EN VIVO
          </Button>
          <Button variant="urban" size="lg" className="text-lg px-8 py-4">
            Únete Como Jurado
          </Button>
        </div>
        
        {/* Live indicator with cinematic style */}
        <div className="mt-8 flex items-center justify-center gap-2 text-cyan-400 font-semibold">
          <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse shadow-lg shadow-cyan-400/50"></div>
          <span className="text-lg tracking-wider">PRÓXIMO EVENTO: 25 ENE 2025</span>
        </div>
      </div>
      
      {/* Cinematic bottom fade */}
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-black to-transparent"></div>
      
      {/* Urban architectural elements */}
      <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>
      <div className="absolute top-1/2 left-0 w-2 h-40 bg-gradient-to-b from-transparent via-blue-400/30 to-transparent"></div>
      <div className="absolute top-1/3 right-0 w-2 h-32 bg-gradient-to-b from-transparent via-cyan-400/40 to-transparent"></div>
    </section>
  );
};

export default Hero;