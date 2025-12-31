import { cn } from '@/lib/utils';

type StatusType = 'Active' | 'Paused' | 'Pending' | 'Accepted' | 'Rejected' | 'PickupScheduled' | 'InTransit' | 'Delivered' | 'Submitted' | 'InReview' | 'Paid' | 'APPROVED' | 'NOT_STARTED' | 'Sold';

interface StatusPillProps {
  status: StatusType;
  className?: string;
}

const statusStyles: Record<StatusType, string> = {
  Active: 'status-active',
  Paused: 'status-paused',
  Pending: 'status-pending',
  Accepted: 'bg-farm-info/20 text-farm-info border border-farm-info/30',
  Rejected: 'status-rejected',
  PickupScheduled: 'bg-farm-info/20 text-farm-info border border-farm-info/30',
  InTransit: 'bg-farm-warning/20 text-farm-warning border border-farm-warning/30',
  Delivered: 'status-delivered',
  Submitted: 'status-pending',
  InReview: 'bg-farm-info/20 text-farm-info border border-farm-info/30',
  Paid: 'status-delivered',
  APPROVED: 'status-delivered',
  NOT_STARTED: 'status-paused',
  Sold: 'status-delivered',
};

const statusLabels: Record<StatusType, string> = {
  Active: 'Active',
  Paused: 'Paused',
  Pending: 'Pending',
  Accepted: 'Accepted',
  Rejected: 'Rejected',
  PickupScheduled: 'Pickup Scheduled',
  InTransit: 'In Transit',
  Delivered: 'Delivered',
  Submitted: 'Submitted',
  InReview: 'In Review',
  Paid: 'Paid',
  APPROVED: 'Approved',
  NOT_STARTED: 'Not Started',
  Sold: 'Sold',
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
