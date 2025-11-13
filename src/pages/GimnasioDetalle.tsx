import { useParams } from 'react-router-dom';
import { useGym } from '@/hooks/useGyms';
import { CoachCard } from '@/components/coach/CoachCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Phone, Mail, Globe } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Skeleton } from '@/components/ui/skeleton';

export default function GimnasioDetalle() {
  const { slug } = useParams<{ slug: string }>();
  const { data: gym, isLoading } = useGym(slug || '');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 pt-20">
          <Skeleton className="h-64 w-full mb-6" />
          <Skeleton className="h-32 w-full" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!gym) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 pt-20 text-center">
          <h2 className="text-2xl font-bold mb-4">Gimnasio no encontrado</h2>
          <Button onClick={() => window.history.back()}>Volver</Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div 
        className="h-72 w-full bg-gradient-to-br from-primary/20 to-secondary/20 bg-cover bg-center"
        style={{ backgroundImage: gym.banner_url ? `url(${gym.banner_url})` : undefined }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-16 relative pb-12">
        <div className="bg-card rounded-2xl p-6 shadow-lg border mb-8">
          <div className="flex items-start gap-6">
            <img 
              src={gym.logo_url || '/placeholder.svg'} 
              alt={gym.nombre}
              className="h-24 w-24 rounded-xl object-cover border-4 border-background shadow-md"
            />
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-foreground mb-2">{gym.nombre}</h1>
              {gym.ciudad && (
                <div className="flex items-center gap-2 text-muted-foreground mb-4">
                  <MapPin className="h-4 w-4" />
                  {gym.direccion && `${gym.direccion}, `}
                  {gym.ciudad}{gym.pais ? `, ${gym.pais}` : ''}
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                {gym.telefono && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={`tel:${gym.telefono}`}>
                      <Phone className="h-4 w-4 mr-2" />
                      Llamar
                    </a>
                  </Button>
                )}
                {gym.whatsapp && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={`https://wa.me/${gym.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">
                      <Phone className="h-4 w-4 mr-2" />
                      WhatsApp
                    </a>
                  </Button>
                )}
                {gym.email && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={`mailto:${gym.email}`}>
                      <Mail className="h-4 w-4 mr-2" />
                      Email
                    </a>
                  </Button>
                )}
                {gym.website && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={gym.website} target="_blank" rel="noopener noreferrer">
                      <Globe className="h-4 w-4 mr-2" />
                      Sitio Web
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {gym.descripcion && (
          <div className="bg-card rounded-xl p-6 shadow-sm border mb-8">
            <h2 className="text-xl font-semibold mb-4">Sobre el Gimnasio</h2>
            <p className="text-muted-foreground whitespace-pre-line">{gym.descripcion}</p>
          </div>
        )}

        {gym.disciplinas && gym.disciplinas.length > 0 && (
          <div className="bg-card rounded-xl p-6 shadow-sm border mb-8">
            <h2 className="text-xl font-semibold mb-4">Disciplinas que se Enseñan</h2>
            <div className="flex flex-wrap gap-2">
              {gym.disciplinas.map(d => (
                <Badge key={d} variant="secondary" className="text-sm px-3 py-1">
                  {d}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {gym.coaches && gym.coaches.length > 0 && (
          <div>
            <h2 className="text-2xl font-semibold mb-4">Entrenadores</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {gym.coaches.map(coach => (
                <CoachCard key={coach.id} coach={coach} />
              ))}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
