import { db } from "@/lib/db";

export async function getNotifications(userId: string, limit = 20) {
  return db.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getUnreadCount(userId: string) {
  return db.notification.count({
    where: { userId, read: false },
  });
}

export async function markAsRead(notificationId: string, userId: string) {
  return db.notification.updateMany({
    where: { id: notificationId, userId },
    data: { read: true },
  });
}

export async function markAllAsRead(userId: string) {
  return db.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });
}

export async function createNotification(input: {
  userId: string;
  type: "PLAN_REQUEST" | "PLAN_APPROVED" | "PLAN_REJECTED" | "LIMIT_WARNING" | "EXPIRATION_WARNING" | "NEW_MEMBER" | "EVENT_CREATED" | "SYSTEM_MESSAGE";
  title: string;
  message: string;
  data?: string;
}) {
  return db.notification.create({ data: input });
}

export async function notifyUsersByRole(
  role: "SUPER_ADMIN" | "ORG_OWNER" | "ORG_ADMIN" | "EVENT_MANAGER" | "STAFF",
  notification: {
    type: "PLAN_REQUEST" | "PLAN_APPROVED" | "PLAN_REJECTED" | "LIMIT_WARNING" | "EXPIRATION_WARNING" | "NEW_MEMBER" | "EVENT_CREATED" | "SYSTEM_MESSAGE";
    title: string;
    message: string;
    data?: string;
  },
  organizationId?: string,
) {
  const where: Record<string, unknown> = { role, isActive: true };
  if (organizationId) where.organizationId = organizationId;

  const memberships = await db.membership.findMany({
    where,
    select: { userId: true },
  });

  if (memberships.length === 0) return;

  await db.notification.createMany({
    data: memberships.map((m) => ({
      userId: m.userId,
      ...notification,
    })),
  });
}

export async function deleteNotification(notificationId: string, userId: string) {
  return db.notification.deleteMany({
    where: { id: notificationId, userId },
  });
}
