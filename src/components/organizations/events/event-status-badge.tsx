import { Badge } from '@/components/ui/badge';
import type { EventStatus } from '@/core/domain/entities/event.entity';
import { useI18n } from '@/i18n';

const STATUS_VARIANTS: Record<EventStatus, 'neutral' | 'info' | 'success' | 'brand' | 'danger'> = {
  DRAFT: 'neutral',
  PUBLISHED: 'info',
  ACTIVE: 'success',
  COMPLETED: 'brand',
  CANCELED: 'danger',
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
    <Badge variant={STATUS_VARIANTS[status]}>
      {status === 'ACTIVE' && <span aria-hidden className="size-1.5 animate-pulse rounded-full bg-current" />}
      {t(STATUS_KEYS[status])}
    </Badge>
  );
}
