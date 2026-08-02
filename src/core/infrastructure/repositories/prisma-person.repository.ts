import type { CreatePersonData, IPersonRepository, UpdatePersonData } from '@/core/domain/contracts';
import { type CodeProvenance, type DocumentType, PersonEntity } from '@/core/domain/entities';
import type { PrismaClient } from '@/generated/prisma/client';

export class PrismaPersonRepository implements IPersonRepository {
  constructor(private readonly db: PrismaClient) {}

  async findById(id: string): Promise<PersonEntity | null> {
    const person = await this.db.person.findUnique({
      where: { id, deletedAt: null },
    });

    if (!person) return null;

    return PersonEntity.create({
      id: person.id,
      name: person.name,
      email: person.email,
      document: person.document,
      documentType: person.documentType as DocumentType | null,
      phone: person.phone,
      jobTitle: person.jobTitle,
      birthDate: person.birthDate,
      notes: person.notes,
      qrCodeValue: person.qrCodeValue,
      accessCode: person.accessCode,
      accessCodeProvenance: person.accessCodeProvenance as CodeProvenance,
      qrCodeProvenance: person.qrCodeProvenance as CodeProvenance,
      organizationId: person.organizationId,
      createdAt: person.createdAt,
      updatedAt: person.updatedAt,
      deletedAt: person.deletedAt,
    });
  }

  async findByEmailAndOrganization(email: string, organizationId: string): Promise<PersonEntity | null> {
    const person = await this.db.person.findFirst({
      where: { email, organizationId, deletedAt: null },
    });

    if (!person) return null;

    return     PersonEntity.create({
      id: person.id,
      name: person.name,
      email: person.email,
      document: person.document,
      documentType: person.documentType as DocumentType | null,
      phone: person.phone,
      jobTitle: person.jobTitle,
      birthDate: person.birthDate,
      notes: person.notes,
      qrCodeValue: person.qrCodeValue,
      accessCode: person.accessCode,
      accessCodeProvenance: person.accessCodeProvenance as CodeProvenance,
      qrCodeProvenance: person.qrCodeProvenance as CodeProvenance,
      organizationId: person.organizationId,
      createdAt: person.createdAt,
      updatedAt: person.updatedAt,
      deletedAt: person.deletedAt,
    });
  }

  async findByDocumentAndOrganization(document: string, organizationId: string): Promise<PersonEntity | null> {
    const person = await this.db.person.findFirst({
      where: { document, organizationId, deletedAt: null },
    });

    if (!person) return null;

    return PersonEntity.create({
      id: person.id,
      name: person.name,
      email: person.email,
      document: person.document,
      documentType: person.documentType as DocumentType | null,
      phone: person.phone,
      jobTitle: person.jobTitle,
      birthDate: person.birthDate,
      notes: person.notes,
      qrCodeValue: person.qrCodeValue,
      accessCode: person.accessCode,
      accessCodeProvenance: person.accessCodeProvenance as CodeProvenance,
      qrCodeProvenance: person.qrCodeProvenance as CodeProvenance,
      organizationId: person.organizationId,
      createdAt: person.createdAt,
      updatedAt: person.updatedAt,
      deletedAt: person.deletedAt,
    });
  }

  async findByOrganization(organizationId: string): Promise<PersonEntity[]> {
    const persons = await this.db.person.findMany({
      where: { organizationId, deletedAt: null },
    });

    return persons.map((person) =>
      PersonEntity.create({
        id: person.id,
        name: person.name,
        email: person.email,
        document: person.document,
        documentType: person.documentType as DocumentType | null,
        phone: person.phone,
        jobTitle: person.jobTitle,
        birthDate: person.birthDate,
        notes: person.notes,
        qrCodeValue: person.qrCodeValue,
        accessCode: person.accessCode,
        accessCodeProvenance: person.accessCodeProvenance as CodeProvenance,
        qrCodeProvenance: person.qrCodeProvenance as CodeProvenance,
        organizationId: person.organizationId,
        createdAt: person.createdAt,
        updatedAt: person.updatedAt,
        deletedAt: person.deletedAt,
      }),
    );
  }

  async create(data: CreatePersonData): Promise<PersonEntity> {
    const person = await this.db.person.create({
      data: {
        name: data.name,
        email: data.email,
        document: data.document,
        documentType: data.documentType,
        phone: data.phone,
        jobTitle: data.jobTitle,
        birthDate: data.birthDate,
        notes: data.notes,
        qrCodeValue: data.qrCodeValue,
        accessCode: data.accessCode,
        accessCodeProvenance: data.accessCodeProvenance,
        qrCodeProvenance: data.qrCodeProvenance,
        organizationId: data.organizationId,
      },
    });

    return PersonEntity.create({
      id: person.id,
      name: person.name,
      email: person.email,
      document: person.document,
      documentType: person.documentType as DocumentType | null,
      phone: person.phone,
      jobTitle: person.jobTitle,
      birthDate: person.birthDate,
      notes: person.notes,
      qrCodeValue: person.qrCodeValue,
      accessCode: person.accessCode,
      accessCodeProvenance: person.accessCodeProvenance as CodeProvenance,
      qrCodeProvenance: person.qrCodeProvenance as CodeProvenance,
      organizationId: person.organizationId,
      createdAt: person.createdAt,
      updatedAt: person.updatedAt,
      deletedAt: person.deletedAt,
    });
  }

  async update(id: string, data: UpdatePersonData): Promise<PersonEntity> {
    const person = await this.db.person.update({
      where: { id },
      data: {
        name: data.name,
        email: data.email,
        document: data.document,
        documentType: data.documentType,
        phone: data.phone,
        jobTitle: data.jobTitle,
        birthDate: data.birthDate,
        notes: data.notes,
        qrCodeValue: data.qrCodeValue,
        accessCode: data.accessCode,
        accessCodeProvenance: data.accessCodeProvenance,
        qrCodeProvenance: data.qrCodeProvenance,
      },
    });

    return PersonEntity.create({
      id: person.id,
      name: person.name,
      email: person.email,
      document: person.document,
      documentType: person.documentType as DocumentType | null,
      phone: person.phone,
      jobTitle: person.jobTitle,
      birthDate: person.birthDate,
      notes: person.notes,
      qrCodeValue: person.qrCodeValue,
      accessCode: person.accessCode,
      accessCodeProvenance: person.accessCodeProvenance as CodeProvenance,
      qrCodeProvenance: person.qrCodeProvenance as CodeProvenance,
      organizationId: person.organizationId,
      createdAt: person.createdAt,
      updatedAt: person.updatedAt,
      deletedAt: person.deletedAt,
    });
  }

  async softDelete(id: string): Promise<void> {
    await this.db.person.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async isCodeTaken(
    organizationId: string,
    field: 'accessCode' | 'qrCodeValue',
    value: string,
    excludePersonId?: string,
  ): Promise<boolean> {
    const person = await this.db.person.findFirst({
      where: {
        organizationId,
        deletedAt: null,
        [field]: value,
        ...(excludePersonId ? { id: { not: excludePersonId } } : {}),
      },
      select: { id: true },
    });

    return person !== null;
  }
}
