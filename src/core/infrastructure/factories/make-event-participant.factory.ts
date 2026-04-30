import { containerService } from '@/core/application/services';
import { GetParticipantUseCase } from '@/core/application/use-cases/event-participant/get-participant.use-case';
import { ListParticipantsUseCase } from '@/core/application/use-cases/event-participant/list-participants.use-case';
import { RegisterParticipantUseCase } from '@/core/application/use-cases/event-participant/register-participant.use-case';
import { RemoveParticipantUseCase } from '@/core/application/use-cases/event-participant/remove-participant.use-case';
import { UpdateParticipantUseCase } from '@/core/application/use-cases/event-participant/update-participant.use-case';

export function makeRegisterParticipantUseCase(): RegisterParticipantUseCase {
  return new RegisterParticipantUseCase(containerService.getEventParticipantRepository());
}

export function makeRemoveParticipantUseCase(): RemoveParticipantUseCase {
  return new RemoveParticipantUseCase(containerService.getEventParticipantRepository());
}

export function makeUpdateParticipantUseCase(): UpdateParticipantUseCase {
  return new UpdateParticipantUseCase(containerService.getEventParticipantRepository());
}

export function makeListParticipantsUseCase(): ListParticipantsUseCase {
  return new ListParticipantsUseCase(containerService.getEventParticipantRepository());
}

export function makeGetParticipantUseCase(): GetParticipantUseCase {
  return new GetParticipantUseCase(containerService.getEventParticipantRepository());
}
