import React, { useState, useEffect } from 'react';
import { Package, Search, Eye, Loader2 } from 'lucide-react';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { getActiveListings, updateListing, deleteListing, getProfile } from '@/services/databaseService';
import { formatNaira, formatDate } from '@/lib/store';
import { Input } from '@/components/ui/input';
import { StatusPill } from '@/components/ui/StatusPill';
import { Modal } from '@/components/ui/Modal';
import { getProduceImage } from '@/utils/produceImages';
import { toast } from '@/hooks/use-toast';

const AdminListings = () => {
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'Active' | 'Paused' | 'Sold' | 'Draft' | 'SoldOut' | 'Archived'>('all');
  const [selectedListing, setSelectedListing] = useState<any>(null);

  useEffect(() => {
    const loadListings = async () => {
      setLoading(true);
      try {
        // Get all listings (not just active)
        const active = await getActiveListings();
        setListings(active);
      } catch (err: any) {
        console.error('Error loading listings:', err);
        toast({ title: 'Failed to load listings', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    loadListings();
  }, []);

  const filteredListings = listings.filter(listing => {
    const matchesSearch = 
      listing.commodity?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.farmer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.region?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || listing.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-foreground mb-2">Listing Management</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">View and manage all product listings</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search listings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-4 py-2 bg-card border border-border rounded-lg text-foreground"
          >
            <option value="all">All Status</option>
            <option value="Active">Active</option>
            <option value="Paused">Paused</option>
            <option value="Draft">Draft</option>
          </select>
        </div>

        {/* Listings List */}
        <div className="farm-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">All Listings</h3>
            <p className="text-sm text-muted-foreground">{filteredListings.length} listing{filteredListings.length !== 1 ? 's' : ''}</p>
          </div>
          {filteredListings.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No listings found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredListings.map((listing) => (
                <div
                  key={listing.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 p-3 sm:p-4 bg-white dark:bg-card border border-border rounded-xl hover:border-primary/20 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => setSelectedListing(listing)}
                >
                  <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0 w-full sm:w-auto">
                    <img 
                      src={(listing.photos && listing.photos[0]) || getProduceImage(listing.commodity)} 
                      alt={listing.commodity} 
                      className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <p className="font-semibold text-foreground text-sm sm:text-base">{listing.commodity} - Grade {listing.grade}</p>
                        <StatusPill status={listing.status} />
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-1">
                        {listing.farmer_name} • {listing.region}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {listing.quantity_kg}kg • {formatNaira(listing.price_per_kg)}/kg
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 w-full sm:w-auto justify-between sm:justify-start">
                    <div className="text-right sm:text-left">
                      <p className="text-sm sm:text-base font-semibold text-primary">{formatNaira(listing.quantity_kg * listing.price_per_kg)}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(listing.created_at)}</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedListing(listing);
                      }}
                      className="p-2 hover:bg-muted rounded-lg transition-colors flex-shrink-0"
                    >
                      <Eye className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Listing Details Modal */}
        {selectedListing && (
          <Modal
            isOpen={!!selectedListing}
            onClose={() => setSelectedListing(null)}
            title={`${selectedListing.commodity} - Grade ${selectedListing.grade}`}
          >
            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-xl">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Farmer</p>
                    <p className="text-sm font-medium text-foreground">{selectedListing.farmer_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Status</p>
                    <StatusPill status={selectedListing.status} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Quantity</p>
                    <p className="text-sm font-medium text-foreground">{selectedListing.quantity_kg}kg</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Price per kg</p>
                    <p className="text-sm font-medium text-primary">{formatNaira(selectedListing.price_per_kg)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Total Value</p>
                    <p className="text-sm font-medium text-primary">{formatNaira(selectedListing.quantity_kg * selectedListing.price_per_kg)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Location</p>
                    <p className="text-sm font-medium text-foreground">{selectedListing.location_label}, {selectedListing.region}</p>
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t border-border">
                <button
                  onClick={() => setSelectedListing(null)}
                  className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity"
                >
                  Close
                </button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminListings;
