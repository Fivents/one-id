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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Plus,
  MapPin,
  Pencil,
  Trash2,
  Monitor,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import { useConfirm } from "@/components/shared/confirm-dialog";
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
  checkInPoint: { id: string; name: string };
};

export function CheckInPointsTab({
  eventId,
  checkInPoints,
  totems,
  maxCheckInPoints,
  userRole,
}: {
  eventId: string;
  checkInPoints: CheckInPoint[];
  totems: TotemData[];
  maxCheckInPoints: number;
  userRole: Role;
}) {
  const router = useRouter();
  const { t } = useI18n();
  const { confirm } = useConfirm();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CheckInPoint | null>(null);
  const [loading, setLoading] = useState(false);

  const canCreate = hasPermission(userRole, Permission.CHECKIN_POINT_CREATE);
  const canUpdate = hasPermission(userRole, Permission.CHECKIN_POINT_UPDATE);
  const canDelete = hasPermission(userRole, Permission.CHECKIN_POINT_DELETE);
  const isAtLimit = checkInPoints.length >= maxCheckInPoints;

  function getTotemsForPoint(pointId: string) {
    return totems.filter((t) => t.checkInPoint.id === pointId);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const name = form.get("name") as string;

    try {
      const res = await fetch(`/api/events/${eventId}/check-in-points`, {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing ? { id: editing.id, name } : { name }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || t("toast.errorOccurred"));
        return;
      }

      toast.success(editing ? t("toast.updated") : t("toast.created"));
      setDialogOpen(false);
      setEditing(null);
      router.refresh();
    } catch {
      toast.error(t("toast.errorOccurred"));
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(point: CheckInPoint) {
    const ok = await confirm({
      title: t("confirm.deleteTitle"),
      description: t("confirm.deleteDescription"),
      confirmLabel: t("common.actions.delete"),
      variant: "destructive",
    });
    if (!ok) return;

    try {
      const res = await fetch(`/api/events/${eventId}/check-in-points`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: point.id }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || t("toast.errorOccurred"));
        return;
      }

      toast.success(t("toast.deleted"));
      router.refresh();
    } catch {
      toast.error(t("toast.errorOccurred"));
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{t("events.detail.checkInPoints")}</h2>
          <p className="text-sm text-muted-foreground">
            {t("events.detail.planLimit").replace("{0}", String(checkInPoints.length)).replace("{1}", String(maxCheckInPoints))}
          </p>
        </div>
        {canCreate && (
          <Button
            size="sm"
            disabled={isAtLimit}
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            {t("events.detail.newPoint")}
          </Button>
        )}
      </div>

      {isAtLimit && canCreate && (
        <div className="flex items-center gap-2 rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm dark:border-yellow-900 dark:bg-yellow-950">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <span>{t("events.detail.planLimitUpgrade")}</span>
        </div>
      )}

      {/* Points grid */}
      {checkInPoints.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MapPin className="mb-4 h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {t("events.detail.noCheckInPoints")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {checkInPoints.map((point) => {
            const pointTotems = getTotemsForPoint(point.id);
            return (
              <Card key={point.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <MapPin className="h-4 w-4 text-primary" />
                        {point.name}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        <Badge variant={point.isActive ? "default" : "secondary"}>
                          {point.isActive
                            ? t("common.status.active")
                            : t("common.status.inactive")}
                        </Badge>
                      </CardDescription>
                    </div>
                    <div className="flex gap-1">
                      {canUpdate && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => {
                            setEditing(point);
                            setDialogOpen(true);
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleDelete(point)}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Monitor className="h-3.5 w-3.5" />
                    <span>
                      {pointTotems.length > 0
                        ? t("events.detail.totemLinked").replace("{0}", String(pointTotems.length)) + ": " + pointTotems.map((t) => t.name).join(", ")
                        : t("events.detail.noTotemLinked")}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? t("events.detail.editPoint") : t("events.detail.newPoint")}
            </DialogTitle>
            <DialogDescription>
              {t("events.detail.pointDescription")}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="point-name">{t("common.labels.name")} *</Label>
                <Input
                  id="point-name"
                  name="name"
                  required
                  minLength={2}
                  placeholder="Ex: Entrada Principal"
                  defaultValue={editing?.name ?? ""}
                />
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
                {loading ? t("common.actions.loading") : t("common.actions.save")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
