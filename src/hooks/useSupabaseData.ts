import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import type { Campaign, Coupon, ActivityLog } from '@/lib/types';

const STALE = 5 * 60 * 1000;

function daysAgo(n: number) {
  return new Date(Date.now() - n * 864e5).toISOString();
}

// ── Low-level helpers ─────────────────────────────────────────────────────────

async function qCount(
  table: string,
  notNullCol?: string,
  sinceDate?: string,
  sinceCol?: string,
  countType: 'exact' | 'planned' | 'estimated' = 'exact',
  toDate?: string,
): Promise<number> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let q = (supabase.from(table) as any).select('*', { count: countType, head: true });
  if (notNullCol) q = q.not(notNullCol, 'is', null);
  if (sinceDate && sinceCol) q = q.gte(sinceCol, sinceDate);
  if (toDate && sinceCol) q = q.lte(sinceCol, toDate);
  const { count, error } = await q;
  if (error) throw new Error(`${table}: ${error.message}`);
  return (count ?? 0) as number;
}

async function qCountWhere(
  table: string, col: string, val: string | boolean,
  fromDate?: string, toDate?: string, dateCol?: string,
): Promise<number> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let q = (supabase.from(table) as any)
    .select('*', { count: 'exact', head: true })
    .eq(col, val);
  if (fromDate && dateCol) q = q.gte(dateCol, fromDate);
  if (toDate && dateCol) q = q.lte(dateCol, toDate);
  const { count, error } = await q;
  if (error) return 0;
  return (count ?? 0) as number;
}

async function qRows(
  table: string,
  select: string,
  notNullCol?: string,
  sinceDate?: string,
  sinceCol?: string,
  orderCol?: string,
  lim?: number,
  toDate?: string,
): Promise<Record<string, unknown>[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let q = (supabase.from(table) as any).select(select);
  if (notNullCol) q = q.not(notNullCol, 'is', null);
  if (sinceDate && sinceCol) q = q.gte(sinceCol, sinceDate);
  if (toDate && sinceCol) q = q.lte(sinceCol, toDate);
  if (orderCol) q = q.order(orderCol, { ascending: false });
  if (lim) q = q.limit(lim);
  const { data, error } = await q;
  if (error) throw new Error(`${table}: ${error.message}`);
  return (data ?? []) as Record<string, unknown>[];
}

// Per-campaign stats: total rows, claimed count, active-in-date-range
type CampStats = { total: number; claimed: number; active: boolean; pdfCount: number };

async function fetchCampStats(
  table: string,
  hasCoupon: boolean,
  dateCol: string,
  pdfCol?: string,
  allEntriesAreCoupon?: boolean,
  totalCountType: 'exact' | 'planned' | 'estimated' = 'exact',
  fromDate?: string,
  toDate?: string,
): Promise<CampStats> {
  const s7 = daysAgo(7);
  const [total, claimedRaw, recent, pdfCount] = await Promise.all([
    qCount(table, undefined, fromDate, dateCol, totalCountType, toDate),
    hasCoupon ? qCount(table, 'coupon_code', fromDate, dateCol, 'exact', toDate) : Promise.resolve(0),
    hasCoupon
      ? qCount(table, 'coupon_code', fromDate ?? s7, dateCol, 'exact', toDate)
      : qCount(table, undefined, fromDate ?? s7, dateCol, 'exact', toDate),
    pdfCol ? qCountWhere(table, pdfCol, 'true', fromDate, toDate, dateCol) : Promise.resolve(0),
  ]);
  const claimed = allEntriesAreCoupon ? total : claimedRaw;
  return { total, claimed, active: recent > 0, pdfCount };
}

// ── Campaigns ─────────────────────────────────────────────────────────────────

