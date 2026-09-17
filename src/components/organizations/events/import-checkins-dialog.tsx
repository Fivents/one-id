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
import { eventCheckinsClient } from '@/core/application/client-services';
import type { BulkCheckInResponse } from '@/core/application/client-services/checkins/checkins-client.service';
import { type CheckInImportRow, excelEventCheckins } from '@/core/utils/excel-event-checkins';
import type { ValidationError } from '@/core/utils/excel-people';
import { useI18n } from '@/i18n';

interface ImportCheckInsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  onImportComplete: () => void | Promise<void>;
}

export function ImportCheckInsDialog({ open, onOpenChange, eventId, onImportComplete }: ImportCheckInsDialogProps) {
  const { t } = useI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<CheckInImportRow[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<BulkCheckInResponse | null>(null);

  const resetFileState = useCallback(() => {
    setFile(null);
    setRows([]);
    setValidationErrors([]);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (!selectedFile) return;

      setFile(selectedFile);
      setValidationErrors([]);
      setRows([]);
      setResult(null);

      try {
        const parsed = await excelEventCheckins.parseFromExcel(selectedFile);
        setValidationErrors(parsed.errors);
        setRows(parsed.data);
      } catch {
        setValidationErrors([{ row: 0, field: '', message: t('pages.eventDetail.spreadsheetReadError') }]);
      }
    },
    [t],
  );

  const handleImport = useCallback(async () => {
    if (rows.length === 0) return;

    setIsImporting(true);
    try {
      const response = await eventCheckinsClient.bulkCheckIn(eventId, {
        identifiers: rows.map((row) => ({
          row: row.row,
          name: row.nome || undefined,
          email: row.email || undefined,
          document: row.cpf || undefined,
          accessCode: row.codigoAcesso || undefined,
        })),
      });

      if (!response.success) throw new Error(response.error.message);

      setResult(response.data);
      await onImportComplete();
    } catch (error) {
      const message = error instanceof Error ? error.message : t('pages.eventDetail.bulkCheckinError');
      setValidationErrors([{ row: 0, field: '', message }]);
    } finally {
      setIsImporting(false);
    }
  }, [rows, eventId, onImportComplete, t]);

  const handleClose = useCallback(() => {
    resetFileState();
    onOpenChange(false);
  }, [onOpenChange, resetFileState]);

  const preview = rows.slice(0, 5);
  const canImport = rows.length > 0 && validationErrors.length === 0 && !isImporting;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) resetFileState();
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {result ? t('pages.eventDetail.importCheckinsResultTitle') : t('pages.eventDetail.importCheckinsTitle')}
          </DialogTitle>
          <DialogDescription>{t('pages.eventDetail.importCheckinsDescription')}</DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="space-y-3">
            <div className="bg-muted/50 flex items-center justify-between rounded-lg border p-3">
              <span className="text-sm font-medium">{t('pages.eventDetail.checkinsCreatedCount')}</span>
              <span className="text-sm">{result.created}</span>
            </div>
            <div className="bg-muted/50 flex items-center justify-between rounded-lg border p-3">
              <span className="text-sm font-medium">{t('pages.eventDetail.checkinsSkippedCount')}</span>
              <span className="text-sm">{result.skipped.length}</span>
            </div>
            {result.errors.length > 0 && (
              <div className="border-destructive bg-destructive/10 space-y-2 rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <span className="text-destructive text-sm font-medium">
                    {t('pages.eventDetail.checkinsErrorsCount')}
                  </span>
                  <span className="text-destructive text-sm">{result.errors.length}</span>
                </div>
                <ul className="max-h-32 space-y-1 overflow-y-auto">
                  {result.errors.map((error, index) => (
                    <li key={index} className="text-destructive text-xs">
                      {error.row ? `${t('pages.eventDetail.spreadsheetRowLabel', { row: String(error.row) })}: ` : ''}
                      {error.identifier ? `${error.identifier} — ` : ''}
                      {error.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <Button variant="outline" className="w-full" onClick={() => excelEventCheckins.generateTemplate()}>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              {t('pages.eventDetail.downloadTemplate')}
            </Button>

            <div className="space-y-2">
              <Label>{t('pages.eventDetail.spreadsheetFileLabel')}</Label>
              <div
                className="border-muted-foreground/25 hover:bg-accent/50 flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-6"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="text-muted-foreground h-8 w-8" />
                <p className="text-muted-foreground text-sm">
                  {file ? file.name : t('pages.eventDetail.spreadsheetDropzone')}
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
              <div className="border-destructive bg-destructive/10 rounded-lg border p-3">
                <p className="text-destructive text-sm font-medium">
                  {t('pages.eventDetail.spreadsheetValidationErrors', { count: String(validationErrors.length) })}
                </p>
                <ul className="mt-1 max-h-32 space-y-1 overflow-y-auto">
                  {validationErrors.map((error, index) => (
                    <li key={index} className="text-destructive text-xs">
                      {error.row > 0
                        ? `${t('pages.eventDetail.spreadsheetRowLabel', { row: String(error.row) })}: `
                        : ''}
                      {error.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {preview.length > 0 && validationErrors.length === 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  {t('pages.eventDetail.spreadsheetPreview', { count: String(preview.length) })}
                </p>
                <div className="max-h-32 overflow-y-auto rounded-lg border">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="px-2 py-1 text-left">Nome</th>
                        <th className="px-2 py-1 text-left">Email</th>
                        <th className="px-2 py-1 text-left">CPF</th>
                        <th className="px-2 py-1 text-left">{t('pages.eventDetail.accessCode')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.map((row) => (
                        <tr key={row.row} className="border-t">
                          <td className="px-2 py-1">{row.nome}</td>
                          <td className="px-2 py-1">{row.email}</td>
                          <td className="px-2 py-1">{row.cpf}</td>
                          <td className="px-2 py-1">{row.codigoAcesso}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {result ? (
            <Button onClick={handleClose}>{t('pages.eventDetail.close')}</Button>
          ) : (
            <>
              <Button variant="outline" onClick={handleClose}>
                {t('pages.eventDetail.cancel')}
              </Button>
              <Button onClick={handleImport} disabled={!canImport}>
                {isImporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('pages.eventDetail.importing')}
                  </>
                ) : (
                  <>
                    <FileUp className="mr-2 h-4 w-4" />
                    {t('pages.eventDetail.importCheckinsAction')}
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
