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

  const dateLocale = locale === "pt" ? "pt-BR" : locale;

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
              {org.email && <p><span className="text-muted-foreground">E-mail:</span> {org.email}</p>}
              {org.document && <p><span className="text-muted-foreground">CNPJ:</span> {org.document}</p>}
              {org.phone && <p><span className="text-muted-foreground">Telefone:</span> {org.phone}</p>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{t("billing.orgView.usage")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-muted-foreground"><Calendar className="h-4 w-4" /> Eventos</span>
                <span className="font-semibold">{org.eventCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-muted-foreground"><Users className="h-4 w-4" /> Membros</span>
                <span className="font-semibold">{org.memberCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-muted-foreground"><CreditCard className="h-4 w-4" /> Plano</span>
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
        if (!res.ok) { toast.error("Erro ao atualizar organização"); return; }
        toast.success("Organização atualizada");
      } else {
        if (!form.planId) { toast.error("Selecione um plano para a organização"); return; }
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
        if (!res.ok) { toast.error(data.error || "Erro ao criar organização"); return; }
        toast.success("Organização criada");
      }
      setDialogOpen(false);
      router.refresh();
    } catch {
      toast.error("Erro de conexão");
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
    if (!res.ok) { toast.error("Erro ao alterar status"); return; }
    toast.success(org.isActive ? "Organização desativada" : "Organização ativada");
    router.refresh();
  }

  async function handleDelete(org: OrgListItem) {
    const ok = await confirm({
      title: "Excluir Organização",
      description: `Tem certeza que deseja excluir "${org.name}"? Os membros perderão acesso.`,
      confirmLabel: "Excluir",
      variant: "destructive",
      requireText: org.name,
    });
    if (!ok) return;

    const res = await fetch(`/api/organizations/${org.id}`, { method: "DELETE" });
    if (!res.ok) { toast.error("Erro ao excluir"); return; }
    toast.success("Organização excluída");
    router.refresh();
  }

  function handleExportExcel() {
    const columns: ExportColumn[] = [
      { key: "name", header: "Nome", width: 30 },
      { key: "slug", header: "Slug", width: 20 },
      { key: "email", header: "E-mail", width: 28 },
      { key: "document", header: "CNPJ", width: 20 },
      { key: "phone", header: "Telefone", width: 16 },
      { key: "plan", header: "Plano", width: 16 },
      { key: "events", header: "Eventos", width: 10 },
      { key: "members", header: "Membros", width: 10 },
      { key: "status", header: "Status", width: 10 },
      { key: "createdAt", header: "Criado em", width: 14 },
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
      status: o.isActive ? "Ativa" : "Inativa",
      createdAt: new Date(o.createdAt).toLocaleDateString(dateLocale),
    }));
    exportToExcel(data, columns, `organizacoes-${new Date().toISOString().slice(0, 10)}`);
    toast.success("Excel exportado");
  }

  function handleExportPDF() {
    const columns: ExportColumn[] = [
      { key: "name", header: "Nome", width: 35 },
      { key: "email", header: "E-mail", width: 30 },
      { key: "document", header: "CNPJ", width: 22 },
      { key: "plan", header: "Plano", width: 18 },
      { key: "events", header: "Eventos", width: 12 },
      { key: "members", header: "Membros", width: 12 },
      { key: "status", header: "Status", width: 12 },
    ];
    const data = filtered.map((o) => ({
      name: o.name,
      email: o.email ?? "",
      document: o.document ?? "",
      plan: o.planName ?? "—",
      events: String(o.eventCount),
      members: String(o.memberCount),
      status: o.isActive ? "Ativa" : "Inativa",
    }));
    exportToPDF(data, columns, `organizacoes-${new Date().toISOString().slice(0, 10)}`, {
      title: "Relatório de Organizações",
      subtitle: `OneID by Fivents — ${filtered.length} organizações — ${new Date().toLocaleDateString(dateLocale)}`,
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

        toast.success(`Importação: ${created} criadas, ${errors} erros`);
        router.refresh();
      } catch {
        toast.error("Erro ao processar planilha");
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
                <Download className="mr-2 h-4 w-4" /> Exportar
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
              <Upload className="mr-2 h-4 w-4" /> Importar
              <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImportExcel} />
            </label>
          </Button>
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" /> Nova Organização
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
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nome, slug, e-mail ou CNPJ..." className="pl-9" />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativas</SelectItem>
                <SelectItem value="inactive">Inativas</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterPlan} onValueChange={setFilterPlan}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Plano" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os planos</SelectItem>
                {uniquePlanTiers.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
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

      {/* Organizations Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t("organizations.list.title")} ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organização</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Eventos</TableHead>
                <TableHead>Membros</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-12 text-center text-muted-foreground">
                    Nenhuma organização encontrada
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
                        {org.isActive ? "Ativa" : "Inativa"}
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
                              <Eye className="mr-2 h-4 w-4" /> Ver Detalhes
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEditDialog(org)}>
                            <Pencil className="mr-2 h-4 w-4" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleActive(org)}>
                            {org.isActive ? (
                              <><PowerOff className="mr-2 h-4 w-4" /> Desativar</>
                            ) : (
                              <><Power className="mr-2 h-4 w-4" /> Ativar</>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleDelete(org)} className="text-destructive focus:text-destructive">
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

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingOrg ? "Editar Organização" : "Nova Organização"}</DialogTitle>
            <DialogDescription>
              {editingOrg ? "Altere os dados da organização." : "Preencha os dados e selecione o plano da nova organização."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nome da organização"  />
            </div>
            <div className="space-y-2">
              <Label>E-mail</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="contato@empresa.com" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>CNPJ</Label>
                <Input value={form.document} onChange={(e) => setForm({ ...form, document: e.target.value })} placeholder="00.000.000/0001-00" />
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(11) 99999-9999" />
              </div>
            </div>
            {!editingOrg && (
              <div className="space-y-2">
                <Label>Plano *</Label>
                <Select value={form.planId} onValueChange={(v) => setForm({ ...form, planId: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione o plano" /></SelectTrigger>
                  <SelectContent>
                    {plans.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} ({p.tier})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">O plano é obrigatório para novas organizações.</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={loading || !form.name || (!editingOrg && !form.planId)}>
              {loading ? "Salvando..." : editingOrg ? "Salvar" : "Criar Organização"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
