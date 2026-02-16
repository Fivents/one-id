import { db } from "@/lib/db";
import type { CreatePlanInput, UpdatePlanInput } from "./billing.schema";

// ============================================
// PLANS (SUPER_ADMIN)
// ============================================

export async function getAllPlans() {
  return db.plan.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { subscriptions: true } } },
  });
}

export async function getActivePlans() {
  return db.plan.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
}

export async function getPlanById(id: string) {
  return db.plan.findUnique({
    where: { id },
    include: { _count: { select: { subscriptions: true } } },
  });
}

export async function createPlan(input: CreatePlanInput) {
  return db.plan.create({ data: input });
}

export async function updatePlan(id: string, input: UpdatePlanInput) {
  return db.plan.update({ where: { id }, data: input });
}

export async function deletePlan(id: string) {
  const plan = await db.plan.findUnique({
    where: { id },
    include: { _count: { select: { subscriptions: true } } },
  });

  if (!plan) return { error: "Plano não encontrado" };
  if (plan._count.subscriptions > 0) {
    return { error: "Plano possui organizações vinculadas. Desative-o ao invés de excluir." };
  }

  await db.plan.delete({ where: { id } });
  return { success: true };
}

// ============================================
// SUBSCRIPTIONS
// ============================================

export async function getSubscription(organizationId: string) {
  return db.subscription.findUnique({
    where: { organizationId },
    include: { plan: true },
  });
}

export async function getUsage(organizationId: string) {
  const [events, totems, members, subscription] = await Promise.all([
    db.event.count({
      where: { organizationId, deletedAt: null, status: { not: "CANCELLED" } },
    }),
    db.totem.count({
      where: { organizationId, deletedAt: null },
    }),
    db.membership.count({
      where: { organizationId, isActive: true },
    }),
    db.subscription.findUnique({
      where: { organizationId },
      include: { plan: true },
    }),
  ]);

  const plan = subscription?.plan;

  return {
    events: { used: events, max: plan?.maxEvents ?? 1 },
    totems: { used: totems, max: plan?.maxTotems ?? 1 },
    members: { used: members, max: plan?.maxMembers ?? 5 },
    maxParticipantsPerEvent: plan?.maxParticipantsPerEvent ?? 100,
    maxCheckInPointsPerEvent: plan?.maxCheckInPointsPerEvent ?? 1,
    plan: plan?.name ?? "Sem plano",
    planTier: plan?.tier ?? "FREE",
  };
}

export async function assignPlanToOrganization(organizationId: string, planId: string) {
  const existing = await db.subscription.findUnique({ where: { organizationId } });

  if (existing) {
    return db.subscription.update({
      where: { organizationId },
      data: { planId },
    });
  }

  return db.subscription.create({
    data: {
      organizationId,
      planId,
      startsAt: new Date(),
    },
  });
}

// ============================================
// PLAN CHANGE REQUESTS
// ============================================

export async function requestPlanChange(organizationId: string, requestedPlanId: string, message?: string) {
  const pending = await db.planChangeRequest.findFirst({
    where: { organizationId, status: "PENDING" },
  });

  if (pending) {
    return { error: "Já existe uma solicitação pendente" };
  }

  return db.planChangeRequest.create({
    data: { organizationId, requestedPlanId, message },
  });
}

export async function getPlanChangeRequests(status?: "PENDING" | "APPROVED" | "REJECTED") {
  const requests = await db.planChangeRequest.findMany({
    where: status ? { status } : undefined,
    include: {
      organization: { include: { subscription: { include: { plan: true } } } },
      requestedPlan: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return requests as (typeof requests[number] & {
    organization: { name: string; subscription?: { plan?: { name: string } | null } | null };
    requestedPlan: { name: string };
  })[];
}

export async function resolvePlanChangeRequest(
  requestId: string,
  action: "APPROVED" | "REJECTED",
  resolvedById: string,
  resolvedNote?: string
) {
  const request = await db.planChangeRequest.findUnique({ where: { id: requestId } });
  if (!request || request.status !== "PENDING") {
    return { error: "Solicitação não encontrada ou já resolvida" };
  }

  const updated = await db.planChangeRequest.update({
    where: { id: requestId },
    data: { status: action, resolvedAt: new Date(), resolvedById, resolvedNote },
  });

  if (action === "APPROVED") {
    await assignPlanToOrganization(request.organizationId, request.requestedPlanId);
  }

  return updated;
}

// ============================================
// SEED DEFAULT PLANS
// ============================================

export async function seedDefaultPlans() {
  const count = await db.plan.count();
  if (count > 0) return;

  await db.plan.createMany({
    data: [
      {
        name: "Free",
        tier: "FREE",
        description: "Plano gratuito para começar",
        price: 0,
        maxEvents: 1,
        maxParticipantsPerEvent: 50,
        maxTotems: 1,
        maxMembers: 3,
        maxCheckInPointsPerEvent: 1,
        allowFacial: true,
        allowQrCode: false,
        sortOrder: 0,
      },
      {
        name: "Starter",
        tier: "STARTER",
        description: "Ideal para pequenos eventos",
        price: 199,
        maxEvents: 5,
        maxParticipantsPerEvent: 200,
        maxTotems: 3,
        maxMembers: 10,
        maxCheckInPointsPerEvent: 3,
        allowFacial: true,
        allowQrCode: true,
        sortOrder: 1,
      },
      {
        name: "Professional",
        tier: "PROFESSIONAL",
        description: "Para organizações em crescimento",
        price: 499,
        maxEvents: 20,
        maxParticipantsPerEvent: 1000,
        maxTotems: 10,
        maxMembers: 30,
        maxCheckInPointsPerEvent: 10,
        allowFacial: true,
        allowQrCode: true,
        sortOrder: 2,
      },
      {
        name: "Enterprise",
        tier: "ENTERPRISE",
        description: "Para grandes operações",
        price: 999,
        maxEvents: 100,
        maxParticipantsPerEvent: 10000,
        maxTotems: 50,
        maxMembers: 100,
        maxCheckInPointsPerEvent: 50,
        allowFacial: true,
        allowQrCode: true,
        sortOrder: 3,
      },
      {
        name: "Personalizado",
        tier: "CUSTOM",
        description: "Plano sob medida para sua necessidade",
        price: 0,
        maxEvents: 10,
        maxParticipantsPerEvent: 500,
        maxTotems: 5,
        maxMembers: 20,
        maxCheckInPointsPerEvent: 5,
        allowFacial: true,
        allowQrCode: true,
        isCustom: true,
        sortOrder: 4,
      },
    ],
  });
}
