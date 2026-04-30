import {
  ITotemEventSubscriptionRepository,
  ITotemOrganizationSubscriptionRepository,
  ITotemRepository,
} from '@/core/domain/contracts';
import { TotemNotFoundError } from '@/core/errors';

export class TotemManagementService {
  constructor(
    private readonly totemRepository: ITotemRepository,
    private readonly totemOrgSubRepository: ITotemOrganizationSubscriptionRepository,
    private readonly totemEventSubRepository: ITotemEventSubscriptionRepository,
  ) {}

  async getTotemStatus(totemId: string): Promise<{
    totem: Record<string, unknown>;
    isOnline: boolean;
    activeOrgSubscriptions: number;
    activeEventSubscriptions: number;
  }> {
    const totem = await this.totemRepository.findById(totemId);
    if (!totem) {
      throw new TotemNotFoundError(totemId);
    }

    const orgSubs = await this.totemOrgSubRepository.findByOrganization(totemId);
    const activeOrgSubs = orgSubs.filter((s) => s.isActive());

    let activeEventSubs = 0;
    for (const orgSub of activeOrgSubs) {
      const eventSubs = await this.totemEventSubRepository.findByEvent(orgSub.id);
      activeEventSubs += eventSubs.filter((s) => s.isActive()).length;
    }

    return {
      totem: totem.toJSON(),
      isOnline: totem.isOnline(),
      activeOrgSubscriptions: activeOrgSubs.length,
      activeEventSubscriptions: activeEventSubs,
    };
  }
}
