import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCampaigns, useCoupons } from '@/hooks/useSupabaseData';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, Download, TrendingUp, Ticket, AlertCircle, Pencil, Check, X, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';

const STATUS_COLORS: Record<string, string> = {
  active:    'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400 border-0',
  completed: 'bg-blue-100  text-blue-700  dark:bg-blue-950/40  dark:text-blue-400  border-0',
  draft:     'bg-gray-100  text-gray-600  dark:bg-gray-800     dark:text-gray-400   border-0',
};

async function fetchAllForExport(campaignId: string): Promise<Record<string, unknown>[]> {
  const PAGE = 1000;

  if (campaignId === 'uploads') {
    const all: Record<string, unknown>[] = [];
    let from = 0;
    while (true) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from('uploads') as any)
        .select('name,city,destination,number,image,created_at')
        .order('created_at', { ascending: false })
        .range(from, from + PAGE - 1);
      if (error || !data?.length) break;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      all.push(...data.map((r: any) => ({
        'Name': r.name ?? '', 'City': r.city ?? '', 'Destination': r.destination ?? '',
        'Phone': r.number ?? '', 'Image URL': r.image ?? '',
        'Uploaded At': r.created_at ? new Date(r.created_at).toLocaleString() : '',
      })));
      if (data.length < PAGE) break;
      from += PAGE;
    }
    return all;
  }

  if (campaignId === 'poses') {
    const all: Record<string, unknown>[] = [];
    let from = 0;
    while (true) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from('Poses') as any)
        .select('name,phone,image_url,created_at')
        .order('created_at', { ascending: false })
        .range(from, from + PAGE - 1);
      if (error || !data?.length) break;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      all.push(...data.map((r: any) => ({
        'Name': r.name ?? '', 'Phone': r.phone ?? '',
        'Image URL': r.image_url ?? '',
        'Uploaded At': r.created_at ? new Date(r.created_at).toLocaleString() : '',
      })));
      if (data.length < PAGE) break;
      from += PAGE;
    }
    return all;
  }

  return [];
}

