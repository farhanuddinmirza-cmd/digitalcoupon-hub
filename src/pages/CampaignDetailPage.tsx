import { useParams, useNavigate } from 'react-router-dom';
import { useFetch } from '@/hooks/useApi';
import { Campaign, Coupon, ActivityLog } from '@/lib/types';
import { KpiCard } from '@/components/KpiCard';
import { Upload, Ticket, FileText, AlertTriangle, ArrowLeft, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/auth-context';

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { can } = useAuth();

  const { data: campaigns, loading } = useFetch<Campaign[]>('/api/campaigns');
  const { data: coupons } = useFetch<Coupon[]>(`/api/coupons?campaignId=${id}`);
  const { data: logs } = useFetch<ActivityLog[]>(`/api/activity?campaignId=${id}`);

  const campaign = (campaigns ?? []).find(c => c.id === id);
  const allCoupons = coupons ?? [];
  const recentLogs = (logs ?? []).slice(0, 5);

  const totalUploaded = allCoupons.length;
  const totalClaimed = allCoupons.filter(c => c.status === 'claimed').length;
  const totalVoided = allCoupons.filter(c => c.status === 'voided').length;
  const unclaimed = totalUploaded - totalClaimed - totalVoided;

  if (loading) {
    return <div className="text-muted-foreground text-sm animate-pulse p-4">Loading campaign...</div>;
  }

  if (!campaign) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <AlertTriangle className="h-10 w-10 mb-2" />
        <p>Campaign not found</p>
        <Button variant="ghost" className="mt-2" onClick={() => navigate('/campaigns')}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Campaigns
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/campaigns')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{campaign.name}</h1>
          <p className="text-sm text-muted-foreground">{campaign.brand} · {campaign.store}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Uploaded" value={totalUploaded} icon={<Upload className="h-5 w-5" />} />
        <KpiCard title="Claimed" value={totalClaimed} icon={<Ticket className="h-5 w-5" />} />
        <KpiCard title="Unclaimed" value={unclaimed} icon={<AlertTriangle className="h-5 w-5" />} />
        <KpiCard title="Voided" value={totalVoided} icon={<FileText className="h-5 w-5" />} />
      </div>

      {(can('download_files') || can('upload_coupons')) && (
        <div className="flex flex-wrap gap-2">
          {can('download_files') && (
            <Button variant="outline" size="sm"><Download className="h-3.5 w-3.5 mr-1" /> Download Excel</Button>
          )}
          {can('upload_coupons') && (
            <Button size="sm"><Upload className="h-3.5 w-3.5 mr-1" /> Upload Coupons</Button>
          )}
          {can('download_pdf') && (
            <Button variant="outline" size="sm"><FileText className="h-3.5 w-3.5 mr-1" /> PDF Report</Button>
          )}
        </div>
      )}

      <Card className="shadow-sm">
        <CardHeader><CardTitle className="text-sm font-semibold">Recent Activity</CardTitle></CardHeader>
        <CardContent>
          {recentLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent activity for this campaign.</p>
          ) : (
            <div className="space-y-3">
              {recentLogs.map(log => (
                <div key={log.id} className="flex items-start gap-3 text-sm">
                  <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
                  <div>
                    <p className="text-foreground">{log.description}</p>
                    <p className="text-xs text-muted-foreground">{new Date(log.timestamp).toLocaleString()} · {log.userName}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
