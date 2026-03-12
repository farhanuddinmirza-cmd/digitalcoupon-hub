import { useMemo } from 'react';
import { mockCampaigns, mockCoupons } from '@/lib/mock-data';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Trophy, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface LeaderboardEntry {
  rank: number;
  campaignName: string;
  claimRate: number;
  totalClaimed: number;
  totalUploaded: number;
  trend: 'up' | 'down' | 'flat';
}

const trendIcon = {
  up: <TrendingUp className="h-4 w-4 text-accent-foreground" />,
  down: <TrendingDown className="h-4 w-4 text-destructive" />,
  flat: <Minus className="h-4 w-4 text-muted-foreground" />,
};

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
  const leaderboard = useMemo<LeaderboardEntry[]>(() => {
    const trends: Array<'up' | 'down' | 'flat'> = ['up', 'down', 'flat'];
    const entries = mockCampaigns.map((c, idx) => {
      const coupons = mockCoupons.filter(cp => cp.campaignId === c.id);
      const totalUploaded = coupons.length;
      const totalClaimed = coupons.filter(cp => cp.status === 'claimed').length;
      const claimRate = totalUploaded > 0 ? Math.round((totalClaimed / totalUploaded) * 100) : 0;
      return {
        rank: 0,
        campaignName: c.name,
        claimRate,
        totalClaimed,
        totalUploaded,
        trend: trends[idx % 3],
      };
    });

    entries.sort((a, b) => b.claimRate - a.claimRate || b.totalClaimed - a.totalClaimed);
    return entries.map((e, i) => ({ ...e, rank: i + 1 }));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Trophy className="h-6 w-6 text-primary" />
          Campaign Leaderboard
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Rankings based on claim rate performance</p>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">Rank</TableHead>
              <TableHead>Campaign</TableHead>
              <TableHead className="text-right">Claim Rate</TableHead>
              <TableHead className="text-right">Claimed / Uploaded</TableHead>
              <TableHead className="w-16 text-center">Trend</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leaderboard.map(entry => (
              <TableRow key={entry.campaignName} className={entry.rank <= 3 ? rankStyle(entry.rank) : ''}>
                <TableCell className="font-bold text-lg">{rankLabel(entry.rank)}</TableCell>
                <TableCell className="font-medium text-foreground">{entry.campaignName}</TableCell>
                <TableCell className="text-right font-semibold text-foreground">{entry.claimRate}%</TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {entry.totalClaimed} / {entry.totalUploaded}
                </TableCell>
                <TableCell className="text-center">{trendIcon[entry.trend]}</TableCell>
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
      </div>
    </div>
  );
}
