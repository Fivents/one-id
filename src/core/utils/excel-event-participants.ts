import * as XLSX from 'xlsx';

const TEMPLATE_COLUMNS = [
  'Nome',
  'Email',
  'CPF',
  'Telefone',
  'Cargo/Função',
  'Data de Nascimento',
  'Observações',
  'Ativo',
  'Empresa',
  'Código de Acesso',
  'Valor do QR Code',
] as const;

const EXPORT_COLUMNS = [
  ...TEMPLATE_COLUMNS,
  'Status do Check-in',
  'Horário do Check-in',
] as const;

const EXAMPLE_ROW = [
  'João Silva',
  'joao@exemplo.com',
  '529.982.247-25',
  '11999999999',
  'Analista de TI',
  '15/03/1990',
  'Funcionário desde 2020',
  'Sim',
  'Empresa Exemplo',
  'ACESSO123',
  'QR-CODE-001',
];

export interface ParticipantExportRow {
  name: string;
  email: string;
  document: string | null;
  phone: string | null;
  jobTitle: string | null;
  birthDate: string | null;
  notes: string | null;
  deletedAt: Date | string | null;
  company: string | null;
  accessCode: string | null;
  qrCodeValue: string | null;
  hasCheckIn: boolean;
  checkedInAt: Date | string | null;
}

export interface ParticipantImportRow {
  nome: string;
  email: string;
  cpf: string;
  telefone: string;
  cargoFuncao: string;
  dataNascimento: string;
  observacoes: string;
  ativo: string;
  empresa: string;
  codigoAcesso: string;
  valorQrCode: string;
}

export interface ValidationError {
  row: number;
  field: string;
  message: string;
}

export interface ParseResult {
  data: ParticipantImportRow[];
  errors: ValidationError[];
}

function sanitizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

function sanitizeCPF(cpf: string): string {
  return cpf.replace(/\D/g, '');
}

function parseBirthDate(value: string): string | null {
  if (!value) return null;
  const digits = value.replace(/\D/g, '');
  if (digits.length === 8) {
    const day = digits.substring(0, 2);
    const month = digits.substring(2, 4);
    const year = digits.substring(4, 8);
    if (day && month && year) {
      return `${year}-${month}-${day}`;
    }
  }
  return null;
}

export const excelEventParticipants = {
  generateTemplate(): void {
    const wb = XLSX.utils.book_new();

    const headerData = [TEMPLATE_COLUMNS as unknown as string[], EXAMPLE_ROW];
    const ws = XLSX.utils.aoa_to_sheet(headerData);

    ws['!cols'] = TEMPLATE_COLUMNS.map(() => ({ wch: 20 }));

    XLSX.utils.book_append_sheet(wb, ws, 'Participantes');

    const instructionsWs = XLSX.utils.aoa_to_sheet([
      ['Instruções para importação:'],
      [''],
      ['- Preencha os dados na aba "Participantes"'],
      ['- Não modifique os cabeçalhos (primeira linha)'],
      ['- A linha 2 é um exemplo — pode ser removida ou sobrescrita'],
      ['- Nome é obrigatório'],
      ['- Email ou CPF é obrigatório (pelo menos um)'],
      ['- CPF: campo livre (com ou sem formatação)'],
      ['- Telefone: informe com DDD (ex: 11999999999)'],
      ['- Data de Nascimento: formato DD/MM/AAAA ou DDMMAAAA'],
      ['- Ativo: "Sim" ou "Não" (padrão: Sim)'],
      ['- Código de Acesso: gerado automaticamente se deixado em branco'],
      ['- Valor do QR Code: gerado automaticamente se deixado em branco'],
      [''],
      ['Campos obrigatórios: Nome + (Email ou CPF)'],
    ]);
    XLSX.utils.book_append_sheet(wb, instructionsWs, 'Instruções');

    XLSX.writeFile(wb, 'modelo-importacao-participantes.xlsx');
  },

  exportToExcel(
    participants: ParticipantExportRow[],
    eventName: string,
  ): void {
    const wb = XLSX.utils.book_new();

    const data = participants.map((p) => [
      p.name,
      p.email,
      p.document || '',
      p.phone || '',
      p.jobTitle || '',
      p.birthDate
        ? new Date(p.birthDate).toLocaleDateString('pt-BR')
        : '',
      p.notes || '',
      p.deletedAt ? 'Não' : 'Sim',
      p.company || '',
      p.accessCode || '',
      p.qrCodeValue || '',
      p.hasCheckIn ? 'Realizado' : 'Pendente',
      p.hasCheckIn && p.checkedInAt
        ? new Date(p.checkedInAt).toLocaleString('pt-BR')
        : '',
    ]);

    const ws = XLSX.utils.aoa_to_sheet([EXPORT_COLUMNS as unknown as string[], ...data]);

    ws['!cols'] = EXPORT_COLUMNS.map(() => ({ wch: 20 }));

    XLSX.utils.book_append_sheet(wb, ws, 'Participantes');

    const sanitized = eventName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    XLSX.writeFile(wb, `participantes-${sanitized}.xlsx`);
  },

  parseFromExcel(file: File): Promise<ParseResult> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const wb = XLSX.read(data, { type: 'array' });

          const sheetName = wb.SheetNames.find((n) => n !== 'Instruções') || wb.SheetNames[0];
          const ws = wb.Sheets[sheetName];

          const rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: '' });

          const result: ParseResult = { data: [], errors: [] };

          for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const rowNum = i + 2;

            const nome = (row['Nome'] || '').trim();
            const email = (row['Email'] || '').trim().toLowerCase();
            const cpf = sanitizeCPF(row['CPF'] || '');
            const telefone = sanitizePhone(row['Telefone'] || '');
            const cargoFuncao = (row['Cargo/Função'] || '').trim();
            const dataNascimento = parseBirthDate(row['Data de Nascimento'] || '') || '';
            const observacoes = (row['Observações'] || '').trim();
            const ativo = (row['Ativo'] || 'Sim').trim();
            const empresa = (row['Empresa'] || '').trim();
            const codigoAcesso = (row['Código de Acesso'] || '').trim();
            const valorQrCode = (row['Valor do QR Code'] || '').trim();

            if (!nome) {
              result.errors.push({ row: rowNum, field: 'Nome', message: 'Nome é obrigatório.' });
              continue;
            }

            if (!email && !cpf) {
              result.errors.push({
                row: rowNum,
                field: 'Email/CPF',
                message: 'Email ou CPF é obrigatório.',
              });
              continue;
            }

            if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
              result.errors.push({ row: rowNum, field: 'Email', message: 'Email inválido.' });
              continue;
            }

            result.data.push({
              nome,
              email,
              cpf,
              telefone,
              cargoFuncao,
              dataNascimento,
              observacoes,
              ativo,
              empresa,
              codigoAcesso,
              valorQrCode,
            });
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
