import { AppNotification } from "@/types";
import { cn } from "@/lib/utils";
import {
    Bell,
    CheckCircle,
    CircleDollarSign,
    Clock3,
    Package,
    Shield,
    XCircle,
    ShoppingCart,
} from "lucide-react";
import {
    NOTIFICATION_CATEGORY_LABEL,
    getNotificationCategory,
} from "@/utils/notificationUtils";

interface NotificationItemProps {
    notification: AppNotification;
    onClick: (notification: AppNotification) => void;
    onMarkRead?: (notification: AppNotification) => void;
}

const getIcon = (type: string) => {
    const normalized = type.toLowerCase();

    if (
        normalized === "new_order" ||
        normalized === "order_status_updated" ||
        normalized === "order_accepted" ||
        normalized === "order_rejected" ||
        normalized === "order_completed"
    ) {
        return <ShoppingCart className="w-5 h-5 text-primary" />;
    }

    if (
        normalized === "payment_successful" ||
        normalized === "escrow_held" ||
        normalized === "escrow_released"
    ) {
        return <CircleDollarSign className="w-5 h-5 text-farm-success" />;
    }

    switch (type) {
        case "KYC_SUBMITTED":
            return <Shield className="w-5 h-5 text-farm-warning" />;
        case "KYC_APPROVED":
            return <CheckCircle className="w-5 h-5 text-farm-success" />;
        case "KYC_REJECTED":
            return <XCircle className="w-5 h-5 text-destructive" />;
        case "LISTING":
            return <Package className="w-5 h-5 text-primary" />;
        case "listing_published":
        case "listing_created":
            return <Package className="w-5 h-5 text-primary" />;
        case "withdrawal_requested":
        case "withdrawal_request":
        case "withdrawal_approved":
        case "withdrawal_rejected":
            return <Clock3 className="w-5 h-5 text-farm-warning" />;
        default:
            return <Bell className="w-5 h-5 text-primary" />;
    }
};

const getIconBackground = (type: string) => {
    const normalized = type.toLowerCase();

    if (
        normalized === "new_order" ||
        normalized === "order_status_updated" ||
        normalized === "order_accepted" ||
        normalized === "order_rejected" ||
        normalized === "order_completed"
    ) {
        return "bg-primary/10";
    }

    if (
        normalized === "payment_successful" ||
        normalized === "escrow_held" ||
        normalized === "escrow_released"
    ) {
        return "bg-farm-success/10";
    }

    switch (type) {
        case "KYC_SUBMITTED":
            return "bg-farm-warning/10";
        case "KYC_APPROVED":
            return "bg-farm-success/10";
        case "KYC_REJECTED":
            return "bg-destructive/10";
        case "LISTING":
            return "bg-primary/10";
        case "listing_published":
        case "listing_created":
            return "bg-primary/10";
        case "withdrawal_requested":
        case "withdrawal_request":
        case "withdrawal_approved":
        case "withdrawal_rejected":
            return "bg-farm-warning/10";
        default:
            return "bg-primary/10";
    }
};

export const NotificationItem = ({
    notification,
    onClick,
    onMarkRead,
}: NotificationItemProps) => {
    const category = getNotificationCategory(notification);

    return (
        <button
            type="button"
            onClick={() => onClick(notification)}
            className={cn(
                "w-full p-4 text-left border-b border-border hover:bg-muted/50 transition-colors",
                !notification.isRead && "bg-primary/5",
            )}
        >
            <div className="flex items-start gap-3">
                <div
                    className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                        getIconBackground(notification.type),
                    )}
                >
                    {getIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <p className="font-medium text-foreground text-sm">
                                    {notification.title}
                                </p>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground uppercase tracking-wide">
                                    {NOTIFICATION_CATEGORY_LABEL[category]}
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                                {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                {new Date(notification.createdAt).toLocaleString()}
                            </p>
                        </div>
                        {!notification.isRead && (
                            <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2" />
                        )}
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
};
