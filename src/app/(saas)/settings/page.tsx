import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { SettingsContent } from "./settings-content";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const membership = user.memberships[0];

  return (
    <SettingsContent
      userName={user.name}
      userEmail={user.email}
      emailVerified={!!user.emailVerified}
      membership={
        membership
          ? { orgName: membership.organization.name, role: membership.role }
          : null
      }
    />
  );
}
