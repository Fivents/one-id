'use client';

import { ComponentType } from 'react';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import {
  Building2,
  ChevronUp,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Monitor,
  ScanFace,
  Settings,
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
  const { activeOrganization } = useOrganization();
  const { role } = usePermissions();

  const { isSuperAdmin } = usePermissions();

  const filteredNavItems = navItems.filter((item) => role && item.roles.includes(role));

  async function handleLogout() {
    await logout();
    router.push('/login');
  }

  if (!user || !role) return null;

  return (
    <Sidebar>
      <SidebarHeader className="border-sidebar-border border-b px-4 py-3">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="bg-primary flex h-8 w-8 items-center justify-center rounded-lg">
            <ScanFace className="text-primary-foreground h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">OneID</span>
            <span className="text-muted-foreground text-xs">by Fivents</span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t('nav.sidebar.dashboard')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={pathname.startsWith(item.href)}>
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

        {isSuperAdmin() && (
          <SidebarGroup>
            <SidebarGroupLabel>Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname.startsWith('/admin/organizations')}>
                    <Link href="/admin/organizations">
                      <Building2 className="h-4 w-4" />
                      <span>{t('nav.sidebar.organizations')}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname.startsWith('/admin/plans')}>
                    <Link href="/admin/plans">
                      <CreditCard className="h-4 w-4" />
                      <span>{t('nav.sidebar.plans')}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname.startsWith('/admin/users')}>
                    <Link href="/admin/users">
                      <Users className="h-4 w-4" />
                      <span>{t('nav.sidebar.users')}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname.startsWith('/admin/totems')}>
                    <Link href="/admin/totems">
                      <Monitor className="h-4 w-4" />
                      <span>{t('nav.sidebar.totems')}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
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
                    <span className="text-muted-foreground">{activeOrganization?.name ?? user.email}</span>
                  </div>
                  <ChevronUp className="ml-auto h-4 w-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" className="w-56">
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    {t('nav.sidebar.settings')}
                  </Link>
                </DropdownMenuItem>
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
