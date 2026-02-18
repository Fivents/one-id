"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { useConfirm } from "@/components/shared/confirm-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CreditCard,
  Calendar,
  Monitor,
  Users,
  DollarSign,
  Plus,
  Pencil,
  Trash2,
  ScanFace,
  QrCode,
  MapPin,
  Crown,
  Sparkles,
  Check,
  X,
  Building2,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

type PlanItem = {
  id: string;
  name: string;
  tier: string;
  description: string | null;
  price: number;
  maxEvents: number;
  maxParticipantsPerEvent: number;
  maxTotems: number;
  maxMembers: number;
  maxCheckInPointsPerEvent: number;
  allowFacial: boolean;
  allowQrCode: boolean;
  isCustom: boolean;
  isActive: boolean;
  sortOrder: number;
  subscriberCount: number;
};

type PlanRequest = {
  id: string;
  orgName: string;
  currentPlanName: string | null;
  requestedPlanName: string;
  status: string;
  message: string | null;
  createdAt: string;
};

type UsageData = {
  plan: string;
  events: { used: number; max: number };
  totems: { used: number; max: number };
  maxParticipantsPerEvent: number;
};

type BillingContentProps =
  | { isSuperAdmin: true; plans: PlanItem[]; requests: PlanRequest[] }
  | { isSuperAdmin: false; usage: UsageData };

const tierColors: Record<string, string> = {
  FREE: "from-gray-500/10 to-gray-600/5 border-gray-200 dark:border-gray-800",
  STARTER: "from-blue-500/10 to-blue-600/5 border-blue-200 dark:border-blue-800",
  PROFESSIONAL: "from-violet-500/10 to-violet-600/5 border-violet-200 dark:border-violet-800",
  ENTERPRISE: "from-amber-500/10 to-amber-600/5 border-amber-200 dark:border-amber-800",
  CUSTOM: "from-emerald-500/10 to-emerald-600/5 border-emerald-200 dark:border-emerald-800",
};

const tierIcons: Record<string, typeof Zap> = {
  FREE: Zap,
  STARTER: Zap,
  PROFESSIONAL: Crown,
  ENTERPRISE: Crown,
  CUSTOM: Sparkles,
};

const defaultPlanForm = {
  name: "",
  tier: "STARTER",
  description: "",
  price: 0,
  maxEvents: 5,
  maxParticipantsPerEvent: 200,
  maxTotems: 3,
  maxMembers: 10,
  maxCheckInPointsPerEvent: 3,
  allowFacial: true,
  allowQrCode: false,
  isCustom: false,
  isActive: true,
  sortOrder: 0,
};

