import { containerService } from '@/core/application/services';
import { CheckParticipantCheckInUseCase } from '@/core/application/use-cases/check-in/check-participant-checkin.use-case';
import { ListEventCheckInsUseCase } from '@/core/application/use-cases/check-in/list-event-checkins.use-case';
import { ListParticipantCheckInsUseCase } from '@/core/application/use-cases/check-in/list-participant-checkins.use-case';
import { RegisterFaceCheckInUseCase } from '@/core/application/use-cases/check-in/register-face-checkin.use-case';
import { RegisterManualCheckInUseCase } from '@/core/application/use-cases/check-in/register-manual-checkin.use-case';
import { RegisterQrCheckInUseCase } from '@/core/application/use-cases/check-in/register-qr-checkin.use-case';

export function makeRegisterManualCheckInUseCase(): RegisterManualCheckInUseCase {
  return new RegisterManualCheckInUseCase(
    containerService.getCheckInRepository(),
    containerService.getEventParticipantRepository(),
    containerService.getTotemEventSubscriptionRepository(),
  );
}

export function makeRegisterQrCheckInUseCase(): RegisterQrCheckInUseCase {
  return new RegisterQrCheckInUseCase(
    containerService.getCheckInRepository(),
    containerService.getEventParticipantRepository(),
    containerService.getTotemEventSubscriptionRepository(),
  );
}

export function makeRegisterFaceCheckInUseCase(): RegisterFaceCheckInUseCase {
  return new RegisterFaceCheckInUseCase(
    containerService.getCheckInRepository(),
    containerService.getEventParticipantRepository(),
    containerService.getTotemEventSubscriptionRepository(),
  );
}

export function makeCheckParticipantCheckInUseCase(): CheckParticipantCheckInUseCase {
  return new CheckParticipantCheckInUseCase(containerService.getCheckInRepository());
}

export function makeListEventCheckInsUseCase(): ListEventCheckInsUseCase {
  return new ListEventCheckInsUseCase(containerService.getCheckInRepository());
}

export function makeListParticipantCheckInsUseCase(): ListParticipantCheckInsUseCase {
  return new ListParticipantCheckInsUseCase(containerService.getCheckInRepository());
}
