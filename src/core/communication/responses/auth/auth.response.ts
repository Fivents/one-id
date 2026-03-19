import { Role } from '@/core/domain/value-objects';

export interface AuthUserResponse {
  id: string;
  name: string;
  email: string;
  role: Role;
  type: 'admin' | 'client';
  organizationId?: string;
}

export interface AuthTokenResponse {
  token: string;
  user: AuthUserResponse;
}

export interface CheckEmailResponse {
  status: 'ready' | 'needs_setup';
  setupToken?: string;
}

export interface TotemAIConfig {
  confidenceThreshold: number;
  detectionIntervalMs: number;
  maxFaces: number;
  livenessDetection: boolean;
  minFaceSize: number;
  recommendedEmbeddingModel: string;
  recommendedDetectorModel: string;
}

export interface TotemAuthResponse {
  token: string;
  totem: {
    id: string;
    name: string;
  };
  activeEvent?: {
    id: string;
    name: string;
    startsAt: string;
    endsAt: string;
  };
  totemEventSubscriptionId?: string;
  aiConfig?: TotemAIConfig;
}
