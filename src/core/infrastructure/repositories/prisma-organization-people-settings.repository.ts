import type {
  IOrganizationPeopleSettingsRepository,
  UpsertOrganizationPeopleSettingsData,
} from '@/core/domain/contracts';
import { type CodeSourceField, OrganizationPeopleSettingsEntity } from '@/core/domain/entities';
import type { PrismaClient } from '@/generated/prisma/client';

export class PrismaOrganizationPeopleSettingsRepository implements IOrganizationPeopleSettingsRepository {
  constructor(private readonly db: PrismaClient) {}

  async findByOrganizationId(organizationId: string): Promise<OrganizationPeopleSettingsEntity | null> {
    const settings = await this.db.organizationPeopleSettings.findUnique({
      where: { organizationId },
    });

    if (!settings) return null;

    return OrganizationPeopleSettingsEntity.create({
      id: settings.id,
      organizationId: settings.organizationId,
      accessCodeSource: settings.accessCodeSource as CodeSourceField,
      qrCodeSource: settings.qrCodeSource as CodeSourceField,
      createdAt: settings.createdAt,
      updatedAt: settings.updatedAt,
    });
  }

  async upsertByOrganizationId(
    organizationId: string,
    data: UpsertOrganizationPeopleSettingsData,
  ): Promise<OrganizationPeopleSettingsEntity> {
    const settings = await this.db.organizationPeopleSettings.upsert({
      where: { organizationId },
      create: {
        organizationId,
        accessCodeSource: data.accessCodeSource ?? 'NONE',
        qrCodeSource: data.qrCodeSource ?? 'NONE',
      },
      update: {
        accessCodeSource: data.accessCodeSource,
        qrCodeSource: data.qrCodeSource,
      },
    });

    return OrganizationPeopleSettingsEntity.create({
      id: settings.id,
      organizationId: settings.organizationId,
      accessCodeSource: settings.accessCodeSource as CodeSourceField,
      qrCodeSource: settings.qrCodeSource as CodeSourceField,
      createdAt: settings.createdAt,
      updatedAt: settings.updatedAt,
    });
  }
}
