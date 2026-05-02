import { useEffect, lazy, Suspense, memo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import { QuickStats } from "@/components/QuickStats";
import Ranking from "@/components/sections/Ranking";
import UrbanDecorations from "@/components/UrbanDecorations";
import { LazyMount } from "@/components/LazyMount";
import { SectionDivider } from "@/components/landing/SectionDivider";

// Lazy-load non-critical below-fold components
const StrategicAllies = lazy(() => import("@/components/StrategicAllies"));
const GymShowcase = lazy(() => import("@/components/sections/GymShowcase"));
const Footer = lazy(() => import("@/components/Footer"));
const PWAInstallPrompt = lazy(() => import("@/components/PWAInstallPrompt"));
const FighterIDCallToAction = lazy(() =>
  import("@/components/FighterIDCallToAction").then((m) => ({ default: m.FighterIDCallToAction })),
);
const HowItWorks = lazy(() => import("@/components/landing/HowItWorks"));

const MemoHeader = memo(Header);
const MemoHero = memo(Hero);

/**
 * Inline section divider for the Boxeo block. Lives next to its lazy
 * children so the entire block is gated by a single LazyMount and only
 * pays its cost (queries, realtime subs, DOM) once the user scrolls.
 */
function BoxeoBlock() {
  return (
    <>
      <section className="relative py-8 px-4 bg-gradient-to-b from-transparent via-primary/5 to-transparent border-y border-primary/20">
        <div className="container mx-auto max-w-6xl text-center">
          <div className="flex items-center justify-center gap-4">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-primary/40" />
            <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-foreground uppercase">
              Boxeo
            </h2>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-primary/40" />
          </div>
          <p className="text-sm md:text-base text-muted-foreground mt-2 uppercase tracking-widest">
            Liga Nacional Olímpica · Minor League
          </p>
        </div>
      </section>
      <Ranking organizationCode="FEDEHBOX" compact />
      <Ranking organizationCode="HHF_AMATEUR" compact />
    </>
  );
}

const Index = () => {
  const queryClient = useQueryClient();
  const { user, loading } = useAuth();

  useEffect(() => {
    queryClient.prefetchQuery({
      queryKey: ["strategic-partners"],
      queryFn: async () => {
        const { data, error } = await supabase
          .from("partners")
          .select("*")
          .in("tipo", ["Gimnasio", "Organización"])
          .eq("activo", true)
          .order("orden", { ascending: true });
        if (error) throw error;
        return data;
      },
      staleTime: 15 * 60 * 1000,
    });
  }, [queryClient]);

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["realtime-stats"] });
    queryClient.refetchQueries({ queryKey: ["realtime-stats"] });
  }, [queryClient]);

  useEffect(() => {
    if (window.location.hash) {
      const id = window.location.hash.replace("#", "");
      requestAnimationFrame(() => {
        setTimeout(() => {
          const element = document.getElementById(id);
          if (element) element.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
      });
    }
  }, [user, loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black urban-home overflow-x-hidden">
      <UrbanDecorations />
      <MemoHeader />
      <MemoHero />

      <Suspense fallback={null}>
        {user && <FighterIDCallToAction />}
      </Suspense>

      {!user && (
        <>
          <QuickStats />
          <Suspense fallback={null}>
            <HowItWorks />
          </Suspense>
        </>
      )}

      {/* MMA — eager (above the fold of the rankings area) */}
      <Ranking organizationCode="UCC_MMA" compact />

      {/* Boxeo block — lazy mount only when the user scrolls near it.
          Saves 2 data fetches + 4 realtime subscriptions on landing for
          users who never scroll past MMA (most mobile sessions). */}
      <LazyMount placeholderMinHeight={600}>
        <BoxeoBlock />
      </LazyMount>

      <Suspense fallback={null}>
        <LazyMount placeholderMinHeight={400}>
          <GymShowcase />
        </LazyMount>
        <LazyMount placeholderMinHeight={300}>
          <StrategicAllies />
        </LazyMount>
        <Footer />
        <PWAInstallPrompt />
      </Suspense>
    </div>
  );
};

export default Index;
