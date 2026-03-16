import { Badge } from '@/components/ui/badge';
import type { EventStatus } from '@/core/domain/entities/event.entity';

const STATUS_STYLES: Record<EventStatus, string> = {
  DRAFT: 'bg-gray-400/10 text-gray-500',
  PUBLISHED: 'bg-blue-500/10 text-blue-600',
  ACTIVE: 'bg-emerald-500/10 text-emerald-600',
  COMPLETED: 'bg-purple-500/10 text-purple-600',
  CANCELED: 'bg-rose-500/10 text-rose-600',
};

export function EventStatusBadge({ status }: { status: EventStatus }) {
  return (
    <Badge variant="outline" className={STATUS_STYLES[status]}>
      {status}
    </Badge>
  );
}
