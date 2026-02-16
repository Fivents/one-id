"use client";

import { useI18n } from "@/lib/i18n";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Settings } from "lucide-react";

type SettingsContentProps = {
  userName: string;
  userEmail: string;
  emailVerified: boolean;
  membership: {
    orgName: string;
    role: string;
  } | null;
};

export function SettingsContent({
  userName,
  userEmail,
  emailVerified,
  membership,
}: SettingsContentProps) {
  const { t } = useI18n();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("settings.title")}</h1>
        <p className="text-muted-foreground">
          {t("settings.description")}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              {t("settings.personalInfo")}
            </CardTitle>
            <CardDescription>{t("settings.description")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">{t("settings.nameLabel")}:</span>{" "}
              {userName}
            </p>
            <p>
              <span className="text-muted-foreground">{t("settings.emailLabel")}:</span>{" "}
              {userEmail}
            </p>
            <p>
              <span className="text-muted-foreground">{t("settings.emailLabel")}:</span>{" "}
              <Badge variant={emailVerified ? "default" : "secondary"}>
                {emailVerified ? t("common.actions.yes") : t("common.status.pending")}
              </Badge>
            </p>
          </CardContent>
        </Card>

        {membership && (
          <Card>
            <CardHeader>
              <CardTitle>{t("common.labels.organization")}</CardTitle>
              <CardDescription>
                {t("settings.description")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                <span className="text-muted-foreground">{t("common.labels.organization")}:</span>{" "}
                {membership.orgName}
              </p>
              <p>
                <span className="text-muted-foreground">{t("settings.roleLabel")}:</span>{" "}
                <Badge variant="secondary">{t(`nav.roleLabels.${membership.role}`)}</Badge>
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
