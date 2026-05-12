import { useMemo, useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Ticket, TrendingUp, LayoutGrid, ArrowRight, RefreshCw, ChevronDown, Check } from 'lucide-react';
import { DateRangeFilter, DateRange } from '@/components/DateRangeFilter';
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, LineChart, Line,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { MetricCard } from '@/components/MetricCard';
import { useDashboardStats } from '@/hooks/useSupabaseData';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

const STATUS_COLORS: Record<string, string> = {
  active:    'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400 border-0',
  completed: 'bg-blue-100  text-blue-700  dark:bg-blue-950/40  dark:text-blue-400  border-0',
  draft:     'bg-gray-100  text-gray-600  dark:bg-gray-800     dark:text-gray-400   border-0',
};

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="h-[220px] flex flex-col items-center justify-center text-muted-foreground gap-2">
      <div className="h-10 w-10 rounded-full bg-muted/60 flex items-center justify-center">
        <TrendingUp className="h-4 w-4 opacity-40" />
      </div>
      <p className="text-sm">{label}</p>
    </div>
  );
}

function AreaTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  let formatted = label;
  try { formatted = format(parseISO(label), 'MMM d, yyyy'); } catch {}
  return (
    <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-md text-xs">
      <p className="font-medium text-foreground mb-1">{formatted}</p>
      <p className="text-primary font-semibold">{payload[0].value} claims</p>
    </div>
  );
}

type PerfPeriod = 'daily' | 'weekly';

function toWeekly(daily: { date: string; [k: string]: string | number }[]) {
  const buckets: Record<string, Record<string, number>> = {};
  daily.forEach(row => {
    const d = new Date(row.date);
    const monday = new Date(d);
    monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    const key = monday.toISOString().slice(0, 10);
    if (!buckets[key]) buckets[key] = { date: key };
    Object.entries(row).forEach(([k, v]) => {
      if (k !== 'date') buckets[key][k] = ((buckets[key][k] as number) || 0) + (v as number);
    });
  });
  return Object.values(buckets).sort((a, b) => (a.date as string).localeCompare(b.date as string));
}

// ── Multi-select Campaign Filter ─────────────────────────────────────────────

