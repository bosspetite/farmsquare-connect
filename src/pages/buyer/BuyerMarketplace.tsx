import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowUpDown, MapPin, Search, Shield, SlidersHorizontal, X } from 'lucide-react';
import { BuyerLayout } from '@/components/layouts/BuyerLayout';
import { formatNaira } from '@/lib/store';
import { GradeType, Listing } from '@/types';
import { getProduceImage } from '@/utils/produceImages';
import { useAuth } from '@/hooks/useAuth';
import { getMarketplaceListings } from '@/services/listingService';
import { MARKETPLACE_VISIBLE_LISTING_STATUS } from '@/constants/listingStatus';

const commodityFilters = ['All', 'Maize', 'Cassava', 'Rice', 'Yam', 'Sorghum'];
const gradeFilters: (GradeType | 'All')[] = ['All', 'A', 'B', 'C'];
const regions = ['All', 'Kaduna', 'Lagos', 'Kano', 'Abuja', 'Rivers', 'Ogun', 'Ekiti', 'Kogi', 'Kwara', 'Osun'];
const sortOptions = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'quantity', label: 'Quantity Available' },
];

type SortOption = 'newest' | 'price-low' | 'price-high' | 'quantity';

const BuyerMarketplace = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isVerified = user?.kycStatus === 'APPROVED';

  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoadingListings, setIsLoadingListings] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [commodityFilter, setCommodityFilter] = useState('All');
  const [gradeFilter, setGradeFilter] = useState<GradeType | 'All'>('All');
  const [regionFilter, setRegionFilter] = useState('All');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [showFilters, setShowFilters] = useState(false);

  const loadListings = async () => {
    try {
      setIsLoadingListings(true);
      setLoadError(null);
      console.log('Buyer marketplace current user:', user);
      const marketplaceListings = await getMarketplaceListings();
      console.log('Marketplace listings result:', marketplaceListings);
      setListings(marketplaceListings);
    } catch (error: any) {
      console.error('Marketplace query error:', error);
      setLoadError(error?.message || 'Unable to load marketplace listings right now.');
    } finally {
      setIsLoadingListings(false);
    }
  };

  useEffect(() => {
    loadListings();
  }, []);

  const filteredListings = useMemo(() => {
    console.log('Marketplace filters:', {
      search,
      commodityFilter,
      gradeFilter,
      regionFilter,
      priceMin,
      priceMax,
      sortBy,
      totalListingsBeforeFilter: listings.length,
    });

    let results = listings.filter((listing) => {
      if (listing.status !== MARKETPLACE_VISIBLE_LISTING_STATUS) {
        return false;
      }

      if (search) {
        const searchLower = search.toLowerCase().trim();
        if (searchLower.length > 0) {
          const matchesCommodity = listing.commodity.toLowerCase().includes(searchLower);
          const matchesFarmer = listing.farmerName.toLowerCase().includes(searchLower);
          const matchesRegion = listing.region.toLowerCase().includes(searchLower);
          const matchesLocation = listing.locationLabel.toLowerCase().includes(searchLower);
          const matchesGrade = `grade ${listing.grade}`.toLowerCase().includes(searchLower);
          const matchesPrice = formatNaira(listing.pricePerKg).toLowerCase().includes(searchLower);
          const matchesQuantity = listing.quantityKg.toString().includes(searchLower);

          if (!(matchesCommodity || matchesFarmer || matchesRegion || matchesLocation || matchesGrade || matchesPrice || matchesQuantity)) {
            return false;
          }
        }
      }

      if (commodityFilter !== 'All' && listing.commodity !== commodityFilter) return false;
      if (gradeFilter !== 'All' && listing.grade !== gradeFilter) return false;
      if (regionFilter !== 'All' && listing.region !== regionFilter) return false;
      if (priceMin && listing.pricePerKg < parseInt(priceMin, 10)) return false;
      if (priceMax && listing.pricePerKg > parseInt(priceMax, 10)) return false;

      return true;
    });

    results.sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.pricePerKg - b.pricePerKg;
        case 'price-high':
          return b.pricePerKg - a.pricePerKg;
        case 'quantity':
          return b.quantityKg - a.quantityKg;
        case 'newest':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return results;
  }, [listings, search, commodityFilter, gradeFilter, regionFilter, priceMin, priceMax, sortBy]);

  const hasActiveFilters = commodityFilter !== 'All' || gradeFilter !== 'All' || regionFilter !== 'All' || priceMin || priceMax || search;

  const clearFilters = () => {
    setSearch('');
    setCommodityFilter('All');
    setGradeFilter('All');
    setRegionFilter('All');
    setPriceMin('');
    setPriceMax('');
  };

  return (
    <BuyerLayout>
      <div className="space-y-6 animate-fade-up">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-display font-bold text-foreground">Marketplace</h1>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all min-h-[44px] active:scale-[0.98] ${
              showFilters || hasActiveFilters
                ? 'bg-primary text-primary-foreground'
                : 'bg-card border border-border text-muted-foreground'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
            {hasActiveFilters && <span className="w-2 h-2 bg-primary-foreground rounded-full" />}
          </button>
        </div>

        {!isVerified && (
          <div className="farm-card bg-farm-warning/10 border-farm-warning/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-farm-warning/20 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-farm-warning" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Verification Required to Place Orders</p>
                  <p className="text-sm text-muted-foreground">
                    Complete your KYC/KYB verification to place orders and access all features
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate('/buyer/kyc')}
                className="px-5 py-2.5 bg-farm-warning text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity flex items-center gap-2 min-h-[44px] active:scale-[0.98] flex-shrink-0"
              >
                <Shield className="w-4 h-4" />
                Verify Now
              </button>
            </div>
          </div>
        )}

        {loadError && (
          <div className="farm-card bg-destructive/5 border-destructive/20">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                <div>
                  <p className="font-semibold text-foreground">Marketplace unavailable</p>
                  <p className="text-sm text-muted-foreground">{loadError}</p>
                </div>
              </div>
              <button
                onClick={loadListings}
                className="px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold min-h-[44px] active:scale-[0.98]"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search produce, farmer, region..."
            className="w-full pl-12 pr-12 py-4 bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-base transition-all min-h-[52px]"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Clear search"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {search && (
          <div className="text-sm text-muted-foreground">
            Found <span className="font-semibold text-foreground">{filteredListings.length}</span> listing{filteredListings.length !== 1 ? 's' : ''} matching "{search}"
          </div>
        )}

        <div className="space-y-3">
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
            {commodityFilters.map((filter) => (
              <button
                key={filter}
                onClick={() => setCommodityFilter(filter)}
                className={`px-4 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all flex-shrink-0 min-h-[44px] active:scale-[0.98] ${
                  commodityFilter === filter ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground hover:border-primary/50'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
            {gradeFilters.map((grade) => (
              <button
                key={grade}
                onClick={() => setGradeFilter(grade)}
                className={`px-4 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all flex-shrink-0 min-h-[44px] active:scale-[0.98] ${
                  gradeFilter === grade ? 'bg-farm-brown text-foreground' : 'bg-card border border-border text-muted-foreground hover:border-primary/50'
                }`}
              >
                {grade === 'All' ? 'All Grades' : `Grade ${grade}`}
              </button>
            ))}
          </div>
        </div>

        {showFilters && (
          <div className="farm-card space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Advanced Filters</h3>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="text-sm text-primary hover:underline">
                  Clear All
                </button>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Region</label>
              <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
                {regions.map((region) => (
                  <button
                    key={region}
                    onClick={() => setRegionFilter(region)}
                    className={`px-4 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all flex-shrink-0 min-h-[44px] active:scale-[0.98] ${
                      regionFilter === region ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {region}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Min Price (₦/kg)</label>
                <input
                  type="number"
                  value={priceMin}
                  onChange={(event) => setPriceMin(event.target.value)}
                  placeholder="Min"
                  className="w-full px-4 py-4 bg-muted border border-border rounded-xl text-foreground min-h-[52px] focus:outline-none focus:ring-2 focus:ring-primary text-base"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Max Price (₦/kg)</label>
                <input
                  type="number"
                  value={priceMax}
                  onChange={(event) => setPriceMax(event.target.value)}
                  placeholder="Max"
                  className="w-full px-4 py-4 bg-muted border border-border rounded-xl text-foreground min-h-[52px] focus:outline-none focus:ring-2 focus:ring-primary text-base"
                />
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground text-lg">{filteredListings.length}</span> listing{filteredListings.length !== 1 ? 's' : ''} found
            </p>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="text-xs text-primary hover:underline mt-1">
                Clear all filters
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <ArrowUpDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as SortOption)}
              className="flex-1 sm:flex-none px-3 py-3 bg-card border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {isLoadingListings ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="farm-card">
                <div className="w-full h-48 rounded-xl bg-muted animate-pulse mb-4" />
                <div className="space-y-3">
                  <div className="h-5 bg-muted rounded animate-pulse" />
                  <div className="h-4 bg-muted rounded animate-pulse w-2/3" />
                  <div className="h-12 bg-muted rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredListings.map((listing) => (
              <div
                key={listing.id}
                onClick={() => navigate(`/buyer/listings/${listing.id}`)}
                className="farm-card-interactive cursor-pointer"
              >
                <div className="relative group">
                  <div className="w-full h-48 rounded-xl bg-muted mb-4 flex items-center justify-center overflow-hidden relative">
                    <img
                      src={listing.photos && listing.photos.length > 0 ? listing.photos[0] : getProduceImage(listing.commodity)}
                      alt={listing.commodity}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      onError={(event) => {
                        event.currentTarget.src = getProduceImage(listing.commodity);
                      }}
                    />
                    {listing.photos && listing.photos.length > 1 && (
                      <div className="absolute top-2 right-2 px-2 py-1 bg-background/80 backdrop-blur-sm rounded-lg text-xs font-medium text-foreground">
                        +{listing.photos.length - 1}
                      </div>
                    )}
                    <div className="absolute top-2 left-2">
                      <span className={`px-3 py-1 rounded-lg text-xs font-bold ${
                        listing.grade === 'A' ? 'bg-farm-success/90 text-white' :
                        listing.grade === 'B' ? 'bg-farm-warning/90 text-white' :
                        'bg-farm-brown/90 text-white'
                      }`}>
                        Grade {listing.grade}
                      </span>
                    </div>
                    <div className="absolute inset-0 bg-black/5 group-hover:bg-black/10 transition-colors duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <span className="text-sm font-medium text-primary-foreground bg-primary px-4 py-2 rounded-xl">
                        View Details
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display font-bold text-lg text-foreground mb-1 truncate">{listing.commodity}</h3>
                      <p className="text-sm text-muted-foreground">{listing.quantityKg.toLocaleString()}kg listed by seller</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{listing.region}</span>
                    {listing.locationLabel && listing.locationLabel !== `${listing.region} Farm` && (
                      <span className="text-xs">• {listing.locationLabel}</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <div className="flex-1 min-w-0">
                      <p className="text-xl font-bold text-primary">{formatNaira(listing.pricePerKg)}/kg</p>
                      <p className="text-xs text-muted-foreground">Total: {formatNaira(listing.quantityKg * listing.pricePerKg)}</p>
                    </div>
                    <div className="text-right ml-3 flex-shrink-0">
                      <p className="text-xs text-muted-foreground">Farmer</p>
                      <p className="text-sm font-medium text-foreground truncate max-w-[100px]">{listing.farmerName}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoadingListings && filteredListings.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">No listings found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {hasActiveFilters
                ? 'Try adjusting your filters or search terms'
                : 'No active listings available at the moment'}
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>
    </BuyerLayout>
  );
};

export default BuyerMarketplace;
