// ── Service Container with Lazy Initialization ──────────────────────

import type {
  ICheckInMetricsService,
  IConfidenceThresholdService,
  ICooldownService,
  IEmbeddingEncryptionService,
  IFaceQualityService,
  IMultiTenantAuditService,
  ITemplateAggregationService,
} from '@/core/domain/contracts';
import { env } from '@/core/infrastructure/environment/env';
import { prisma } from '@/core/infrastructure/prisma-client';
import { BcryptPasswordHasher } from '@/core/infrastructure/providers/bcrypt-password-hasher';
import { GoogleOAuthProvider } from '@/core/infrastructure/providers/google-oauth.provider';
import { JoseTokenProvider } from '@/core/infrastructure/providers/jose-token-provider';
import { PrismaAuditLogRepository } from '@/core/infrastructure/repositories/prisma-audit-log.repository';
import { PrismaAuthIdentityRepository } from '@/core/infrastructure/repositories/prisma-auth-identity.repository';
import { PrismaCheckInRepository } from '@/core/infrastructure/repositories/prisma-check-in.repository';
import { PrismaEventRepository } from '@/core/infrastructure/repositories/prisma-event.repository';
import { PrismaEventParticipantRepository } from '@/core/infrastructure/repositories/prisma-event-participant.repository';
import { PrismaFeatureRepository } from '@/core/infrastructure/repositories/prisma-feature.repository';
import { PrismaMembershipRepository } from '@/core/infrastructure/repositories/prisma-membership.repository';
import { PrismaNotificationRepository } from '@/core/infrastructure/repositories/prisma-notification.repository';
import { PrismaOrganizationRepository } from '@/core/infrastructure/repositories/prisma-organization.repository';
import { PrismaPersonRepository } from '@/core/infrastructure/repositories/prisma-person.repository';
import { PrismaPersonFaceRepository } from '@/core/infrastructure/repositories/prisma-person-face.repository';
import { PrismaPlanRepository } from '@/core/infrastructure/repositories/prisma-plan.repository';
import { PrismaPlanChangeRequestRepository } from '@/core/infrastructure/repositories/prisma-plan-change-request.repository';
import { PrismaPlanFeatureRepository } from '@/core/infrastructure/repositories/prisma-plan-feature.repository';
import { PrismaPrintConfigRepository } from '@/core/infrastructure/repositories/prisma-print-config.repository';
import { PrismaSessionRepository } from '@/core/infrastructure/repositories/prisma-session.repository';
import { PrismaSubscriptionRepository } from '@/core/infrastructure/repositories/prisma-subscription.repository';
import { PrismaTotemRepository } from '@/core/infrastructure/repositories/prisma-totem.repository';
import { PrismaTotemEventSubscriptionRepository } from '@/core/infrastructure/repositories/prisma-totem-event-subscription.repository';
import { PrismaTotemOrganizationSubscriptionRepository } from '@/core/infrastructure/repositories/prisma-totem-organization-subscription.repository';
import { PrismaUserRepository } from '@/core/infrastructure/repositories/prisma-user.repository';
import type { PrismaClient } from '@/generated/prisma/client';

import { CheckInMetricsService } from './check-in-metrics.service';
import { ConfidenceThresholdService } from './confidence-threshold.service';
import { CooldownService } from './cooldown.service';
import { EmbeddingEncryptionService } from '@/core/infrastructure/providers/embedding-encryption.service';
import { FaceQualityService } from './face-quality.service';
import { TemplateAggregationService } from './template-aggregation.service';
import { MultiTenantAuditService } from './multi-tenant-audit.service';

/**
 * ContainerService manages singleton instances across the application.
 * Uses lazy initialization for better performance and dependency isolation.
 *
 * Following DDD principles:
 * - Repositories are instantiated once and reused
 * - Providers (hashers, token, oauth) are instantiated once
 * - Each dependency is independent and testable
 */
