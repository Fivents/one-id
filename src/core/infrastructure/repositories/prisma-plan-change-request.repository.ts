import type {
  CreatePlanChangeRequestData,
  IPlanChangeRequestRepository,
  ResolvePlanChangeRequestData,
} from '@/core/domain/contracts';
import { PlanChangeRequestEntity, type PlanRequestStatus } from '@/core/domain/entities';
import type { PrismaClient } from '@/generated/prisma/client';

export class PrismaPlanChangeRequestRepository implements IPlanChangeRequestRepository {
  constructor(private readonly db: PrismaClient) {}

  async findById(id: string): Promise<PlanChangeRequestEntity | null> {
    const request = await this.db.planChangeRequest.findUnique({
      where: { id },
    });

    if (!request) return null;

    return PlanChangeRequestEntity.create({
      id: request.id,
      message: request.message,
      status: request.status as PlanRequestStatus,
      organizationId: request.organizationId,
      currentPlanId: request.currentPlanId,
      requestedPlanId: request.requestedPlanId,
      resolvedAt: request.resolvedAt,
      resolvedById: request.resolvedById,
      resolvedNote: request.resolvedNote,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
    });
  }

  async findPendingByOrganization(organizationId: string): Promise<PlanChangeRequestEntity[]> {
    const requests = await this.db.planChangeRequest.findMany({
      where: { organizationId, status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
    });

    return requests.map((request) =>
      PlanChangeRequestEntity.create({
        id: request.id,
        message: request.message,
        status: request.status as PlanRequestStatus,
        organizationId: request.organizationId,
        currentPlanId: request.currentPlanId,
        requestedPlanId: request.requestedPlanId,
        resolvedAt: request.resolvedAt,
        resolvedById: request.resolvedById,
        resolvedNote: request.resolvedNote,
        createdAt: request.createdAt,
        updatedAt: request.updatedAt,
      }),
    );
  }

  async findAllPending(): Promise<PlanChangeRequestEntity[]> {
    const requests = await this.db.planChangeRequest.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
    });

    return requests.map((request) =>
      PlanChangeRequestEntity.create({
        id: request.id,
        message: request.message,
        status: request.status as PlanRequestStatus,
        organizationId: request.organizationId,
        currentPlanId: request.currentPlanId,
        requestedPlanId: request.requestedPlanId,
        resolvedAt: request.resolvedAt,
        resolvedById: request.resolvedById,
        resolvedNote: request.resolvedNote,
        createdAt: request.createdAt,
        updatedAt: request.updatedAt,
      }),
    );
  }

  async create(data: CreatePlanChangeRequestData): Promise<PlanChangeRequestEntity> {
    const request = await this.db.planChangeRequest.create({
      data: {
        message: data.message,
        organizationId: data.organizationId,
        currentPlanId: data.currentPlanId,
        requestedPlanId: data.requestedPlanId,
      },
    });

    return PlanChangeRequestEntity.create({
      id: request.id,
      message: request.message,
      status: request.status as PlanRequestStatus,
      organizationId: request.organizationId,
      currentPlanId: request.currentPlanId,
      requestedPlanId: request.requestedPlanId,
      resolvedAt: request.resolvedAt,
      resolvedById: request.resolvedById,
      resolvedNote: request.resolvedNote,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
    });
  }

  async resolve(id: string, data: ResolvePlanChangeRequestData): Promise<PlanChangeRequestEntity> {
    const request = await this.db.planChangeRequest.update({
      where: { id },
      data: {
        status: data.status,
        resolvedById: data.resolvedById,
        resolvedNote: data.resolvedNote,
        resolvedAt: new Date(),
      },
    });

    return PlanChangeRequestEntity.create({
      id: request.id,
      message: request.message,
      status: request.status as PlanRequestStatus,
      organizationId: request.organizationId,
      currentPlanId: request.currentPlanId,
      requestedPlanId: request.requestedPlanId,
      resolvedAt: request.resolvedAt,
      resolvedById: request.resolvedById,
      resolvedNote: request.resolvedNote,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
    });
  }
}
