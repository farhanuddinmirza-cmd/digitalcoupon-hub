import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  trend?: { value: number; positive: boolean };
}

export function KpiCard({ title, value, subtitle, icon, trend }: KpiCardProps) {
  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
            {trend && (
              <p className={`text-xs font-medium ${trend.positive ? 'text-[hsl(var(--success))]' : 'text-destructive'}`}>
                {trend.positive ? '↑' : '↓'} {Math.abs(trend.value)}% vs last period
              </p>
            )}
          </div>
          <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center text-accent-foreground">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
