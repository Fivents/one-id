import { randomBytes } from 'node:crypto';

import type { ITotemRepository } from '@/core/domain/contracts';
import type { TotemEntity } from '@/core/domain/entities';

export interface BulkCreateAdminTotemsRequest {
  prefix: string;
  count: number;
  price: number;
  discount: number;
}

export class BulkCreateAdminTotemsUseCase {
  constructor(private readonly totemRepository: ITotemRepository) {}

  async execute(request: BulkCreateAdminTotemsRequest): Promise<TotemEntity[]> {
    const totems: TotemEntity[] = [];

    for (let i = 1; i <= request.count; i++) {
      const name = `${request.prefix} ${String(i).padStart(3, '0')}`;
      const accessCode = randomBytes(16).toString('hex');

      const totem = await this.totemRepository.create({
        name,
        accessCode,
        status: 'INACTIVE',
        price: request.price,
        discount: request.discount,
      });

      totems.push(totem);
    }

    return totems;
  }
}
