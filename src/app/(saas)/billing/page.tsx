import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getUsage, getAllPlans, getPlanChangeRequests, seedDefaultPlans } from "@/domain/billing/billing.service";
import { BillingContent } from "./billing-content";

export default async function BillingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const membership = user.memberships[0];
  if (!membership) redirect("/login");

  const isSuperAdmin = membership.role === "SUPER_ADMIN";

  if (isSuperAdmin) {
    await seedDefaultPlans();
    const plans = await getAllPlans();
    const requests = await getPlanChangeRequests();

    const serializedPlans = plans.map((plan) => ({
      id: plan.id,
      name: plan.name,
      tier: plan.tier,
      description: plan.description,
      price: plan.price ? Number(plan.price) : 0,
      maxEvents: plan.maxEvents,
      maxParticipantsPerEvent: plan.maxParticipantsPerEvent,
      maxTotems: plan.maxTotems,
      maxMembers: plan.maxMembers,
      maxCheckInPointsPerEvent: plan.maxCheckInPointsPerEvent,
      allowFacial: plan.allowFacial,
      allowQrCode: plan.allowQrCode,
      isCustom: plan.isCustom,
      isActive: plan.isActive,
      sortOrder: plan.sortOrder,
      subscriberCount: plan._count.subscriptions,
    }));

    const serializedRequests = requests.map((req) => ({
      id: req.id,
      orgName: req.organization.name,
      currentPlanName: req.organization.subscription?.plan?.name ?? null,
      requestedPlanName: req.requestedPlan.name,
      status: req.status,
      message: req.message,
      createdAt: req.createdAt.toISOString(),
    }));

    return (
      <BillingContent
        isSuperAdmin
        plans={serializedPlans}
        requests={serializedRequests}
      />
    );
  }

  const usage = await getUsage(membership.organizationId);

  return <BillingContent isSuperAdmin={false} usage={usage} />;
}
