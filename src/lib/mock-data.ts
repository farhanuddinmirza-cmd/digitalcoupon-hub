import { User, Campaign, Coupon, ActivityLog, DashboardMetrics } from './types';

export const mockUsers: User[] = [
  { id: '1', name: 'Rahul Sharma', email: 'rahul@admin.com', role: 'admin', enabled: true, createdAt: '2024-01-10' },
  { id: '2', name: 'Priya Patel', email: 'priya@ops.com', role: 'ops', enabled: true, createdAt: '2024-02-15' },
  { id: '3', name: 'Amit Kumar', email: 'amit@viewer.com', role: 'viewer', enabled: true, createdAt: '2024-03-01' },
  { id: '4', name: 'Sneha Gupta', email: 'sneha@ops.com', role: 'ops', enabled: false, createdAt: '2024-03-20' },
  { id: '5', name: 'Vikram Singh', email: 'vikram@viewer.com', role: 'viewer', enabled: true, createdAt: '2024-04-05' },
];

export const mockCampaigns: Campaign[] = [
  { id: 'c1', name: 'Summer Sale 2024', brand: 'Brand A', store: 'Store Delhi', startDate: '2024-06-01', endDate: '2024-06-30', status: 'completed' },
  { id: 'c2', name: 'Monsoon Madness', brand: 'Brand B', store: 'Store Mumbai', startDate: '2024-07-15', endDate: '2024-08-15', status: 'active' },
  { id: 'c3', name: 'Festive Bonanza', brand: 'Brand A', store: 'Store Bangalore', startDate: '2024-10-01', endDate: '2024-11-15', status: 'active' },
  { id: 'c4', name: 'Winter Warmth', brand: 'Brand C', store: 'Store Delhi', startDate: '2024-12-01', endDate: '2025-01-31', status: 'draft' },
];

const statuses: Array<'uploaded' | 'claimed' | 'voided'> = ['uploaded', 'claimed', 'voided'];

export const mockCoupons: Coupon[] = Array.from({ length: 85 }, (_, i) => {
  const campaign = mockCampaigns[i % mockCampaigns.length];
  const status = statuses[i % 3];
  return {
    _id: `cpn_${String(i + 1).padStart(4, '0')}`,
    couponCode: `COUP-${String(i + 1).padStart(5, '0')}`,
    campaignId: campaign.id,
    campaignName: campaign.name,
    status,
    claimedBy: status === 'claimed' ? `user${i}@example.com` : null,
    claimedAt: status === 'claimed' ? `2024-0${(i % 9) + 1}-${String((i % 28) + 1).padStart(2, '0')}T10:30:00Z` : null,
    transactionId: status === 'claimed' ? `TXN${String(i + 1000).padStart(8, '0')}` : null,
    transactionDate: status === 'claimed' ? `2024-0${(i % 9) + 1}-${String((i % 28) + 1).padStart(2, '0')}` : null,
    uploadedAt: `2024-0${(i % 6) + 1}-${String((i % 28) + 1).padStart(2, '0')}T09:00:00Z`,
    store: campaign.store,
    brand: campaign.brand,
  };
});

export const mockActivityLogs: ActivityLog[] = [
  { id: 'a1', action: 'uploaded', description: 'Uploaded 500 coupons for Summer Sale 2024', userId: '1', userName: 'Rahul Sharma', campaignId: 'c1', campaignName: 'Summer Sale 2024', timestamp: '2024-06-01T09:00:00Z' },
  { id: 'a2', action: 'claimed', description: 'Coupon COUP-00012 claimed', userId: '3', userName: 'System', campaignId: 'c1', campaignName: 'Summer Sale 2024', timestamp: '2024-06-05T14:30:00Z' },
  { id: 'a3', action: 'pdf_downloaded', description: 'PDF report downloaded for Monsoon Madness', userId: '2', userName: 'Priya Patel', campaignId: 'c2', campaignName: 'Monsoon Madness', timestamp: '2024-07-20T11:00:00Z' },
  { id: 'a4', action: 'uploaded', description: 'Uploaded 300 coupons for Festive Bonanza', userId: '2', userName: 'Priya Patel', campaignId: 'c3', campaignName: 'Festive Bonanza', timestamp: '2024-10-01T08:00:00Z' },
  { id: 'a5', action: 'user_created', description: 'User Sneha Gupta created', userId: '1', userName: 'Rahul Sharma', timestamp: '2024-03-20T10:00:00Z' },
  { id: 'a6', action: 'role_changed', description: 'Role changed for Amit Kumar to viewer', userId: '1', userName: 'Rahul Sharma', timestamp: '2024-03-01T12:00:00Z' },
  { id: 'a7', action: 'claimed', description: 'Coupon COUP-00045 claimed', userId: '3', userName: 'System', campaignId: 'c2', campaignName: 'Monsoon Madness', timestamp: '2024-08-02T16:45:00Z' },
  { id: 'a8', action: 'pdf_downloaded', description: 'PDF report downloaded for Summer Sale 2024', userId: '1', userName: 'Rahul Sharma', campaignId: 'c1', campaignName: 'Summer Sale 2024', timestamp: '2024-06-30T17:00:00Z' },
];

export function getDashboardMetrics(campaignId?: string): DashboardMetrics {
  const filtered = campaignId ? mockCoupons.filter(c => c.campaignId === campaignId) : mockCoupons;
  const totalUploaded = filtered.length;
  const totalClaimed = filtered.filter(c => c.status === 'claimed').length;
  const totalVoided = filtered.filter(c => c.status === 'voided').length;
  const pdfDownloads = mockActivityLogs.filter(a => a.action === 'pdf_downloaded' && (!campaignId || a.campaignId === campaignId)).length;
  return {
    totalUploaded,
    totalClaimed,
    totalVoided,
    pdfDownloads,
    claimRate: totalUploaded > 0 ? Math.round((totalClaimed / totalUploaded) * 100) : 0,
  };
}
