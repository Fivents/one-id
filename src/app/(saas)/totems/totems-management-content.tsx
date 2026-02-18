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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Monitor,
  Wifi,
  WifiOff,
  Wrench,
  MoreHorizontal,
  Power,
  Trash2,
  History,
  ScanFace,
  Building2,
  Calendar,
  MapPin,
} from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import { useConfirm } from "@/components/shared/confirm-dialog";

type TotemData = {
  id: string;
  name: string;
  status: string;
  isActive: boolean;
  lastHeartbeat: string | null;
  createdAt: string;
  organization: { id: string; name: string };
  event: { id: string; name: string; status: string };
  checkInPoint: { id: string; name: string };
  checkInsCount: number;
};

const statusConfig: Record<
  string,
  { variant: "default" | "secondary" | "destructive"; icon: typeof Wifi }
> = {
  ONLINE: { variant: "default", icon: Wifi },
  OFFLINE: { variant: "secondary", icon: WifiOff },
  MAINTENANCE: { variant: "destructive", icon: Wrench },
};

export function TotemsManagementContent({
  totems: initialTotems,
}: {
  totems: TotemData[];
}) {
  const router = useRouter();
  const { t, locale } = useI18n();
  const { confirm } = useConfirm();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [detailTotem, setDetailTotem] = useState<TotemData | null>(null);
  const [historyTotem, setHistoryTotem] = useState<{
    totem: TotemData;
    checkIns: Array<{
      id: string;
      checkedInAt: string;
      method: string;
      participant: { name: string; company: string | null };
      checkInPoint: { name: string };
    }>;
  } | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

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

  const filtered = initialTotems.filter((t) => {
    if (search) {
      const q = search.toLowerCase();
      const matches =
        t.name.toLowerCase().includes(q) ||
        t.organization.name.toLowerCase().includes(q) ||
        t.event.name.toLowerCase().includes(q) ||
        t.checkInPoint.name.toLowerCase().includes(q);
      if (!matches) return false;
    }
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (activeFilter === "active" && !t.isActive) return false;
    if (activeFilter === "inactive" && t.isActive) return false;
    return true;
  });

  const stats = {
    total: initialTotems.length,
    online: initialTotems.filter((t) => t.status === "ONLINE").length,
    offline: initialTotems.filter((t) => t.status === "OFFLINE").length,
    inactive: initialTotems.filter((t) => !t.isActive).length,
    totalCheckIns: initialTotems.reduce((sum, t) => sum + t.checkInsCount, 0),
  };

  async function handleToggleActive(totem: TotemData) {
    const action = totem.isActive
      ? t("totemManagement.actions.deactivate")
      : t("totemManagement.actions.activate");

    const ok = await confirm({
      title: `${action} "${totem.name}"`,
      description: totem.isActive
        ? t("totemManagement.confirmDeactivate")
        : t("totemManagement.confirmActivate"),
      confirmLabel: action,
      variant: totem.isActive ? "destructive" : "default",
    });
    if (!ok) return;

    try {
      const res = await fetch(`/api/totems/${totem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle_active" }),
      });
      if (res.ok) {
        toast.success(t("toast.updated"));
        router.refresh();
      } else {
        const data = await res.json().catch(() => null);
        toast.error(data?.error ?? t("toast.errorOccurred"));
      }
    } catch {
      toast.error(t("toast.errorOccurred"));
    }
  }

  async function handleDelete(totem: TotemData) {
    const ok = await confirm({
      title: t("confirm.deleteTitle"),
      description: t("confirm.deleteDescription"),
      confirmLabel: t("common.actions.delete"),
      variant: "destructive",
      requireText: totem.name,
    });
    if (!ok) return;

    try {
      const res = await fetch(`/api/totems/${totem.id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success(t("toast.deleted"));
        router.refresh();
      } else {
        const data = await res.json().catch(() => null);
        toast.error(data?.error ?? t("toast.errorOccurred"));
      }
    } catch {
      toast.error(t("toast.errorOccurred"));
    }
  }

  async function handleViewHistory(totem: TotemData) {
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/totems/${totem.id}`);
      if (res.ok) {
        const data = await res.json();
        setHistoryTotem({
          totem,
          checkIns: data.data.checkIns ?? [],
        });
      } else {
        toast.error(t("toast.errorOccurred"));
      }
    } catch {
      toast.error(t("toast.errorOccurred"));
    } finally {
      setLoadingHistory(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">{t("totemManagement.title")}</h1>
        <p className="text-muted-foreground">{t("totemManagement.description")}</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("totemManagement.stats.total")}
            </CardTitle>
            <Monitor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Online</CardTitle>
            <Wifi className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.online}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Offline</CardTitle>
            <WifiOff className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.offline}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("common.status.inactive")}
            </CardTitle>
            <Power className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.inactive}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Check-ins</CardTitle>
            <ScanFace className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCheckIns}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("common.actions.search") + "..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("common.labels.all")}</SelectItem>
            <SelectItem value="ONLINE">Online</SelectItem>
            <SelectItem value="OFFLINE">Offline</SelectItem>
            <SelectItem value="MAINTENANCE">{t("totemManagement.status.maintenance")}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={activeFilter} onValueChange={setActiveFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("common.labels.all")}</SelectItem>
            <SelectItem value="active">{t("common.status.active")}</SelectItem>
            <SelectItem value="inactive">{t("common.status.inactive")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Monitor className="mb-4 h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {t("totemManagement.noTotems")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("common.labels.name")}</TableHead>
                  <TableHead className="hidden md:table-cell">
                    {t("common.labels.organization")}
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">
                    {t("totemManagement.columns.event")}
                  </TableHead>
                  <TableHead className="hidden xl:table-cell">
                    {t("totemManagement.columns.checkInPoint")}
                  </TableHead>
                  <TableHead>{t("common.labels.status")}</TableHead>
                  <TableHead className="hidden sm:table-cell">Check-ins</TableHead>
                  <TableHead className="hidden lg:table-cell">
                    {t("totemManagement.columns.lastSignal")}
                  </TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((totem) => {
                  const cfg =
                    statusConfig[totem.status] ?? statusConfig.OFFLINE;
                  const StatusIcon = cfg.icon;
                  return (
                    <TableRow
                      key={totem.id}
                      className={!totem.isActive ? "opacity-50" : ""}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Monitor className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{totem.name}</p>
                            {!totem.isActive && (
                              <Badge variant="destructive" className="mt-0.5 text-[10px]">
                                {t("common.status.inactive")}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex items-center gap-1 text-sm">
                          <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                          {totem.organization.name}
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          {totem.event.name}
                        </div>
                      </TableCell>
                      <TableCell className="hidden xl:table-cell">
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                          {totem.checkInPoint.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={cfg.variant} className="gap-1">
                          <StatusIcon className="h-3 w-3" />
                          {totem.status === "MAINTENANCE"
                            ? t("totemManagement.status.maintenance")
                            : totem.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant="outline">{totem.checkInsCount}</Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <span className="text-xs text-muted-foreground">
                          {totem.lastHeartbeat
                            ? new Date(totem.lastHeartbeat).toLocaleString(
                                dateLocale
                              )
                            : "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => setDetailTotem(totem)}
                            >
                              <Monitor className="mr-2 h-4 w-4" />
                              {t("totemManagement.actions.viewDetails")}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleViewHistory(totem)}
                              disabled={loadingHistory}
                            >
                              <History className="mr-2 h-4 w-4" />
                              {t("totemManagement.actions.viewHistory")}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleToggleActive(totem)}
                            >
                              <Power className="mr-2 h-4 w-4" />
                              {totem.isActive
                                ? t("totemManagement.actions.deactivate")
                                : t("totemManagement.actions.activate")}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDelete(totem)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              {t("common.actions.delete")}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Details Dialog */}
      <Dialog open={!!detailTotem} onOpenChange={() => setDetailTotem(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              {detailTotem?.name}
            </DialogTitle>
            <DialogDescription>
              {t("totemManagement.detailsDescription")}
            </DialogDescription>
          </DialogHeader>
          {detailTotem && (
            <div className="space-y-3 py-2">
              <InfoRow label="ID" value={detailTotem.id} />
              <InfoRow
                label={t("common.labels.organization")}
                value={detailTotem.organization.name}
              />
              <InfoRow
                label={t("totemManagement.columns.event")}
                value={detailTotem.event.name}
              />
              <InfoRow
                label={t("totemManagement.columns.checkInPoint")}
                value={detailTotem.checkInPoint.name}
              />
              <InfoRow
                label={t("common.labels.status")}
                value={
                  <Badge
                    variant={
                      (statusConfig[detailTotem.status] ?? statusConfig.OFFLINE)
                        .variant
                    }
                  >
                    {detailTotem.status}
                  </Badge>
                }
              />
              <InfoRow
                label={t("common.status.active")}
                value={
                  <Badge
                    variant={
                      detailTotem.isActive ? "default" : "destructive"
                    }
                  >
                    {detailTotem.isActive
                      ? t("common.status.active")
                      : t("common.status.inactive")}
                  </Badge>
                }
              />
              <InfoRow
                label="Check-ins"
                value={String(detailTotem.checkInsCount)}
              />
              <InfoRow
                label={t("totemManagement.columns.lastSignal")}
                value={
                  detailTotem.lastHeartbeat
                    ? new Date(detailTotem.lastHeartbeat).toLocaleString(
                        dateLocale
                      )
                    : "—"
                }
              />
              <InfoRow
                label={t("totemManagement.columns.createdAt")}
                value={new Date(detailTotem.createdAt).toLocaleDateString(
                  dateLocale
                )}
              />
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setDetailTotem(null)}>
              {t("common.actions.close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={!!historyTotem} onOpenChange={() => setHistoryTotem(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              {t("totemManagement.history.title")} — {historyTotem?.totem.name}
            </DialogTitle>
            <DialogDescription>
              {t("totemManagement.history.description")}
            </DialogDescription>
          </DialogHeader>
          {historyTotem && (
            <div className="max-h-96 overflow-y-auto py-2">
              {historyTotem.checkIns.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  {t("totemManagement.history.noCheckIns")}
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("totemManagement.history.participant")}</TableHead>
                      <TableHead>{t("totemManagement.history.company")}</TableHead>
                      <TableHead>{t("totemManagement.history.method")}</TableHead>
                      <TableHead>{t("totemManagement.history.dateTime")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {historyTotem.checkIns.map((ci) => (
                      <TableRow key={ci.id}>
                        <TableCell className="font-medium">
                          {ci.participant.name}
                        </TableCell>
                        <TableCell>{ci.participant.company ?? "—"}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{ci.method}</Badge>
                        </TableCell>
                        <TableCell className="text-xs">
                          {new Date(ci.checkedInAt).toLocaleString(dateLocale)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setHistoryTotem(null)}>
              {t("common.actions.close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between rounded-md border px-3 py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}
