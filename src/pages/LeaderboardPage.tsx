import { useMemo } from 'react';
import { useAnalytics } from '@/hooks/use-analytics';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Trophy } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface LeaderboardEntry {
  rank: number;
  campaignName: string;
  downloadRate: number;
  totalLogins: number;
  totalDownloads: number;
}

const rankStyle = (rank: number) => {
  if (rank === 1) return 'bg-[hsl(45,93%,47%)/0.15] text-[hsl(45,93%,37%)] border-[hsl(45,93%,47%)/0.3]';
  if (rank === 2) return 'bg-[hsl(0,0%,70%)/0.15] text-[hsl(0,0%,45%)] border-[hsl(0,0%,70%)/0.3]';
  if (rank === 3) return 'bg-[hsl(25,60%,50%)/0.15] text-[hsl(25,60%,35%)] border-[hsl(25,60%,50%)/0.3]';
  return '';
};

const rankLabel = (rank: number) => {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return `#${rank}`;
};

export default function LeaderboardPage() {
  const { data, isLoading, error } = useAnalytics();

  const leaderboard = useMemo<LeaderboardEntry[]>(() => {
    if (!data) return [];
    const entries = data.breakdownByCampaign.map(c => ({
      rank: 0,
      campaignName: c.campaign,
      downloadRate: c.totalLogins > 0 ? Math.round((c.totalDownloads / c.totalLogins) * 100) : 0,
      totalLogins: c.totalLogins,
      totalDownloads: c.totalDownloads,
    }));
    entries.sort((a, b) => b.downloadRate - a.downloadRate || b.totalDownloads - a.totalDownloads);
    return entries.map((e, i) => ({ ...e, rank: i + 1 }));
  }, [data]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-destructive">Failed to load leaderboard data.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Trophy className="h-6 w-6 text-primary" />
          Campaign Leaderboard
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Rankings based on download rate performance</p>
      </div>

      <div className="rounded-lg border bg-card">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded" />
            ))}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20 text-center">Rank</TableHead>
                <TableHead className="text-center">Campaign</TableHead>
                <TableHead className="text-center">Download Rate</TableHead>
                <TableHead className="text-center">Total Logins</TableHead>
                <TableHead className="text-center">Total Downloads</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaderboard.map(entry => (
                <TableRow key={entry.campaignName} className={entry.rank <= 3 ? rankStyle(entry.rank) : ''}>
                  <TableCell className="font-bold text-lg text-center">{rankLabel(entry.rank)}</TableCell>
                  <TableCell className="font-medium text-foreground text-center">{entry.campaignName}</TableCell>
                  <TableCell className="font-semibold text-foreground text-center">{entry.downloadRate}%</TableCell>
                  <TableCell className="text-muted-foreground text-center">{entry.totalLogins}</TableCell>
                  <TableCell className="text-muted-foreground text-center">{entry.totalDownloads}</TableCell>
                </TableRow>
              ))}
              {leaderboard.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No campaigns found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
