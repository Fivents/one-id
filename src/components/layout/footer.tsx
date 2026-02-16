import { ScanFace } from "lucide-react";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t bg-background">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
              <ScanFace className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold">OneID</span>
              <span className="text-[10px] leading-tight text-muted-foreground">by Fivents</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            &copy; {year} Fivents. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
