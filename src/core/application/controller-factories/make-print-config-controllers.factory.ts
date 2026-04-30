import {
  makeAssociatePrintConfigUseCase,
  makeCreatePrintConfigUseCase,
  makeDuplicatePrintConfigUseCase,
  makeGetPrintConfigUseCase,
  makeUpdatePrintConfigUseCase,
} from '@/core/infrastructure/factories';

import {
  AssociatePrintConfigController,
  CreatePrintConfigController,
  DuplicatePrintConfigController,
  GetPrintConfigController,
  UpdatePrintConfigController,
} from '../controllers/print-config';

export function makeCreatePrintConfigController(): CreatePrintConfigController {
  return new CreatePrintConfigController(makeCreatePrintConfigUseCase());
}

export function makeGetPrintConfigController(): GetPrintConfigController {
  return new GetPrintConfigController(makeGetPrintConfigUseCase());
}

export function makeUpdatePrintConfigController(): UpdatePrintConfigController {
  return new UpdatePrintConfigController(makeUpdatePrintConfigUseCase());
}

export function makeDuplicatePrintConfigController(): DuplicatePrintConfigController {
  return new DuplicatePrintConfigController(makeDuplicatePrintConfigUseCase());
}

export function makeAssociatePrintConfigController(): AssociatePrintConfigController {
  return new AssociatePrintConfigController(makeAssociatePrintConfigUseCase());
}
