import {
  makeCreatePersonUseCase,
  makeDeletePersonUseCase,
  makeExportPersonsUseCase,
  makeGetPersonUseCase,
  makeImportPersonsUseCase,
  makeListPersonsUseCase,
  makeUpdatePersonUseCase,
} from '@/core/infrastructure/factories';

import {
  CreatePersonController,
  DeletePersonController,
  ExportPersonsController,
  GetPersonController,
  ImportPersonsController,
  ListPersonsController,
  UpdatePersonController,
} from '../controllers/person';

export function makeCreatePersonController(): CreatePersonController {
  return new CreatePersonController(makeCreatePersonUseCase());
}

export function makeGetPersonController(): GetPersonController {
  return new GetPersonController(makeGetPersonUseCase());
}

export function makeUpdatePersonController(): UpdatePersonController {
  return new UpdatePersonController(makeUpdatePersonUseCase());
}

export function makeDeletePersonController(): DeletePersonController {
  return new DeletePersonController(makeDeletePersonUseCase());
}

export function makeListPersonsController(): ListPersonsController {
  return new ListPersonsController(makeListPersonsUseCase());
}

export function makeImportPersonsController(): ImportPersonsController {
  return new ImportPersonsController(makeImportPersonsUseCase());
}

export function makeExportPersonsController(): ExportPersonsController {
  return new ExportPersonsController(makeExportPersonsUseCase());
}
