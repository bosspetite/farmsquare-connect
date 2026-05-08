import { cn } from '@/lib/utils';

type StatusType =
  | 'Draft'
  | 'Active'
  | 'Paused'
  | 'SoldOut'
  | 'Sold'
  | 'Archived'
  | 'Pending'
  | 'Accepted'
  | 'Rejected'
  | 'Processing'
  | 'PickupScheduled'
  | 'InTransit'
  | 'Delivered'
  | 'Disputed'
  | 'Cancelled'
  | 'Refunded'
  | 'Submitted'
  | 'InReview'
  | 'Paid'
  | 'APPROVED'
  | 'NOT_STARTED';

interface StatusPillProps {
  status: StatusType;
  className?: string;
}

const statusStyles: Record<StatusType, string> = {
  Draft: 'bg-muted text-muted-foreground border border-border',
  Active: 'status-active',
  Paused: 'status-paused',
  SoldOut: 'bg-farm-warning/20 text-farm-warning border border-farm-warning/30',
  Sold: 'status-delivered',
  Archived: 'bg-muted/50 text-muted-foreground border border-border',
  Pending: 'status-pending',
  Accepted: 'bg-farm-info/20 text-farm-info border border-farm-info/30',
  Rejected: 'status-rejected',
  Processing: 'bg-farm-info/20 text-farm-info border border-farm-info/30',
  PickupScheduled: 'bg-farm-info/20 text-farm-info border border-farm-info/30',
  InTransit: 'bg-farm-warning/20 text-farm-warning border border-farm-warning/30',
  Delivered: 'status-delivered',
  Disputed: 'bg-destructive/10 text-destructive border border-destructive/20',
  Cancelled: 'bg-muted text-muted-foreground border border-border',
  Refunded: 'bg-farm-warning/15 text-farm-warning border border-farm-warning/30',
  Submitted: 'status-pending',
  InReview: 'bg-farm-info/20 text-farm-info border border-farm-info/30',
  Paid: 'status-delivered',
  APPROVED: 'status-delivered',
  NOT_STARTED: 'status-paused',
};

const statusLabels: Record<StatusType, string> = {
  Draft: 'Draft',
  Active: 'Active',
  Paused: 'Paused',
  SoldOut: 'Sold Out',
  Sold: 'Sold',
  Archived: 'Archived',
  Pending: 'Pending',
  Accepted: 'Accepted',
  Rejected: 'Rejected',
  Processing: 'Processing',
  PickupScheduled: 'Ready for Pickup',
  InTransit: 'In Transit',
  Delivered: 'Delivered',
  Disputed: 'Disputed',
  Cancelled: 'Cancelled',
  Refunded: 'Refunded',
  Submitted: 'Submitted',
  InReview: 'In Review',
  Paid: 'Pending Farmer Acceptance',
  APPROVED: 'Approved',
  NOT_STARTED: 'Not Started',
};

export const StatusPill: React.FC<StatusPillProps> = ({ status, className }) => {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium',
        statusStyles[status] || 'status-paused',
        className
      )}
    >
      {statusLabels[status] || status}
    </span>
  );
};
