import { AppNotification, UserRole } from "@/types";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";

interface NotificationRow {
    id: string;
    recipient_role: UserRole | null;
    recipient_user_id: string | null;
    actor_id?: string | null;
    type: string;
    title: string;
    message: string;
    entity_type: string | null;
    entity_id: string | null;
    related_order_id?: string | null;
    related_product_id?: string | null;
    related_listing_id?: string | null;
    related_payment_id?: string | null;
    related_escrow_id?: string | null;
    related_kyc_id?: string | null;
    related_withdrawal_id?: string | null;
    link_url?: string | null;
    metadata?: Record<string, unknown> | null;
    is_read: boolean;
    read_at?: string | null;
    created_at: string;
}

interface NotificationRealtimePayload {
    new?: Partial<NotificationRow> | null;
}

interface CreateNotificationInput {
    recipientRole?: UserRole | null;
    recipientUserId?: string | null;
    actorId?: string | null;
    type: string;
    title: string;
    message: string;
    entityType?: string | null;
    entityId?: string | null;
    relatedOrderId?: string | null;
    relatedProductId?: string | null;
    relatedListingId?: string | null;
    relatedPaymentId?: string | null;
    relatedEscrowId?: string | null;
    relatedKycId?: string | null;
    relatedWithdrawalId?: string | null;
    linkUrl?: string | null;
    metadata?: Record<string, unknown> | null;
}

