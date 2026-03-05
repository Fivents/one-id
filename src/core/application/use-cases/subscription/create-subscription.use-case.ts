import { IOrganizationRepository, IPlanRepository, ISubscriptionRepository } from '@/core/domain/contracts';
import type { SubscriptionEntity } from '@/core/domain/entities/subscription.entity';
import { AppError, ErrorCode, OrganizationNotFoundError } from '@/core/errors';

interface CreateSubscriptionInput {
  organizationId: string;
  planId: string;
  startedAt: Date;
  expiresAt: Date;
}

export class CreateSubscriptionUseCase {
  constructor(
    private readonly subscriptionRepository: ISubscriptionRepository,
    private readonly organizationRepository: IOrganizationRepository,
    private readonly planRepository: IPlanRepository,
  ) {}

  async execute(input: CreateSubscriptionInput): Promise<SubscriptionEntity> {
    const organization = await this.organizationRepository.findById(input.organizationId);
    if (!organization) {
      throw new OrganizationNotFoundError(input.organizationId);
    }

    const plan = await this.planRepository.findById(input.planId);
    if (!plan) {
      throw new AppError({
        code: ErrorCode.PLAN_NOT_FOUND,
        message: 'Plan not found.',
        httpStatus: 404,
        level: 'warning',
        context: { planId: input.planId },
      });
    }

    if (!plan.isAvailable()) {
      throw new AppError({
        code: ErrorCode.PLAN_NOT_AVAILABLE,
        message: 'Plan is not available.',
        httpStatus: 409,
        level: 'warning',
        context: { planId: input.planId },
      });
    }

    const existing = await this.subscriptionRepository.findByOrganization(input.organizationId);
    if (existing && existing.isActive()) {
      throw new AppError({
        code: ErrorCode.SUBSCRIPTION_ALREADY_ACTIVE,
        message: 'Organization already has an active subscription.',
        httpStatus: 409,
        level: 'warning',
        context: { organizationId: input.organizationId },
      });
    }

    return this.subscriptionRepository.create({
      organizationId: input.organizationId,
      planId: input.planId,
      startedAt: input.startedAt,
      expiresAt: input.expiresAt,
    });
  }
}
