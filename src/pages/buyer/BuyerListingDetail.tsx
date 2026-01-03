import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, User, Package, ShoppingCart, ZoomIn, X } from 'lucide-react';
import { BuyerLayout } from '@/components/layouts/BuyerLayout';
import { Modal } from '@/components/ui/Modal';
import { getAppState, formatNaira, addOrder, setAppState, getWalletByUserId } from '@/lib/store';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const BuyerListingDetail = () => {
  const { listingId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const state = getAppState();
  const listing = state.listings.find(l => l.id === listingId);
  
  const [showCheckout, setShowCheckout] = useState(false);
  const [quantity, setQuantity] = useState('');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);

  if (!listing) {
    return (
      <BuyerLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Listing not found</p>
        </div>
      </BuyerLayout>
    );
  }

  const handleOrder = () => {
    if (!user || !quantity) return;
    const qty = parseInt(quantity);
    
    // Validate quantity
    if (qty <= 0 || qty > listing.quantityKg) {
      toast({ 
        title: 'Invalid quantity', 
        description: `Please enter a quantity between 1 and ${listing.quantityKg}kg`,
        variant: 'destructive'
      });
      return;
    }
    
    // Check buyer wallet balance
    const buyerWallet = state.wallets.find(w => w.userId === user.id);
    const amount = qty * listing.pricePerKg;
    
    if (!buyerWallet || buyerWallet.available < amount) {
      toast({ 
        title: 'Insufficient balance', 
        description: 'Please add funds to your wallet',
        variant: 'destructive'
      });
      return;
    }
    
    // Use shared store helper to add order (handles wallet updates)
    addOrder({
      buyerId: user.id,
      buyerName: user.name,
      farmerId: listing.farmerId,
      farmerName: listing.farmerName,
      listingId: listing.id,
      commodity: listing.commodity,
      quantityKg: qty,
      pricePerKg: listing.pricePerKg,
      amount,
      status: 'Pending' as const,
      pickupLocation: listing.locationLabel,
    });
    
    // Update listing quantity
    const listingIndex = state.listings.findIndex(l => l.id === listing.id);
    if (listingIndex !== -1) {
      state.listings[listingIndex].quantityKg -= qty;
      if (state.listings[listingIndex].quantityKg <= 0) {
        state.listings[listingIndex].status = 'Sold';
      }
      setAppState(state);
    }
    
    setShowCheckout(false);
    toast({ title: 'Order placed successfully!' });
    navigate('/buyer/orders');
  };

  const totalAmount = quantity ? parseInt(quantity) * listing.pricePerKg : 0;

  return (
    <BuyerLayout>
      <div className="space-y-6 animate-fade-up max-w-2xl mx-auto">
        <button onClick={() => navigate('/buyer/marketplace')} className="flex items-center gap-2 text-muted-foreground">
          <ArrowLeft className="w-5 h-5" /> Back to Marketplace
        </button>

        {/* Image Gallery */}
        <div className="space-y-3">
          {/* Main Image */}
          <div 
            className="w-full h-80 rounded-2xl bg-muted flex items-center justify-center overflow-hidden relative group cursor-pointer"
            onClick={() => listing.photos && listing.photos.length > 0 && setShowImageModal(true)}
          >
            {listing.photos && listing.photos.length > 0 && listing.photos[selectedImageIndex] ? (
              <>
                <img 
                  src={listing.photos[selectedImageIndex]} 
                  alt={listing.commodity} 
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const parent = e.currentTarget.parentElement;
                    if (parent && !parent.querySelector('.fallback-emoji')) {
                      const fallback = document.createElement('div');
                      fallback.className = 'fallback-emoji w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5';
                      const emoji = listing.commodity === 'Maize' ? '🌽' : listing.commodity === 'Rice' ? '🌾' : listing.commodity === 'Cassava' ? '🥔' : listing.commodity === 'Yam' ? '🍠' : '🌾';
                      fallback.innerHTML = `<span class="text-7xl">${emoji}</span>`;
                      parent.appendChild(fallback);
                    }
                  }}
                />
                {/* Image count badge */}
                {listing.photos.length > 1 && (
                  <div className="absolute top-4 right-4 px-3 py-1.5 bg-background/90 backdrop-blur-sm rounded-lg text-sm font-medium text-foreground shadow-lg">
                    {selectedImageIndex + 1} / {listing.photos.length}
                  </div>
                )}
                {/* Zoom icon on hover */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="px-4 py-2 bg-background/90 backdrop-blur-sm rounded-xl flex items-center gap-2">
                    <ZoomIn className="w-5 h-5 text-foreground" />
                    <span className="text-sm font-medium text-foreground">Click to view full size</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                <span className="text-7xl">
                  {listing.commodity === 'Maize' ? '🌽' : listing.commodity === 'Rice' ? '🌾' : listing.commodity === 'Cassava' ? '🥔' : listing.commodity === 'Yam' ? '🍠' : '🌾'}
                </span>
              </div>
            )}
          </div>
          
          {/* Thumbnail Gallery */}
          {listing.photos && listing.photos.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {listing.photos.map((photo, index) => (
                <div
                  key={index}
                  className={`w-20 h-20 rounded-xl bg-muted flex-shrink-0 overflow-hidden border-2 transition-all cursor-pointer ${
                    selectedImageIndex === index 
                      ? 'border-primary scale-105' 
                      : 'border-transparent hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedImageIndex(index)}
                >
                  <img 
                    src={photo} 
                    alt={`${listing.commodity} ${index + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Image Lightbox Modal */}
        {showImageModal && listing.photos && listing.photos.length > 0 && (
          <div 
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
            onClick={() => setShowImageModal(false)}
          >
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-background/20 backdrop-blur-sm flex items-center justify-center text-foreground hover:bg-background/40 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="relative max-w-4xl w-full max-h-[90vh] flex items-center justify-center">
              <img 
                src={listing.photos[selectedImageIndex]} 
                alt={listing.commodity}
                className="max-w-full max-h-[90vh] object-contain rounded-xl"
                onClick={(e) => e.stopPropagation()}
              />
              
              {listing.photos.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedImageIndex((prev) => (prev > 0 ? prev - 1 : listing.photos.length - 1));
                    }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-background/20 backdrop-blur-sm flex items-center justify-center text-foreground hover:bg-background/40 transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedImageIndex((prev) => (prev < listing.photos.length - 1 ? prev + 1 : 0));
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-background/20 backdrop-blur-sm flex items-center justify-center text-foreground hover:bg-background/40 transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5 rotate-180" />
                  </button>
                  
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-background/20 backdrop-blur-sm rounded-xl text-sm text-foreground">
                    {selectedImageIndex + 1} / {listing.photos.length}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Details */}
        <div className="farm-card">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground">{listing.commodity}</h1>
              <p className="text-muted-foreground">{listing.quantityKg}kg available</p>
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

        {/* Order Button */}
        <button
          onClick={() => setShowCheckout(true)}
          className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-medium btn-glow flex items-center justify-center gap-2"
        >
          <ShoppingCart className="w-5 h-5" />
          Place Order
        </button>

        {/* Checkout Modal */}
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
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Enter quantity"
                max={listing.quantityKg}
                className="w-full px-4 py-3 bg-muted border border-border rounded-xl text-foreground"
              />
              <p className="text-xs text-muted-foreground mt-1">Max: {listing.quantityKg}kg</p>
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
              onClick={handleOrder}
              disabled={!quantity || parseInt(quantity) <= 0}
              className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-medium disabled:opacity-50"
            >
              Confirm Order
            </button>
          </div>
        </Modal>
      </div>
    </BuyerLayout>
  );
};

export default BuyerListingDetail;
