import * as XLSX from 'xlsx';

import type { ValidationError } from './excel-people';

const TEMPLATE_COLUMNS = ['Nome', 'Email', 'CPF', 'Código de Acesso'] as const;

const EXAMPLE_ROWS = [
  ['João Silva', 'joao@exemplo.com', '', ''],
  ['Maria Souza', '', '529.982.247-25', ''],
  ['Pedro Lima', '', '', 'ACESSO123'],
];

export interface CheckInImportRow {
  row: number;
  nome: string;
  email: string;
  cpf: string;
  codigoAcesso: string;
}

export interface CheckInParseResult {
  data: CheckInImportRow[];
  errors: ValidationError[];
}

/** Cells typed as plain numbers (an unformatted CPF, a numeric access code) come back as numbers. */
function cell(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function sanitizeCPF(cpf: string): string {
  return cpf.replace(/\D/g, '');
}

export const excelEventCheckins = {
  generateTemplate(): void {
    const wb = XLSX.utils.book_new();

    const ws = XLSX.utils.aoa_to_sheet([TEMPLATE_COLUMNS as unknown as string[], ...EXAMPLE_ROWS]);
    ws['!cols'] = TEMPLATE_COLUMNS.map(() => ({ wch: 24 }));
    XLSX.utils.book_append_sheet(wb, ws, 'Check-ins');

    const instructionsWs = XLSX.utils.aoa_to_sheet([
      ['Instruções para check-in em lote:'],
      [''],
      ['- Preencha os dados na aba "Check-ins"'],
      ['- Não modifique os cabeçalhos (primeira linha)'],
      ['- As linhas 2 a 4 são exemplos — podem ser removidas ou sobrescritas'],
      ['- Basta preencher UMA das colunas de identificação: Email, CPF ou Código de Acesso'],
      ['- A busca segue esta ordem: Email → CPF → Código de Acesso'],
      ['- A coluna "Nome" é apenas informativa e não é usada na busca'],
      ['- CPF: campo livre (com ou sem formatação)'],
      [''],
      ['Importante:'],
      ['- Participantes que já possuem check-in são ignorados (o check-in não é desfeito)'],
      ['- Identificadores sem correspondência no evento são reportados como erro'],
      ['- Se o mesmo identificador pertencer a mais de um participante, a linha é reportada como erro'],
    ]);
    XLSX.utils.book_append_sheet(wb, instructionsWs, 'Instruções');

    XLSX.writeFile(wb, 'modelo-checkin-participantes.xlsx');
  },

  parseFromExcel(file: File): Promise<CheckInParseResult> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const wb = XLSX.read(data, { type: 'array' });

          const sheetName = wb.SheetNames.find((n) => n !== 'Instruções') || wb.SheetNames[0];
          const ws = wb.Sheets[sheetName];

          const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });

          const result: CheckInParseResult = { data: [], errors: [] };
          const seen = new Set<string>();

          for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const rowNum = i + 2;

            const nome = cell(row['Nome']);
            const email = cell(row['Email']).toLowerCase();
            const cpf = sanitizeCPF(cell(row['CPF']));
            const codigoAcesso = cell(row['Código de Acesso']);

            // Fully blank lines are just spreadsheet padding, not an error.
            if (!nome && !email && !cpf && !codigoAcesso) continue;

            if (!email && !cpf && !codigoAcesso) {
              result.errors.push({
                row: rowNum,
                field: 'Email/CPF/Código de Acesso',
                message: 'Informe ao menos um identificador: Email, CPF ou Código de Acesso.',
              });
              continue;
            }

            if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
              result.errors.push({ row: rowNum, field: 'Email', message: 'Email inválido.' });
              continue;
            }

            const key = `${email}|${cpf}|${codigoAcesso.toUpperCase()}`;
            if (seen.has(key)) {
              result.errors.push({
                row: rowNum,
                field: 'Email/CPF/Código de Acesso',
                message: 'Identificador repetido na planilha — linha ignorada.',
              });
              continue;
            }
            seen.add(key);

            result.data.push({ row: rowNum, nome, email, cpf, codigoAcesso });
          }

          resolve(result);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  },
};
