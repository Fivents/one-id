import { db } from "@/lib/db";
import type { CreateOrganizationInput, UpdateOrganizationInput } from "./organization.schema";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function createOrganization(input: CreateOrganizationInput, planId?: string) {
  let slug = generateSlug(input.name);
  const existing = await db.organization.findUnique({ where: { slug } });
  if (existing) slug = `${slug}-${Date.now().toString(36)}`;

  const org = await db.$transaction(async (tx) => {
    const organization = await tx.organization.create({
      data: { name: input.name, slug, document: input.document, email: input.email, phone: input.phone },
    });

    if (planId) {
      await tx.subscription.create({
        data: { organizationId: organization.id, planId, startsAt: new Date() },
      });
    }

    return organization;
  });

  return org;
}

export async function getOrganizationById(id: string) {
  return db.organization.findFirst({
    where: { id, deletedAt: null },
    include: {
      subscription: { include: { plan: true } },
      _count: {
        select: {
          events: { where: { deletedAt: null } },
          memberships: { where: { isActive: true } },
          totems: { where: { deletedAt: null } },
        },
      },
    },
  });
}

export async function updateOrganization(id: string, input: UpdateOrganizationInput) {
  return db.organization.update({
    where: { id, deletedAt: null },
    data: input,
  });
}

export async function deleteOrganization(id: string) {
  return db.organization.update({
    where: { id },
    data: { deletedAt: new Date(), isActive: false },
  });
}

export async function toggleOrganizationActive(id: string, isActive: boolean) {
  return db.$transaction(async (tx) => {
    const org = await tx.organization.update({
      where: { id },
      data: { isActive },
    });

    // Reflect on all memberships
    await tx.membership.updateMany({
      where: { organizationId: id },
      data: { isActive },
    });

    return org;
  });
}

export async function getAllOrganizations(filters?: {
  search?: string;
  isActive?: boolean;
}) {
  const where: Record<string, unknown> = { deletedAt: null };

  if (filters?.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { email: { contains: filters.search, mode: "insensitive" } },
      { slug: { contains: filters.search, mode: "insensitive" } },
      { document: { contains: filters.search } },
    ];
  }

  if (filters?.isActive !== undefined) {
    where.isActive = filters.isActive;
  }

  return db.organization.findMany({
    where,
    include: {
      subscription: { include: { plan: true } },
      _count: {
        select: {
          events: { where: { deletedAt: null } },
          memberships: { where: { isActive: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getOrganizationMembers(organizationId: string) {
  return db.membership.findMany({
    where: { organizationId, isActive: true },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
          isActive: true,
          createdAt: true,
          mustSetPassword: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });
}