class ContainerService {
  private prismaClient: PrismaClient;
  private userRepository: PrismaUserRepository | null = null;
  private authIdentityRepository: PrismaAuthIdentityRepository | null = null;
  private totemRepository: PrismaTotemRepository | null = null;
  private sessionRepository: PrismaSessionRepository | null = null;
  private auditLogRepository: PrismaAuditLogRepository | null = null;
  private checkInRepository: PrismaCheckInRepository | null = null;
  private eventRepository: PrismaEventRepository | null = null;
  private eventParticipantRepository: PrismaEventParticipantRepository | null = null;
  private featureRepository: PrismaFeatureRepository | null = null;
  private membershipRepository: PrismaMembershipRepository | null = null;
  private notificationRepository: PrismaNotificationRepository | null = null;
  private organizationRepository: PrismaOrganizationRepository | null = null;
  private personRepository: PrismaPersonRepository | null = null;
  private personFaceRepository: PrismaPersonFaceRepository | null = null;
  private planRepository: PrismaPlanRepository | null = null;
  private planChangeRequestRepository: PrismaPlanChangeRequestRepository | null = null;
  private planFeatureRepository: PrismaPlanFeatureRepository | null = null;
  private printConfigRepository: PrismaPrintConfigRepository | null = null;
  private subscriptionRepository: PrismaSubscriptionRepository | null = null;
  private totemEventSubscriptionRepository: PrismaTotemEventSubscriptionRepository | null = null;
  private totemOrganizationSubscriptionRepository: PrismaTotemOrganizationSubscriptionRepository | null = null;
  private passwordHasher: BcryptPasswordHasher | null = null;
  private tokenProvider: JoseTokenProvider | null = null;
  private googleOAuthProvider: GoogleOAuthProvider | null = null;
  private faceQualityService: IFaceQualityService | null = null;
  private templateAggregationService: ITemplateAggregationService | null = null;
  // FASE 3: Performance Optimization Services
  private confidenceThresholdService: IConfidenceThresholdService | null = null;
  private cooldownService: ICooldownService | null = null;
  private checkInMetricsService: ICheckInMetricsService | null = null;
  // FASE 5: Security - Embedding Encryption
  private embeddingEncryptionService: IEmbeddingEncryptionService | null = null;
  // FASE 5: Compliance - Multi-Tenant Audit
  private multiTenantAuditService: IMultiTenantAuditService | null = null;

  constructor(prismaClient: PrismaClient) {
    this.prismaClient = prismaClient;
  }

  // ── Repositories ────────────────────────────────────────────────────

  getUserRepository(): PrismaUserRepository {
    if (!this.userRepository) {
      this.userRepository = new PrismaUserRepository(this.prismaClient);
    }
    return this.userRepository;
  }

  getAuthIdentityRepository(): PrismaAuthIdentityRepository {
    if (!this.authIdentityRepository) {
      this.authIdentityRepository = new PrismaAuthIdentityRepository(this.prismaClient);
    }
    return this.authIdentityRepository;
  }

  getTotemRepository(): PrismaTotemRepository {
    if (!this.totemRepository) {
      this.totemRepository = new PrismaTotemRepository(this.prismaClient);
    }
    return this.totemRepository;
  }

  getSessionRepository(): PrismaSessionRepository {
    if (!this.sessionRepository) {
      this.sessionRepository = new PrismaSessionRepository(this.prismaClient);
    }
    return this.sessionRepository;
  }

  getAuditLogRepository(): PrismaAuditLogRepository {
    if (!this.auditLogRepository) {
      this.auditLogRepository = new PrismaAuditLogRepository(this.prismaClient);
    }
    return this.auditLogRepository;
  }

  getCheckInRepository(): PrismaCheckInRepository {
    if (!this.checkInRepository) {
      this.checkInRepository = new PrismaCheckInRepository(this.prismaClient);
    }
    return this.checkInRepository;
  }

  getEventRepository(): PrismaEventRepository {
    if (!this.eventRepository) {
      this.eventRepository = new PrismaEventRepository(this.prismaClient);
    }
    return this.eventRepository;
  }

  getEventParticipantRepository(): PrismaEventParticipantRepository {
    if (!this.eventParticipantRepository) {
      this.eventParticipantRepository = new PrismaEventParticipantRepository(this.prismaClient);
    }
    return this.eventParticipantRepository;
  }

  getFeatureRepository(): PrismaFeatureRepository {
    if (!this.featureRepository) {
      this.featureRepository = new PrismaFeatureRepository(this.prismaClient);
    }
    return this.featureRepository;
  }

  getMembershipRepository(): PrismaMembershipRepository {
    if (!this.membershipRepository) {
      this.membershipRepository = new PrismaMembershipRepository(this.prismaClient);
    }
    return this.membershipRepository;
  }

  getNotificationRepository(): PrismaNotificationRepository {
    if (!this.notificationRepository) {
      this.notificationRepository = new PrismaNotificationRepository(this.prismaClient);
    }
    return this.notificationRepository;
  }

  getOrganizationRepository(): PrismaOrganizationRepository {
    if (!this.organizationRepository) {
      this.organizationRepository = new PrismaOrganizationRepository(this.prismaClient);
    }
    return this.organizationRepository;
  }

  getPersonRepository(): PrismaPersonRepository {
    if (!this.personRepository) {
      this.personRepository = new PrismaPersonRepository(this.prismaClient);
    }
    return this.personRepository;
  }

  getPersonFaceRepository(): PrismaPersonFaceRepository {
    if (!this.personFaceRepository) {
      this.personFaceRepository = new PrismaPersonFaceRepository(this.prismaClient);
    }
    return this.personFaceRepository;
  }

