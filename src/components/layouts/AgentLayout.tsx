import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Users, 
  ClipboardCheck, 
  FileText,
  Menu,
  Bell,
  LogOut,
  X,
  Package,
  AlertCircle,
  CheckCircle,
  Settings
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getAppState } from '@/lib/store';
import { SignOutModal } from '@/components/ui/SignOutModal';
import logo from '@/assets/logo.png';

interface AgentLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/agent/dashboard' },
  { icon: Users, label: 'Farmers', path: '/agent/farmers' },
  { icon: ClipboardCheck, label: 'Inspections', path: '/agent/inspections' },
  { icon: FileText, label: 'Reports', path: '/agent/reports' },
];

export const AgentLayout: React.FC<AgentLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [notificationOpen, setNotificationOpen] = React.useState(false);
  const [showSignOutModal, setShowSignOutModal] = React.useState(false);
  const [notifications, setNotifications] = React.useState<Array<{
    id: string;
    type: 'inspection' | 'order' | 'farmer';
    title: string;
    message: string;
    timestamp: string;
    read: boolean;
    link?: string;
  }>>([]);

  const isActive = (path: string) => location.pathname.startsWith(path);

  // Generate notifications
  useEffect(() => {
    const state = getAppState();
    const newNotifications: typeof notifications = [];
    
    // Check for pending orders that need inspection
    const pendingOrders = state.orders.filter(o => o.status === 'Pending' || o.status === 'Accepted');
    if (pendingOrders.length > 0) {
      newNotifications.push({
        id: 'pending_inspections',
        type: 'inspection',
        title: `${pendingOrders.length} Order${pendingOrders.length > 1 ? 's' : ''} Need Inspection`,
        message: `${pendingOrders.length} order${pendingOrders.length > 1 ? 's' : ''} awaiting quality verification`,
        timestamp: new Date().toISOString(),
        read: false,
        link: '/agent/inspections'
      });
    }

    // Check for orders ready for delivery verification
    const readyForDelivery = state.orders.filter(o => o.status === 'InTransit' || o.status === 'PickupScheduled');
    if (readyForDelivery.length > 0) {
      newNotifications.push({
        id: 'ready_delivery',
        type: 'order',
        title: `${readyForDelivery.length} Order${readyForDelivery.length > 1 ? 's' : ''} Ready for Verification`,
        message: `${readyForDelivery.length} order${readyForDelivery.length > 1 ? 's' : ''} ready for delivery verification`,
        timestamp: new Date().toISOString(),
        read: false,
        link: '/agent/inspections'
      });
    }

    setNotifications(newNotifications);
  }, [location.pathname]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleNotificationClick = (notification: typeof notifications[0]) => {
    if (notification.link) {
      navigate(notification.link);
      setNotificationOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-1 bg-card border-r border-border">
          <div className="px-6 py-5 border-b border-border">
            <div className="flex items-center gap-3 mb-1">
              <img src={logo} alt="FarmSquare" className="w-10 h-10" />
              <span className="font-display font-bold text-lg text-foreground">FarmSquare</span>
            </div>
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

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-card border-r border-border animate-slide-in-right">
            <div className="flex items-center justify-between px-6 py-5 border-b border-border">
              <div className="flex items-center gap-3">
                <img src={logo} alt="FarmSquare" className="w-10 h-10" />
                <div>
                  <span className="font-display font-bold text-lg text-foreground block">FarmSquare</span>
                  <p className="text-xs text-muted-foreground">Field Agent</p>
                </div>
              </div>
              <button onClick={() => setSidebarOpen(false)}>
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            
            <nav className="px-4 py-6 space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all',
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
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-40 flex items-center justify-between px-4 py-4 bg-background/95 backdrop-blur-sm border-b border-border lg:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden w-10 h-10 rounded-xl bg-card flex items-center justify-center"
            >
              <Menu className="w-5 h-5 text-foreground" />
            </button>
            <div className="lg:hidden flex items-center gap-2">
              <img src={logo} alt="FarmSquare" className="w-8 h-8" />
            </div>
            <div className="hidden lg:block">
              <p className="text-lg font-display font-semibold text-foreground">
                Field Agent: {user?.name || 'Agent'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="relative">
              <button 
                onClick={() => setNotificationOpen(!notificationOpen)}
                className="relative w-10 h-10 rounded-xl bg-card flex items-center justify-center hover:bg-muted transition-colors"
              >
                <Bell className="w-5 h-5 text-foreground" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-5 h-5 bg-primary text-white rounded-full text-xs font-bold flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              
              {/* Notification Dropdown */}
              {notificationOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setNotificationOpen(false)}
                  />
                  <div className="absolute right-0 top-12 w-80 bg-card border border-border rounded-xl shadow-2xl z-50 max-h-[500px] overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-border flex items-center justify-between">
                      <h3 className="font-semibold text-foreground">Notifications</h3>
                      {unreadCount > 0 && (
                        <span className="text-xs text-muted-foreground">{unreadCount} new</span>
                      )}
                    </div>
                    <div className="overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center">
                          <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                          <p className="text-sm text-muted-foreground">No notifications</p>
                        </div>
                      ) : (
                        notifications.map((notification) => (
                          <button
                            key={notification.id}
                            onClick={() => handleNotificationClick(notification)}
                            className={cn(
                              "w-full p-4 text-left border-b border-border hover:bg-muted/50 transition-colors",
                              !notification.read && "bg-primary/5"
                            )}
                          >
                            <div className="flex items-start gap-3">
                              <div className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                                notification.type === 'inspection' && "bg-farm-warning/10",
                                notification.type === 'order' && "bg-farm-info/10",
                                notification.type === 'farmer' && "bg-primary/10"
                              )}>
                                {notification.type === 'inspection' && <ClipboardCheck className="w-5 h-5 text-farm-warning" />}
                                {notification.type === 'order' && <Package className="w-5 h-5 text-farm-info" />}
                                {notification.type === 'farmer' && <Users className="w-5 h-5 text-primary" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-foreground text-sm mb-1">{notification.title}</p>
                                <p className="text-xs text-muted-foreground line-clamp-2">{notification.message}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {new Date(notification.timestamp).toLocaleDateString()}
                                </p>
                              </div>
                              {!notification.read && (
                                <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2" />
                              )}
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
            <button 
              onClick={() => navigate('/agent/profile')}
              className="w-10 h-10 rounded-xl bg-card flex items-center justify-center hover:bg-muted transition-colors"
            >
              <Settings className="w-5 h-5 text-foreground" />
            </button>
            <button 
              onClick={() => setShowSignOutModal(true)}
              className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center hover:bg-destructive/20 transition-colors border border-destructive/20"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5 text-destructive" />
            </button>
          </div>
        </header>

        {/* Sign Out Modal */}
        <SignOutModal
          isOpen={showSignOutModal}
          onClose={() => setShowSignOutModal(false)}
          onConfirm={() => {
            logout();
            window.location.href = '/';
          }}
          userName={user?.name}
        />

        <main className="px-4 py-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
};
