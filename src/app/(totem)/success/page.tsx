"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle, ScanFace, Printer } from "lucide-react";

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [countdown, setCountdown] = useState(5);

  const name = searchParams.get("name") ?? "Participante";
  const point = searchParams.get("point") ?? "";
  const company = searchParams.get("company") ?? "";
  const jobTitle = searchParams.get("jobTitle") ?? "";

  // Auto-redirect back to check-in
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          router.push("/check-in");
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [router]);

  // Trigger print on load (for connected label printer)
  useEffect(() => {
    // Small delay to allow rendering
    const timer = setTimeout(() => {
      try {
        window.print();
      } catch {
        // Silent fail — not all totem environments support print
      }
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Card className="w-full max-w-md text-center">
      <CardHeader>
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-500/10">
          <CheckCircle className="h-10 w-10 text-green-500" />
        </div>
        <CardTitle className="text-2xl">Check-in confirmado!</CardTitle>
        <CardDescription>Credenciamento realizado com sucesso</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col items-center gap-1">
          <ScanFace className="h-6 w-6 text-muted-foreground" />
          <p className="text-lg font-semibold">{name}</p>
          {company && (
            <p className="text-sm text-muted-foreground">{company}</p>
          )}
          {jobTitle && (
            <p className="text-xs text-muted-foreground">{jobTitle}</p>
          )}
          {point && (
            <p className="mt-1 text-xs text-muted-foreground/70">{point}</p>
          )}
        </div>

        <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <Printer className="h-3.5 w-3.5" />
          <span>Imprimindo etiqueta...</span>
        </div>

        <div className="space-y-1">
          <div className="mx-auto h-1 w-32 overflow-hidden rounded bg-muted">
            <div
              className="h-full bg-green-500 transition-all duration-1000"
              style={{ width: `${((5 - countdown) / 5) * 100}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Retornando em {countdown}s...
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SuccessPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  );
}
