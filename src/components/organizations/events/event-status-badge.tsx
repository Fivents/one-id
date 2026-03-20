import { Badge } from '@/components/ui/badge';
import type { EventStatus } from '@/core/domain/entities/event.entity';
import { useI18n } from '@/i18n';

const STATUS_STYLES: Record<EventStatus, string> = {
  DRAFT: 'bg-gray-400/10 text-gray-500',
  PUBLISHED: 'bg-blue-500/10 text-blue-600',
  ACTIVE: 'bg-emerald-500/10 text-emerald-600',
  COMPLETED: 'bg-purple-500/10 text-purple-600',
  CANCELED: 'bg-rose-500/10 text-rose-600',
};

const STATUS_KEYS: Record<EventStatus, string> = {
  DRAFT: 'common.status.draft',
  PUBLISHED: 'common.status.published',
  ACTIVE: 'common.status.active',
  COMPLETED: 'common.status.completed',
  CANCELED: 'common.status.canceled',
};

export function EventStatusBadge({ status }: { status: EventStatus }) {
  const { t } = useI18n();
  return (
    <Badge variant="outline" className={STATUS_STYLES[status]}>
      {t(STATUS_KEYS[status])}
    </Badge>
  );
}