function MultiCampaignSelect({
  campaigns,
  selected,
  onChange,
}: {
  campaigns: { id: string; fullName: string }[];
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggle = (id: string) => {
    onChange(selected.includes(id) ? selected.filter(s => s !== id) : [...selected, id]);
  };

  const label = selected.length === 0
    ? 'All Campaigns'
    : selected.length === 1
      ? (campaigns.find(c => c.id === selected[0])?.fullName ?? '1 selected')
      : `${selected.length} campaigns`;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 h-8 px-3 text-xs rounded-md border border-input bg-background text-foreground hover:bg-muted/50 transition-colors min-w-[160px] justify-between"
      >
        <span className="truncate">{label}</span>
        <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-9 z-50 bg-popover border border-border rounded-lg shadow-md py-1 min-w-[180px]">
          <button
            onClick={() => onChange([])}
            className="flex items-center gap-2 w-full px-3 py-1.5 text-xs hover:bg-muted/50 transition-colors"
          >
            <div className={cn('h-3.5 w-3.5 rounded-sm border flex items-center justify-center', selected.length === 0 ? 'bg-primary border-primary' : 'border-input')}>
              {selected.length === 0 && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
            </div>
            <span>All Campaigns</span>
          </button>
          <div className="h-px bg-border/60 my-1" />
          {campaigns.map(c => (
            <button
              key={c.id}
              onClick={() => toggle(c.id)}
              className="flex items-center gap-2 w-full px-3 py-1.5 text-xs hover:bg-muted/50 transition-colors"
            >
              <div className={cn('h-3.5 w-3.5 rounded-sm border flex items-center justify-center shrink-0', selected.includes(c.id) ? 'bg-primary border-primary' : 'border-input')}>
                {selected.includes(c.id) && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
              </div>
              <span className="truncate">{c.fullName}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Campaign line colors ──────────────────────────────────────────────────────
const CAMP_COLORS: Record<string, string> = {
  'Holiday Songs': 'hsl(172,66%,38%)',
  'Songs':         'hsl(215,70%,55%)',
  'Uploads':       'hsl(35,90%,55%)',
  'Poses':         'hsl(280,60%,55%)',
};

export default function DashboardPage() {
  const qc = useQueryClient();
  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([]);
  const [perfPeriod, setPerfPeriod] = useState<PerfPeriod>('daily');
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | null>(() => {
    const to = new Date().toISOString().slice(0, 10);
    const from = new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10);
    return { from, to };
  });
  const { data: stats, loading, error } = useDashboardStats();
  const logs = stats?.recentLogs;

  const handleRefresh = async () => {
    setRefreshing(true);
    await qc.invalidateQueries();
    setTimeout(() => setRefreshing(false), 800);
  };

  const isFiltered = selectedCampaigns.length > 0;

  // Filtered campaign list
  const filteredCampaigns = useMemo(() => {
    if (!stats?.byCampaign) return [];
    if (!isFiltered) return stats.byCampaign;
    return stats.byCampaign.filter(c => selectedCampaigns.includes(c.id));
  }, [stats, selectedCampaigns, isFiltered]);

  // KPI metrics derived from filtered campaigns
  const filteredKpi = useMemo(() => {
    if (!stats) return { total: 0, claimRate: 0, activeCampaigns: 0 };
    if (!isFiltered) return { total: stats.total, claimRate: stats.claimRate, activeCampaigns: stats.activeCampaigns };
    const totalClaimed = filteredCampaigns.reduce((s, c) => s + c.claimed, 0);
    const totalEntries = filteredCampaigns.reduce((s, c) => s + c.total, 0);
    const active = filteredCampaigns.filter(c => c.status === 'active').length;
    return {
      total: totalClaimed,
      claimRate: totalEntries ? Math.round((totalClaimed / totalEntries) * 100) : 0,
      activeCampaigns: active,
    };
  }, [stats, filteredCampaigns, isFiltered]);

  // Status distribution for donut (derived from filtered campaigns)
  const statusDistribution = useMemo(() => {
    if (!stats) return [];
    if (!isFiltered) return stats.statusDistribution;
    const claimed  = filteredCampaigns.reduce((s, c) => s + c.claimed, 0);
    const total    = filteredCampaigns.reduce((s, c) => s + c.total, 0);
    const pending  = total - claimed;
    return [
      { name: 'Claimed', value: claimed, fill: 'hsl(172,66%,38%)' },
      { name: 'Pending', value: pending, fill: 'hsl(215,70%,60%)' },
    ].filter(d => d.value > 0);
  }, [stats, filteredCampaigns, isFiltered]);

  // Daily claims area chart — sum selected campaign performance columns, then filter by date range
  const dailyClaims = useMemo(() => {
    if (!stats) return [];
    let rows = !isFiltered ? stats.dailyClaims : (() => {
      if (!stats.dailyPerformance?.length) return [];
      const names = filteredCampaigns.map(c => c.fullName);
      return stats.dailyPerformance.map(row => ({
        date: row.date as string,
        count: names.reduce((s, n) => s + ((row[n] as number) || 0), 0),
      }));
    })();
    if (dateRange) rows = rows.filter(r => r.date >= dateRange.from && r.date <= dateRange.to);
    return rows;
  }, [stats, filteredCampaigns, isFiltered, dateRange]);

  // Performance chart — filter to selected campaign lines, then filter by date range
  const perfData = useMemo(() => {
    if (!stats?.dailyPerformance) return [];
    let raw = perfPeriod === 'weekly' ? toWeekly(stats.dailyPerformance) : stats.dailyPerformance;
    if (dateRange) raw = raw.filter(r => (r.date as string) >= dateRange.from && (r.date as string) <= dateRange.to);
    if (!isFiltered) return raw;
    const names = filteredCampaigns.map(c => c.fullName);
    return raw.map(row => {
      const filtered: Record<string, string | number> = { date: row.date };
      names.forEach(n => { filtered[n] = (row[n] as number) ?? 0; });
      return filtered;
    });
  }, [stats, filteredCampaigns, isFiltered, perfPeriod, dateRange]);

  // Campaign line keys to render
  const perfKeys = useMemo(() => {
    if (!stats?.byCampaign) return [];
    const all = stats.byCampaign.map(c => c.fullName);
    return isFiltered ? filteredCampaigns.map(c => c.fullName) : all;
  }, [stats, filteredCampaigns, isFiltered]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3 text-center">
        <p className="font-semibold text-destructive">Failed to load dashboard data</p>
        <p className="text-sm text-muted-foreground max-w-xs">{(error as Error).message}</p>
        <Button size="sm" variant="outline" onClick={handleRefresh}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">Analytics Overview</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <DateRangeFilter value={dateRange} onChange={setDateRange} />
          <MultiCampaignSelect
            campaigns={stats?.byCampaign ?? []}
            selected={selectedCampaigns}
            onChange={setSelectedCampaigns}
          />
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleRefresh}>
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
        <MetricCard loading={loading} title="Coupons Issued"   value={filteredKpi.total}            icon={<Ticket />}     color="green"  />
        <MetricCard loading={loading} title="Issue Rate"       value={`${filteredKpi.claimRate}%`}  icon={<TrendingUp />} color="purple" />
        <MetricCard loading={loading} title="Active Campaigns" value={filteredKpi.activeCampaigns}  icon={<LayoutGrid />} color="blue"   />
      </div>

      {/* Donut + Area charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="border-border/60">
          <CardHeader className="pb-1 pt-4 px-5">
            <CardTitle className="text-sm font-semibold">Coupon Status Distribution</CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-4">
            {loading ? <Skeleton className="h-[220px] rounded-xl" />
            : !statusDistribution.length ? <EmptyChart label="No coupon data yet" />
            : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={statusDistribution} cx="50%" cy="50%"
                    innerRadius={58} outerRadius={86} paddingAngle={3} dataKey="value">
                    {statusDistribution.map((e, i) => (
                      <Cell key={i} fill={e.fill} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v, n) => [`${v}`, n]} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 border-border/60">
          <CardHeader className="pb-1 pt-4 px-5">
            <CardTitle className="text-sm font-semibold">
              Daily Claims{dateRange ? ` — ${dateRange.from} → ${dateRange.to}` : ' — All Time'}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-4">
            {loading ? <Skeleton className="h-[220px] rounded-xl" />
            : !dailyClaims.length ? <EmptyChart label="No claim activity yet" />
            : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={dailyClaims} margin={{ top: 4, right: 4, bottom: 0, left: -22 }}>
                  <defs>
                    <linearGradient id="claimGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="hsl(172,66%,38%)" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="hsl(172,66%,38%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false}
                    tickFormatter={d => { try { return format(parseISO(d), 'MMM d'); } catch { return d; } }} />
                  <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip content={<AreaTooltip />} />
                  <Area type="monotone" dataKey="count" stroke="hsl(172,66%,38%)" fill="url(#claimGrad)"
                    strokeWidth={2} dot={false} activeDot={{ r: 4 }} name="Claims" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Campaign Performance */}
      <Card className="border-border/60">
        <CardHeader className="pb-1 pt-4 px-5 flex flex-row items-center justify-between gap-2 flex-wrap">
          <CardTitle className="text-sm font-semibold">Campaign Performance</CardTitle>
          <div className="flex items-center gap-2">
            <div className="flex rounded-md overflow-hidden border border-border/60 text-xs">
              {(['daily', 'weekly'] as PerfPeriod[]).map(p => (
                <button
                  key={p}
                  onClick={() => setPerfPeriod(p)}
                  className={`px-3 py-1 capitalize transition-colors ${perfPeriod === p ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:bg-muted/50'}`}
                >
                  {p}
                </button>
              ))}
            </div>
            <Button asChild variant="ghost" size="sm" className="text-xs h-7 gap-1 text-muted-foreground">
              <Link to="/campaigns">View all <ArrowRight className="h-3 w-3" /></Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-3 pb-4">
          {loading ? <Skeleton className="h-[240px] rounded-xl" />
          : !perfData.length ? <EmptyChart label="No performance data yet" />
          : (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={perfData} margin={{ top: 4, right: 8, bottom: 0, left: -22 }}>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false}
                  tickFormatter={d => { try { return format(parseISO(d), 'MMM d'); } catch { return d; } }} />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip formatter={(v, n) => [v, n]} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                {perfKeys.map(name => (
                  <Line
                    key={name}
                    type="monotone"
                    dataKey={name}
                    stroke={CAMP_COLORS[name] ?? 'hsl(0,0%,60%)'}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Activity + Campaign list */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-border/60">
          <CardHeader className="pb-1 pt-4 px-5 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold">Recent Activity</CardTitle>
            <Button asChild variant="ghost" size="sm" className="text-xs h-7 gap-1 text-muted-foreground">
              <Link to="/activity">View all <ArrowRight className="h-3 w-3" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            {!logs?.length
              ? <p className="text-sm text-muted-foreground py-6 text-center">No recent activity</p>
              : logs.map((log, i) => (
                <div key={log.id} className={`flex items-start gap-3 py-3 ${i < logs.length - 1 ? 'border-b border-border/40' : ''}`}>
                  <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground leading-snug">{log.description}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {log.userName} · {new Date(log.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            }
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-1 pt-4 px-5 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold">Campaign Summary</CardTitle>
            <Button asChild variant="ghost" size="sm" className="text-xs h-7 gap-1 text-muted-foreground">
              <Link to="/campaigns">View all <ArrowRight className="h-3 w-3" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            {loading
              ? <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-9 rounded-lg" />)}</div>
              : !filteredCampaigns.length
                ? <p className="text-sm text-muted-foreground py-6 text-center">No campaigns</p>
                : filteredCampaigns.slice(0, 6).map((c, i, arr) => (
                  <div key={c.id} className={`flex items-center justify-between py-3 ${i < arr.length - 1 ? 'border-b border-border/40' : ''}`}>
                    <div className="flex items-center gap-2 min-w-0">
                      <Badge className={`text-[10px] px-1.5 py-0 shrink-0 ${STATUS_COLORS[c.status] ?? ''}`}>{c.status}</Badge>
                      <span className="text-sm text-foreground truncate">{c.fullName}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-3">
                      <span className="text-xs text-muted-foreground tabular-nums">{c.claimed}/{c.total}</span>
                      <span className="text-xs font-bold text-primary tabular-nums w-10 text-right">{c.rate}%</span>
                    </div>
                  </div>
                ))
            }
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
