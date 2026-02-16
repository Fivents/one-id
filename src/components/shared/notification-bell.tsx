"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, Check, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { useI18n } from "@/lib/i18n";

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
};

export function NotificationBell() {
  const { t } = useI18n();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const json = await res.json();
        setNotifications(json.data.notifications);
        setUnreadCount(json.data.unreadCount);
      }
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // poll every 30s
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markAllRead = async () => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true }),
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const markRead = async (id: string) => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notificationId: id }),
    });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const typeKey = (type: string) => {
    const map: Record<string, string> = {
      PLAN_REQUEST: "plan_request",
      PLAN_APPROVED: "plan_approved",
      PLAN_REJECTED: "plan_rejected",
      LIMIT_WARNING: "limit_warning",
      EXPIRATION_WARNING: "expiration_warning",
      NEW_MEMBER: "new_member",
      EVENT_CREATED: "event_created",
      SYSTEM_MESSAGE: "system_message",
    };
    return map[type] ?? "system_message";
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "agora";
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full p-0 text-[10px]"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-95 sm:w-105">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle>{t("notifications.title")}</SheetTitle>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllRead}>
                <CheckCheck className="mr-1 h-4 w-4" />
                {t("notifications.markAllRead")}
              </Button>
            )}
          </div>
        </SheetHeader>
        <Separator className="my-3" />
        <div className="flex flex-col gap-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              <Bell className="mx-auto mb-3 h-8 w-8 opacity-30" />
              {t("notifications.noNotifications")}
            </div>
          ) : (
            notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => !n.read && markRead(n.id)}
                className={`flex w-full items-start gap-3 rounded-lg p-3 text-left transition-colors hover:bg-muted/50 ${
                  !n.read ? "bg-primary/5" : ""
                }`}
              >
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      {t(`notifications.types.${typeKey(n.type)}`)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(n.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm font-medium leading-tight">{n.title}</p>
                  <p className="text-xs text-muted-foreground">{n.message}</p>
                </div>
                {!n.read && (
                  <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center">
                    <Check className="h-3 w-3 text-primary" />
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
