import { Badge } from '@/components/ui/badge';
import type { TotemStatus } from '@/core/domain/entities/totem.entity';
import { useI18n } from '@/i18n';

const STATUS_VARIANTS: Record<TotemStatus, 'success' | 'neutral' | 'warning'> = {
  ACTIVE: 'success',
  INACTIVE: 'neutral',
  MAINTENANCE: 'warning',
};

const STATUS_KEYS: Record<TotemStatus, string> = {
  ACTIVE: 'common.status.totemActive',
  INACTIVE: 'common.status.totemInactive',
  MAINTENANCE: 'common.status.totemMaintenance',
};

export function TotemStatusBadge({ status }: { status: TotemStatus }) {
  const { t } = useI18n();
  return <Badge variant={STATUS_VARIANTS[status]}>{t(STATUS_KEYS[status])}</Badge>;
}