export function useCampaigns() {
  const hs = useQuery({ queryKey: ['stats', 'Holiday Songs'], queryFn: () => fetchCampStats('Holiday Songs', true, 'updated_at', 'pdf'), staleTime: STALE });
  const s  = useQuery({ queryKey: ['stats', 'songs'],         queryFn: () => fetchCampStats('songs',         true, 'updated_at', undefined, false, 'exact'), staleTime: STALE });
  const u  = useQuery({ queryKey: ['stats', 'uploads'],       queryFn: () => fetchCampStats('uploads',       false, 'created_at'), staleTime: STALE });
  const p  = useQuery({ queryKey: ['stats', 'Poses'],         queryFn: () => fetchCampStats('Poses',         false, 'created_at', undefined, true), staleTime: STALE });

  const loading = hs.isLoading || s.isLoading || u.isLoading || p.isLoading;
  const error   = hs.error || s.error || u.error || p.error;

  const data = useMemo((): Campaign[] | undefined => {
    if (loading) return undefined;
    const mk = (id: string, name: string, st: CampStats | undefined, hasCoupon: boolean, couponPerEntry = false): Campaign => ({
      id, name, brand: '', store: '', startDate: '', endDate: '',
      status: st?.active ? 'active' : 'completed',
      totalEntries: st?.total ?? 0,
      withCoupon: st?.claimed ?? 0,
      hasCouponColumn: hasCoupon,
      couponPerEntry,
      pdfCount: st?.pdfCount ?? 0,
    });
    return [
      mk('holiday-songs', 'Holiday Songs', hs.data, true),
      mk('songs',         'Songs',         s.data,  true),
      mk('uploads',       'Uploads',       u.data,  false),
      mk('poses',         'Poses',         p.data,  false, true),
    ];
  }, [hs.data, s.data, u.data, p.data, loading]);

  return { data, loading, error };
}

// ── Coupons (row data for display/export — capped at 1000 most recent) ────────

export function useCoupons(campaignId?: string) {
  const showHS = !campaignId || campaignId === 'holiday-songs';
  const showS  = !campaignId || campaignId === 'songs';

  const hsRows = useQuery({
    queryKey: ['coupons', 'Holiday Songs'],
    queryFn: () => qRows('Holiday Songs', 'id,coupon_code,your_name,title,created_at,updated_at',
      undefined, undefined, undefined, 'updated_at', 1000),
    staleTime: STALE,
    enabled: showHS,
  });
  const sRows = useQuery({
    queryKey: ['coupons', 'songs'],
    queryFn: () => qRows('songs', 'id,coupon_code,your_name,title,created_at,updated_at',
      undefined, undefined, undefined, 'updated_at', 1000),
    staleTime: STALE,
    enabled: showS,
  });

  const loading = (showHS && hsRows.isLoading) || (showS && sRows.isLoading);
  const error   = hsRows.error || sRows.error;

  const data = useMemo((): Coupon[] | undefined => {
    if (loading) return undefined;
    const all: Coupon[] = [];
    if (showHS) {
      (hsRows.data ?? []).forEach((r) => all.push({
        _id: String(r.id), couponCode: (r.coupon_code as string) ?? '',
        campaignId: 'holiday-songs', campaignName: 'Holiday Songs',
        status: r.coupon_code ? 'claimed' : 'uploaded',
        claimedBy: (r.your_name as string) ?? null,
        claimedAt: r.coupon_code ? ((r.updated_at as string) ?? null) : null,
        transactionId: null, transactionDate: null,
        uploadedAt: (r.created_at as string) ?? '', store: '', brand: '',
      }));
    }
    if (showS) {
      (sRows.data ?? []).forEach((r) => all.push({
        _id: String(r.id), couponCode: (r.coupon_code as string) ?? '',
        campaignId: 'songs', campaignName: 'Songs',
        status: r.coupon_code ? 'claimed' : 'uploaded',
        claimedBy: (r.your_name as string) ?? null,
        claimedAt: r.coupon_code ? ((r.updated_at as string) ?? null) : null,
        transactionId: null, transactionDate: null,
        uploadedAt: (r.created_at as string) ?? '', store: '', brand: '',
      }));
    }
    return all;
  }, [hsRows.data, sRows.data, loading, showHS, showS]);

  return { data, loading, error };
}

// ── Activity Logs (recent N rows per source) ───────────────────────────────────

