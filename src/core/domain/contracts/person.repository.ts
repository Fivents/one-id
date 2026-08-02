import type { CodeProvenance } from '../entities/organization-people-settings.entity';
import type { DocumentType, PersonEntity } from '../entities/person.entity';

export interface CreatePersonData {
  name: string;
  email: string;
  document?: string | null;
  documentType?: DocumentType | null;
  phone?: string | null;
  jobTitle?: string | null;
  birthDate?: Date | null;
  notes?: string | null;
  qrCodeValue?: string | null;
  accessCode?: string | null;
  accessCodeProvenance?: CodeProvenance;
  qrCodeProvenance?: CodeProvenance;
  organizationId: string;
}

export interface UpdatePersonData {
  name?: string;
  email?: string;
  document?: string | null;
  documentType?: DocumentType | null;
  phone?: string | null;
  jobTitle?: string | null;
  birthDate?: Date | null;
  notes?: string | null;
  qrCodeValue?: string | null;
  accessCode?: string | null;
  accessCodeProvenance?: CodeProvenance;
  qrCodeProvenance?: CodeProvenance;
}

export interface IPersonRepository {
  findById(id: string): Promise<PersonEntity | null>;
  findByEmailAndOrganization(email: string, organizationId: string): Promise<PersonEntity | null>;
  findByDocumentAndOrganization(document: string, organizationId: string): Promise<PersonEntity | null>;
  findByOrganization(organizationId: string): Promise<PersonEntity[]>;
  create(data: CreatePersonData): Promise<PersonEntity>;
  update(id: string, data: UpdatePersonData): Promise<PersonEntity>;
  softDelete(id: string): Promise<void>;
  isCodeTaken(
    organizationId: string,
    field: 'accessCode' | 'qrCodeValue',
    value: string,
    excludePersonId?: string,
  ): Promise<boolean>;
}
