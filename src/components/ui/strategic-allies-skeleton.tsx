import { Card } from "@/components/ui/card";

export const StrategicAlliesSkeleton = () => {
  return (
    <section className="py-16 px-4 bg-gradient-to-b from-black to-urban-gray">
      <div className="container mx-auto">
        <div className="h-10 bg-muted/20 rounded-lg mb-4 max-w-md mx-auto animate-pulse" />
        <div className="h-6 bg-muted/10 rounded-md mb-12 max-w-2xl mx-auto animate-pulse" />
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="bg-urban-gray/50 border-purple-neon-primary/10">
              <div className="p-6 text-center space-y-4">
                <div className="mx-auto w-24 h-24 bg-muted/20 rounded-lg animate-pulse" />
                <div className="h-6 bg-muted/20 rounded-md animate-pulse" />
                <div className="h-4 bg-muted/10 rounded-sm w-20 mx-auto animate-pulse" />
                <div className="space-y-2">
                  <div className="h-3 bg-muted/10 rounded-sm animate-pulse" />
                  <div className="h-3 bg-muted/10 rounded-sm w-3/4 mx-auto animate-pulse" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};