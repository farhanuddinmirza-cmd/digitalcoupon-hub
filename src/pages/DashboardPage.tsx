import { useState, useMemo } from 'react';
import { Users, Download, TrendingUp, UserCheck, BarChart3 } from 'lucide-react';
import { KpiCard } from '@/components/KpiCard';
import { useAnalytics } from '@/hooks/use-analytics';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  const { data, isLoading, error } = useAnalytics();
  const [campaignFilter, setCampaignFilter] = useState<string>('all');

  const metrics = useMemo(() => {
    if (!data) return null;
    if (campaignFilter === 'all') return data.overall;
    const c = data.breakdownByCampaign.find(b => b.campaign === campaignFilter);
    return c ?? data.overall;
  }, [data, campaignFilter]);

  const downloadRate = useMemo(() => {
    if (!metrics || metrics.totalLogins === 0) return 0;
    return Math.round((metrics.totalDownloads / metrics.totalLogins) * 100);
  }, [metrics]);

  const chartData = useMemo(() => {
    if (!data) return [];
    return data.breakdownByCampaign.map(c => ({
      campaign: c.campaign.length > 20 ? c.campaign.slice(0, 20) + '…' : c.campaign,
      logins: c.totalLogins,
      downloads: c.totalDownloads,
    }));
  }, [data]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-destructive">Failed to load analytics data. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <Select value={campaignFilter} onValueChange={setCampaignFilter}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="All Campaigns" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Campaigns</SelectItem>
            {data?.breakdownByCampaign.map(c => (
              <SelectItem key={c.campaign} value={c.campaign}>{c.campaign}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))
        ) : (
          <>
            <KpiCard title="Total Logins" value={metrics?.totalLogins ?? 0} icon={<Users className="h-5 w-5" />} />
            <KpiCard title="Total Downloads" value={metrics?.totalDownloads ?? 0} icon={<Download className="h-5 w-5" />} />
            <KpiCard title="Download Rate" value={`${downloadRate}%`} icon={<TrendingUp className="h-5 w-5" />} />
            <KpiCard title="Unique Users Downloaded" value={metrics?.uniqueUsersDownloaded ?? 0} icon={<UserCheck className="h-5 w-5" />} />
          </>
        )}
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" /> Logins vs Downloads by Campaign
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-80 w-full rounded-lg" />
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={chartData}>
                <XAxis dataKey="campaign" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" height={70} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="logins" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Logins" />
                <Bar dataKey="downloads" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} name="Downloads" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
