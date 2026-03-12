export interface AdminOrganizationResponse {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  phone: string | null;
  logoUrl: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  subscription: {
    id: string;
    planId: string;
    planName: string;
    startedAt: Date;
    expiresAt: Date;
  } | null;
  _count: {
    events: number;
    members: number;
  };
}

export interface AdminOrganizationDetailResponse extends AdminOrganizationResponse {
  members: {
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    role: string;
    createdAt: Date;
  }[];
  _count: {
    events: number;
    members: number;
    participants: number;
    totems: number;
  };
}

export interface AdminOrganizationSubscriptionResponse {
  id: string;
  planId: string;
  planName: string;
  startedAt: Date;
  expiresAt: Date;
}
