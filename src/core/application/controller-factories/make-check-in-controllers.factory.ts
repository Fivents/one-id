import {
  makeCheckParticipantCheckInUseCase,
  makeListEventCheckInsUseCase,
  makeListParticipantCheckInsUseCase,
  makeRegisterFaceCheckInUseCase,
  makeRegisterManualCheckInUseCase,
  makeRegisterQrCheckInUseCase,
} from '@/core/infrastructure/factories';

import {
  CheckParticipantCheckInController,
  ListEventCheckInsController,
  ListParticipantCheckInsController,
  RegisterFaceCheckInController,
  RegisterManualCheckInController,
  RegisterQrCheckInController,
} from '../controllers/check-in';

export function makeRegisterFaceCheckInController(): RegisterFaceCheckInController {
  return new RegisterFaceCheckInController(makeRegisterFaceCheckInUseCase());
}

export function makeRegisterQrCheckInController(): RegisterQrCheckInController {
  return new RegisterQrCheckInController(makeRegisterQrCheckInUseCase());
}

export function makeRegisterManualCheckInController(): RegisterManualCheckInController {
  return new RegisterManualCheckInController(makeRegisterManualCheckInUseCase());
}

export function makeCheckParticipantCheckInController(): CheckParticipantCheckInController {
  return new CheckParticipantCheckInController(makeCheckParticipantCheckInUseCase());
}

export function makeListEventCheckInsController(): ListEventCheckInsController {
  return new ListEventCheckInsController(makeListEventCheckInsUseCase());
}

export function makeListParticipantCheckInsController(): ListParticipantCheckInsController {
  return new ListParticipantCheckInsController(makeListParticipantCheckInsUseCase());
}
