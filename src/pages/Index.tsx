import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Ranking from "@/components/sections/Ranking";
import Footer from "@/components/Footer";
import UrbanDecorations from "@/components/UrbanDecorations";

const Index = () => {
  return (
    <div className="min-h-screen bg-black">
      <UrbanDecorations />
      <Header />
      <Hero />
      <Ranking />
      <Footer />
    </div>
  );
};

export default Index;
