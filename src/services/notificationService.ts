import { AppNotification, UserRole } from "@/types";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";

interface NotificationRow {
    id: string;
    recipient_role: UserRole | null;
    recipient_user_id: string | null;
    type: string;
    title: string;
    message: string;
    entity_type: string | null;
    entity_id: string | null;
    related_order_id?: string | null;
    related_product_id?: string | null;
    is_read: boolean;
    created_at: string;
}

interface NotificationRealtimePayload {
    new?: Partial<NotificationRow> | null;
}

interface CreateNotificationInput {
    recipientRole?: UserRole | null;
    recipientUserId?: string | null;
    type: string;
    title: string;
    message: string;
    entityType?: string | null;
    entityId?: string | null;
    relatedOrderId?: string | null;
    relatedProductId?: string | null;
}

interface OrderNotificationDetails {
    id: string;
    buyer_id: string;
    farmer_id: string;
    total_amount: number;
    buyer: { full_name: string | null; email: string | null } | null;
    farmer: { full_name: string | null; email: string | null } | null;
    order_items: Array<{
        listing_id: string;
        quantity_kg: number;
        listings:
            | {
                  commodity: string | null;
                  grade: string | null;
              }
            | Array<{
                  commodity: string | null;
                  grade: string | null;
              }>
            | null;
    }>;
}

const ensureSupabase = () => {
    if (!isSupabaseConfigured) {
        throw new Error("Supabase is required for notifications.");
    }

    return getSupabaseClient();
};

const NOTIFICATIONS_SELECT_BASE =
    "id, recipient_role, recipient_user_id, type, title, message, entity_type, entity_id, is_read, created_at";

const NOTIFICATIONS_SELECT_WITH_RELATED = `${NOTIFICATIONS_SELECT_BASE}, related_order_id, related_product_id`;

const isMissingNotificationsSchemaError = (error: unknown) =>
    error instanceof Error &&
    (error.message.toLowerCase().includes("notifications") ||
        error.message.toLowerCase().includes("recipient_role") ||
        error.message.toLowerCase().includes("entity_type") ||
        error.message.toLowerCase().includes("related_order_id") ||
        error.message.toLowerCase().includes("related_product_id") ||
        error.message.toLowerCase().includes("read_at") ||
        error.message.toLowerCase().includes("column") ||
        error.message.toLowerCase().includes("does not exist"));

const isColumnMissingError = (error: unknown) =>
    error instanceof Error &&
    error.message.toLowerCase().includes("column") &&
    error.message.toLowerCase().includes("does not exist");

const mapNotification = (row: NotificationRow): AppNotification => ({
    id: row.id,
    recipientRole: row.recipient_role,
    recipientUserId: row.recipient_user_id,
    type: row.type,
    title: row.title,
    message: row.message,
    entityType: row.entity_type,
    entityId: row.entity_id,
    isRead: row.is_read,
    createdAt: row.created_at,
});

const mapRowLikeNotification = (
    row: Partial<NotificationRow> | null | undefined,
): AppNotification | null => {
    if (!row?.id || !row?.title || !row?.message || !row?.type) {
        return null;
    }

    return mapNotification({
        id: String(row.id),
        recipient_role: (row.recipient_role as UserRole | null) ?? null,
        recipient_user_id: row.recipient_user_id ?? null,
        type: String(row.type),
        title: String(row.title),
        message: String(row.message),
        entity_type: row.entity_type ?? null,
        entity_id: row.entity_id ?? null,
        related_order_id: row.related_order_id ?? null,
        related_product_id: row.related_product_id ?? null,
        is_read: Boolean(row.is_read),
        created_at: row.created_at
            ? String(row.created_at)
            : new Date().toISOString(),
    });
};

const dedupeNotifications = (notifications: AppNotification[]) => {
    const byId = new Map<string, AppNotification>();
    for (const notification of notifications) {
        byId.set(notification.id, notification);
    }

    return Array.from(byId.values()).sort(
        (left, right) =>
            new Date(right.createdAt).getTime() -
            new Date(left.createdAt).getTime(),
    );
};

const formatNaira = (amount: number) =>
    `NGN ${Number.isFinite(amount) ? amount.toLocaleString() : "0"}`;

