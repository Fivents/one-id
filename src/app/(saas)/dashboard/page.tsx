import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { DashboardContent } from "./dashboard-content";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const membership = user.memberships[0];
  if (!membership) redirect("/login");

  const isSuperAdmin = membership.role === "SUPER_ADMIN";
  const orgId = membership.organizationId;

  const orgWhere = isSuperAdmin ? { deletedAt: null } : { organizationId: orgId, deletedAt: null };
  const checkInWhere = isSuperAdmin ? {} : { event: { organizationId: orgId } };

  const [
    eventCount,
    participantCount,
    totemCount,
    totalCheckIns,
    recentCheckIns,
    orgCount,
    userCount,
    recentEvents,
    eventsByStatus,
  ] = await Promise.all([
    db.event.count({ where: orgWhere }),
    db.participant.count({ where: orgWhere }),
    db.totem.count({ where: orgWhere }),
    db.checkIn.count({ where: checkInWhere }),
    db.checkIn.findMany({
      where: checkInWhere,
      include: {
        participant: { select: { name: true } },
        checkInPoint: { select: { name: true } },
        event: { select: { name: true } },
      },
      orderBy: { checkedInAt: "desc" },
      take: 10,
    }),
    isSuperAdmin ? db.organization.count({ where: { deletedAt: null } }) : Promise.resolve(0),
    isSuperAdmin ? db.user.count({ where: { deletedAt: null } }) : Promise.resolve(0),
    db.event.findMany({
      where: orgWhere,
      select: {
        id: true,
        name: true,
        status: true,
        startsAt: true,
        _count: { select: { participants: { where: { deletedAt: null } }, checkIns: true } },
      },
      orderBy: { startsAt: "desc" },
      take: 8,
    }),
    db.event.groupBy({
      by: ["status"],
      where: orgWhere,
      _count: true,
    }),
  ]);

  // Check-ins per day (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const recentCheckInsByDay = await db.checkIn.findMany({
    where: {
      ...checkInWhere,
      checkedInAt: { gte: sevenDaysAgo },
    },
    select: { checkedInAt: true },
    orderBy: { checkedInAt: "asc" },
  });

  // Aggregate check-ins by day
  const checkInsByDay: Record<string, number> = {};
  for (let i = 0; i < 7; i++) {
    const d = new Date(sevenDaysAgo);
    d.setDate(d.getDate() + i);
    checkInsByDay[d.toISOString().slice(0, 10)] = 0;
  }
  for (const ci of recentCheckInsByDay) {
    const day = ci.checkedInAt.toISOString().slice(0, 10);
    if (day in checkInsByDay) checkInsByDay[day]++;
  }

  const checkInChartData = Object.entries(checkInsByDay).map(([date, count]) => ({
    date,
    checkIns: count,
  }));

  const statusDistribution = eventsByStatus.map((g) => ({
    status: g.status,
    count: g._count,
  }));

  const topEvents = recentEvents.map((e) => ({
    name: e.name,
    participants: e._count.participants,
    checkIns: e._count.checkIns,
  }));

  // Organizations for audit log viewer (SUPER_ADMIN only)
  const orgsForAudit = isSuperAdmin
    ? await db.organization.findMany({
        where: { deletedAt: null },
        select: {
          id: true,
          name: true,
          events: {
            where: { deletedAt: null },
            select: { id: true, name: true },
            orderBy: { startsAt: "desc" },
            take: 20,
          },
        },
        orderBy: { name: "asc" },
      })
    : [];

  const stats: Record<string, number> = {
    organizations: orgCount,
    users: userCount,
    events: eventCount,
    participants: participantCount,
    totems: totemCount,
    checkIns: totalCheckIns,
  };

  const serializedCheckIns = recentCheckIns.map((c) => ({
    id: c.id,
    participant: c.participant,
    checkInPoint: c.checkInPoint,
    event: c.event,
    method: c.method,
    checkedInAt: c.checkedInAt.toISOString(),
  }));

  return (
    <DashboardContent
      isSuperAdmin={isSuperAdmin}
      stats={stats}
      userName={user.name}
      orgName={membership.organization.name}
      role={membership.role}
      recentCheckIns={serializedCheckIns}
      checkInChartData={checkInChartData}
      statusDistribution={statusDistribution}
      topEvents={topEvents}
      orgsForAudit={orgsForAudit}
    />
  );
}
