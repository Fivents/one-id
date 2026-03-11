import type { TotemStatus } from '@/core/domain/entities/totem.entity';

export interface TotemSubscriptionInfo {
  id: string;
  organizationId: string;
  organizationName: string;
  startsAt: Date;
  endsAt: Date;
}

export interface AdminTotemResponse {
  id: string;
  name: string;
  accessCode: string | null;
  status: TotemStatus;
  price: number;
  discount: number;
  lastHeartbeat: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  currentSubscription: TotemSubscriptionInfo | null;
  isAvailable: boolean;
  hasActiveSession: boolean;
}
