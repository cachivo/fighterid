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
      
      <div className="relative overflow-hidden bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pt-20">
          <PageHeader
            title="Gimnasios"
            subtitle="Explora los mejores gimnasios de artes marciales en tu zona"
            backTo="/"
            backLabel="Volver al inicio"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Building2 className="h-4 w-4" />
              {gyms?.length || 0} Gimnasios Registrados
            </div>
          </PageHeader>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="relative mb-8">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar por nombre o ciudad..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGyms?.map(gym => (
              <GymCard key={gym.id} gym={gym} />
            ))}
          </div>
        )}

        {filteredGyms?.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No se encontraron gimnasios</p>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
