import { AppNotification } from '@/types';
import { Bell } from 'lucide-react';
import { NotificationItem } from '@/components/notifications/NotificationItem';

interface NotificationDropdownProps {
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
  errorMessage?: string | null;
  onNotificationClick: (notification: AppNotification) => void;
  onMarkRead: (notification: AppNotification) => void;
  onMarkAllRead: () => void;
}

export const NotificationDropdown = ({
  notifications,
  unreadCount,
  loading,
  errorMessage,
  onNotificationClick,
  onMarkRead,
  onMarkAllRead,
}: NotificationDropdownProps) => (
  <div className="absolute right-0 top-12 w-[calc(100vw-2rem)] sm:w-96 bg-card border border-border rounded-xl shadow-2xl z-50 max-h-[calc(100vh-8rem)] overflow-hidden flex flex-col">
    <div className="p-4 border-b border-border flex items-center justify-between gap-3">
      <div>
        <h3 className="font-semibold text-foreground">Notifications</h3>
        {unreadCount > 0 && <p className="text-xs text-muted-foreground">{unreadCount} unread</p>}
      </div>
      {unreadCount > 0 && (
        <button
          type="button"
          onClick={onMarkAllRead}
          className="text-xs font-medium text-primary hover:underline"
        >
          Mark all as read
        </button>
      )}
    </div>

    <div className="overflow-y-auto">
      {loading ? (
        <div className="p-8 text-center">
          <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50 animate-pulse" />
          <p className="text-sm text-muted-foreground">Loading notifications...</p>
        </div>
      ) : errorMessage ? (
        <div className="p-6 text-center">
          <p className="text-sm font-medium text-foreground mb-1">Could not load notifications</p>
          <p className="text-xs text-muted-foreground">{errorMessage}</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="p-8 text-center">
          <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-sm text-muted-foreground">No notifications yet</p>
        </div>
      ) : (
        notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onClick={onNotificationClick}
            onMarkRead={onMarkRead}
          />
        ))
      )}
    </div>
  </div>
);
