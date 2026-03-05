import {
  makeApproveRequestUseCase,
  makeGetRequestUseCase,
  makeListPendingRequestsUseCase,
  makeRejectRequestUseCase,
  makeRequestPlanChangeUseCase,
} from '@/core/infrastructure/factories';

import {
  ApproveRequestController,
  GetRequestController,
  ListPendingRequestsController,
  RejectRequestController,
  RequestPlanChangeController,
} from '../controllers/plan-change-request';

export function makeRequestPlanChangeController(): RequestPlanChangeController {
  return new RequestPlanChangeController(makeRequestPlanChangeUseCase());
}

export function makeApproveRequestController(): ApproveRequestController {
  return new ApproveRequestController(makeApproveRequestUseCase());
}

export function makeRejectRequestController(): RejectRequestController {
  return new RejectRequestController(makeRejectRequestUseCase());
}

export function makeGetRequestController(): GetRequestController {
  return new GetRequestController(makeGetRequestUseCase());
}

export function makeListPendingRequestsController(): ListPendingRequestsController {
  return new ListPendingRequestsController(makeListPendingRequestsUseCase());
}
