import { useState, useMemo } from 'react';
import { useActivityLogs } from '@/hooks/useSupabaseData';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Ticket, FileText, UserPlus, Shield, Activity, Search } from 'lucide-react';
import { format } from 'date-fns';

const ACTION_META: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  uploaded:       { icon: Upload,   color: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400',     label: 'Uploaded' },
  claimed:        { icon: Ticket,   color: 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400', label: 'Claimed' },
  pdf_downloaded: { icon: FileText, color: 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400', label: 'PDF' },
  user_created:   { icon: UserPlus, color: 'bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400',     label: 'User' },
  role_changed:   { icon: Shield,   color: 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400', label: 'Role' },
};

const DEFAULT_META = { icon: Activity, color: 'bg-muted text-muted-foreground', label: 'Event' };

function groupByDate(logs: any[]) {
  const groups: Record<string, any[]> = {};
  for (const log of logs) {
    const key = format(new Date(log.timestamp), 'yyyy-MM-dd');
    (groups[key] ??= []).push(log);
  }
  return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
}

function formatGroupHeader(dateStr: string) {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return format(d, 'MMMM d, yyyy');
}

const CAMPAIGNS = [
  { id: 'all',           name: 'All Campaigns' },
  { id: 'holiday-songs', name: 'Holiday Songs' },
  { id: 'songs',         name: 'Songs' },
  { id: 'uploads',       name: 'Uploads' },
  { id: 'poses',         name: 'Poses' },
];

export default function ActivityLogsPage() {
  const [search, setSearch]         = useState('');
  const [actionFilter, setAction]   = useState('all');
  const [campaignFilter, setCampaign] = useState('all');

  const { data: logs, loading } = useActivityLogs(undefined, 1500);

  const sorted = useMemo(() =>
    [...(logs ?? [])].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    [logs]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return sorted.filter(log => {
      const matchSearch =
        log.description.toLowerCase().includes(q) ||
        log.userName.toLowerCase().includes(q) ||
        (log.campaignName && log.campaignName.toLowerCase().includes(q));
      const matchAction   = actionFilter   === 'all' || log.action     === actionFilter;
      const matchCampaign = campaignFilter === 'all' || log.campaignId === campaignFilter;
      return matchSearch && matchAction && matchCampaign;
    });
  }, [sorted, search, actionFilter, campaignFilter]);

  const groups = useMemo(() => groupByDate(filtered), [filtered]);

  // Summary counts per campaign
  const summary = useMemo(() => {
    return CAMPAIGNS.slice(1).map(c => ({
      ...c,
      count: sorted.filter(l => l.campaignId === c.id).length,
    }));
  }, [sorted]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">Activity Logs</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{filtered.length} event{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search logs…"
              className="pl-8 h-8 text-xs w-full sm:w-[180px]"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <Select value={campaignFilter} onValueChange={setCampaign}>
            <SelectTrigger className="h-8 text-xs w-[160px]">
              <SelectValue placeholder="All Campaigns" />
            </SelectTrigger>
            <SelectContent>
              {CAMPAIGNS.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={actionFilter} onValueChange={setAction}>
            <SelectTrigger className="h-8 text-xs w-[140px]">
              <SelectValue placeholder="All Actions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="uploaded">Uploaded</SelectItem>
              <SelectItem value="claimed">Claimed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Campaign summary pills */}
      {!loading && (
        <div className="flex flex-wrap gap-2">
          {summary.map(c => (
            <button
              key={c.id}
              onClick={() => setCampaign(campaignFilter === c.id ? 'all' : c.id)}
              className={`flex items-center gap-1.5 text-xs rounded-full px-3 py-1 border transition-colors ${campaignFilter === c.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/40 text-muted-foreground border-border/40 hover:bg-muted/70'}`}
            >
              <span className="font-bold">{c.count}</span>
              <span>{c.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Timeline */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
              <div className="flex-1 space-y-1.5 pt-1">
                <Skeleton className="h-3.5 w-3/4 rounded" />
                <Skeleton className="h-3 w-1/3 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-3 text-center">
          <div className="h-12 w-12 rounded-full bg-muted/60 flex items-center justify-center">
            <Activity className="h-5 w-5 opacity-40" />
          </div>
          <p className="text-sm text-muted-foreground">No activity found</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map(([dateKey, dayLogs]) => (
            <div key={dateKey}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  {formatGroupHeader(dateKey)}
                </span>
                <div className="flex-1 h-px bg-border/50" />
                <span className="text-xs text-muted-foreground">{dayLogs.length}</span>
              </div>

              <div className="space-y-1">
                {dayLogs.map(log => {
                  const meta = ACTION_META[log.action] ?? DEFAULT_META;
                  const Icon = meta.icon;
                  return (
                    <div key={log.id} className="flex items-start gap-3 rounded-lg px-3 py-2.5 hover:bg-muted/30 transition-colors">
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${meta.color}`}>
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground leading-snug">{log.description}</p>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(log.timestamp), 'h:mm a')}
                          </span>
                          <span className="text-xs text-muted-foreground">·</span>
                          <span className="text-xs text-muted-foreground">{log.userName}</span>
                          {log.campaignName && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 border-0">
                              {log.campaignName}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
