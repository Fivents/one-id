import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getAllTotems } from "@/domain/totem";
import { TotemsManagementContent } from "./totems-management-content";

export default async function TotemsManagementPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const membership = user.memberships[0];
  if (!membership) redirect("/login");

  if (membership.role !== "SUPER_ADMIN") {
    redirect("/dashboard");
  }

  const totems = await getAllTotems();

  const serialized = totems.map((t) => ({
    id: t.id,
    name: t.name,
    status: t.status,
    isActive: t.isActive,
    lastHeartbeat: t.lastHeartbeat?.toISOString() ?? null,
    createdAt: t.createdAt.toISOString(),
    organization: t.organization,
    event: t.event,
    checkInPoint: t.checkInPoint,
    checkInsCount: t._count.checkIns,
  }));

  return <TotemsManagementContent totems={serialized} />;
}
