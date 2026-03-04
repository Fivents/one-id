import { ReactNode } from 'react';

import { redirect } from 'next/navigation';

import { AppSidebar } from '@/components/shared/app-sidebar';
import { LanguageSwitcher } from '@/components/shared/language-switcher';
import { Separator } from '@/components/ui/separator';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';

export default async function SaasLayout({ children }: { children: ReactNode }) {
  const user = {
    id: '123',
    name: 'John Doe',
    email: 'johndoe@example.com',
    avatarUrl: '',
    organization: {
      id: 'org-123',
      name: 'Example Organization',
    },
    role: 'SUPER_ADMIN' as const,
  };

  if (!user) redirect('/login');

  return (
    <SidebarProvider>
      <AppSidebar
        user={{
          name: user.name,
          email: user.email,
          avatarUrl: user.avatarUrl,
          organizationName: user.organization.name,
          role: user.role,
        }}
      />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4!" />
          <div className="ml-auto flex items-center gap-1">
            <LanguageSwitcher />
            {/* <NotificationBell /> */}
          </div>
        </header>
        <main className="flex-1 p-6">{children}</main>
        {/* <Footer /> */}
      </SidebarInset>
    </SidebarProvider>
  );
}
