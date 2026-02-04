import { Modal } from '@/components/ui/Modal';
import { DeliveryMap } from './DeliveryMap';
import { useDeliveryTracking } from './useDeliveryTracking';
import { getNigerianCityCoords } from './mockLocationStream';
import { X } from 'lucide-react';

interface DeliveryTrackingModalProps {
  orderId: string;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Modal component for delivery tracking
 */
export const DeliveryTrackingModal: React.FC<DeliveryTrackingModalProps> = ({
  orderId,
  isOpen,
  onClose,
}) => {
  const { trackingData, order, listing } = useDeliveryTracking(orderId);

  if (!order || !listing) {
    return null;
  }

  const origin = getNigerianCityCoords(listing.region || order.pickupLocation);
  const destination = getNigerianCityCoords('Lagos'); // Default destination

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Track Delivery" className="max-w-4xl">
      <div className="space-y-4">
        {/* Map */}
        <div className="h-[500px] sm:h-[600px] rounded-xl overflow-hidden">
          <DeliveryMap
            origin={origin}
            destination={destination}
            currentLocation={trackingData.currentLocation}
            orderInfo={{
              commodity: order.commodity,
              quantity: `${order.quantityKg}kg`,
              status: order.status === 'InTransit' ? 'In Transit' : order.status,
              eta: trackingData.eta,
              distanceRemaining: trackingData.distanceRemaining,
            }}
            className="h-full"
          />
        </div>

        {/* Progress Bar */}
        {order.status === 'InTransit' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Delivery Progress</span>
              <span className="font-semibold text-primary">
                {Math.round(trackingData.progress * 100)}%
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div
                className="bg-primary h-full transition-all duration-500 ease-out"
                style={{ width: `${trackingData.progress * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};











