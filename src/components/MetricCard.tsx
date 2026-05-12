import { ReactNode, cloneElement, isValidElement } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

type ColorKey = 'green' | 'blue' | 'purple' | 'orange' | 'teal' | 'red';

const colorMap: Record<ColorKey, { iconBg: string; iconText: string; accent: string }> = {
  teal:   { iconBg: 'bg-teal-50   dark:bg-teal-950/40',   iconText: 'text-teal-600   dark:text-teal-400',   accent: 'bg-teal-500' },
  green:  { iconBg: 'bg-green-50  dark:bg-green-950/40',  iconText: 'text-green-600  dark:text-green-400',  accent: 'bg-green-500' },
  blue:   { iconBg: 'bg-blue-50   dark:bg-blue-950/40',   iconText: 'text-blue-600   dark:text-blue-400',   accent: 'bg-blue-500' },
  purple: { iconBg: 'bg-purple-50 dark:bg-purple-950/40', iconText: 'text-purple-600 dark:text-purple-400', accent: 'bg-purple-500' },
  orange: { iconBg: 'bg-orange-50 dark:bg-orange-950/40', iconText: 'text-orange-600 dark:text-orange-400', accent: 'bg-orange-500' },
  red:    { iconBg: 'bg-red-50    dark:bg-red-950/40',    iconText: 'text-red-600    dark:text-red-400',    accent: 'bg-red-500' },
};

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  color?: ColorKey;
  trend?: { value: number; positive?: boolean; neutral?: boolean };
  subtitle?: string;
  loading?: boolean;
  className?: string;
}

export function MetricCard({ title, value, icon, color = 'teal', trend, subtitle, loading, className }: MetricCardProps) {
  const c = colorMap[color];

  if (loading) {
    return (
      <Card className={cn('overflow-hidden', className)}>
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-10 w-10 rounded-lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const iconEl = isValidElement(icon)
    ? cloneElement(icon as React.ReactElement<{ className?: string }>, { className: 'h-5 w-5' })
    : icon;

  return (
    <Card className={cn('overflow-hidden hover:shadow-md transition-shadow duration-200 border-border/60', className)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0 space-y-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground truncate">
              {title}
            </p>
            <p className="text-3xl font-bold text-foreground tabular-nums leading-none pt-0.5">
              {value}
            </p>
            {trend && (
              <div className="flex items-center gap-1 pt-0.5">
                {trend.neutral ? (
                  <Minus className="h-3 w-3 text-muted-foreground" />
                ) : trend.positive ? (
                  <TrendingUp className="h-3 w-3 text-green-500" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-500" />
                )}
                <span className={cn(
                  'text-xs font-medium',
                  trend.neutral ? 'text-muted-foreground' :
                  trend.positive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                )}>
                  {trend.neutral ? 'No change' : `${trend.positive ? '+' : ''}${trend.value}% vs last period`}
                </span>
              </div>
            )}
            {subtitle && !trend && (
              <p className="text-xs text-muted-foreground pt-0.5">{subtitle}</p>
            )}
          </div>
          <div className={cn('h-11 w-11 rounded-xl flex items-center justify-center shrink-0', c.iconBg, c.iconText)}>
            {iconEl}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function MetricCardSkeleton() {
  return <MetricCard title="" value="" icon={<span />} loading />;
}
