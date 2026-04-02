import { Button } from "@/components/ui/button";
import { useRealTimeStats } from '@/hooks/useRealTimeStats';
import { Dumbbell, Shield, Trophy, MapPin, Users, Calendar } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';
import cageBackground from "@/assets/mma-cage-background.png";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const Hero = () => {
  const { stats } = useRealTimeStats();
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const navigate = useNavigate();

  const hasLiveEvent = stats?.liveEvents && stats.liveEvents.length > 0;

  if (!user) {
    return (
      <section className="relative min-h-[60vh] sm:min-h-[70vh] md:min-h-[80vh] flex items-center justify-center overflow-hidden pt-16">
        {/* Background image */}
        <div className="absolute inset-0">
          <img
            src={cageBackground}
            alt=""
            className="w-full h-full object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-background" />
          {/* Vignette */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.7)_100%)]" />
        </div>

        {/* Content */}
        <div className="relative z-10 text-center px-4 sm:px-6 max-w-4xl mx-auto">
          {/* Red accent line */}
          <div className="w-16 h-1 bg-primary mx-auto mb-6 animate-fade-in" />

          {/* Title with Echo Stack */}
          <div className="relative inline-block animate-fade-in-up">
            {/* Echo layers */}
            <span aria-hidden="true" className="echo-layer echo-4 ufc-label text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-display">FIGHTER ID</span>
            <span aria-hidden="true" className="echo-layer echo-3 ufc-label text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-display">FIGHTER ID</span>
            <span aria-hidden="true" className="echo-layer echo-2 ufc-label text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-display">FIGHTER ID</span>
            <span aria-hidden="true" className="echo-layer echo-1 ufc-label text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-display">FIGHTER ID</span>
            {/* Foreground */}
            <h1 className="relative ufc-label text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-display text-white mb-3">
              FIGHTER <span className="text-primary">ID</span>
            </h1>
          </div>

          {/* Subtitle */}
          <p className="text-sm sm:text-base md:text-lg text-white/80 mb-8 max-w-lg mx-auto animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            Plataforma profesional de gestión de peleadores
          </p>

          {/* Mini Stats Bar */}
          <div className="combat-cut inline-flex items-center gap-4 sm:gap-6 bg-white/5 backdrop-blur-md border border-white/10 px-5 py-3 mb-8 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            <div className="flex items-center gap-2 text-white/90">
              <Users className="h-4 w-4 text-primary" />
              <span className="ufc-label text-sm tracking-wider">{stats?.totalFighters || 0}+ Peleadores</span>
            </div>
            <div className="w-px h-5 bg-white/20" />
            <div className="flex items-center gap-2 text-white/90">
              <Dumbbell className="h-4 w-4 text-primary" />
              <span className="ufc-label text-sm tracking-wider">Gimnasios</span>
            </div>
            <div className="w-px h-5 bg-white/20 hidden sm:block" />
            <div className="hidden sm:flex items-center gap-2 text-white/90">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="ufc-label text-sm tracking-wider">{stats?.totalEvents || 0}+ Eventos</span>
            </div>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center max-w-md mx-auto animate-fade-in-up" style={{ animationDelay: '300ms' }}>
            <Button
              onClick={() => navigate('/auth?mode=signin')}
              variant="hero"
              size="default"
              className="w-full sm:w-auto px-8 py-3 text-sm sm:text-base min-h-[48px] touch-manipulation"
            >
              Iniciar Sesión
            </Button>
            <Button
              onClick={() => navigate('/license/auth?mode=signup')}
              variant="urban"
              size="default"
              className="w-full sm:w-auto px-8 py-3 text-sm sm:text-base min-h-[48px] touch-manipulation"
            >
              Registrarse
            </Button>
          </div>

          {/* Bottom red line */}
          <div className="w-24 h-1 bg-primary mx-auto mt-10 animate-fade-in-up" style={{ animationDelay: '400ms' }} />
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-background to-transparent" />
      </section>
    );
  }

  // Authenticated user
  return (
    <section className="relative min-h-[50vh] sm:min-h-[60vh] md:min-h-[70vh] flex items-center justify-center overflow-hidden pt-16">
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src={cageBackground}
          alt=""
          className="w-full h-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/55 to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.7)_100%)]" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-4 sm:px-6 max-w-4xl mx-auto">
        {/* Live / Next Event indicator */}
        <div className="mb-5 animate-fade-in">
          {hasLiveEvent ? (
            <div className="inline-flex items-center gap-3 combat-cut bg-primary/15 backdrop-blur-md border border-primary/30 px-5 py-2.5">
              <span className="status-live text-xs sm:text-sm font-bold tracking-wider">EN VIVO</span>
              <span className="ufc-label text-xs sm:text-sm text-white tracking-wider">
                {stats.liveEvents[0].name.toUpperCase()}
                {stats.liveEvents[0].venue && ` — ${stats.liveEvents[0].venue.toUpperCase()}`}
              </span>
            </div>
          ) : stats?.nextEvent ? (
            <div className="inline-flex items-center gap-3 combat-cut bg-white/5 backdrop-blur-md border border-white/10 px-5 py-2.5">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="ufc-label text-xs sm:text-sm text-white/90 tracking-wider">
                PRÓXIMO: {stats.nextEvent.name.toUpperCase()} — {format(new Date(stats.nextEvent.start_time), 'dd MMM', { locale: es }).toUpperCase()}
              </span>
              {stats.nextEvent.venue && (
                <>
                  <div className="w-px h-4 bg-white/20" />
                  <span className="flex items-center gap-1 text-white/70 text-xs">
                    <MapPin className="h-3 w-3" />
                    {stats.nextEvent.venue}
                  </span>
                </>
              )}
            </div>
          ) : null}
        </div>

        {/* Stats Bar */}
        <div className="combat-cut inline-flex items-center gap-4 sm:gap-6 bg-white/5 backdrop-blur-md border border-white/10 px-5 py-3 mb-6 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <div className="text-center">
            <p className="ufc-label text-lg sm:text-2xl font-bold text-white">{stats?.totalFighters || 0}</p>
            <p className="ufc-label text-[10px] sm:text-xs text-white/60 tracking-wider">Peleadores</p>
          </div>
          <div className="w-px h-8 bg-white/15" />
          <div className="text-center">
            <p className="ufc-label text-lg sm:text-2xl font-bold text-primary">{stats?.activeFighters || 0}</p>
            <p className="ufc-label text-[10px] sm:text-xs text-white/60 tracking-wider">Activos</p>
          </div>
          <div className="w-px h-8 bg-white/15" />
          <div className="text-center">
            <p className="ufc-label text-lg sm:text-2xl font-bold text-white">{stats?.totalEvents || 0}</p>
            <p className="ufc-label text-[10px] sm:text-xs text-white/60 tracking-wider">Eventos</p>
          </div>
          {(stats?.liveEvents?.length ?? 0) > 0 && (
            <>
              <div className="w-px h-8 bg-white/15" />
              <div className="text-center">
                <p className="ufc-label text-lg sm:text-2xl font-bold text-primary animate-pulse">{stats.liveEvents.length}</p>
                <p className="ufc-label text-[10px] sm:text-xs text-white/60 tracking-wider">En Vivo</p>
              </div>
            </>
          )}
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          <Button
            onClick={() => navigate('/fighters')}
            variant="hero"
            size="default"
            className="gap-2 min-h-[48px] text-sm sm:text-base touch-manipulation px-6 sm:px-8"
          >
            <Trophy className="h-5 w-5" />
            Ver Peleadores
          </Button>
          <Button
            onClick={() => navigate('/gimnasios')}
            variant="urban"
            size="default"
            className="gap-2 min-h-[48px] text-sm sm:text-base touch-manipulation px-6 sm:px-8"
          >
            <Dumbbell className="h-5 w-5" />
            Ver Gimnasios
          </Button>
        </div>

        {/* Admin Button */}
        {isAdmin && (
          <div className="mt-4 animate-fade-in" style={{ animationDelay: '300ms' }}>
            <Button
              onClick={() => navigate('/admin/dashboard')}
              variant="hero"
              size="default"
              className="gap-2 min-h-[44px] text-sm px-6"
            >
              <Shield className="h-4 w-4" />
              Panel de Administración
            </Button>
          </div>
        )}

        {/* Bottom red line */}
        <div className="w-24 h-1 bg-primary mx-auto mt-8" />
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

export default Hero;
