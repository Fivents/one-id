import { CreateNotificationData, INotificationRepository } from '@/core/domain/contracts';
import type { NotificationEntity } from '@/core/domain/entities/notification.entity';

export class NotificationService {
  constructor(private readonly notificationRepository: INotificationRepository) {}

  async notifyUser(data: CreateNotificationData): Promise<NotificationEntity> {
    return this.notificationRepository.create(data);
  }

  async notifyMultipleUsers(
    userIds: string[],
    data: Omit<CreateNotificationData, 'userId'>,
  ): Promise<NotificationEntity[]> {
    const notifications = await Promise.all(
      userIds.map((userId) => this.notificationRepository.create({ ...data, userId })),
    );

    return notifications;
  }

  async notifyPlanRequestApproved(userId: string, planName: string): Promise<NotificationEntity> {
    return this.notifyUser({
      channel: 'IN_APP',
      type: 'PLAN_APPROVED',
      title: 'Plan Change Approved',
      message: `Your plan change request to "${planName}" has been approved.`,
      userId,
    });
  }

  async notifyPlanRequestRejected(userId: string, reason?: string): Promise<NotificationEntity> {
    return this.notifyUser({
      channel: 'IN_APP',
      type: 'PLAN_REJECTED',
      title: 'Plan Change Rejected',
      message: reason ?? 'Your plan change request has been rejected.',
      userId,
    });
  }

  async notifyExpirationWarning(userId: string, daysRemaining: number): Promise<NotificationEntity> {
    return this.notifyUser({
      channel: 'IN_APP',
      type: 'EXPIRATION_WARNING',
      title: 'Subscription Expiring Soon',
      message: `Your subscription expires in ${daysRemaining} days.`,
      userId,
    });
  }

  async notifyLimitWarning(userId: string, featureName: string, percentUsed: number): Promise<NotificationEntity> {
    return this.notifyUser({
      channel: 'IN_APP',
      type: 'LIMIT_WARNING',
      title: 'Feature Limit Warning',
      message: `You have used ${percentUsed}% of your "${featureName}" limit.`,
      userId,
    });
  }
}
