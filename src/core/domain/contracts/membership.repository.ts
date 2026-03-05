import type { MembershipEntity } from '../entities/membership.entity';
import type { Role } from '../value-objects/role';

export interface CreateMembershipData {
  role: Role;
  userId: string;
  organizationId: string;
}

export interface IMembershipRepository {
  findById(id: string): Promise<MembershipEntity | null>;
  findByUserAndOrganization(userId: string, organizationId: string): Promise<MembershipEntity | null>;
  findByOrganization(organizationId: string): Promise<MembershipEntity[]>;
  findByUser(userId: string): Promise<MembershipEntity[]>;
  create(data: CreateMembershipData): Promise<MembershipEntity>;
  updateRole(id: string, role: Role): Promise<MembershipEntity>;
  softDelete(id: string): Promise<void>;
}
