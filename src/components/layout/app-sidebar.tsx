"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import type { Role } from "@/generated/prisma/client";
import { useI18n } from "@/lib/i18n";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Building2,
  CreditCard,
  Settings,
  LogOut,
  ScanFace,
  ChevronUp,
  Shield,
  Monitor,
} from "lucide-react";

interface NavItem {
  titleKey: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: Role[];
}

const navItems: NavItem[] = [
  {
    titleKey: "nav.sidebar.dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["SUPER_ADMIN", "ORG_OWNER", "ORG_ADMIN", "EVENT_MANAGER"],
  },
  {
    titleKey: "nav.sidebar.events",
    href: "/events",
    icon: Calendar,
    roles: ["SUPER_ADMIN", "ORG_OWNER", "ORG_ADMIN", "EVENT_MANAGER"],
  },
  {
    titleKey: "nav.sidebar.organizations",
    href: "/organizations",
    icon: Building2,
    roles: ["SUPER_ADMIN", "ORG_OWNER", "ORG_ADMIN"],
  },
  {
    titleKey: "nav.sidebar.users",
    href: "/users",
    icon: Users,
    roles: ["SUPER_ADMIN", "ORG_OWNER", "ORG_ADMIN"],
  },
  {
    titleKey: "nav.sidebar.billing",
    href: "/billing",
    icon: CreditCard,
    roles: ["SUPER_ADMIN", "ORG_OWNER"],
  },
  {
    titleKey: "nav.sidebar.totems",
    href: "/totems",
    icon: Monitor,
    roles: ["SUPER_ADMIN"],
  },
  {
    titleKey: "nav.sidebar.settings",
    href: "/settings",
    icon: Settings,
    roles: ["SUPER_ADMIN", "ORG_OWNER", "ORG_ADMIN", "EVENT_MANAGER"],
  },
];

interface AppSidebarProps {
  user: {
    name: string;
    email: string;
    avatarUrl?: string | null;
    organizationName?: string;
    role?: Role;
  };
}

export function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useI18n();
  const role = user.role ?? "STAFF";

  const filteredNav = navItems.filter((item) => item.roles.includes(role));

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border px-4 py-3">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <ScanFace className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">OneID</span>
            <span className="text-xs text-muted-foreground">by Fivents</span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t("nav.sidebar.dashboard")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredNav.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith(item.href)}
                  >
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
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <div className="flex items-center justify-between px-2 py-1">
          <div className="flex items-center gap-1.5">
            <Shield className="h-3 w-3 text-muted-foreground" />
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
                    <AvatarFallback className="text-xs">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-1 flex-col text-left text-xs">
                    <span className="font-medium">{user.name}</span>
                    <span className="text-muted-foreground">
                      {user.organizationName ?? user.email}
                    </span>
                  </div>
                  <ChevronUp className="ml-auto h-4 w-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" className="w-56">
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    {t("nav.sidebar.settings")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {t("common.actions.logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
