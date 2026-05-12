import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Ticket, TrendingUp, LayoutGrid, ArrowRight, RefreshCw } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, LineChart, Line,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MetricCard } from '@/components/MetricCard';
import { useDashboardStats } from '@/hooks/useSupabaseData';
import { useQueryClient } from '@tanstack/react-query';

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

export default function DashboardPage() {
  const qc = useQueryClient();
  const [campaignFilter, setCampaignFilter] = useState('all');
  const [perfPeriod, setPerfPeriod] = useState<PerfPeriod>('daily');
  const [refreshing, setRefreshing] = useState(false);
  const { data: stats, loading, error } = useDashboardStats();
  const logs = stats?.recentLogs;

  const handleRefresh = async () => {
    setRefreshing(true);
    await qc.invalidateQueries();
    setTimeout(() => setRefreshing(false), 800);
  };

  const chartData = useMemo(() => {
    if (!stats) return null;
    if (campaignFilter === 'all') return stats;
    return { ...stats, byCampaign: stats.byCampaign.filter(c => c.id === campaignFilter) };
  }, [stats, campaignFilter]);

  const perfData = useMemo(() => {
    if (!stats?.dailyPerformance) return [];
    const raw = perfPeriod === 'weekly' ? toWeekly(stats.dailyPerformance) : stats.dailyPerformance;
    if (campaignFilter === 'all') return raw;
    return raw.map(row => {
      const camp = stats.byCampaign.find(c => c.id === campaignFilter);
      if (!camp) return row;
      return { date: row.date, [camp.fullName]: row[camp.fullName] ?? 0 };
    });
  }, [stats, campaignFilter, perfPeriod]);

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
        <div className="flex items-center gap-2">
          <Select value={campaignFilter} onValueChange={setCampaignFilter}>
            <SelectTrigger className="w-[180px] h-8 text-xs">
              <SelectValue placeholder="All Campaigns" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Campaigns</SelectItem>
              {stats?.byCampaign.map(c => <SelectItem key={c.id} value={c.id}>{c.fullName}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleRefresh}>
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
        <MetricCard loading={loading} title="Coupons Issued"   value={stats?.total ?? 0}            icon={<Ticket />}     color="green"  />
        <MetricCard loading={loading} title="Issue Rate"       value={`${stats?.claimRate ?? 0}%`}  icon={<TrendingUp />} color="purple" />
        <MetricCard loading={loading} title="Active Campaigns" value={stats?.activeCampaigns ?? 0}   icon={<LayoutGrid />} color="blue"   />
      </div>

      {/* Donut + Area charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="border-border/60">
          <CardHeader className="pb-1 pt-4 px-5">
            <CardTitle className="text-sm font-semibold">Coupon Status Distribution</CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-4">
            {loading ? <Skeleton className="h-[220px] rounded-xl" />
            : !stats?.total ? <EmptyChart label="No coupon data yet" />
            : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={stats.statusDistribution} cx="50%" cy="50%"
                    innerRadius={58} outerRadius={86} paddingAngle={3} dataKey="value">
                    {stats.statusDistribution.map((e, i) => (
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
            <CardTitle className="text-sm font-semibold">Daily Claims — Last 30 Days</CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-4">
            {loading ? <Skeleton className="h-[220px] rounded-xl" />
            : !stats?.dailyClaims.length ? <EmptyChart label="No claim activity yet" />
            : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={stats.dailyClaims} margin={{ top: 4, right: 4, bottom: 0, left: -22 }}>
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

      {/* Campaign Performance — daily / weekly trend */}
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
                  tickFormatter={d => { try { return format(parseISO(d), perfPeriod === 'weekly' ? 'MMM d' : 'MMM d'); } catch { return d; } }} />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip formatter={(v, n) => [v, n]} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                <Line type="monotone" dataKey="Holiday Songs" stroke="hsl(172,66%,38%)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                <Line type="monotone" dataKey="Songs"         stroke="hsl(215,70%,55%)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
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
              : !stats?.byCampaign.length
                ? <p className="text-sm text-muted-foreground py-6 text-center">No campaigns yet</p>
                : stats.byCampaign.slice(0, 6).map((c, i, arr) => (
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
