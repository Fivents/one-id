"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { useConfirm } from "@/components/shared/confirm-dialog";
import { exportToExcel, exportToPDF, type ExportColumn } from "@/lib/export";
import {
  Card,
  CardContent,
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  KeyRound,
  UserCheck,
  UserX,
  Download,
  Upload,
  FileSpreadsheet,
  FileText,
  Filter,
  X,
} from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

type UserMembership = {
  organizationId: string;
  organizationName: string;
  role: string;
};

type UserListItem = {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  emailVerified: boolean;
  mustSetPassword: boolean;
  createdAt: string;
  memberships: UserMembership[];
};

type MemberListItem = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userIsActive: boolean;
  role: string;
  createdAt: string;
};

type OrgOption = { id: string; name: string };

type UsersContentProps =
  | { isSuperAdmin: true; users: UserListItem[]; organizations: OrgOption[] }
  | { isSuperAdmin: false; members: MemberListItem[] };

const roles = ["SUPER_ADMIN", "ORG_OWNER", "ORG_ADMIN", "EVENT_MANAGER", "STAFF"] as const;

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

export function UsersContent(props: UsersContentProps) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const { confirm } = useConfirm();

  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterOrg, setFilterOrg] = useState<string>("all");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserListItem | null>(null);
  const [form, setForm] = useState({ name: "", email: "", role: "STAFF", organizationId: "" });
  const [loading, setLoading] = useState(false);

  const dateLocale = locale === "pt" ? "pt-BR" : locale === "en" ? "en-US" : locale === "fr" ? "fr-FR" : locale === "es" ? "es-ES" : "zh-CN";

  function getRoleLabel(role: string) {
    return t(`nav.roleLabels.${role}` as any) ?? role;
  }

  if (!props.isSuperAdmin) {
    const { members } = props;
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">{t("users.list.title")}</h1>
          <p className="text-muted-foreground">{t("users.list.description")}</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>{t("organizations.detail.members")} ({members.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("common.labels.name")}</TableHead>
                  <TableHead>{t("common.labels.email")}</TableHead>
                  <TableHead>{t("common.labels.role")}</TableHead>
                  <TableHead>{t("common.labels.status")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">{getInitials(m.userName)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{m.userName}</span>
                      </div>
                    </TableCell>
                    <TableCell>{m.userEmail}</TableCell>
                    <TableCell><Badge variant="secondary">{getRoleLabel(m.role)}</Badge></TableCell>
                    <TableCell>
                      <Badge variant={m.userIsActive ? "default" : "destructive"}>
                        {m.userIsActive ? t("common.status.active") : t("common.status.inactive")}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { users, organizations } = props;

  const filtered = useMemo(() => {
    return users.filter((u) => {
      if (search) {
        const s = search.toLowerCase();
        if (!u.name.toLowerCase().includes(s) && !u.email.toLowerCase().includes(s)) return false;
      }
      if (filterRole !== "all" && !u.memberships.some((m) => m.role === filterRole)) return false;
      if (filterStatus === "active" && !u.isActive) return false;
      if (filterStatus === "inactive" && u.isActive) return false;
      if (filterStatus === "pending" && !u.mustSetPassword) return false;
      if (filterOrg !== "all" && !u.memberships.some((m) => m.organizationId === filterOrg)) return false;
      return true;
    });
  }, [users, search, filterRole, filterStatus, filterOrg]);

  const hasFilters = search || filterRole !== "all" || filterStatus !== "all" || filterOrg !== "all";

  function clearFilters() {
    setSearch("");
    setFilterRole("all");
    setFilterStatus("all");
    setFilterOrg("all");
  }

  function openCreateDialog() {
    setEditingUser(null);
    setForm({ name: "", email: "", role: "STAFF", organizationId: organizations[0]?.id ?? "" });
    setDialogOpen(true);
  }

  function openEditDialog(user: UserListItem) {
    setEditingUser(user);
    setForm({
      name: user.name,
      email: user.email,
      role: user.memberships[0]?.role ?? "STAFF",
      organizationId: user.memberships[0]?.organizationId ?? "",
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    setLoading(true);
    try {
      if (editingUser) {
        const res = await fetch(`/api/users/${editingUser.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: form.name, email: form.email }),
        });
        if (!res.ok) { toast.error(t("toast.errorOccurred")); return; }

        if (form.organizationId && form.role) {
          await fetch(`/api/users/${editingUser.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ role: form.role, organizationId: form.organizationId }),
          });
        }
        toast.success(t("toast.updated"));
      } else {
        const res = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name,
            email: form.email,
            role: form.role,
            organizationId: form.organizationId,
          }),
        });
        const data = await res.json();
        if (!res.ok) { toast.error(data.error || t("toast.errorOccurred")); return; }
        if (data.data?.setupUrl) {
          toast.success(t("toast.created"));
        } else {
          toast.success(t("toast.created"));
        }
      }
      setDialogOpen(false);
      router.refresh();
    } catch {
      toast.error(t("toast.errorOccurred"));
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleActive(user: UserListItem) {
    const res = await fetch(`/api/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toggleActive: !user.isActive }),
    });
    if (!res.ok) { toast.error(t("toast.errorOccurred")); return; }
    toast.success(t("toast.updated"));
    router.refresh();
  }

  async function handleResetPassword(user: UserListItem) {
    const ok = await confirm({
      title: t("users.labels.resetPassword"),
      description: t("confirm.deleteDescription"),
      confirmLabel: t("users.labels.resetPassword"),
    });
    if (!ok) return;

    const res = await fetch(`/api/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resetPassword: true }),
    });
    const data = await res.json();
    if (!res.ok) { toast.error(t("toast.errorOccurred")); return; }
    toast.success(t("toast.success"));
  }

  async function handleDelete(user: UserListItem) {
    const ok = await confirm({
      title: t("confirm.deleteTitle"),
      description: t("confirm.deleteDescription"),
      confirmLabel: t("common.actions.delete"),
      variant: "destructive",
    });
    if (!ok) return;

    const res = await fetch(`/api/users/${user.id}`, { method: "DELETE" });
    if (!res.ok) { toast.error(t("toast.errorOccurred")); return; }
    toast.success(t("toast.deleted"));
    router.refresh();
  }

  function handleExportExcel() {
    const columns: ExportColumn[] = [
      { key: "name", header: t("common.labels.name"), width: 30 },
      { key: "email", header: t("common.labels.email"), width: 30 },
      { key: "org", header: t("common.labels.organization"), width: 25 },
      { key: "role", header: t("common.labels.role"), width: 18 },
      { key: "status", header: t("common.labels.status"), width: 12 },
      { key: "createdAt", header: t("common.labels.createdAt"), width: 14 },
    ];
    const data = filtered.map((u) => ({
      name: u.name,
      email: u.email,
      org: u.memberships.map((m) => m.organizationName).join(", ") || "—",
      role: u.memberships.map((m) => getRoleLabel(m.role)).join(", ") || "—",
      status: u.isActive ? t("common.status.active") : t("common.status.inactive"),
      createdAt: new Date(u.createdAt).toLocaleDateString(dateLocale),
    }));
    exportToExcel(data, columns, `usuarios-${new Date().toISOString().slice(0, 10)}`);
    toast.success(t("export.exportComplete"));
  }

  function handleExportPDF() {
    const columns: ExportColumn[] = [
      { key: "name", header: t("common.labels.name"), width: 35 },
      { key: "email", header: t("common.labels.email"), width: 40 },
      { key: "org", header: t("common.labels.organization"), width: 30 },
      { key: "role", header: t("common.labels.role"), width: 22 },
      { key: "status", header: t("common.labels.status"), width: 14 },
    ];
    const data = filtered.map((u) => ({
      name: u.name,
      email: u.email,
      org: u.memberships.map((m) => m.organizationName).join(", ") || "—",
      role: u.memberships.map((m) => getRoleLabel(m.role)).join(", ") || "—",
      status: u.isActive ? t("common.status.active") : t("common.status.inactive"),
    }));
    exportToPDF(data, columns, `usuarios-${new Date().toISOString().slice(0, 10)}`, {
      title: t("users.list.title"),
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
          const role = row["Papel"] || row["Role"] || row["role"] || "STAFF";
          const orgName = row["Organização"] || row["Organization"] || row["org"] || "";

          if (!name || !email) { errors++; continue; }

          const orgId = organizations.find(
            (o) => o.name.toLowerCase() === orgName.toLowerCase()
          )?.id || organizations[0]?.id;

          const mappedRole = roles.includes(role.toUpperCase() as typeof roles[number]) ? role.toUpperCase() : "STAFF";

          const res = await fetch("/api/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, role: mappedRole, organizationId: orgId }),
          });

          if (res.ok) created++;
          else errors++;
        }

        toast.success(t("toast.success"));
        router.refresh();
      } catch {
        toast.error(t("toast.errorOccurred"));
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = "";
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("users.list.title")}</h1>
          <p className="text-muted-foreground">{t("users.list.description")}</p>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                {t("common.actions.export")}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={handleExportExcel}>
                <FileSpreadsheet className="mr-2 h-4 w-4" /> {t("export.excel")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportPDF}>
                <FileText className="mr-2 h-4 w-4" /> {t("export.pdf")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="sm" asChild>
            <label className="cursor-pointer">
              <Upload className="mr-2 h-4 w-4" />
              {t("common.actions.import")}
              <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImportExcel} />
            </label>
          </Button>
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            {t("users.list.newUser")}
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
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`${t("common.actions.search")}...`}
                className="pl-9"
              />
            </div>
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder={t("common.labels.role")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.labels.all")}</SelectItem>
                {roles.map((r) => (
                  <SelectItem key={r} value={r}>{getRoleLabel(r)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder={t("common.labels.status")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.labels.all")}</SelectItem>
                <SelectItem value="active">{t("common.status.active")}</SelectItem>
                <SelectItem value="inactive">{t("common.status.inactive")}</SelectItem>
                <SelectItem value="pending">{t("common.status.pending")}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterOrg} onValueChange={setFilterOrg}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder={t("common.labels.organization")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.labels.all")}</SelectItem>
                {organizations.map((o) => (
                  <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
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

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t("users.list.title")} ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("common.labels.name")}</TableHead>
                <TableHead>{t("common.labels.email")}</TableHead>
                <TableHead>{t("common.labels.organization")}</TableHead>
                <TableHead>{t("common.labels.role")}</TableHead>
                <TableHead>{t("common.labels.status")}</TableHead>
                <TableHead>{t("common.labels.createdAt")}</TableHead>
                <TableHead className="text-right">{t("common.labels.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                    {t("users.list.noUsers")}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">{getInitials(u.name)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{u.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{u.email}</TableCell>
                    <TableCell>
                      {u.memberships.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {u.memberships.map((m) => (
                            <Badge key={m.organizationId} variant="outline" className="text-[10px]">
                              {m.organizationName}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {u.memberships.length > 0 ? (
                        <Badge variant="secondary" className="text-[10px]">
                          {getRoleLabel(u.memberships[0].role)}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {u.mustSetPassword ? (
                        <Badge variant="outline" className="text-amber-600 border-amber-300">{t("common.status.pending")}</Badge>
                      ) : (
                        <Badge variant={u.isActive ? "default" : "destructive"}>
                          {u.isActive ? t("common.status.active") : t("common.status.inactive")}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(u.createdAt).toLocaleDateString(dateLocale)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(u)}>
                            <Pencil className="mr-2 h-4 w-4" /> {t("common.actions.edit")}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleResetPassword(u)}>
                            <KeyRound className="mr-2 h-4 w-4" /> {t("users.labels.resetPassword")}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleActive(u)}>
                            {u.isActive ? (
                              <><UserX className="mr-2 h-4 w-4" /> {t("users.labels.deactivate")}</>
                            ) : (
                              <><UserCheck className="mr-2 h-4 w-4" /> {t("users.labels.activate")}</>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleDelete(u)} className="text-destructive focus:text-destructive">
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

      {/* Create / Edit User Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingUser ? t("users.form.editTitle") : t("users.list.newUser")}</DialogTitle>
            <DialogDescription>
              {editingUser ? t("users.form.editDescription") : t("users.form.createDescription")}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label>{t("users.form.name")} *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={t("users.form.name")} />
            </div>
            <div className="space-y-2">
              <Label>{t("users.form.email")} *</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder={t("users.form.email")} />
            </div>
            <div className="space-y-2">
              <Label>{t("users.form.organization")}</Label>
              <Select value={form.organizationId} onValueChange={(v) => setForm({ ...form, organizationId: v })}>
                <SelectTrigger><SelectValue placeholder={t("users.form.organization")} /></SelectTrigger>
                <SelectContent>
                  {organizations.map((o) => (
                    <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("users.form.role")}</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r} value={r}>{getRoleLabel(r)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{t("common.actions.cancel")}</Button>
            <Button onClick={handleSave} disabled={loading || !form.name || !form.email}>
              {loading ? t("common.actions.loading") : editingUser ? t("common.actions.save") : t("users.list.newUser")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
