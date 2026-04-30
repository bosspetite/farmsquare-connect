import { AppNotification } from '@/types';
import { cn } from '@/lib/utils';
import { Bell, CheckCircle, Package, Shield, XCircle } from 'lucide-react';

interface NotificationItemProps {
  notification: AppNotification;
  onClick: (notification: AppNotification) => void;
  onMarkRead?: (notification: AppNotification) => void;
}

const getIcon = (type: string) => {
  switch (type) {
    case 'KYC_SUBMITTED':
      return <Shield className="w-5 h-5 text-farm-warning" />;
    case 'KYC_APPROVED':
      return <CheckCircle className="w-5 h-5 text-farm-success" />;
    case 'KYC_REJECTED':
      return <XCircle className="w-5 h-5 text-destructive" />;
    case 'LISTING':
      return <Package className="w-5 h-5 text-primary" />;
    default:
      return <Bell className="w-5 h-5 text-primary" />;
  }
};

const getIconBackground = (type: string) => {
  switch (type) {
    case 'KYC_SUBMITTED':
      return 'bg-farm-warning/10';
    case 'KYC_APPROVED':
      return 'bg-farm-success/10';
    case 'KYC_REJECTED':
      return 'bg-destructive/10';
    case 'LISTING':
      return 'bg-primary/10';
    default:
      return 'bg-primary/10';
  }
};

export const NotificationItem = ({ notification, onClick, onMarkRead }: NotificationItemProps) => (
  <button
    type="button"
    onClick={() => onClick(notification)}
    className={cn(
      'w-full p-4 text-left border-b border-border hover:bg-muted/50 transition-colors',
      !notification.isRead && 'bg-primary/5'
    )}
  >
    <div className="flex items-start gap-3">
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', getIconBackground(notification.type))}>
        {getIcon(notification.type)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-medium text-foreground text-sm mb-1">{notification.title}</p>
            <p className="text-xs text-muted-foreground line-clamp-2">{notification.message}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {new Date(notification.createdAt).toLocaleString()}
            </p>
          </div>
          {!notification.isRead && <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2" />}
        </div>
        {!notification.isRead && onMarkRead && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onMarkRead(notification);
            }}
            className="mt-3 text-xs font-medium text-primary hover:underline"
          >
            Mark as read
          </button>
        )}
      </div>
    </div>
  </button>
);
