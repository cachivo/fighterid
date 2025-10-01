import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Shield, AlertTriangle, CheckCircle } from 'lucide-react';
import type { DopingEligibility } from '@/hooks/useDopingTests';

interface DopingEligibilityBadgeProps {
  eligibility: DopingEligibility | null;
  showDetails?: boolean;
}

export function DopingEligibilityBadge({ eligibility, showDetails = false }: DopingEligibilityBadgeProps) {
  if (!eligibility) return null;

  const isEligible = eligibility.eligible;

  if (!showDetails) {
    return (
      <Badge
        variant={isEligible ? 'default' : 'destructive'}
        className="flex items-center gap-1"
      >
        {isEligible ? (
          <>
            <CheckCircle className="h-3 w-3" />
            Elegible para Competir
          </>
        ) : (
          <>
            <AlertTriangle className="h-3 w-3" />
            No Elegible
          </>
        )}
      </Badge>
    );
  }

  return (
    <Alert variant={isEligible ? 'default' : 'destructive'}>
      <div className="flex items-start gap-2">
        {isEligible ? (
          <Shield className="h-5 w-5 text-primary" />
        ) : (
          <AlertTriangle className="h-5 w-5 text-destructive" />
        )}
        <div className="flex-1">
          <AlertTitle className="mb-1">
            {isEligible ? 'Elegible para Competir' : 'No Elegible para Competir'}
          </AlertTitle>
          <AlertDescription>
            {eligibility.reason}
            {eligibility.months_since_last_test > 0 && eligibility.months_since_last_test <= 12 && (
              <div className="mt-2 text-xs">
                Última prueba hace {eligibility.months_since_last_test} {eligibility.months_since_last_test === 1 ? 'mes' : 'meses'}
              </div>
            )}
          </AlertDescription>
        </div>
      </div>
    </Alert>
  );
}
