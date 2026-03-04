import type { OrganizationEntity } from '../entities/organization.entity';

export interface CreateOrganizationData {
  name: string;
  slug: string;
  email?: string | null;
  phone?: string | null;
  logoUrl?: string | null;
}

export interface UpdateOrganizationData {
  name?: string;
  slug?: string;
  email?: string | null;
  phone?: string | null;
  logoUrl?: string | null;
  isActive?: boolean;
}

export interface IOrganizationRepository {
  findById(id: string): Promise<OrganizationEntity | null>;
  findBySlug(slug: string): Promise<OrganizationEntity | null>;
  create(data: CreateOrganizationData): Promise<OrganizationEntity>;
  update(id: string, data: UpdateOrganizationData): Promise<OrganizationEntity>;
  softDelete(id: string): Promise<void>;
}
