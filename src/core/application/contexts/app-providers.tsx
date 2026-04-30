'use client';

import { AppProvider } from './app-context';
import { AuthProvider } from './auth-context';
import { NotificationsProvider } from './notifications-context';
import { OrganizationProvider } from './organization-context';
import { PermissionsProvider } from './permissions-context';
import { TotemProvider } from './totem-context';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <OrganizationProvider>
        <PermissionsProvider>
          <NotificationsProvider>
            <TotemProvider>
              <AppProvider>{children}</AppProvider>
            </TotemProvider>
          </NotificationsProvider>
        </PermissionsProvider>
      </OrganizationProvider>
    </AuthProvider>
  );
}
