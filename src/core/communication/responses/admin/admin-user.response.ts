export interface AdminUserResponse {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  organizationId: string | null;
  organizationName: string | null;
  role: string | null;
  isSuperAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminUserListResponse {
  users: AdminUserResponse[];
  total: number;
}

export interface ResetPasswordResponse {
  success: true;
}
