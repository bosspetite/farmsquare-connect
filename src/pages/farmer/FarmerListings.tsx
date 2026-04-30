import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Plus } from 'lucide-react';
import { FarmerLayout } from '@/components/layouts/FarmerLayout';
import { StatusPill } from '@/components/ui/StatusPill';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/hooks/useAuth';
import { formatNaira } from '@/lib/store';
import { Listing, ListingStatus, Order } from '@/types';
import { toast } from '@/hooks/use-toast';
import { Package } from 'lucide-react';
import { getProduceImage } from '@/utils/produceImages';
import { deleteListing, getFarmerListings, updateListing } from '@/services/listingService';
import { getFarmerOrders } from '@/services/orderService';

const filters: ListingStatus[] = ['Draft', 'Active', 'Paused', 'SoldOut', 'Sold', 'Archived'];

const FarmerListings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState<ListingStatus | 'All'>('All');
  const [editingListing, setEditingListing] = useState<Listing | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [editQuantity, setEditQuantity] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<Listing | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isMutating, setIsMutating] = useState(false);

  const loadListingsAndOrders = async () => {
    if (!user) {
      return;
    }

    try {
      setIsLoading(true);
      setLoadError(null);
      const [listingRows, orderRows] = await Promise.all([
        getFarmerListings(user.id, user.name),
        getFarmerOrders(user.id),
      ]);
      setListings(listingRows);
      setOrders(orderRows);
    } catch (error: any) {
      setLoadError(error?.message || 'Unable to load your listings right now.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadListingsAndOrders();
  }, [user?.id]);

  const allListings = listings;
  const filteredListings = useMemo(
    () => (activeFilter === 'All' ? allListings : allListings.filter((listing) => listing.status === activeFilter)),
    [activeFilter, allListings]
  );

  const runListingUpdate = async (listingId: string, updates: Partial<Pick<Listing, 'pricePerKg' | 'quantityKg' | 'status'>>) => {
    try {
      setIsMutating(true);
      await updateListing(listingId, updates);
      await loadListingsAndOrders();
    } finally {
      setIsMutating(false);
    }
  };

  const handlePauseResume = async (listing: Listing) => {
    try {
      if (listing.status === 'Active') {
        await runListingUpdate(listing.id, { status: 'Paused' });
        toast({ title: 'Listing paused' });
      } else if (listing.status === 'Paused' || listing.status === 'Draft' || listing.status === 'Archived') {
        await runListingUpdate(listing.id, { status: 'Active' });
        toast({ title: listing.status === 'Draft' ? 'Listing published' : 'Listing resumed' });
      }
    } catch (error: any) {
      toast({
        title: 'Unable to update listing',
        description: error?.message || 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleArchive = async (listing: Listing) => {
    try {
      await runListingUpdate(listing.id, { status: 'Archived' });
      toast({ title: 'Listing archived' });
    } catch (error: any) {
      toast({
        title: 'Unable to archive listing',
        description: error?.message || 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleMarkSoldOut = async (listing: Listing) => {
    try {
      await runListingUpdate(listing.id, { status: 'SoldOut' });
      toast({ title: 'Listing marked as sold out' });
    } catch (error: any) {
      toast({
        title: 'Unable to update listing',
        description: error?.message || 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (listing: Listing) => {
    setEditingListing(listing);
    setEditPrice(listing.pricePerKg.toString());
    setEditQuantity(listing.quantityKg.toString());
  };

  const handleSaveEdit = async () => {
    if (!editingListing) {
      return;
    }

    if (parseInt(editPrice, 10) <= 0 || parseInt(editQuantity, 10) <= 0) {
      toast({
        title: 'Invalid values',
        description: 'Price and quantity must be greater than 0',
        variant: 'destructive',
      });
      return;
    }

    const activeOrders = orders.filter(
      (order) =>
        order.listingId === editingListing.id &&
        !['Rejected', 'Delivered', 'Cancelled', 'Refunded'].includes(order.status)
    );

    if (activeOrders.length > 0) {
      const totalOrdered = activeOrders.reduce((sum, order) => sum + order.quantityKg, 0);
      const newQuantity = parseInt(editQuantity, 10);

      if (newQuantity < totalOrdered) {
        toast({
          title: 'Cannot reduce quantity',
          description: `You have ${totalOrdered}kg in active orders. Quantity must be at least ${totalOrdered}kg.`,
          variant: 'destructive',
        });
        return;
      }
    }

    try {
      await runListingUpdate(editingListing.id, {
        pricePerKg: parseInt(editPrice, 10),
        quantityKg: parseInt(editQuantity, 10),
      });
      setEditingListing(null);
      toast({ title: 'Listing updated' });
    } catch (error: any) {
      toast({
        title: 'Unable to update listing',
        description: error?.message || 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) {
      return;
    }

    try {
      setIsMutating(true);
      await deleteListing(deleteConfirm.id);
      setDeleteConfirm(null);
      await loadListingsAndOrders();
      toast({ title: 'Listing deleted' });
    } catch (error: any) {
      toast({
        title: 'Unable to delete listing',
        description: error?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsMutating(false);
    }
  };

  return (
    <FarmerLayout>
      <div className="space-y-6 animate-fade-up">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-display font-bold text-foreground">My Listings</h1>
          <button
            onClick={() => navigate('/farmer/create-listing')}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold min-h-[44px] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" /> Add New
          </button>
        </div>

        {loadError && (
          <div className="farm-card bg-destructive/5 border-destructive/20">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                <div>
                  <p className="font-semibold text-foreground">Listings unavailable</p>
                  <p className="text-sm text-muted-foreground">{loadError}</p>
                </div>
              </div>
              <button
                onClick={loadListingsAndOrders}
                className="px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold min-h-[44px] active:scale-[0.98]"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
          <button
            onClick={() => setActiveFilter('All')}
            className={`px-4 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all flex-shrink-0 min-h-[44px] active:scale-[0.98] ${
              activeFilter === 'All' ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground'
            }`}
          >
            All ({allListings.length})
          </button>
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all flex-shrink-0 min-h-[44px] active:scale-[0.98] ${
                activeFilter === filter ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground'
              }`}
            >
              {filter} ({allListings.filter((listing) => listing.status === filter).length})
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
        ) : filteredListings.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No listings yet"
            description="Start selling by creating your first listing"
            action={{ label: 'Create Listing', onClick: () => navigate('/farmer/create-listing') }}
          />
        ) : (
          <div className="space-y-3">
            {filteredListings.map((listing) => (
              <div key={listing.id} className="farm-card">
                <div className="flex gap-4">
                  <div className="w-20 h-20 rounded-xl bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden relative">
                    <img
                      src={listing.photos && listing.photos.length > 0 ? listing.photos[0] : getProduceImage(listing.commodity)}
                      alt={listing.commodity}
                      className="w-full h-full object-cover"
                      onError={(event) => {
                        event.currentTarget.src = getProduceImage(listing.commodity);
                      }}
                    />
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
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border">
                  {listing.status !== 'Archived' && (
                    <button
                      onClick={() => handleEdit(listing)}
                      disabled={isMutating}
                      className="px-4 py-2.5 bg-muted text-foreground rounded-xl text-sm font-semibold hover:bg-muted/80 transition-colors min-h-[44px] active:scale-[0.98] disabled:opacity-50"
                    >
                      Edit
                    </button>
                  )}
                  {listing.status === 'Active' && (
                    <>
                      <button
                        onClick={() => handlePauseResume(listing)}
                        disabled={isMutating}
                        className="px-4 py-2.5 bg-farm-warning/10 text-farm-warning rounded-xl text-sm font-semibold hover:bg-farm-warning/20 transition-colors min-h-[44px] active:scale-[0.98] disabled:opacity-50"
                      >
                        Pause
                      </button>
                      <button
                        onClick={() => handleMarkSoldOut(listing)}
                        disabled={isMutating}
                        className="px-4 py-2.5 bg-farm-info/10 text-farm-info rounded-xl text-sm font-semibold hover:bg-farm-info/20 transition-colors min-h-[44px] active:scale-[0.98] disabled:opacity-50"
                      >
                        Mark Sold Out
                      </button>
                    </>
                  )}
                  {(listing.status === 'Paused' || listing.status === 'Draft') && (
                    <button
                      onClick={() => handlePauseResume(listing)}
                      disabled={isMutating}
                      className="px-4 py-2.5 bg-primary/10 text-primary rounded-xl text-sm font-semibold hover:bg-primary/20 transition-colors min-h-[44px] active:scale-[0.98] disabled:opacity-50"
                    >
                      {listing.status === 'Draft' ? 'Publish' : 'Resume'}
                    </button>
                  )}
                  {listing.status === 'Archived' && (
                    <button
                      onClick={() => handlePauseResume(listing)}
                      disabled={isMutating}
                      className="px-4 py-2.5 bg-primary/10 text-primary rounded-xl text-sm font-semibold hover:bg-primary/20 transition-colors min-h-[44px] active:scale-[0.98] disabled:opacity-50"
                    >
                      Restore
                    </button>
                  )}
                  {listing.status !== 'Archived' && listing.status !== 'SoldOut' && (
                    <button
                      onClick={() => handleArchive(listing)}
                      disabled={isMutating}
                      className="px-4 py-2.5 bg-muted text-foreground rounded-xl text-sm font-semibold hover:bg-muted/80 transition-colors min-h-[44px] active:scale-[0.98] disabled:opacity-50"
                    >
                      Archive
                    </button>
                  )}
                  <button
                    onClick={() => setDeleteConfirm(listing)}
                    disabled={isMutating}
                    className="px-4 py-2.5 bg-destructive/10 text-destructive rounded-xl text-sm font-semibold hover:bg-destructive/20 transition-colors min-h-[44px] active:scale-[0.98] disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <Modal isOpen={!!editingListing} onClose={() => setEditingListing(null)} title="Edit Listing">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Price per kg (₦)</label>
              <input
                type="number"
                value={editPrice}
                onChange={(event) => setEditPrice(event.target.value)}
                className="w-full px-4 py-4 bg-muted border border-border rounded-xl text-foreground min-h-[52px] focus:outline-none focus:ring-2 focus:ring-primary text-base"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Quantity (kg)</label>
              <input
                type="number"
                value={editQuantity}
                onChange={(event) => setEditQuantity(event.target.value)}
                className="w-full px-4 py-4 bg-muted border border-border rounded-xl text-foreground min-h-[52px] focus:outline-none focus:ring-2 focus:ring-primary text-base"
              />
            </div>
            <div className="pt-2">
              <button
                onClick={handleSaveEdit}
                disabled={isMutating}
                className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-semibold min-h-[52px] active:scale-[0.98] disabled:opacity-50"
              >
                {isMutating ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </Modal>

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
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-4 bg-muted text-foreground rounded-xl font-semibold min-h-[52px] active:scale-[0.98]"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isMutating}
                className="flex-1 py-4 bg-destructive text-destructive-foreground rounded-xl font-semibold min-h-[52px] active:scale-[0.98] disabled:opacity-50"
              >
                {isMutating ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </FarmerLayout>
  );
};

export default FarmerListings;