export default function CampaignsPage() {
  const navigate = useNavigate();
  const { can } = useAuth();
  const [exportCampaign, setExportCampaign] = useState('');
  const [showExport, setShowExport] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [customNames, setCustomNames] = useState<Record<string, string>>(() => {
    try { return JSON.parse(localStorage.getItem('campaign_display_names') ?? '{}'); }
    catch { return {}; }
  });

  const { data: campaigns, loading } = useCampaigns();
  const { data: coupons } = useCoupons();

  const allCampaigns = campaigns ?? [];
  const allCoupons   = coupons   ?? [];

  const getDisplayName = (id: string, fallback: string) => customNames[id] ?? fallback;

  const startEdit = (id: string, currentName: string) => {
    setEditingId(id);
    setEditName(customNames[id] ?? currentName);
  };

  const saveName = (id: string) => {
    const trimmed = editName.trim();
    const next = { ...customNames };
    if (trimmed) next[id] = trimmed; else delete next[id];
    setCustomNames(next);
    localStorage.setItem('campaign_display_names', JSON.stringify(next));
    setEditingId(null);
  };

  const buildCouponRows = (campaignId: string) => {
    const campaign = allCampaigns.find(c => c.id === campaignId);
    if (!campaign?.hasCouponColumn) return [];
    return allCoupons
      .filter(c => c.campaignId === campaignId)
      .map(c => ({
        'Coupon Code':  c.couponCode,
        'Campaign':     c.campaignName,
        'Status':       c.status,
        'Claimed By':   c.claimedBy ?? '',
        'Claimed At':   c.claimedAt ? new Date(c.claimedAt).toLocaleString() : '',
        'Uploaded At':  new Date(c.uploadedAt).toLocaleString(),
      }));
  };

  const doDownload = async (format: 'excel' | 'csv') => {
    if (!exportCampaign) return;
    setExporting(true);
    try {
      const campaign = allCampaigns.find(c => c.id === exportCampaign);
      const displayName = getDisplayName(exportCampaign, campaign?.name ?? exportCampaign);
      const today = new Date().toISOString().slice(0, 10);
      const safeName = displayName.replace(/[^a-zA-Z0-9]/g, '-');

      let rows: Record<string, unknown>[];
      if (campaign?.hasCouponColumn) {
        rows = buildCouponRows(exportCampaign);
      } else {
        rows = await fetchAllForExport(exportCampaign);
      }

      if (!rows.length) { setExporting(false); return; }

      if (format === 'excel') {
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, displayName.slice(0, 31));
        XLSX.writeFile(wb, `${safeName}-${today}.xlsx`);
      } else {
        const headers = Object.keys(rows[0]);
        const csvLines = [
          headers.join(','),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ...rows.map(r => headers.map(h => JSON.stringify((r as any)[h] ?? '')).join(',')),
        ];
        const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `${safeName}-${today}.csv`;
        a.click(); URL.revokeObjectURL(url);
      }
      setShowExport(false); setExportCampaign('');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">Campaigns</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{allCampaigns.length} campaign{allCampaigns.length !== 1 ? 's' : ''} total</p>
        </div>
        {!showExport ? (
          <Button variant="outline" size="sm" className="gap-2 w-fit" onClick={() => setShowExport(true)}>
            <Download className="h-3.5 w-3.5" /> Export
          </Button>
        ) : (
          <div className="flex flex-wrap items-center gap-2 bg-muted/50 rounded-lg p-3">
            <Select value={exportCampaign} onValueChange={setExportCampaign}>
              <SelectTrigger className="w-[200px] h-8 text-xs">
                <SelectValue placeholder="Select campaign…" />
              </SelectTrigger>
              <SelectContent>
                {allCampaigns.map(c => (
                  <SelectItem key={c.id} value={c.id}>{getDisplayName(c.id, c.name)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => doDownload('excel')} disabled={!exportCampaign || exporting}>
              <Download className="h-3.5 w-3.5 mr-1" /> {exporting ? 'Loading…' : 'Excel'}
            </Button>
            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => doDownload('csv')} disabled={!exportCampaign || exporting}>
              <Download className="h-3.5 w-3.5 mr-1" /> {exporting ? '…' : 'CSV'}
            </Button>
            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => { setShowExport(false); setExportCampaign(''); }}>
              Cancel
            </Button>
            {!exportCampaign && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <AlertCircle className="h-3.5 w-3.5" /> Select a campaign to export
              </span>
            )}
          </div>
        )}
      </div>

      {/* Summary pills */}
      {!loading && (
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'Active',    count: allCampaigns.filter(c => c.status === 'active').length,    color: 'text-green-600 dark:text-green-400' },
            { label: 'Completed', count: allCampaigns.filter(c => c.status === 'completed').length, color: 'text-blue-600 dark:text-blue-400' },
            { label: 'Draft',     count: allCampaigns.filter(c => c.status === 'draft').length,     color: 'text-gray-500' },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-1.5 text-sm bg-muted/40 rounded-full px-3 py-1">
              <span className={`text-xs font-bold ${s.color}`}>{s.count}</span>
              <span className="text-muted-foreground">{s.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Campaign cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      ) : allCampaigns.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-3 text-center">
          <p className="text-sm text-muted-foreground">No campaigns yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {allCampaigns.map(c => {
            const displayName = getDisplayName(c.id, c.name);
            const totalEntries = c.totalEntries ?? 0;
            const claimed      = c.withCoupon ?? 0;

            let statsRow: { label: string; val: number; icon: React.ReactNode }[];
            let gridCols: string;

            if (c.hasCouponColumn) {
              gridCols = 'grid-cols-3';
              statsRow = [
                { label: 'Total',         val: totalEntries,    icon: <TrendingUp className="h-3 w-3" /> },
                { label: 'Coupons',       val: claimed,         icon: <Ticket className="h-3 w-3" /> },
                { label: 'PDF Downloads', val: c.pdfCount ?? 0, icon: <FileText className="h-3 w-3" /> },
              ];
            } else if (c.couponPerEntry) {
              gridCols = 'grid-cols-2';
              statsRow = [
                { label: 'Entries', val: totalEntries, icon: <TrendingUp className="h-3 w-3" /> },
                { label: 'Coupons', val: totalEntries, icon: <Ticket className="h-3 w-3" /> },
              ];
            } else {
              gridCols = 'grid-cols-1';
              statsRow = [
                { label: 'Entries', val: totalEntries, icon: <TrendingUp className="h-3 w-3" /> },
              ];
            }

            return (
              <Card
                key={c.id}
                className="border-border/60 hover:shadow-md transition-all cursor-pointer group"
                onClick={() => navigate(`/campaigns/${c.id}`)}
              >
                <CardHeader className="pb-2 pt-4 px-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      {editingId === c.id ? (
                        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                          <Input
                            value={editName}
                            onChange={e => setEditName(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') saveName(c.id); if (e.key === 'Escape') setEditingId(null); }}
                            className="h-6 text-sm px-1 py-0"
                            autoFocus
                          />
                          <button onClick={() => saveName(c.id)} className="text-green-600 hover:text-green-700">
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => setEditingId(null)} className="text-muted-foreground hover:text-foreground">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 group/name">
                          <CardTitle className="text-sm font-semibold leading-snug group-hover:text-primary transition-colors truncate">
                            {displayName}
                          </CardTitle>
                          {can('manage_users') && (
                            <button
                              className="opacity-0 group-hover/name:opacity-100 transition-opacity text-muted-foreground hover:text-foreground shrink-0"
                              onClick={e => { e.stopPropagation(); startEdit(c.id, c.name); }}
                            >
                              <Pencil className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    <Badge className={`text-[10px] px-1.5 py-0 shrink-0 ${STATUS_COLORS[c.status] ?? ''}`}>
                      {c.status}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="px-5 pb-4 space-y-3">
                  {!c.hasCouponColumn && !c.couponPerEntry && (
                    <div className="flex items-center justify-center h-5">
                      <span className="text-xs text-muted-foreground italic">No coupon tracking</span>
                    </div>
                  )}

                  <div className={`grid ${gridCols} gap-2 text-center`}>
                    {statsRow.map(s => (
                      <div key={s.label} className="bg-muted/40 rounded-lg px-2 py-1.5">
                        <p className="text-base font-bold tabular-nums">{s.val.toLocaleString()}</p>
                        <p className="text-[10px] text-muted-foreground">{s.label}</p>
                      </div>
                    ))}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full h-8 text-xs gap-1"
                    onClick={e => { e.stopPropagation(); navigate(`/campaigns/${c.id}`); }}
                  >
                    <Eye className="h-3.5 w-3.5" /> View Details
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
