import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Users, Trophy, Filter, Mic, Crown, Zap, Target } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEvents } from '@/hooks/useEvents';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const Events = () => {
  const { events, loading } = useEvents();
  const [eventTypeFilter, setEventTypeFilter] = useState('all');

  const eventTypes = {
    'HHF_x_BDG': { name: 'HHF x BDG', icon: '🥊', color: 'bg-destructive', textColor: 'text-destructive-foreground' },
    'UCC': { name: 'UCC', icon: '🎓', color: 'bg-primary', textColor: 'text-primary-foreground' },
    'KING_OF_THE_BLOCK': { name: 'King of the block', icon: '🎤', color: 'bg-accent', textColor: 'text-accent-foreground' },
    'TORNEOS_CHESS': { name: 'Torneos de Chess', icon: '♟️', color: 'bg-secondary', textColor: 'text-secondary-foreground' }
  };

  const getEventTypeFromName = (name: string) => {
    if (name.includes('HHF x BDG')) return 'HHF_x_BDG';
    if (name.includes('UCC')) return 'UCC';
    if (name.includes('King of the block')) return 'KING_OF_THE_BLOCK';
    if (name.includes('Torneos de Chess')) return 'TORNEOS_CHESS';
    return 'HHF_x_BDG'; // default
  };

  const filteredEvents = events.filter(event => {
    if (eventTypeFilter === 'all') return true;
    return getEventTypeFromName(event.name) === eventTypeFilter;
  });

  const getStateColor = (state: string) => {
    switch (state) {
      case 'draft':
        return 'bg-muted text-muted-foreground';
      case 'live':
        return 'bg-destructive text-destructive-foreground animate-pulse';
      case 'finished':
        return 'bg-muted-foreground text-background';
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  };

  const getStateText = (state: string) => {
    switch (state) {
      case 'draft':
        return 'Borrador';
      case 'live':
        return 'EN VIVO';
      case 'finished':
        return 'Finalizado';
      default:
        return state.toUpperCase();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8 pt-20">
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                Cargando Eventos...
              </h1>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="border-border/50 animate-pulse">
                  <CardHeader className="space-y-3">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="h-3 bg-muted rounded"></div>
                    <div className="h-3 bg-muted rounded w-2/3"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative py-20 pt-32 bg-gradient-to-b from-background via-background/95 to-background">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            Eventos de Combate
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Descubre los próximos eventos, peleas en vivo y resultados de las mejores batallas de MMA.
          </p>
        </div>
      </section>

      {/* Filter Section */}
      <section className="py-8 border-b border-border/50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm font-medium">Filtrar por tipo:</span>
            </div>
            <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los eventos</SelectItem>
                {Object.entries(eventTypes).map(([key, type]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <span>{type.icon}</span>
                      <span>{type.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Events Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          {filteredEvents.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-2xl font-bold mb-2">
                {eventTypeFilter === 'all' ? 'No hay eventos disponibles' : 'No hay eventos de este tipo'}
              </h3>
              <p className="text-muted-foreground">
                {eventTypeFilter === 'all' ? 'Pronto habrá nuevos eventos emocionantes.' : 'Selecciona otro tipo de evento o espera próximos eventos.'}
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredEvents.map((event) => {
                const eventType = getEventTypeFromName(event.name);
                const typeConfig = eventTypes[eventType as keyof typeof eventTypes];
                return (
                <Card key={event.id} className="border-border/50 hover:border-primary/50 transition-colors group">
                  <CardHeader>
                    <div className="flex justify-between items-start mb-2">
                      <Badge className={getStateColor(event.state)}>
                        {getStateText(event.state)}
                      </Badge>
                      <div className="flex items-center gap-2">
                        <Badge className={`${typeConfig.color} ${typeConfig.textColor} text-xs`}>
                          <span className="mr-1">{typeConfig.icon}</span>
                          {typeConfig.name}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {event.discipline.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                    <CardTitle className="text-xl group-hover:text-primary transition-colors flex items-center gap-2">
                      <span className="text-2xl">{typeConfig.icon}</span>
                      {event.name}
                    </CardTitle>
                    {event.description && (
                      <CardDescription className="text-sm">
                        {event.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {event.venue && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        <span>{event.venue}</span>
                      </div>
                    )}
                    
                    {event.start_time && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {format(new Date(event.start_time), 'PPP', { locale: es })}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="w-4 h-4" />
                      <span>
                        {eventType === 'KING_OF_THE_BLOCK' ? 'Ver MCs y batallas' : 
                         eventType === 'TORNEOS_CHESS' ? 'Ver jugadores y partidas' : 
                         'Ver peleadores y peleas'}
                      </span>
                    </div>

                    <div className="pt-4">
                      <Button asChild className="w-full">
                        <Link to={`/evento/${event.id}`}>
                          Ver Evento Completo
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                );
              })}
            </div>
          )}
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default Events;