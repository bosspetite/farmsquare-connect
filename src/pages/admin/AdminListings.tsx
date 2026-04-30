import React, { useEffect, useMemo, useState } from 'react';
import { Package, Search, CheckCircle, XCircle, Pause, Eye, User, MapPin } from 'lucide-react';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { formatNaira, formatDate } from '@/lib/store';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/Modal';
import { StatusPill } from '@/components/ui/StatusPill';
import { getProduceImage } from '@/utils/produceImages';
import { useNavigate } from 'react-router-dom';
import { Listing } from '@/types';
import { getAllListings } from '@/services/adminService';

const AdminListings = () => {
  const navigate = useNavigate();
  const [allListings, setAllListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filterStatus, setFilterStatus] = React.useState<'all' | 'Active' | 'Paused' | 'Sold' | 'Draft' | 'SoldOut' | 'Archived'>('all');
  const [selectedListing, setSelectedListing] = useState<any>(null);

  useEffect(() => {
    void (async () => {
      try {
        setLoading(true);
        setErrorMessage(null);
        const listings = await getAllListings();
        setAllListings(listings);
      } catch (error) {
        console.error('[AdminListings] Failed to load listings', error);
        setErrorMessage(error instanceof Error ? error.message : 'Failed to load listings.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const listings = useMemo(() => allListings.filter(listing => {
    const matchesSearch = 
      listing.commodity.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.farmerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.region.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = filterStatus === 'all' || listing.status === filterStatus;

    return matchesSearch && matchesStatus;
  }), [allListings, filterStatus, searchQuery]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return <span className="px-2 py-1 bg-farm-success/10 text-farm-success rounded text-xs font-medium flex items-center gap-1">
          <CheckCircle className="w-3 h-3" /> Active
        </span>;
      case 'Paused':
        return <span className="px-2 py-1 bg-farm-warning/10 text-farm-warning rounded text-xs font-medium flex items-center gap-1">
          <Pause className="w-3 h-3" /> Paused
        </span>;
      case 'Draft':
        return <span className="px-2 py-1 bg-muted text-muted-foreground rounded text-xs font-medium">Draft</span>;
      case 'SoldOut':
        return <span className="px-2 py-1 bg-farm-warning/10 text-farm-warning rounded text-xs font-medium">Sold Out</span>;
      case 'Sold':
        return <span className="px-2 py-1 bg-muted text-muted-foreground rounded text-xs font-medium flex items-center gap-1">
          <XCircle className="w-3 h-3" /> Sold
        </span>;
      case 'Archived':
        return <span className="px-2 py-1 bg-muted/50 text-muted-foreground rounded text-xs font-medium">Archived</span>;
      default:
        return <span className="px-2 py-1 bg-muted text-muted-foreground rounded text-xs font-medium">{status}</span>;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-foreground mb-2">Listings Management</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Monitor and manage all produce listings</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by commodity, farmer, or region..."
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
            <option value="SoldOut">Sold Out</option>
            <option value="Sold">Sold</option>
            <option value="Archived">Archived</option>
          </select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="farm-card text-center">
            <p className="text-xl sm:text-2xl font-semibold text-foreground">{allListings.length}</p>
            <p className="text-xs sm:text-sm text-muted-foreground">Total Listings</p>
          </div>
          <div className="farm-card text-center">
            <p className="text-xl sm:text-2xl font-semibold text-farm-success">{allListings.filter(l => l.status === 'Active').length}</p>
            <p className="text-xs sm:text-sm text-muted-foreground">Active</p>
          </div>
          <div className="farm-card text-center">
            <p className="text-xl sm:text-2xl font-semibold text-farm-warning">{allListings.filter(l => l.status === 'Paused').length}</p>
            <p className="text-xs sm:text-sm text-muted-foreground">Paused</p>
          </div>
          <div className="farm-card text-center">
            <p className="text-xl sm:text-2xl font-semibold text-muted-foreground">{allListings.filter(l => l.status === 'Sold').length}</p>
            <p className="text-xs sm:text-sm text-muted-foreground">Sold</p>
          </div>
        </div>

        {/* Listings List */}
        <div className="farm-card">
          <h3 className="font-semibold text-foreground mb-4">All Listings</h3>
          {loading ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
              <p className="text-muted-foreground">Loading listings from Supabase...</p>
            </div>
          ) : errorMessage ? (
            <div className="text-center py-12">
              <XCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
              <p className="text-foreground font-medium mb-2">Could not load listings</p>
              <p className="text-sm text-muted-foreground">{errorMessage}</p>
            </div>
          ) : listings.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No listings found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {listings.map((listing) => (
                <div
                  key={listing.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 p-3 sm:p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0 w-full sm:w-auto">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                      <img 
                        src={listing.photos && listing.photos.length > 0 ? listing.photos[0] : getProduceImage(listing.commodity)} 
                        alt={listing.commodity} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = getProduceImage(listing.commodity);
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <p className="font-medium text-foreground text-sm sm:text-base">{listing.commodity}</p>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          listing.grade === 'A' ? 'bg-farm-success/10 text-farm-success' :
                          listing.grade === 'B' ? 'bg-farm-warning/10 text-farm-warning' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          Grade {listing.grade}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {listing.quantityKg}kg • {formatNaira(listing.pricePerKg)}/kg
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {listing.farmerName} • {listing.region} • {formatDate(listing.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-between sm:justify-start">
                    <div className="flex-shrink-0">{getStatusBadge(listing.status)}</div>
                    <span className="text-xs sm:text-sm font-semibold text-foreground">
                      {formatNaira(listing.pricePerKg * listing.quantityKg)}
                    </span>
                    <button
                      onClick={() => setSelectedListing(listing)}
                      className="p-2 hover:bg-muted rounded-lg transition-colors flex-shrink-0"
                      title="View Details"
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
            title="Listing Details"
          >
            <div className="space-y-4">
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center overflow-hidden">
                    <img 
                      src={selectedListing.photos && selectedListing.photos.length > 0 ? selectedListing.photos[0] : getProduceImage(selectedListing.commodity)} 
                      alt={selectedListing.commodity}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = getProduceImage(selectedListing.commodity);
                      }}
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-lg">{selectedListing.commodity}</h3>
                    <p className="text-sm text-muted-foreground">Grade {selectedListing.grade}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Quantity</span>
                    <span className="text-sm font-medium text-foreground">{selectedListing.quantityKg}kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Price per kg</span>
                    <span className="text-sm font-medium text-foreground">{formatNaira(selectedListing.pricePerKg)}/kg</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-border">
                    <span className="text-sm font-semibold text-foreground">Total Value</span>
                    <span className="text-lg font-bold text-primary">{formatNaira(selectedListing.pricePerKg * selectedListing.quantityKg)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                  <User className="w-5 h-5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Farmer</p>
                    <p className="text-sm font-medium text-foreground">{selectedListing.farmerName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                  <MapPin className="w-5 h-5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Location</p>
                    <p className="text-sm font-medium text-foreground">{selectedListing.locationLabel}, {selectedListing.region}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                  <StatusPill status={selectedListing.status} />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Status</p>
                    <p className="text-sm font-medium text-foreground capitalize">{selectedListing.status}</p>
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


