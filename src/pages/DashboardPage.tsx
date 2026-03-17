import { useState, useMemo } from 'react';
import { Upload, FileText, TrendingUp, Ticket, BarChart3 } from 'lucide-react';
import { KpiCard } from '@/components/KpiCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useFetch } from '@/hooks/useApi';
import { Campaign, Coupon } from '@/lib/types';

export default function DashboardPage() {
  const [campaignFilter, setCampaignFilter] = useState<string>('all');
  const { data: campaigns } = useFetch<Campaign[]>('/api/campaigns');
  const { data: coupons, loading } = useFetch<Coupon[]>('/api/coupons');

  const filtered = useMemo(() => {
    if (!coupons) return [];
    return campaignFilter === 'all'
      ? coupons
      : coupons.filter(c => c.campaignId === campaignFilter);
  }, [coupons, campaignFilter]);

  const metrics = useMemo(() => {
    const totalUploaded = filtered.length;
    const totalClaimed = filtered.filter(c => c.status === 'claimed').length;
    const totalVoided = filtered.filter(c => c.status === 'Unclaimed').length;
    const claimRate = totalUploaded > 0 ? Math.round((totalClaimed / totalUploaded) * 100) : 0;
    return { totalUploaded, totalClaimed, totalVoided, claimRate };
  }, [filtered]);

  const dailyData = useMemo(() => {
    const dayMap: Record<string, { claimed: number }> = {};
    filtered
      .filter(c => c.status === 'claimed' && c.claimedAt)
      .forEach(c => {
        const day = c.claimedAt!.slice(0, 10);
        if (!dayMap[day]) dayMap[day] = { claimed: 0 };
        dayMap[day].claimed++;
      });
    return Object.entries(dayMap)
      .map(([date, counts]) => ({ date, ...counts }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [filtered]);

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
            {(campaigns ?? []).map(c => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="text-muted-foreground text-sm animate-pulse">Loading data...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard title="Total Uploaded" value={metrics.totalUploaded} icon={<Upload className="h-5 w-5" />} trend={{ value: 12, positive: true }} />
            <KpiCard title="Claimed" value={metrics.totalClaimed} icon={<Ticket className="h-5 w-5" />} trend={{ value: 8, positive: true }} />
            <KpiCard title="Claim Rate" value={`${metrics.claimRate}%`} icon={<TrendingUp className="h-5 w-5" />} />
            <KpiCard title="Voided" value={metrics.totalVoided} icon={<FileText className="h-5 w-5" />} />
          </div>

          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" /> Daily Claims
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={dailyData}>
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" height={50} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="claimed" fill="hsl(172, 66%, 38%)" radius={[4, 4, 0, 0]} name="Coupons Claimed" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
