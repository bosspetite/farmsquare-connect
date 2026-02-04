import { create } from 'zustand';
import { Order, OrderTracking, OrderStatus } from '@/types';
import { getAppState, setAppState, getOrdersByBuyerId, getOrdersByFarmerId, addOrder as addOrderToLocalStore, updateOrderStatus as updateOrderStatusInLocalStore } from '@/lib/store';

/**
 * Global Order Store - Single Source of Truth
 * All dashboards (Buyer, Farmer, Admin) read from and write to this store
 */
interface OrderStore {
  // State
  orders: Order[];
  trackingIntervals: Map<string, NodeJS.Timeout>; // Track active intervals
  
  // Actions
  refreshOrders: () => void;
  getOrderById: (orderId: string) => Order | undefined;
  getBuyerOrders: (buyerId: string) => Order[];
  getFarmerOrders: (farmerId: string) => Order[];
  getAllOrders: () => Order[];
  
  // Order mutations (these update localStorage and trigger re-renders)
  addOrder: (order: Omit<Order, 'id' | 'createdAt' | 'buyerLocation' | 'farmerLocation' | 'deliveryLocation' | 'tracking'>) => Order;
  updateOrderStatus: (orderId: string, status: OrderStatus, evidence?: any) => void;
  updateOrderTracking: (orderId: string, tracking: Partial<OrderTracking>) => void;
  
  // Tracking control
  startTracking: (orderId: string) => void;
  stopTracking: (orderId: string) => void;
  
  // Real-time sync helpers
  subscribe: (callback: () => void) => () => void;
}

