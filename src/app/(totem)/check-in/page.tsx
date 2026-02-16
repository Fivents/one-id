"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScanFace, Camera, AlertCircle } from "lucide-react";

interface TotemData {
  totemId: string;
  totemName: string;
  event: { id: string; name: string; status: string };
  checkInPoint: { id: string; name: string };
  organization: { id: string; name: string };
}

export default function CheckInPage() {
  const router = useRouter();
  const [totem, setTotem] = useState<TotemData | null>(null);
  const [status, setStatus] = useState<"idle" | "scanning" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const stored = sessionStorage.getItem("totem");
    if (!stored) {
      router.push("/auth");
      return;
    }
    setTotem(JSON.parse(stored));

    // Heartbeat interval
    const totemData = JSON.parse(stored) as TotemData;
    const interval = setInterval(async () => {
      await fetch("/api/totem/heartbeat", {
        method: "POST",
        headers: { "x-totem-id": totemData.totemId },
      });
    }, 30000);

    return () => clearInterval(interval);
  }, [router]);

  async function simulateCheckIn() {
    if (!totem) return;

    setStatus("scanning");
    setMessage("Escaneando...");

    // Simula reconhecimento facial (placeholder para integração)
    await new Promise((r) => setTimeout(r, 2000));

    setStatus("idle");
    setMessage(
      "Reconhecimento facial será integrado com o serviço de face-recognition. Use a API /api/totem/check-in com o participantId."
    );
  }

  if (!totem) {
    return null;
  }

  return (
    <div className="flex w-full max-w-lg flex-col items-center gap-6 p-4">
      {/* Status bar */}
      <div className="w-full rounded-lg bg-card p-3 text-center">
        <p className="text-xs text-muted-foreground">
          {totem.organization.name} — {totem.event.name}
        </p>
        <p className="text-sm font-medium">{totem.checkInPoint.name}</p>
      </div>

      {/* Main scanning area */}
      <Card className="w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            {status === "scanning" ? (
              <Camera className="h-10 w-10 animate-pulse text-primary" />
            ) : status === "error" ? (
              <AlertCircle className="h-10 w-10 text-destructive" />
            ) : (
              <ScanFace className="h-10 w-10 text-primary" />
            )}
          </div>
          <CardTitle className="text-xl">
            {status === "scanning"
              ? "Escaneando rosto..."
              : status === "success"
                ? "Check-in realizado!"
                : "Posicione seu rosto"}
          </CardTitle>
          <CardDescription>
            {status === "idle"
              ? "Olhe para a câmera para fazer o credenciamento"
              : message}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          {/* Camera preview placeholder */}
          <div className="flex h-64 w-full items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/20 bg-muted/50">
            <div className="text-center">
              <Camera className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Preview da câmera
              </p>
              <p className="text-xs text-muted-foreground">
                Integração pendente com face-recognition service
              </p>
            </div>
          </div>

          <Button
            onClick={simulateCheckIn}
            size="lg"
            className="w-full"
            disabled={status === "scanning"}
          >
            {status === "scanning" ? "Processando..." : "Simular check-in"}
          </Button>

          {message && status !== "scanning" && (
            <p className="text-center text-xs text-muted-foreground">
              {message}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Totem info */}
      <p className="text-xs text-muted-foreground">
        Totem: {totem.totemName} ({totem.totemId.slice(0, 8)}...)
      </p>
    </div>
  );
}
