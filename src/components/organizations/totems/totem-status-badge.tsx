import { Badge } from '@/components/ui/badge';
import type { TotemStatus } from '@/core/domain/entities/totem.entity';
import { useI18n } from '@/i18n';

const STATUS_STYLES: Record<TotemStatus, string> = {
  ACTIVE: 'bg-emerald-500/10 text-emerald-600',
  INACTIVE: 'bg-gray-400/10 text-gray-500',
  MAINTENANCE: 'bg-yellow-500/10 text-yellow-600',
};

const STATUS_KEYS: Record<TotemStatus, string> = {
  ACTIVE: 'common.status.totemActive',
  INACTIVE: 'common.status.totemInactive',
  MAINTENANCE: 'common.status.totemMaintenance',
};

export function TotemStatusBadge({ status }: { status: TotemStatus }) {
  const { t } = useI18n();
  return (
    <Badge variant="outline" className={STATUS_STYLES[status]}>
      {t(STATUS_KEYS[status])}
    </Badge>
  );
}
