import { AppNotification, UserRole } from '@/types';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';

interface NotificationRow {
  id: string;
  recipient_role: UserRole | null;
  recipient_user_id: string | null;
  type: string;
  title: string;
  message: string;
  entity_type: string | null;
  entity_id: string | null;
  is_read: boolean;
  created_at: string;
}

interface CreateNotificationInput {
  recipientRole?: UserRole | null;
  recipientUserId?: string | null;
  type: string;
  title: string;
  message: string;
  entityType?: string | null;
  entityId?: string | null;
}

const ensureSupabase = () => {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is required for notifications.');
  }

  return getSupabaseClient();
};

const isMissingNotificationsSchemaError = (error: unknown) =>
  error instanceof Error &&
  (error.message.toLowerCase().includes('notifications') ||
    error.message.toLowerCase().includes('recipient_role') ||
    error.message.toLowerCase().includes('entity_type'));

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

const dedupeNotifications = (notifications: AppNotification[]) => {
  const byId = new Map<string, AppNotification>();
  for (const notification of notifications) {
    byId.set(notification.id, notification);
  }

  return Array.from(byId.values()).sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  );
};

export const createNotification = async (payload: CreateNotificationInput): Promise<AppNotification> => {
  const supabase = ensureSupabase();
  const { data, error } = await supabase
    .from('notifications')
    .insert({
      recipient_role: payload.recipientRole ?? null,
      recipient_user_id: payload.recipientUserId ?? null,
      type: payload.type,
      title: payload.title,
      message: payload.message,
      entity_type: payload.entityType ?? null,
      entity_id: payload.entityId ?? null,
    })
    .select('id, recipient_role, recipient_user_id, type, title, message, entity_type, entity_id, is_read, created_at')
    .single();

  if (error) {
    if (isMissingNotificationsSchemaError(error)) {
      console.warn('[Notifications] Notifications schema is not ready yet; skipping persisted notification.', error);
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

  console.log('[Notifications] Created notification', {
    id: data.id,
    type: data.type,
    recipientRole: data.recipient_role,
    recipientUserId: data.recipient_user_id,
  });

  return mapNotification(data as NotificationRow);
};

export const getNotificationsForUser = async (userId?: string | null, role?: UserRole | null): Promise<AppNotification[]> => {
  const supabase = ensureSupabase();
  const queries: Array<Promise<any>> = [];

  if (role) {
    queries.push(
      supabase
        .from('notifications')
        .select('id, recipient_role, recipient_user_id, type, title, message, entity_type, entity_id, is_read, created_at')
        .eq('recipient_role', role)
        .order('created_at', { ascending: false })
    );
  }

  if (userId) {
    queries.push(
      supabase
        .from('notifications')
        .select('id, recipient_role, recipient_user_id, type, title, message, entity_type, entity_id, is_read, created_at')
        .eq('recipient_user_id', userId)
        .order('created_at', { ascending: false })
    );
  }

  if (queries.length === 0) {
    return [];
  }

  const results = await Promise.all(queries);
  for (const result of results) {
    if (result.error) {
      if (isMissingNotificationsSchemaError(result.error)) {
        console.warn('[Notifications] Notifications schema is not ready yet; returning empty notifications.', result.error);
        return [];
      }

      throw result.error;
    }
  }

  return dedupeNotifications(
    results.flatMap((result) => (result.data || []).map((row) => mapNotification(row as NotificationRow)))
  );
};

export const getUnreadNotificationCount = async (userId?: string | null, role?: UserRole | null): Promise<number> => {
  const notifications = await getNotificationsForUser(userId, role);
  return notifications.filter((notification) => !notification.isRead).length;
};

export const markNotificationRead = async (notificationId: string): Promise<void> => {
  const supabase = ensureSupabase();
  const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', notificationId);

  if (error) {
    if (isMissingNotificationsSchemaError(error)) {
      console.warn('[Notifications] Notifications schema is not ready yet; skipping mark as read.', error);
      return;
    }

    throw error;
  }

  console.log('[Notifications] Marked notification as read', { notificationId });
};

export const markAllNotificationsRead = async (userId?: string | null, role?: UserRole | null): Promise<void> => {
  const supabase = ensureSupabase();
  const updates: Array<Promise<any>> = [];

  if (role) {
    updates.push(
      supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('recipient_role', role)
        .eq('is_read', false)
    );
  }

  if (userId) {
    updates.push(
      supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('recipient_user_id', userId)
        .eq('is_read', false)
    );
  }

  if (updates.length === 0) {
    return;
  }

  const results = await Promise.all(updates);
  const failed = results.find((result) => result.error);
  if (failed?.error) {
    if (isMissingNotificationsSchemaError(failed.error)) {
      console.warn('[Notifications] Notifications schema is not ready yet; skipping mark all read.', failed.error);
      return;
    }

    throw failed.error;
  }

  console.log('[Notifications] Marked all notifications as read', { userId, role });
};
