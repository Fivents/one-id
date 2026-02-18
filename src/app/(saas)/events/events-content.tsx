"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { useConfirm } from "@/components/shared/confirm-dialog";
import { exportToExcel, exportToPDF, type ExportColumn } from "@/lib/export";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Calendar,
  MapPin,
  Users,
  Monitor,
  ScanFace,
  Plus,
  Pencil,
  Trash2,
  MoreHorizontal,
  Search,
  LayoutGrid,
  List,
  FileDown,
  FileSpreadsheet,
  Eye,
  Building2,
} from "lucide-react";
import { toast } from "sonner";

type EventItem = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  startsAt: string;
  endsAt: string;
  location: string | null;
  maxParticipants: number | null;
  organizationId: string;
  organizationName?: string;
  _count: {
    participants: number;
    totems: number;
    checkIns: number;
  };
};

type Organization = {
  id: string;
  name: string;
};

type EventsContentProps = {
  events: EventItem[];
  isSuperAdmin: boolean;
  organizations: Organization[];
};

const localeMap: Record<string, string> = {
  pt: "pt-BR",
  en: "en-US",
  fr: "fr-FR",
  es: "es-ES",
  zh: "zh-CN",
};

const statusVariantMap: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  DRAFT: "secondary",
  PUBLISHED: "outline",
  ACTIVE: "default",
  COMPLETED: "secondary",
  CANCELLED: "destructive",
};

const statusColorMap: Record<string, string> = {
  DRAFT: "bg-gray-500",
  PUBLISHED: "bg-blue-500",
  ACTIVE: "bg-green-500",
  COMPLETED: "bg-violet-500",
  CANCELLED: "bg-red-500",
};

const defaultEventForm = {
  name: "",
  description: "",
  startsAt: "",
  endsAt: "",
  location: "",
  address: "",
  maxParticipants: "",
  organizationId: "",
  checkInMethods: ["FACIAL"] as string[],
};

