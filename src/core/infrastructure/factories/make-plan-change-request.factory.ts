import { containerService } from '@/core/application/services';
import { ApproveRequestUseCase } from '@/core/application/use-cases/plan-change-request/approve-request.use-case';
import { GetRequestUseCase } from '@/core/application/use-cases/plan-change-request/get-request.use-case';
import { ListPendingRequestsUseCase } from '@/core/application/use-cases/plan-change-request/list-pending-requests.use-case';
import { RejectRequestUseCase } from '@/core/application/use-cases/plan-change-request/reject-request.use-case';
import { RequestPlanChangeUseCase } from '@/core/application/use-cases/plan-change-request/request-plan-change.use-case';

export function makeRequestPlanChangeUseCase(): RequestPlanChangeUseCase {
  return new RequestPlanChangeUseCase(
    containerService.getPlanChangeRequestRepository(),
    containerService.getSubscriptionRepository(),
    containerService.getPlanRepository(),
  );
}

export function makeApproveRequestUseCase(): ApproveRequestUseCase {
  return new ApproveRequestUseCase(
    containerService.getPlanChangeRequestRepository(),
    containerService.getSubscriptionRepository(),
  );
}

export function makeRejectRequestUseCase(): RejectRequestUseCase {
  return new RejectRequestUseCase(containerService.getPlanChangeRequestRepository());
}

export function makeListPendingRequestsUseCase(): ListPendingRequestsUseCase {
  return new ListPendingRequestsUseCase(containerService.getPlanChangeRequestRepository());
}

export function makeGetRequestUseCase(): GetRequestUseCase {
  return new GetRequestUseCase(containerService.getPlanChangeRequestRepository());
}
