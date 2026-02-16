"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  Monitor,
  ScanFace,
  Plus,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";

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
  hasFaceEmbedding: boolean;
  checkIns: { checkInPoint: { name: string } }[];
};

type EventData = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  startsAt: string;
  location: string | null;
  maxParticipants: number | null;
  organizationId: string;
  checkInPoints: CheckInPoint[];
  _count: {
    participants: number;
    checkIns: number;
    totems: number;
  };
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
  checkedInCount,
  isSuperAdmin,
}: {
  event: EventData;
  participants: Participant[];
  checkedInCount: number;
  isSuperAdmin: boolean;
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

      <Tabs defaultValue="participants">
        <TabsList>
          <TabsTrigger value="participants">
            {t("events.detail.participants")}
          </TabsTrigger>
          <TabsTrigger value="check-in-points">
            {t("events.detail.checkInPoints")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="participants" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {t("events.detail.eventParticipants")}
            </h2>
            {!isSuperAdmin && (
              <Button size="sm" asChild>
                <Link href={`/events/${event.id}/participants/new`}>
                  <Plus className="mr-2 h-4 w-4" />
                  {t("events.detail.add")}
                </Link>
              </Button>
            )}
          </div>

          {participants.length === 0 ? (
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
                      <TableHead>{t("common.labels.email")}</TableHead>
                      <TableHead>{t("common.labels.document")}</TableHead>
                      <TableHead>{t("events.detail.face")}</TableHead>
                      <TableHead>{t("events.detail.checkIns")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {participants.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">
                          {p.name}
                        </TableCell>
                        <TableCell>{p.email ?? "—"}</TableCell>
                        <TableCell>{p.document ?? "—"}</TableCell>
                        <TableCell>
                          {p.hasFaceEmbedding ? (
                            <Badge variant="default">
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
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="check-in-points" className="space-y-4">
          <h2 className="text-lg font-semibold">
            {t("events.detail.checkInPoints")}
          </h2>
          {event.checkInPoints.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <MapPin className="mb-4 h-10 w-10 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {t("events.detail.noCheckInPoints")}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {event.checkInPoints.map((point) => (
                <Card key={point.id}>
                  <CardHeader>
                    <CardTitle className="text-base">{point.name}</CardTitle>
                    <CardDescription>
                      <Badge variant={point.isActive ? "default" : "secondary"}>
                        {point.isActive
                          ? t("common.status.active")
                          : t("common.status.inactive")}
                      </Badge>
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
