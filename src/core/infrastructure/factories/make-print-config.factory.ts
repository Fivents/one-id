import { containerService } from '@/core/application/services';
import { AssociatePrintConfigUseCase } from '@/core/application/use-cases/print-config/associate-print-config.use-case';
import { CreatePrintConfigUseCase } from '@/core/application/use-cases/print-config/create-print-config.use-case';
import { DuplicatePrintConfigUseCase } from '@/core/application/use-cases/print-config/duplicate-print-config.use-case';
import { GetPrintConfigUseCase } from '@/core/application/use-cases/print-config/get-print-config.use-case';
import { UpdatePrintConfigUseCase } from '@/core/application/use-cases/print-config/update-print-config.use-case';

export function makeCreatePrintConfigUseCase(): CreatePrintConfigUseCase {
  return new CreatePrintConfigUseCase(containerService.getPrintConfigRepository());
}

export function makeUpdatePrintConfigUseCase(): UpdatePrintConfigUseCase {
  return new UpdatePrintConfigUseCase(containerService.getPrintConfigRepository());
}

export function makeGetPrintConfigUseCase(): GetPrintConfigUseCase {
  return new GetPrintConfigUseCase(containerService.getPrintConfigRepository());
}

export function makeAssociatePrintConfigUseCase(): AssociatePrintConfigUseCase {
  return new AssociatePrintConfigUseCase(
    containerService.getEventRepository(),
    containerService.getPrintConfigRepository(),
  );
}

export function makeDuplicatePrintConfigUseCase(): DuplicatePrintConfigUseCase {
  return new DuplicatePrintConfigUseCase(containerService.getPrintConfigRepository());
}
