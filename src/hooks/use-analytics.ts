import { useQuery } from '@tanstack/react-query';
import { fetchAnalytics, type AnalyticsResponse } from '@/lib/api';

export function useAnalytics() {
  return useQuery<AnalyticsResponse>({
    queryKey: ['analytics'],
    queryFn: fetchAnalytics,
    staleTime: 5 * 60 * 1000,
  });
}
