'use client';

import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from 'react';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { ChevronRight } from 'lucide-react';

import { useOrganization } from '@/core/application/contexts';
import { useI18n } from '@/i18n';

interface Crumb {
  label: string;
  href?: string;
}

const BreadcrumbLabelContext = createContext<{
  detailLabel: string | null;
  setDetailLabel: (label: string | null) => void;
} | null>(null);

export function BreadcrumbProvider({ children }: { children: ReactNode }) {
  const [detailLabel, setDetailLabel] = useState<string | null>(null);
  const value = useMemo(() => ({ detailLabel, setDetailLabel }), [detailLabel]);
  return <BreadcrumbLabelContext.Provider value={value}>{children}</BreadcrumbLabelContext.Provider>;
}

/** Lets a detail page name the last crumb (e.g. the event name) once its data has loaded. */
export function useBreadcrumbLabel(label: string | null | undefined) {
  const context = useContext(BreadcrumbLabelContext);
  const setDetailLabel = context?.setDetailLabel;

  useEffect(() => {
    if (!setDetailLabel) return;
    setDetailLabel(label ?? null);
    return () => setDetailLabel(null);
  }, [label, setDetailLabel]);
}

const ORGANIZATION_SECTIONS: Record<string, string> = {
  events: 'nav.sidebar.events',
  people: 'nav.sidebar.people',
  totems: 'nav.sidebar.totems',
  integrations: 'nav.sidebar.integrations',
};

const ADMIN_SECTIONS: Record<string, string> = {
  organizations: 'nav.sidebar.organizations',
  plans: 'nav.sidebar.plans',
  users: 'nav.sidebar.users',
  totems: 'nav.sidebar.totems',
};

function useCrumbs(): Crumb[] {
  const pathname = usePathname();
  const { t } = useI18n();
  const { organizations, activeOrganization } = useOrganization();
  const detailLabel = useContext(BreadcrumbLabelContext)?.detailLabel ?? null;

  return useMemo(() => {
    const segments = pathname.split('/').filter(Boolean);
    const [root, id, section, detailId] = segments;

    if (root === 'dashboard') {
      return [{ label: t('nav.sidebar.dashboard') }];
    }

    if (root === 'organizations' && id) {
      const organization = organizations.find((org) => org.id === id) ?? activeOrganization;
      const crumbs: Crumb[] = [{ label: organization?.name ?? t('nav.shell.organizationFallback') }];
      const sectionKey = section ? ORGANIZATION_SECTIONS[section] : undefined;
      if (sectionKey) {
        const sectionHref = `/organizations/${id}/${section}`;
        crumbs.push(detailId ? { label: t(sectionKey), href: sectionHref } : { label: t(sectionKey) });
      }
      if (detailId) {
        crumbs.push({ label: detailLabel ?? t('nav.shell.eventFallback') });
      }
      return crumbs;
    }

    if (root === 'admin' && id) {
      const sectionKey = ADMIN_SECTIONS[id];
      const crumbs: Crumb[] = [{ label: t('nav.sidebar.adminSection') }];
      if (sectionKey) {
        crumbs.push(section ? { label: t(sectionKey), href: `/admin/${id}` } : { label: t(sectionKey) });
      }
      if (section) {
        crumbs.push({ label: detailLabel ?? t('nav.shell.organizationFallback') });
      }
      return crumbs;
    }

    return [];
  }, [pathname, t, organizations, activeOrganization, detailLabel]);
}

export function AppBreadcrumb() {
  const { t } = useI18n();
  const crumbs = useCrumbs();

  if (crumbs.length === 0) return null;

  return (
    <nav aria-label={t('nav.shell.breadcrumb')} className="min-w-0">
      <ol className="text-muted-foreground flex min-w-0 items-center gap-1 text-sm">
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          // Below lg only the parent and the current page are shown.
          const isVisibleOnMobile = index >= crumbs.length - 2;
          return (
            <li
              key={`${crumb.label}-${index}`}
              className={`min-w-0 items-center gap-1 ${isVisibleOnMobile ? 'flex' : 'hidden lg:flex'}`}
            >
              {index > 0 && (
                <ChevronRight
                  aria-hidden
                  className={`size-3.5 shrink-0 opacity-50 ${index === crumbs.length - 2 ? 'hidden lg:block' : ''}`}
                />
              )}
              {crumb.href ? (
                <Link
                  href={crumb.href}
                  className="hover:text-foreground focus-visible:ring-ring/50 block truncate rounded-sm transition-colors outline-none focus-visible:ring-2"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span
                  aria-current={isLast ? 'page' : undefined}
                  className={isLast ? 'text-foreground block truncate font-medium' : 'block truncate'}
                >
                  {crumb.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
