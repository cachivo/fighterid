import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { User, Loader2, Eye, Calendar, MapPin } from 'lucide-react';
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
      isPending ? 'border-fighter-warning/30 bg-card' : 'border-border/50 bg-card/50'
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
        
        {/* Show upcoming fight event if exists */}
        {!isPending && license.fight_bookings && license.fight_bookings.length > 0 && (
          <div className="mt-2 p-2 bg-primary/5 rounded border border-primary/20">
            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <div className="text-sm space-y-0.5">
                <div className="font-medium text-primary">
                  {license.fight_bookings[0].event_name}
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <span>{new Date(license.fight_bookings[0].scheduled_date).toLocaleDateString('es-HN', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</span>
                  {license.fight_bookings[0].venue && (
                    <>
                      <span>•</span>
                      <MapPin className="h-3 w-3 inline" />
                      <span>{license.fight_bookings[0].venue}</span>
                    </>
                  )}
                </div>
                {license.fight_bookings[0].fight_type && (
                  <Badge variant="outline" className="text-xs h-5">
                    {license.fight_bookings[0].fight_type}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        )}
        
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
                className="border-primary/30 hover:bg-primary/10"
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
                className="bg-fighter-success hover:bg-fighter-success/80"
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
                className="text-fighter-success border-fighter-success/50 hover:bg-fighter-success hover:text-white disabled:opacity-50"
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
                className="text-fighter-warning border-fighter-warning/50 hover:bg-fighter-warning hover:text-white disabled:opacity-50"
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
