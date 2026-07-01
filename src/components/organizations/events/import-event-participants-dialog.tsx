'use client';

import { useCallback, useRef, useState } from 'react';

import { FileSpreadsheet, FileUp, Loader2, Upload } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { excelEventParticipants } from '@/core/utils/excel-event-participants';
import type { ValidationError } from '@/core/utils/excel-people';

import { ImportResultsDialog } from '../people/import-results-dialog';

interface ImportEventParticipantsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  onImportComplete: () => void;
}

export function ImportEventParticipantsDialog({
  open,
  onOpenChange,
  eventId,
  onImportComplete,
}: ImportEventParticipantsDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [overwrite, setOverwrite] = useState(false);
  const [preview, setPreview] = useState<{ nome: string; email: string; empresa: string }[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [resultsOpen, setResultsOpen] = useState(false);
  const [importResult, setImportResult] = useState<{
    created: number;
    updated: number;
    skipped: number;
    errors: number;
  } | null>(null);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setValidationErrors([]);
    setPreview([]);

    try {
      const result = await excelEventParticipants.parseFromExcel(selectedFile);
      setValidationErrors(result.errors);
      setPreview(
        result.data.slice(0, 5).map((r) => ({
          nome: r.nome,
          email: r.email,
          empresa: r.empresa,
        })),
      );
    } catch {
      setValidationErrors([{ row: 0, field: '', message: 'Erro ao ler o arquivo. Verifique se é um .xlsx válido.' }]);
    }
  }, []);

  const handleImport = useCallback(async () => {
    if (!file) return;

    setIsImporting(true);

    try {
      const result = await excelEventParticipants.parseFromExcel(file);
      if (result.errors.length > 0) {
        setIsImporting(false);
        return;
      }

      const response = await fetch(`/api/events/${eventId}/participants/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          overwrite,
          participants: result.data.map((r) => ({
            name: r.nome,
            email: r.email || null,
            document: r.cpf || null,
            phone: r.telefone || null,
            jobTitle: r.cargoFuncao || null,
            birthDate: r.dataNascimento || null,
            notes: r.observacoes || null,
            company: r.empresa || null,
            accessCode: r.codigoAcesso || null,
            qrCodeValue: r.valorQrCode || null,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao importar participantes.');
      }

      const payload = data.data || data;

      setImportResult({
        created: payload.created ?? 0,
        updated: payload.updated ?? 0,
        skipped: payload.skipped?.length ?? 0,
        errors: payload.errors?.length ?? 0,
      });
      setResultsOpen(true);
    } catch (error) {
      console.error('Import error:', error);
    } finally {
      setIsImporting(false);
    }
  }, [file, eventId, overwrite]);

  const handleResultsClose = useCallback(() => {
    setResultsOpen(false);
    setFile(null);
    setPreview([]);
    setValidationErrors([]);
    setImportResult(null);
    onOpenChange(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onImportComplete();
  }, [onOpenChange, onImportComplete]);

  const handleDownloadTemplate = useCallback(() => {
    excelEventParticipants.generateTemplate();
  }, []);

  const canImport = file && validationErrors.length === 0 && preview.length > 0 && !isImporting;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Importar Participantes</DialogTitle>
            <DialogDescription>Faça upload de uma planilha para importar participantes.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Button variant="outline" className="w-full" onClick={handleDownloadTemplate}>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Baixar modelo
            </Button>

            <div className="space-y-2">
              <Label>Arquivo (.xlsx)</Label>
              <div
                className="border-muted-foreground/25 flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-6 hover:bg-accent/50"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="text-muted-foreground h-8 w-8" />
                <p className="text-muted-foreground text-sm">
                  {file ? file.name : 'Clique para selecionar ou arraste o arquivo'}
                </p>
              </div>
              <Input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {validationErrors.length > 0 && (
              <div className="bg-destructive/10 rounded-lg border border-destructive p-3">
                <p className="text-destructive text-sm font-medium">
                  {validationErrors.length} erro(s) de validação:
                </p>
                <ul className="mt-1 max-h-32 space-y-1 overflow-y-auto">
                  {validationErrors.map((err, i) => (
                    <li key={i} className="text-destructive text-xs">
                      {err.row > 0 ? `Linha ${err.row}: ` : ''}
                      {err.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {preview.length > 0 && validationErrors.length === 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Pré-visualização (primeiras {preview.length} linhas):</p>
                <div className="max-h-32 overflow-y-auto rounded-lg border">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="px-2 py-1 text-left">Nome</th>
                        <th className="px-2 py-1 text-left">Email</th>
                        <th className="px-2 py-1 text-left">Empresa</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.map((row, i) => (
                        <tr key={i} className="border-t">
                          <td className="px-2 py-1">{row.nome}</td>
                          <td className="px-2 py-1">{row.email}</td>
                          <td className="px-2 py-1">{row.empresa}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {preview.length > 0 && validationErrors.length === 0 && (
              <div className="space-y-2">
                <Label>Estratégia para duplicados:</Label>
                <RadioGroup value={overwrite ? 'overwrite' : 'skip'} onValueChange={(v) => setOverwrite(v === 'overwrite')}>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="skip" id="skip" />
                    <Label htmlFor="skip" className="cursor-pointer">Ignorar duplicados</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="overwrite" id="overwrite" />
                    <Label htmlFor="overwrite" className="cursor-pointer">Sobrescrever existentes</Label>
                  </div>
                </RadioGroup>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleImport} disabled={!canImport}>
              {isImporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <FileUp className="mr-2 h-4 w-4" />
                  Importar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {importResult && (
        <ImportResultsDialog
          open={resultsOpen}
          onOpenChange={handleResultsClose}
          result={importResult}
        />
      )}
    </>
  );
}
