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

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: "Administrador",
  ORG_OWNER: "Proprietário",
  ORG_ADMIN: "Admin Org.",
  EVENT_MANAGER: "Gerente Eventos",
  STAFF: "Operador",
};

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

  const dateLocale = locale === "pt" ? "pt-BR" : locale;

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
                    <TableCell><Badge variant="secondary">{roleLabels[m.role] ?? m.role}</Badge></TableCell>
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
        if (!res.ok) { toast.error("Erro ao atualizar usuário"); return; }

        if (form.organizationId && form.role) {
          await fetch(`/api/users/${editingUser.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ role: form.role, organizationId: form.organizationId }),
          });
        }
        toast.success("Usuário atualizado");
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
        if (!res.ok) { toast.error(data.error || "Erro ao criar usuário"); return; }
        if (data.data?.setupUrl) {
          toast.success("Usuário criado! Link de configuração gerado.");
        } else {
          toast.success("Usuário adicionado à organização");
        }
      }
      setDialogOpen(false);
      router.refresh();
    } catch {
      toast.error("Erro de conexão");
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
    if (!res.ok) { toast.error("Erro ao alterar status"); return; }
    toast.success(user.isActive ? "Usuário desativado" : "Usuário ativado");
    router.refresh();
  }

  async function handleResetPassword(user: UserListItem) {
    const ok = await confirm({
      title: "Resetar Senha",
      description: `Será gerado um link para ${user.name} definir uma nova senha.`,
      confirmLabel: "Resetar",
    });
    if (!ok) return;

    const res = await fetch(`/api/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resetPassword: true }),
    });
    const data = await res.json();
    if (!res.ok) { toast.error("Erro ao resetar senha"); return; }
    toast.success(`Link gerado: ${data.data?.setupUrl ?? "verifique o e-mail"}`);
  }

  async function handleDelete(user: UserListItem) {
    const ok = await confirm({
      title: "Excluir Usuário",
      description: `Tem certeza que deseja excluir "${user.name}"?`,
      confirmLabel: "Excluir",
      variant: "destructive",
    });
    if (!ok) return;

    const res = await fetch(`/api/users/${user.id}`, { method: "DELETE" });
    if (!res.ok) { toast.error("Erro ao excluir"); return; }
    toast.success("Usuário excluído");
    router.refresh();
  }

  function handleExportExcel() {
    const columns: ExportColumn[] = [
      { key: "name", header: "Nome", width: 30 },
      { key: "email", header: "E-mail", width: 30 },
      { key: "org", header: "Organização", width: 25 },
      { key: "role", header: "Papel", width: 18 },
      { key: "status", header: "Status", width: 12 },
      { key: "createdAt", header: "Criado em", width: 14 },
    ];
    const data = filtered.map((u) => ({
      name: u.name,
      email: u.email,
      org: u.memberships.map((m) => m.organizationName).join(", ") || "—",
      role: u.memberships.map((m) => roleLabels[m.role] ?? m.role).join(", ") || "—",
      status: u.isActive ? "Ativo" : "Inativo",
      createdAt: new Date(u.createdAt).toLocaleDateString(dateLocale),
    }));
    exportToExcel(data, columns, `usuarios-${new Date().toISOString().slice(0, 10)}`);
    toast.success("Excel exportado");
  }

  function handleExportPDF() {
    const columns: ExportColumn[] = [
      { key: "name", header: "Nome", width: 35 },
      { key: "email", header: "E-mail", width: 40 },
      { key: "org", header: "Organização", width: 30 },
      { key: "role", header: "Papel", width: 22 },
      { key: "status", header: "Status", width: 14 },
    ];
    const data = filtered.map((u) => ({
      name: u.name,
      email: u.email,
      org: u.memberships.map((m) => m.organizationName).join(", ") || "—",
      role: u.memberships.map((m) => roleLabels[m.role] ?? m.role).join(", ") || "—",
      status: u.isActive ? "Ativo" : "Inativo",
    }));
    exportToPDF(data, columns, `usuarios-${new Date().toISOString().slice(0, 10)}`, {
      title: "Relatório de Usuários",
      subtitle: `OneID by Fivents — ${filtered.length} usuários — ${new Date().toLocaleDateString(dateLocale)}`,
      orientation: "landscape",
    });
    toast.success("PDF exportado");
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

        if (rows.length === 0) { toast.error("Planilha vazia"); return; }

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

          const mappedRole = Object.entries(roleLabels).find(
            ([, label]) => label.toLowerCase() === role.toLowerCase()
          )?.[0] ?? (roles.includes(role.toUpperCase() as typeof roles[number]) ? role.toUpperCase() : "STAFF");

          const res = await fetch("/api/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, role: mappedRole, organizationId: orgId }),
          });

          if (res.ok) created++;
          else errors++;
        }

        toast.success(`Importação: ${created} criados, ${errors} erros`);
        router.refresh();
      } catch {
        toast.error("Erro ao processar planilha");
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
                Exportar
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
              <Upload className="mr-2 h-4 w-4" />
              Importar
              <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImportExcel} />
            </label>
          </Button>
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Usuário
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filtros:</span>
            </div>
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nome ou e-mail..."
                className="pl-9"
              />
            </div>
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Papel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os papéis</SelectItem>
                {roles.map((r) => (
                  <SelectItem key={r} value={r}>{roleLabels[r]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="inactive">Inativo</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterOrg} onValueChange={setFilterOrg}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Organização" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as organizações</SelectItem>
                {organizations.map((o) => (
                  <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="mr-1 h-3.5 w-3.5" /> Limpar
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
                <TableHead>Usuário</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Organização</TableHead>
                <TableHead>Papel</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                    Nenhum usuário encontrado
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
                          {roleLabels[u.memberships[0].role] ?? u.memberships[0].role}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {u.mustSetPassword ? (
                        <Badge variant="outline" className="text-amber-600 border-amber-300">Pendente</Badge>
                      ) : (
                        <Badge variant={u.isActive ? "default" : "destructive"}>
                          {u.isActive ? "Ativo" : "Inativo"}
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
                            <Pencil className="mr-2 h-4 w-4" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleResetPassword(u)}>
                            <KeyRound className="mr-2 h-4 w-4" /> Resetar Senha
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleActive(u)}>
                            {u.isActive ? (
                              <><UserX className="mr-2 h-4 w-4" /> Desativar</>
                            ) : (
                              <><UserCheck className="mr-2 h-4 w-4" /> Ativar</>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleDelete(u)} className="text-destructive focus:text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" /> Excluir
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
            <DialogTitle>{editingUser ? "Editar Usuário" : "Novo Usuário"}</DialogTitle>
            <DialogDescription>
              {editingUser ? "Altere os dados do usuário." : "Preencha os dados do novo usuário. Um e-mail de configuração será enviado."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nome completo" />
            </div>
            <div className="space-y-2">
              <Label>E-mail *</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@exemplo.com" />
            </div>
            <div className="space-y-2">
              <Label>Organização</Label>
              <Select value={form.organizationId} onValueChange={(v) => setForm({ ...form, organizationId: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {organizations.map((o) => (
                    <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Papel</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r} value={r}>{roleLabels[r]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={loading || !form.name || !form.email}>
              {loading ? "Salvando..." : editingUser ? "Salvar" : "Criar Usuário"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
