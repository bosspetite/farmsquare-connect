import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Filter } from 'lucide-react';
import { FarmerLayout } from '@/components/layouts/FarmerLayout';
import { StatusPill } from '@/components/ui/StatusPill';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/contexts/AuthContext';
import { getListingsByFarmerId, updateListing, deleteListing, formatNaira, getAppState } from '@/lib/store';
import { Listing, ListingStatus } from '@/types';
import { toast } from '@/hooks/use-toast';
import { Package } from 'lucide-react';

const filters: ListingStatus[] = ['Active', 'Paused', 'Sold'];

const FarmerListings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState<ListingStatus | 'All'>('All');
  const [editingListing, setEditingListing] = useState<Listing | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [editQuantity, setEditQuantity] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<Listing | null>(null);

  const allListings = user ? getListingsByFarmerId(user.id) : [];
  const listings = activeFilter === 'All' 
    ? allListings 
    : allListings.filter(l => l.status === activeFilter);

  const handlePauseResume = (listing: Listing) => {
    const newStatus = listing.status === 'Active' ? 'Paused' : 'Active';
    updateListing(listing.id, { status: newStatus });
    toast({ title: `Listing ${newStatus === 'Active' ? 'resumed' : 'paused'}` });
    window.location.reload();
  };

  const handleEdit = (listing: Listing) => {
    setEditingListing(listing);
    setEditPrice(listing.pricePerKg.toString());
    setEditQuantity(listing.quantityKg.toString());
  };

  const handleSaveEdit = () => {
    if (editingListing) {
      if (parseInt(editPrice) <= 0 || parseInt(editQuantity) <= 0) {
        toast({ 
          title: 'Invalid values', 
          description: 'Price and quantity must be greater than 0',
          variant: 'destructive'
        });
        return;
      }
      
      // Check if listing has active orders (can't reduce quantity below ordered amount)
      const state = getAppState();
      const activeOrders = state.orders.filter(
        o => o.listingId === editingListing.id && 
        o.status !== 'Rejected' && 
        o.status !== 'Delivered'
      );
      
      if (activeOrders.length > 0) {
        const totalOrdered = activeOrders.reduce((sum, o) => sum + o.quantityKg, 0);
        const newQuantity = parseInt(editQuantity);
        
        if (newQuantity < totalOrdered) {
          toast({ 
            title: 'Cannot reduce quantity', 
            description: `You have ${totalOrdered}kg in active orders. Quantity must be at least ${totalOrdered}kg.`,
            variant: 'destructive'
          });
          return;
        }
      }
      
      updateListing(editingListing.id, {
        pricePerKg: parseInt(editPrice),
        quantityKg: parseInt(editQuantity),
      });
      setEditingListing(null);
      toast({ title: 'Listing updated' });
      window.location.reload();
    }
  };
  
  const handleDelete = () => {
    if (deleteConfirm) {
      deleteListing(deleteConfirm.id);
      setDeleteConfirm(null);
      toast({ title: 'Listing deleted' });
      window.location.reload();
    }
  };

  return (
    <FarmerLayout>
      <div className="space-y-6 animate-fade-up">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-display font-bold text-foreground">My Listings</h1>
          <button
            onClick={() => navigate('/farmer/create-listing')}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium"
          >
            <Plus className="w-4 h-4" /> Add New
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveFilter('All')}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              activeFilter === 'All' ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground'
            }`}
          >
            All ({allListings.length})
          </button>
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                activeFilter === filter ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground'
              }`}
            >
              {filter} ({allListings.filter(l => l.status === filter).length})
            </button>
          ))}
        </div>

        {/* Listings */}
        {listings.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No listings yet"
            description="Start selling by creating your first listing"
            action={{ label: 'Create Listing', onClick: () => navigate('/farmer/create-listing') }}
          />
        ) : (
          <div className="space-y-3">
            {listings.map((listing) => (
              <div key={listing.id} className="farm-card">
                <div className="flex gap-4">
                  <div className="w-20 h-20 rounded-xl bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden relative">
                    {listing.photos && listing.photos.length > 0 && listing.photos[0] ? (
                      <img 
                        src={listing.photos[0]} 
                        alt={listing.commodity} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback if image fails to load
                          e.currentTarget.style.display = 'none';
                          const parent = e.currentTarget.parentElement;
                          if (parent && !parent.querySelector('.fallback-icon')) {
                            const fallback = document.createElement('div');
                            fallback.className = 'fallback-icon w-full h-full flex items-center justify-center';
                            fallback.innerHTML = '<svg class="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>';
                            parent.appendChild(fallback);
                          }
                        }}
                      />
                    ) : (
                      <Package className="w-8 h-8 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-foreground">{listing.commodity}</h3>
                        <p className="text-sm text-muted-foreground">Grade {listing.grade} · {listing.quantityKg}kg</p>
                      </div>
                      <StatusPill status={listing.status} />
                    </div>
                    <p className="text-lg font-bold text-primary">{formatNaira(listing.pricePerKg)}/kg</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-border">
                  <button
                    onClick={() => handleEdit(listing)}
                    className="py-2 bg-muted text-foreground rounded-xl text-sm font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handlePauseResume(listing)}
                    className={`py-2 rounded-xl text-sm font-medium ${
                      listing.status === 'Active' 
                        ? 'bg-farm-warning/10 text-farm-warning' 
                        : 'bg-primary/10 text-primary'
                    }`}
                  >
                    {listing.status === 'Active' ? 'Pause' : 'Resume'}
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(listing)}
                    className="py-2 bg-destructive/10 text-destructive rounded-xl text-sm font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Edit Modal */}
        <Modal isOpen={!!editingListing} onClose={() => setEditingListing(null)} title="Edit Listing">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Price per kg (₦)</label>
              <input
                type="number"
                value={editPrice}
                onChange={(e) => setEditPrice(e.target.value)}
                className="w-full px-4 py-3 bg-muted border border-border rounded-xl text-foreground"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Quantity (kg)</label>
              <input
                type="number"
                value={editQuantity}
                onChange={(e) => setEditQuantity(e.target.value)}
                className="w-full px-4 py-3 bg-muted border border-border rounded-xl text-foreground"
              />
            </div>
            <button
              onClick={handleSaveEdit}
              className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-medium"
            >
              Save Changes
            </button>
          </div>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Listing?">
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Are you sure you want to delete this listing? This action cannot be undone.
            </p>
            {deleteConfirm && (
              <div className="p-3 bg-muted/50 rounded-xl">
                <p className="font-medium text-foreground">{deleteConfirm.commodity}</p>
                <p className="text-sm text-muted-foreground">{deleteConfirm.quantityKg}kg · {formatNaira(deleteConfirm.pricePerKg)}/kg</p>
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-3 bg-muted text-foreground rounded-xl font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-3 bg-destructive text-destructive-foreground rounded-xl font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </FarmerLayout>
  );
};

export default FarmerListings;
