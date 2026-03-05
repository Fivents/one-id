import { containerService } from '@/core/application/services';
import { CreatePersonUseCase } from '@/core/application/use-cases/person/create-person.use-case';
import { DeletePersonUseCase } from '@/core/application/use-cases/person/delete-person.use-case';
import { ExportPersonsUseCase } from '@/core/application/use-cases/person/export-persons.use-case';
import { GetPersonUseCase } from '@/core/application/use-cases/person/get-person.use-case';
import { ImportPersonsUseCase } from '@/core/application/use-cases/person/import-persons.use-case';
import { ListPersonsUseCase } from '@/core/application/use-cases/person/list-persons.use-case';
import { UpdatePersonUseCase } from '@/core/application/use-cases/person/update-person.use-case';

export function makeCreatePersonUseCase(): CreatePersonUseCase {
  return new CreatePersonUseCase(containerService.getPersonRepository());
}

export function makeUpdatePersonUseCase(): UpdatePersonUseCase {
  return new UpdatePersonUseCase(containerService.getPersonRepository());
}

export function makeDeletePersonUseCase(): DeletePersonUseCase {
  return new DeletePersonUseCase(containerService.getPersonRepository());
}

export function makeGetPersonUseCase(): GetPersonUseCase {
  return new GetPersonUseCase(containerService.getPersonRepository());
}

export function makeListPersonsUseCase(): ListPersonsUseCase {
  return new ListPersonsUseCase(containerService.getPersonRepository());
}

export function makeImportPersonsUseCase(): ImportPersonsUseCase {
  return new ImportPersonsUseCase(containerService.getPersonRepository());
}

export function makeExportPersonsUseCase(): ExportPersonsUseCase {
  return new ExportPersonsUseCase(containerService.getPersonRepository());
}
