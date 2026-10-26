'use client';

import { ComponentType } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import {
  Building2,
  Calendar,
  ChevronUp,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Monitor,
  Plug,
  Shield,
  Users,
} from 'lucide-react';

import { useAuth, useOrganization, usePermissions } from '@/core/application/contexts';
import { Role } from '@/core/domain/value-objects';
import { getNameInitials } from '@/core/utils/get-name-initials';
import { useI18n } from '@/i18n';

import { Avatar, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '../ui/sidebar';

import { ThemeToggle } from './theme-toggle';

interface NavItem {
  titleKey: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  roles: Role[];
}

const adminNavItems: Array<Omit<NavItem, 'roles'>> = [
  { titleKey: 'nav.sidebar.organizations', href: '/admin/organizations', icon: Building2 },
  { titleKey: 'nav.sidebar.plans', href: '/admin/plans', icon: CreditCard },
  { titleKey: 'nav.sidebar.users', href: '/admin/users', icon: Users },
  { titleKey: 'nav.sidebar.totems', href: '/admin/totems', icon: Monitor },
];

const navItems: NavItem[] = [
  {
    titleKey: 'nav.sidebar.dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['SUPER_ADMIN', 'ORG_OWNER', 'EVENT_MANAGER'],
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useI18n();
  const { user, logout } = useAuth();
  const { activeOrganization, organizations } = useOrganization();
  const { role } = usePermissions();

  const { isSuperAdmin } = usePermissions();

  const pathOrganizationIdMatch = pathname.match(/^\/organizations\/([^/]+)/);
  const pathOrganizationId = pathOrganizationIdMatch?.[1] ?? null;
  const organizationId =
    activeOrganization?.id ?? organizations[0]?.id ?? pathOrganizationId ?? user?.organizationId ?? null;
  const organizationName = activeOrganization?.name ?? organizations[0]?.name ?? user?.email;
  const organizationEventsHref = organizationId ? `/organizations/${organizationId}/events` : null;
  const organizationPeopleHref = organizationId ? `/organizations/${organizationId}/people` : null;
  const organizationTotemsHref = organizationId ? `/organizations/${organizationId}/totems` : null;
  const organizationIntegrationsHref = organizationId ? `/organizations/${organizationId}/integrations` : null;

  const filteredNavItems = navItems.filter((item) => role && item.roles.includes(role));

  const organizationNavItems: Array<{ titleKey: string; href: string | null; icon: NavItem['icon'] }> = [
    { titleKey: 'nav.sidebar.people', href: organizationPeopleHref, icon: Users },
    { titleKey: 'nav.sidebar.events', href: organizationEventsHref, icon: Calendar },
    { titleKey: 'nav.sidebar.totems', href: organizationTotemsHref, icon: Monitor },
    { titleKey: 'nav.sidebar.integrations', href: organizationIntegrationsHref, icon: Plug },
  ];

  async function handleLogout() {
    // Navigate immediately to login to avoid blank screen while server logout completes
    router.push('/login');
    try {
      await logout();
    } catch (error) {
      // Ignore logout errors since user is already being redirected to login
      console.error('[AppSidebar] logout error:', error);
    }
  }

  if (!user || !role) return null;

  return (
    <Sidebar>
      <SidebarHeader className="border-sidebar-border border-b px-4 py-3">
        <Link
          href="/dashboard"
          className="focus-visible:ring-ring/50 flex items-center gap-2.5 rounded-md outline-none focus-visible:ring-2"
        >
          <div className="bg-primary/10 ring-primary/20 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1">
            <Image src="/png/logo-blue.png" alt="Fivents Logo" width={20} height={20} className="block dark:hidden" />
            <Image src="/png/logo-white.png" alt="Fivents Logo" width={20} height={20} className="hidden dark:block" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm leading-tight font-semibold tracking-tight">OneID</span>
            <span className="text-muted-foreground text-xs">by Fivents</span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="gap-0 py-2">
        {isSuperAdmin() && (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredNavItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={pathname.startsWith(item.href)} tooltip={t(item.titleKey)}>
                      <Link href={item.href}>
                        <item.icon className="h-4 w-4" />
                        <span>{t(item.titleKey)}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarGroup>
          <SidebarGroupLabel>{t('nav.sidebar.organizationSection')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {organizationNavItems.map((item) => (
                <SidebarMenuItem key={item.titleKey}>
                  {item.href ? (
                    <SidebarMenuButton asChild isActive={pathname.startsWith(item.href)} tooltip={t(item.titleKey)}>
                      <Link href={item.href}>
                        <item.icon className="h-4 w-4" />
                        <span>{t(item.titleKey)}</span>
                      </Link>
                    </SidebarMenuButton>
                  ) : (
                    <SidebarMenuButton disabled aria-disabled>
                      <item.icon className="h-4 w-4" />
                      <span>{t(item.titleKey)}</span>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isSuperAdmin() && (
          <SidebarGroup>
            <SidebarGroupLabel>{t('nav.sidebar.adminSection')}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminNavItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={pathname.startsWith(item.href)} tooltip={t(item.titleKey)}>
                      <Link href={item.href}>
                        <item.icon className="h-4 w-4" />
                        <span>{t(item.titleKey)}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-sidebar-border border-t">
        <div className="flex items-center justify-between px-2 py-1">
          <div className="flex items-center gap-1.5">
            <Shield className="text-muted-foreground h-3 w-3" />
            <Badge variant="outline" className="text-[10px] font-normal">
              {t(`nav.roleLabels.${role}`)}
            </Badge>
          </div>
          <ThemeToggle />
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="h-auto py-2">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="text-xs">{getNameInitials(user.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-1 flex-col text-left text-xs">
                    <span className="font-medium">{user.name}</span>
                    <span className="text-muted-foreground">{organizationName}</span>
                  </div>
                  <ChevronUp className="ml-auto h-4 w-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="truncate text-sm font-medium">{user.name}</p>
                  <p className="text-muted-foreground truncate text-xs">{user.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  {t('common.actions.logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
