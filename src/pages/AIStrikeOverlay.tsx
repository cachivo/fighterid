import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAIStrikeEvents } from '@/hooks/useAIStrikeEvents';
import { Badge } from '@/components/ui/badge';
import { Zap, TrendingUp } from 'lucide-react';

export default function AIStrikeOverlay() {
  const [searchParams] = useSearchParams();
  const fightId = searchParams.get('fightId') || 'demo-fight';
  const round = searchParams.get('round') ? parseInt(searchParams.get('round')!) : undefined;
  const layout = searchParams.get('layout') || 'side-by-side'; // 'side-by-side' | 'compact' | 'minimal'
  
  const { stats } = useAIStrikeEvents(fightId, round);

  const fighterAStats = stats.find(s => s.fighter === 'A');
  const fighterBStats = stats.find(s => s.fighter === 'B');

  // Layout Side-by-Side (recomendado para OBS)
  if (layout === 'side-by-side') {
    return (
      <div className="min-h-screen bg-transparent p-8 flex items-center justify-center">
        <div className="flex gap-8 max-w-6xl w-full">
          {/* Fighter A */}
          <div className="flex-1 backdrop-blur-md bg-red-500/20 border-2 border-red-500 rounded-2xl p-6 shadow-2xl">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-2">
                <div className="h-4 w-4 bg-red-500 rounded-full animate-pulse" />
                <h2 className="text-3xl font-bold text-white">FIGHTER A</h2>
              </div>
              
              <div className="space-y-2">
                <div className="text-7xl font-black text-white">
                  {fighterAStats?.connected_count || 0}
                </div>
                <p className="text-sm text-red-200 uppercase tracking-wider">Golpes Conectados</p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-red-500/50">
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-white">{fighterAStats?.attempted_count || 0}</p>
                  <p className="text-xs text-red-200 uppercase">Intentos</p>
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-white">{fighterAStats?.accuracy || 0}%</p>
                  <p className="text-xs text-red-200 uppercase flex items-center justify-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    Precisión
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Fighter B */}
          <div className="flex-1 backdrop-blur-md bg-blue-500/20 border-2 border-blue-500 rounded-2xl p-6 shadow-2xl">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-2">
                <div className="h-4 w-4 bg-blue-500 rounded-full animate-pulse" />
                <h2 className="text-3xl font-bold text-white">FIGHTER B</h2>
              </div>
              
              <div className="space-y-2">
                <div className="text-7xl font-black text-white">
                  {fighterBStats?.connected_count || 0}
                </div>
                <p className="text-sm text-blue-200 uppercase tracking-wider">Golpes Conectados</p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-blue-500/50">
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-white">{fighterBStats?.attempted_count || 0}</p>
                  <p className="text-xs text-blue-200 uppercase">Intentos</p>
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-white">{fighterBStats?.accuracy || 0}%</p>
                  <p className="text-xs text-blue-200 uppercase flex items-center justify-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    Precisión
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Layout Compact (esquina de pantalla)
  if (layout === 'compact') {
    return (
      <div className="fixed top-4 right-4 space-y-3">
        {/* Fighter A */}
        <div className="backdrop-blur-md bg-red-500/20 border border-red-500 rounded-xl p-4 shadow-xl min-w-[200px]">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse" />
            <h3 className="font-bold text-white text-sm">FIGHTER A</h3>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-white">{fighterAStats?.connected_count || 0}</span>
            <div className="text-xs text-red-200">
              <p>{fighterAStats?.attempted_count || 0} intentos</p>
              <p>{fighterAStats?.accuracy || 0}% precisión</p>
            </div>
          </div>
        </div>

        {/* Fighter B */}
        <div className="backdrop-blur-md bg-blue-500/20 border border-blue-500 rounded-xl p-4 shadow-xl min-w-[200px]">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse" />
            <h3 className="font-bold text-white text-sm">FIGHTER B</h3>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-white">{fighterBStats?.connected_count || 0}</span>
            <div className="text-xs text-blue-200">
              <p>{fighterBStats?.attempted_count || 0} intentos</p>
              <p>{fighterBStats?.accuracy || 0}% precisión</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Layout Minimal (solo contadores)
  if (layout === 'minimal') {
    return (
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2">
        <div className="backdrop-blur-md bg-black/40 border border-white/20 rounded-full px-6 py-3 shadow-2xl">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 bg-red-500 rounded-full" />
              <span className="text-3xl font-black text-white">{fighterAStats?.connected_count || 0}</span>
            </div>
            <div className="h-8 w-px bg-white/30" />
            <div className="flex items-center gap-3">
              <span className="text-3xl font-black text-white">{fighterBStats?.connected_count || 0}</span>
              <div className="h-3 w-3 bg-blue-500 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}