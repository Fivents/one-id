import type { ComponentType, ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  icon?: ComponentType<{ className?: string }>;
  /** Rendered next to the title, e.g. a status badge. */
  meta?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({ title, description, icon: Icon, meta, actions, className }: PageHeaderProps) {
  return (
    <header className={cn('flex flex-col gap-4 md:flex-row md:items-start md:justify-between', className)}>
      <div className="flex min-w-0 items-start gap-3.5">
        {Icon && (
          <div className="bg-primary/10 text-primary ring-primary/15 mt-0.5 hidden size-10 shrink-0 items-center justify-center rounded-xl ring-1 sm:flex">
            <Icon className="size-5" />
          </div>
        )}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-balance">{title}</h1>
            {meta}
          </div>
          {description && <p className="text-muted-foreground mt-1 text-sm text-pretty">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 md:shrink-0 md:justify-end">{actions}</div>}
    </header>
  );
}
