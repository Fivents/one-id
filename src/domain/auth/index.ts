// Entities
export { AuthIdentityEntity } from './entities/auth-identity.entity';
export type { AuthIdentityProps } from './entities/auth-identity.entity';
export { TotemEntity } from './entities/totem.entity';
export type { TotemProps } from './entities/totem.entity';
export { UserEntity } from './entities/user.entity';
export type { UserProps, UserWithMembership } from './entities/user.entity';

// Value Objects
export { ADMIN_ROLES, CLIENT_ROLES, isAdminRole, isClientRole } from './value-objects/role';
export type { Role } from './value-objects/role';

// Domain Services
export { AdminDomainError, AdminDomainService } from './services/admin-domain.service';

// Contracts
export type {
  CreateSessionData,
  CreateTotemSessionData,
  GoogleUserInfo,
  IAuthIdentityRepository,
  IGoogleOAuthProvider,
  IPasswordHasher,
  ISessionRepository,
  ITokenProvider,
  ITotemRepository,
  IUserRepository,
  SetupTokenPayload,
  TotemTokenPayload,
  UserTokenPayload,
} from './contracts';
