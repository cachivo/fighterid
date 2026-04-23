import { Badge } from '@/components/ui/badge';
import { Clock, XCircle } from 'lucide-react';

interface Props {
  status?: string | null;
  className?: string;
}

/**
 * Renders a small badge indicating a record's moderation status.
 * Returns null for `approved` (or missing status) so approved cards stay clean.
 */
export function ModerationStatusBadge({ status, className }: Props) {
  if (!status || status === 'approved') return null;

  if (status === 'pending') {
    return (
      <Badge
        variant="outline"
        className={`gap-1 border-yellow-500/50 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 ${className || ''}`}
      >
        <Clock className="h-3 w-3" />
        Pendiente
      </Badge>
    );
  }

  if (status === 'rejected') {
    return (
      <Badge variant="destructive" className={`gap-1 ${className || ''}`}>
        <XCircle className="h-3 w-3" />
        Rechazado
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className={className}>
      {status}
    </Badge>
  );
}
