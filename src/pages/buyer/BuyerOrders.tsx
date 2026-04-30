import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, MapPin, ShoppingCart } from 'lucide-react';
import { BuyerLayout } from '@/components/layouts/BuyerLayout';
import { StatusPill } from '@/components/ui/StatusPill';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuth } from '@/hooks/useAuth';
import { formatNaira, formatTimeAgo } from '@/lib/store';
import { Order, OrderStatus } from '@/types';
import { getProduceImage } from '@/utils/produceImages';
import { getBuyerOrders } from '@/services/orderService';

const statusFilters: (OrderStatus | 'All')[] = ['All', 'Paid', 'Accepted', 'Processing', 'InTransit', 'Delivered', 'Disputed', 'Cancelled'];

const BuyerOrders = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeFilter, setActiveFilter] = useState<OrderStatus | 'All'>('All');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadOrders = async () => {
    if (!user) {
      return;
    }

    try {
      setIsLoading(true);
      setLoadError(null);
      const orderRows = await getBuyerOrders(user.id);
      setOrders(orderRows);
    } catch (error: any) {
      setLoadError(error?.message || 'Unable to load your orders right now.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadOrders();
  }, [user?.id]);

  const filteredOrders = useMemo(
    () => (activeFilter === 'All' ? orders : orders.filter((order) => order.status === activeFilter)),
    [orders, activeFilter]
  );

  const stats = {
    all: orders.length,
    pending: orders.filter((order) => order.status === 'Paid').length,
    active: orders.filter((order) => !['Delivered', 'Cancelled', 'Rejected', 'Refunded'].includes(order.status)).length,
    delivered: orders.filter((order) => order.status === 'Delivered').length,
  };

  return (
    <BuyerLayout>
      <div className="space-y-6 animate-fade-up">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground mb-2">My Orders</h1>
          <p className="text-muted-foreground">Track and manage your produce orders</p>
        </div>

        {loadError && (
          <div className="farm-card bg-destructive/5 border-destructive/20">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                <div>
                  <p className="font-semibold text-foreground">Orders unavailable</p>
                  <p className="text-sm text-muted-foreground">{loadError}</p>
                </div>
              </div>
              <button
                onClick={() => void loadOrders()}
                className="px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold min-h-[44px] active:scale-[0.98]"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="farm-card text-center">
            <p className="text-2xl font-semibold text-foreground">{stats.all}</p>
            <p className="text-sm sm:text-base text-muted-foreground">Total Orders</p>
          </div>
          <div className="farm-card text-center">
            <p className="text-2xl font-semibold text-farm-warning">{stats.pending}</p>
            <p className="text-sm sm:text-base text-muted-foreground">Paid</p>
          </div>
          <div className="farm-card text-center">
            <p className="text-2xl font-semibold text-farm-info">{stats.active}</p>
            <p className="text-sm sm:text-base text-muted-foreground">Active</p>
          </div>
          <div className="farm-card text-center">
            <p className="text-2xl font-semibold text-farm-success">{stats.delivered}</p>
            <p className="text-sm sm:text-base text-muted-foreground">Delivered</p>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          {statusFilters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-2 rounded-full text-sm sm:text-base font-medium whitespace-nowrap transition-all ${
                activeFilter === filter ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground hover:border-primary/50'
              }`}
            >
              {filter === 'All' ? 'All' : filter === 'InTransit' ? 'Out for Delivery' : filter}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="farm-card">
                <div className="h-24 bg-muted rounded-xl animate-pulse" />
              </div>
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <EmptyState
            icon={ShoppingCart}
            title="No orders yet"
            description="Browse the marketplace to place your first order"
            action={{ label: 'Browse Marketplace', onClick: () => navigate('/buyer/marketplace') }}
          />
        ) : (
          <div className="space-y-3">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                onClick={() => navigate(`/buyer/orders/${order.id}`)}
                className="flex items-center gap-4 p-4 bg-white dark:bg-card border border-border rounded-xl hover:border-primary/20 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                  <img
                    src={order.listingPhotos && order.listingPhotos.length > 0 ? order.listingPhotos[0] : getProduceImage(order.commodity)}
                    alt={order.commodity}
                    className="w-full h-full object-cover"
                    onError={(event) => {
                      event.currentTarget.src = getProduceImage(order.commodity);
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-base sm:text-lg text-foreground">{order.commodity}</h3>
                    <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs sm:text-sm font-medium">
                      {order.quantityKg}kg
                    </span>
                  </div>
                  <p className="text-sm sm:text-base text-muted-foreground mb-1">{order.farmerName}</p>
                  <div className="flex items-center gap-3 text-xs sm:text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {order.pickupLocation}
                    </span>
                    <span>-</span>
                    <span>{formatTimeAgo(order.createdAt)}</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-semibold text-foreground mb-2">{formatNaira(order.amount)}</p>
                  <p className="text-xs text-muted-foreground mb-1">{order.paymentStatus || 'Unpaid'}</p>
                  <StatusPill status={order.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </BuyerLayout>
  );
};

export default BuyerOrders;
