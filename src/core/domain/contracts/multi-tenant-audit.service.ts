/**
 * Multi-Tenant Audit Service Contract
 *
 * Defines the interface for audit logging and multi-tenant data
 * isolation verification across the system.
 */

export interface AuditContext {
  userId: string;
  organizationId: string;
  totemId?: string;
  eventId?: string;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
}

export interface AuditEntry {
  actionType: string; // AuditAction enum value
  context: AuditContext;
  description?: string;
  details: Record<string, unknown>;
}

export interface MultiTenantValidation {
  organizationId: string;
  recordCount: number;
  orphanedRecords: number;
  dataIntegrity: {
    personFaces: { total: number; withoutOrg: number };
    checkIns: { total: number; withoutOrg: number };
    embeddings: { total: number; encrypted: number; unencrypted: number };
  };
  isolationStatus: 'VERIFIED' | 'COMPROMISED' | 'UNKNOWN';
}

export interface EncryptionAdoptionMetrics {
  totalEmbeddings: number;
  encryptedCount: number;
  adoptionRate: number;
  status: 'COMPLETE' | 'PARTIAL' | 'NONE';
}

export interface ComplianceAuditReport {
  organizationId: string;
  period: { start: Date; end: Date };
  sensitiveOperations: number;
  accessControl: {
    usersWithAccess: number;
    rolesUsed: string[];
    unauthorizedAttempts: number;
  };
  dataProcessing: {
    facesProcessed: number;
    facesEncrypted: number;
    encryptionKeyRotations: number;
    dataRetentionDays: number;
  };
  incidents: Array<{
    timestamp: Date;
    type: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    description: string;
  }>;
  complianceStatus: 'COMPLIANT' | 'REVIEW_NEEDED' | 'NON_COMPLIANT';
}

export interface DataIsolationReport {
  crossOrgDataFound: boolean;
  affectedOrganizations: string[];
  issues: Array<{
    organizationId: string;
    dataType: string;
    count: number;
  }>;
  status: 'SECURE' | 'COMPROMISED';
}

export interface IMultiTenantAuditService {
  /**
   * Log sensitive operation with organization context validation
   */
  logSensitiveOperation(entry: AuditEntry): Promise<unknown>;

  /**
   * Verify multi-tenant data isolation for organization
   * - All person faces belong to organization
   * - All check-ins reference valid participants
   * - No orphaned records
   */
  verifyMultiTenantIsolation(organizationId: string): Promise<MultiTenantValidation>;

  /**
   * Verify encryption adoption rate in organization
   */
  verifyEncryptionAdoption(organizationId: string): Promise<EncryptionAdoptionMetrics>;

  /**
   * Generate compliance audit report
   * For: GDPR, SOC2, HIPAA
   */
  generateComplianceAuditReport(organizationId: string, startDate: Date, endDate: Date): Promise<ComplianceAuditReport>;

  /**
   * Cross-organization isolation test
   * Detects data leakage between organizations
   */
  verifyDataIsolationBetweenOrganizations(): Promise<DataIsolationReport>;
}
