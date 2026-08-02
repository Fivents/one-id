import type {
  CreatePersonData,
  IEventParticipantRepository,
  IEventRepository,
  IPersonRepository,
  UpdatePersonData,
} from '@/core/domain/contracts';
import type { DocumentType, PersonEntity } from '@/core/domain/entities';
import { type CodeSourceField, resolveDerivedCodeUnique } from '@/core/utils/derived-code';

export interface ImportPersonItem {
  name: string;
  email?: string | null;
  document?: string | null;
  documentType?: string | null;
  phone?: string | null;
  jobTitle?: string | null;
  birthDate?: Date | null;
  notes?: string | null;
}

export interface ImportCodeSettings {
  accessCodeSource: CodeSourceField;
  qrCodeSource: CodeSourceField;
  credentialLength: number;
}

export interface ImportResult {
  created: PersonEntity[];
  updated: PersonEntity[];
  skipped: string[];
  errors: { row: number; message: string }[];
}

export class ImportPersonsUseCase {
  constructor(
    private readonly personRepository: IPersonRepository,
    private readonly eventRepository: IEventRepository,
    private readonly eventParticipantRepository: IEventParticipantRepository,
  ) {}

  async execute(
    organizationId: string,
    persons: ImportPersonItem[],
    overwrite: boolean = false,
    codeSettings?: ImportCodeSettings,
  ): Promise<ImportResult> {
    const result: ImportResult = { created: [], updated: [], skipped: [], errors: [] };

    const orgEvents = await this.eventRepository.findByOrganization(organizationId);
    const autoLinkEventIds = orgEvents.filter((event) => event.autoLinkNewPeople).map((event) => event.id);

    for (let i = 0; i < persons.length; i++) {
      const personData = persons[i];

      try {
        let existing: PersonEntity | null = null;

        if (personData.email) {
          existing = await this.personRepository.findByEmailAndOrganization(personData.email, organizationId);
        }

        if (!existing && personData.document) {
          existing = await this.personRepository.findByDocumentAndOrganization(personData.document, organizationId);
        }

        if (existing) {
          if (overwrite) {
            const updateData: UpdatePersonData = {
              name: personData.name,
              document: personData.document,
              documentType: personData.documentType as DocumentType | null | undefined,
              phone: personData.phone,
              jobTitle: personData.jobTitle,
              birthDate: personData.birthDate,
              notes: personData.notes,
            };
            if (personData.email) {
              updateData.email = personData.email;
            }
            const updated = await this.personRepository.update(existing.id, updateData);
            result.updated.push(updated);
          } else {
            result.skipped.push(personData.name);
          }
        } else {
          const accessCodeResolved = await resolveDerivedCodeUnique(
            {
              explicitValue: undefined,
              sourceField: codeSettings?.accessCodeSource ?? 'NONE',
              document: personData.document,
              phone: personData.phone,
              email: personData.email,
              credentialLength: codeSettings?.credentialLength ?? 8,
              uppercase: true,
            },
            (value) => this.personRepository.isCodeTaken(organizationId, 'accessCode', value),
          );
          const qrCodeResolved = await resolveDerivedCodeUnique(
            {
              explicitValue: undefined,
              sourceField: codeSettings?.qrCodeSource ?? 'NONE',
              document: personData.document,
              phone: personData.phone,
              email: personData.email,
              credentialLength: codeSettings?.credentialLength ?? 8,
              uppercase: false,
            },
            (value) => this.personRepository.isCodeTaken(organizationId, 'qrCodeValue', value),
          );

          const createData: CreatePersonData = {
            name: personData.name,
            email: personData.email || '',
            document: personData.document,
            documentType: personData.documentType as DocumentType | null | undefined,
            phone: personData.phone,
            jobTitle: personData.jobTitle,
            birthDate: personData.birthDate,
            notes: personData.notes,
            qrCodeValue: qrCodeResolved.value,
            accessCode: accessCodeResolved.value,
            accessCodeProvenance: accessCodeResolved.provenance,
            qrCodeProvenance: qrCodeResolved.provenance,
            organizationId,
          };
          const created = await this.personRepository.create(createData);
          result.created.push(created);

          for (const eventId of autoLinkEventIds) {
            await this.eventParticipantRepository.create({
              personId: created.id,
              eventId,
              qrCodeValue: qrCodeResolved.value,
              accessCode: accessCodeResolved.value,
              accessCodeProvenance: accessCodeResolved.provenance,
              qrCodeProvenance: qrCodeResolved.provenance,
            });
          }
        }
      } catch (error) {
        result.errors.push({
          row: i + 1,
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return result;
  }
}
