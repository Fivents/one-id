import type { PrintConfigEntity, PrintConfigProps } from '../entities/print-config.entity';

export type CreatePrintConfigData = Omit<PrintConfigProps, 'id' | 'createdAt' | 'updatedAt'>;

export type UpdatePrintConfigData = Partial<CreatePrintConfigData>;

export interface IPrintConfigRepository {
  findById(id: string): Promise<PrintConfigEntity | null>;
  create(data: CreatePrintConfigData): Promise<PrintConfigEntity>;
  update(id: string, data: UpdatePrintConfigData): Promise<PrintConfigEntity>;
}
