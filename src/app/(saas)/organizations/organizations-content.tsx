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
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Building2,
  Calendar,
  Users,
  CreditCard,
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Power,
  PowerOff,
  Download,
  Upload,
  FileSpreadsheet,
  FileText,
  Filter,
  X,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

type OrgListItem = {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  document: string | null;
  phone: string | null;
  isActive: boolean;
  planName: string | null;
  planTier: string | null;
  eventCount: number;
  memberCount: number;
  createdAt: string;
};

type PlanOption = { id: string; name: string; tier: string };

type OrgDetail = {
  name: string;
  slug: string;
  email: string | null;
  document: string | null;
  phone: string | null;
  planName: string | null;
  eventCount: number;
  memberCount: number;
};

type OrganizationsContentProps =
  | { isSuperAdmin: true; orgs: OrgListItem[]; plans: PlanOption[] }
  | { isSuperAdmin: false; org: OrgDetail };

export function OrganizationsContent(props: OrganizationsContentProps) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const { confirm } = useConfirm();

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPlan, setFilterPlan] = useState<string>("all");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<OrgListItem | null>(null);
  const [form, setForm] = useState({ name: "", email: "", document: "", phone: "", planId: "" });
  const [loading, setLoading] = useState(false);

  const dateLocale = locale === "pt" ? "pt-BR" : locale === "en" ? "en-US" : locale === "fr" ? "fr-FR" : locale === "es" ? "es-ES" : "zh-CN";

  if (!props.isSuperAdmin) {
    const { org } = props;
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">{t("organizations.detail.info")}</h1>
          <p className="text-muted-foreground">{t("organizations.list.description")}</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  {org.name}
                </CardTitle>
                <Badge>{org.planName ?? "—"}</Badge>
              </div>
              <CardDescription>/{org.slug}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {org.email && <p><span className="text-muted-foreground">{t("common.labels.email")}:</span> {org.email}</p>}
              {org.document && <p><span className="text-muted-foreground">{t("common.labels.document")}:</span> {org.document}</p>}
              {org.phone && <p><span className="text-muted-foreground">{t("common.labels.phone")}:</span> {org.phone}</p>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{t("billing.orgView.usage")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-muted-foreground"><Calendar className="h-4 w-4" /> {t("billing.orgView.events")}</span>
                <span className="font-semibold">{org.eventCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-muted-foreground"><Users className="h-4 w-4" /> {t("organizations.detail.members")}</span>
                <span className="font-semibold">{org.memberCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-muted-foreground"><CreditCard className="h-4 w-4" /> {t("organizations.detail.plan")}</span>
                <Badge variant="outline">{org.planName ?? "—"}</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const { orgs, plans } = props;

  const filtered = useMemo(() => {
    return orgs.filter((o) => {
      if (search) {
        const s = search.toLowerCase();
        if (
          !o.name.toLowerCase().includes(s) &&
          !o.slug.toLowerCase().includes(s) &&
          !(o.email?.toLowerCase().includes(s)) &&
          !(o.document?.includes(s))
        ) return false;
      }
      if (filterStatus === "active" && !o.isActive) return false;
      if (filterStatus === "inactive" && o.isActive) return false;
      if (filterPlan !== "all" && o.planTier !== filterPlan) return false;
      return true;
    });
  }, [orgs, search, filterStatus, filterPlan]);

  const hasFilters = search || filterStatus !== "all" || filterPlan !== "all";

  function clearFilters() {
    setSearch("");
    setFilterStatus("all");
    setFilterPlan("all");
  }

  function openCreateDialog() {
    setEditingOrg(null);
    setForm({ name: "", email: "", document: "", phone: "", planId: plans[0]?.id ?? "" });
    setDialogOpen(true);
  }

  function openEditDialog(org: OrgListItem) {
    setEditingOrg(org);
    setForm({
      name: org.name,
      email: org.email ?? "",
      document: org.document ?? "",
      phone: org.phone ?? "",
      planId: "",
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    setLoading(true);
    try {
      if (editingOrg) {
        const res = await fetch(`/api/organizations/${editingOrg.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name,
            email: form.email || undefined,
            document: form.document || undefined,
            phone: form.phone || undefined,
          }),
        });
        if (!res.ok) { toast.error(t("toast.errorOccurred")); return; }
        toast.success(t("toast.updated"));
      } else {
        if (!form.planId) { toast.error(t("organizations.form.selectPlan")); return; }
        const res = await fetch("/api/organizations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name,
            email: form.email || undefined,
            document: form.document || undefined,
            phone: form.phone || undefined,
            planId: form.planId,
          }),
        });
        const data = await res.json();
        if (!res.ok) { toast.error(data.error || t("organizations.form.createError")); return; }
        toast.success(t("toast.created"));
      }
      setDialogOpen(false);
      router.refresh();
    } catch {
      toast.error(t("organizations.form.connectionError"));
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleActive(org: OrgListItem) {
    const res = await fetch(`/api/organizations/${org.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toggleActive: !org.isActive }),
    });
    if (!res.ok) { toast.error(t("toast.errorOccurred")); return; }
    toast.success(t("toast.updated"));
    router.refresh();
  }

  async function handleDelete(org: OrgListItem) {
    const ok = await confirm({
      title: t("confirm.deleteTitle"),
      description: t("confirm.deleteDescription"),
      confirmLabel: t("common.actions.delete"),
      variant: "destructive",
      requireText: org.name,
    });
    if (!ok) return;

    const res = await fetch(`/api/organizations/${org.id}`, { method: "DELETE" });
    if (!res.ok) { toast.error(t("toast.errorOccurred")); return; }
    toast.success(t("toast.deleted"));
    router.refresh();
  }

  function handleExportExcel() {
    const columns: ExportColumn[] = [
      { key: "name", header: t("common.labels.name"), width: 30 },
      { key: "slug", header: "Slug", width: 20 },
      { key: "email", header: t("common.labels.email"), width: 28 },
      { key: "document", header: t("common.labels.document"), width: 20 },
      { key: "phone", header: t("common.labels.phone"), width: 16 },
      { key: "plan", header: t("organizations.detail.plan"), width: 16 },
      { key: "events", header: t("organizations.detail.events"), width: 10 },
      { key: "members", header: t("organizations.detail.members"), width: 10 },
      { key: "status", header: t("common.labels.status"), width: 10 },
      { key: "createdAt", header: t("common.labels.createdAt"), width: 14 },
    ];
    const data = filtered.map((o) => ({
      name: o.name,
      slug: o.slug,
      email: o.email ?? "",
      document: o.document ?? "",
      phone: o.phone ?? "",
      plan: o.planName ?? "—",
      events: String(o.eventCount),
      members: String(o.memberCount),
      status: o.isActive ? t("common.status.active") : t("common.status.inactive"),
      createdAt: new Date(o.createdAt).toLocaleDateString(dateLocale),
    }));
    exportToExcel(data, columns, `organizacoes-${new Date().toISOString().slice(0, 10)}`);
    toast.success(t("export.exportComplete"));
  }

  function handleExportPDF() {
    const columns: ExportColumn[] = [
      { key: "name", header: t("common.labels.name"), width: 35 },
      { key: "email", header: t("common.labels.email"), width: 30 },
      { key: "document", header: t("common.labels.document"), width: 22 },
      { key: "plan", header: t("organizations.detail.plan"), width: 18 },
      { key: "events", header: t("organizations.detail.events"), width: 12 },
      { key: "members", header: t("organizations.detail.members"), width: 12 },
      { key: "status", header: t("common.labels.status"), width: 12 },
    ];
    const data = filtered.map((o) => ({
      name: o.name,
      email: o.email ?? "",
      document: o.document ?? "",
      plan: o.planName ?? "—",
      events: String(o.eventCount),
      members: String(o.memberCount),
      status: o.isActive ? t("common.status.active") : t("common.status.inactive"),
    }));
    exportToPDF(data, columns, `organizacoes-${new Date().toISOString().slice(0, 10)}`, {
      title: t("organizations.list.title"),
      subtitle: `OneID by Fivents — ${filtered.length} — ${new Date().toLocaleDateString(dateLocale)}`,
      orientation: "landscape",
    });
    toast.success(t("export.exportComplete"));
  }

  async function handleImportExcel(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const wb = XLSX.read(evt.target?.result, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws);

        if (rows.length === 0) { toast.error(t("common.labels.noResults")); return; }

        let created = 0;
        let errors = 0;

        for (const row of rows) {
          const name = row["Nome"] || row["name"] || "";
          const email = row["E-mail"] || row["Email"] || row["email"] || "";
          const document = row["CNPJ"] || row["Document"] || row["document"] || "";
          const phone = row["Telefone"] || row["Phone"] || row["phone"] || "";
          const planName = row["Plano"] || row["Plan"] || row["plan"] || "";

          if (!name) { errors++; continue; }

          const planId = plans.find(
            (p) => p.name.toLowerCase() === planName.toLowerCase()
          )?.id || plans[0]?.id;

          const res = await fetch("/api/organizations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name,
              email: email || undefined,
              document: document || undefined,
              phone: phone || undefined,
              planId,
            }),
          });

          if (res.ok) created++;
          else errors++;
        }

        toast.success(`${t("toast.success")}: ${created} ✓, ${errors} ✗`);
        router.refresh();
      } catch {
        toast.error(t("toast.errorOccurred"));
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = "";
  }

  const uniquePlanTiers = [...new Set(orgs.map((o) => o.planTier).filter(Boolean))] as string[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("organizations.list.title")}</h1>
          <p className="text-muted-foreground">{t("organizations.list.description")}</p>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" /> {t("common.actions.export")}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={handleExportExcel}>
                <FileSpreadsheet className="mr-2 h-4 w-4" /> Excel (.xlsx)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportPDF}>
                <FileText className="mr-2 h-4 w-4" /> PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="sm" asChild>
            <label className="cursor-pointer">
              <Upload className="mr-2 h-4 w-4" /> {t("common.actions.import")}
              <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImportExcel} />
            </label>
          </Button>
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" /> {t("organizations.list.newOrg")}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{t("common.actions.filter")}:</span>
            </div>
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={`${t("common.actions.search")}...`} className="pl-9" />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder={t("common.labels.status")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.labels.all")}</SelectItem>
                <SelectItem value="active">{t("common.status.active")}</SelectItem>
                <SelectItem value="inactive">{t("common.status.inactive")}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterPlan} onValueChange={setFilterPlan}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder={t("organizations.detail.plan")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.labels.all")}</SelectItem>
                {uniquePlanTiers.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="mr-1 h-3.5 w-3.5" /> {t("common.actions.clear")}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Organizations Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t("organizations.list.title")} ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("common.labels.organization")}</TableHead>
                <TableHead>{t("common.labels.email")}</TableHead>
                <TableHead>{t("common.labels.document")}</TableHead>
                <TableHead>{t("organizations.detail.plan")}</TableHead>
                <TableHead>{t("organizations.detail.events")}</TableHead>
                <TableHead>{t("organizations.detail.members")}</TableHead>
                <TableHead>{t("common.labels.status")}</TableHead>
                <TableHead>{t("common.labels.createdAt")}</TableHead>
                <TableHead className="text-right">{t("common.labels.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-12 text-center text-muted-foreground">
                    {t("organizations.list.noOrgs")}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((org) => (
                  <TableRow key={org.id}>
                    <TableCell>
                      <Link href={`/organizations/${org.id}`} className="font-medium hover:underline">
                        {org.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">/{org.slug}</p>
                    </TableCell>
                    <TableCell className="text-sm">{org.email ?? "—"}</TableCell>
                    <TableCell className="text-sm">{org.document ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{org.planName ?? "—"}</Badge>
                    </TableCell>
                    <TableCell>{org.eventCount}</TableCell>
                    <TableCell>{org.memberCount}</TableCell>
                    <TableCell>
                      <Badge variant={org.isActive ? "default" : "destructive"}>
                        {org.isActive ? t("common.status.active") : t("common.status.inactive")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(org.createdAt).toLocaleDateString(dateLocale)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/organizations/${org.id}`}>
                              <Eye className="mr-2 h-4 w-4" /> {t("common.actions.viewDetails")}
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEditDialog(org)}>
                            <Pencil className="mr-2 h-4 w-4" /> {t("common.actions.edit")}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleActive(org)}>
                            {org.isActive ? (
                              <><PowerOff className="mr-2 h-4 w-4" /> {t("users.labels.deactivate")}</>
                            ) : (
                              <><Power className="mr-2 h-4 w-4" /> {t("users.labels.activate")}</>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleDelete(org)} className="text-destructive focus:text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" /> {t("common.actions.delete")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingOrg ? `${t("common.actions.edit")} ${t("common.labels.organization")}` : t("organizations.list.newOrg")}</DialogTitle>
            <DialogDescription>
              {editingOrg ? t("organizations.form.editDescription") : t("organizations.form.createDescription")}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label>{t("common.labels.name")} *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={t("organizations.form.namePlaceholder")}  />
            </div>
            <div className="space-y-2">
              <Label>{t("common.labels.email")}</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder={t("organizations.form.emailPlaceholder")} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("common.labels.document")}</Label>
                <Input value={form.document} onChange={(e) => setForm({ ...form, document: e.target.value })} placeholder={t("organizations.form.documentPlaceholder")} />
              </div>
              <div className="space-y-2">
                <Label>{t("common.labels.phone")}</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder={t("organizations.form.phonePlaceholder")} />
              </div>
            </div>
            {!editingOrg && (
              <div className="space-y-2">
                <Label>{t("organizations.detail.plan")} *</Label>
                <Select value={form.planId} onValueChange={(v) => setForm({ ...form, planId: v })}>
                  <SelectTrigger><SelectValue placeholder={t("organizations.form.selectPlan")} /></SelectTrigger>
                  <SelectContent>
                    {plans.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} ({p.tier})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">{t("organizations.form.planRequired")}</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{t("common.actions.cancel")}</Button>
            <Button onClick={handleSave} disabled={loading || !form.name || (!editingOrg && !form.planId)}>
              {loading ? t("common.actions.loading") : editingOrg ? t("common.actions.save") : t("organizations.list.newOrg")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
