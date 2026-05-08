import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, MapPin, Shield, ShoppingCart, User, X, ZoomIn } from 'lucide-react';
import { BuyerLayout } from '@/components/layouts/BuyerLayout';
import { Modal } from '@/components/ui/Modal';
import { formatNaira } from '@/lib/store';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { getProduceImage } from '@/utils/produceImages';
import PaymentGateway from './PaymentGateway';
import { Listing } from '@/types';
import { getMarketplaceListingById } from '@/services/listingService';
import { createPendingOrder, discardPendingOrder, markOrderPaid } from '@/services/orderService';

const withTimeout = async <T,>(promise: Promise<T>, timeoutMs: number, timeoutMessage: string): Promise<T> => {
  let timeoutHandle: number | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutHandle = window.setTimeout(() => {
      reject(new Error(timeoutMessage));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutHandle) {
      window.clearTimeout(timeoutHandle);
    }
  }
};

const BuyerListingDetail = () => {
  const { listingId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isVerified = user?.kycStatus === 'APPROVED';

  const [listing, setListing] = useState<Listing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showPaymentGateway, setShowPaymentGateway] = useState(false);
  const [quantity, setQuantity] = useState('');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [listingBlockedReason, setListingBlockedReason] = useState<string | null>(null);
  const isMobileCheckout = typeof window !== 'undefined' ? window.matchMedia('(max-width: 640px)').matches : false;

  const loadListing = async () => {
    if (!listingId) {
      setLoadError('Listing not found');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setLoadError(null);
      setListingBlockedReason(null);
      const marketplaceListing = await getMarketplaceListingById(listingId);
      setListing(marketplaceListing);
    } catch (error: any) {
      setLoadError(error?.message || 'Unable to load this listing right now.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadListing();
  }, [listingId]);

  const handleCheckout = () => {
    if (!listing || !user || !quantity) return;

    if (!isVerified) {
      toast({
        title: 'Verification Required',
        description: 'Please complete your KYC/KYB verification to place orders',
        variant: 'destructive',
      });
      navigate('/buyer/kyc');
      return;
    }

    const qty = parseFloat(quantity);
    if (!Number.isFinite(qty) || qty <= 0) {
      toast({
        title: 'Invalid quantity',
        description: 'Please enter a valid quantity greater than 0kg.',
        variant: 'destructive',
      });
      return;
    }

    if (listing.minOrderKg && qty < listing.minOrderKg) {
      toast({
        title: 'Minimum order not met',
        description: `Minimum order quantity is ${listing.minOrderKg}kg`,
        variant: 'destructive',
      });
      return;
    }

    if (listingBlockedReason) {
      toast({
        title: 'Order unavailable',
        description: listingBlockedReason,
        variant: 'destructive',
      });
      return;
    }

    console.log('[BuyerListingDetail] ORDER FLOW STARTED', {
      isMobileCheckout,
      listingId: listing.id,
      commodity: listing.commodity,
      enteredQuantity: qty,
      listedStockKg: listing.quantityKg,
      totalAmount: qty * listing.pricePerKg,
      buyerId: user.id,
      buyerEmail: user.email,
    });
    setShowCheckout(false);
    setTimeout(() => setShowPaymentGateway(true), 300);
  };

  const handlePrepareOrder = async (reference: string) => {
    if (!listing || !user || !quantity) {
      throw new Error('Order details are missing.');
    }

    setIsCreatingOrder(true);
    console.log('[BuyerListingDetail] Creating pending order before payment', {
      isMobileCheckout,
      listingId: listing.id,
      buyerId: user.id,
      buyerEmail: user.email,
      farmerId: listing.farmerId,
      requestedQuantity: parseFloat(quantity),
      totalAmount: parseFloat(quantity) * listing.pricePerKg,
      amountInKobo: Math.round(parseFloat(quantity) * listing.pricePerKg * 100),
      paymentReference: reference,
      paymentStatusValue: 'Unpaid',
      orderStatusValue: 'Pending',
    });

    try {
      const pendingOrder = await withTimeout(
        createPendingOrder({
          listingId: listing.id,
          quantityKg: parseFloat(quantity),
          paymentMethod: 'paystack',
          paymentReference: reference,
          buyerId: user.id,
          buyerName: user.name,
          farmerId: listing.farmerId,
          farmerName: listing.farmerName,
          commodity: listing.commodity,
          grade: listing.grade,
          listingRegion: listing.region,
          listingPhotos: listing.photos,
          pickupLocation: listing.locationLabel,
          pricePerKg: listing.pricePerKg,
        }),
        15000,
        'Order could not be created. Please try again.'
      );

      console.log('[BuyerListingDetail] Pending order created', {
        orderId: pendingOrder.id,
        paymentReference: reference,
      });

      return pendingOrder.id;
    } catch (error: any) {
      const errorMessage = error?.message || '';
      if (
        typeof errorMessage === 'string' &&
        (errorMessage.toLowerCase().includes('not currently linked to a valid farmer') ||
          errorMessage.toLowerCase().includes('not currently linked to a valid seller'))
      ) {
        setListingBlockedReason(errorMessage);
      }
      console.error('[BuyerListingDetail] Failed to create pending order', {
        isMobileCheckout,
        listingId: listing.id,
        buyerId: user.id,
        paymentReference: reference,
        error,
      });
      throw error;
    }
  };

  const handlePaymentSuccess = async (orderId: string, reference: string) => {
    if (!listing || !user || !quantity) {
      throw new Error('Order details are missing.');
    }

    try {
      console.log('[BuyerListingDetail] Updating order after payment success', {
        isMobileCheckout,
        orderId,
        listingId: listing.id,
        buyerId: user.id,
        farmerId: listing.farmerId,
        quantity,
      paymentReference: reference,
      paymentStatusValue: 'Paid',
      orderStatusValue: 'Paid',
    });

      const updatedOrder = await withTimeout(
        markOrderPaid(orderId, reference),
        20000,
        'We could not verify this transaction. Please try again or contact support.'
      );

      console.log('[BuyerListingDetail] Order update after payment succeeded', {
        orderId: updatedOrder.id,
        farmerId: updatedOrder.farmerId,
        buyerId: updatedOrder.buyerId,
        paymentStatus: updatedOrder.paymentStatus,
        orderStatus: updatedOrder.status,
      });

      setShowPaymentGateway(false);
      setQuantity('');
      toast({ title: 'Payment successful.' });
      setTimeout(() => navigate('/buyer/orders'), 500);
    } catch (error: any) {
      console.error('[BuyerListingDetail] Failed to update order after payment', {
        isMobileCheckout,
        orderId,
        listingId: listing.id,
        buyerId: user.id,
        paymentReference: reference,
        error,
      });
      toast({
        title: 'Payment completed, but order update failed.',
        description: 'Please contact support with your reference.',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsCreatingOrder(false);
      await loadListing();
    }
  };

  const handleDiscardPendingOrder = async (orderId: string) => {
    try {
      console.log('[BuyerListingDetail] Discarding pending order', {
        isMobileCheckout,
        orderId,
      });
      await discardPendingOrder(orderId);
    } catch (error) {
      console.error('[BuyerListingDetail] Failed to discard pending order', {
        isMobileCheckout,
        orderId,
        error,
      });
    } finally {
      setIsCreatingOrder(false);
      await loadListing();
    }
  };

  const totalAmount = listing && quantity ? parseFloat(quantity) * listing.pricePerKg : 0;

  if (isLoading) {
    return (
      <BuyerLayout>
        <div className="space-y-6 animate-fade-up max-w-2xl mx-auto">
          <button onClick={() => navigate('/buyer/marketplace')} className="flex items-center gap-2 text-muted-foreground mb-2 min-h-[44px] active:scale-[0.98]">
            <ArrowLeft className="w-5 h-5" /> Back to Marketplace
          </button>
          <div className="farm-card">
            <div className="h-80 rounded-2xl bg-muted animate-pulse mb-4" />
            <div className="space-y-3">
              <div className="h-6 bg-muted rounded animate-pulse" />
              <div className="h-4 bg-muted rounded animate-pulse w-2/3" />
              <div className="h-12 bg-muted rounded animate-pulse" />
            </div>
          </div>
        </div>
      </BuyerLayout>
    );
  }

  if (!listing || loadError) {
    return (
      <BuyerLayout>
        <div className="space-y-6 animate-fade-up max-w-2xl mx-auto">
          <button onClick={() => navigate('/buyer/marketplace')} className="flex items-center gap-2 text-muted-foreground mb-2 min-h-[44px] active:scale-[0.98]">
            <ArrowLeft className="w-5 h-5" /> Back to Marketplace
          </button>
          <div className="farm-card bg-destructive/5 border-destructive/20 text-center py-12">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <p className="text-foreground font-semibold mb-2">Listing unavailable</p>
            <p className="text-muted-foreground mb-4">{loadError || 'Listing not found'}</p>
            <button
              onClick={loadListing}
              className="px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold"
            >
              Retry
            </button>
          </div>
        </div>
      </BuyerLayout>
    );
  }

  return (
    <BuyerLayout>
      <div className="space-y-6 animate-fade-up max-w-2xl mx-auto">
        <button onClick={() => navigate('/buyer/marketplace')} className="flex items-center gap-2 text-muted-foreground mb-2 min-h-[44px] active:scale-[0.98]">
          <ArrowLeft className="w-5 h-5" /> Back to Marketplace
        </button>

        {listingBlockedReason && (
          <div className="farm-card bg-destructive/5 border-destructive/20">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-foreground">Listing owner needs repair</p>
                <p className="text-sm text-muted-foreground">{listingBlockedReason}</p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <div
            className="w-full h-80 rounded-2xl bg-muted flex items-center justify-center overflow-hidden relative group cursor-pointer"
            onClick={() => listing.photos.length > 0 && setShowImageModal(true)}
          >
            <img
              src={listing.photos.length > 0 ? listing.photos[selectedImageIndex] : getProduceImage(listing.commodity)}
              alt={listing.commodity}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
              onError={(event) => {
                event.currentTarget.src = getProduceImage(listing.commodity);
              }}
            />
            {listing.photos.length > 1 && (
              <div className="absolute top-4 right-4 px-3 py-1.5 bg-background/90 backdrop-blur-sm rounded-lg text-sm font-medium text-foreground shadow-lg">
                {selectedImageIndex + 1} / {listing.photos.length}
              </div>
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
              <div className="px-4 py-2 bg-background/90 backdrop-blur-sm rounded-xl flex items-center gap-2">
                <ZoomIn className="w-5 h-5 text-foreground" />
                <span className="text-sm font-medium text-foreground">Click to view full size</span>
              </div>
            </div>
          </div>

          {listing.photos.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {listing.photos.map((photo, index) => (
                <div
                  key={index}
                  className={`w-20 h-20 rounded-xl bg-muted flex-shrink-0 overflow-hidden border-2 transition-all cursor-pointer ${
                    selectedImageIndex === index ? 'border-primary scale-105' : 'border-transparent hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedImageIndex(index)}
                >
                  <img
                    src={photo || getProduceImage(listing.commodity)}
                    alt={`${listing.commodity} ${index + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(event) => {
                      event.currentTarget.src = getProduceImage(listing.commodity);
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {showImageModal && (
          <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4" onClick={() => setShowImageModal(false)}>
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-background/20 backdrop-blur-sm flex items-center justify-center text-foreground hover:bg-background/40 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="relative max-w-4xl w-full max-h-[90vh] flex items-center justify-center">
              <img
                src={listing.photos.length > 0 ? listing.photos[selectedImageIndex] : getProduceImage(listing.commodity)}
                alt={listing.commodity}
                className="max-w-full max-h-[90vh] object-contain rounded-xl"
                onClick={(event) => event.stopPropagation()}
                onError={(event) => {
                  event.currentTarget.src = getProduceImage(listing.commodity);
                }}
              />
            </div>
          </div>
        )}

        <div className="farm-card">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground">{listing.commodity}</h1>
              <p className="text-muted-foreground">{listing.quantityKg}kg listed by seller</p>
            </div>
            <span className="px-3 py-1.5 bg-primary/10 text-primary rounded-xl text-sm font-medium">
              Grade {listing.grade}
            </span>
          </div>
          <p className="text-3xl font-bold text-primary mb-4">{formatNaira(listing.pricePerKg)}/kg</p>

          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <MapPin className="w-4 h-4" />
            <span>{listing.locationLabel}, {listing.region}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <User className="w-4 h-4" />
            <span>{listing.farmerName}</span>
          </div>
        </div>

        {!isVerified && (
          <div className="farm-card bg-farm-warning/10 border-farm-warning/20">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-farm-warning" />
              <div className="flex-1">
                <p className="font-semibold text-foreground">Verification Required</p>
                <p className="text-sm text-muted-foreground mb-3">
                  Complete your KYC/KYB verification to place orders
                </p>
                <button
                  onClick={() => navigate('/buyer/kyc')}
                  className="px-4 py-2.5 bg-farm-warning text-white rounded-lg text-sm font-semibold min-h-[44px] active:scale-[0.98]"
                >
                  Verify Now
                </button>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={() => {
            if (!isVerified) {
              toast({
                title: 'Verification Required',
                description: 'Please complete your KYC/KYB verification to place orders',
                variant: 'destructive',
              });
              navigate('/buyer/kyc');
              return;
            }
            if (listingBlockedReason) {
              toast({
                title: 'Order unavailable',
                description: listingBlockedReason,
                variant: 'destructive',
              });
              return;
            }
            setShowCheckout(true);
          }}
          disabled={!isVerified || isCreatingOrder || Boolean(listingBlockedReason)}
          className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-semibold btn-glow flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed min-h-[52px] active:scale-[0.98]"
        >
          <ShoppingCart className="w-5 h-5" />
          {isCreatingOrder ? 'Creating Order...' : isVerified ? 'Place Order' : 'Verification Required'}
        </button>

        <Modal isOpen={showCheckout} onClose={() => setShowCheckout(false)} title="Place Order">
          <div className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-xl">
              <p className="font-semibold text-foreground">{listing.commodity} (Grade {listing.grade})</p>
              <p className="text-sm text-muted-foreground">{formatNaira(listing.pricePerKg)}/kg</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Quantity (kg)</label>
              <input
                type="number"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                placeholder="Enter quantity"
                min={listing.minOrderKg || 1}
                step="0.01"
                className="w-full px-4 py-4 bg-muted border border-border rounded-xl text-foreground min-h-[52px] focus:outline-none focus:ring-2 focus:ring-primary text-base"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {listing.minOrderKg ? `Min: ${listing.minOrderKg}kg • ` : ''}Enter the quantity you would like to request. The farmer or admin will confirm availability before fulfillment.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Listed stock is informational only and will not block your request at this stage.
              </p>
            </div>

            {quantity && (
              <div className="p-4 bg-primary/10 rounded-xl">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="text-foreground">{formatNaira(totalAmount)}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span className="text-foreground">Total</span>
                  <span className="text-primary">{formatNaira(totalAmount)}</span>
                </div>
              </div>
            )}

            <button
              onClick={handleCheckout}
              disabled={!quantity || !Number.isFinite(parseFloat(quantity)) || parseFloat(quantity) <= 0}
              className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed min-h-[52px] active:scale-[0.98]"
            >
              Proceed to Payment
            </button>
          </div>
        </Modal>

        {showPaymentGateway && quantity && (
          <PaymentGateway
            amount={parseFloat(quantity) * listing.pricePerKg}
            orderDetails={{
              commodity: listing.commodity,
              quantity: parseFloat(quantity),
              farmerName: listing.farmerName,
            }}
            onPrepareOrder={handlePrepareOrder}
            onSuccess={handlePaymentSuccess}
            onDiscardPendingOrder={handleDiscardPendingOrder}
            onCancel={() => setShowPaymentGateway(false)}
          />
        )}
      </div>
    </BuyerLayout>
  );
};

export default BuyerListingDetail;

