import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useFighterProfiles, FighterProfile } from '@/hooks/useFighterProfiles';
import { ArrowLeft, Download, QrCode } from 'lucide-react';
import { DigitalFighterToken } from '@/components/DigitalFighterToken';

export function FighterLicense() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getFighterById } = useFighterProfiles();
  const [fighter, setFighter] = useState<FighterProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFighter = async () => {
      if (!id) return;
      
      try {
        const data = await getFighterById(id);
        setFighter(data);
      } catch (error) {
        console.error('Error fetching fighter:', error);
        setFighter(null);
      } finally {
        setLoading(false);
      }
    };

    fetchFighter();
  }, [id, getFighterById]);


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Cargando licencia...</div>
      </div>
    );
  }

  if (!fighter) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4">
        <div className="text-lg">Licencia no encontrada</div>
        <Button onClick={() => navigate('/fighters')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a Peleadores
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 p-2 sm:p-4">
      <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <Button 
            variant="outline" 
            onClick={() => navigate('/fighters')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden xs:inline">Volver</span>
          </Button>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm">
              <QrCode className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">QR Code</span>
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Descargar PDF</span>
            </Button>
          </div>
        </div>

        {/* Digital Fighter Token */}
        <div className="flex justify-center">
          <DigitalFighterToken profile={fighter} />
        </div>
      </div>
    </div>
  );
}