const resolveAdminRecipientIds = async (): Promise<string[]> => {
    const supabase = ensureSupabase();
    const { data, error } = await supabase
        .from("profiles")
        .select("id")
        .eq("role", "admin");

    if (error) {
        console.error("[Notifications] Failed to resolve admin recipients", {
            error,
            code: (error as { code?: string })?.code,
            details: (error as { details?: string })?.details,
            hint: (error as { hint?: string })?.hint,
            message: (error as { message?: string })?.message,
        });
        return [];
    }

    return (data || [])
        .map((row) => row.id as string)
        .filter((id) => Boolean(id));
};

const sendWhatsAppNotification = async (_params: {
    orderId: string;
    farmerId: string;
}): Promise<void> => {
    // TODO: WhatsApp channel can be enabled later via server-side providers.
    // Intentionally disabled for MVP to avoid shipping secret tokens in frontend.
    return;
};

export const createNotification = async (
    payload: CreateNotificationInput,
): Promise<AppNotification> => {
    const supabase = ensureSupabase();

    const baseRow = {
        type: payload.type,
        title: payload.title,
        message: payload.message,
        entity_type: payload.entityType ?? null,
        entity_id: payload.entityId ?? null,
        related_order_id:
            payload.relatedOrderId ??
            (payload.entityType === "order" ? payload.entityId : null),
        related_product_id:
            payload.relatedProductId ??
            (payload.entityType === "listing" ? payload.entityId : null),
    };

    const directRecipientUserId = payload.recipientUserId ?? null;
    let recipientUserIds: string[] = [];

    if (directRecipientUserId) {
        recipientUserIds = [directRecipientUserId];
    } else if (payload.recipientRole === "admin") {
        recipientUserIds = await resolveAdminRecipientIds();
    }

    const insertRows =
        recipientUserIds.length > 0
            ? recipientUserIds.map((recipientUserId) => ({
                  ...baseRow,
                  recipient_role: payload.recipientRole ?? null,
                  recipient_user_id: recipientUserId,
              }))
            : [
                  {
                      ...baseRow,
                      recipient_role: payload.recipientRole ?? null,
                      recipient_user_id: null,
                  },
              ];

    let data: NotificationRow[] | null = null;
    let error: unknown = null;

    const { data: insertDataWithRelated, error: insertErrorWithRelated } =
        await supabase
            .from("notifications")
            .insert(insertRows)
            .select(NOTIFICATIONS_SELECT_WITH_RELATED);

    data = (insertDataWithRelated || null) as NotificationRow[] | null;
    error = insertErrorWithRelated;

    if (error && isColumnMissingError(error)) {
        const legacyRows = insertRows.map(
            ({ related_order_id, related_product_id, ...row }) => row,
        );
        const { data: legacyInsertData, error: legacyInsertError } =
            await supabase
                .from("notifications")
                .insert(legacyRows)
                .select(NOTIFICATIONS_SELECT_BASE);
        data = (legacyInsertData || null) as NotificationRow[] | null;
        error = legacyInsertError;
    }

    if (error) {
        if (isMissingNotificationsSchemaError(error)) {
            console.warn(
                "[Notifications] Notifications schema is not ready yet; skipping persisted notification.",
                error,
            );
            return {
                id: `pending-${Date.now()}`,
                recipientRole: payload.recipientRole ?? null,
                recipientUserId: payload.recipientUserId ?? null,
                type: payload.type,
                title: payload.title,
                message: payload.message,
                entityType: payload.entityType ?? null,
                entityId: payload.entityId ?? null,
                isRead: false,
                createdAt: new Date().toISOString(),
            };
        }

        throw error;
    }

    const created = (data || []) as NotificationRow[];
    const first = created[0];
    if (!first) {
        throw new Error("Notification insert succeeded but returned no rows.");
    }

    console.log("[Notifications] Created notification", {
        count: created.length,
        type: first.type,
        recipientRole: payload.recipientRole ?? null,
        recipientUserId: payload.recipientUserId ?? null,
    });

    return mapNotification(first);
};

