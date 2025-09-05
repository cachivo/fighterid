import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { EnhancedFighterID } from '@/components/EnhancedFighterID';
import { useFighterProfiles } from '@/hooks/useFighterProfiles';
import { useLicenseAuth } from '@/hooks/useLicenseAuth';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { AlertCircle, X } from 'lucide-react';

interface FighterIDModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FighterIDModal({ open, onOpenChange }: FighterIDModalProps) {
  const { user } = useLicenseAuth();
  const { getUserFighterProfile } = useFighterProfiles();
  const [fighterProfile, setFighterProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && user) {
      loadFighterProfile();
    }
  }, [open, user]);

  const loadFighterProfile = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const profile = await getUserFighterProfile();
      setFighterProfile(profile);
    } catch (err) {
      console.error('Error loading fighter profile:', err);
      setError('Error al cargar el perfil del peleador');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 border-gold-500/30">
        <DialogHeader className="relative pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold text-gold-400 flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center">
                <span className="text-black font-bold text-sm">ID</span>
              </div>
              Mi Fighter ID Digital
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="text-gold-400 hover:text-gold-300 hover:bg-gold-400/10"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-gold-400/30 to-transparent" />
        </DialogHeader>

        <div className="py-4">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-4">
                <LoadingSpinner />
                <p className="text-gold-300">Cargando tu Fighter ID...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-4">
                <AlertCircle className="h-12 w-12 text-red-400 mx-auto" />
                <div>
                  <p className="text-red-300 font-medium">Error al cargar el Fighter ID</p>
                  <p className="text-slate-400 text-sm mt-1">{error}</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={loadFighterProfile}
                    className="mt-3 border-gold-400/30 text-gold-300 hover:bg-gold-400/10"
                  >
                    Reintentar
                  </Button>
                </div>
              </div>
            </div>
          )}

          {!loading && !error && !fighterProfile && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-4">
                <AlertCircle className="h-12 w-12 text-amber-400 mx-auto" />
                <div>
                  <p className="text-amber-300 font-medium">No tienes un perfil de peleador</p>
                  <p className="text-slate-400 text-sm mt-1">
                    Crea tu perfil primero para ver tu Fighter ID digital
                  </p>
                </div>
              </div>
            </div>
          )}

          {!loading && !error && fighterProfile && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-gold-400/20 to-gold-600/20 border border-gold-400/30">
                  <div className="h-2 w-2 rounded-full bg-gold-400 animate-pulse" />
                  <span className="text-gold-300 text-sm font-medium">Tu Fighter ID Digital</span>
                </div>
              </div>
              
              <EnhancedFighterID 
                profile={fighterProfile}
                showAdmin={false}
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}