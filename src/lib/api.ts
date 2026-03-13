export const API_BASE_URL = "https://physical-coupon.extensions.jiocommerce.io/api/v1";

export interface CampaignBreakdown {
  campaign: string;
  totalLogins: number;
  totalDownloads: number;
  uniqueUsersLoggedIn: number;
  uniqueUsersDownloaded: number;
}

export interface AnalyticsResponse {
  overall: {
    totalLogins: number;
    totalDownloads: number;
    uniqueUsersLoggedIn: number;
    uniqueUsersDownloaded: number;
  };
  breakdownByCampaign: CampaignBreakdown[];
}

export async function fetchAnalytics(): Promise<AnalyticsResponse> {
  const res = await fetch(`${API_BASE_URL}/vouchers/analytics`);
  if (!res.ok) throw new Error(`Analytics API error: ${res.status}`);
  return res.json();
}
