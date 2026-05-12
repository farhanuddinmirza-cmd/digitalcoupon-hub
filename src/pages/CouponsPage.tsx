import { useState, useMemo } from 'react';
import { useCampaigns, useCoupons } from '@/hooks/useSupabaseData';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, ChevronLeft, ChevronRight, Ticket } from 'lucide-react';

const PAGE_SIZE = 15;

const STATUS_COLORS: Record<string, string> = {
  uploaded: 'bg-gray-100  text-gray-600  dark:bg-gray-800     dark:text-gray-400   border-0',
  claimed:  'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400 border-0',
  voided:   'bg-red-100   text-red-700   dark:bg-red-950/40   dark:text-red-400   border-0',
};

export default function CouponsPage() {
  const [search, setSearch]               = useState('');
  const [statusFilter, setStatusFilter]   = useState('all');
  const [campaignFilter, setCampaignFilter] = useState('all');
  const [page, setPage]                   = useState(1);

  const { data: campaigns } = useCampaigns();
  const { data: coupons, loading } = useCoupons();

  const allCampaigns = campaigns ?? [];
  const allCoupons   = coupons   ?? [];

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return allCoupons.filter(c => {
      const matchSearch =
        c.couponCode.toLowerCase().includes(q) ||
        (c.claimedBy   && c.claimedBy.toLowerCase().includes(q)) ||
        (c.transactionId && c.transactionId.toLowerCase().includes(q));
      const matchStatus   = statusFilter   === 'all' || c.status      === statusFilter;
      const matchCampaign = campaignFilter === 'all' || c.campaignId   === campaignFilter;
      return matchSearch && matchStatus && matchCampaign;
    });
  }, [allCoupons, search, statusFilter, campaignFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const resetPage = (fn: () => void) => { fn(); setPage(1); };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Coupons</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{allCoupons.length.toLocaleString()} total</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search code, email, txn ID…"
            className="pl-9 h-9 text-sm"
            value={search}
            onChange={e => resetPage(() => setSearch(e.target.value))}
          />
        </div>
        <Select value={statusFilter} onValueChange={v => resetPage(() => setStatusFilter(v))}>
          <SelectTrigger className="w-full sm:w-[140px] h-9 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="uploaded">Uploaded</SelectItem>
            <SelectItem value="claimed">Claimed</SelectItem>
            <SelectItem value="voided">Voided</SelectItem>
          </SelectContent>
        </Select>
        <Select value={campaignFilter} onValueChange={v => resetPage(() => setCampaignFilter(v))}>
          <SelectTrigger className="w-full sm:w-[200px] h-9 text-xs"><SelectValue placeholder="Campaign" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Campaigns</SelectItem>
            {allCampaigns.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border border-border/60 rounded-xl overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="text-xs font-semibold">Coupon Code</TableHead>
              <TableHead className="text-xs font-semibold">Status</TableHead>
              <TableHead className="text-xs font-semibold">Campaign</TableHead>
              <TableHead className="text-xs font-semibold hidden md:table-cell">Claimed By</TableHead>
              <TableHead className="text-xs font-semibold hidden md:table-cell">Claimed At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: PAGE_SIZE }).map((_, i) => (
                <TableRow key={i}>
                  {[1,2,3,4,5].map(j => (
                    <TableCell key={j} className={j > 3 ? 'hidden md:table-cell' : ''}>
                      <Skeleton className="h-4 rounded" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Ticket className="h-8 w-8 opacity-30" />
                    <p className="text-sm">No coupons found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginated.map(c => (
                <TableRow key={c._id ?? c.id} className="hover:bg-muted/20 transition-colors">
                  <TableCell className="font-mono text-xs py-3">{c.couponCode}</TableCell>
                  <TableCell className="py-3">
                    <Badge className={`text-[10px] px-1.5 py-0 ${STATUS_COLORS[c.status] ?? ''}`}>
                      {c.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs py-3 max-w-[140px] truncate">{c.campaignName}</TableCell>
                  <TableCell className="text-xs py-3 hidden md:table-cell">{c.claimedBy ?? '—'}</TableCell>
                  <TableCell className="text-xs py-3 hidden md:table-cell">
                    {c.claimedAt ? new Date(c.claimedAt).toLocaleString() : '—'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {filtered.length > 0
            ? `${((page - 1) * PAGE_SIZE) + 1}–${Math.min(page * PAGE_SIZE, filtered.length)} of ${filtered.length.toLocaleString()}`
            : '0 results'}
        </span>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="px-2">Page {page} of {totalPages}</span>
          <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
