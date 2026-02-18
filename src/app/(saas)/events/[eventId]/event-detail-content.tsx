"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  Monitor,
  ScanFace,
  Tag,
  MapPinned,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import type { Role } from "@/generated/prisma/client";
import { ParticipantsTab } from "./participants-tab";
import { CheckInPointsTab } from "./check-in-points-tab";
import { TotemsTab } from "./totems-tab";
import { LabelConfigTab } from "./label-config-tab";

type CheckInPoint = {
  id: string;
  name: string;
  isActive: boolean;
};

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

type TotemData = {
  id: string;
  name: string;
  status: string;
  lastHeartbeat: string | null;
  checkInPoint: { id: string; name: string };
  _count: { checkIns: number };
};

type EventData = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  startsAt: string;
  endsAt: string;
  location: string | null;
  maxParticipants: number | null;
  organizationId: string;
  organizationName: string;
  checkInPoints: CheckInPoint[];
  _count: {
    participants: number;
    checkIns: number;
    totems: number;
  };
};

type PlanLimits = {
  maxCheckInPoints: number;
  maxTotems: number;
  maxParticipants: number;
  allowQrCode: boolean;
};

const localeMap: Record<string, string> = {
  pt: "pt-BR",
  en: "en-US",
  fr: "fr-FR",
  es: "es-ES",
  zh: "zh-CN",
};

export function EventDetailContent({
  event,
  participants,
  totems,
  labelConfig,
  checkedInCount,
  isSuperAdmin,
  userRole,
  planLimits,
}: {
  event: EventData;
  participants: Participant[];
  totems: TotemData[];
  labelConfig: Record<string, unknown> | null;
  checkedInCount: number;
  isSuperAdmin: boolean;
  userRole: Role;
  planLimits: PlanLimits;
}) {
  const { t, locale } = useI18n();

  const statusKey = `events.statuses.${event.status}`;
  const statusLabel = t(statusKey);

  const statusVariantMap: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    DRAFT: "secondary",
    PUBLISHED: "outline",
    ACTIVE: "default",
    COMPLETED: "secondary",
    CANCELLED: "destructive",
  };
  const statusVariant = statusVariantMap[event.status] ?? "secondary";

  const dateLocale = localeMap[locale] ?? "pt-BR";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon-sm" asChild>
          <Link href="/events">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{event.name}</h1>
            <Badge variant={statusVariant}>{statusLabel}</Badge>
          </div>
          {event.description && (
            <p className="text-muted-foreground">{event.description}</p>
          )}
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("events.detail.participants")}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{event._count.participants}</div>
            {event.maxParticipants && (
              <p className="text-xs text-muted-foreground">
                {t("events.detail.ofMax").replace("{0}", String(event.maxParticipants))}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("events.detail.checkIns")}
            </CardTitle>
            <ScanFace className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{checkedInCount}</div>
            <p className="text-xs text-muted-foreground">
              {t("events.detail.ofParticipants").replace("{0}", String(event._count.participants))}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("events.detail.totems")}
            </CardTitle>
            <Monitor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{event._count.totems}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("events.detail.date")}
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold">
              {new Date(event.startsAt).toLocaleDateString(dateLocale)}
            </div>
            {event.location && (
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {event.location}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="participants">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="participants" className="gap-1.5">
            <Users className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t("events.detail.participants")}</span>
          </TabsTrigger>
          <TabsTrigger value="check-in-points" className="gap-1.5">
            <MapPinned className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t("events.detail.checkInPoints")}</span>
          </TabsTrigger>
          <TabsTrigger value="totems" className="gap-1.5">
            <Monitor className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t("events.detail.totems")}</span>
          </TabsTrigger>
          <TabsTrigger value="labels" className="gap-1.5">
            <Tag className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t("events.detail.labels")}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="participants">
          <ParticipantsTab
            eventId={event.id}
            organizationId={event.organizationId}
            participants={participants}
            isSuperAdmin={isSuperAdmin}
            userRole={userRole}
          />
        </TabsContent>

        <TabsContent value="check-in-points">
          <CheckInPointsTab
            eventId={event.id}
            checkInPoints={event.checkInPoints}
            totems={totems}
            maxCheckInPoints={planLimits.maxCheckInPoints}
            userRole={userRole}
          />
        </TabsContent>

        <TabsContent value="totems">
          <TotemsTab
            eventId={event.id}
            totems={totems}
            checkInPoints={event.checkInPoints}
            maxTotems={planLimits.maxTotems}
            userRole={userRole}
          />
        </TabsContent>

        <TabsContent value="labels">
          <LabelConfigTab
            eventId={event.id}
            organizationName={event.organizationName}
            initialConfig={labelConfig}
            allowQrCode={planLimits.allowQrCode}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
