import type { ComponentType, ReactNode } from 'react';

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: ReactNode;
  value: ReactNode;
  icon?: ComponentType<{ className?: string }>;
  /** Secondary line under the value: context such as "of 1.240" or a short trend. */
  hint?: ReactNode;
  /** 0–100. Renders a slim progress bar, used for rates. */
  progress?: number;
  isLoading?: boolean;
  tone?: 'default' | 'brand' | 'success' | 'warning';
  className?: string;
}

const TONE_ICON: Record<NonNullable<StatCardProps['tone']>, string> = {
  default: 'bg-muted text-muted-foreground',
  brand: 'bg-primary/10 text-primary',
  success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
};

const TONE_BAR: Record<NonNullable<StatCardProps['tone']>, string> = {
  default: 'bg-foreground/70',
  brand: 'bg-primary',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
};

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  progress,
  isLoading,
  tone = 'default',
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        'bg-card text-card-foreground flex flex-col gap-3 rounded-xl border p-4 shadow-[0_1px_2px_0_oklch(0.2_0.05_270/0.05)] sm:p-5',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-muted-foreground text-sm leading-snug font-medium">{label}</span>
        {Icon && (
          <span
            className={cn('hidden size-8 shrink-0 items-center justify-center rounded-lg sm:flex', TONE_ICON[tone])}
          >
            <Icon className="size-4" />
          </span>
        )}
      </div>
      {isLoading ? (
        <Skeleton className="h-8 w-20" />
      ) : (
        <div className="text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl">{value}</div>
      )}
      {typeof progress === 'number' && (
        <div
          className="bg-muted h-1.5 overflow-hidden rounded-full"
          role="progressbar"
          aria-label={typeof label === 'string' ? label : undefined}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress)}
        >
          <div
            className={cn('h-full origin-left rounded-full transition-transform duration-500 ease-out', TONE_BAR[tone])}
            style={{ transform: `scaleX(${Math.min(Math.max(progress, 0), 100) / 100})` }}
          />
        </div>
      )}
      {hint && <p className="text-muted-foreground -mt-1 line-clamp-2 text-xs leading-snug">{hint}</p>}
    </div>
  );
}