  getPlanRepository(): PrismaPlanRepository {
    if (!this.planRepository) {
      this.planRepository = new PrismaPlanRepository(this.prismaClient);
    }
    return this.planRepository;
  }

  getPlanChangeRequestRepository(): PrismaPlanChangeRequestRepository {
    if (!this.planChangeRequestRepository) {
      this.planChangeRequestRepository = new PrismaPlanChangeRequestRepository(this.prismaClient);
    }
    return this.planChangeRequestRepository;
  }

  getPlanFeatureRepository(): PrismaPlanFeatureRepository {
    if (!this.planFeatureRepository) {
      this.planFeatureRepository = new PrismaPlanFeatureRepository(this.prismaClient);
    }
    return this.planFeatureRepository;
  }

  getPrintConfigRepository(): PrismaPrintConfigRepository {
    if (!this.printConfigRepository) {
      this.printConfigRepository = new PrismaPrintConfigRepository(this.prismaClient);
    }
    return this.printConfigRepository;
  }

  getSubscriptionRepository(): PrismaSubscriptionRepository {
    if (!this.subscriptionRepository) {
      this.subscriptionRepository = new PrismaSubscriptionRepository(this.prismaClient);
    }
    return this.subscriptionRepository;
  }

  getTotemEventSubscriptionRepository(): PrismaTotemEventSubscriptionRepository {
    if (!this.totemEventSubscriptionRepository) {
      this.totemEventSubscriptionRepository = new PrismaTotemEventSubscriptionRepository(this.prismaClient);
    }
    return this.totemEventSubscriptionRepository;
  }

  getTotemOrganizationSubscriptionRepository(): PrismaTotemOrganizationSubscriptionRepository {
    if (!this.totemOrganizationSubscriptionRepository) {
      this.totemOrganizationSubscriptionRepository = new PrismaTotemOrganizationSubscriptionRepository(
        this.prismaClient,
      );
    }
    return this.totemOrganizationSubscriptionRepository;
  }

  // ── Providers ───────────────────────────────────────────────────────

  getPasswordHasher(): BcryptPasswordHasher {
    if (!this.passwordHasher) {
      this.passwordHasher = new BcryptPasswordHasher();
    }
    return this.passwordHasher;
  }

  getTokenProvider(): JoseTokenProvider {
    if (!this.tokenProvider) {
      this.tokenProvider = new JoseTokenProvider(env.JWT_SECRET);
    }
    return this.tokenProvider;
  }

  getGoogleOAuthProvider(): GoogleOAuthProvider {
    if (!this.googleOAuthProvider) {
      this.googleOAuthProvider = new GoogleOAuthProvider(
        env.GOOGLE_CLIENT_ID,
        env.GOOGLE_CLIENT_SECRET,
        `${env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`,
      );
    }
    return this.googleOAuthProvider;
  }

  getFaceQualityService(): IFaceQualityService {
    if (!this.faceQualityService) {
      this.faceQualityService = new FaceQualityService();
    }
    return this.faceQualityService;
  }

  getTemplateAggregationService(): ITemplateAggregationService {
    if (!this.templateAggregationService) {
      this.templateAggregationService = new TemplateAggregationService();
    }
    return this.templateAggregationService;
  }

  // FASE 3: Performance Optimization Services

  getConfidenceThresholdService(): IConfidenceThresholdService {
    if (!this.confidenceThresholdService) {
      this.confidenceThresholdService = new ConfidenceThresholdService();
    }
    return this.confidenceThresholdService;
  }

  getCooldownService(): ICooldownService {
    if (!this.cooldownService) {
      this.cooldownService = new CooldownService(this.prismaClient);
    }
    return this.cooldownService;
  }

  getCheckInMetricsService(): ICheckInMetricsService {
    if (!this.checkInMetricsService) {
      this.checkInMetricsService = new CheckInMetricsService(this.prismaClient);
    }
    return this.checkInMetricsService;
  }

  // FASE 5: Security

  getEmbeddingEncryptionService(): IEmbeddingEncryptionService {
    if (!this.embeddingEncryptionService) {
      this.embeddingEncryptionService = new EmbeddingEncryptionService();
    }
    return this.embeddingEncryptionService;
  }

  getMultiTenantAuditService(): IMultiTenantAuditService {
    if (!this.multiTenantAuditService) {
      this.multiTenantAuditService = new MultiTenantAuditService();
    }
    return this.multiTenantAuditService;
  }
}

// ── Singleton Instance ──────────────────────────────────────────────

const globalForContainer = globalThis as unknown as { containerService: ContainerService };

export const containerService = globalForContainer.containerService || new ContainerService(prisma);

if (process.env.NODE_ENV !== 'production') {
  globalForContainer.containerService = containerService;
}