export function EventsContent({ events, isSuperAdmin, organizations }: EventsContentProps) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const { confirm } = useConfirm();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [orgFilter, setOrgFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"table" | "card">("table");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [form, setForm] = useState(defaultEventForm);
  const [loading, setLoading] = useState(false);

  const dateLocale = localeMap[locale] ?? "pt-BR";

  const filtered = useMemo(() => {
    return events.filter((ev) => {
      if (search) {
        const q = search.toLowerCase();
        const matchName = ev.name.toLowerCase().includes(q);
        const matchLocation = ev.location?.toLowerCase().includes(q);
        const matchOrg = ev.organizationName?.toLowerCase().includes(q);
        if (!matchName && !matchLocation && !matchOrg) return false;
      }
      if (statusFilter !== "all" && ev.status !== statusFilter) return false;
      if (orgFilter !== "all" && ev.organizationId !== orgFilter) return false;
      return true;
    });
  }, [events, search, statusFilter, orgFilter]);

  function openCreateDialog() {
    setEditingEvent(null);
    setForm({ ...defaultEventForm, organizationId: organizations[0]?.id ?? "" });
    setDialogOpen(true);
  }

  function openEditDialog(event: EventItem) {
    setEditingEvent(event);
    setForm({
      name: event.name,
      description: event.description ?? "",
      startsAt: event.startsAt.slice(0, 16),
      endsAt: event.endsAt.slice(0, 16),
      location: event.location ?? "",
      address: "",
      maxParticipants: event.maxParticipants?.toString() ?? "",
      organizationId: event.organizationId,
      checkInMethods: ["FACIAL"],
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    setLoading(true);
    try {
      const orgId = editingEvent ? editingEvent.organizationId : form.organizationId;
      const body = {
        name: form.name,
        description: form.description || undefined,
        startsAt: new Date(form.startsAt).toISOString(),
        endsAt: new Date(form.endsAt).toISOString(),
        location: form.location || undefined,
        address: form.address || undefined,
        maxParticipants: form.maxParticipants ? Number(form.maxParticipants) : undefined,
        checkInMethods: form.checkInMethods,
      };

      const url = editingEvent
        ? `/api/events/${editingEvent.id}?organizationId=${orgId}`
        : `/api/events?organizationId=${orgId}`;
      const method = editingEvent ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || t("events.new.createError"));
        return;
      }

      toast.success(editingEvent ? t("toast.updated") : t("toast.created"));
      setDialogOpen(false);
      router.refresh();
    } catch {
      toast.error(t("auth.login.connectionError"));
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(event: EventItem) {
    const ok = await confirm({
      title: t("events.actions.deleteConfirmTitle"),
      description: t("events.actions.deleteConfirmDescription").replace("{0}", event.name),
      confirmLabel: t("common.actions.delete"),
      variant: "destructive",
    });
    if (!ok) return;

    const res = await fetch(
      `/api/events/${event.id}?organizationId=${event.organizationId}`,
      { method: "DELETE" }
    );
    if (!res.ok) {
      toast.error(t("toast.errorOccurred"));
      return;
    }
    toast.success(t("toast.deleted"));
    router.refresh();
  }

  async function handleStatusChange(event: EventItem, status: string) {
    const res = await fetch(
      `/api/events/${event.id}?organizationId=${event.organizationId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      }
    );
    if (!res.ok) {
      toast.error(t("toast.errorOccurred"));
      return;
    }
    toast.success(t("toast.updated"));
    router.refresh();
  }

  function handleExportExcel() {
    const columns: ExportColumn[] = [
      { key: "name", header: t("events.form.name"), width: 30 },
      ...(isSuperAdmin
        ? [{ key: "organizationName", header: t("common.labels.organization"), width: 24 } as ExportColumn]
        : []),
      { key: "location", header: t("events.form.location"), width: 24 },
      {
        key: "startsAt",
        header: t("events.form.startDate"),
        width: 16,
        format: (v: unknown) => (v ? new Date(v as string).toLocaleDateString(dateLocale) : ""),
      },
      {
        key: "endsAt",
        header: t("events.form.endDate"),
        width: 16,
        format: (v: unknown) => (v ? new Date(v as string).toLocaleDateString(dateLocale) : ""),
      },
      {
        key: "status",
        header: t("events.form.status"),
        width: 14,
        format: (v: unknown) => t(`events.statuses.${v}`),
      },
      {
        key: "_count.participants",
        header: t("events.detail.participants"),
        width: 14,
        format: (v: unknown) => String(v ?? 0),
      },
      {
        key: "_count.checkIns",
        header: t("events.detail.checkIns"),
        width: 14,
        format: (v: unknown) => String(v ?? 0),
      },
    ];

    const ts = new Date().toISOString().slice(0, 10);
    exportToExcel(
      filtered as unknown as Record<string, unknown>[],
      columns,
      `eventos-${ts}`,
      dateLocale
    );
    toast.success(t("export.exportComplete"));
  }

  function handleExportPDF() {
    const columns: ExportColumn[] = [
      { key: "name", header: t("events.form.name"), width: 35 },
      ...(isSuperAdmin
        ? [{ key: "organizationName", header: t("common.labels.organization"), width: 30 } as ExportColumn]
        : []),
      { key: "location", header: t("events.form.location"), width: 25 },
      {
        key: "startsAt",
        header: t("events.form.startDate"),
        width: 20,
        format: (v: unknown) => (v ? new Date(v as string).toLocaleDateString(dateLocale) : ""),
      },
      {
        key: "status",
        header: t("events.form.status"),
        width: 18,
        format: (v: unknown) => t(`events.statuses.${v}`),
      },
      {
        key: "_count.participants",
        header: t("events.detail.participants"),
        width: 18,
        format: (v: unknown) => String(v ?? 0),
      },
    ];

    const ts = new Date().toISOString().slice(0, 10);
    exportToPDF(
      filtered as unknown as Record<string, unknown>[],
      columns,
      `eventos-${ts}`,
      {
        title: t("events.list.title"),
        subtitle: `${t("events.list.eventCount").replace("{0}", String(filtered.length))} — ${new Date().toLocaleDateString(dateLocale)}`,
        orientation: "landscape",
      },
      dateLocale
    );
    toast.success(t("export.exportComplete"));
  }

  function formatDateRange(start: string, end: string) {
    const s = new Date(start);
    const e = new Date(end);
    const sameDay = s.toDateString() === e.toDateString();
    if (sameDay) {
      return `${s.toLocaleDateString(dateLocale)} · ${s.toLocaleTimeString(dateLocale, { hour: "2-digit", minute: "2-digit" })} – ${e.toLocaleTimeString(dateLocale, { hour: "2-digit", minute: "2-digit" })}`;
    }
    return `${s.toLocaleDateString(dateLocale)} – ${e.toLocaleDateString(dateLocale)}`;
  }

  function renderStatusBadge(status: string) {
    const variant = statusVariantMap[status] ?? "secondary";
    return <Badge variant={variant}>{t(`events.statuses.${status}`)}</Badge>;
  }

  // ==================== CARD VIEW ====================
  function renderCardView() {
    if (filtered.length === 0) {
      return (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Calendar className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">{t("events.list.noEvents")}</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((ev) => (
          <Card key={ev.id} className="group relative overflow-hidden transition-all hover:shadow-lg">
            <div className={`absolute left-0 top-0 h-full w-1 ${statusColorMap[ev.status] ?? "bg-gray-400"}`} />
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <CardTitle className="truncate text-base">
                    <Link href={`/events/${ev.id}`} className="hover:underline">
                      {ev.name}
                    </Link>
                  </CardTitle>
                  {isSuperAdmin && ev.organizationName && (
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Building2 className="h-3 w-3" />
                      {ev.organizationName}
                    </div>
                  )}
                </div>
                <div className="ml-2 flex items-center gap-2">
                  {renderStatusBadge(ev.status)}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm" className="opacity-0 group-hover:opacity-100">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/events/${ev.id}`}>
                          <Eye className="mr-2 h-4 w-4" /> {t("common.actions.viewDetails")}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openEditDialog(ev)}>
                        <Pencil className="mr-2 h-4 w-4" /> {t("common.actions.edit")}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {ev.status === "DRAFT" && (
                        <DropdownMenuItem onClick={() => handleStatusChange(ev, "PUBLISHED")}>
                          {t("events.actions.publish")}
                        </DropdownMenuItem>
                      )}
                      {ev.status === "PUBLISHED" && (
                        <DropdownMenuItem onClick={() => handleStatusChange(ev, "ACTIVE")}>
                          {t("events.actions.start")}
                        </DropdownMenuItem>
                      )}
                      {ev.status === "ACTIVE" && (
                        <DropdownMenuItem onClick={() => handleStatusChange(ev, "COMPLETED")}>
                          {t("events.actions.finish")}
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleDelete(ev)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> {t("common.actions.delete")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              {ev.description && (
                <CardDescription className="mt-1 line-clamp-2">
                  {ev.description}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-2 pb-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{formatDateRange(ev.startsAt, ev.endsAt)}</span>
              </div>
              {ev.location && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{ev.location}</span>
                </div>
              )}
            </CardContent>
            <CardFooter className="border-t px-6 py-2.5">
              <div className="flex w-full items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  {ev._count.participants}
                  {ev.maxParticipants ? `/${ev.maxParticipants}` : ""}
                </span>
                <span className="flex items-center gap-1">
                  <ScanFace className="h-3.5 w-3.5" />
                  {ev._count.checkIns}
                </span>
                <span className="flex items-center gap-1">
                  <Monitor className="h-3.5 w-3.5" />
                  {ev._count.totems}
                </span>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  // ==================== TABLE VIEW ====================
  function renderTableView() {
    if (filtered.length === 0) {
      return (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Calendar className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">{t("events.list.noEvents")}</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("events.form.name")}</TableHead>
                {isSuperAdmin && <TableHead>{t("common.labels.organization")}</TableHead>}
                <TableHead>{t("events.form.location")}</TableHead>
                <TableHead>{t("events.form.startDate")}</TableHead>
                <TableHead>{t("events.form.status")}</TableHead>
                <TableHead className="text-center">{t("events.detail.participants")}</TableHead>
                <TableHead className="text-center">{t("events.detail.checkIns")}</TableHead>
                <TableHead className="text-center">{t("events.detail.totems")}</TableHead>
                <TableHead className="text-right">{t("common.labels.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((ev) => (
                <TableRow key={ev.id}>
                  <TableCell>
                    <Link
                      href={`/events/${ev.id}`}
                      className="font-medium hover:underline"
                    >
                      {ev.name}
                    </Link>
                    {ev.description && (
                      <p className="mt-0.5 max-w-xs truncate text-xs text-muted-foreground">
                        {ev.description}
                      </p>
                    )}
                  </TableCell>
                  {isSuperAdmin && (
                    <TableCell>
                      <span className="flex items-center gap-1.5 text-sm">
                        <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                        {ev.organizationName ?? "—"}
                      </span>
                    </TableCell>
                  )}
                  <TableCell>
                    {ev.location ? (
                      <span className="flex items-center gap-1.5 text-sm">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                        {ev.location}
                      </span>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm">
                    {formatDateRange(ev.startsAt, ev.endsAt)}
                  </TableCell>
                  <TableCell>{renderStatusBadge(ev.status)}</TableCell>
                  <TableCell className="text-center">
                    {ev._count.participants}
                    {ev.maxParticipants ? (
                      <span className="text-xs text-muted-foreground">/{ev.maxParticipants}</span>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-center">{ev._count.checkIns}</TableCell>
                  <TableCell className="text-center">{ev._count.totems}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/events/${ev.id}`}>
                            <Eye className="mr-2 h-4 w-4" /> {t("common.actions.viewDetails")}
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEditDialog(ev)}>
                          <Pencil className="mr-2 h-4 w-4" /> {t("common.actions.edit")}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {ev.status === "DRAFT" && (
                          <DropdownMenuItem onClick={() => handleStatusChange(ev, "PUBLISHED")}>
                            {t("events.actions.publish")}
                          </DropdownMenuItem>
                        )}
                        {ev.status === "PUBLISHED" && (
                          <DropdownMenuItem onClick={() => handleStatusChange(ev, "ACTIVE")}>
                            {t("events.actions.start")}
                          </DropdownMenuItem>
                        )}
                        {ev.status === "ACTIVE" && (
                          <DropdownMenuItem onClick={() => handleStatusChange(ev, "COMPLETED")}>
                            {t("events.actions.finish")}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDelete(ev)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> {t("common.actions.delete")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("events.list.title")}</h1>
          <p className="text-muted-foreground">{t("events.list.description")}</p>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <FileDown className="mr-2 h-4 w-4" />
                {t("common.actions.export")}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={handleExportExcel}>
                <FileSpreadsheet className="mr-2 h-4 w-4" /> Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportPDF}>
                <FileDown className="mr-2 h-4 w-4" /> PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            {t("events.list.newEvent")}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("events.list.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("events.list.allStatuses")}</SelectItem>
            <SelectItem value="DRAFT">{t("events.statuses.DRAFT")}</SelectItem>
            <SelectItem value="PUBLISHED">{t("events.statuses.PUBLISHED")}</SelectItem>
            <SelectItem value="ACTIVE">{t("events.statuses.ACTIVE")}</SelectItem>
            <SelectItem value="COMPLETED">{t("events.statuses.COMPLETED")}</SelectItem>
            <SelectItem value="CANCELLED">{t("events.statuses.CANCELLED")}</SelectItem>
          </SelectContent>
        </Select>
        {isSuperAdmin && organizations.length > 0 && (
          <Select value={orgFilter} onValueChange={setOrgFilter}>
            <SelectTrigger className="w-full sm:w-52">
              <SelectValue placeholder={t("common.labels.organization")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("events.list.allOrganizations")}</SelectItem>
              {organizations.map((org) => (
                <SelectItem key={org.id} value={org.id}>
                  {org.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <div className="flex items-center rounded-md border">
          <Button
            variant={viewMode === "table" ? "secondary" : "ghost"}
            size="icon-sm"
            onClick={() => setViewMode("table")}
            className="rounded-r-none"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "card" ? "secondary" : "ghost"}
            size="icon-sm"
            onClick={() => setViewMode("card")}
            className="rounded-l-none"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>{t("events.list.eventCount").replace("{0}", String(filtered.length))}</span>
        {search || statusFilter !== "all" || orgFilter !== "all" ? (
          <span>
            {t("events.list.filteredOf").replace("{0}", String(events.length))}
          </span>
        ) : null}
      </div>

      {/* Content */}
      {viewMode === "table" ? renderTableView() : renderCardView()}

      {/* Create / Edit Event Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {editingEvent ? t("events.form.editTitle") : t("events.form.createTitle")}
            </DialogTitle>
            <DialogDescription>
              {t("events.new.description")}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            {isSuperAdmin && !editingEvent && (
              <div className="space-y-2">
                <Label>{t("events.form.organization")} *</Label>
                <Select
                  value={form.organizationId}
                  onValueChange={(v) => setForm({ ...form, organizationId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("events.form.selectOrganization")} />
                  </SelectTrigger>
                  <SelectContent>
                    {organizations.map((org) => (
                      <SelectItem key={org.id} value={org.id}>
                        {org.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>{t("events.form.name")} *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder={t("events.form.namePlaceholder")}
              />
            </div>

            <div className="space-y-2">
              <Label>{t("events.form.description")}</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder={t("events.form.descriptionPlaceholder")}
                rows={2}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("events.form.startDate")} *</Label>
                <Input
                  type="datetime-local"
                  value={form.startsAt}
                  onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("events.form.endDate")} *</Label>
                <Input
                  type="datetime-local"
                  value={form.endsAt}
                  onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("events.form.location")}</Label>
                <Input
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder={t("events.form.locationPlaceholder")}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("events.form.address")}</Label>
                <Input
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder={t("events.form.addressPlaceholder")}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t("events.form.maxParticipants")}</Label>
              <Input
                type="number"
                min="1"
                value={form.maxParticipants}
                onChange={(e) => setForm({ ...form, maxParticipants: e.target.value })}
                placeholder={t("events.form.noLimit")}
              />
            </div>

            <div className="space-y-2">
              <Label>{t("events.form.checkInMethods")}</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 rounded-lg border p-3 cursor-pointer hover:bg-accent flex-1">
                  <input
                    type="checkbox"
                    checked={form.checkInMethods.includes("FACIAL")}
                    onChange={(e) => {
                      const methods = e.target.checked
                        ? [...form.checkInMethods, "FACIAL"]
                        : form.checkInMethods.filter((m) => m !== "FACIAL");
                      setForm({ ...form, checkInMethods: methods });
                    }}
                    className="h-4 w-4 rounded"
                  />
                  <ScanFace className="h-4 w-4" />
                  <span className="text-sm">{t("events.form.facial")}</span>
                </label>
                <label className="flex items-center gap-2 rounded-lg border p-3 cursor-pointer hover:bg-accent flex-1">
                  <input
                    type="checkbox"
                    checked={form.checkInMethods.includes("QR_CODE")}
                    onChange={(e) => {
                      const methods = e.target.checked
                        ? [...form.checkInMethods, "QR_CODE"]
                        : form.checkInMethods.filter((m) => m !== "QR_CODE");
                      setForm({ ...form, checkInMethods: methods });
                    }}
                    className="h-4 w-4 rounded"
                  />
                  <span className="text-sm">QR Code</span>
                </label>
                <label className="flex items-center gap-2 rounded-lg border p-3 cursor-pointer hover:bg-accent flex-1">
                  <input
                    type="checkbox"
                    checked={form.checkInMethods.includes("MANUAL")}
                    onChange={(e) => {
                      const methods = e.target.checked
                        ? [...form.checkInMethods, "MANUAL"]
                        : form.checkInMethods.filter((m) => m !== "MANUAL");
                      setForm({ ...form, checkInMethods: methods });
                    }}
                    className="h-4 w-4 rounded"
                  />
                  <span className="text-sm">{t("events.form.manual")}</span>
                </label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {t("common.actions.cancel")}
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading || !form.name || !form.startsAt || !form.endsAt || (!editingEvent && isSuperAdmin && !form.organizationId)}
            >
              {loading
                ? t("events.form.saving")
                : editingEvent
                  ? t("events.form.saveChanges")
                  : t("events.form.createTitle")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
