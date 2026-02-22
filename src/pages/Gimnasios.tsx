import { useState } from 'react';
import { useGyms } from '@/hooks/useGyms';
import { GymCard } from '@/components/gym/GymCard';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { Search, Building2 } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Skeleton } from '@/components/ui/skeleton';

export default function Gimnasios() {
  const { data: gyms, isLoading } = useGyms();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredGyms = gyms?.filter(gym => 
    gym.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    gym.ciudad?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="pt-16 px-4 py-4 border-b border-border">
        <PageHeader
          title="Gimnasios"
          subtitle="Explora los mejores gimnasios de artes marciales"
          backTo="/"
          backLabel="Volver"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
            <Building2 className="h-3.5 w-3.5" />
            {gyms?.length || 0} Registrados
          </div>
        </PageHeader>
      </div>

      <div className="px-4 py-4">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar por nombre o ciudad..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredGyms?.map(gym => (
              <GymCard key={gym.id} gym={gym} />
            ))}
          </div>
        )}

        {filteredGyms?.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">No se encontraron gimnasios</p>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
