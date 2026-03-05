import {
  makeActivateFaceUseCase,
  makeDeactivateFaceUseCase,
  makeListFacesUseCase,
  makeRegisterFaceUseCase,
  makeRemoveFaceUseCase,
} from '@/core/infrastructure/factories';

import {
  ActivateFaceController,
  DeactivateFaceController,
  ListFacesController,
  RegisterFaceController,
  RemoveFaceController,
} from '../controllers/person-face';

export function makeRegisterFaceController(): RegisterFaceController {
  return new RegisterFaceController(makeRegisterFaceUseCase());
}

export function makeActivateFaceController(): ActivateFaceController {
  return new ActivateFaceController(makeActivateFaceUseCase());
}

export function makeDeactivateFaceController(): DeactivateFaceController {
  return new DeactivateFaceController(makeDeactivateFaceUseCase());
}

export function makeListFacesController(): ListFacesController {
  return new ListFacesController(makeListFacesUseCase());
}

export function makeRemoveFaceController(): RemoveFaceController {
  return new RemoveFaceController(makeRemoveFaceUseCase());
}
