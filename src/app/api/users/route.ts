import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { hashSync } from "bcryptjs";
import { generateSetupToken } from "@/domain/auth";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const membership = user.memberships[0];
  if (!membership) return NextResponse.json({ error: "Sem organização" }, { status: 403 });

  const { searchParams } = request.nextUrl;
  const search = searchParams.get("search") || undefined;
  const role = searchParams.get("role") || undefined;
  const isActive = searchParams.get("isActive") === null ? undefined : searchParams.get("isActive") === "true";
  const orgId = searchParams.get("organizationId") || undefined;

  const isSuperAdmin = membership.role === "SUPER_ADMIN";

  if (isSuperAdmin) {
    const where: Record<string, unknown> = { deletedAt: null };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }
    if (isActive !== undefined) where.isActive = isActive;

    const users = await db.user.findMany({
      where,
      include: {
        memberships: {
          where: { isActive: true },
          include: { organization: { select: { id: true, name: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    let filtered = users;
    if (role) {
      filtered = users.filter((u) => u.memberships.some((m) => m.role === role));
    }
    if (orgId) {
      filtered = filtered.filter((u) => u.memberships.some((m) => m.organizationId === orgId));
    }

    return NextResponse.json({ success: true, data: filtered });
  }

  // ORG_OWNER / ORG_ADMIN: only org members
  const members = await db.membership.findMany({
    where: {
      organizationId: membership.organizationId,
      ...(search ? {
        user: {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        },
      } : {}),
      ...(role ? { role: role as never } : {}),
    },
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

  return NextResponse.json({ success: true, data: members });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const membership = user.memberships[0];
  if (!membership) return NextResponse.json({ error: "Sem organização" }, { status: 403 });

  const body = await request.json();
  const { name, email, role: userRole, organizationId } = body;

  if (!name || !email) {
    return NextResponse.json({ error: "Nome e e-mail são obrigatórios" }, { status: 400 });
  }

  const isSuperAdmin = membership.role === "SUPER_ADMIN";
  const targetOrgId = isSuperAdmin ? (organizationId || membership.organizationId) : membership.organizationId;
  const targetRole = isSuperAdmin ? (userRole || "STAFF") : (userRole || "STAFF");

  // Check if user already exists
  const existingUser = await db.user.findUnique({ where: { email } });

  if (existingUser) {
    const existingMembership = await db.membership.findUnique({
      where: { userId_organizationId: { userId: existingUser.id, organizationId: targetOrgId } },
    });

    if (existingMembership) {
      return NextResponse.json({ error: "Usuário já é membro desta organização" }, { status: 409 });
    }

    await db.membership.create({
      data: { userId: existingUser.id, organizationId: targetOrgId, role: targetRole },
    });

    return NextResponse.json({ success: true, data: existingUser }, { status: 201 });
  }

  // Create new user
  const newUser = await db.user.create({
    data: {
      name,
      email,
      mustSetPassword: true,
    },
  });

  // Generate setup token
  const setupToken = await generateSetupToken(newUser.id);

  // Create membership
  await db.membership.create({
    data: { userId: newUser.id, organizationId: targetOrgId, role: targetRole },
  });

  const setupUrl = `${process.env.NEXT_PUBLIC_APP_URL}/set-password?token=${setupToken}`;

  return NextResponse.json({
    success: true,
    data: { ...newUser, setupUrl },
  }, { status: 201 });
}
