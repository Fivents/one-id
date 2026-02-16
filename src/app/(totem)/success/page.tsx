"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle, ScanFace } from "lucide-react";

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const name = searchParams.get("name") ?? "Participante";
  const point = searchParams.get("point") ?? "";

  // Auto-redirect de volta ao check-in após 5 segundos
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/check-in");
    }, 5000);
    return () => clearTimeout(timer);
  }, [router]);

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
          {point && (
            <p className="text-sm text-muted-foreground">{point}</p>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Redirecionando em 5 segundos...
        </p>
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
