import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, Shield, FileText, UserCheck } from 'lucide-react';
import { FighterProfile } from '@/hooks/useFighterProfiles';

interface ProfileCompletionPromptProps {
  profile: FighterProfile;
  className?: string;
  onRefreshProfile?: () => void;
}

export function ProfileCompletionPrompt({ profile, className, onRefreshProfile }: ProfileCompletionPromptProps) {
  // Check which critical information is missing
  const missingFields = [];
  
  if (!profile.birthdate) missingFields.push('Fecha de Nacimiento');
  if (!profile.gender) missingFields.push('Género');
  if (!(profile as any).phone) missingFields.push('Teléfono');
  if (!profile.blood_type) missingFields.push('Tipo de Sangre');
  if (!profile.emergency_contact_name) missingFields.push('Contacto de Emergencia');
  if (!profile.emergency_contact_phone) missingFields.push('Teléfono de Emergencia');

  // If all critical fields are complete, don't show the prompt
  if (missingFields.length === 0) {
    return null;
  }

  const completionPercentage = Math.round(((6 - missingFields.length) / 6) * 100);

  return (
    <Card className={`border-l-4 border-l-professional-danger bg-professional-danger/5 ${className}`}>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="p-2 rounded-lg bg-professional-danger/20">
              <AlertTriangle className="h-6 w-6 text-professional-danger" />
            </div>
          </div>
          
          <div className="flex-1 space-y-3">
            <div>
              <h3 className="text-lg font-semibold text-professional-primary flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Completa tu Fighter ID
              </h3>
              <p className="text-sm text-professional-accent mt-1">
                Tu perfil necesita información crítica de seguridad ({completionPercentage}% completo)
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-professional-foreground">Información faltante:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {missingFields.map((field) => (
                  <div key={field} className="flex items-center gap-2 text-sm text-professional-accent">
                    <FileText className="h-3 w-3" />
                    {field}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-professional-accent/10 border border-professional-accent/30 rounded-lg p-3 mb-3">
              <p className="text-sm text-professional-foreground">
                <strong>Nota importante:</strong> Puedes solicitar cambios a tu información, pero requerirán aprobación administrativa antes de ser aplicados.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button asChild variant="professional">
                <Link to="/profile/request-changes" className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4" />
                  Solicitar Cambios
                </Link>
              </Button>
              
              <Button 
                variant="professional-outline" 
                size="sm" 
                onClick={onRefreshProfile}
              >
                Actualizar Estado
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}