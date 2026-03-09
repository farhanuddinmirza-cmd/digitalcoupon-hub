import { useParams, useNavigate } from 'react-router-dom';
import { mockCampaigns, mockCoupons, mockActivityLogs, getDashboardMetrics } from '@/lib/mock-data';
import { KpiCard } from '@/components/KpiCard';
import { Upload, Ticket, FileText, AlertTriangle, ArrowLeft, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/auth-context';

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { can } = useAuth();
  const campaign = mockCampaigns.find(c => c.id === id);

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

  const metrics = getDashboardMetrics(id);
  const logs = mockActivityLogs.filter(a => a.campaignId === id).slice(0, 5);
  const unclaimed = metrics.totalUploaded - metrics.totalClaimed - metrics.totalVoided;

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
        <KpiCard title="Uploaded" value={metrics.totalUploaded} icon={<Upload className="h-5 w-5" />} />
        <KpiCard title="Claimed" value={metrics.totalClaimed} icon={<Ticket className="h-5 w-5" />} />
        <KpiCard title="Unclaimed" value={unclaimed} icon={<AlertTriangle className="h-5 w-5" />} />
        <KpiCard title="PDF Downloads" value={metrics.pdfDownloads} icon={<FileText className="h-5 w-5" />} />
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
          {logs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent activity for this campaign.</p>
          ) : (
            <div className="space-y-3">
              {logs.map(log => (
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
