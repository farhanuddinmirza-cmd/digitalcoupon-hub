import { useState, useMemo } from 'react';
import { Upload, Download, FileText, TrendingUp, Ticket, BarChart3 } from 'lucide-react';
import { KpiCard } from '@/components/KpiCard';
import { getDashboardMetrics, mockCampaigns, mockCoupons } from '@/lib/mock-data';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = [
  'hsl(172, 66%, 38%)',
  'hsl(215, 70%, 55%)',
  'hsl(38, 92%, 50%)',
  'hsl(280, 60%, 55%)',
];

export default function DashboardPage() {
  const [campaignFilter, setCampaignFilter] = useState<string>('all');

  const metrics = useMemo(() => getDashboardMetrics(campaignFilter === 'all' ? undefined : campaignFilter), [campaignFilter]);

  const barData = useMemo(() => {
    return mockCampaigns.map(c => {
      const coupons = mockCoupons.filter(cp => cp.campaignId === c.id);
      return {
        name: c.name.length > 15 ? c.name.slice(0, 15) + '…' : c.name,
        uploaded: coupons.length,
        claimed: coupons.filter(cp => cp.status === 'claimed').length,
      };
    });
  }, []);

  const pieData = [
    { name: 'Claimed', value: metrics.totalClaimed },
    { name: 'Uploaded', value: metrics.totalUploaded - metrics.totalClaimed - metrics.totalVoided },
    { name: 'Voided', value: metrics.totalVoided },
  ];

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
            {mockCampaigns.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Total Uploaded" value={metrics.totalUploaded} icon={<Upload className="h-5 w-5" />} trend={{ value: 12, positive: true }} />
        <KpiCard title="Claimed" value={metrics.totalClaimed} icon={<Ticket className="h-5 w-5" />} trend={{ value: 8, positive: true }} />
        <KpiCard title="Claim Rate" value={`${metrics.claimRate}%`} icon={<TrendingUp className="h-5 w-5" />} />
        <KpiCard title="PDF Downloads" value={metrics.pdfDownloads} icon={<FileText className="h-5 w-5" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" /> Coupons by Campaign
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={barData}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="uploaded" fill="hsl(215, 70%, 55%)" radius={[4, 4, 0, 0]} name="Uploaded" />
                <Bar dataKey="claimed" fill="hsl(172, 66%, 38%)" radius={[4, 4, 0, 0]} name="Claimed" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