export function useActivityLogs(campaignId?: string, limit = 500) {
  const PER_SOURCE = 500;

  const hsRows = useQuery({
    queryKey: ['activity', 'Holiday Songs'],
    queryFn: () => qRows('Holiday Songs', 'id,coupon_code,your_name,title,updated_at,created_at',
      'coupon_code', undefined, undefined, 'updated_at', PER_SOURCE),
    staleTime: STALE,
  });
  const sRows = useQuery({
    queryKey: ['activity', 'songs'],
    queryFn: () => qRows('songs', 'id,coupon_code,your_name,title,updated_at,created_at',
      'coupon_code', undefined, undefined, 'updated_at', PER_SOURCE),
    staleTime: STALE,
  });
  const uRows = useQuery({
    queryKey: ['activity', 'uploads'],
    queryFn: () => qRows('uploads', 'id,name,city,created_at',
      undefined, undefined, undefined, 'created_at', PER_SOURCE),
    staleTime: STALE,
  });
  const pRows = useQuery({
    queryKey: ['activity', 'Poses'],
    queryFn: () => qRows('Poses', 'id,name,created_at',
      undefined, undefined, undefined, 'created_at', PER_SOURCE),
    staleTime: STALE,
  });

  const loading = hsRows.isLoading || sRows.isLoading || uRows.isLoading || pRows.isLoading;
  const error   = hsRows.error || sRows.error || uRows.error || pRows.error;

  const data = useMemo((): ActivityLog[] | undefined => {
    if (loading) return undefined;
    const logs: ActivityLog[] = [];

    (sRows.data ?? []).forEach((r) => logs.push({
      id: String(r.id), action: 'claimed',
      description: `A new song "${r.title ?? 'song'}" was uploaded by ${r.your_name ?? 'user'}`,
      userId: String(r.id), userName: (r.your_name as string) ?? 'User',
      campaignId: 'songs', campaignName: 'Songs',
      timestamp: (r.updated_at as string) ?? (r.created_at as string) ?? '',
    }));
    (hsRows.data ?? []).forEach((r) => logs.push({
      id: String(r.id) + '-hs', action: 'claimed',
      description: `A new holiday song "${r.title ?? 'holiday song'}" was uploaded by ${r.your_name ?? 'user'}`,
      userId: String(r.id), userName: (r.your_name as string) ?? 'User',
      campaignId: 'holiday-songs', campaignName: 'Holiday Songs',
      timestamp: (r.updated_at as string) ?? (r.created_at as string) ?? '',
    }));
    (uRows.data ?? []).forEach((r) => logs.push({
      id: String(r.id) + '-up', action: 'uploaded',
      description: `A new photo was uploaded by "${r.name ?? 'user'}" from ${r.city ?? 'unknown city'}`,
      userId: String(r.id), userName: (r.name as string) ?? 'User',
      campaignId: 'uploads', campaignName: 'Uploads',
      timestamp: (r.created_at as string) ?? '',
    }));
    (pRows.data ?? []).forEach((r) => logs.push({
      id: String(r.id) + '-p', action: 'uploaded',
      description: `A new pose was uploaded by "${r.name ?? 'user'}"`,
      userId: String(r.id), userName: (r.name as string) ?? 'User',
      campaignId: 'poses', campaignName: 'Poses',
      timestamp: (r.created_at as string) ?? '',
    }));

    logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const filtered = campaignId && campaignId !== 'all'
      ? logs.filter(l => l.campaignId === campaignId)
      : logs;

    return filtered.slice(0, limit);
  }, [hsRows.data, sRows.data, uRows.data, pRows.data, loading, campaignId, limit]);

  return { data, loading, error };
}

// ── Dashboard Stats ────────────────────────────────────────────────────────────

