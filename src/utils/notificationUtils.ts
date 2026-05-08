import { AppNotification } from "@/types";

export type NotificationCategory =
    | "all"
    | "orders"
    | "payments"
    | "escrow"
    | "withdrawals"
    | "kyc"
    | "listings"
    | "logistics"
    | "wallet"
    | "system";

export const NOTIFICATION_CATEGORY_LABEL: Record<NotificationCategory, string> = {
    all: "All",
    orders: "Orders",
    payments: "Payments",
    escrow: "Escrow",
    withdrawals: "Withdrawals",
    kyc: "KYC",
    listings: "Listings",
    logistics: "Logistics",
    wallet: "Wallet",
    system: "System",
};

export const getNotificationCategory = (
    notification: Pick<AppNotification, "type" | "entityType">,
): NotificationCategory => {
    const type = notification.type.toLowerCase();
    const entityType = (notification.entityType || "").toLowerCase();

    if (type.includes("withdraw")) {
        return "withdrawals";
    }

    if (type.includes("escrow") || type.includes("release")) {
        return "escrow";
    }

    if (type.includes("payment") || entityType === "payment") {
        return "payments";
    }

    if (
        type.includes("order") ||
        entityType === "order" ||
        type === "new_order"
    ) {
        return "orders";
    }

    if (type.includes("kyc") || entityType === "kyc_record") {
        return "kyc";
    }

    if (type.includes("listing") || entityType === "listing" || entityType === "product") {
        return "listings";
    }

    if (
        type.includes("logistics") ||
        type.includes("transit") ||
        type.includes("delivery")
    ) {
        return "logistics";
    }

    if (entityType === "wallet" || type.includes("wallet")) {
        return "wallet";
    }

    return "system";
};
