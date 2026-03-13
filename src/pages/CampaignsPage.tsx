import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFetch } from '@/hooks/useApi';
import { Campaign, Coupon } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, Download, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';

const statusColor: Record<string, string> = {
  active: 'bg-accent text-accent-foreground',
  completed: 'bg-muted text-muted-foreground',
  draft: 'bg-secondary text-secondary-foreground',
};

export default function CampaignsPage() {
  const navigate = useNavigate();
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [exportCampaign, setExportCampaign] = useState<string>('');

  const handleDownloadExcel = () => {
    if (!exportCampaign) return;
    const campaignCoupons = mockCoupons.filter(c => c.status === 'claimed' && c.campaignId === exportCampaign);
    const campaign = mockCampaigns.find(c => c.id === exportCampaign);
    const rows = campaignCoupons.map(c => ({
      'Coupon Code': c.couponCode,
      'Campaign': c.campaignName,
      'Brand': c.brand,
      'Store': c.store,
      'Status': c.status,
      'Claimed By': c.claimedBy ?? '',
      'Claimed At': c.claimedAt ? new Date(c.claimedAt).toLocaleString() : '',
      'Transaction ID': c.transactionId ?? '',
      'Transaction Date': c.transactionDate ?? '',
      'Uploaded At': new Date(c.uploadedAt).toLocaleString(),
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Claimed Coupons');
    const today = new Date().toISOString().slice(0, 10);
    const safeName = (campaign?.name ?? 'campaign').replace(/[^a-zA-Z0-9]/g, '-');
    XLSX.writeFile(wb, `coupons-${safeName}-${today}.xlsx`);
    setShowExportDropdown(false);
    setExportCampaign('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl font-bold text-foreground">Campaigns</h1>
      </div>

      <div className="flex flex-col gap-3">
        {!showExportDropdown ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowExportDropdown(true)}
            className="w-fit"
          >
            <Download className="h-3.5 w-3.5 mr-1" /> Download Excel
          </Button>
        ) : (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 bg-muted/50 rounded-md p-3 w-fit">
            <div className="flex items-center gap-2">
              <Select value={exportCampaign} onValueChange={setExportCampaign}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select campaign to export" />
                </SelectTrigger>
                <SelectContent>
                  {mockCampaigns.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="default"
                size="sm"
                onClick={handleDownloadExcel}
                disabled={!exportCampaign}
              >
                <Download className="h-3.5 w-3.5 mr-1" /> Download
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setShowExportDropdown(false); setExportCampaign(''); }}
              >
                Cancel
              </Button>
            </div>
            {!exportCampaign && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4 shrink-0" />
                Select a campaign to export
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {mockCampaigns.map(c => {
          const coupons = mockCoupons.filter(cp => cp.campaignId === c.id);
          const claimed = coupons.filter(cp => cp.status === 'claimed').length;
          const unclaimed = coupons.filter(cp => cp.status === 'uploaded').length;
          return (
            <Card key={c.id} className="shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/campaigns/${c.id}`)}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">{c.name}</CardTitle>
                  <Badge className={`${statusColor[c.status]} capitalize text-xs`}>{c.status}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{c.brand} · {c.store}</p>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Uploaded</span>
                  <span className="font-medium">{coupons.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Claimed</span>
                  <span className="font-medium">{claimed}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Unclaimed</span>
                  <span className="font-medium">{unclaimed}</span>
                </div>
                <Button variant="outline" size="sm" className="w-full mt-2" onClick={e => { e.stopPropagation(); navigate(`/campaigns/${c.id}`); }}>
                  <Eye className="h-3.5 w-3.5 mr-1" /> View Details
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
