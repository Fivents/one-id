import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Footer } from "@/components/layout/footer";
import { Separator } from "@/components/ui/separator";
import { NotificationBell } from "@/components/shared/notification-bell";
import { LanguageSwitcher } from "@/components/shared/language-switcher";

export default async function SaasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const primaryMembership = user.memberships[0];

  return (
    <SidebarProvider>
      <AppSidebar
        user={{
          name: user.name,
          email: user.email,
          avatarUrl: user.avatarUrl,
          organizationName: primaryMembership?.organization.name,
          role: primaryMembership?.role,
        }}
      />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4!" />
          <div className="ml-auto flex items-center gap-1">
            <LanguageSwitcher />
            <NotificationBell />
          </div>
        </header>
        <main className="flex-1 p-6">{children}</main>
        <Footer />
      </SidebarInset>
    </SidebarProvider>
  );
}
