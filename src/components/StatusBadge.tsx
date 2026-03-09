import { Badge } from '@/components/ui/badge';
import { CouponStatus } from '@/lib/types';

const statusStyles: Record<CouponStatus, string> = {
  uploaded: 'bg-secondary text-secondary-foreground',
  claimed: 'bg-accent text-accent-foreground',
  voided: 'bg-destructive/10 text-destructive',
};

export function StatusBadge({ status }: { status: CouponStatus }) {
  return (
    <Badge variant="secondary" className={`${statusStyles[status]} capitalize text-xs font-medium`}>
      {status}
    </Badge>
  );
}
