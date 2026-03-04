const ALLOWED_ADMIN_DOMAIN = 'fivents.com';

export class AdminDomainService {
  static isAllowedAdminDomain(email: string): boolean {
    const domain = email.split('@')[1]?.toLowerCase();
    return domain === ALLOWED_ADMIN_DOMAIN;
  }

  static validateAdminEmail(email: string): void {
    if (!this.isAllowedAdminDomain(email)) {
      throw new AdminDomainError(`Email domain not authorized. Only @${ALLOWED_ADMIN_DOMAIN} accounts are allowed.`);
    }
  }
}

export class AdminDomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AdminDomainError';
  }
}
