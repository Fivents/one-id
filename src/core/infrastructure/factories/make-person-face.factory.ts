import { containerService } from '@/core/application/services';
import { ActivateFaceUseCase } from '@/core/application/use-cases/person-face/activate-face.use-case';
import { DeactivateFaceUseCase } from '@/core/application/use-cases/person-face/deactivate-face.use-case';
import { ListFacesUseCase } from '@/core/application/use-cases/person-face/list-faces.use-case';
import { RegisterFaceUseCase } from '@/core/application/use-cases/person-face/register-face.use-case';
import { RemoveFaceUseCase } from '@/core/application/use-cases/person-face/remove-face.use-case';

export function makeRegisterFaceUseCase(): RegisterFaceUseCase {
  return new RegisterFaceUseCase(containerService.getPersonFaceRepository());
}

export function makeRemoveFaceUseCase(): RemoveFaceUseCase {
  return new RemoveFaceUseCase(containerService.getPersonFaceRepository());
}

export function makeActivateFaceUseCase(): ActivateFaceUseCase {
  return new ActivateFaceUseCase(containerService.getPersonFaceRepository());
}

export function makeDeactivateFaceUseCase(): DeactivateFaceUseCase {
  return new DeactivateFaceUseCase(containerService.getPersonFaceRepository());
}

export function makeListFacesUseCase(): ListFacesUseCase {
  return new ListFacesUseCase(containerService.getPersonFaceRepository());
}
