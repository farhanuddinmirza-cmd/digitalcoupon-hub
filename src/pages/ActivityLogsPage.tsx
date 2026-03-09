import { mockActivityLogs } from '@/lib/mock-data';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, Ticket, FileText, UserPlus, Shield } from 'lucide-react';
import { ReactNode } from 'react';

const actionIcons: Record<string, ReactNode> = {
  uploaded: <Upload className="h-4 w-4" />,
  claimed: <Ticket className="h-4 w-4" />,
  pdf_downloaded: <FileText className="h-4 w-4" />,
  user_created: <UserPlus className="h-4 w-4" />,
  role_changed: <Shield className="h-4 w-4" />,
};

const actionColors: Record<string, string> = {
  uploaded: 'bg-accent text-accent-foreground',
  claimed: 'bg-primary/10 text-primary',
  pdf_downloaded: 'bg-secondary text-secondary-foreground',
  user_created: 'bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]',
  role_changed: 'bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))]',
};

export default function ActivityLogsPage() {
  const sorted = [...mockActivityLogs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-foreground">Activity Logs</h1>
      <div className="space-y-3">
        {sorted.map(log => (
          <Card key={log.id} className="shadow-sm">
            <CardContent className="p-4 flex items-start gap-3">
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${actionColors[log.action]}`}>
                {actionIcons[log.action]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground">{log.description}</p>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">{new Date(log.timestamp).toLocaleString()}</span>
                  <span className="text-xs text-muted-foreground">·</span>
                  <span className="text-xs text-muted-foreground">{log.userName}</span>
                  {log.campaignName && (
                    <Badge variant="secondary" className="text-xs">{log.campaignName}</Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
