import { IOrganizationRepository, IPlanRepository, ISubscriptionRepository } from '@/core/domain/contracts';
import type { SubscriptionEntity } from '@/core/domain/entities/subscription.entity';

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
      throw new CreateSubscriptionError('Organization not found.');
    }

    const plan = await this.planRepository.findById(input.planId);
    if (!plan) {
      throw new CreateSubscriptionError('Plan not found.');
    }

    if (!plan.isAvailable()) {
      throw new CreateSubscriptionError('Plan is not available.');
    }

    const existing = await this.subscriptionRepository.findByOrganization(input.organizationId);
    if (existing && existing.isActive()) {
      throw new CreateSubscriptionError('Organization already has an active subscription.');
    }

    return this.subscriptionRepository.create({
      organizationId: input.organizationId,
      planId: input.planId,
      startedAt: input.startedAt,
      expiresAt: input.expiresAt,
    });
  }
}

export class CreateSubscriptionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CreateSubscriptionError';
  }
}
