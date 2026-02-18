"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Search,
  Upload,
  Download,
  FileSpreadsheet,
  FileText,
  MoreHorizontal,
  Pencil,
  Trash2,
  Camera,
  Users,
  ScanFace,
} from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import { useConfirm } from "@/components/shared/confirm-dialog";
import { exportToExcel, exportToPDF, type ExportColumn } from "@/lib/export";
import { hasPermission, Permission } from "@/lib/permissions";
import type { Role } from "@/generated/prisma/client";
import * as XLSX from "xlsx";

type Participant = {
  id: string;
  name: string;
  email: string | null;
  document: string | null;
  phone: string | null;
  company: string | null;
  jobTitle: string | null;
  faceImageUrl: string | null;
  hasFaceEmbedding: boolean;
  checkIns: { checkInPoint: { name: string } }[];
};

export function ParticipantsTab({
  eventId,
  organizationId,
  participants: initialParticipants,
  isSuperAdmin,
  userRole,
}: {
  eventId: string;
  organizationId: string;
  participants: Participant[];
  isSuperAdmin: boolean;
  userRole: Role;
}) {
  const router = useRouter();
  const { t } = useI18n();
  const { confirm } = useConfirm();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [participants] = useState(initialParticipants);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null);
  const [loading, setLoading] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importResults, setImportResults] = useState<{
    created: number;
    skipped: number;
    totalRows: number;
  } | null>(null);

  const canCreate = hasPermission(userRole, Permission.PARTICIPANT_CREATE);
  const canUpdate = hasPermission(userRole, Permission.PARTICIPANT_UPDATE);
  const canDelete = hasPermission(userRole, Permission.PARTICIPANT_DELETE);
  const canImport = hasPermission(userRole, Permission.PARTICIPANT_IMPORT);
  const canExport = hasPermission(userRole, Permission.PARTICIPANT_EXPORT);

  const filtered = participants.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.email?.toLowerCase().includes(q) ?? false) ||
      (p.document?.toLowerCase().includes(q) ?? false) ||
      (p.company?.toLowerCase().includes(q) ?? false)
    );
  });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const body = {
      name: form.get("name") as string,
      email: (form.get("email") as string) || undefined,
      document: (form.get("document") as string) || undefined,
      phone: (form.get("phone") as string) || undefined,
      company: (form.get("company") as string) || undefined,
      jobTitle: (form.get("jobTitle") as string) || undefined,
    };

    try {
      const url = editingParticipant
        ? `/api/participants/${editingParticipant.id}`
        : `/api/participants?organizationId=${organizationId}&eventId=${eventId}`;

      const res = await fetch(url, {
        method: editingParticipant ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || t("toast.errorOccurred"));
        return;
      }

      toast.success(editingParticipant ? t("toast.updated") : t("toast.created"));
      setDialogOpen(false);
      setEditingParticipant(null);
      router.refresh();
    } catch {
      toast.error(t("toast.errorOccurred"));
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(participant: Participant) {
    const ok = await confirm({
      title: t("confirm.deleteTitle"),
      description: t("confirm.deleteDescription"),
      confirmLabel: t("common.actions.delete"),
      variant: "destructive",
    });
    if (!ok) return;

    try {
      const res = await fetch(`/api/participants/${participant.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || t("toast.errorOccurred"));
        return;
      }
      toast.success(t("toast.deleted"));
      router.refresh();
    } catch {
      toast.error(t("toast.errorOccurred"));
    }
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rawRows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet);

      // Map headers to our fields
      const rows = rawRows.map((row) => ({
        name: row["Nome *"] || row["Nome"] || row["name"] || "",
        email: row["E-mail"] || row["Email"] || row["email"] || undefined,
        document: row["Documento (CPF)"] || row["Documento"] || row["document"] || undefined,
        phone: row["Telefone"] || row["Phone"] || row["phone"] || undefined,
        company: row["Empresa"] || row["Company"] || row["company"] || undefined,
        jobTitle: row["Cargo"] || row["Job Title"] || row["jobTitle"] || undefined,
        faceImageUrl: row["URL da Foto (opcional)"] || row["URL da Foto"] || row["faceImageUrl"] || undefined,
      }));

      const validRows = rows.filter((r) => r.name.trim().length > 0);

      if (validRows.length === 0) {
        toast.error(t("events.detail.noValidRows"));
        return;
      }

      const res = await fetch("/api/participants/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, rows: validRows }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || t("toast.errorOccurred"));
        return;
      }

      setImportResults(data.data);
      setImportDialogOpen(true);
      router.refresh();
    } catch {
      toast.error(t("events.detail.fileError"));
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleExportExcel() {
    const columns: ExportColumn[] = [
      { key: "name", header: t("common.labels.name"), width: 25 },
      { key: "email", header: t("common.labels.email"), width: 30 },
      { key: "document", header: t("common.labels.document"), width: 18 },
      { key: "phone", header: t("common.labels.phone"), width: 16 },
      { key: "company", header: t("common.labels.company"), width: 20 },
      { key: "jobTitle", header: t("common.labels.jobTitle"), width: 20 },
      {
        key: "hasFaceEmbedding",
        header: t("events.detail.face"),
        width: 12,
        format: (v) => (v ? t("common.actions.yes") : t("common.actions.no")),
      },
      {
        key: "checkIns",
        header: "Check-ins",
        width: 20,
        format: (v) => {
          const arr = v as { checkInPoint: { name: string } }[];
          return arr.length > 0 ? arr.map((c) => c.checkInPoint.name).join(", ") : "—";
        },
      },
    ];

    exportToExcel(
      filtered as unknown as Record<string, unknown>[],
      columns,
      `participantes-${new Date().toISOString().slice(0, 10)}`
    );
    toast.success(t("export.exportComplete"));
  }

  function handleExportPDF() {
    const columns: ExportColumn[] = [
      { key: "name", header: t("common.labels.name"), width: 30 },
      { key: "email", header: t("common.labels.email"), width: 35 },
      { key: "company", header: t("common.labels.company"), width: 25 },
      { key: "jobTitle", header: t("common.labels.jobTitle"), width: 25 },
    ];

    exportToPDF(
      filtered as unknown as Record<string, unknown>[],
      columns,
      `participantes-${new Date().toISOString().slice(0, 10)}`,
      { title: t("events.detail.participants"), orientation: "landscape" }
    );
    toast.success(t("export.exportComplete"));
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("common.actions.search") + "..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {canImport && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open("/api/participants/template", "_blank")}
              >
                <Download className="mr-1.5 h-3.5 w-3.5" />
                Template
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
              >
                <Upload className="mr-1.5 h-3.5 w-3.5" />
                {t("common.actions.import")}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={handleImportFile}
              />
            </>
          )}

          {canExport && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="mr-1.5 h-3.5 w-3.5" />
                  {t("common.actions.export")}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={handleExportExcel}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  {t("export.excel")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportPDF}>
                  <FileText className="mr-2 h-4 w-4" />
                  {t("export.pdf")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {canCreate && !isSuperAdmin && (
            <Button
              size="sm"
              onClick={() => {
                setEditingParticipant(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              {t("events.detail.add")}
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="mb-4 h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {t("events.detail.noParticipants")}
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
                  <TableHead className="hidden md:table-cell">{t("common.labels.email")}</TableHead>
                  <TableHead className="hidden lg:table-cell">{t("common.labels.company")}</TableHead>
                  <TableHead className="hidden lg:table-cell">{t("common.labels.jobTitle")}</TableHead>
                  <TableHead>Face</TableHead>
                  <TableHead>{t("events.detail.checkIns")}</TableHead>
                  {(canUpdate || canDelete) && (
                    <TableHead className="w-10" />
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {p.faceImageUrl ? (
                          <Image
                            src={p.faceImageUrl}
                            alt=""
                            width={32}
                            height={32}
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                            <ScanFace className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{p.name}</p>
                          <p className="text-xs text-muted-foreground md:hidden">
                            {p.email ?? ""}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {p.email ?? "—"}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {p.company ?? "—"}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {p.jobTitle ?? "—"}
                    </TableCell>
                    <TableCell>
                      {p.hasFaceEmbedding ? (
                        <Badge variant="default" className="whitespace-nowrap">
                          <Camera className="mr-1 h-3 w-3" />
                          {t("events.detail.faceRegistered")}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          {t("common.status.pending")}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {p.checkIns.length > 0 ? (
                        <Badge variant="default">
                          {p.checkIns.map((c) => c.checkInPoint.name).join(", ")}
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          {t("events.detail.waiting")}
                        </Badge>
                      )}
                    </TableCell>
                    {(canUpdate || canDelete) && (
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {canUpdate && (
                              <DropdownMenuItem
                                onClick={() => {
                                  setEditingParticipant(p);
                                  setDialogOpen(true);
                                }}
                              >
                                <Pencil className="mr-2 h-4 w-4" />
                                {t("common.actions.edit")}
                              </DropdownMenuItem>
                            )}
                            {canDelete && (
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleDelete(p)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                {t("common.actions.delete")}
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingParticipant ? t("events.detail.dialogEditParticipant") : t("events.detail.dialogAddParticipant")}
            </DialogTitle>
            <DialogDescription>
              {t("events.detail.dialogParticipantDescription")}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">{t("common.labels.name")} *</Label>
                <Input
                  id="name"
                  name="name"
                  required
                  minLength={2}
                  defaultValue={editingParticipant?.name ?? ""}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">{t("common.labels.email")}</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    defaultValue={editingParticipant?.email ?? ""}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="document">{t("common.labels.document")}</Label>
                  <Input
                    id="document"
                    name="document"
                    defaultValue={editingParticipant?.document ?? ""}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="phone">{t("common.labels.phone")}</Label>
                  <Input
                    id="phone"
                    name="phone"
                    defaultValue={editingParticipant?.phone ?? ""}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="company">{t("common.labels.company")}</Label>
                  <Input
                    id="company"
                    name="company"
                    defaultValue={editingParticipant?.company ?? ""}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="jobTitle">{t("common.labels.jobTitle")}</Label>
                <Input
                  id="jobTitle"
                  name="jobTitle"
                  defaultValue={editingParticipant?.jobTitle ?? ""}
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

      {/* Import Results Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("events.detail.importResults")}</DialogTitle>
          </DialogHeader>
          {importResults && (
            <div className="space-y-3 py-4">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <span className="text-sm">{t("events.detail.importTotalRows")}</span>
                <Badge variant="outline">{importResults.totalRows}</Badge>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-900 dark:bg-green-950">
                <span className="text-sm">{t("events.detail.importCreated")}</span>
                <Badge variant="default">{importResults.created}</Badge>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <span className="text-sm">{t("events.detail.importSkipped")}</span>
                <Badge variant="secondary">{importResults.skipped}</Badge>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setImportDialogOpen(false)}>
              {t("common.actions.close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