export function BillingContent(props: BillingContentProps) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const { confirm } = useConfirm();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PlanItem | null>(null);
  const [form, setForm] = useState(defaultPlanForm);
  const [loading, setLoading] = useState(false);

  if (!props.isSuperAdmin) {
    const { usage } = props;
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">{t("billing.title")}</h1>
          <p className="text-muted-foreground">{t("billing.orgView.usageDescription")}</p>
        </div>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  {t("billing.orgView.currentPlan")}
                </CardTitle>
                <CardDescription>{t("billing.orgView.usageDescription")}</CardDescription>
              </div>
              <Badge className="text-base px-3 py-1">{usage.plan}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" /> {t("billing.orgView.events")}
                </div>
                <p className="mt-1 text-2xl font-bold">
                  {usage.events.used} <span className="text-base font-normal text-muted-foreground">/ {usage.events.max}</span>
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Monitor className="h-4 w-4" /> {t("billing.orgView.totems")}
                </div>
                <p className="mt-1 text-2xl font-bold">
                  {usage.totems.used} <span className="text-base font-normal text-muted-foreground">/ {usage.totems.max}</span>
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" /> {t("billing.orgView.participantsPerEvent")}
                </div>
                <p className="mt-1 text-2xl font-bold">{usage.maxParticipantsPerEvent}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { plans, requests } = props;

  function openCreateDialog() {
    setEditingPlan(null);
    setForm(defaultPlanForm);
    setDialogOpen(true);
  }

  function openEditDialog(plan: PlanItem) {
    setEditingPlan(plan);
    setForm({
      name: plan.name,
      tier: plan.tier,
      description: plan.description ?? "",
      price: plan.price,
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
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    setLoading(true);
    try {
      const url = editingPlan ? `/api/plans/${editingPlan.id}` : "/api/plans";
      const method = editingPlan ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          price: Number(form.price),
          maxEvents: Number(form.maxEvents),
          maxParticipantsPerEvent: Number(form.maxParticipantsPerEvent),
          maxTotems: Number(form.maxTotems),
          maxMembers: Number(form.maxMembers),
          maxCheckInPointsPerEvent: Number(form.maxCheckInPointsPerEvent),
          sortOrder: Number(form.sortOrder),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || t("billing.superAdmin.planSaveError"));
        return;
      }

      toast.success(editingPlan ? t("billing.superAdmin.planUpdated") : t("billing.superAdmin.planCreated"));
      setDialogOpen(false);
      router.refresh();
    } catch {
      toast.error(t("auth.login.connectionError"));
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(plan: PlanItem) {
    const ok = await confirm({
      title: t("billing.superAdmin.planDeleteTitle"),
      description: t("billing.superAdmin.planDeleteDescription").replace("{0}", plan.name),
      confirmLabel: t("common.actions.delete"),
      variant: "destructive",
    });
    if (!ok) return;

    const res = await fetch(`/api/plans/${plan.id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error || t("billing.superAdmin.planDeleteError"));
      return;
    }
    toast.success(t("billing.superAdmin.planDeleted"));
    router.refresh();
  }

  async function handleToggleActive(plan: PlanItem) {
    const res = await fetch(`/api/plans/${plan.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !plan.isActive }),
    });
    if (!res.ok) {
      toast.error(t("billing.superAdmin.planToggleError"));
      return;
    }
    toast.success(plan.isActive ? t("billing.superAdmin.planDeactivated") : t("billing.superAdmin.planActivated"));
    router.refresh();
  }

  async function handleResolveRequest(requestId: string, action: "APPROVED" | "REJECTED") {
    const res = await fetch("/api/plan-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId, action }),
    });
    if (!res.ok) {
      toast.error(t("billing.superAdmin.requestResolveError"));
      return;
    }
    toast.success(action === "APPROVED" ? t("billing.superAdmin.requestApproved") : t("billing.superAdmin.requestRejected"));
    router.refresh();
  }

  const pendingRequests = requests.filter((r) => r.status === "PENDING");
  const resolvedRequests = requests.filter((r) => r.status !== "PENDING");
  const localeMap: Record<string, string> = {
    pt: "pt-BR",
    en: "en-US",
    fr: "fr-FR",
    es: "es-ES",
    zh: "zh-CN",
  };
  const dateLocale = localeMap[locale] ?? "pt-BR";

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("billing.title")}</h1>
          <p className="text-muted-foreground">{t("billing.superAdmin.description")}</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          {t("billing.superAdmin.newPlan")}
        </Button>
      </div>

      {/* Plan Cards Grid */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {plans.map((plan) => {
          const TierIcon = tierIcons[plan.tier] ?? Zap;
          const gradient = tierColors[plan.tier] ?? tierColors.FREE;
          return (
            <Card
              key={plan.id}
              className={`relative overflow-hidden bg-linear-to-br ${gradient} transition-all hover:shadow-lg ${!plan.isActive ? "opacity-60" : ""}`}
            >
              {plan.isCustom && (
                <div className="absolute right-3 top-3">
                  <Badge variant="outline" className="bg-background/80 backdrop-blur-sm">
                    <Sparkles className="mr-1 h-3 w-3" />
                    {t("billing.superAdmin.customizable")}
                  </Badge>
                </div>
              )}
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <TierIcon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-[10px]">{plan.tier}</Badge>
                      <Badge variant={plan.isActive ? "default" : "destructive"} className="text-[10px]">
                        {plan.isActive ? t("common.status.active") : t("common.status.inactive")}
                      </Badge>
                    </div>
                  </div>
                </div>
                {plan.description && (
                  <CardDescription className="mt-2">{plan.description}</CardDescription>
                )}
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">
                    {plan.price === 0 ? t("billing.superAdmin.free") : `R$ ${plan.price.toFixed(2)}`}
                  </span>
                  {plan.price > 0 && <span className="text-sm text-muted-foreground">{t("billing.superAdmin.perMonth")}</span>}
                </div>

                <Separator />

                <div className="space-y-2.5 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" /> {t("billing.orgView.events")}
                    </span>
                    <span className="font-semibold">{plan.maxEvents}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-3.5 w-3.5" /> {t("billing.superAdmin.participantsPerEvent")}
                    </span>
                    <span className="font-semibold">{plan.maxParticipantsPerEvent.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Monitor className="h-3.5 w-3.5" /> {t("billing.orgView.totems")}
                    </span>
                    <span className="font-semibold">{plan.maxTotems}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-3.5 w-3.5" /> {t("billing.superAdmin.members")}
                    </span>
                    <span className="font-semibold">{plan.maxMembers}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" /> {t("billing.superAdmin.pointsPerEvent")}
                    </span>
                    <span className="font-semibold">{plan.maxCheckInPointsPerEvent}</span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    {plan.allowFacial ? (
                      <ScanFace className="h-4 w-4 text-green-500" />
                    ) : (
                      <X className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className={plan.allowFacial ? "" : "text-muted-foreground line-through"}>
                      {t("billing.superAdmin.facialRecognition")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {plan.allowQrCode ? (
                      <QrCode className="h-4 w-4 text-green-500" />
                    ) : (
                      <X className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className={plan.allowQrCode ? "" : "text-muted-foreground line-through"}>
                      {t("billing.superAdmin.qrCode")}
                    </span>
                  </div>
                </div>

                {plan.subscriberCount > 0 && (
                  <>
                    <Separator />
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Building2 className="h-3.5 w-3.5" />
                      {t("billing.superAdmin.subscriberCount").replace("{0}", String(plan.subscriberCount))}
                    </div>
                  </>
                )}
              </CardContent>

              <CardFooter className="flex gap-2 border-t bg-background/50 px-6 py-3">
                <Button variant="outline" size="sm" onClick={() => openEditDialog(plan)} className="flex-1">
                  <Pencil className="mr-1.5 h-3.5 w-3.5" />
                  {t("common.actions.edit")}
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleToggleActive(plan)} className="flex-1">
                  {plan.isActive ? t("users.labels.deactivate") : t("users.labels.activate")}
                </Button>
                {plan.subscriberCount === 0 && (
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(plan)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Pending Plan Change Requests */}
      {pendingRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              {t("billing.superAdmin.pendingRequests")} ({pendingRequests.length})
            </CardTitle>
            <CardDescription>{t("billing.superAdmin.pendingDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("common.labels.organization")}</TableHead>
                  <TableHead>{t("billing.superAdmin.currentPlan")}</TableHead>
                  <TableHead>{t("billing.superAdmin.requestedPlan")}</TableHead>
                  <TableHead>{t("billing.superAdmin.message")}</TableHead>
                  <TableHead>{t("common.labels.date")}</TableHead>
                  <TableHead className="text-right">{t("common.labels.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingRequests.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell className="font-medium">{req.orgName}</TableCell>
                    <TableCell><Badge variant="outline">{req.currentPlanName ?? "—"}</Badge></TableCell>
                    <TableCell><Badge>{req.requestedPlanName}</Badge></TableCell>
                    <TableCell className="max-w-48 truncate text-sm text-muted-foreground">{req.message || "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{new Date(req.createdAt).toLocaleDateString(dateLocale)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" onClick={() => handleResolveRequest(req.id, "APPROVED")}>
                          <Check className="mr-1 h-3.5 w-3.5" /> {t("billing.superAdmin.approve")}
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleResolveRequest(req.id, "REJECTED")}>
                          <X className="mr-1 h-3.5 w-3.5" /> {t("billing.superAdmin.reject")}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {resolvedRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("billing.superAdmin.requestHistory")} ({resolvedRequests.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("common.labels.organization")}</TableHead>
                  <TableHead>{t("billing.superAdmin.requestedPlan")}</TableHead>
                  <TableHead>{t("common.labels.status")}</TableHead>
                  <TableHead>{t("common.labels.date")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resolvedRequests.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell className="font-medium">{req.orgName}</TableCell>
                    <TableCell>{req.requestedPlanName}</TableCell>
                    <TableCell>
                      <Badge variant={req.status === "APPROVED" ? "default" : "destructive"}>
                        {req.status === "APPROVED" ? t("common.status.approved") : t("common.status.rejected")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{new Date(req.createdAt).toLocaleDateString(dateLocale)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Create / Edit Plan Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingPlan ? t("billing.superAdmin.editPlan") : t("billing.superAdmin.newPlan")}</DialogTitle>
            <DialogDescription>
              {editingPlan ? t("billing.superAdmin.editPlanDescription") : t("billing.superAdmin.newPlanDescription")}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("billing.superAdmin.planName")} *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Professional" />
              </div>
              <div className="space-y-2">
                <Label>{t("billing.superAdmin.tier")}</Label>
                <Select value={form.tier} onValueChange={(v) => setForm({ ...form, tier: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FREE">Free</SelectItem>
                    <SelectItem value="STARTER">Starter</SelectItem>
                    <SelectItem value="PROFESSIONAL">Professional</SelectItem>
                    <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
                    <SelectItem value="CUSTOM">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t("billing.superAdmin.planDescription")}</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder={t("billing.superAdmin.planDescriptionPlaceholder")} rows={2} />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>{t("billing.superAdmin.priceLabel")}</Label>
                <Input type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: +e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>{t("billing.superAdmin.sortOrder")}</Label>
                <Input type="number" min="0" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: +e.target.value })} />
              </div>
            </div>

            <Separator />
            <h4 className="text-sm font-medium">{t("billing.superAdmin.limits")}</h4>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>{t("billing.superAdmin.maxEventsLabel")}</Label>
                <Input type="number" min="1" value={form.maxEvents} onChange={(e) => setForm({ ...form, maxEvents: +e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>{t("billing.superAdmin.maxParticipantsLabel")}</Label>
                <Input type="number" min="1" value={form.maxParticipantsPerEvent} onChange={(e) => setForm({ ...form, maxParticipantsPerEvent: +e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>{t("billing.superAdmin.maxTotemsLabel")}</Label>
                <Input type="number" min="1" value={form.maxTotems} onChange={(e) => setForm({ ...form, maxTotems: +e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>{t("billing.superAdmin.maxMembersLabel")}</Label>
                <Input type="number" min="1" value={form.maxMembers} onChange={(e) => setForm({ ...form, maxMembers: +e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>{t("billing.superAdmin.checkInPointsLabel")}</Label>
                <Input type="number" min="1" value={form.maxCheckInPointsPerEvent} onChange={(e) => setForm({ ...form, maxCheckInPointsPerEvent: +e.target.value })} />
              </div>
            </div>

            <Separator />
            <h4 className="text-sm font-medium">{t("billing.superAdmin.featuresOptions")}</h4>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-accent">
                <input type="checkbox" checked={form.allowFacial} onChange={(e) => setForm({ ...form, allowFacial: e.target.checked })} className="h-4 w-4 rounded" />
                <div>
                  <p className="text-sm font-medium">{t("billing.superAdmin.facialRecognition")}</p>
                  <p className="text-xs text-muted-foreground">{t("billing.superAdmin.facialDescription")}</p>
                </div>
              </label>
              <label className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-accent">
                <input type="checkbox" checked={form.allowQrCode} onChange={(e) => setForm({ ...form, allowQrCode: e.target.checked })} className="h-4 w-4 rounded" />
                <div>
                  <p className="text-sm font-medium">{t("billing.superAdmin.qrCode")}</p>
                  <p className="text-xs text-muted-foreground">{t("billing.superAdmin.qrCodeDescription")}</p>
                </div>
              </label>
              <label className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-accent">
                <input type="checkbox" checked={form.isCustom} onChange={(e) => setForm({ ...form, isCustom: e.target.checked })} className="h-4 w-4 rounded" />
                <div>
                  <p className="text-sm font-medium">{t("billing.superAdmin.customPlan")}</p>
                  <p className="text-xs text-muted-foreground">{t("billing.superAdmin.customPlanDescription")}</p>
                </div>
              </label>
              <label className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-accent">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="h-4 w-4 rounded" />
                <div>
                  <p className="text-sm font-medium">{t("billing.superAdmin.activePlan")}</p>
                  <p className="text-xs text-muted-foreground">{t("billing.superAdmin.activeDescription")}</p>
                </div>
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{t("common.actions.cancel")}</Button>
            <Button onClick={handleSave} disabled={loading || !form.name}>
              {loading ? t("events.form.saving") : editingPlan ? t("events.form.saveChanges") : t("billing.superAdmin.createPlan")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
