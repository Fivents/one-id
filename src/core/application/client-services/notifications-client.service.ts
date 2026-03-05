import type { CreateNotificationRequest } from '@/core/communication/requests/notification';

import type { ApiResponse } from './base/api-response';
import { BaseClient } from './base/base-client';

export interface NotificationResponse {
  id: string;
  channel: string;
  type: string;
  title: string;
  message: string;
  data: Record<string, unknown> | null;
  readAt: Date | null;
  userId: string;
  createdAt: Date;
}

class NotificationsClientService extends BaseClient {
  async listNotifications(): Promise<ApiResponse<NotificationResponse[]>> {
    return this.get('/notifications');
  }

  async createNotification(data: CreateNotificationRequest): Promise<ApiResponse<NotificationResponse>> {
    return this.post('/notifications', data);
  }

  async markAsRead(notificationId: string): Promise<ApiResponse<NotificationResponse>> {
    return this.patch(`/notifications/${encodeURIComponent(notificationId)}`, { readAt: new Date() });
  }

  async deleteNotification(notificationId: string): Promise<ApiResponse<void>> {
    return this.delete(`/notifications/${encodeURIComponent(notificationId)}`);
  }
}

export const notificationsClient = new NotificationsClientService();
