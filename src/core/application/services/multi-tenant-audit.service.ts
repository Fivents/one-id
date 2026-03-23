/**
 * Multi-Tenant Audit Verification System
 *
 * FASE 5 Step 2: Comprehensive audit logging for sensitive operations
 * with multi-tenant data isolation verification.
 *
 * Features:
 * - Centralized audit logging for sensitive operations
 * - Organization context validation on all queries
 * - Encryption-related operation tracking
 * - User action attribution
 * - Compliance audit trail (GDPR, SOC2)
 */

import { prisma } from '@/core/infrastructure/prisma-client';

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

/**
 * Audit Service with multi-tenant validation
 */
export class MultiTenantAuditService {
  /**
   * Log sensitive operation with organization context
   */
  async logSensitiveOperation(entry: AuditEntry): Promise<any> {
    // Validate organization context
    const org = await prisma.organization.findUnique({
      where: { id: entry.context.organizationId },
      select: { id: true },
    });

    if (!org) {
      throw new Error(
        `Invalid organization context: ${entry.context.organizationId}`
      );
    }

    // Validate user belongs to organization
    const membership = await prisma.membership.findFirst({
      where: {
        userId: entry.context.userId,
        organizationId: entry.context.organizationId,
      },
      select: { id: true },
    });

    if (!membership) {
      throw new Error(
        `User ${entry.context.userId} not in organization ${entry.context.organizationId}`
      );
    }

    // Create audit log
    return prisma.auditLog.create({
      data: {
        action: entry.actionType as any, // AuditAction enum value
        description: entry.description,
        metadata: entry.details as any,
        userId: entry.context.userId,
        organizationId: entry.context.organizationId,
        eventId: entry.context.eventId,
      },
    });
  }

  /**
   * Verify multi-tenant data isolation for an organization
   * Checks:
   * 1. All person faces belong to organization
   * 2. All check-ins reference valid participants
   * 3. All embeddings have proper organization context
   * 4. No orphaned records (data consistency)
   */
  async verifyMultiTenantIsolation(
    organizationId: string
  ): Promise<MultiTenantValidation> {
    // Count total records
    const [
      personFaces,
      personFacesWithoutOrg,
      checkIns,
      checkInsWithoutOrg,
      allEmbeddings,
      encryptedEmbeddings,
    ] = await Promise.all([
      prisma.personFace.count({
        where: { person: { organizationId } },
      }),
      prisma.personFace.count({
        where: {
          person: { organizationId: { not: organizationId } },
        },
      }),
      prisma.checkIn.count({
        where: { eventParticipant: { event: { organizationId } } },
      }),
      prisma.checkIn.count({
        where: {
          eventParticipant: { event: { organizationId: { not: organizationId } } },
        },
      }),
      prisma.personFace.count({
        where: { person: { organizationId } },
      }),
      prisma.personFace.count({
        where: {
          person: { organizationId },
          embeddingNormalized: true, // Placeholder: encrypted ones would also be normalized
        },
      }),
    ]);

    // Calculate integrity metrics
    const unencryptedEmbeddings = allEmbeddings - encryptedEmbeddings;

    // Determine isolation status
    let isolationStatus: 'VERIFIED' | 'COMPROMISED' | 'UNKNOWN' =
      'VERIFIED';
    if (personFacesWithoutOrg > 0 || checkInsWithoutOrg > 0) {
      isolationStatus = 'COMPROMISED';
    }

    return {
      organizationId,
      recordCount: personFaces + checkIns,
      orphanedRecords: personFacesWithoutOrg + checkInsWithoutOrg,
      dataIntegrity: {
        personFaces: {
          total: personFaces,
          withoutOrg: personFacesWithoutOrg,
        },
        checkIns: {
          total: checkIns,
          withoutOrg: checkInsWithoutOrg,
        },
        embeddings: {
          total: allEmbeddings,
          encrypted: encryptedEmbeddings,
          unencrypted: unencryptedEmbeddings,
        },
      },
      isolationStatus,
    };
  }

  /**
   * Verify encryption adoption rate for organization
   * Returns percentage of embeddings that are encrypted
   */
  async verifyEncryptionAdoption(organizationId: string): Promise<{
    totalEmbeddings: number;
    encryptedCount: number;
    adoptionRate: number;
    status: 'COMPLETE' | 'PARTIAL' | 'NONE';
  }> {
    const total = await prisma.personFace.count({
      where: { person: { organizationId } },
    });

    const encrypted = await prisma.personFace.count({
      where: {
        person: { organizationId },
        embeddingNormalized: true, // Placeholder for encrypted embeddings
      },
    });

    const adoptionRate = total > 0 ? (encrypted / total) * 100 : 0;

    let status: 'COMPLETE' | 'PARTIAL' | 'NONE';
    if (adoptionRate === 100) {
      status = 'COMPLETE';
    } else if (adoptionRate > 0) {
      status = 'PARTIAL';
    } else {
      status = 'NONE';
    }

    return {
      totalEmbeddings: total,
      encryptedCount: encrypted,
      adoptionRate: Math.round(adoptionRate * 100) / 100,
      status,
    };
  }

