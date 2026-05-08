import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Users,
    Package,
    PlusCircle,
    Image as ImageIcon,
    ShoppingCart,
    Truck,
    CreditCard,
    FileText,
    Menu,
    LogOut,
    X,
    Settings,
    AlertCircle,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { SignOutModal } from "@/components/ui/SignOutModal";
import logo from "@/assets/logo-web.png";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { getKycRecordById } from "@/services/kycService";
import {
    getNotificationsForUser,
    markAllNotificationsRead,
    markNotificationRead,
    subscribeToNotifications,
} from "@/services/notificationService";
import { AppNotification } from "@/types";

interface AdminLayoutProps {
    children: React.ReactNode;
}

const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/admin/dashboard" },
    { icon: Users, label: "Users", path: "/admin/users" },
    { icon: Package, label: "Listings", path: "/admin/listings" },
    {
        icon: PlusCircle,
        label: "Create Listing",
        path: "/admin/create-listing",
    },
    { icon: ImageIcon, label: "Media Library", path: "/admin/media-library" },
    { icon: ShoppingCart, label: "Orders", path: "/admin/orders" },
    { icon: AlertCircle, label: "Disputes", path: "/admin/disputes" },
    { icon: Truck, label: "Logistics", path: "/admin/logistics" },
    { icon: CreditCard, label: "Payments", path: "/admin/payments" },
    { icon: FileText, label: "Reports", path: "/admin/reports" },
];

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [sidebarOpen, setSidebarOpen] = React.useState(false);
    const [showSignOutModal, setShowSignOutModal] = React.useState(false);
    const [notifications, setNotifications] = React.useState<AppNotification[]>(
        [],
    );
    const [notificationLoading, setNotificationLoading] = useState(false);
    const [notificationError, setNotificationError] = useState<string | null>(
        null,
    );

    const isActive = (path: string) => location.pathname.startsWith(path);

    useEffect(() => {
        let active = true;
        let intervalHandle: number | undefined;
        let unsubscribeRealtime: (() => void) | undefined;
        const extractErrorInfo = (error: unknown) => {
            if (!error || typeof error !== "object") {
                return {
                    message: String(error || ""),
                    code: undefined as string | undefined,
                    details: undefined as string | undefined,
                    hint: undefined as string | undefined,
                };
            }

            const e = error as Record<string, unknown>;
            return {
                message:
                    typeof e.message === "string"
                        ? e.message
                        : "Failed to load notifications.",
                code: typeof e.code === "string" ? e.code : undefined,
                details:
                    typeof e.details === "string" ? e.details : undefined,
                hint: typeof e.hint === "string" ? e.hint : undefined,
            };
        };

        const loadNotifications = async () => {
            try {
                setNotificationLoading(true);
                setNotificationError(null);
                console.log("[AdminLayout] Current auth user:", user);
                console.log("[AdminLayout] Current profile:", user);
                console.log(
                    "[AdminLayout] Fetching notifications for:",
                    user?.id || null,
                );
                const liveNotifications = await getNotificationsForUser(
                    user?.id,
                    user?.role,
                );
                if (!active) {
                    return;
                }
                console.log(
                    "[AdminLayout] Notification query result:",
                    liveNotifications,
                );
                setNotifications(liveNotifications);
            } catch (error) {
                const errInfo = extractErrorInfo(error);
                console.error(
                    "[AdminLayout] Notification query error:",
                    {
                        error,
                        message: errInfo.message,
                        code: errInfo.code,
                        details: errInfo.details,
                        hint: errInfo.hint,
                    },
                );
                if (active) {
                    setNotifications([]);
                    setNotificationError(errInfo.message);
                }
            } finally {
                if (active) {
                    setNotificationLoading(false);
                }
            }
        };

        if (user?.role === "admin") {
            void loadNotifications();
            unsubscribeRealtime = subscribeToNotifications(
                { userId: user.id, role: user.role },
                {
                    onNotification: (notification) => {
                        if (!active) {
                            return;
                        }
                        setNotifications((current) => {
                            const exists = current.some(
                                (item) => item.id === notification.id,
                            );
                            if (exists) {
                                return current.map((item) =>
                                    item.id === notification.id
                                        ? notification
                                        : item,
                                );
                            }
                            return [notification, ...current].sort(
                                (left, right) =>
                                    new Date(right.createdAt).getTime() -
                                    new Date(left.createdAt).getTime(),
                            );
                        });
                    },
                    onError: (error) => {
                        if (!active) {
                            return;
                        }
                        console.error(
                            "[AdminLayout] Notification realtime stream error",
                            error,
                        );
                    },
                },
            );
            intervalHandle = window.setInterval(() => {
                void loadNotifications();
            }, 60000);
        } else {
            setNotifications([]);
            setNotificationLoading(false);
            setNotificationError(null);
        }

        return () => {
            active = false;
            if (intervalHandle) {
                window.clearInterval(intervalHandle);
            }
            unsubscribeRealtime?.();
        };
    }, [location.pathname, user?.id, user?.role]);

    const unreadCount = notifications.filter(
        (notification) => !notification.isRead,
    ).length;

    const handleNotificationClick = async (notification: AppNotification) => {
        try {
            if (!notification.isRead) {
                await markNotificationRead(notification.id);
                setNotifications((current) =>
                    current.map((item) =>
                        item.id === notification.id
                            ? { ...item, isRead: true }
                            : item,
                    ),
                );
            }

            if (
                notification.entityType === "kyc_record" &&
                notification.entityId
            ) {
                const record = await getKycRecordById(notification.entityId);
                if (record?.userId) {
                    navigate(`/admin/users/${record.userId}/kyc`);
                    return;
                }
            }

            if (
                notification.entityType === "profile" &&
                notification.entityId
            ) {
                navigate(`/admin/users/${notification.entityId}/kyc`);
                return;
            }

            if (notification.type === "KYC_SUBMITTED") {
                navigate("/admin/users");
                return;
            }

            const notificationType = notification.type.toLowerCase();
            const targetOrderId =
                notification.relatedOrderId || notification.entityId;

            if (notification.linkUrl) {
                navigate(notification.linkUrl);
                return;
            }

            if (
                notification.entityType === "order" ||
                notificationType === "new_order" ||
                notificationType === "order_status_updated" ||
                notificationType === "payment_successful" ||
                notificationType === "order_accepted" ||
                notificationType === "order_rejected" ||
                notificationType === "order_completed" ||
                notificationType === "escrow_held" ||
                notificationType === "escrow_released"
            ) {
                if (targetOrderId) {
                    navigate("/admin/orders");
                    return;
                }
                navigate("/admin/orders");
                return;
            }

            if (
                notification.entityType === "listing" ||
                notificationType.includes("listing")
            ) {
                navigate("/admin/listings");
                return;
            }

            if (
                notification.entityType === "wallet" ||
                notificationType.includes("withdraw") ||
                notificationType.includes("escrow") ||
                notificationType.includes("payment")
            ) {
                navigate("/admin/payments");
                return;
            }
        } catch (error) {
            console.error("[AdminLayout] Failed to open notification", error);
            setNotificationError(
                error instanceof Error
                    ? error.message
                    : "Failed to open notification.",
            );
        }
    };

    const handleMarkNotificationRead = async (
        notification: AppNotification,
    ) => {
        try {
            await markNotificationRead(notification.id);
            setNotifications((current) =>
                current.map((item) =>
                    item.id === notification.id
                        ? { ...item, isRead: true }
                        : item,
                ),
            );
        } catch (error) {
            console.error(
                "[AdminLayout] Failed to mark notification as read",
                error,
            );
            setNotificationError(
                error instanceof Error
                    ? error.message
                    : "Failed to update notification.",
            );
        }
    };

    const handleMarkAllNotificationsRead = async () => {
        try {
            await markAllNotificationsRead(user?.id, user?.role);
            setNotifications((current) =>
                current.map((notification) => ({
                    ...notification,
                    isRead: true,
                })),
            );
        } catch (error) {
            console.error(
                "[AdminLayout] Failed to mark all notifications as read",
                error,
            );
            setNotificationError(
                error instanceof Error
                    ? error.message
                    : "Failed to update notifications.",
            );
        }
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
                <div className="flex flex-col flex-1 bg-card border-r border-border">
                    <div className="px-6 py-5 border-b border-border">
                        <div className="flex items-center gap-3 mb-1">
                            <img
                                src={logo}
                                alt="FarmSquare"
                                className="w-10 h-10"
                            />
                            <span className="font-display font-bold text-lg text-foreground">
                                FarmSquare
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground ml-13">
                            Admin
                        </p>
                    </div>

                    <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                        {navItems.map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors",
                                    isActive(item.path)
                                        ? "text-primary bg-muted border-l-2 border-primary"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
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
                    <aside className="absolute left-0 top-0 bottom-0 w-64 bg-card border-r border-border animate-slide-in-right flex flex-col">
                        <div className="flex items-center justify-between px-6 py-5 border-b border-border flex-shrink-0">
                            <button
                                onClick={() => {
                                    navigate("/admin/dashboard");
                                    setSidebarOpen(false);
                                }}
                                className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                            >
                                <img
                                    src={logo}
                                    alt="FarmSquare"
                                    className="w-10 h-10"
                                />
                                <div>
                                    <span className="font-display font-bold text-lg text-foreground block">
                                        FarmSquare
                                    </span>
                                    <p className="text-xs text-muted-foreground">
                                        Admin
                                    </p>
                                </div>
                            </button>
                            <button
                                onClick={() => setSidebarOpen(false)}
                                className="min-h-[44px] min-w-[44px] flex items-center justify-center"
                            >
                                <X className="w-5 h-5 text-muted-foreground" />
                            </button>
                        </div>

                        <nav className="px-4 py-6 space-y-1 flex-1 overflow-y-auto pb-20">
                            {navItems.map((item) => (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setSidebarOpen(false)}
                                    className={cn(
                                        "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all min-h-[44px]",
                                        isActive(item.path)
                                            ? "bg-primary text-primary-foreground"
                                            : "text-muted-foreground hover:text-foreground hover:bg-muted",
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

            {/* Main Content */}
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
                            onClick={() => navigate("/admin/dashboard")}
                            className="lg:hidden flex items-center gap-2 flex-shrink-0 hover:opacity-80 transition-opacity"
                        >
                            <img
                                src={logo}
                                alt="FarmSquare"
                                className="w-8 h-8"
                            />
                        </button>
                        <div className="hidden lg:block min-w-0">
                            <p className="text-lg font-display font-semibold text-foreground truncate">
                                Admin Dashboard
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                        <NotificationBell
                            notifications={notifications}
                            unreadCount={unreadCount}
                            loading={notificationLoading}
                            errorMessage={notificationError}
                            onNotificationClick={(notification) =>
                                void handleNotificationClick(notification)
                            }
                            onMarkRead={(notification) =>
                                void handleMarkNotificationRead(notification)
                            }
                            onMarkAllRead={() =>
                                void handleMarkAllNotificationsRead()
                            }
                        />
                        <button
                            onClick={() => navigate("/admin/profile")}
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

                {/* Sign Out Modal */}
                <SignOutModal
                    isOpen={showSignOutModal}
                    onClose={() => setShowSignOutModal(false)}
                    onConfirm={async () => {
                        await logout();
                    }}
                    userName={user?.name}
                />

                <main className="px-4 py-6 lg:px-8">{children}</main>
            </div>
        </div>
    );
};
