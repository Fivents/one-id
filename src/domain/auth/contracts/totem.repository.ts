import type { TotemEntity } from '../entities/totem.entity';

export interface ITotemRepository {
  findByAccessCode(accessCode: string): Promise<TotemEntity | null>;
  findById(id: string): Promise<TotemEntity | null>;
}
