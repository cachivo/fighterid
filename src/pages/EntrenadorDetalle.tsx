import { useParams, useNavigate } from 'react-router-dom';
import { useCoach } from '@/hooks/useCoaches';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Phone, Mail, Award, Building2 } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Skeleton } from '@/components/ui/skeleton';

export default function EntrenadorDetalle() {
  const { slug } = useParams<{ slug: string }>();
  const { data: coach, isLoading } = useCoach(slug || '');
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 pt-20">
          <Skeleton className="h-64 w-full" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!coach) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 pt-20 text-center">
          <h2 className="text-2xl font-bold mb-4">Entrenador no encontrado</h2>
          <Button onClick={() => window.history.back()}>Volver</Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 pt-20">
        <div className="bg-card rounded-2xl p-6 shadow-lg border mb-8">
          <div className="flex flex-col md:flex-row gap-6">
            <img 
              src={coach.avatar_url || '/placeholder.svg'} 
              alt={coach.nombre}
              className="h-32 w-32 rounded-full object-cover border-4 border-background shadow-md mx-auto md:mx-0"
            />
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-foreground mb-2 text-center md:text-left">
                {coach.nombre} {coach.apellidos}
              </h1>
              {coach.ciudad && (
                <div className="flex items-center gap-2 text-muted-foreground mb-4 justify-center md:justify-start">
                  <MapPin className="h-4 w-4" />
                  {coach.ciudad}{coach.pais ? `, ${coach.pais}` : ''}
                </div>
              )}

              <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                {coach.telefono && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={`tel:${coach.telefono}`}>
                      <Phone className="h-4 w-4 mr-2" />
                      Llamar
                    </a>
                  </Button>
                )}
                {coach.whatsapp && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={`https://wa.me/${coach.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">
                      <Phone className="h-4 w-4 mr-2" />
                      WhatsApp
                    </a>
                  </Button>
                )}
                {coach.email && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={`mailto:${coach.email}`}>
                      <Mail className="h-4 w-4 mr-2" />
                      Email
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {coach.bio && (
          <div className="bg-card rounded-xl p-6 shadow-sm border mb-8">
            <h2 className="text-xl font-semibold mb-4">Biografía</h2>
            <p className="text-muted-foreground whitespace-pre-line">{coach.bio}</p>
          </div>
        )}

        {coach.especialidades && coach.especialidades.length > 0 && (
          <div className="bg-card rounded-xl p-6 shadow-sm border mb-8">
            <h2 className="text-xl font-semibold mb-4">
              <Award className="inline h-5 w-5 mr-2" />
              Especialidades
            </h2>
            <div className="flex flex-wrap gap-2">
              {coach.especialidades.map(e => (
                <Badge key={e} variant="secondary" className="text-sm px-3 py-1">
                  {e}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {coach.gym && (
          <div className="bg-card rounded-xl p-6 shadow-sm border">
            <h2 className="text-xl font-semibold mb-4">
              <Building2 className="inline h-5 w-5 mr-2" />
              Gimnasio
            </h2>
            <div 
              className="flex items-center gap-4 p-4 bg-muted rounded-lg cursor-pointer hover:bg-muted/70 transition-colors"
              onClick={() => navigate(`/gimnasios/${(coach.gym as any).slug}`)}
            >
              <img 
                src={(coach.gym as any).logo_url || '/placeholder.svg'} 
                alt={(coach.gym as any).nombre}
                className="h-12 w-12 rounded-lg object-cover"
              />
              <div>
                <p className="font-semibold text-foreground">{(coach.gym as any).nombre}</p>
                <p className="text-sm text-muted-foreground">
                  {(coach.gym as any).ciudad}{(coach.gym as any).pais ? `, ${(coach.gym as any).pais}` : ''}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