export const getNotificationsForUser = async (
    userId?: string | null,
    role?: UserRole | null,
): Promise<AppNotification[]> => {
    const supabase = ensureSupabase();
    const runQuery = async (
        scope: "user" | "adminBroadcast",
    ): Promise<NotificationRow[]> => {
        const applyScope = (query: any) => {
            if (scope === "user") {
                return query.eq("recipient_user_id", userId);
            }
            return query
                .eq("recipient_role", "admin")
                .is("recipient_user_id", null);
        };

        const { data: relatedData, error: relatedError } = await applyScope(
            supabase
                .from("notifications")
                .select(NOTIFICATIONS_SELECT_WITH_RELATED)
                .order("created_at", { ascending: false })
                .limit(100),
        );

        if (relatedError && isColumnMissingError(relatedError)) {
            const { data: legacyData, error: legacyError } = await applyScope(
                supabase
                    .from("notifications")
                    .select(NOTIFICATIONS_SELECT_BASE)
                    .order("created_at", { ascending: false })
                    .limit(100),
            );
            if (legacyError) {
                throw legacyError;
            }
            return (legacyData || []) as NotificationRow[];
        }

        if (relatedError) {
            throw relatedError;
        }

        return (relatedData || []) as NotificationRow[];
    };

    try {
        const rows: NotificationRow[] = [];
        if (userId) {
            rows.push(...(await runQuery("user")));
        }
        if (role === "admin") {
            rows.push(...(await runQuery("adminBroadcast")));
        }

        return dedupeNotifications(
            rows.map((row) => mapNotification(row as NotificationRow)),
        );
    } catch (error) {
        if (isMissingNotificationsSchemaError(error)) {
            console.warn(
                "[Notifications] Notifications schema is not ready yet; returning empty notifications.",
                error,
            );
            return [];
        }
        throw error;
    }
};

export const getUnreadNotificationCount = async (
    userId?: string | null,
    role?: UserRole | null,
): Promise<number> => {
    const notifications = await getNotificationsForUser(userId, role);
    return notifications.filter((notification) => !notification.isRead).length;
};

export const markNotificationRead = async (
    notificationId: string,
): Promise<void> => {
    const supabase = ensureSupabase();
    let { error } = await supabase
        .from("notifications")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("id", notificationId);

    if (error && isColumnMissingError(error)) {
        const retry = await supabase
            .from("notifications")
            .update({ is_read: true })
            .eq("id", notificationId);
        error = retry.error;
    }

    if (error) {
        if (isMissingNotificationsSchemaError(error)) {
            console.warn(
                "[Notifications] Notifications schema is not ready yet; skipping mark as read.",
                error,
            );
            return;
        }

        throw error;
    }

    console.log("[Notifications] Marked notification as read", {
        notificationId,
    });
};

export const markNotificationAsRead = markNotificationRead;

export const markAllNotificationsRead = async (
    userId?: string | null,
    role?: UserRole | null,
): Promise<void> => {
    const supabase = ensureSupabase();
    const visibleNotifications = await getNotificationsForUser(userId, role);
    const unreadIds = visibleNotifications
        .filter((notification) => !notification.isRead)
        .map((notification) => notification.id);

    if (unreadIds.length === 0) {
        return;
    }

    let { error } = await supabase
        .from("notifications")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .in("id", unreadIds);

    if (error && isColumnMissingError(error)) {
        const retry = await supabase
            .from("notifications")
            .update({ is_read: true })
            .in("id", unreadIds);
        error = retry.error;
    }

    if (error) {
        if (isMissingNotificationsSchemaError(error)) {
            console.warn(
                "[Notifications] Notifications schema is not ready yet; skipping mark all read.",
                error,
            );
            return;
        }
        throw error;
    }

    console.log("[Notifications] Marked all notifications as read", {
        userId,
        role,
        count: unreadIds.length,
    });
};

export const markAllNotificationsAsRead = markAllNotificationsRead;

export const subscribeToNotifications = (
    params: {
        userId?: string | null;
        role?: UserRole | null;
    },
    handlers: {
        onNotification: (notification: AppNotification) => void;
        onError?: (error: unknown) => void;
    },
): (() => void) => {
    if (!isSupabaseConfigured) {
        return () => undefined;
    }

    const supabase = ensureSupabase();
    const userId = params.userId ?? null;
    const role = params.role ?? null;
    const channelName = `notifications-live-${role || "anon"}-${userId || "guest"}-${Date.now()}`;
    const channel = supabase.channel(channelName);

    const handlePayload = (payload: NotificationRealtimePayload) => {
        const nextNotification = mapRowLikeNotification(payload.new);
        if (!nextNotification) {
            return;
        }

        const matchesDirectRecipient =
            Boolean(userId) && nextNotification.recipientUserId === userId;
        const matchesAdminBroadcast =
            role === "admin" &&
            nextNotification.recipientRole === "admin" &&
            !nextNotification.recipientUserId;

        if (matchesDirectRecipient || matchesAdminBroadcast) {
            handlers.onNotification(nextNotification);
        }
    };

    channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications" },
        handlePayload,
    );

    channel.subscribe((status, error) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            handlers.onError?.(
                error ||
                    new Error(
                        `Notification stream error: ${status.toLowerCase()}`,
                    ),
            );
        }
    });

    return () => {
        supabase.removeChannel(channel).catch((error) => {
            console.warn(
                "[Notifications] Failed to clean up realtime channel",
                error,
            );
        });
    };
};

