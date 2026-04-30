import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  FileText,
  Menu,
  LogOut,
  X,
  Settings,
  Truck,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { SignOutModal } from '@/components/ui/SignOutModal';
import logo from '@/assets/logo-web.png';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { AppNotification } from '@/types';
import { getNotificationsForUser, markAllNotificationsRead, markNotificationRead } from '@/services/notificationService';

interface AgentLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/agent/dashboard' },
  { icon: Users, label: 'Farmers', path: '/agent/farmers' },
  { icon: ClipboardCheck, label: 'Inspections', path: '/agent/inspections' },
  { icon: Truck, label: 'Deliveries', path: '/agent/deliveries' },
  { icon: FileText, label: 'Reports', path: '/agent/reports' },
];

export const AgentLayout: React.FC<AgentLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [showSignOutModal, setShowSignOutModal] = React.useState(false);
  const [notifications, setNotifications] = React.useState<AppNotification[]>([]);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [notificationError, setNotificationError] = useState<string | null>(null);

  const isActive = (path: string) => location.pathname.startsWith(path);

  useEffect(() => {
    let active = true;

    const loadNotifications = async () => {
      if (!user) {
        setNotifications([]);
        return;
      }

      try {
        setNotificationLoading(true);
        setNotificationError(null);
        const nextNotifications = await getNotificationsForUser(user.id, user.role);
        if (active) {
          setNotifications(nextNotifications);
        }
      } catch (error) {
        console.error('[AgentLayout] Failed to load notifications', error);
        if (active) {
          setNotifications([]);
          setNotificationError(error instanceof Error ? error.message : 'Failed to load notifications.');
        }
      } finally {
        if (active) {
          setNotificationLoading(false);
        }
      }
    };

    void loadNotifications();

    return () => {
      active = false;
    };
  }, [location.pathname, user]);

  const unreadCount = notifications.filter((notification) => !notification.isRead).length;

  const handleNotificationClick = async (notification: AppNotification) => {
    try {
      if (!notification.isRead) {
        await markNotificationRead(notification.id);
        setNotifications((current) =>
          current.map((item) => (item.id === notification.id ? { ...item, isRead: true } : item))
        );
      }

      if (notification.type.includes('KYC')) {
        navigate('/agent/farmers');
      } else if (notification.type.includes('DELIVERY')) {
        navigate('/agent/deliveries');
      } else {
        navigate('/agent/dashboard');
      }
    } catch (error) {
      console.error('[AgentLayout] Failed to open notification', error);
      setNotificationError(error instanceof Error ? error.message : 'Failed to open notification.');
    }
  };

  const handleMarkNotificationRead = async (notification: AppNotification) => {
    try {
      await markNotificationRead(notification.id);
      setNotifications((current) =>
        current.map((item) => (item.id === notification.id ? { ...item, isRead: true } : item))
      );
    } catch (error) {
      console.error('[AgentLayout] Failed to mark notification as read', error);
      setNotificationError(error instanceof Error ? error.message : 'Failed to update notification.');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead(user?.id, user?.role);
      setNotifications((current) => current.map((notification) => ({ ...notification, isRead: true })));
    } catch (error) {
      console.error('[AgentLayout] Failed to mark notifications as read', error);
      setNotificationError(error instanceof Error ? error.message : 'Failed to update notifications.');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-1 bg-card border-r border-border">
          <div className="px-6 py-5 border-b border-border">
            <button
              onClick={() => navigate('/agent/dashboard')}
              className="flex items-center gap-3 mb-1 hover:opacity-80 transition-opacity w-full text-left"
            >
              <img src={logo} alt="FarmSquare" className="w-10 h-10" />
              <span className="font-display font-bold text-lg text-foreground">FarmSquare</span>
            </button>
            <p className="text-xs text-muted-foreground ml-13">Field Agent</p>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive(item.path)
                    ? 'text-primary bg-muted border-l-2 border-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="p-4 border-t border-border mt-auto">
            <button
              onClick={() => setShowSignOutModal(true)}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-destructive hover:text-destructive-foreground hover:bg-destructive/10 transition-all border border-destructive/20"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-card border-r border-border animate-slide-in-right flex flex-col">
            <div className="flex items-center justify-between px-6 py-5 border-b border-border flex-shrink-0">
              <button
                onClick={() => {
                  navigate('/agent/dashboard');
                  setSidebarOpen(false);
                }}
                className="flex items-center gap-3 hover:opacity-80 transition-opacity"
              >
                <img src={logo} alt="FarmSquare" className="w-10 h-10" />
                <div>
                  <span className="font-display font-bold text-lg text-foreground block">FarmSquare</span>
                  <p className="text-xs text-muted-foreground">Field Agent</p>
                </div>
              </button>
              <button onClick={() => setSidebarOpen(false)} className="min-h-[44px] min-w-[44px] flex items-center justify-center">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <nav className="px-4 py-6 space-y-2 flex-1 overflow-y-auto pb-20">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all min-h-[44px]',
                    isActive(item.path)
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="p-4 border-t border-border bg-card sticky bottom-0 z-10 flex-shrink-0">
              <button
                onClick={() => setShowSignOutModal(true)}
                className="flex items-center justify-center gap-3 w-full px-4 py-4 rounded-xl text-sm font-semibold text-white bg-destructive hover:bg-destructive/90 transition-all min-h-[52px] active:scale-[0.98]"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
            </div>
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-40 flex items-center justify-between px-4 py-4 bg-background/95 backdrop-blur-sm border-b border-border lg:px-8">
          <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden w-10 h-10 rounded-xl bg-card flex items-center justify-center flex-shrink-0"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5 text-foreground" />
            </button>
            <button
              onClick={() => navigate('/agent/dashboard')}
              className="lg:hidden flex items-center gap-2 flex-shrink-0 hover:opacity-80 transition-opacity"
            >
              <img src={logo} alt="FarmSquare" className="w-8 h-8" />
            </button>
            <div className="hidden lg:block min-w-0">
              <p className="text-lg font-display font-semibold text-foreground truncate">
                Field Agent: {user?.name || 'Agent'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <NotificationBell
              notifications={notifications}
              unreadCount={unreadCount}
              loading={notificationLoading}
              errorMessage={notificationError}
              onNotificationClick={(notification) => void handleNotificationClick(notification)}
              onMarkRead={(notification) => void handleMarkNotificationRead(notification)}
              onMarkAllRead={() => void handleMarkAllRead()}
            />
            <button
              onClick={() => navigate('/agent/profile')}
              className="w-10 h-10 rounded-xl bg-card flex items-center justify-center hover:bg-muted transition-colors flex-shrink-0"
              aria-label="Settings"
            >
              <Settings className="w-5 h-5 text-foreground" />
            </button>
            <button
              onClick={() => setShowSignOutModal(true)}
              className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center hover:bg-destructive/20 transition-colors border border-destructive/20 flex-shrink-0"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="w-5 h-5 text-destructive" />
            </button>
          </div>
        </header>

        <main className="p-4 lg:p-8">{children}</main>
      </div>

      <SignOutModal
        isOpen={showSignOutModal}
        onClose={() => setShowSignOutModal(false)}
        onConfirm={async () => {
          await logout();
          navigate('/', { replace: true });
        }}
        userRole="agent"
      />
    </div>
  );
};