interface OrderNotificationDetails {
    id: string;
    buyer_id: string;
    farmer_id: string;
    total_amount: number;
    buyer: {
        id?: string | null;
        role?: string | null;
        full_name: string | null;
        email: string | null;
    } | null;
    farmer: {
        id?: string | null;
        role?: string | null;
        full_name: string | null;
        email: string | null;
    } | null;
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

const NOTIFICATIONS_SELECT_WITH_EXTENDED = `${NOTIFICATIONS_SELECT_WITH_RELATED}, actor_id, related_listing_id, related_payment_id, related_escrow_id, related_kyc_id, link_url, metadata, read_at`;
const NOTIFICATIONS_SELECT_WITH_FULL_RELATIONS = `${NOTIFICATIONS_SELECT_WITH_EXTENDED}, related_withdrawal_id`;

type ErrorLike = {
    message?: string;
    code?: string;
    details?: string | null;
    hint?: string | null;
};

const extractErrorLike = (error: unknown): ErrorLike => {
    if (!error || typeof error !== "object") {
        return {};
    }

    const e = error as Record<string, unknown>;
    return {
        message: typeof e.message === "string" ? e.message : undefined,
        code: typeof e.code === "string" ? e.code : undefined,
        details: typeof e.details === "string" ? e.details : null,
        hint: typeof e.hint === "string" ? e.hint : null,
    };
};

const getErrorMessage = (error: unknown): string => {
    if (typeof error === "string") {
        return error;
    }

    if (
        error &&
        typeof error === "object" &&
        "message" in error &&
        typeof (error as { message?: unknown }).message === "string"
    ) {
        return (error as { message: string }).message;
    }

    try {
        return JSON.stringify(error);
    } catch {
        return "";
    }
};

const isMissingNotificationsSchemaError = (error: unknown) =>
    (() => {
        const message = getErrorMessage(error).toLowerCase();
        return (
            message.includes("notifications") ||
            message.includes("recipient_role") ||
            message.includes("entity_type") ||
            message.includes("related_order_id") ||
            message.includes("related_product_id") ||
            message.includes("related_listing_id") ||
            message.includes("related_payment_id") ||
            message.includes("related_escrow_id") ||
            message.includes("related_kyc_id") ||
            message.includes("related_withdrawal_id") ||
            message.includes("link_url") ||
            message.includes("metadata") ||
            message.includes("actor_id") ||
            message.includes("read_at") ||
            message.includes("column") ||
            message.includes("does not exist")
        );
    })();

const isColumnMissingError = (error: unknown) =>
    (() => {
        const { code } = extractErrorLike(error);
        const message = getErrorMessage(error).toLowerCase();
        const isSchemaCacheColumnError =
            message.includes("could not find") &&
            message.includes("column") &&
            message.includes("schema cache");
        const isPostgresMissingColumnError =
            message.includes("column") && message.includes("does not exist");
        const isPostgrestSchemaCacheCode =
            typeof code === "string" && code.startsWith("PGRST2");

        return (
            isSchemaCacheColumnError ||
            isPostgresMissingColumnError ||
            isPostgrestSchemaCacheCode
        );
    })();

const mapNotification = (row: NotificationRow): AppNotification => ({
    id: row.id,
    recipientRole: row.recipient_role,
    recipientUserId: row.recipient_user_id,
    type: row.type,
    title: row.title,
    message: row.message,
    entityType: row.entity_type,
    entityId: row.entity_id,
    actorId: row.actor_id ?? null,
    relatedOrderId: row.related_order_id ?? null,
    relatedProductId: row.related_product_id ?? null,
    relatedListingId: row.related_listing_id ?? null,
    relatedPaymentId: row.related_payment_id ?? null,
    relatedEscrowId: row.related_escrow_id ?? null,
    relatedKycId: row.related_kyc_id ?? null,
    relatedWithdrawalId: row.related_withdrawal_id ?? null,
    linkUrl: row.link_url ?? null,
    metadata: row.metadata ?? {},
    isRead: row.is_read,
    readAt: row.read_at ?? null,
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
        actor_id: row.actor_id ?? null,
        related_order_id: row.related_order_id ?? null,
        related_product_id: row.related_product_id ?? null,
        related_listing_id: row.related_listing_id ?? null,
        related_payment_id: row.related_payment_id ?? null,
        related_escrow_id: row.related_escrow_id ?? null,
        related_kyc_id: row.related_kyc_id ?? null,
        related_withdrawal_id: row.related_withdrawal_id ?? null,
        link_url: row.link_url ?? null,
        metadata:
            (row.metadata as Record<string, unknown> | null | undefined) ?? {},
        is_read: Boolean(row.is_read),
        read_at: row.read_at ?? null,
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

const isNonEmptyString = (value: unknown): value is string =>
    typeof value === "string" && value.trim().length > 0;

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

    if (!isNonEmptyString(payload.type) || !isNonEmptyString(payload.title) || !isNonEmptyString(payload.message)) {
        throw new Error("Notification payload is missing required type/title/message.");
    }

    const baseRow = {
        actor_id: payload.actorId ?? null,
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
        related_listing_id:
            payload.relatedListingId ??
            payload.relatedProductId ??
            (payload.entityType === "listing" ? payload.entityId : null),
        related_payment_id: payload.relatedPaymentId ?? null,
        related_escrow_id: payload.relatedEscrowId ?? null,
        related_kyc_id: payload.relatedKycId ?? null,
        related_withdrawal_id: payload.relatedWithdrawalId ?? null,
        link_url: payload.linkUrl ?? null,
        metadata: payload.metadata ?? {},
    };

    const directRecipientUserId = isNonEmptyString(payload.recipientUserId)
        ? payload.recipientUserId
        : null;
    let recipientUserIds: string[] = [];

    if (directRecipientUserId) {
        recipientUserIds = [directRecipientUserId];
    } else if (payload.recipientRole === "admin") {
        recipientUserIds = await resolveAdminRecipientIds();
    }

    if (!directRecipientUserId && payload.recipientRole !== "admin") {
        throw new Error(
            `Notification recipient is missing for type "${payload.type}".`,
        );
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
            .select(NOTIFICATIONS_SELECT_WITH_FULL_RELATIONS);

    data = (insertDataWithRelated || null) as NotificationRow[] | null;
    error = insertErrorWithRelated;

    if (error && isColumnMissingError(error)) {
        const fallbackRows = insertRows.map(
            ({
                actor_id,
                related_listing_id,
                related_payment_id,
                related_escrow_id,
                related_kyc_id,
                related_withdrawal_id,
                link_url,
                metadata,
                ...row
            }) => row,
        );
        const legacyRows = fallbackRows.map(
            ({ related_order_id, related_product_id, ...row }) => row,
        );
        const { data: legacyInsertData, error: legacyInsertError } =
            await supabase
                .from("notifications")
                .insert(fallbackRows)
                .select(NOTIFICATIONS_SELECT_WITH_RELATED);
        data = (legacyInsertData || null) as NotificationRow[] | null;
        error = legacyInsertError;

        if (error && isColumnMissingError(error)) {
            const { data: baseInsertData, error: baseInsertError } =
                await supabase
                    .from("notifications")
                    .insert(legacyRows)
                    .select(NOTIFICATIONS_SELECT_BASE);
            data = (baseInsertData || null) as NotificationRow[] | null;
            error = baseInsertError;
        }
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
                actorId: payload.actorId ?? null,
                type: payload.type,
                title: payload.title,
                message: payload.message,
                entityType: payload.entityType ?? null,
                entityId: payload.entityId ?? null,
                relatedOrderId: payload.relatedOrderId ?? null,
                relatedProductId: payload.relatedProductId ?? null,
                relatedListingId: payload.relatedListingId ?? null,
                relatedPaymentId: payload.relatedPaymentId ?? null,
                relatedEscrowId: payload.relatedEscrowId ?? null,
                relatedKycId: payload.relatedKycId ?? null,
                relatedWithdrawalId: payload.relatedWithdrawalId ?? null,
                linkUrl: payload.linkUrl ?? null,
                metadata: payload.metadata ?? {},
                isRead: false,
                readAt: null,
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

export const createManyNotifications = async (
    payloads: CreateNotificationInput[],
): Promise<void> => {
    if (!payloads.length) {
        return;
    }

    const settled = await Promise.allSettled(
        payloads.map((payload) => createNotification(payload)),
    );
    const failures = settled
        .map((result, index) => ({ result, payload: payloads[index] }))
        .filter(
            (entry): entry is {
                result: PromiseRejectedResult;
                payload: CreateNotificationInput;
            } => entry.result.status === "rejected",
        );

    if (failures.length > 0) {
        console.error("[Notifications] Some notifications failed to create", {
            attempted: payloads.length,
            failed: failures.length,
            failures: failures.map((failure) => ({
                type: failure.payload.type,
                recipientRole: failure.payload.recipientRole ?? null,
                recipientUserId: failure.payload.recipientUserId ?? null,
                reason:
                    failure.result.reason instanceof Error
                        ? failure.result.reason.message
                        : getErrorMessage(failure.result.reason),
            })),
        });
    } else {
        console.log("[Notifications] Notification batch created", {
            attempted: payloads.length,
            failed: 0,
        });
    }
};

export const notifyAdmins = async (
    payload: Omit<CreateNotificationInput, "recipientRole" | "recipientUserId">,
): Promise<void> => {
    await createNotification({
        ...payload,
        recipientRole: "admin",
    });
};

export const notifyFarmer = async (
    farmerId: string,
    payload: Omit<CreateNotificationInput, "recipientRole" | "recipientUserId">,
): Promise<void> => {
    await createNotification({
        ...payload,
        recipientUserId: farmerId,
    });
};

export const notifyBuyer = async (
    buyerId: string,
    payload: Omit<CreateNotificationInput, "recipientRole" | "recipientUserId">,
): Promise<void> => {
    await createNotification({
        ...payload,
        recipientUserId: buyerId,
    });
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

        console.log("[Notifications] Fetching notifications", {
            scope,
            userId: userId ?? null,
            role: role ?? null,
        });

        const { data: relatedData, error: relatedError } = await applyScope(
            supabase
                .from("notifications")
                .select(NOTIFICATIONS_SELECT_WITH_FULL_RELATIONS)
                .order("created_at", { ascending: false })
                .limit(100),
        );

        if (relatedError && isColumnMissingError(relatedError)) {
            const errInfo = extractErrorLike(relatedError);
            console.warn(
                "[Notifications] Extended select unavailable; retrying with reduced columns",
                {
                    scope,
                    code: errInfo.code,
                    message: errInfo.message,
                    details: errInfo.details,
                    hint: errInfo.hint,
                },
            );
            const { data: withRelatedData, error: withRelatedError } =
                await applyScope(
                    supabase
                        .from("notifications")
                        .select(NOTIFICATIONS_SELECT_WITH_RELATED)
                        .order("created_at", { ascending: false })
                        .limit(100),
                );

            if (!withRelatedError) {
                return (withRelatedData || []) as NotificationRow[];
            }

            if (!isColumnMissingError(withRelatedError)) {
                const errInfo = extractErrorLike(withRelatedError);
                console.error(
                    "[Notifications] Reduced select failed with non-schema error",
                    {
                        scope,
                        code: errInfo.code,
                        message: errInfo.message,
                        details: errInfo.details,
                        hint: errInfo.hint,
                    },
                );
                throw withRelatedError;
            }

            const { data: legacyData, error: legacyError } = await applyScope(
                supabase
                    .from("notifications")
                    .select(NOTIFICATIONS_SELECT_BASE)
                    .order("created_at", { ascending: false })
                    .limit(100),
            );
            if (legacyError) {
                const errInfo = extractErrorLike(legacyError);
                console.error(
                    "[Notifications] Legacy base select failed",
                    {
                        scope,
                        code: errInfo.code,
                        message: errInfo.message,
                        details: errInfo.details,
                        hint: errInfo.hint,
                    },
                );
                throw legacyError;
            }
            console.log("[Notifications] Legacy base notifications loaded", {
                scope,
                count: (legacyData || []).length,
            });
            return (legacyData || []) as NotificationRow[];
        }

        if (relatedError) {
            const errInfo = extractErrorLike(relatedError);
            console.error("[Notifications] Notification query failed", {
                scope,
                code: errInfo.code,
                message: errInfo.message,
                details: errInfo.details,
                hint: errInfo.hint,
            });
            throw relatedError;
        }

        console.log("[Notifications] Notifications loaded", {
            scope,
            count: (relatedData || []).length,
        });
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
        const errInfo = extractErrorLike(error);
        console.error("[Notifications] Failed to load notifications for user", {
            userId: userId ?? null,
            role: role ?? null,
            code: errInfo.code,
            message: errInfo.message,
            details: errInfo.details,
            hint: errInfo.hint,
        });

        const message = errInfo.message || "Failed to load notifications.";
        throw new Error(message);
    }
};

export const getUnreadNotificationCount = async (
    userId?: string | null,
    role?: UserRole | null,
): Promise<number> => {
    const notifications = await getNotificationsForUser(userId, role);
    return notifications.filter((notification) => !notification.isRead).length;
};

export const getNotificationsForCurrentUser = getNotificationsForUser;

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

const recordOrderEvent = async (payload: {
    orderId: string;
    actorId?: string | null;
    eventType: string;
    title: string;
    description?: string | null;
    metadata?: Record<string, unknown> | null;
}) => {
    try {
        const supabase = ensureSupabase();
        const { error } = await supabase.from("order_events").insert({
            order_id: payload.orderId,
            actor_id: payload.actorId ?? null,
            event_type: payload.eventType,
            title: payload.title,
            description: payload.description ?? null,
            metadata: payload.metadata ?? {},
        });

        if (error) {
            if (isMissingNotificationsSchemaError(error)) {
                return;
            }
            console.error("[Notifications] Failed to record order event", {
                orderId: payload.orderId,
                eventType: payload.eventType,
                error,
            });
        }
    } catch (error) {
        console.error("[Notifications] Failed to record order event", {
            orderId: payload.orderId,
            eventType: payload.eventType,
            error,
        });
    }
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
                buyer:profiles!orders_buyer_id_fkey(id, role, full_name, email),
                farmer:profiles!orders_farmer_id_fkey(id, role, full_name, email),
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
        let farmerProfileId = isNonEmptyString(order.farmer_id)
            ? order.farmer_id
            : null;

        if (!farmerProfileId && listingId) {
            const { data: listingOwnerRow, error: listingOwnerError } =
                await supabase
                    .from("listings")
                    .select("farmer_id")
                    .eq("id", listingId)
                    .maybeSingle();

            if (listingOwnerError) {
                console.error(
                    "[Notifications] Could not resolve farmer from listing while creating order notifications",
                    {
                        orderId,
                        listingId,
                        error: listingOwnerError,
                    },
                );
            } else if (
                isNonEmptyString(
                    (listingOwnerRow as { farmer_id?: string | null } | null)
                        ?.farmer_id,
                )
            ) {
                farmerProfileId = (
                    listingOwnerRow as { farmer_id: string }
                ).farmer_id;
                console.log(
                    "[Notifications] Resolved farmer recipient from listing owner fallback",
                    {
                        orderId,
                        listingId,
                        farmerProfileId,
                    },
                );
            }
        }

        console.log("Payment success order:", order);
        console.log("Buyer recipient:", order.buyer);
        console.log("Farmer recipient:", order.farmer);

        const notificationTasks: CreateNotificationInput[] = [];

        if (farmerProfileId) {
            console.log("Creating farmer notification...");
            notificationTasks.push({
                actorId: order.buyer_id,
                recipientUserId: farmerProfileId,
                type: "new_order",
                title: "New order received",
                message: `A buyer placed an order for ${commodity} (${quantityKg || 0}kg). Amount: ${formatNaira(amount)}. Please review and confirm availability.`,
                entityType: "order",
                entityId: orderId,
                relatedOrderId: orderId,
                relatedProductId: listingId,
                relatedListingId: listingId,
                linkUrl: `/farmer/orders/${orderId}`,
                metadata: {
                    amount,
                    quantityKg,
                    commodity,
                },
            });
        } else {
            console.warn("[Notifications] Skipping direct farmer notification due to invalid farmer recipient", {
                orderId,
                farmerId: order.farmer_id,
                farmerRole: order.farmer?.role || null,
            });
        }

        console.log("Creating admin notification...");
        notificationTasks.push(
            {
                actorId: order.buyer_id,
                recipientRole: "admin",
                type: "new_order",
                title: "New order placed",
                message: `New order for ${commodity} (${quantityKg || 0}kg, ${formatNaira(amount)}). Buyer: ${buyerName}. Farmer: ${farmerName}.`,
                entityType: "order",
                entityId: orderId,
                relatedOrderId: orderId,
                relatedProductId: listingId,
                relatedListingId: listingId,
                linkUrl: `/admin/orders`,
                metadata: {
                    amount,
                    quantityKg,
                    commodity,
                },
            },
        );

        console.log("Creating buyer notification...");
        notificationTasks.push(
            {
                actorId: order.buyer_id,
                recipientUserId: order.buyer_id,
                type: "payment_successful",
                title: "Payment successful",
                message: `Your payment for ${commodity} (${quantityKg || 0}kg) was successful. The farmer will confirm availability shortly.`,
                entityType: "order",
                entityId: orderId,
                relatedOrderId: orderId,
                relatedProductId: listingId,
                relatedListingId: listingId,
                linkUrl: `/buyer/orders/${orderId}`,
                metadata: {
                    amount,
                    quantityKg,
                    commodity,
                },
            },
        );

        if (farmerProfileId) {
            notificationTasks.push(
            {
                actorId: order.buyer_id,
                recipientUserId: farmerProfileId,
                type: "escrow_held",
                title: "Funds held in escrow",
                message: `${formatNaira(amount)} has been held in escrow for order ${orderId.slice(0, 8)}.`,
                entityType: "order",
                entityId: orderId,
                relatedOrderId: orderId,
                relatedProductId: listingId,
                relatedListingId: listingId,
                linkUrl: `/farmer/orders/${orderId}`,
                metadata: {
                    amount,
                    stage: "held",
                },
            },
            );
        }

        notificationTasks.push(
            {
                actorId: order.buyer_id,
                recipientRole: "admin",
                type: "escrow_held",
                title: "Escrow funded",
                message: `Escrow is now held for order ${orderId.slice(0, 8)} (${formatNaira(amount)}).`,
                entityType: "order",
                entityId: orderId,
                relatedOrderId: orderId,
                relatedProductId: listingId,
                relatedListingId: listingId,
                linkUrl: `/admin/orders`,
                metadata: {
                    amount,
                    stage: "held",
                },
            },
        );

        await createManyNotifications(notificationTasks);
        console.log("Notification insert result:", {
            orderId,
            attempted: notificationTasks.length,
        });

        await recordOrderEvent({
            orderId,
            actorId: order.buyer_id,
            eventType: "order_paid",
            title: "Payment successful",
            description: `Payment was confirmed for ${commodity}.`,
            metadata: {
                amount,
                quantityKg,
                commodity,
                paymentStatus: "Paid",
            },
        });

        await recordOrderEvent({
            orderId,
            actorId: order.buyer_id,
            eventType: "escrow_held",
            title: "Escrow funded",
            description: `Funds were held in escrow for this order.`,
            metadata: {
                amount,
                stage: "held",
            },
        });

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
            farmerId: farmerProfileId || order.farmer_id,
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
        const farmerRecipientId = isNonEmptyString(order.farmer_id)
            ? order.farmer_id
            : null;
        const canNotifyFarmerDirectly = Boolean(farmerRecipientId);

        const normalizedStatus = statusLabel.toLowerCase();
        const actorId =
            normalizedStatus === "delivered" || normalizedStatus === "disputed"
                ? order.buyer_id
                : order.farmer_id;
        const notificationTasks: Array<CreateNotificationInput> = [];

        if (normalizedStatus === "accepted") {
            notificationTasks.push(
                {
                    actorId,
                    recipientUserId: order.buyer_id,
                    type: "order_accepted",
                    title: "Farmer accepted your order",
                    message: `Your ${commodity} order has been accepted and will move to preparation shortly.`,
                    entityType: "order",
                    entityId: orderId,
                    relatedOrderId: orderId,
                    relatedProductId: listingId,
                    relatedListingId: listingId,
                    linkUrl: `/buyer/orders/${orderId}`,
                },
                {
                    actorId,
                    recipientRole: "admin",
                    type: "order_accepted",
                    title: "Order accepted",
                    message: `Order ${orderId.slice(0, 8)} for ${commodity} has been accepted by the farmer.`,
                    entityType: "order",
                    entityId: orderId,
                    relatedOrderId: orderId,
                    relatedProductId: listingId,
                    relatedListingId: listingId,
                    linkUrl: "/admin/orders",
                },
            );
        } else if (normalizedStatus === "rejected") {
            notificationTasks.push(
                {
                    actorId,
                    recipientUserId: order.buyer_id,
                    type: "order_rejected",
                    title: "Order rejected",
                    message: `Your ${commodity} order was rejected by the farmer. The payment will be reviewed for refund handling.`,
                    entityType: "order",
                    entityId: orderId,
                    relatedOrderId: orderId,
                    relatedProductId: listingId,
                    relatedListingId: listingId,
                    linkUrl: `/buyer/orders/${orderId}`,
                },
                {
                    actorId,
                    recipientRole: "admin",
                    type: "order_rejected",
                    title: "Order rejected",
                    message: `Order ${orderId.slice(0, 8)} for ${commodity} was rejected and needs refund review.`,
                    entityType: "order",
                    entityId: orderId,
                    relatedOrderId: orderId,
                    relatedProductId: listingId,
                    relatedListingId: listingId,
                    linkUrl: "/admin/orders",
                },
            );
        } else if (normalizedStatus === "delivered") {
            if (canNotifyFarmerDirectly && farmerRecipientId) {
                notificationTasks.push({
                    actorId,
                    recipientUserId: farmerRecipientId,
                    type: "order_completed",
                    title: "Order completed",
                    message: `Buyer confirmed delivery for ${commodity}. Escrow funds are now released to your available balance.`,
                    entityType: "order",
                    entityId: orderId,
                    relatedOrderId: orderId,
                    relatedProductId: listingId,
                    relatedListingId: listingId,
                    linkUrl: `/farmer/orders/${orderId}`,
                });
            }
            notificationTasks.push(
                {
                    actorId,
                    recipientUserId: order.buyer_id,
                    type: "order_completed",
                    title: "Order completed",
                    message: `Delivery confirmation recorded for your ${commodity} order.`,
                    entityType: "order",
                    entityId: orderId,
                    relatedOrderId: orderId,
                    relatedProductId: listingId,
                    relatedListingId: listingId,
                    linkUrl: `/buyer/orders/${orderId}`,
                },
                {
                    actorId,
                    recipientRole: "admin",
                    type: "escrow_released",
                    title: "Escrow released",
                    message: `Escrow released for order ${orderId.slice(0, 8)} after buyer delivery confirmation.`,
                    entityType: "order",
                    entityId: orderId,
                    relatedOrderId: orderId,
                    relatedProductId: listingId,
                    relatedListingId: listingId,
                    linkUrl: "/admin/orders",
                },
            );
        } else {
            notificationTasks.push({
                actorId,
                recipientUserId: order.buyer_id,
                type: "order_status_updated",
                title: "Order status updated",
                message: `Your ${commodity} order is now ${statusLabel}.`,
                entityType: "order",
                entityId: orderId,
                relatedOrderId: orderId,
                relatedProductId: listingId,
                relatedListingId: listingId,
                linkUrl: `/buyer/orders/${orderId}`,
            });
            if (canNotifyFarmerDirectly && farmerRecipientId) {
                notificationTasks.push({
                    actorId,
                    recipientUserId: farmerRecipientId,
                    type: "order_status_updated",
                    title: "Order status updated",
                    message: `Order for ${commodity} is now ${statusLabel}.`,
                    entityType: "order",
                    entityId: orderId,
                    relatedOrderId: orderId,
                    relatedProductId: listingId,
                    relatedListingId: listingId,
                    linkUrl: `/farmer/orders/${orderId}`,
                });
            }
            notificationTasks.push(
                {
                    actorId,
                    recipientRole: "admin",
                    type: "order_status_updated",
                    title: "Order status updated",
                    message: `Order ${orderId.slice(0, 8)} is now ${statusLabel}.`,
                    entityType: "order",
                    entityId: orderId,
                    relatedOrderId: orderId,
                    relatedProductId: listingId,
                    relatedListingId: listingId,
                    linkUrl: "/admin/orders",
                },
            );
        }

        await createManyNotifications(notificationTasks);

        await recordOrderEvent({
            orderId,
            actorId,
            eventType: `order_${normalizedStatus}`,
            title: `Order status changed to ${statusLabel}`,
            description: `Order for ${commodity} is now ${statusLabel}.`,
            metadata: {
                status: statusLabel,
                commodity,
            },
        });
    } catch (error) {
        console.error(
            "[Notifications] Failed to create status update notifications",
            error,
        );
    }
};
