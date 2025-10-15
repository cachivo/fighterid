import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { User, Loader2, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface LicenseCardProps {
  license: any;
  isPending?: boolean;
  onReview?: (license: any) => void;
  onApprove?: (licenseId: string) => void;
  onReject?: (licenseId: string) => void;
  onActivate?: (licenseId: string) => void;
  onSuspend?: (licenseId: string) => void;
  isLoading?: boolean;
  isAdmin?: boolean;
  displayStatus?: string;
  getLicenseStatusColor: (status: string) => string;
}

export const LicenseCard = ({
  license,
  isPending = false,
  onReview,
  onApprove,
  onReject,
  onActivate,
  onSuspend,
  isLoading = false,
  isAdmin = false,
  displayStatus,
  getLicenseStatusColor,
}: LicenseCardProps) => {
  const fighterPhoto = license.license_documents?.find((doc: any) => doc.document_type === 'photo');
  const photoUrl = fighterPhoto 
    ? supabase.storage.from('fighter-photos').getPublicUrl(fighterPhoto.file_path).data.publicUrl
    : license.fighter?.avatar_url;

  const status = displayStatus || license.status;

  return (
    <div className={`flex items-center gap-4 p-4 rounded-lg border ${
      isPending ? 'border-amber-200 bg-white' : 'border-border/50 bg-card/50'
    }`}>
      {/* Fighter Avatar */}
      <div className="flex-shrink-0">
        <OptimizedImage
          src={photoUrl || ''}
          alt={`${license.fighter?.first_name} ${license.fighter?.last_name}`}
          className="w-12 h-12 rounded-full border-2 border-border object-cover aspect-square flex-shrink-0"
          fallbackIcon={
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center border-2 border-border">
              <User className="h-6 w-6 text-muted-foreground" />
            </div>
          }
          priority={false}
        />
      </div>
      
      {/* License Information */}
      <div className="space-y-1 flex-1">
        <div className="flex items-center gap-3">
          <div className="font-medium">{license.license_number}</div>
          <Badge className={getLicenseStatusColor(status)}>
            {isPending ? 'PENDIENTE REVISIÓN' : status}
          </Badge>
        </div>
        <div className="text-sm text-muted-foreground">
          <strong>Peleador:</strong> {license.fighter?.first_name} {license.fighter?.last_name}
          {license.fighter?.nickname ? ` "${license.fighter.nickname}"` : ''}
        </div>
        <div className="text-sm text-muted-foreground">
          {isPending ? (
            <>
              <strong>Categoría:</strong> {license.fighter?.weight_class} • 
              <strong> Disciplina:</strong> {license.discipline} • 
              <strong> Solicitada:</strong> {new Date(license.created_at).toLocaleDateString()}
            </>
          ) : (
            <>
              <strong>Disciplina:</strong> {license.discipline} | 
              <strong> División:</strong> {license.fighter?.weight_class} | 
              <strong> Expira:</strong> {license.expires_at ? new Date(license.expires_at).toLocaleDateString() : 'N/A'}
            </>
          )}
        </div>
        {license.notes && (
          <div className="text-sm text-muted-foreground">
            <strong>Notas:</strong> {license.notes}
          </div>
        )}
      </div>
      
      {/* Action Buttons */}
      <div className="flex-shrink-0 flex gap-2">
        {isPending ? (
          <>
            {onReview && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onReview(license)}
                className="border-blue-200 hover:bg-blue-50"
              >
                <Eye className="h-3 w-3 mr-1" />
                Revisar
              </Button>
            )}
            {onApprove && (
              <Button
                size="sm"
                variant="default"
                onClick={() => onApprove(license.id)}
                disabled={isLoading || !isAdmin}
                className="bg-green-600 hover:bg-green-700"
              >
                {isLoading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                Aprobar
              </Button>
            )}
            {onReject && (
              <Button
                size="sm" 
                variant="destructive"
                onClick={() => onReject(license.id)}
                disabled={isLoading || !isAdmin}
              >
                {isLoading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                Rechazar
              </Button>
            )}
          </>
        ) : (
          <>
            {status !== 'ACTIVE' && onActivate && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => onActivate(license.id)}
                disabled={isLoading || !isAdmin}
                className="text-green-600 border-green-600 hover:bg-green-600 hover:text-white disabled:opacity-50"
                title={!isAdmin ? "Solo administradores pueden activar licencias" : ""}
              >
                {isLoading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                Activar
              </Button>
            )}
            {status !== 'SUSPENDED' && onSuspend && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => onSuspend(license.id)}
                disabled={isLoading || !isAdmin}
                className="text-orange-600 border-orange-600 hover:bg-orange-600 hover:text-white disabled:opacity-50"
                title={!isAdmin ? "Solo administradores pueden suspender licencias" : ""}
              >
                {isLoading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                Suspender
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
};
