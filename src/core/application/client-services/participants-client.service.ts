import type {
  RegisterParticipantRequest,
  UpdateParticipantRequest,
} from '@/core/communication/requests/event-participant';
import type { RegisterFaceRequest } from '@/core/communication/requests/person-face';

type UpdateFaceRequest = {
  imageUrl?: string;
  imageDataUrl?: string;
  embedding?: number[];
  embeddingModel?: string;
  isActive?: boolean;
};

import type { ApiResponse } from './base/api-response';
import { BaseClient } from './base/base-client';

export interface ParticipantResponse {
  id: string;
  company: string | null;
  jobTitle: string | null;
  qrCodeValue: string | null;
  accessCode: string | null;
  personId: string;
  eventId: string;
  createdAt: Date;
  updatedAt: Date;
}

class ParticipantsClientService extends BaseClient {
  async listParticipants(eventId: string): Promise<ApiResponse<ParticipantResponse[]>> {
    return this.get(`/events/${encodeURIComponent(eventId)}/participants`);
  }

  async getParticipant(participantId: string): Promise<ApiResponse<ParticipantResponse>> {
    return this.get(`/participants/${encodeURIComponent(participantId)}`);
  }

  async createParticipant(data: RegisterParticipantRequest): Promise<ApiResponse<ParticipantResponse>> {
    return this.post(`/events/${encodeURIComponent(data.eventId)}/participants`, data);
  }

  async updateParticipant(
    participantId: string,
    data: UpdateParticipantRequest,
  ): Promise<ApiResponse<ParticipantResponse>> {
    return this.patch(`/participants/${encodeURIComponent(participantId)}`, data);
  }

  async deleteParticipant(participantId: string): Promise<ApiResponse<void>> {
    return this.delete(`/participants/${encodeURIComponent(participantId)}`);
  }

  async registerFace(data: RegisterFaceRequest): Promise<ApiResponse<{ id: string }>> {
    return this.post('/person-faces', data);
  }

  async updateFace(faceId: string, data: Partial<RegisterFaceRequest>): Promise<ApiResponse<{ id: string }>> {
    return this.patch(`/person-faces/${encodeURIComponent(faceId)}`, data);
  }

  async replaceFaceImage(faceId: string, data: UpdateFaceRequest): Promise<ApiResponse<{ id: string }>> {
    return this.patch(`/person-faces/${encodeURIComponent(faceId)}`, data);
  }

  async deleteFace(faceId: string): Promise<ApiResponse<void>> {
    return this.delete(`/person-faces/${encodeURIComponent(faceId)}`);
  }
}

export const participantsClient = new ParticipantsClientService();
