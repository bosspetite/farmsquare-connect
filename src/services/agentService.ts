import { Order, User } from '@/types';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';
import { getAccessibleOrders, getOrderById, updateOrderStatus } from '@/services/orderService';

interface FarmerProfileRow {
  id: string;
  full_name: string;
  email: string | null;
  phone: string;
  role: 'farmer';
  kyc_status: User['kycStatus'];
  state: string | null;
  created_at: string;
}

export interface AgentFarmerSummary extends User {
  email?: string;
}

export interface AgentDashboardStats {
  totalFarmers: number;
  farmersThisMonth: number;
  inspectionsToday: number;
  completedInspections: number;
  readyForVerification: number;
}

interface FieldAgentReportRow {
  id: string;
  agent_id: string;
  order_id: string | null;
  report_type: string;
  notes: string | null;
  photos: string[] | null;
  created_at: string;
}

export interface AgentReport {
  id: string;
  orderId?: string;
  reportType: string;
  notes?: string;
  photos: string[];
  createdAt: string;
}

const ensureSupabase = () => {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is required for agent data.');
  }

  return getSupabaseClient();
};

const normalizeStatus = (status: User['kycStatus']) => (status === 'IN_REVIEW' ? 'PENDING' : status);

const mapFarmer = (profile: FarmerProfileRow): AgentFarmerSummary => ({
  id: profile.id,
  name: profile.full_name,
  email: profile.email || undefined,
  phone: profile.phone,
  role: 'farmer',
  region: profile.state || 'Lagos',
  kycStatus: normalizeStatus(profile.kyc_status),
  createdAt: profile.created_at,
});

export const getFarmersForAgent = async (_agentId?: string): Promise<AgentFarmerSummary[]> => {
  const supabase = ensureSupabase();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, phone, role, kyc_status, state, created_at')
    .eq('role', 'farmer')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return ((data || []) as FarmerProfileRow[]).map(mapFarmer);
};

const getOrdersForAgent = async (): Promise<Order[]> => {
  return getAccessibleOrders();
};

export const getPendingInspections = async (_agentId?: string): Promise<Order[]> => {
  const orders = await getOrdersForAgent();
  return orders.filter((order) => ['Pending', 'Accepted', 'Processing', 'PickupScheduled', 'InTransit', 'Delivered'].includes(order.status));
};

export const getDeliveries = async (_agentId?: string): Promise<Order[]> => {
  const orders = await getOrdersForAgent();
  return orders.filter((order) => ['Accepted', 'Processing', 'PickupScheduled', 'InTransit'].includes(order.status));
};

const createEvidencePath = (agentId: string, orderId: string, file: File) => {
  const extension = file.name.includes('.') ? file.name.split('.').pop() : 'jpg';
  return `${agentId}/${orderId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
};

const uploadInspectionEvidence = async (agentId: string, orderId: string, files: File[]) => {
  if (files.length === 0) {
    return [];
  }

  const supabase = ensureSupabase();

  return Promise.all(
    files.map(async (file) => {
      const path = createEvidencePath(agentId, orderId, file);
      const { error } = await supabase.storage.from('inspection-evidence').upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      });

      if (error) {
        throw error;
      }

      return path;
    })
  );
};

const getSignedInspectionUrls = async (paths: string[]) => {
  if (paths.length === 0) {
    return [];
  }

  const supabase = ensureSupabase();
  const signedUrls = await Promise.all(
    paths.map(async (path) => {
      const { data, error } = await supabase.storage.from('inspection-evidence').createSignedUrl(path, 60 * 60);
      if (error) {
        throw error;
      }

      return data.signedUrl;
    })
  );

  return signedUrls;
};

export const getInspectionReportsForOrder = async (orderId: string): Promise<AgentReport[]> => {
  const supabase = ensureSupabase();
  const { data, error } = await supabase
    .from('field_agent_reports')
    .select('id, agent_id, order_id, report_type, notes, photos, created_at')
    .eq('order_id', orderId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  const reports = (data || []) as FieldAgentReportRow[];
  return Promise.all(
    reports.map(async (report) => ({
      id: report.id,
      orderId: report.order_id || undefined,
      reportType: report.report_type,
      notes: report.notes || undefined,
      photos: await getSignedInspectionUrls(report.photos || []),
      createdAt: report.created_at,
    }))
  );
};

export const submitInspectionReport = async ({
  agentId,
  orderId,
  reportType,
  notes,
  files,
  nextStatus,
}: {
  agentId: string;
  orderId: string;
  reportType: 'inspection' | 'delivery_update';
  notes?: string;
  files: File[];
  nextStatus: Order['status'];
}) => {
  const supabase = ensureSupabase();
  const uploadedPaths = await uploadInspectionEvidence(agentId, orderId, files);

  const { error } = await supabase.from('field_agent_reports').insert({
    agent_id: agentId,
    order_id: orderId,
    report_type: reportType,
    notes: notes || null,
    photos: uploadedPaths,
  });

  if (error) {
    throw error;
  }

  await updateOrderStatus(orderId, nextStatus);
};

export const getAgentOrderById = async (orderId: string) => {
  return getOrderById(orderId);
};

export const getAgentDashboardStats = async (agentId: string): Promise<AgentDashboardStats> => {
  const [farmers, orders] = await Promise.all([getFarmersForAgent(agentId), getOrdersForAgent()]);
  const now = new Date();

  return {
    totalFarmers: farmers.length,
    farmersThisMonth: farmers.filter((farmer) => {
      const createdAt = new Date(farmer.createdAt);
      return createdAt.getMonth() === now.getMonth() && createdAt.getFullYear() === now.getFullYear();
    }).length,
    inspectionsToday: orders.filter((order) => ['Pending', 'Accepted'].includes(order.status)).length,
    completedInspections: orders.filter((order) => order.status === 'Delivered').length,
    readyForVerification: orders.filter((order) => ['PickupScheduled', 'InTransit'].includes(order.status)).length,
  };
};

export const getAgentNotifications = async (agentId: string) => {
  const [stats] = await Promise.all([getAgentDashboardStats(agentId)]);
  const notifications: Array<{
    id: string;
    type: 'inspection' | 'order' | 'farmer';
    title: string;
    message: string;
    timestamp: string;
    read: boolean;
    link?: string;
  }> = [];

  if (stats.inspectionsToday > 0) {
    notifications.push({
      id: 'pending_inspections',
      type: 'inspection',
      title: `${stats.inspectionsToday} inspection task${stats.inspectionsToday === 1 ? '' : 's'} pending`,
      message: 'Orders are waiting for field verification.',
      timestamp: new Date().toISOString(),
      read: false,
      link: '/agent/inspections',
    });
  }

  if (stats.readyForVerification > 0) {
    notifications.push({
      id: 'ready_delivery',
      type: 'order',
      title: `${stats.readyForVerification} delivery task${stats.readyForVerification === 1 ? '' : 's'} active`,
      message: 'Track pickup and in-transit deliveries from live order data.',
      timestamp: new Date().toISOString(),
      read: false,
      link: '/agent/deliveries',
    });
  }

  return notifications;
};
