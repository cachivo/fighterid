import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import VotingPreview from "@/components/VotingPreview";
import Footer from "@/components/Footer";
import UrbanDecorations from "@/components/UrbanDecorations";

const Index = () => {
  return (
    <div className="min-h-screen bg-black">
      <UrbanDecorations />
      <Header />
      <Hero />
      <Features />
      <VotingPreview />
      <Footer />
    </div>
  );
};

export default Index;
