import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, User, Package, ShoppingCart } from 'lucide-react';
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
          <div className="w-full h-80 rounded-2xl bg-muted flex items-center justify-center overflow-hidden relative group">
            {listing.photos && listing.photos.length > 0 && listing.photos[0] ? (
              <img 
                src={listing.photos[0]} 
                alt={listing.commodity} 
                className="w-full h-full object-cover"
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
              {listing.photos.slice(1).map((photo, index) => (
                <div key={index} className="w-20 h-20 rounded-xl bg-muted flex-shrink-0 overflow-hidden">
                  <img 
                    src={photo} 
                    alt={`${listing.commodity} ${index + 2}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

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
