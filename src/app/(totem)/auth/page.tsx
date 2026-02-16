"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScanFace, Shield } from "lucide-react";

export default function TotemAuthPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const apiKey = formData.get("apiKey") as string;

    try {
      const res = await fetch("/api/totem/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erro ao autenticar totem");
        return;
      }

      // Salva dados do totem no sessionStorage
      sessionStorage.setItem("totem", JSON.stringify(data.data));
      router.push("/check-in");
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary">
          <ScanFace className="h-8 w-8 text-primary-foreground" />
        </div>
        <CardTitle className="text-2xl font-bold">OneID Totem</CardTitle>
        <CardDescription>
          Insira a chave de acesso para iniciar o credenciamento
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="apiKey">Chave do totem</Label>
            <Input
              id="apiKey"
              name="apiKey"
              type="password"
              placeholder="otk_••••_••••_••••_••••"
              required
              autoComplete="off"
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? "Autenticando..." : "Ativar totem"}
          </Button>
          <p className="flex items-center gap-1 text-center text-xs text-muted-foreground">
            <Shield className="h-3 w-3" />
            Conexão segura com o servidor
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
