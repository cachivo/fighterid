import { useState, useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate, useLocation } from 'react-router-dom';
import { useFighterProfiles } from '@/hooks/useFighterProfiles';
import { useHasFighterLicense } from '@/hooks/useHasFighterLicense';

const NOTIFICATION_DISMISS_KEY = 'profile_incomplete_dismissed';
const DISMISS_DURATION = 24 * 60 * 60 * 1000; // 24 horas

export function ProfileIncompleteNotification() {
  const navigate = useNavigate();
  const location = useLocation();
  const { getUserFighterProfile } = useFighterProfiles();
  const { hasLicense, loading: licenseLoading } = useHasFighterLicense();
  const [visible, setVisible] = useState(false);
  const [missingCount, setMissingCount] = useState(0);

  useEffect(() => {
    const checkProfileCompleteness = async () => {
      // No mostrar si aún está cargando el estado de licencia
      if (licenseLoading) return;

      // No mostrar si no tiene licencia
      if (!hasLicense) return;

      // No mostrar si está en la página de dashboard en modo edición
      if (location.pathname === '/license/dashboard') return;

      // Verificar si fue cerrado recientemente
      const dismissed = localStorage.getItem(NOTIFICATION_DISMISS_KEY);
      if (dismissed) {
        const dismissedTime = parseInt(dismissed);
        const now = Date.now();
        if (now - dismissedTime < DISMISS_DURATION) {
          return;
        }
      }

      // Obtener perfil del usuario
      try {
        const profile = await getUserFighterProfile();
        if (!profile) return;

        // Verificar campos críticos faltantes
        const missingFields = [];
        if (!profile.birthdate) missingFields.push('birthdate');
        if (!profile.gender) missingFields.push('gender');
        if (!(profile as any).phone) missingFields.push('phone');
        
        if (missingFields.length > 0) {
          setMissingCount(missingFields.length);
          setVisible(true);
        }
      } catch (error) {
        console.error('Error checking profile completeness:', error);
      }
    };

    checkProfileCompleteness();
  }, [getUserFighterProfile, hasLicense, licenseLoading, location.pathname]);

  const handleDismiss = () => {
    localStorage.setItem(NOTIFICATION_DISMISS_KEY, Date.now().toString());
    setVisible(false);
  };

  const handleComplete = () => {
    navigate('/license/dashboard');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed top-20 right-4 z-50 animate-in slide-in-from-top-4 duration-500">
      <div className="bg-gradient-to-br from-purple-900/90 via-slate-900/90 to-slate-800/90 backdrop-blur-md border border-purple-500/30 rounded-lg shadow-2xl ring-1 ring-purple-500/20 p-4 max-w-sm">
        <div className="flex items-start gap-3">
          {/* Icono animado */}
          <div className="flex-shrink-0 mt-0.5">
            <AlertTriangle className="h-5 w-5 text-amber-400 animate-pulse" />
          </div>

          {/* Contenido */}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-white mb-1">
              Completa tu información
            </h3>
            <p className="text-xs text-purple-200 mb-3">
              Faltan {missingCount} campo{missingCount > 1 ? 's' : ''} obligatorio{missingCount > 1 ? 's' : ''} en tu Fighter ID
            </p>

            {/* Botón de acción */}
            <Button
              onClick={handleComplete}
              size="sm"
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium"
            >
              Completar Ahora
            </Button>
          </div>

          {/* Botón cerrar */}
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 p-1 rounded-full hover:bg-white/10 transition-colors"
            aria-label="Cerrar notificación"
          >
            <X className="h-4 w-4 text-purple-200" />
          </button>
        </div>
      </div>
    </div>
  );
}
