'use client';

import { CheckCircle2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ImportResultsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: {
    created: number;
    updated: number;
    skipped: number;
    errors: number;
  };
}

export function ImportResultsDialog({ open, onOpenChange, result }: ImportResultsDialogProps) {
  const hasErrors = result.errors > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className={`h-5 w-5 ${hasErrors ? 'text-destructive' : 'text-green-500'}`} />
            Resultado da Importação
          </DialogTitle>
          <DialogDescription>
            {hasErrors
              ? 'A importação foi concluída com alguns erros.'
              : 'Importação concluída com sucesso.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="bg-muted/50 flex items-center justify-between rounded-lg border p-3">
            <span className="text-sm font-medium">Pessoas criadas</span>
            <span className="text-sm">{result.created}</span>
          </div>

          <div className="bg-muted/50 flex items-center justify-between rounded-lg border p-3">
            <span className="text-sm font-medium">Pessoas atualizadas</span>
            <span className="text-sm">{result.updated}</span>
          </div>

          <div className="bg-muted/50 flex items-center justify-between rounded-lg border p-3">
            <span className="text-sm font-medium">Pessoas ignoradas</span>
            <span className="text-sm">{result.skipped}</span>
          </div>

          {result.errors > 0 && (
            <div className="bg-destructive/10 flex items-center justify-between rounded-lg border border-destructive p-3">
              <span className="text-destructive text-sm font-medium">Erros</span>
              <span className="text-destructive text-sm">{result.errors}</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
