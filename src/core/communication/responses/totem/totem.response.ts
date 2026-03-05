import type { TotemStatus } from '@/core/domain/entities/totem.entity';

export interface TotemResponse {
  id: string;
  name: string;
  accessCode: string;
  status: TotemStatus;
  price: number;
  discount: number;
  lastHeartbeat: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
