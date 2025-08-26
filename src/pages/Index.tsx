import Header from "@/components/Header";
import Hero from "@/components/Hero";
import EventosDeportivos from "@/components/sections/EventosDeportivos";
import EventosDigitales from "@/components/sections/EventosDigitales";
import Servicios from "@/components/sections/Servicios";
import Ranking from "@/components/sections/Ranking";
import Comunidad from "@/components/sections/Comunidad";
import Contacto from "@/components/sections/Contacto";
import Footer from "@/components/Footer";
import UrbanDecorations from "@/components/UrbanDecorations";

const Index = () => {
  return (
    <div className="min-h-screen bg-black">
      <UrbanDecorations />
      <Header />
      <Hero />
      <EventosDeportivos />
      <EventosDigitales />
      <Servicios />
      <Ranking />
      <Comunidad />
      <Contacto />
      <Footer />
    </div>
  );
};

export default Index;
