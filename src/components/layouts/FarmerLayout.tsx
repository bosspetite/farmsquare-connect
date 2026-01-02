import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  Home, 
  Package, 
  ShoppingCart, 
  Wallet, 
  User,
  Menu,
  Bell,
  LogOut,
  X
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import logo from '@/assets/logo.png';

interface FarmerLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { icon: Home, label: 'Home', path: '/farmer/dashboard' },
  { icon: Package, label: 'Inventory', path: '/farmer/listings' },
  { icon: ShoppingCart, label: 'Orders', path: '/farmer/orders' },
  { icon: Wallet, label: 'Wallet', path: '/farmer/wallet' },
  { icon: User, label: 'Profile', path: '/farmer/profile' },
];

export const FarmerLayout: React.FC<FarmerLayoutProps> = ({ children }) => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-1 bg-card border-r border-border">
          <div className="flex items-center gap-3 px-6 py-5 border-b border-border">
            <img src={logo} alt="FarmSquare" className="w-10 h-10" />
            <span className="font-display font-bold text-lg text-foreground">FarmSquare</span>
          </div>
          
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
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
          
          <div className="p-4 border-t border-border">
            <button
              onClick={() => {
                logout();
                window.location.href = '/';
              }}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
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
                <span className="font-display font-bold text-lg text-foreground">FarmSquare</span>
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
            
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
              <button
                onClick={() => {
                  logout();
                  window.location.href = '/';
                }}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Top Bar */}
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
                Welcome back, {user?.name?.split(' ')[0] || 'Farmer'} 🚜
              </p>
            </div>
          </div>
          
          <button className="relative w-10 h-10 rounded-xl bg-card flex items-center justify-center">
            <Bell className="w-5 h-5 text-foreground" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full" />
          </button>
        </header>

        {/* Page Content */}
        <main className="px-4 py-6 lg:px-8 pb-24 lg:pb-8">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="bottom-nav lg:hidden">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all',
                isActive(item.path)
                  ? 'text-primary'
                  : 'text-muted-foreground'
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
};
