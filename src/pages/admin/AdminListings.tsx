import React from 'react';
import { Package, Search, CheckCircle, XCircle, Pause, Eye } from 'lucide-react';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { getAppState, formatNaira, formatDate } from '@/lib/store';
import { Input } from '@/components/ui/input';
import { getProduceImage } from '@/utils/produceImages';
import { useNavigate } from 'react-router-dom';

const AdminListings = () => {
  const navigate = useNavigate();
  const state = getAppState();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filterStatus, setFilterStatus] = React.useState<'all' | 'Active' | 'Paused' | 'Sold' | 'Draft' | 'SoldOut' | 'Archived'>('all');
  
  const listings = state.listings.filter(listing => {
    const matchesSearch = 
      listing.commodity.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.farmerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.region.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || listing.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

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
          <h1 className="text-2xl font-semibold text-foreground mb-2">Listings Management</h1>
          <p className="text-muted-foreground">Monitor and manage all produce listings</p>
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="farm-card text-center">
            <p className="text-2xl font-semibold text-foreground">{state.listings.length}</p>
            <p className="text-sm text-muted-foreground">Total Listings</p>
          </div>
          <div className="farm-card text-center">
            <p className="text-2xl font-semibold text-farm-success">{state.listings.filter(l => l.status === 'Active').length}</p>
            <p className="text-sm text-muted-foreground">Active</p>
          </div>
          <div className="farm-card text-center">
            <p className="text-2xl font-semibold text-farm-warning">{state.listings.filter(l => l.status === 'Paused').length}</p>
            <p className="text-sm text-muted-foreground">Paused</p>
          </div>
          <div className="farm-card text-center">
            <p className="text-2xl font-semibold text-muted-foreground">{state.listings.filter(l => l.status === 'Sold').length}</p>
            <p className="text-sm text-muted-foreground">Sold</p>
          </div>
        </div>

        {/* Listings List */}
        <div className="farm-card">
          <h3 className="font-semibold text-foreground mb-4">All Listings</h3>
          {listings.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No listings found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {listings.map((listing) => (
                <div
                  key={listing.id}
                  className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                      <img 
                        src={listing.photos && listing.photos.length > 0 ? listing.photos[0] : getProduceImage(listing.commodity)} 
                        alt={listing.commodity} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = getProduceImage(listing.commodity);
                        }}
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-foreground">{listing.commodity}</p>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          listing.grade === 'A' ? 'bg-farm-success/10 text-farm-success' :
                          listing.grade === 'B' ? 'bg-farm-warning/10 text-farm-warning' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          Grade {listing.grade}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {listing.quantityKg}kg • {formatNaira(listing.pricePerKg)}/kg
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {listing.farmerName} • {listing.region} • {formatDate(listing.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(listing.status)}
                    <span className="text-sm font-semibold text-foreground">
                      {formatNaira(listing.pricePerKg * listing.quantityKg)}
                    </span>
                    <button
                      onClick={() => {
                        // Navigate to view listing details (could create an admin listing detail page)
                        // For now, just show alert with details
                        alert(`Listing Details:\n\nCommodity: ${listing.commodity}\nFarmer: ${listing.farmerName}\nQuantity: ${listing.quantityKg}kg\nPrice: ${formatNaira(listing.pricePerKg)}/kg\nStatus: ${listing.status}\nLocation: ${listing.locationLabel}`);
                      }}
                      className="p-2 hover:bg-muted rounded-lg transition-colors"
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
      </div>
    </AdminLayout>
  );
};

export default AdminListings;



