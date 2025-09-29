import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ExternalLink, Calendar, Tag } from "lucide-react";
import { useSportsNews } from "@/hooks/useSportsNews";
import { EnhancedSkeleton } from "@/components/ui/enhanced-skeleton";
import { OptimizedImage } from "@/components/ui/optimized-image";

const SportsNewsCarousel = () => {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const { news, featuredNews, isLoading } = useSportsNews(selectedCategory);
  const [currentIndex, setCurrentIndex] = useState(0);

  const categories = [
    { id: "all", name: "Todas", color: "bg-primary" },
    { id: "mma", name: "MMA", color: "bg-red-600" },
    { id: "boxing", name: "Boxeo", color: "bg-blue-600" },
    { id: "muay_thai", name: "Muay Thai", color: "bg-yellow-600" },
    { id: "kickboxing", name: "Kickboxing", color: "bg-green-600" }
  ];

  const displayNews = featuredNews.length > 0 ? featuredNews : news.slice(0, 6);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % displayNews.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + displayNews.length) % displayNews.length);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) return "Hace menos de 1 hora";
    if (diffHours < 24) return `Hace ${diffHours} horas`;
    return `Hace ${Math.floor(diffHours / 24)} días`;
  };

  const getCategoryColor = (category: string) => {
    const cat = categories.find(c => c.id === category);
    return cat?.color || "bg-gray-600";
  };

  if (isLoading) {
    return (
      <section className="py-16 px-4 bg-gradient-to-b from-urban-gray to-black">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <EnhancedSkeleton variant="stat" className="h-10 w-64 mx-auto mb-4" />
            <EnhancedSkeleton className="h-6 w-96 mx-auto" />
          </div>
          <div className="flex justify-center gap-2 mb-8">
            {[1, 2, 3, 4, 5].map(i => (
              <EnhancedSkeleton key={i} className="h-10 w-20 rounded-full" />
            ))}
          </div>
          <div className="relative">
            <EnhancedSkeleton variant="card" className="h-96 w-full rounded-xl" />
          </div>
        </div>
      </section>
    );
  }

  if (!news || news.length === 0) {
    return null; // Don't render if no news
  }

  return (
    <section className="py-16 px-4 bg-gradient-to-b from-urban-gray to-black">
      <div className="container mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4 neon-text">
            Noticias del Mundo del Combate
          </h2>
          <p className="text-urban-gray-light max-w-2xl mx-auto">
            Mantente al día con las últimas noticias de MMA, boxeo y artes marciales
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category.id)}
              className={`transition-all duration-200 ${
                selectedCategory === category.id
                  ? "bg-primary text-black shadow-neon"
                  : "border-urban-gray-light text-urban-gray-light hover:bg-primary/20"
              }`}
            >
              <Tag className="w-3 h-3 mr-1" />
              {category.name}
            </Button>
          ))}
        </div>

        {/* News Carousel */}
        {displayNews.length > 0 && (
          <div className="relative max-w-5xl mx-auto">
            <Card className="bg-urban-gray/90 backdrop-blur border-purple-neon-primary/20 shadow-2xl overflow-hidden">
              <CardContent className="p-0">
                <div className="relative">
                  {/* Navigation Buttons */}
                  {displayNews.length > 1 && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={prevSlide}
                        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white border border-purple-neon-primary/30 hover:shadow-neon"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={nextSlide}
                        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white border border-purple-neon-primary/30 hover:shadow-neon"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </Button>
                    </>
                  )}

                  {/* Main News Display */}
                  <div className="grid md:grid-cols-2 gap-0">
                    {/* Image Section */}
                    <div className="relative h-80 md:h-96">
                      <OptimizedImage
                        src={displayNews[currentIndex]?.image_url || "/placeholder.svg"}
                        alt={displayNews[currentIndex]?.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                      <Badge 
                        className={`absolute top-4 left-4 ${getCategoryColor(displayNews[currentIndex]?.category)} text-white border-0`}
                      >
                        {displayNews[currentIndex]?.category?.toUpperCase()}
                      </Badge>
                    </div>

                    {/* Content Section */}
                    <div className="p-8 flex flex-col justify-center">
                      <div className="flex items-center gap-2 text-urban-gray-light text-sm mb-3">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(displayNews[currentIndex]?.published_at)}</span>
                        <span className="mx-2">•</span>
                        <span className="font-medium">{displayNews[currentIndex]?.source}</span>
                      </div>
                      
                      <h3 className="text-2xl font-bold text-white mb-4 leading-tight">
                        {displayNews[currentIndex]?.title}
                      </h3>
                      
                      <p className="text-urban-gray-light mb-6 leading-relaxed">
                        {displayNews[currentIndex]?.description}
                      </p>
                      
                      <Button
                        asChild
                        variant="outline"
                        className="self-start border-purple-neon-primary text-purple-neon-primary hover:bg-purple-neon-primary hover:text-black transition-all duration-200"
                      >
                        <a 
                          href={displayNews[currentIndex]?.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2"
                        >
                          Leer más
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Dots Indicator */}
            {displayNews.length > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                {displayNews.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`w-3 h-3 rounded-full transition-all duration-200 ${
                      index === currentIndex
                        ? "bg-purple-neon-primary shadow-neon"
                        : "bg-urban-gray-light hover:bg-purple-neon-primary/50"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default SportsNewsCarousel;