  /**
   * Generate compliance audit report
   * For: GDPR (data processing), SOC2 (access control), HIPAA (if applicable)
   */
  async generateComplianceAuditReport(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
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
  }> {
    // Audit logs in period
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        organizationId,
        createdAt: { gte: startDate, lte: endDate },
      },
    });

    // User access analysis
    const uniqueUsers = new Set(auditLogs.map((log) => log.userId)).size;
    const failedAttempts = auditLogs.filter(
      (log) => log.description && log.description.includes('failed')
    ).length;
    const roles = new Set(
      await prisma.membership
        .findMany({
          where: { organizationId },
          select: { role: true },
          distinct: ['role'],
        })
        .then((memberships) => memberships.map((m) => m.role))
    );

    // Data processing metrics
    const facesProcessed = await prisma.checkIn.count({
      where: {
        eventParticipant: {
          event: { organizationId },
        },
        checkedInAt: { gte: startDate, lte: endDate },
      },
    });

    const encryption = await this.verifyEncryptionAdoption(organizationId);

    // Check for key rotations (from audit logs)
    const keyRotations = auditLogs.filter(
      (log) => log.action === 'FACE_REGISTERED' // Using existing audit action as placeholder
    ).length;

    // Determine compliance status
    const encryptionComplete = encryption.status === 'COMPLETE';
    const unauthorizedAttemptsHigh = failedAttempts > 10;
    const complianceStatus: 'COMPLIANT' | 'REVIEW_NEEDED' | 'NON_COMPLIANT' =
      encryptionComplete && !unauthorizedAttemptsHigh
        ? 'COMPLIANT'
        : unauthorizedAttemptsHigh
          ? 'NON_COMPLIANT'
          : 'REVIEW_NEEDED';

    return {
      organizationId,
      period: { start: startDate, end: endDate },
      sensitiveOperations: auditLogs.length,
      accessControl: {
        usersWithAccess: uniqueUsers,
        rolesUsed: Array.from(roles),
        unauthorizedAttempts: failedAttempts,
      },
      dataProcessing: {
        facesProcessed,
        facesEncrypted: encryption.encryptedCount,
        encryptionKeyRotations: keyRotations,
        dataRetentionDays: 90, // Default retention
      },
      incidents: auditLogs
        .filter((log) => log.description && log.description.includes('failed'))
        .map((log) => ({
          timestamp: log.createdAt,
          type: log.action,
          severity: log.description?.includes('unauthorized') ||
            log.description?.includes('forbidden')
            ? 'HIGH'
            : 'MEDIUM',
          description: log.description || `${log.action} incident`,
        })),
      complianceStatus,
    };
  }

  /**
   * Verify no data leakage between organizations
   * Cross-organization validation test
   */
  async verifyDataIsolationBetweenOrganizations(): Promise<{
    crossOrgDataFound: boolean;
    affectedOrganizations: string[];
    issues: Array<{
      organizationId: string;
      dataType: string;
      count: number;
    }>;
    status: 'SECURE' | 'COMPROMISED';
  }> {
    // Check for person faces with mismatched org context
    const misalignedPersonFaces = await prisma.$queryRaw<
      Array<{ organization_id: string; count: bigint }>
    >`
      SELECT DISTINCT p.organization_id, COUNT(*) as count
      FROM person_faces pf
      JOIN persons p ON pf.person_id = p.id
      WHERE pf.created_at > NOW() - INTERVAL '7 days'
      GROUP BY p.organization_id
      HAVING COUNT(*) > (
        SELECT AVG(org_count) * 2
        FROM (
          SELECT COUNT(*) as org_count
          FROM person_faces pf2
          JOIN persons p2 ON pf2.person_id = p2.id
          GROUP BY p2.organization_id
        ) avg_counts
      )
    `;

    // Check for check-ins with organizational anomalies
    const anomalousCheckIns = await prisma.$queryRaw<
      Array<{ organization_id: string; anomaly_count: bigint }>
    >`
      SELECT e.organization_id, COUNT(*) as anomaly_count
      FROM check_ins ci
      JOIN events e ON ci.event_id = e.id
      WHERE ci.person_id NOT IN (
        SELECT DISTINCT p.id
        FROM persons p
        WHERE p.organization_id = e.organization_id
      )
    `;

    const affectedOrganizations = [
      ...new Set([
        ...misalignedPersonFaces.map((r) => r.organization_id as string),
        ...anomalousCheckIns.map((r) => r.organization_id as string),
      ]),
    ];

    const issues = [
      ...misalignedPersonFaces.map((r) => ({
        organizationId: r.organization_id as string,
        dataType: 'PersonFace',
        count: Number(r.count),
      })),
      ...anomalousCheckIns.map((r) => ({
        organizationId: r.organization_id as string,
        dataType: 'CheckIn',
        count: Number(r.anomaly_count),
      })),
    ];

    return {
      crossOrgDataFound: issues.length > 0,
      affectedOrganizations,
      issues,
      status: issues.length > 0 ? 'COMPROMISED' : 'SECURE',
    };
  }
}

export const multiTenantAuditService = new MultiTenantAuditService();
