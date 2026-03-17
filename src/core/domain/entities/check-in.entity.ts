import { AppError, ErrorCode } from '@/core/errors';

import { BaseEntity } from './base.entity';

export type CheckInMethod = 'FACE_RECOGNITION' | 'QR_CODE' | 'MANUAL';

const HIGH_CONFIDENCE_THRESHOLD = 0.85;

export interface CheckInProps {
  id: string;
  method: CheckInMethod;
  confidence?: number | null;
  checkedInAt: Date;
  eventParticipantId: string;
  totemEventSubscriptionId: string | null;
}

export class CheckInEntity extends BaseEntity {
  private constructor(private readonly props: CheckInProps) {
    super(props.id);
  }

  static create(props: CheckInProps): CheckInEntity {
    if (props.method === 'FACE_RECOGNITION' && props.confidence == null) {
      throw new AppError({
        code: ErrorCode.ENTITY_INVARIANT_VIOLATION,
        message: 'Face recognition check-in requires a confidence score',
        httpStatus: 400,
        level: 'error',
      });
    }
    return new CheckInEntity(props);
  }

  get method(): CheckInMethod {
    return this.props.method;
  }

  get confidence(): number | null | undefined {
    return this.props.confidence;
  }

  get checkedInAt(): Date {
    return this.props.checkedInAt;
  }

  get eventParticipantId(): string {
    return this.props.eventParticipantId;
  }

  get totemEventSubscriptionId(): string | null {
    return this.props.totemEventSubscriptionId;
  }

  isFaceRecognition(): boolean {
    return this.props.method === 'FACE_RECOGNITION';
  }

  isQrCode(): boolean {
    return this.props.method === 'QR_CODE';
  }

  isManual(): boolean {
    return this.props.method === 'MANUAL';
  }

  hasConfidenceScore(): boolean {
    return this.props.confidence != null;
  }

  isHighConfidence(threshold: number = HIGH_CONFIDENCE_THRESHOLD): boolean {
    return this.props.confidence != null && this.props.confidence >= threshold;
  }

  isForParticipant(eventParticipantId: string): boolean {
    return this.props.eventParticipantId === eventParticipantId;
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      method: this.props.method,
      confidence: this.props.confidence,
      checkedInAt: this.props.checkedInAt,
      eventParticipantId: this.props.eventParticipantId,
      totemEventSubscriptionId: this.props.totemEventSubscriptionId,
    };
  }
}