const extractListingPayload = (order: OrderNotificationDetails) => {
    const firstItem = order.order_items?.[0];
    const listingId = firstItem?.listing_id || null;
    const listingValue = firstItem?.listings;
    const listing =
        Array.isArray(listingValue) && listingValue.length > 0
            ? listingValue[0]
            : !Array.isArray(listingValue)
              ? listingValue
              : null;

    return {
        listingId,
        commodity: listing?.commodity || "Produce",
        grade: listing?.grade || null,
        quantityKg: Number(firstItem?.quantity_kg || 0),
    };
};

export const createOrderNotifications = async (
    orderId: string,
): Promise<void> => {
    try {
        const supabase = ensureSupabase();
        const { data: orderData, error: orderError } = await supabase
            .from("orders")
            .select(
                `
                id,
                buyer_id,
                farmer_id,
                total_amount,
                buyer:profiles!orders_buyer_id_fkey(full_name, email),
                farmer:profiles!orders_farmer_id_fkey(full_name, email),
                order_items (
                    listing_id,
                    quantity_kg,
                    listings (
                        commodity,
                        grade
                    )
                )
            `,
            )
            .eq("id", orderId)
            .single();

        if (orderError || !orderData) {
            console.error(
                "[Notifications] Failed to get order details for notifications",
                orderError,
            );
            return;
        }

        const order = orderData as unknown as OrderNotificationDetails;
        const { listingId, commodity, quantityKg } = extractListingPayload(order);
        const amount = Number(order.total_amount || 0);
        const buyerName = order.buyer?.full_name || "Buyer";
        const farmerName = order.farmer?.full_name || "Farmer";

        await Promise.allSettled([
            createNotification({
                recipientUserId: order.farmer_id,
                type: "new_order",
                title: "New order received",
                message: `A buyer placed an order for ${commodity} (${quantityKg || 0}kg). Amount: ${formatNaira(amount)}. Please review and confirm availability.`,
                entityType: "order",
                entityId: orderId,
                relatedOrderId: orderId,
                relatedProductId: listingId,
            }),
            createNotification({
                recipientRole: "admin",
                type: "new_order",
                title: "New order placed",
                message: `New order for ${commodity} (${quantityKg || 0}kg, ${formatNaira(amount)}). Buyer: ${buyerName}. Farmer: ${farmerName}.`,
                entityType: "order",
                entityId: orderId,
                relatedOrderId: orderId,
                relatedProductId: listingId,
            }),
            createNotification({
                recipientUserId: order.buyer_id,
                type: "payment_successful",
                title: "Payment successful",
                message: `Your payment for ${commodity} (${quantityKg || 0}kg) was successful. The farmer will confirm availability shortly.`,
                entityType: "order",
                entityId: orderId,
                relatedOrderId: orderId,
                relatedProductId: listingId,
            }),
        ]);

        try {
            const { error: invokeError } = await supabase.functions.invoke(
                "send-order-notification",
                {
                    body: { orderId },
                },
            );
            if (invokeError) {
                console.error(
                    "[Notifications] Failed to invoke send-order-notification",
                    invokeError,
                );
            }
        } catch (emailError) {
            console.error(
                "[Notifications] Failed to send email notifications",
                emailError,
            );
        }

        await sendWhatsAppNotification({
            orderId,
            farmerId: order.farmer_id,
        });

        console.log("[Notifications] Created order notifications", {
            orderId,
            farmerId: order.farmer_id,
            buyerId: order.buyer_id,
            relatedProductId: listingId,
        });
    } catch (error) {
        console.error(
            "[Notifications] Failed to create order notifications",
            error,
        );
    }
};