export const useOrderStore = create<OrderStore>((set, get) => {
  // Initialize orders from localStorage
  const refreshOrders = () => {
    const state = getAppState();
    set({ orders: state.orders || [] });
  };

  // Get initial state from localStorage
  const initialState = (() => {
    try {
      const state = getAppState();
      return { orders: state.orders || [], trackingIntervals: new Map() };
    } catch {
      return { orders: [], trackingIntervals: new Map() };
    }
  })();

  return {
    ...initialState,
    
    refreshOrders,
    
    getOrderById: (orderId: string) => {
      // Always read fresh from localStorage to ensure we have latest data
      const state = getAppState();
      const order = state.orders.find(o => o.id === orderId);
      // Update store if order found and store is out of sync
      if (order) {
        const currentOrders = state.orders || [];
        if (JSON.stringify(currentOrders) !== JSON.stringify(get().orders)) {
          set({ orders: currentOrders });
        }
      }
      return order;
    },
    
    getBuyerOrders: (buyerId: string) => {
      // Always read fresh from localStorage to ensure consistency
      return getOrdersByBuyerId(buyerId);
    },
    
    getFarmerOrders: (farmerId: string) => {
      // Always read fresh from localStorage to ensure consistency
      return getOrdersByFarmerId(farmerId);
    },
    
    getAllOrders: () => {
      // Refresh from localStorage before returning to ensure we have latest data
      const state = getAppState();
      const currentOrders = state.orders || [];
      if (JSON.stringify(currentOrders) !== JSON.stringify(get().orders)) {
        set({ orders: currentOrders });
      }
      return get().orders;
    },
    
    addOrder: (orderData) => {
      // Use the imported function from store.ts
      const newOrder = addOrderToLocalStore(orderData);
      
      // Initialize tracking if locations are available
      if (newOrder.farmerLocation && newOrder.deliveryLocation) {
        const tracking: OrderTracking = {
          pickup: newOrder.farmerLocation,
          dropoff: newOrder.deliveryLocation,
          current: newOrder.farmerLocation, // Start at pickup
          isTracking: false,
          progressPct: 0,
        };
        
        const state = getAppState();
        const orderIndex = state.orders.findIndex(o => o.id === newOrder.id);
        if (orderIndex !== -1) {
          state.orders[orderIndex] = {
            ...state.orders[orderIndex],
            tracking,
          };
          setAppState(state);
        }
      }
      
      // Refresh orders from localStorage
      refreshOrders();
      
      return newOrder;
    },
    
    updateOrderStatus: (orderId: string, status: OrderStatus, evidence?: any) => {
      // Use the imported function from store.ts
      updateOrderStatusInLocalStore(orderId, status, evidence);
      
      // Refresh orders from localStorage
      refreshOrders();
      
      // Dispatch event for real-time sync
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('farmsquare:order-updated', {
          detail: { orderId, status }
        }));
      }
    },
    
    updateOrderTracking: (orderId: string, tracking: Partial<OrderTracking>) => {
      const state = getAppState();
      const orderIndex = state.orders.findIndex(o => o.id === orderId);
      
      if (orderIndex !== -1) {
        const order = state.orders[orderIndex];
        state.orders[orderIndex] = {
          ...order,
          tracking: {
            ...order.tracking,
            ...tracking,
          } as OrderTracking,
        };
        
        setAppState(state);
        refreshOrders();
        
        // Dispatch event for real-time sync
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('farmsquare:tracking-updated', {
            detail: { orderId, tracking }
          }));
        }
      }
    },
    
    startTracking: (orderId: string) => {
      // Stop any existing tracking for this order
      get().stopTracking(orderId);
      
      const state = getAppState();
      const order = state.orders.find(o => o.id === orderId);
      
      if (!order || !order.tracking) {
        console.warn(`Cannot start tracking: Order ${orderId} missing tracking data`);
        return;
      }
      
      const { pickup, dropoff } = order.tracking;
      if (!pickup || !dropoff) {
        console.warn(`Cannot start tracking: Order ${orderId} missing pickup or dropoff location`);
        return;
      }
      
      // Set isTracking to true
      get().updateOrderTracking(orderId, {
        isTracking: true,
        current: pickup, // Start at pickup
        progressPct: 0,
        lastUpdatedAt: new Date().toISOString(),
      });
      
      // Calculate movement increment
      const totalLat = dropoff.lat - pickup.lat;
      const totalLng = dropoff.lng - pickup.lng;
      const steps = 50; // Number of steps to reach destination
      const latIncrement = totalLat / steps;
      const lngIncrement = totalLng / steps;
      
      let currentStep = 0;
      
      // Start interval (2-3 seconds)
      const interval = setInterval(() => {
        currentStep++;
        const progress = Math.min(currentStep / steps, 1);
        
        const newCurrent = {
          lat: pickup.lat + (latIncrement * currentStep),
          lng: pickup.lng + (lngIncrement * currentStep),
        };
        
        get().updateOrderTracking(orderId, {
          current: newCurrent,
          progressPct: Math.round(progress * 100),
          lastUpdatedAt: new Date().toISOString(),
        });
        
        // When progress reaches 100%
        if (progress >= 1) {
          get().stopTracking(orderId);
          
          // Update order status based on current status
          const currentOrder = get().getOrderById(orderId);
          if (currentOrder) {
            if (currentOrder.status === 'PickupScheduled') {
              get().updateOrderStatus(orderId, 'InTransit');
            } else if (currentOrder.status === 'InTransit') {
              get().updateOrderStatus(orderId, 'Delivered');
            }
          }
        }
      }, 2500); // Update every 2.5 seconds
      
      // Store interval
      const intervals = get().trackingIntervals;
      intervals.set(orderId, interval);
      set({ trackingIntervals: intervals });
    },
    
    stopTracking: (orderId: string) => {
      const intervals = get().trackingIntervals;
      const interval = intervals.get(orderId);
      
      if (interval) {
        clearInterval(interval);
        intervals.delete(orderId);
        set({ trackingIntervals: intervals });
      }
      
      // Set isTracking to false but keep current location
      get().updateOrderTracking(orderId, {
        isTracking: false,
      });
    },
    
    subscribe: (callback: () => void) => {
      // Subscribe to order changes
      const handleChange = () => {
        callback();
      };
      
      if (typeof window !== 'undefined') {
        window.addEventListener('farmsquare:order-created', handleChange);
        window.addEventListener('farmsquare:state-changed', handleChange);
        window.addEventListener('farmsquare:order-updated', handleChange);
        window.addEventListener('farmsquare:tracking-updated', handleChange);
      }
      
      // Return unsubscribe function
      return () => {
        if (typeof window !== 'undefined') {
          window.removeEventListener('farmsquare:order-created', handleChange);
          window.removeEventListener('farmsquare:state-changed', handleChange);
          window.removeEventListener('farmsquare:order-updated', handleChange);
          window.removeEventListener('farmsquare:tracking-updated', handleChange);
        }
      };
    },
  };
});

