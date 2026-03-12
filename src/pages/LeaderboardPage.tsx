import { useState, useMemo } from 'react';
import { mockCampaigns, mockCoupons } from '@/lib/mock-data';
import { initialTeams, applicationIds } from '@/lib/team-data';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trophy, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface LeaderboardEntry {
  rank: number;
  campaignId: string;
  campaignName: string;
  applicationId: string;
  claimRate: number;
  totalClaimed: number;
  totalUploaded: number;
  trend: 'up' | 'down' | 'flat';
}

const trendIcon = {
  up: <TrendingUp className="h-4 w-4 text-[hsl(var(--success))]" />,
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
  const [appFilter, setAppFilter] = useState('all');
  const [teamFilter, setTeamFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const leaderboard = useMemo<LeaderboardEntry[]>(() => {
    // Build per-campaign metrics
    const entries = mockCampaigns.map((c, idx) => {
      const coupons = mockCoupons.filter(cp => cp.campaignId === c.id);
      const totalUploaded = coupons.length;
      const totalClaimed = coupons.filter(cp => cp.status === 'claimed').length;
      const claimRate = totalUploaded > 0 ? Math.round((totalClaimed / totalUploaded) * 100) : 0;
      // Assign mock application IDs based on campaign
      const applicationId = applicationIds[idx % applicationIds.length];
      // Mock trend
      const trends: Array<'up' | 'down' | 'flat'> = ['up', 'down', 'flat'];
      return {
        rank: 0,
        campaignId: c.id,
        campaignName: c.name,
        applicationId,
        claimRate,
        totalClaimed,
        totalUploaded,
        trend: trends[idx % 3],
      };
    });

    // Filter by app
    let filtered = appFilter === 'all' ? entries : entries.filter(e => e.applicationId === appFilter);

    // Filter by team - check if campaign's app matches team's app
    if (teamFilter !== 'all') {
      const team = initialTeams.find(t => t.id === teamFilter);
      if (team) {
        filtered = filtered.filter(e => e.applicationId === team.applicationId);
      }
    }

    // Sort by claim rate descending
    filtered.sort((a, b) => b.claimRate - a.claimRate || b.totalClaimed - a.totalClaimed);

    // Assign ranks
    return filtered.map((e, i) => ({ ...e, rank: i + 1 }));
  }, [appFilter, teamFilter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Trophy className="h-6 w-6 text-[hsl(var(--warning))]" />
          Campaign Leaderboard
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Rankings based on claim rate performance</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-end">
        <div className="space-y-1">
          <Label className="text-xs">Application ID</Label>
          <Select value={appFilter} onValueChange={setAppFilter}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Apps</SelectItem>
              {applicationIds.map(id => (
                <SelectItem key={id} value={id}>{id}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Team</Label>
          <Select value={teamFilter} onValueChange={setTeamFilter}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Teams</SelectItem>
              {initialTeams.map(t => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">From</Label>
          <Input type="date" className="w-40" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">To</Label>
          <Input type="date" className="w-40" value={dateTo} onChange={e => setDateTo(e.target.value)} />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">Rank</TableHead>
              <TableHead>Campaign</TableHead>
              <TableHead>Application ID</TableHead>
              <TableHead className="text-right">Claim Rate</TableHead>
              <TableHead className="text-right">Claimed / Uploaded</TableHead>
              <TableHead className="w-16 text-center">Trend</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leaderboard.map(entry => (
              <TableRow key={entry.campaignId} className={entry.rank <= 3 ? rankStyle(entry.rank) : ''}>
                <TableCell className="font-bold text-lg">{rankLabel(entry.rank)}</TableCell>
                <TableCell className="font-medium text-foreground">{entry.campaignName}</TableCell>
                <TableCell><Badge variant="secondary">{entry.applicationId}</Badge></TableCell>
                <TableCell className="text-right font-semibold text-foreground">{entry.claimRate}%</TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {entry.totalClaimed} / {entry.totalUploaded}
                </TableCell>
                <TableCell className="text-center">{trendIcon[entry.trend]}</TableCell>
              </TableRow>
            ))}
            {leaderboard.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No campaigns match the selected filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
