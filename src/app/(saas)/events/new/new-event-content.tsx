"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";

export function NewEventContent() {
  const router = useRouter();
  const { t } = useI18n();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    const meRes = await fetch("/api/auth/me");
    const meData = await meRes.json();
    const orgId = meData.data?.memberships?.[0]?.organization?.id;

    if (!orgId) {
      setError(t("events.new.orgNotFound"));
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/events?organizationId=${orgId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          description: formData.get("description") || undefined,
          startsAt: formData.get("startsAt"),
          endsAt: formData.get("endsAt"),
          location: formData.get("location") || undefined,
          address: formData.get("address") || undefined,
          maxParticipants: formData.get("maxParticipants")
            ? Number(formData.get("maxParticipants"))
            : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || t("events.new.createError"));
        toast.error(data.error || t("events.new.createError"));
        return;
      }

      toast.success(t("toast.created"));
      router.push("/events");
      router.refresh();
    } catch {
      setError(t("events.new.connectionError"));
      toast.error(t("events.new.connectionError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon-sm" asChild>
          <Link href="/events">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{t("events.new.title")}</h1>
          <p className="text-muted-foreground">
            {t("events.new.description")}
          </p>
        </div>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>{t("events.form.eventInfo")}</CardTitle>
            <CardDescription>
              {t("events.form.eventInfoDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">{t("events.form.name")} *</Label>
              <Input
                id="name"
                name="name"
                placeholder={t("events.form.namePlaceholder")}
                required
                minLength={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">{t("events.form.description")}</Label>
              <Textarea
                id="description"
                name="description"
                placeholder={t("events.form.descriptionPlaceholder")}
                rows={3}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="startsAt">{t("events.form.startDate")} *</Label>
                <Input
                  id="startsAt"
                  name="startsAt"
                  type="datetime-local"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endsAt">{t("events.form.endDate")} *</Label>
                <Input
                  id="endsAt"
                  name="endsAt"
                  type="datetime-local"
                  required
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="location">{t("events.form.location")}</Label>
                <Input
                  id="location"
                  name="location"
                  placeholder={t("events.form.locationPlaceholder")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">{t("events.form.address")}</Label>
                <Input
                  id="address"
                  name="address"
                  placeholder={t("events.form.addressPlaceholder")}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxParticipants">
                {t("events.form.maxParticipants")}
              </Label>
              <Input
                id="maxParticipants"
                name="maxParticipants"
                type="number"
                min="1"
                placeholder={t("events.form.noLimit")}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-3">
            <Button type="button" variant="outline" asChild>
              <Link href="/events">{t("common.actions.cancel")}</Link>
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? t("events.new.creating") : t("events.form.createTitle")}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
