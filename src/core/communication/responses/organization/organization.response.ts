export interface OrganizationResponse {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  phone: string | null;
  logoUrl: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
