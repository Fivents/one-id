'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useI18n } from '@/i18n';

export const PAGE_SIZE_OPTIONS = [20, 50, 100] as const;
export type PageSize = (typeof PAGE_SIZE_OPTIONS)[number];
export const DEFAULT_PAGE_SIZE: PageSize = 20;

interface ListPaginationProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: PageSize;
  onPageChange: (page: number) => void;
  /** Callers reset to page 1 here: the old page number may not exist at the new size. */
  onPageSizeChange: (pageSize: PageSize) => void;
  disabled?: boolean;
}

export function ListPagination({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
  onPageSizeChange,
  disabled,
}: ListPaginationProps) {
  const { t, locale } = useI18n();

  // An empty list already shows its own empty state; "0 results · page 1 of 1" adds nothing.
  if (total === 0) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 pt-2">
      <div className="text-muted-foreground flex items-center gap-3 text-sm">
        <span className="tabular-nums">{t('nav.shell.listResultsCount', { count: total.toLocaleString(locale) })}</span>
        <Select value={String(pageSize)} onValueChange={(value) => onPageSizeChange(Number(value) as PageSize)}>
          <SelectTrigger size="sm" className="w-auto gap-1.5" aria-label={t('nav.shell.listPerPageLabel')}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAGE_SIZE_OPTIONS.map((option) => (
              <SelectItem key={option} value={String(option)}>
                {option} {t('nav.shell.listPerPage')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label={t('nav.shell.listPrevious')}
        >
          <ChevronLeft className="size-4" />
          <span className="hidden sm:inline">{t('nav.shell.listPrevious')}</span>
        </Button>
        <span className="text-sm tabular-nums">
          {t('nav.shell.listPageOf', { page: String(page), total: String(totalPages) })}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label={t('nav.shell.listNext')}
        >
          <span className="hidden sm:inline">{t('nav.shell.listNext')}</span>
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
