import type { ITotemRepository } from '@/core/domain/contracts';
import type { TotemEntity } from '@/core/domain/entities';

interface CreateAdminTotemData {
  name: string;
  price: number;
  discount: number;
}

export class CreateAdminTotemUseCase {
  constructor(private readonly totemRepository: ITotemRepository) {}

  async execute(data: CreateAdminTotemData): Promise<TotemEntity> {
    return this.totemRepository.create({
      name: data.name,
      status: 'INACTIVE',
      price: data.price,
      discount: data.discount,
    });
  }
}
