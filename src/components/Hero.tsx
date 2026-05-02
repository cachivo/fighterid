import { Button } from "@/components/ui/button";
import { useRealTimeStats } from '@/hooks/useRealTimeStats';
import { Trophy, Dumbbell, Users, Calendar, MapPin, Shield, ChevronRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';
import { useDeviceCapability } from '@/lib/deviceCapability';
import heroMobile from "@/assets/hero-cage-mobile.webp";
import heroDesktop from "@/assets/hero-cage-desktop.webp";
import { format } from "date-fns";
import { es } from "date-fns/locale";

/**
 * Hero — landing page above-the-fold.
 *
 * Performance:
 * - Single <picture> with WebP (mobile 22 KB / desktop 50 KB), preloaded in
 *   index.html with fetchpriority=high.
 * - No `bg-fixed`, no blur layers — friendly to budget Android GPUs.
 * - On low-end devices we drop entry animations entirely.
 *
 * Engagement (logged-out):
 * - One dominant CTA ("Crea tu Fighter ID") + secondary text-links.
 * - Live/next-event pill at the top as instant proof of life.
 * - Trust strip with real-time counters.
 */
const Hero = () => {
  const { stats } = useRealTimeStats();
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const navigate = useNavigate();
  const { isLowEnd } = useDeviceCapability();

  const hasLiveEvent = !!stats?.liveEvents && stats.liveEvents.length > 0;
  const fadeIn = isLowEnd ? '' : 'animate-fade-in';
  const fadeUp = isLowEnd ? '' : 'animate-fade-in-up';

  const Background = (
    <div className="absolute inset-0">
      <picture>
        <source media="(max-width: 768px)" srcSet={heroMobile} type="image/webp" />
        <img
          src={heroDesktop}
          alt=""
          className="w-full h-full object-cover"
          loading="eager"
          fetchPriority="high"
          decoding="async"
        />
      </picture>
      <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/65 to-background" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(0,0,0,0.7)_100%)]" />
    </div>
  );

  const EventPill = hasLiveEvent ? (
    <div className="inline-flex items-center gap-3 combat-cut bg-primary/15 backdrop-blur-sm border border-primary/30 px-4 py-2">
      <span className="status-live text-[11px] sm:text-xs font-bold tracking-wider">EN VIVO</span>
      <span className="ufc-label text-[11px] sm:text-xs text-white tracking-wider truncate max-w-[60vw]">
        {stats!.liveEvents![0].name.toUpperCase()}
      </span>
    </div>
  ) : stats?.nextEvent ? (
    <div className="inline-flex items-center gap-2 combat-cut bg-white/5 backdrop-blur-sm border border-white/10 px-4 py-2">
      <Calendar className="h-3.5 w-3.5 text-primary" />
      <span className="ufc-label text-[11px] sm:text-xs text-white/90 tracking-wider truncate max-w-[60vw]">
        PRÓXIMO: {stats.nextEvent.name.toUpperCase()} · {format(new Date(stats.nextEvent.start_time), 'dd MMM', { locale: es }).toUpperCase()}
      </span>
      {stats.nextEvent.venue && (
        <span className="hidden sm:inline-flex items-center gap-1 text-white/60 text-[11px] border-l border-white/15 pl-2 ml-1">
          <MapPin className="h-3 w-3" /> {stats.nextEvent.venue}
        </span>
      )}
    </div>
  ) : null;

  // ─── Logged-out: conversion-focused hero ──────────────────────────────
  if (!user) {
    return (
      <section className="relative min-h-[88vh] sm:min-h-[80vh] flex items-center justify-center overflow-hidden pt-16">
        {Background}

        <div className="relative z-10 text-center px-4 sm:px-6 max-w-3xl mx-auto py-10">
          {EventPill && (
            <div className={`mb-6 ${fadeIn}`}>{EventPill}</div>
          )}

          <div className="w-12 h-1 bg-primary mx-auto mb-5" />

          <h1 className={`ufc-label text-5xl sm:text-7xl md:text-8xl font-extrabold tracking-display text-white mb-3 ${fadeUp}`}>
            FIGHTER <span className="text-primary">ID</span>
          </h1>

          <p className={`text-sm sm:text-base text-white/80 mb-8 max-w-md mx-auto leading-relaxed ${fadeUp}`}>
            Tu carrera de combate, certificada. La plataforma oficial de licencias, rankings y eventos.
          </p>

          {/* Primary CTA */}
          <div className={`flex flex-col items-center gap-3 ${fadeUp}`}>
            <Button
              onClick={() => navigate('/license/auth?mode=signup&type=fighter')}
              variant="hero"
              size="lg"
              className="w-full sm:w-auto px-8 py-4 text-base font-bold min-h-[52px] touch-manipulation gap-2"
            >
              <Shield className="h-5 w-5" />
              Crea tu Fighter ID
              <ChevronRight className="h-5 w-5" />
            </Button>

            <div className="flex items-center gap-3 text-xs sm:text-sm text-white/70">
              <button
                onClick={() => navigate('/auth?mode=signin')}
                className="underline-offset-4 hover:text-white hover:underline transition-colors min-h-[44px] px-2"
              >
                Iniciar sesión
              </button>
              <span className="text-white/30">·</span>
              <button
                onClick={() => navigate('/fighters')}
                className="underline-offset-4 hover:text-white hover:underline transition-colors min-h-[44px] px-2"
              >
                Explorar
              </button>
            </div>
          </div>

          {/* Trust strip */}
          <div className={`mt-10 ${fadeUp}`}>
            <p className="ufc-label text-[10px] tracking-[0.3em] text-white/50 mb-3">
              — RESPALDADOS POR —
            </p>
            <div className="flex gap-2.5 sm:gap-3 overflow-x-auto no-scrollbar justify-start sm:justify-center">
              <TrustStat icon={Users} value={`${stats?.totalFighters ?? 0}+`} label="Peleadores" />
              <TrustStat icon={Dumbbell} value={`${stats?.activeFighters ?? 0}`} label="Activos" />
              <TrustStat icon={Calendar} value={`${stats?.totalEvents ?? 0}+`} label="Eventos" />
              {hasLiveEvent && (
                <TrustStat
                  icon={Trophy}
                  value={String(stats!.liveEvents!.length)}
                  label="En vivo"
                  pulse={!isLowEnd}
                />
              )}
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-background to-transparent" />
      </section>
    );
  }

  // ─── Logged-in: lighter hero, retains existing CTAs ──────────────────
  return (
    <section className="relative min-h-[55vh] sm:min-h-[60vh] flex items-center justify-center overflow-hidden pt-16">
      {Background}

      <div className="relative z-10 text-center px-4 sm:px-6 max-w-4xl mx-auto">
        {EventPill && <div className={`mb-5 ${fadeIn}`}>{EventPill}</div>}

        <div className="combat-cut inline-flex items-center gap-4 sm:gap-6 bg-white/5 backdrop-blur-sm border border-white/10 px-5 py-3 mb-6">
          <Stat value={stats?.totalFighters ?? 0} label="Peleadores" />
          <div className="w-px h-8 bg-white/15" />
          <Stat value={stats?.activeFighters ?? 0} label="Activos" accent />
          <div className="w-px h-8 bg-white/15" />
          <Stat value={stats?.totalEvents ?? 0} label="Eventos" />
          {hasLiveEvent && (
            <>
              <div className="w-px h-8 bg-white/15" />
              <Stat value={stats!.liveEvents!.length} label="En Vivo" accent pulse={!isLowEnd} />
            </>
          )}
        </div>

        <div className={`flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center ${fadeUp}`}>
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

        {isAdmin && (
          <div className="mt-4">
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

        <div className="w-24 h-1 bg-primary mx-auto mt-8" />
      </div>

      <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

// ─── Helpers ─────────────────────────────────────────────────────────────
function Stat({ value, label, accent, pulse }: { value: number | string; label: string; accent?: boolean; pulse?: boolean }) {
  return (
    <div className="text-center">
      <p className={`ufc-label text-lg sm:text-2xl font-bold ${accent ? 'text-primary' : 'text-white'} ${pulse ? 'animate-pulse' : ''}`}>
        {value}
      </p>
      <p className="ufc-label text-[10px] sm:text-xs text-white/60 tracking-wider">{label}</p>
    </div>
  );
}

function TrustStat({
  icon: Icon,
  value,
  label,
  pulse,
}: {
  icon: typeof Users;
  value: string;
  label: string;
  pulse?: boolean;
}) {
  return (
    <div className="flex-shrink-0 flex items-center gap-2 bg-white/5 border border-white/10 combat-cut px-3 py-2">
      <Icon className={`h-4 w-4 text-primary ${pulse ? 'animate-pulse' : ''}`} />
      <div className="text-left">
        <p className="ufc-label text-sm font-bold text-white leading-none">{value}</p>
        <p className="ufc-label text-[9px] text-white/60 tracking-wider mt-0.5">{label}</p>
      </div>
    </div>
  );
}

export default Hero;
