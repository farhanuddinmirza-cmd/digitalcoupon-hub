import { useParams, useNavigate } from 'react-router-dom';
import { useCampaigns, useCoupons, useActivityLogs } from '@/hooks/useSupabaseData';
import { MetricCard } from '@/components/MetricCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Upload, Ticket, AlertTriangle, FileText, Download } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import * as XLSX from 'xlsx';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

const STATUS_COLORS: Record<string, string> = {
  active:    'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400 border-0',
  completed: 'bg-blue-100  text-blue-700  dark:bg-blue-950/40  dark:text-blue-400  border-0',
  draft:     'bg-gray-100  text-gray-600  dark:bg-gray-800     dark:text-gray-400   border-0',
};

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { can } = useAuth();

  const { data: campaigns, loading: loadingCampaigns } = useCampaigns();
  const { data: coupons,   loading: loadingCoupons   } = useCoupons(id);
  const { data: logs }                                  = useActivityLogs(id, 10);

  const campaign   = (campaigns ?? []).find(c => c.id === id);
  const allCoupons = coupons ?? [];
  const recentLogs = (logs ?? []).slice(0, 5);

  const totalEntries   = campaign?.totalEntries ?? 0;
  const hasCoupon      = campaign?.hasCouponColumn ?? false;
  const couponPerEntry = campaign?.couponPerEntry ?? false;
  const pdfCount       = campaign?.pdfCount ?? 0;
  const totalClaimed   = hasCoupon ? (campaign?.withCoupon ?? 0) : couponPerEntry ? totalEntries : 0;
  const totalVoided    = 0;
  const unclaimed      = hasCoupon ? totalEntries - totalClaimed : 0;
  const claimRate      = totalEntries && hasCoupon
    ? Math.round((totalClaimed / totalEntries) * 100) : couponPerEntry ? 100 : 0;
  const totalUploaded  = totalEntries;

  const statusChartData = [
    { name: 'Claimed',  value: totalClaimed,  fill: 'hsl(172,66%,38%)' },
    { name: 'Pending',  value: unclaimed,      fill: 'hsl(215,70%,60%)' },
    { name: 'Voided',   value: totalVoided,    fill: 'hsl(0,65%,60%)' },
  ].filter(d => d.value > 0);

  const loading = loadingCampaigns || loadingCoupons;

  const handleDownloadExcel = () => {
    const rows = allCoupons
      .filter(c => c.status === 'claimed')
      .map(c => ({
        'Coupon Code':    c.couponCode,
        'Campaign':       c.campaignName,
        'Brand':          c.brand,
        'Store':          c.store,
        'Claimed By':     c.claimedBy ?? '',
        'Claimed At':     c.claimedAt ? new Date(c.claimedAt).toLocaleString() : '',
        'Transaction ID': c.transactionId ?? '',
        'Transaction Date': c.transactionDate ?? '',
      }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Claimed Coupons');
    const today = new Date().toISOString().slice(0, 10);
    const safeName = (campaign?.name ?? 'campaign').replace(/[^a-zA-Z0-9]/g, '-');
    XLSX.writeFile(wb, `coupons-${safeName}-${today}.xlsx`);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/campaigns')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="space-y-1.5">
            <Skeleton className="h-5 w-48 rounded" />
            <Skeleton className="h-3.5 w-32 rounded" />
          </div>
        </div>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3 text-center">
        <AlertTriangle className="h-10 w-10 text-muted-foreground opacity-40" />
        <p className="font-semibold text-foreground">Campaign not found</p>
        <Button variant="outline" size="sm" onClick={() => navigate('/campaigns')}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Campaigns
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="icon" className="mt-0.5 shrink-0" onClick={() => navigate('/campaigns')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-foreground">{campaign.name}</h1>
            <Badge className={`text-[10px] px-1.5 py-0 ${STATUS_COLORS[campaign.status] ?? ''}`}>
              {campaign.status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">{campaign.brand} · {campaign.store}</p>
        </div>
        <div className="flex gap-2 shrink-0">
          {can('download_files') && (
            <Button variant="outline" size="sm" className="gap-1 text-xs h-8" onClick={handleDownloadExcel}>
              <Download className="h-3.5 w-3.5" /> Excel
            </Button>
          )}
          {can('upload_coupons') && (
            <Button size="sm" className="gap-1 text-xs h-8">
              <Upload className="h-3.5 w-3.5" /> Upload
            </Button>
          )}
        </div>
      </div>

      {/* KPI cards */}
      {(() => {
        const hasPdf = hasCoupon && pdfCount > 0;
        const cols = !hasCoupon && !couponPerEntry
          ? 'grid-cols-1 sm:grid-cols-2'
          : hasPdf
            ? 'grid-cols-2 xl:grid-cols-5'
            : 'grid-cols-2 xl:grid-cols-4';
        return (
          <div className={`grid gap-3 ${cols}`}>
            <MetricCard title="Total Entries"  value={totalEntries.toLocaleString()}  icon={<Upload />}        color="blue"   />
            {(hasCoupon || couponPerEntry) && <>
              <MetricCard title="Coupons Issued" value={totalClaimed.toLocaleString()} icon={<Ticket />}        color="green"  />
              {hasCoupon && <MetricCard title="Pending"      value={unclaimed.toLocaleString()}    icon={<AlertTriangle />} color="orange" />}
              {hasPdf    && <MetricCard title="PDF Downloads" value={pdfCount.toLocaleString()}     icon={<FileText />}      color="purple" />}
              <MetricCard title="Issue Rate"     value={`${claimRate}%`}               icon={<Download />}      color="blue"   />
            </>}
          </div>
        );
      })()}

      {/* Chart + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {statusChartData.length > 0 && (
          <Card className="border-border/60">
            <CardHeader className="pb-1 pt-4 px-5">
              <CardTitle className="text-sm font-semibold">Coupon Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-4">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={statusChartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip formatter={(v, n) => [v, n]} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {statusChartData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        <Card className="border-border/60">
          <CardHeader className="pb-1 pt-4 px-5">
            <CardTitle className="text-sm font-semibold">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            {recentLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">No recent activity</p>
            ) : (
              <div className="space-y-0">
                {recentLogs.map((log, i) => (
                  <div
                    key={log.id}
                    className={`flex items-start gap-3 py-3 ${i < recentLogs.length - 1 ? 'border-b border-border/40' : ''}`}
                  >
                    <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground leading-snug">{log.description}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {log.userName} · {new Date(log.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
