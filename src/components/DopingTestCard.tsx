import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Calendar, Shield, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { DopingTest } from '@/hooks/useDopingTests';

interface DopingTestCardProps {
  test: DopingTest;
}

const TEST_TYPE_LABELS = {
  PRE_FIGHT: 'Pre-Pelea',
  RANDOM: 'Aleatorio',
  POST_FIGHT: 'Post-Pelea',
  ANNUAL: 'Anual',
};

const STATUS_CONFIG = {
  PENDING: { label: 'Pendiente', variant: 'secondary' as const, icon: AlertCircle },
  CLEAN: { label: 'Limpio', variant: 'default' as const, icon: Shield },
  POSITIVE: { label: 'Positivo', variant: 'destructive' as const, icon: AlertCircle },
  INCONCLUSIVE: { label: 'No Concluyente', variant: 'outline' as const, icon: AlertCircle },
};

export function DopingTestCard({ test }: DopingTestCardProps) {
  const statusInfo = STATUS_CONFIG[test.result_status];
  const StatusIcon = statusInfo.icon;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            {TEST_TYPE_LABELS[test.test_type]}
          </CardTitle>
          <Badge variant={statusInfo.variant} className="flex items-center gap-1">
            <StatusIcon className="h-3 w-3" />
            {statusInfo.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>
            {format(new Date(test.test_date), 'PPP', { locale: es })}
          </span>
        </div>
        
        <div className="text-sm">
          <span className="font-medium">Agencia: </span>
          <span className="text-muted-foreground">{test.testing_agency}</span>
        </div>

        {test.substances_detected && test.substances_detected.length > 0 && (
          <div className="text-sm">
            <span className="font-medium text-destructive">Sustancias detectadas: </span>
            <span className="text-muted-foreground">{test.substances_detected.join(', ')}</span>
          </div>
        )}

        {test.notes && (
          <div className="text-sm">
            <span className="font-medium">Notas: </span>
            <span className="text-muted-foreground">{test.notes}</span>
          </div>
        )}

        {test.verified_at && (
          <div className="text-xs text-muted-foreground pt-2 border-t">
            Verificado el {format(new Date(test.verified_at), 'PPP', { locale: es })}
          </div>
        )}

        {test.report_file_url && (
          <a
            href={test.report_file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            <FileText className="h-4 w-4" />
            Ver reporte completo
          </a>
        )}
      </CardContent>
    </Card>
  );
}
