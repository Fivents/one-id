import type { DocumentType, PersonEntity } from '../entities/person.entity';

export interface CreatePersonData {
  name: string;
  email: string;
  document?: string | null;
  documentType?: DocumentType | null;
  phone?: string | null;
  qrCodeValue?: string | null;
  accessCode?: string | null;
  organizationId: string;
}

export interface UpdatePersonData {
  name?: string;
  email?: string;
  document?: string | null;
  documentType?: DocumentType | null;
  phone?: string | null;
  qrCodeValue?: string | null;
  accessCode?: string | null;
}

export interface IPersonRepository {
  findById(id: string): Promise<PersonEntity | null>;
  findByEmailAndOrganization(email: string, organizationId: string): Promise<PersonEntity | null>;
  findByOrganization(organizationId: string): Promise<PersonEntity[]>;
  create(data: CreatePersonData): Promise<PersonEntity>;
  update(id: string, data: UpdatePersonData): Promise<PersonEntity>;
  softDelete(id: string): Promise<void>;
}
