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
  
  if (!profile.document_number) missingFields.push('Documento de Identidad');
  if (!profile.birthdate) missingFields.push('Fecha de Nacimiento');
  if (!profile.blood_type) missingFields.push('Tipo de Sangre');
  if (!profile.emergency_contact_name) missingFields.push('Contacto de Emergencia');
  if (!profile.emergency_contact_phone) missingFields.push('Teléfono de Emergencia');

  // If all critical fields are complete, don't show the prompt
  if (missingFields.length === 0) {
    return null;
  }

  const completionPercentage = Math.round(((5 - missingFields.length) / 5) * 100);

  return (
    <Card className={`border-l-4 border-l-yellow-500 bg-gradient-to-r from-yellow-950/30 to-background ${className}`}>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="p-2 rounded-lg bg-yellow-600/20">
              <AlertTriangle className="h-6 w-6 text-yellow-400" />
            </div>
          </div>
          
          <div className="flex-1 space-y-3">
            <div>
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Completa tu Fighter ID
              </h3>
              <p className="text-sm text-yellow-200 mt-1">
                Tu perfil necesita información crítica de seguridad ({completionPercentage}% completo)
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-gray-300">Información faltante:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {missingFields.map((field) => (
                  <div key={field} className="flex items-center gap-2 text-sm text-yellow-200">
                    <FileText className="h-3 w-3" />
                    {field}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-blue-950/30 border border-blue-600/30 rounded-lg p-3 mb-3">
              <p className="text-sm text-blue-200">
                <strong>Nota importante:</strong> Puedes solicitar cambios a tu información, pero requerirán aprobación administrativa antes de ser aplicados.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button asChild className="bg-yellow-600 hover:bg-yellow-700 text-white">
                <Link to="/profile/request-changes" className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4" />
                  Solicitar Cambios
                </Link>
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="text-gray-300 border-gray-600 hover:bg-gray-800"
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