export function useDashboardStats(dateRange?: { from: string; to: string } | null) {
  const fromDate = dateRange?.from;
  const toDate   = dateRange?.to;
  const isRanged = !!(fromDate || toDate);

  // When ranged use separate keys so React Query refetches; when all-time share cache with useCampaigns
  const hs = useQuery({
    queryKey: isRanged ? ['stats-d', 'Holiday Songs', fromDate, toDate] : ['stats', 'Holiday Songs'],
    queryFn: () => fetchCampStats('Holiday Songs', true, 'updated_at', 'pdf', false, 'exact', fromDate, toDate),
    staleTime: STALE,
  });
  const s = useQuery({
    queryKey: isRanged ? ['stats-d', 'songs', fromDate, toDate] : ['stats', 'songs'],
    queryFn: () => fetchCampStats('songs', true, 'updated_at', undefined, false, 'exact', fromDate, toDate),
    staleTime: STALE,
  });
  const u = useQuery({
    queryKey: isRanged ? ['stats-d', 'uploads', fromDate, toDate] : ['stats', 'uploads'],
    queryFn: () => fetchCampStats('uploads', false, 'created_at', undefined, false, 'exact', fromDate, toDate),
    staleTime: STALE,
  });
  const p = useQuery({
    queryKey: isRanged ? ['stats-d', 'Poses', fromDate, toDate] : ['stats', 'Poses'],
    queryFn: () => fetchCampStats('Poses', false, 'created_at', undefined, true, 'exact', fromDate, toDate),
    staleTime: STALE,
  });

  // Trend rows for charts — use date range when provided, else last 30 days
  const trendFrom = fromDate ?? daysAgo(30);
  const trendTo   = toDate;
  const hsTrend = useQuery({
    queryKey: ['trend', 'Holiday Songs', trendFrom, trendTo ?? 'now'],
    queryFn: () => qRows('Holiday Songs', 'updated_at', 'coupon_code', trendFrom, 'updated_at', 'updated_at', 5000, trendTo),
    staleTime: STALE,
  });
  const sTrend = useQuery({
    queryKey: ['trend', 'songs', trendFrom, trendTo ?? 'now'],
    queryFn: () => qRows('songs', 'updated_at', 'coupon_code', trendFrom, 'updated_at', 'updated_at', 5000, trendTo),
    staleTime: STALE,
  });

  // Recent rows for activity feed
  const hsRecent = useQuery({
    queryKey: ['recent', 'Holiday Songs'],
    queryFn: () => qRows('Holiday Songs', 'id,coupon_code,your_name,title,updated_at,created_at',
      'coupon_code', undefined, undefined, 'updated_at', 6),
    staleTime: STALE,
  });
  const sRecent = useQuery({
    queryKey: ['recent', 'songs'],
    queryFn: () => qRows('songs', 'id,coupon_code,your_name,title,updated_at,created_at',
      'coupon_code', undefined, undefined, 'updated_at', 6),
    staleTime: STALE,
  });
  const uRecent = useQuery({
    queryKey: ['recent', 'uploads'],
    queryFn: () => qRows('uploads', 'id,name,city,created_at',
      undefined, undefined, undefined, 'created_at', 6),
    staleTime: STALE,
  });
  const pRecent = useQuery({
    queryKey: ['recent', 'Poses'],
    queryFn: () => qRows('Poses', 'id,name,created_at',
      undefined, undefined, undefined, 'created_at', 6),
    staleTime: STALE,
  });

  const loading = hs.isLoading || s.isLoading || u.isLoading || p.isLoading
    || hsTrend.isLoading || sTrend.isLoading;
  const error = hs.error || s.error || u.error || p.error || hsTrend.error || sTrend.error;

  const data = useMemo(() => {
    if (hs.isLoading || s.isLoading || u.isLoading || p.isLoading
      || hsTrend.isLoading || sTrend.isLoading) return null;

    const hsClaimed = hs.data?.claimed ?? 0;
    const sClaimed  = s.data?.claimed  ?? 0;
    const pClaimed  = p.data?.claimed  ?? 0; // allEntriesAreCoupon: total = claimed
    const hsTotal   = hs.data?.total   ?? 0;
    const sTotal    = s.data?.total    ?? 0;
    const pTotal    = p.data?.total    ?? 0;

    const claimed = hsClaimed + sClaimed + pClaimed;
    const total   = claimed;

    const activeCampaigns = [hs.data, s.data, u.data, p.data].filter(c => c?.active).length;

    // Daily claims (merged from both coupon tables)
    const dayMap: Record<string, number> = {};
    (hsTrend.data ?? []).concat(sTrend.data ?? []).forEach(r => {
      const day = (r.updated_at as string).slice(0, 10);
      dayMap[day] = (dayMap[day] ?? 0) + 1;
    });
    const dailyClaims = Object.entries(dayMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30);

    // Per-campaign daily time-series
    type PerfRow = { date: string; [k: string]: string | number };
    const perfMap: Record<string, PerfRow> = {};
    [
      { rows: hsTrend.data ?? [], id: 'Holiday Songs' },
      { rows: sTrend.data ?? [],  id: 'Songs' },
    ].forEach(({ rows, id }) => {
      rows.forEach(r => {
        const day = (r.updated_at as string).slice(0, 10);
        if (!perfMap[day]) perfMap[day] = { date: day };
        perfMap[day][id] = ((perfMap[day][id] as number) || 0) + 1;
      });
    });
    const dailyPerformance = Object.values(perfMap).sort(
      (a, b) => (a.date as string).localeCompare(b.date as string),
    );

    const campaignDefs = [
      { id: 'holiday-songs', name: 'Holiday Songs', stats: hs.data, couponPerEntry: false },
      { id: 'songs',         name: 'Songs',         stats: s.data,  couponPerEntry: false },
      { id: 'uploads',       name: 'Uploads',       stats: u.data,  couponPerEntry: false },
      { id: 'poses',         name: 'Poses',         stats: p.data,  couponPerEntry: true  },
    ];
    const byCampaign = campaignDefs.map(({ id, name, stats, couponPerEntry }) => {
      const t = stats?.total   ?? 0;
      const c = stats?.claimed ?? 0;
      return {
        id, name: name.length > 20 ? name.slice(0, 18) + '…' : name, fullName: name,
        total: t, claimed: c, voided: 0,
        rate: t > 0 ? Math.round((c / t) * 100) : 0,
        status: stats?.active ? 'active' : 'completed',
        pdfCount: stats?.pdfCount ?? 0,
        couponPerEntry: couponPerEntry ?? false,
      };
    });

    const CAMP_FILLS = ['hsl(172,66%,38%)', 'hsl(215,70%,55%)', 'hsl(45,93%,58%)', 'hsl(0,72%,51%)'];
    const statusDistribution = byCampaign
      .filter(c => c.claimed > 0)
      .map((c, i) => ({ name: c.fullName, value: c.claimed, fill: CAMP_FILLS[i % CAMP_FILLS.length] }));

    // Recent activity for dashboard feed
    const logs: ActivityLog[] = [];
    (sRecent.data ?? []).forEach(r => logs.push({
      id: String(r.id), action: 'claimed',
      description: `A new song "${r.title ?? 'song'}" was uploaded by ${r.your_name ?? 'user'}`,
      userId: String(r.id), userName: (r.your_name as string) ?? 'User',
      campaignId: 'songs', campaignName: 'Songs',
      timestamp: (r.updated_at as string) ?? (r.created_at as string) ?? '',
    }));
    (hsRecent.data ?? []).forEach(r => logs.push({
      id: String(r.id) + '-hs', action: 'claimed',
      description: `A new holiday song "${r.title ?? 'holiday song'}" was uploaded by ${r.your_name ?? 'user'}`,
      userId: String(r.id), userName: (r.your_name as string) ?? 'User',
      campaignId: 'holiday-songs', campaignName: 'Holiday Songs',
      timestamp: (r.updated_at as string) ?? (r.created_at as string) ?? '',
    }));
    (uRecent.data ?? []).forEach(r => logs.push({
      id: String(r.id) + '-up', action: 'uploaded',
      description: `A new photo was uploaded by "${r.name ?? 'user'}" from ${r.city ?? 'unknown city'}`,
      userId: String(r.id), userName: (r.name as string) ?? 'User',
      campaignId: 'uploads', campaignName: 'Uploads',
      timestamp: (r.created_at as string) ?? '',
    }));
    (pRecent.data ?? []).forEach(r => logs.push({
      id: String(r.id) + '-p', action: 'uploaded',
      description: `A new pose was uploaded by "${r.name ?? 'user'}"`,
      userId: String(r.id), userName: (r.name as string) ?? 'User',
      campaignId: 'poses', campaignName: 'Poses',
      timestamp: (r.created_at as string) ?? '',
    }));
    logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const recentLogs = logs.slice(0, 6);

    const allEntries = hsTotal + sTotal + pTotal;
    const claimRate = allEntries > 0 ? Math.round((claimed / allEntries) * 100) : 0;

    return {
      total, claimed, voided: 0, claimRate,
      activeCampaigns, totalCampaigns: 4,
      dailyClaims, byCampaign, statusDistribution, recentLogs, dailyPerformance,
    };
  }, [hs.data, s.data, u.data, p.data, hsTrend.data, sTrend.data,
      hsRecent.data, sRecent.data, uRecent.data, pRecent.data]);

  return { data, loading, error };
}
