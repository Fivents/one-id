// ── Email Service Contract ──────────────────────────────────────────

export interface SendAccessCodePayload {
  /** EventParticipant.id — email is always scoped per-participant, not per-person. */
  participantId: string;
  /** Recipient email address (Person.email). */
  recipientEmail: string;
  /** Participant full name for greeting. */
  participantName: string;
  /** The access code stored on EventParticipant.accessCode. */
  accessCode: string;
  /** Event metadata for template rendering. */
  event: {
    id: string;
    name: string;
    startsAt: Date;
    timezone: string;
    address?: string | null;
  };
  /** Organization metadata for sender identity resolution. */
  organization: {
    id: string;
    name: string;
    logoUrl?: string | null;
  };
}

export interface SendEmailResult {
  success: boolean;
  /** Resend message ID on success. */
  messageId?: string;
  /** Human-readable error description on failure. */
  error?: string;
  /** True when email sending was skipped (not configured). */
  skipped?: boolean;
}

export interface IEmailService {
  /**
   * Sends the access code email to a single event participant.
   * Never throws — returns a result object with success/failure details.
   */
  sendAccessCode(payload: SendAccessCodePayload): Promise<SendEmailResult>;
}
