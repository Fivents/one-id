/**
 * Factories - Use Case Instantiation Layer
 *
 * This directory contains factory functions that instantiate use cases with
 * their dependencies injected from the ContainerService.
 *
 * Each factory is a pure function that:
 * 1. Retrieves lazy-loaded singletons from ContainerService
 * 2. Instantiates the use case with those dependencies
 * 3. Returns a ready-to-use use case instance
 *
 * Pattern: Factory Method with lazy singleton management
 * Principle: Single Responsibility + Dependency Inversion (DIP)
 */

export { getGoogleOAuthProvider } from './get-google-oauth-provider.factory';
export { makeCheckEmailClientUseCase } from './make-check-email-client.factory';
export { makeLoginWithAccessCodeTotemUseCase } from './make-login-with-access-code-totem.factory';
export { makeLoginWithEmailClientUseCase } from './make-login-with-email-client.factory';
export { makeLoginWithGoogleAdminUseCase } from './make-login-with-google-admin.factory';
export { makeSetupClientPasswordUseCase } from './make-setup-client-password.factory';

// Auth (additional)
export {
  makeListUserSessionsUseCase,
  makeLoginWithTokenUseCase,
  makeLogoutUseCase,
  makeRefreshSessionUseCase,
  makeRevokeSessionUseCase,
  makeValidateSessionUseCase,
} from './make-auth.factory';

// User
export {
  makeCreateUserUseCase,
  makeDeleteUserUseCase,
  makeGetUserUseCase,
  makeListUsersUseCase,
  makeUpdateUserUseCase,
} from './make-user.factory';

// Organization
export {
  makeActivateOrganizationUseCase,
  makeCreateOrganizationUseCase,
  makeDeactivateOrganizationUseCase,
  makeDeleteOrganizationUseCase,
  makeGetOrganizationUseCase,
  makeListOrganizationsUseCase,
  makeUpdateOrganizationUseCase,
} from './make-organization.factory';

// Membership
export {
  makeAddMemberUseCase,
  makeGetMemberUseCase,
  makeListMembersUseCase,
  makeRemoveMemberUseCase,
  makeUpdateMemberRoleUseCase,
} from './make-membership.factory';

// Event
export {
  makeActivateEventUseCase,
  makeCancelEventUseCase,
  makeCreateEventUseCase,
  makeDeleteEventUseCase,
  makeDuplicateEventUseCase,
  makeGetEventUseCase,
  makeListEventsUseCase,
  makePublishEventUseCase,
  makeUpdateEventUseCase,
} from './make-event.factory';

// Print Config
export {
  makeAssociatePrintConfigUseCase,
  makeCreatePrintConfigUseCase,
  makeDuplicatePrintConfigUseCase,
  makeGetPrintConfigUseCase,
  makeUpdatePrintConfigUseCase,
} from './make-print-config.factory';

// Person
export {
  makeCreatePersonUseCase,
  makeDeletePersonUseCase,
  makeExportPersonsUseCase,
  makeGetPersonUseCase,
  makeImportPersonsUseCase,
  makeListPersonsUseCase,
  makeUpdatePersonUseCase,
} from './make-person.factory';

// Event Participant
export {
  makeGetParticipantUseCase,
  makeListParticipantsUseCase,
  makeRegisterParticipantUseCase,
  makeRemoveParticipantUseCase,
  makeUpdateParticipantUseCase,
} from './make-event-participant.factory';

// Person Face
export {
  makeActivateFaceUseCase,
  makeDeactivateFaceUseCase,
  makeListFacesUseCase,
  makeRegisterFaceUseCase,
  makeRemoveFaceUseCase,
} from './make-person-face.factory';

// Totem
export {
  makeActivateTotemUseCase,
  makeCreateTotemUseCase,
  makeDeactivateTotemUseCase,
  makeDeleteTotemUseCase,
  makeGetTotemUseCase,
  makeListTotemsUseCase,
  makeSetMaintenanceTotemUseCase,
  makeUpdateTotemUseCase,
} from './make-totem.factory';

// Totem Session
export {
  makeHeartbeatTotemUseCase,
  makeRenewTotemSessionUseCase,
  makeRevokeTotemSessionUseCase,
  makeValidateTotemSessionUseCase,
} from './make-totem-session.factory';

// Totem Organization Subscription
export {
  makeCheckTotemAvailabilityUseCase,
  makeLinkTotemToOrgUseCase,
  makeListOrgTotemsUseCase,
  makeUnlinkTotemFromOrgUseCase,
} from './make-totem-org-subscription.factory';

// Totem Event Subscription
export {
  makeLinkTotemToEventUseCase,
  makeListEventTotemsUseCase,
  makeSetTotemLocationUseCase,
  makeUnlinkTotemFromEventUseCase,
} from './make-totem-event-subscription.factory';

// Check-In
export {
  makeCheckParticipantCheckInUseCase,
  makeListEventCheckInsUseCase,
  makeListParticipantCheckInsUseCase,
  makeRegisterFaceCheckInUseCase,
  makeRegisterManualCheckInUseCase,
  makeRegisterQrCheckInUseCase,
} from './make-check-in.factory';

// Audit Log
export {
  makeCreateAuditLogUseCase,
  makeGetAuditLogUseCase,
  makeListLogsByEntityUseCase,
  makeListLogsByOrganizationUseCase,
  makeListLogsByUserUseCase,
} from './make-audit-log.factory';

// Plan
export {
  makeCreatePlanUseCase,
  makeDeactivatePlanUseCase,
  makeGetPlanUseCase,
  makeListPlansUseCase,
  makeUpdatePlanUseCase,
} from './make-plan.factory';

// Feature
export { makeCreateFeatureUseCase, makeListFeaturesUseCase, makeUpdateFeatureUseCase } from './make-feature.factory';

// Plan Feature
export {
  makeAssociateFeatureToPlanUseCase,
  makeListPlanFeaturesUseCase,
  makeRemoveFeatureFromPlanUseCase,
  makeUpdatePlanFeatureValueUseCase,
} from './make-plan-feature.factory';

// Subscription
export {
  makeChangePlanUseCase,
  makeCreateSubscriptionUseCase,
  makeGetSubscriptionUseCase,
  makeRenewSubscriptionUseCase,
  makeUpdateSubscriptionUseCase,
} from './make-subscription.factory';

// Plan Change Request
export {
  makeApproveRequestUseCase,
  makeGetRequestUseCase,
  makeListPendingRequestsUseCase,
  makeRejectRequestUseCase,
  makeRequestPlanChangeUseCase,
} from './make-plan-change-request.factory';

// Notification
export {
  makeCreateNotificationUseCase,
  makeDeleteNotificationUseCase,
  makeListUserNotificationsUseCase,
  makeMarkAllNotificationsAsReadUseCase,
  makeMarkNotificationAsReadUseCase,
} from './make-notification.factory';
