"use client";

import { useState, useEffect, useCallback } from "react";
import { useI18n } from "@/lib/i18n/context";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  Users,
  Monitor,
  ScanFace,
  Building2,
  Shield,
  TrendingUp,
  Activity,
  Terminal,
  ChevronRight,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import type { ComponentType } from "react";
import type { LucideProps } from "lucide-react";

type CheckIn = {
  id: string;
  participant: { name: string };
  checkInPoint: { name: string };
  event: { name: string };
  method: string;
  checkedInAt: string;
};

type ChartDataPoint = {
  date: string;
  checkIns: number;
};

type StatusDistribution = {
  status: string;
  count: number;
};

type TopEvent = {
  name: string;
  participants: number;
  checkIns: number;
};

type OrgForAudit = {
  id: string;
  name: string;
  events: { id: string; name: string }[];
};

type AuditLogEntry = {
  id: string;
  action: string;
  description: string | null;
  organizationName: string | null;
  eventName: string | null;
  userName: string | null;
  userEmail: string | null;
  ipAddress: string | null;
  createdAt: string;
};

type DashboardContentProps = {
  isSuperAdmin: boolean;
  stats: Record<string, number>;
  userName: string;
  orgName?: string;
  role: string;
  recentCheckIns: CheckIn[];
  checkInChartData: ChartDataPoint[];
  statusDistribution: StatusDistribution[];
  topEvents: TopEvent[];
  orgsForAudit: OrgForAudit[];
};

type StatCard = {
  titleKey: string;
  value: number;
  icon: ComponentType<LucideProps>;
  descriptionKey: string;
  color: string;
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "#94a3b8",
  PUBLISHED: "#3b82f6",
  ACTIVE: "#22c55e",
  COMPLETED: "#8b5cf6",
  CANCELLED: "#ef4444",
};

const PIE_COLORS = ["#3b82f6", "#22c55e", "#8b5cf6", "#f59e0b", "#ef4444"];

const ACTION_COLORS: Record<string, string> = {
  CHECK_IN: "text-green-400",
  CHECK_IN_DENIED: "text-red-400",
  TOTEM_AUTH: "text-blue-400",
  TOTEM_AUTH_FAILED: "text-red-400",
  EVENT_CREATED: "text-cyan-400",
  EVENT_UPDATED: "text-cyan-300",
  EVENT_DELETED: "text-red-400",
  USER_LOGIN: "text-emerald-400",
  USER_LOGOUT: "text-gray-400",
  PARTICIPANT_CREATED: "text-violet-400",
  PARTICIPANT_UPDATED: "text-violet-300",
  PARTICIPANT_DELETED: "text-red-400",
  FACE_REGISTERED: "text-amber-400",
  PLAN_CHANGE_REQUESTED: "text-yellow-400",
  PLAN_CHANGE_APPROVED: "text-green-400",
  PLAN_CHANGE_REJECTED: "text-red-400",
};