export const createOrderStatusUpdatedNotifications = async (
    orderId: string,
    statusLabel: string,
): Promise<void> => {
    try {
        const supabase = ensureSupabase();
        const { data: orderData, error: orderError } = await supabase
            .from("orders")
            .select(
                `
                id,
                buyer_id,
                farmer_id,
                order_items (
                    listing_id,
                    listings (
                        commodity
                    )
                )
            `,
            )
            .eq("id", orderId)
            .single();

        if (orderError || !orderData) {
            console.error(
                "[Notifications] Failed to load order for status update notification",
                orderError,
            );
            return;
        }

        const order = orderData as unknown as OrderNotificationDetails;
        const { listingId, commodity } = extractListingPayload(order);

        const normalizedStatus = statusLabel.toLowerCase();
        const notificationTasks: Array<Promise<unknown>> = [];

        if (normalizedStatus === "accepted") {
            notificationTasks.push(
                createNotification({
                    recipientUserId: order.buyer_id,
                    type: "order_accepted",
                    title: "Farmer accepted your order",
                    message: `Your ${commodity} order has been accepted and will move to preparation shortly.`,
                    entityType: "order",
                    entityId: orderId,
                    relatedOrderId: orderId,
                    relatedProductId: listingId,
                }),
                createNotification({
                    recipientRole: "admin",
                    type: "order_accepted",
                    title: "Order accepted",
                    message: `Order ${orderId.slice(0, 8)} for ${commodity} has been accepted by the farmer.`,
                    entityType: "order",
                    entityId: orderId,
                    relatedOrderId: orderId,
                    relatedProductId: listingId,
                }),
            );
        } else if (normalizedStatus === "rejected") {
            notificationTasks.push(
                createNotification({
                    recipientUserId: order.buyer_id,
                    type: "order_rejected",
                    title: "Order rejected",
                    message: `Your ${commodity} order was rejected by the farmer. The payment will be reviewed for refund handling.`,
                    entityType: "order",
                    entityId: orderId,
                    relatedOrderId: orderId,
                    relatedProductId: listingId,
                }),
                createNotification({
                    recipientRole: "admin",
                    type: "order_rejected",
                    title: "Order rejected",
                    message: `Order ${orderId.slice(0, 8)} for ${commodity} was rejected and needs refund review.`,
                    entityType: "order",
                    entityId: orderId,
                    relatedOrderId: orderId,
                    relatedProductId: listingId,
                }),
            );
        } else if (normalizedStatus === "delivered") {
            notificationTasks.push(
                createNotification({
                    recipientUserId: order.farmer_id,
                    type: "order_completed",
                    title: "Order completed",
                    message: `Buyer confirmed delivery for ${commodity}. Escrow funds are now released to your available balance.`,
                    entityType: "order",
                    entityId: orderId,
                    relatedOrderId: orderId,
                    relatedProductId: listingId,
                }),
                createNotification({
                    recipientRole: "admin",
                    type: "escrow_released",
                    title: "Escrow released",
                    message: `Escrow released for order ${orderId.slice(0, 8)} after buyer delivery confirmation.`,
                    entityType: "order",
                    entityId: orderId,
                    relatedOrderId: orderId,
                    relatedProductId: listingId,
                }),
            );
        } else {
            notificationTasks.push(
                createNotification({
                    recipientUserId: order.buyer_id,
                    type: "order_status_updated",
                    title: "Order status updated",
                    message: `Your ${commodity} order is now ${statusLabel}.`,
                    entityType: "order",
                    entityId: orderId,
                    relatedOrderId: orderId,
                    relatedProductId: listingId,
                }),
                createNotification({
                    recipientUserId: order.farmer_id,
                    type: "order_status_updated",
                    title: "Order status updated",
                    message: `Order for ${commodity} is now ${statusLabel}.`,
                    entityType: "order",
                    entityId: orderId,
                    relatedOrderId: orderId,
                    relatedProductId: listingId,
                }),
                createNotification({
                    recipientRole: "admin",
                    type: "order_status_updated",
                    title: "Order status updated",
                    message: `Order ${orderId.slice(0, 8)} is now ${statusLabel}.`,
                    entityType: "order",
                    entityId: orderId,
                    relatedOrderId: orderId,
                    relatedProductId: listingId,
                }),
            );
        }

        await Promise.allSettled(notificationTasks);
    } catch (error) {
        console.error(
            "[Notifications] Failed to create status update notifications",
            error,
        );
    }
};
