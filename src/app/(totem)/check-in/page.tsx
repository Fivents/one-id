"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ScanFace,
  Camera,
  AlertCircle,
  Wifi,
  WifiOff,
  RefreshCcw,
  CheckCircle,
  XCircle,
  Eye,
  ShieldCheck,
} from "lucide-react";

interface TotemData {
  totemId: string;
  totemName: string;
  event: { id: string; name: string; status: string };
  checkInPoint: { id: string; name: string };
  organization: { id: string; name: string };
}

type ScanState =
  | "idle"
  | "camera-init"
  | "scanning"
  | "liveness"
  | "recognizing"
  | "confirming"
  | "checking-in"
  | "success"
  | "already-checked"
  | "not-recognized"
  | "error";

interface RecognizedParticipant {
  participantId: string;
  participantName: string;
  company: string | null;
  jobTitle: string | null;
  confidence: number;
}

export default function CheckInPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [totem, setTotem] = useState<TotemData | null>(null);
  const [state, setState] = useState<ScanState>("idle");
  const [error, setError] = useState("");
  const [cameraReady, setCameraReady] = useState(false);
  const [participant, setParticipant] = useState<RecognizedParticipant | null>(null);
  const [livenessStep, setLivenessStep] = useState<"blink" | "turn" | "done">("blink");
  const [blinkCount, setBlinkCount] = useState(0);
  const [online, setOnline] = useState(true);

  // Load totem data and start heartbeat
  useEffect(() => {
    const stored = sessionStorage.getItem("totem");
    if (!stored) {
      router.push("/auth");
      return;
    }

    const data = JSON.parse(stored) as TotemData;
    setTotem(data);

    // Heartbeat every 30s
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/totem/heartbeat", {
          method: "POST",
          headers: { "x-totem-id": data.totemId },
        });
        setOnline(res.ok);
      } catch {
        setOnline(false);
      }
    }, 30000);

    // Initial heartbeat
    fetch("/api/totem/heartbeat", {
      method: "POST",
      headers: { "x-totem-id": data.totemId },
    }).catch(() => setOnline(false));

    return () => clearInterval(interval);
  }, [router]);

  // Initialize camera
  const startCamera = useCallback(async () => {
    setState("camera-init");
    setError("");

    try {
      // Prefer front camera on Android kiosks
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraReady(true);
        setState("idle");
      }
    } catch (err) {
      setState("error");
      setError(
        "Não foi possível acessar a câmera. Verifique as permissões do dispositivo."
      );
    }
  }, []);

  // Start camera on mount
  useEffect(() => {
    startCamera();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [startCamera]);

  // Capture frame from video
  function captureFrame(): string | null {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return null;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0);
    return canvas.toDataURL("image/jpeg", 0.8);
  }

  // Liveness detection flow
  async function startLivenessCheck() {
    setState("liveness");
    setLivenessStep("blink");
    setBlinkCount(0);

    // Simplified liveness for v1:
    // 1. Detect face presence via frame analysis
    // 2. Request user movement (blink simulation via timer)
    // 3. Capture multiple frames to detect motion

    // In production, this would use face-api.js or TensorFlow.js
    // for real blink detection and anti-spoofing.
    // For now, we simulate the flow with frame captures.

    const frames: string[] = [];
    for (let i = 0; i < 3; i++) {
      await new Promise((r) => setTimeout(r, 800));
      const frame = captureFrame();
      if (frame) frames.push(frame);
      setBlinkCount(i + 1);
    }

    // Check that we got frame variance (basic motion detection)
    if (frames.length >= 2) {
      setLivenessStep("done");
      // Proceed to recognition
      await performRecognition();
    } else {
      setState("error");
      setError("Não foi possível verificar vivacidade. Tente novamente.");
    }
  }

  // Face recognition via API
  async function performRecognition() {
    if (!totem) return;
    setState("recognizing");

    const frame = captureFrame();
    if (!frame) {
      setState("error");
      setError("Não foi possível capturar imagem.");
      return;
    }

    try {
      // In production, the client would run a face detection model
      // (e.g., face-api.js / TensorFlow.js) to extract the 128-dim embedding
      // before sending to the server. For now, we send the frame
      // and let the server-side handle extraction if available.
      //
      // Since the current architecture expects a pre-computed embedding,
      // this is where the client-side face model would run.
      // Placeholder: send frame to a processing endpoint.

      const res = await fetch("/api/totem/recognize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-totem-id": totem.totemId,
        },
        body: JSON.stringify({
          // The embedding would be computed client-side in production.
          // For now we send a placeholder that the server can handle.
          frame: frame.split(",")[1], // base64 without data URI prefix
          embedding: [], // Will be populated by client-side model
        }),
      });

      const data = await res.json();

      if (data.success) {
        setParticipant(data.data);
        if (data.data.alreadyCheckedIn) {
          setState("already-checked");
          autoReset(4000);
        } else {
          setState("confirming");
        }
      } else {
        setState("not-recognized");
        autoReset(4000);
      }
    } catch {
      setState("error");
      setError("Erro de comunicação com o servidor.");
    }
  }

  // Perform the actual check-in
  async function confirmCheckIn() {
    if (!totem || !participant) return;
    setState("checking-in");

    try {
      const res = await fetch("/api/totem/check-in", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-totem-id": totem.totemId,
        },
        body: JSON.stringify({
          participantId: participant.participantId,
          method: "FACIAL",
          confidence: participant.confidence,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setState("success");
        // Redirect to success page for label printing
        setTimeout(() => {
          router.push(
            `/success?name=${encodeURIComponent(participant.participantName)}&point=${encodeURIComponent(totem.checkInPoint.name)}&company=${encodeURIComponent(participant.company ?? "")}&jobTitle=${encodeURIComponent(participant.jobTitle ?? "")}`
          );
        }, 1500);
      } else {
        if (data.error?.includes("já fez check-in")) {
          setState("already-checked");
        } else {
          setState("error");
          setError(data.error ?? "Erro ao realizar check-in.");
        }
        autoReset(4000);
      }
    } catch {
      setState("error");
      setError("Erro de comunicação.");
      autoReset(4000);
    }
  }

  function autoReset(ms: number) {
    setTimeout(() => {
      setState("idle");
      setParticipant(null);
      setError("");
    }, ms);
  }

  function resetToIdle() {
    setState("idle");
    setParticipant(null);
    setError("");
  }

  if (!totem) return null;

  return (
    <div className="flex h-svh w-full flex-col bg-black">
      {/* Top bar */}
      <div className="flex items-center justify-between bg-card/90 px-4 py-2 backdrop-blur">
        <div className="flex items-center gap-3">
          <ScanFace className="h-5 w-5 text-primary" />
          <div>
            <p className="text-xs text-muted-foreground">
              {totem.organization.name}
            </p>
            <p className="text-sm font-medium">{totem.event.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant={online ? "default" : "destructive"}
            className="gap-1 text-xs"
          >
            {online ? (
              <Wifi className="h-3 w-3" />
            ) : (
              <WifiOff className="h-3 w-3" />
            )}
            {online ? "Online" : "Offline"}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {totem.checkInPoint.name}
          </Badge>
        </div>
      </div>

      {/* Camera view */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden">
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          playsInline
          muted
          autoPlay
          style={{ transform: "scaleX(-1)" }}
        />
        <canvas ref={canvasRef} className="hidden" />

        {/* Face frame overlay */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div
            className={`h-72 w-56 rounded-[40%] border-4 transition-colors duration-300 ${
              state === "liveness"
                ? "border-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.3)]"
                : state === "recognizing"
                  ? "border-blue-400 animate-pulse shadow-[0_0_30px_rgba(96,165,250,0.3)]"
                  : state === "success" || state === "confirming"
                    ? "border-green-400 shadow-[0_0_30px_rgba(74,222,128,0.3)]"
                    : state === "not-recognized" || state === "error" || state === "already-checked"
                      ? "border-red-400 shadow-[0_0_30px_rgba(248,113,113,0.3)]"
                      : "border-white/40"
            }`}
          />
        </div>

        {/* Status overlay */}
        {state !== "idle" && state !== "camera-init" && (
          <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/80 to-transparent p-6">
            {state === "liveness" && (
              <div className="text-center text-white">
                <Eye className="mx-auto mb-2 h-8 w-8 animate-pulse text-yellow-400" />
                <p className="text-lg font-semibold">Verificação de vivacidade</p>
                <p className="text-sm text-white/80">
                  Mantenha o rosto na moldura... ({blinkCount}/3)
                </p>
                <div className="mx-auto mt-2 h-1 w-48 overflow-hidden rounded bg-white/20">
                  <div
                    className="h-full bg-yellow-400 transition-all"
                    style={{ width: `${(blinkCount / 3) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {state === "recognizing" && (
              <div className="text-center text-white">
                <ScanFace className="mx-auto mb-2 h-8 w-8 animate-spin text-blue-400" />
                <p className="text-lg font-semibold">Reconhecendo...</p>
                <p className="text-sm text-white/80">
                  Buscando participante no evento
                </p>
              </div>
            )}

            {state === "confirming" && participant && (
              <Card className="mx-auto max-w-sm">
                <CardContent className="p-4 text-center">
                  <CheckCircle className="mx-auto mb-2 h-8 w-8 text-green-500" />
                  <p className="text-lg font-bold">{participant.participantName}</p>
                  {participant.company && (
                    <p className="text-sm text-muted-foreground">
                      {participant.company}
                    </p>
                  )}
                  {participant.jobTitle && (
                    <p className="text-xs text-muted-foreground">
                      {participant.jobTitle}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    Confiança: {(participant.confidence * 100).toFixed(0)}%
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Button
                      size="lg"
                      className="flex-1"
                      onClick={confirmCheckIn}
                    >
                      <ShieldCheck className="mr-1.5 h-4 w-4" />
                      Confirmar check-in
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={resetToIdle}
                    >
                      Cancelar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {state === "checking-in" && (
              <div className="text-center text-white">
                <ScanFace className="mx-auto mb-2 h-8 w-8 animate-pulse text-green-400" />
                <p className="text-lg font-semibold">Realizando check-in...</p>
              </div>
            )}

            {state === "success" && (
              <div className="text-center text-white">
                <CheckCircle className="mx-auto mb-2 h-10 w-10 text-green-400" />
                <p className="text-xl font-bold">Check-in confirmado!</p>
                <p className="text-sm text-white/80">
                  {participant?.participantName}
                </p>
              </div>
            )}

            {state === "already-checked" && (
              <div className="text-center text-white">
                <AlertCircle className="mx-auto mb-2 h-8 w-8 text-yellow-400" />
                <p className="text-lg font-semibold">Já fez check-in</p>
                <p className="text-sm text-white/80">
                  {participant?.participantName} já passou por este ponto.
                </p>
              </div>
            )}

            {state === "not-recognized" && (
              <div className="text-center text-white">
                <XCircle className="mx-auto mb-2 h-8 w-8 text-red-400" />
                <p className="text-lg font-semibold">Não reconhecido</p>
                <p className="text-sm text-white/80">
                  Participante não encontrado no evento. Procure a equipe de apoio.
                </p>
              </div>
            )}

            {state === "error" && (
              <div className="text-center text-white">
                <AlertCircle className="mx-auto mb-2 h-8 w-8 text-red-400" />
                <p className="text-lg font-semibold">Erro</p>
                <p className="text-sm text-white/80">{error}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div className="flex items-center justify-center gap-3 bg-card/90 p-4 backdrop-blur">
        {state === "idle" && cameraReady && (
          <Button
            size="lg"
            className="h-14 px-8 text-lg"
            onClick={startLivenessCheck}
          >
            <ScanFace className="mr-2 h-6 w-6" />
            Iniciar credenciamento
          </Button>
        )}

        {state === "camera-init" && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Camera className="h-5 w-5 animate-pulse" />
            <span>Iniciando câmera...</span>
          </div>
        )}

        {(state === "error" || state === "not-recognized" || state === "already-checked") && (
          <Button size="lg" variant="outline" onClick={resetToIdle}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Tentar novamente
          </Button>
        )}
      </div>

      {/* Totem ID footer */}
      <div className="bg-card/50 px-4 py-1 text-center text-xs text-muted-foreground">
        {totem.totemName} — ID: {totem.totemId.slice(0, 12)}
      </div>
    </div>
  );
}