export function DashboardContent({
  isSuperAdmin,
  stats,
  userName,
  orgName,
  role,
  recentCheckIns,
  checkInChartData,
  statusDistribution,
  topEvents,
  orgsForAudit,
}: DashboardContentProps) {
  const { t, locale } = useI18n();

  const dateLocale = locale === "pt" ? "pt-BR" : locale;

  const statCards: StatCard[] = [
    ...(isSuperAdmin
      ? [
          {
            titleKey: "dashboard.superAdmin.organizations",
            value: stats.organizations,
            icon: Building2,
            descriptionKey: "dashboard.superAdmin.platformOverview",
            color: "text-blue-500",
          },
          {
            titleKey: "dashboard.superAdmin.users",
            value: stats.users,
            icon: Users,
            descriptionKey: "dashboard.superAdmin.platformOverview",
            color: "text-violet-500",
          },
        ]
      : []),
    {
      titleKey: isSuperAdmin
        ? "dashboard.superAdmin.events"
        : "dashboard.orgAdmin.yourEvents",
      value: stats.events,
      icon: Calendar,
      descriptionKey: isSuperAdmin
        ? "dashboard.superAdmin.platformOverview"
        : "dashboard.orgAdmin.orgOverview",
      color: "text-emerald-500",
    },
    {
      titleKey: isSuperAdmin
        ? "dashboard.superAdmin.participants"
        : "dashboard.orgAdmin.yourParticipants",
      value: stats.participants,
      icon: Users,
      descriptionKey: isSuperAdmin
        ? "dashboard.superAdmin.platformOverview"
        : "dashboard.orgAdmin.orgOverview",
      color: "text-amber-500",
    },
    {
      titleKey: isSuperAdmin
        ? "dashboard.superAdmin.checkIns"
        : "dashboard.orgAdmin.yourCheckIns",
      value: stats.checkIns,
      icon: ScanFace,
      descriptionKey: isSuperAdmin
        ? "dashboard.superAdmin.platformOverview"
        : "dashboard.orgAdmin.orgOverview",
      color: "text-rose-500",
    },
    ...(!isSuperAdmin
      ? [
          {
            titleKey: "dashboard.orgAdmin.yourTotems",
            value: stats.totems,
            icon: Monitor,
            descriptionKey: "dashboard.orgAdmin.orgOverview",
            color: "text-cyan-500",
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">{t("dashboard.title")}</h1>
        <p className="text-muted-foreground">
          {t("dashboard.description").replace("{name}", userName)}{" "}
          {isSuperAdmin ? (
            <Badge variant="outline" className="ml-1">
              <Shield className="mr-1 h-3 w-3" />
              {t(`nav.roleLabels.${role}`)}
            </Badge>
          ) : (
            <>
              {t("dashboard.orgAdmin.orgOverview")}:{" "}
              <span className="font-medium">{orgName}</span>
            </>
          )}
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
        {statCards.map((stat) => (
          <Card key={stat.titleKey} className="transition-all hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t(stat.titleKey)}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stat.value.toLocaleString(dateLocale)}
              </div>
              <p className="text-xs text-muted-foreground">
                {t(stat.descriptionKey)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Check-ins per day chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Check-ins (últimos 7 dias)
            </CardTitle>
            <CardDescription>Volume diário de check-ins realizados</CardDescription>
          </CardHeader>
          <CardContent>
            {checkInChartData.every((d) => d.checkIns === 0) ? (
              <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                Nenhum check-in nos últimos 7 dias
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={checkInChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(v: string) => {
                      const d = new Date(v + "T12:00:00");
                      return d.toLocaleDateString(dateLocale, { weekday: "short", day: "numeric" });
                    }}
                    className="text-xs"
                  />
                  <YAxis allowDecimals={false} className="text-xs" />
                  <Tooltip
                    labelFormatter={(v) => {
                      const d = new Date(String(v) + "T12:00:00");
                      return d.toLocaleDateString(dateLocale, {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                      });
                    }}
                    formatter={(value) => [String(value), "Check-ins"]}
                    contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", background: "hsl(var(--popover))", color: "hsl(var(--popover-foreground))" }}
                  />
                  <Bar dataKey="checkIns" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Event Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Distribuição de Eventos
            </CardTitle>
            <CardDescription>Eventos agrupados por status</CardDescription>
          </CardHeader>
          <CardContent>
            {statusDistribution.length === 0 ? (
              <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                Nenhum evento cadastrado
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(props) => {
                      const { status, count } = props as unknown as { status: string; count: number };
                      return `${t(`events.statuses.${status}`)} (${count})`;
                    }}
                    outerRadius={80}
                    dataKey="count"
                  >
                    {statusDistribution.map((entry, i) => (
                      <Cell
                        key={entry.status}
                        fill={STATUS_COLORS[entry.status] ?? PIE_COLORS[i % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, _name, props) => [
                      String(value),
                      t(`events.statuses.${(props as unknown as { payload: StatusDistribution }).payload.status}`),
                    ]}
                    contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", background: "hsl(var(--popover))", color: "hsl(var(--popover-foreground))" }}
                  />
                  <Legend
                    formatter={(value: string) => t(`events.statuses.${value}`)}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Events + Recent Check-ins */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Events */}
        <Card>
          <CardHeader>
            <CardTitle>Eventos Recentes</CardTitle>
            <CardDescription>Últimos eventos com contadores</CardDescription>
          </CardHeader>
          <CardContent>
            {topEvents.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Nenhum evento
              </p>
            ) : (
              <div className="space-y-3">
                {topEvents.map((ev, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg border p-3">
                    <span className="truncate text-sm font-medium">{ev.name}</span>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" /> {ev.participants}
                      </span>
                      <span className="flex items-center gap-1">
                        <ScanFace className="h-3.5 w-3.5" /> {ev.checkIns}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Check-ins */}
        <Card>
          <CardHeader>
            <CardTitle>Check-ins Recentes</CardTitle>
            <CardDescription>
              {isSuperAdmin
                ? "Últimos check-ins da plataforma"
                : "Últimos check-ins da organização"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentCheckIns.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Nenhum check-in realizado
              </p>
            ) : (
              <div className="space-y-3">
                {recentCheckIns.map((checkIn) => (
                  <div
                    key={checkIn.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                        <ScanFace className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {checkIn.participant.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {checkIn.event.name} — {checkIn.checkInPoint.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-[10px]">
                        {checkIn.method}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(checkIn.checkedInAt).toLocaleString(dateLocale)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Audit Log Viewer (SUPER_ADMIN only) */}
      {isSuperAdmin && (
        <AuditLogViewer orgsForAudit={orgsForAudit} dateLocale={dateLocale} />
      )}
    </div>
  );
}

// ==================== AUDIT LOG VIEWER ====================

function AuditLogViewer({
  orgsForAudit,
  dateLocale,
}: {
  orgsForAudit: OrgForAudit[];
  dateLocale: string;
}) {
  const [selectedOrgId, setSelectedOrgId] = useState<string>("");
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const selectedOrg = orgsForAudit.find((o) => o.id === selectedOrgId);
  const events = selectedOrg?.events ?? [];

  const fetchLogs = useCallback(async () => {
    setLoadingLogs(true);
    try {
      const params = new URLSearchParams();
      if (selectedOrgId) params.set("organizationId", selectedOrgId);
      if (selectedEventId) params.set("eventId", selectedEventId);
      params.set("take", "100");

      const res = await fetch(`/api/audit-logs?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.data ?? []);
      }
    } catch {
      setLogs([]);
    } finally {
      setLoadingLogs(false);
    }
  }, [selectedOrgId, selectedEventId]);

  useEffect(() => {
    if (selectedOrgId) {
      fetchLogs();
    } else {
      setLogs([]);
    }
  }, [selectedOrgId, selectedEventId, fetchLogs]);

  function handleOrgChange(orgId: string) {
    setSelectedOrgId(orgId);
    setSelectedEventId("");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Terminal className="h-5 w-5" />
          Audit Log Viewer
        </CardTitle>
        <CardDescription>
          Selecione uma organização e opcionalmente um evento para visualizar os logs de auditoria
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Selectors */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <Select value={selectedOrgId} onValueChange={handleOrgChange}>
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue placeholder="Selecione a organização" />
            </SelectTrigger>
            <SelectContent>
              {orgsForAudit.map((org) => (
                <SelectItem key={org.id} value={org.id}>
                  {org.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {events.length > 0 && (
            <Select value={selectedEventId} onValueChange={setSelectedEventId}>
              <SelectTrigger className="w-full sm:w-64">
                <SelectValue placeholder="Todos os eventos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os eventos</SelectItem>
                {events.map((ev) => (
                  <SelectItem key={ev.id} value={ev.id}>
                    {ev.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {selectedOrgId && (
            <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loadingLogs}>
              {loadingLogs ? "Carregando..." : "Atualizar"}
            </Button>
          )}
        </div>

        {/* Breadcrumb */}
        {selectedOrgId && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Building2 className="h-3.5 w-3.5" />
            <span>{selectedOrg?.name}</span>
            {selectedEventId && selectedEventId !== "all" && (
              <>
                <ChevronRight className="h-3.5 w-3.5" />
                <Calendar className="h-3.5 w-3.5" />
                <span>{events.find((e) => e.id === selectedEventId)?.name}</span>
              </>
            )}
            <ChevronRight className="h-3.5 w-3.5" />
            <span>{logs.length} log{logs.length !== 1 ? "s" : ""}</span>
          </div>
        )}

        {/* Terminal-like log viewer */}
        {!selectedOrgId ? (
          <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed text-sm text-muted-foreground">
            <div className="text-center">
              <Terminal className="mx-auto mb-2 h-8 w-8" />
              Selecione uma organização para visualizar os logs
            </div>
          </div>
        ) : loadingLogs ? (
          <div className="flex h-64 items-center justify-center rounded-lg bg-gray-950 text-sm text-green-400">
            Carregando logs...
          </div>
        ) : (
          <div className="max-h-[500px] overflow-auto rounded-lg bg-gray-950 p-4 font-mono text-xs leading-relaxed">
            {logs.length === 0 ? (
              <span className="text-gray-500">
                {">"} Nenhum log encontrado para os filtros selecionados.
              </span>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="group flex gap-2 py-0.5 hover:bg-white/5">
                  <span className="shrink-0 text-gray-600">
                    [{new Date(log.createdAt).toLocaleString(dateLocale, {
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}]
                  </span>
                  <span className={`shrink-0 font-semibold ${ACTION_COLORS[log.action] ?? "text-gray-400"}`}>
                    {log.action}
                  </span>
                  <span className="text-gray-300">
                    {log.description ?? "—"}
                  </span>
                  {log.userName && (
                    <span className="shrink-0 text-blue-400">
                      @{log.userName}
                    </span>
                  )}
                  {log.ipAddress && (
                    <span className="shrink-0 text-gray-600">
                      [{log.ipAddress}]
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
