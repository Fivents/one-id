import type { PlanChangeRequestEntity, PlanRequestStatus } from '../entities/plan-change-request.entity';

export interface CreatePlanChangeRequestData {
  message: string;
  organizationId: string;
  currentPlanId: string;
  requestedPlanId: string;
}

export interface ResolvePlanChangeRequestData {
  status: Exclude<PlanRequestStatus, 'PENDING'>;
  resolvedById: string;
  resolvedNote?: string | null;
}

export interface IPlanChangeRequestRepository {
  findById(id: string): Promise<PlanChangeRequestEntity | null>;
  findPendingByOrganization(organizationId: string): Promise<PlanChangeRequestEntity[]>;
  findAllPending(): Promise<PlanChangeRequestEntity[]>;
  create(data: CreatePlanChangeRequestData): Promise<PlanChangeRequestEntity>;
  resolve(id: string, data: ResolvePlanChangeRequestData): Promise<PlanChangeRequestEntity>;
}
