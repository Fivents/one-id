"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Plus,
  Monitor,
  Wifi,
  WifiOff,
  Wrench,
  ScanFace,
  Copy,
  AlertTriangle,
  Key,
} from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import { hasPermission, Permission } from "@/lib/permissions";
import type { Role } from "@/generated/prisma/client";

type CheckInPoint = {
  id: string;
  name: string;
  isActive: boolean;
};

type TotemData = {
  id: string;
  name: string;
  status: string;
  lastHeartbeat: string | null;
  checkInPoint: { id: string; name: string };
  _count: { checkIns: number };
};

const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive"; icon: typeof Wifi; labelKey: string }> = {
  ONLINE: { variant: "default", icon: Wifi, labelKey: "Online" },
  OFFLINE: { variant: "secondary", icon: WifiOff, labelKey: "Offline" },
  MAINTENANCE: { variant: "destructive", icon: Wrench, labelKey: "totemManagement.status.maintenance" },
};

export function TotemsTab({
  eventId,
  totems,
  checkInPoints,
  maxTotems,
  userRole,
}: {
  eventId: string;
  totems: TotemData[];
  checkInPoints: CheckInPoint[];
  maxTotems: number;
  userRole: Role;
}) {
  const router = useRouter();
  const { t, locale } = useI18n();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiKeyDialog, setApiKeyDialog] = useState<{ name: string; apiKey: string } | null>(null);

  const dateLocale =
    locale === "pt"
      ? "pt-BR"
      : locale === "en"
        ? "en-US"
        : locale === "fr"
          ? "fr-FR"
          : locale === "es"
            ? "es-ES"
            : "zh-CN";

  const canCreate = hasPermission(userRole, Permission.TOTEM_CREATE);
  const isAtLimit = totems.length >= maxTotems;

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const body = {
      name: form.get("name") as string,
      checkInPointId: form.get("checkInPointId") as string,
    };

    try {
      const res = await fetch(`/api/events/${eventId}/totems`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = await res.json();
        setDialogOpen(false);
        setApiKeyDialog({ name: body.name, apiKey: data.data.apiKey });
        router.refresh();
      } else {
        const err = await res.json().catch(() => null);
        toast.error(err?.error ?? t("toast.errorOccurred"));
      }
    } catch {
      toast.error(t("toast.errorOccurred"));
    } finally {
      setLoading(false);
    }
  }

  function copyApiKey() {
    if (apiKeyDialog?.apiKey) {
      navigator.clipboard.writeText(apiKeyDialog.apiKey);
      toast.success(t("events.detail.copied"));
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{t("events.detail.totems")}</h2>
          <p className="text-sm text-muted-foreground">
            {t("events.detail.planLimit").replace("{0}", String(totems.length)).replace("{1}", String(maxTotems))}
          </p>
        </div>
        {canCreate && (
          <Button
            size="sm"
            disabled={isAtLimit || checkInPoints.length === 0}
            onClick={() => setDialogOpen(true)}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            {t("events.detail.newTotem")}
          </Button>
        )}
      </div>

      {isAtLimit && canCreate && (
        <div className="flex items-center gap-2 rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm dark:border-yellow-900 dark:bg-yellow-950">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <span>{t("events.detail.planLimitReached")}</span>
        </div>
      )}

      {checkInPoints.length === 0 && canCreate && (
        <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm dark:border-blue-900 dark:bg-blue-950">
          <AlertTriangle className="h-4 w-4 text-blue-600" />
          <span>{t("events.detail.createPointsFirst")}</span>
        </div>
      )}

      {/* Totems grid */}
      {totems.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Monitor className="mb-4 h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {t("events.detail.noTotems")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {totems.map((totem) => {
            const config = statusConfig[totem.status] ?? statusConfig.OFFLINE;
            const StatusIcon = config.icon;
            return (
              <Card key={totem.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Monitor className="h-4 w-4" />
                        {totem.name}
                      </CardTitle>
                      <CardDescription className="mt-1 text-xs">
                        ID: {totem.id.slice(0, 12)}...
                      </CardDescription>
                    </div>
                    <Badge variant={config.variant} className="gap-1">
                      <StatusIcon className="h-3 w-3" />
                      {config.labelKey.startsWith("totemManagement.") ? t(config.labelKey) : config.labelKey}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 pt-0">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t("events.detail.point")}:</span>
                    <span className="font-medium">{totem.checkInPoint.name}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Check-ins:</span>
                    <span className="font-medium">{totem._count.checkIns}</span>
                  </div>
                  {totem.lastHeartbeat && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{t("totemManagement.columns.lastSignal")}:</span>
                      <span className="text-xs">
                        {new Date(totem.lastHeartbeat).toLocaleString(dateLocale)}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("events.detail.newTotem")}</DialogTitle>
            <DialogDescription>
              {t("events.detail.apiKeyDescription")}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="totem-name">{t("common.labels.name")} *</Label>
                <Input
                  id="totem-name"
                  name="name"
                  required
                  minLength={2}
                  placeholder="Ex: Totem Entrada 1"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="checkpoint">{t("events.detail.checkInPoints")} *</Label>
                <Select name="checkInPointId" required>
                  <SelectTrigger>
                    <SelectValue placeholder={t("events.detail.checkInPoints")} />
                  </SelectTrigger>
                  <SelectContent>
                    {checkInPoints
                      .filter((cp) => cp.isActive)
                      .map((cp) => (
                        <SelectItem key={cp.id} value={cp.id}>
                          {cp.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                {t("common.actions.cancel")}
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? t("common.actions.loading") : t("common.actions.create")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* API Key Reveal Dialog */}
      <Dialog open={!!apiKeyDialog} onOpenChange={() => setApiKeyDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              {t("events.detail.apiKeyTitle")}
            </DialogTitle>
            <DialogDescription>
              {t("events.detail.apiKeyDescription")}
            </DialogDescription>
          </DialogHeader>
          {apiKeyDialog && (
            <div className="space-y-4 py-4">
              <p className="text-sm font-medium">Totem: {apiKeyDialog.name}</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded-md border bg-muted/50 p-3 font-mono text-sm break-all">
                  {apiKeyDialog.apiKey}
                </code>
                <Button variant="outline" size="icon" onClick={copyApiKey}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm dark:border-yellow-900 dark:bg-yellow-950">
                <ScanFace className="h-4 w-4 text-yellow-600" />
                <span>{t("events.detail.apiKeyWarning")}</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setApiKeyDialog(null)}>{t("events.detail.understood")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
