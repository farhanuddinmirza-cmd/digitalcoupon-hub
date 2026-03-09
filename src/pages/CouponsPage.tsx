import { useState, useMemo } from 'react';
import { mockCoupons, mockCampaigns } from '@/lib/mock-data';
import { StatusBadge } from '@/components/StatusBadge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, Upload, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { CouponStatus } from '@/lib/types';

const PAGE_SIZE = 10;

export default function CouponsPage() {
  const { can } = useAuth();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [campaignFilter, setCampaignFilter] = useState<string>('all');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    return mockCoupons.filter(c => {
      const matchesSearch = c.couponCode.toLowerCase().includes(search.toLowerCase()) ||
        (c.claimedBy && c.claimedBy.toLowerCase().includes(search.toLowerCase())) ||
        (c.transactionId && c.transactionId.toLowerCase().includes(search.toLowerCase()));
      const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
      const matchesCampaign = campaignFilter === 'all' || c.campaignId === campaignFilter;
      return matchesSearch && matchesStatus && matchesCampaign;
    });
  }, [search, statusFilter, campaignFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl font-bold text-foreground">Coupons</h1>
        <div className="flex flex-wrap gap-2">
          {can('download_files') && (
            <Button variant="outline" size="sm"><Download className="h-3.5 w-3.5 mr-1" /> Export Excel</Button>
          )}
          {can('upload_coupons') && (
            <Button size="sm"><Upload className="h-3.5 w-3.5 mr-1" /> Upload Coupons</Button>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search code, email, txn ID…" className="pl-9" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="uploaded">Uploaded</SelectItem>
            <SelectItem value="claimed">Claimed</SelectItem>
            <SelectItem value="voided">Voided</SelectItem>
          </SelectContent>
        </Select>
        <Select value={campaignFilter} onValueChange={v => { setCampaignFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Campaign" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Campaigns</SelectItem>
            {mockCampaigns.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-lg overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Coupon Code</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Campaign</TableHead>
              <TableHead className="hidden md:table-cell">Claimed By</TableHead>
              <TableHead className="hidden md:table-cell">Claimed At</TableHead>
              <TableHead className="hidden lg:table-cell">Transaction ID</TableHead>
              <TableHead className="hidden lg:table-cell">Txn Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground">No coupons found.</TableCell></TableRow>
            ) : paginated.map(c => (
              <TableRow key={c._id} className="hover:bg-muted/30">
                <TableCell className="font-mono text-sm">{c.couponCode}</TableCell>
                <TableCell><StatusBadge status={c.status} /></TableCell>
                <TableCell className="text-sm">{c.campaignName}</TableCell>
                <TableCell className="hidden md:table-cell text-sm">{c.claimedBy ?? '—'}</TableCell>
                <TableCell className="hidden md:table-cell text-sm">{c.claimedAt ? new Date(c.claimedAt).toLocaleDateString() : '—'}</TableCell>
                <TableCell className="hidden lg:table-cell text-sm font-mono">{c.transactionId ?? '—'}</TableCell>
                <TableCell className="hidden lg:table-cell text-sm">{c.transactionDate ?? '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{filtered.length} coupon{filtered.length !== 1 ? 's' : ''}</span>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span>Page {page} of {totalPages || 1}</span>
          <Button variant="ghost" size="icon" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
