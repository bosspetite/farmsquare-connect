import { useState } from 'react';
import { Bell } from 'lucide-react';
import { AppNotification } from '@/types';
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown';

interface NotificationBellProps {
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
  errorMessage?: string | null;
  onNotificationClick: (notification: AppNotification) => void;
  onMarkRead: (notification: AppNotification) => void;
  onMarkAllRead: () => void;
}

export const NotificationBell = ({
  notifications,
  unreadCount,
  loading,
  errorMessage,
  onNotificationClick,
  onMarkRead,
  onMarkAllRead,
}: NotificationBellProps) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="relative w-10 h-10 rounded-xl bg-card flex items-center justify-center hover:bg-muted transition-colors flex-shrink-0"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-foreground" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[1.25rem] h-5 px-1 bg-destructive text-white rounded-full text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <NotificationDropdown
            notifications={notifications}
            unreadCount={unreadCount}
            loading={loading}
            errorMessage={errorMessage}
            onNotificationClick={(notification) => {
              onNotificationClick(notification);
              setOpen(false);
            }}
            onMarkRead={onMarkRead}
            onMarkAllRead={() => {
              onMarkAllRead();
              setOpen(false);
            }}
          />
        </>
      )}
    </div>
  );
};
