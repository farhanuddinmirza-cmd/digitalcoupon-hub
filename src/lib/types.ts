export type UserRole = 'admin' | 'ops' | 'viewer';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  enabled: boolean;
  createdAt: string;
}

export interface Campaign {
  id: string;
  name: string;
  brand: string;
  store: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'completed' | 'draft';
}

export type CouponStatus = 'uploaded' | 'claimed' | 'voided';

export interface Coupon {
  _id: string;
  couponCode: string;
  campaignId: string;
  campaignName: string;
  status: CouponStatus;
  claimedBy: string | null;
  claimedAt: string | null;
  transactionId: string | null;
  transactionDate: string | null;
  uploadedAt: string;
  store: string;
  brand: string;
}

export interface ActivityLog {
  id: string;
  action: 'uploaded' | 'claimed' | 'pdf_downloaded' | 'user_created' | 'role_changed';
  description: string;
  userId: string;
  userName: string;
  campaignId?: string;
  campaignName?: string;
  timestamp: string;
}

export interface DashboardMetrics {
  totalUploaded: number;
  totalClaimed: number;
  totalVoided: number;
  pdfDownloads: number;
  claimRate: number;
}

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  admin: ['manage_users', 'manage_roles', 'upload_coupons', 'download_files', 'view_metrics', 'download_pdf'],
  ops: ['view_metrics', 'upload_coupons', 'download_files'],
  viewer: ['view_metrics'],
};

export function hasPermission(role: UserRole, permission: string): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}
